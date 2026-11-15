// The world section: which of the ten data layers are ready for a place, the first look at stored
// water for every country, and the geometry that turns the globe.
// The counts are checked against the real data files, so a change in them shows up here.
// Code written with AI assistance (Claude) for team RAACK.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REGIONS } from '../water/catalog';
import { waterTrend } from '../water/engine';
import type { WaterData } from '../water/types';
import { COVERAGE, LAYERS, LAYER_COUNT, casePlace, countryPlace, coverageAt, firstLook, layersFor, lookClass, readiness, searchCountries, tally } from './layers';
import type { WorldData } from './types';
import { FIT_DIST, NEAR_DIST, angleBetween, clampLat, distFor, parallelRuns, placeAt, screenOf, tripAt, tripSeconds, wrapLon, type GlobeView } from './view';

const read = <T>(file: string) => JSON.parse(readFileSync(new URL(`../../../public/data/${file}`, import.meta.url), 'utf8')) as T;
const water = read<WaterData>('water.json');
const world = read<WorldData>('world.json');
const country = (id: string) => world.countries.find((c) => c.id === id)!;
const states = (id: string) => Object.fromEntries(layersFor(countryPlace(country(id))).map((l) => [l.def.id, l.state]));

function close(got: number, want: number, rel = 1e-7, abs = 1e-9) {
  expect(Math.abs(got - want), `${got} vs ${want}`).toBeLessThanOrEqual(Math.max(abs, Math.abs(want) * rel));
}

describe('the ten data layers', () => {
  it('are ten: seven from space and models, three kept on the ground', () => {
    expect(LAYER_COUNT).toBe(10);
    expect(new Set(LAYERS.map((l) => l.id)).size).toBe(10);
    expect(LAYERS.filter((l) => l.group === 'space')).toHaveLength(7);
    expect(LAYERS.filter((l) => l.group === 'ground')).toHaveLength(3);
    // The ground layers come last, as in the table of the page.
    expect(LAYERS.slice(7).every((l) => l.group === 'ground')).toBe(true);
  });

  it('Nuevo León is the complete case: 10 of 10 in the case file', () => {
    const r = readiness(casePlace('nl', water.regions.nl, REGIONS.nl.areaKm2), water.regions.nl);
    expect(r.loaded).toBe(10);
    expect(r.ready).toBe(10);
    expect(r.local + r.open + r.partial + r.out).toBe(0);
  });

  it('the Central Valley holds stored water only; the rest is open or still to collect', () => {
    const r = readiness(casePlace('cv', water.regions.cv, REGIONS.cv.areaKm2), water.regions.cv);
    expect(r.loaded).toBe(1);
    expect(r.layers.find((l) => l.def.id === 'storage')!.state).toBe('loaded');
    expect(r.open).toBe(6);
    expect(r.local).toBe(3);
    expect(r.ready).toBe(7);
  });

  it('a country between 50° S and 50° N has seven layers ready and three to collect', () => {
    for (const id of ['IT', 'MX', 'IN', 'ZA', 'AU', 'CL']) {
      const r = readiness(countryPlace(country(id)));
      expect([id, r.ready, r.loaded, r.open, r.local]).toEqual([id, 7, 1, 6, 3]);
    }
  });

  it('beyond 50° the second rain record is missing, and beyond 60° satellite rain has gaps', () => {
    expect(states('DE').rain2).toBe('out');
    expect(states('DE').rain).toBe('open');
    expect(readiness(countryPlace(country('DE'))).ready).toBe(6);
    expect(states('FI').rain2).toBe('out');
    expect(states('FI').rain).toBe('partial');
    const fi = readiness(countryPlace(country('FI')));
    expect([fi.ready, fi.partial, fi.out, fi.local]).toEqual([5, 1, 1, 3]);
  });

  it('a place smaller than one model cell, over a sea mascon, keeps only the two rain layers', () => {
    const s = states('MV');
    expect(country('MV').tws).toBeNull();
    expect(s.storage).toBe('out');
    expect([s.temp, s.evap, s.soil, s.runoff]).toEqual(['partial', 'partial', 'partial', 'partial']);
    expect(readiness(countryPlace(country('MV'))).ready).toBe(2);
  });

  it('the limits sit exactly where each product publishes them', () => {
    const def = (source: string) => LAYERS.find((l) => l.source === source)!;
    expect(coverageAt(def('chirps'), COVERAGE.chirpsLat, 1e5).state).toBe('open');
    expect(coverageAt(def('chirps'), COVERAGE.chirpsLat + 0.1, 1e5).state).toBe('out');
    expect(coverageAt(def('chirps'), -COVERAGE.chirpsLat - 0.1, 1e5).state).toBe('out');
    expect(coverageAt(def('imerg'), COVERAGE.imergFullLat, 1e5).state).toBe('open');
    expect(coverageAt(def('imerg'), -COVERAGE.imergFullLat - 0.5, 1e5).state).toBe('partial');
    expect(coverageAt(def('gldas'), COVERAGE.gldasSouthLat - 1, 1e5).state).toBe('out');
    expect(coverageAt(def('gldas'), 10, COVERAGE.gldasCellKm2 - 1).state).toBe('partial');
    expect(coverageAt(def('gldas'), 10, null).state).toBe('open');
    expect(coverageAt(def('station'), 10, 1e5).state).toBe('local');
  });

  it('every layer of every country has a sentence that says why', () => {
    const keys = new Set<string>();
    for (const c of world.countries) for (const l of layersFor(countryPlace(c))) keys.add(l.why);
    for (const id of ['nl', 'cv'] as const) for (const l of layersFor(casePlace(id, water.regions[id], null), water.regions[id])) keys.add(l.why);
    const src = readFileSync(new URL('../i18n-world.ts', import.meta.url), 'utf8');
    for (const k of keys) expect(src.includes(`'wr.why.${k}'`), k).toBe(true);
  });
});

describe('first look at stored water', () => {
  const withSeries = world.countries.filter((c) => c.tws);

  it('the data file holds what its summary says', () => {
    expect(world.countries).toHaveLength(world.summary.countries);
    expect(withSeries).toHaveLength(world.summary.gracePoint + world.summary.graceCoast);
    expect(world.countries.filter((c) => !c.tws)).toHaveLength(world.summary.graceSea);
    for (const c of withSeries) expect(c.tws).toHaveLength(world.grace.years.length);
    expect(new Set(world.countries.map((c) => c.id)).size).toBe(world.countries.length);
  });

  it('the browser engine gives the same trend as Python for every country', () => {
    expect(withSeries.length).toBeGreaterThan(150);
    for (const c of withSeries) {
      const got = waterTrend({ years: world.grace.years, values: c.tws! });
      const want = c.ref!;
      expect(got.n, c.id).toBe(want.n);
      close(got.sen, want.sen, 1e-6);
      close(got.ols, want.ols, 1e-6);
      close(got.lo, want.lo, 1e-6);
      close(got.hi, want.hi, 1e-6);
      if (want.p === null) expect(got.p, c.id).toBeNull();
      else close(got.p as number, want.p, 1e-4, 1e-12);
      expect(got.label, c.id).toBe(want.label);
    }
  });

  it('is counted the way the page says it', () => {
    const classes = world.countries.map((c) => lookClass(firstLook(world, c)));
    const n = tally(classes);
    expect(Object.values(n).reduce((a, b) => a + b, 0)).toBe(world.countries.length);
    expect(n.sea).toBe(world.summary.graceSea);
    expect(n.falling).toBe(withSeries.filter((c) => c.ref!.label === 'confirmed' && c.ref!.sen < 0).length);
    expect(n.rising).toBe(withSeries.filter((c) => c.ref!.label === 'confirmed' && c.ref!.sen > 0).length);
  });

  it('speaks per decade and flags a country smaller than one mascon', () => {
    const it0 = firstLook(world, country('IT'))!;
    close(it0.perDecade, country('IT').ref!.sen * 10, 1e-6);
    expect(it0.wider).toBe(false);
    expect(firstLook(world, country('BE'))!.wider).toBe(true);
    expect(firstLook(world, country('MV'))).toBeNull();
  });
});

describe('the globe', () => {
  const view = (lon: number, lat: number, dist = FIT_DIST): GlobeView => ({ lon, lat, dist });

  it('puts the place it looks at in the centre of the picture', () => {
    for (const [lon, lat] of [
      [12.8, 42.8],
      [-99.8, 25.45],
      [133, -27],
      [26, 64],
      [-71, -30],
      [179, 0]
    ]) {
      const p = screenOf(lon, lat, view(lon, lat))!;
      expect(Math.hypot(p[0], p[1]), `${lon},${lat}`).toBeLessThan(1e-9);
      const back = placeAt(0, 0, view(lon, lat))!;
      close(wrapLon(back[0] - lon), 0, 0, 1e-6);
      close(back[1], lat, 0, 1e-6);
    }
  });

  it('hides the far side and keeps north up', () => {
    const v = view(0, 0);
    expect(screenOf(180, 0, v)).toBeNull();
    expect(screenOf(0, 30, v)![1]).toBeGreaterThan(0);
    expect(screenOf(30, 0, v)![0]).toBeGreaterThan(0);
    // What is under a point of the picture is the place that projects onto it.
    const at = placeAt(0.3, -0.2, v)!;
    const p = screenOf(at[0], at[1], v)!;
    close(p[0], 0.3, 0, 1e-6);
    close(p[1], -0.2, 0, 1e-6);
    expect(placeAt(0.99, 0.99, v)).toBeNull();
  });

  it('travels the short way round and arrives exactly', () => {
    const from = view(170, 10, NEAR_DIST);
    const to = view(-170, -20, NEAR_DIST);
    expect(tripAt(from, to, 0)).toEqual(from);
    expect(tripAt(from, to, 1)).toEqual(to);
    const mid = tripAt(from, to, 0.5);
    // 170° E to 170° W crosses the date line: 20° of turn, not 340°.
    expect(Math.abs(wrapLon(mid.lon - 180))).toBeLessThan(1e-9);
    expect(mid.dist).toBeGreaterThanOrEqual(NEAR_DIST);
    expect(tripSeconds(from, to)).toBeLessThan(tripSeconds(view(0, 0), view(180, 0)));
    close(angleBetween(0, 0, 180, 0), Math.PI);
  });

  it('comes closer for a small country, never closer than the planet filling its box', () => {
    expect(distFor(17_000_000)).toBe(FIT_DIST);
    expect(distFor(30_000)).toBe(NEAR_DIST);
    expect(distFor(300_000)).toBeGreaterThan(NEAR_DIST);
    expect(distFor(300_000)).toBeLessThan(distFor(2_000_000));
    expect(distFor(null)).toBeGreaterThan(NEAR_DIST);
    expect(distFor(null)).toBeLessThan(FIT_DIST);
    expect(clampLat(89)).toBe(80);
    expect(wrapLon(190)).toBe(-170);
    expect(wrapLon(-190)).toBe(170);
  });

  it('draws a parallel only where it faces the reader', () => {
    const runs = parallelRuns(60, view(26, 64));
    expect(runs.length).toBeGreaterThan(0);
    for (const run of runs) for (const p of run) expect(Math.hypot(p[0], p[1])).toBeLessThan(1);
    // Seen from the equator on the other side of the planet, the parallel of 60° N is still there.
    expect(parallelRuns(60, view(-150, 0)).length).toBeGreaterThan(0);
    // The parallel of 60° S is hidden from above the north pole.
    expect(parallelRuns(-60, view(0, 80))).toHaveLength(0);
  });
});

describe('the search', () => {
  const find = (q: string, lang: 'en' | 'es' = 'en') => searchCountries(world.countries, q, lang).map((c) => c.id);

  it('finds a country by the start of its name, in either language and without accents', () => {
    expect(find('ital')[0]).toBe('IT');
    expect(find('mex')[0]).toBe('MX');
    expect(find('méx', 'es')[0]).toBe('MX');
    expect(find('alem', 'es')[0]).toBe('DE');
    expect(find('alemania', 'en')).toContain('DE');
    expect(find('united')).toEqual(expect.arrayContaining(['US', 'GB', 'AE']));
    expect(find('it')).toContain('IT');
    expect(find('zzz')).toEqual([]);
    expect(find('   ')).toEqual([]);
  });

  it('returns a short list', () => {
    expect(find('a').length).toBeLessThanOrEqual(8);
  });
});
