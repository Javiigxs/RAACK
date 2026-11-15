// "Take the case elsewhere": the ten data layers the Nuevo León case stands on, and which of them
// are ready for any other country. The idea (count how many of the layers a country already has,
// with Nuevo León as the complete case) is Fran's, team RAACK.
//
// What "ready" means here, layer by layer:
//   loaded   the layer is in this tool: files in the repository, figures computed from them
//   open     a global open product covers the place: it can be downloaded today, no fieldwork
//   partial  the product reaches the place only in part, or is coarser than the place
//   out      the product does not reach the place
//   local    a record kept on the ground: somebody has to find it in the country
// The coverage rules are the published limits of each product, checked at ONE point: the
// reference point of the country in the source list. They are not a download test.
// Code written with AI assistance (Claude) for team RAACK.

import { waterTrend, type WaterTrend } from '../water/engine';
import type { RegionId, WaterRegion } from '../water/types';
import type { WorldCountry, WorldData } from './types';

export type LayerId = 'rain' | 'rain2' | 'temp' | 'evap' | 'soil' | 'runoff' | 'storage' | 'station' | 'reservoirs' | 'official';
export type LayerState = 'loaded' | 'open' | 'partial' | 'out' | 'local';
export type SourceId = 'imerg' | 'chirps' | 'gldas' | 'grace' | 'station' | 'reservoirs' | 'official';

/** Published limits of the global products (degrees of latitude, km²). */
export const COVERAGE = {
  /** GPM IMERG: complete fields between 60° S and 60° N; beyond, no estimates over snow and ice. */
  imergFullLat: 60,
  /** CHIRPS v2.0: land between 50° S and 50° N. */
  chirpsLat: 50,
  /** GLDAS-2.1 Noah: land north of 60° S. */
  gldasSouthLat: -60,
  /** One 0.25° GLDAS cell at the equator, about 27.8 km on each side. */
  gldasCellKm2: 770,
  /** One JPL mascon: the surface of the Earth (510.07 million km²) divided by its 4,551 mascons. */
  graceMasconKm2: 112_000
};

export interface LayerDef {
  id: LayerId;
  /** space: from a mission, a model or a satellite blend, global and open · ground: a local record. */
  group: 'space' | 'ground';
  source: SourceId;
  /** Produced by NASA. */
  nasa: boolean;
  /** Short product name. */
  product: string;
  /** True when the case file of a region holds this layer. */
  inCase: (r: WaterRegion) => boolean;
}

const has = (r: WaterRegion, test: (id: string) => boolean) => Object.keys(r.series).some(test);

/** The ten layers, in the order of the water budget: seven from space and models, three from the ground. */
export const LAYERS: LayerDef[] = [
  { id: 'rain', group: 'space', source: 'imerg', nasa: true, product: 'GPM IMERG Final V07', inCase: (r) => has(r, (k) => k === 'rain_imerg') },
  { id: 'rain2', group: 'space', source: 'chirps', nasa: false, product: 'CHIRPS v2.0', inCase: (r) => has(r, (k) => k === 'rain_chirps') },
  { id: 'temp', group: 'space', source: 'gldas', nasa: true, product: 'GLDAS-2.1 Noah', inCase: (r) => has(r, (k) => k.startsWith('temp_gldas')) },
  { id: 'evap', group: 'space', source: 'gldas', nasa: true, product: 'GLDAS-2.1 Noah', inCase: (r) => has(r, (k) => k.startsWith('pet_gldas')) },
  { id: 'soil', group: 'space', source: 'gldas', nasa: true, product: 'GLDAS-2.1 Noah', inCase: (r) => has(r, (k) => k.startsWith('soil_gldas')) },
  { id: 'runoff', group: 'space', source: 'gldas', nasa: true, product: 'GLDAS-2.1 Noah', inCase: (r) => has(r, (k) => k.startsWith('runoff_gldas')) },
  { id: 'storage', group: 'space', source: 'grace', nasa: true, product: 'GRACE / GRACE-FO JPL RL06.3', inCase: (r) => has(r, (k) => k === 'tws_grace') },
  { id: 'station', group: 'ground', source: 'station', nasa: false, product: '', inCase: (r) => has(r, (k) => /^(rain|temp|pan)_smn$/.test(k)) },
  { id: 'reservoirs', group: 'ground', source: 'reservoirs', nasa: false, product: '', inCase: (r) => has(r, (k) => k.startsWith('vol_')) },
  { id: 'official', group: 'ground', source: 'official', nasa: false, product: '', inCase: (r) => r.aquifers.length > 0 }
];

export const LAYER_COUNT = LAYERS.length;

/** A place the globe can turn to: a country of the list, or one of the cases of the tool. */
export interface Place {
  id: string;
  kind: 'country' | 'case';
  lat: number;
  lon: number;
  area: number | null;
  /** Country the place belongs to (itself for a country). */
  countryId: string;
  /** For a case: its region in the water data. */
  region?: RegionId;
  /** For a country: its entry in the world data. */
  country?: WorldCountry;
}

/** The cases of the tool and the country each one lies in. */
export const CASE_COUNTRY: Record<RegionId, string> = { nl: 'MX', cv: 'US' };

export function casePlace(id: RegionId, r: WaterRegion, areaKm2: number | null): Place {
  return {
    id,
    kind: 'case',
    lat: (r.box.latMin + r.box.latMax) / 2,
    lon: (r.box.lonMin + r.box.lonMax) / 2,
    area: areaKm2,
    countryId: CASE_COUNTRY[id],
    region: id
  };
}

export function countryPlace(c: WorldCountry): Place {
  return { id: c.id, kind: 'country', lat: c.lat, lon: c.lon, area: c.area, countryId: c.id, country: c };
}

export interface LayerStatus {
  def: LayerDef;
  state: LayerState;
  /** Key of the sentence that says why (i18n: `wr.why.<key>`). */
  why: string;
}

/** What the published coverage of each open product says at one point. */
export function coverageAt(def: LayerDef, lat: number, area: number | null): { state: LayerState; why: string } {
  switch (def.source) {
    case 'imerg':
      return Math.abs(lat) <= COVERAGE.imergFullLat ? { state: 'open', why: 'imerg.open' } : { state: 'partial', why: 'imerg.partial' };
    case 'chirps':
      return Math.abs(lat) <= COVERAGE.chirpsLat ? { state: 'open', why: 'chirps.open' } : { state: 'out', why: 'chirps.out' };
    case 'gldas':
      if (lat < COVERAGE.gldasSouthLat) return { state: 'out', why: 'gldas.out' };
      if (area !== null && area < COVERAGE.gldasCellKm2) return { state: 'partial', why: 'gldas.small' };
      return { state: 'open', why: 'gldas.open' };
    case 'grace':
      return { state: 'open', why: 'grace.open' };
    default:
      return { state: 'local', why: `${def.source}.local` };
  }
}

/** The ten layers for a place. A case is read from its data file; a country, from the coverage rules. */
export function layersFor(place: Place, caseRegion?: WaterRegion): LayerStatus[] {
  return LAYERS.map((def) => {
    if (place.kind === 'case' && caseRegion && def.inCase(caseRegion)) return { def, state: 'loaded' as const, why: `${def.source}.loaded` };
    if (place.kind === 'country' && def.source === 'grace') {
      const c = place.country!;
      // The stored water of every country is already computed from the global file of the repository.
      if (c.tws) return { def, state: 'loaded' as const, why: c.twsKind === 'coast' ? 'grace.coast' : 'grace.point' };
      return { def, state: 'out' as const, why: 'grace.sea' };
    }
    return { def, ...coverageAt(def, place.lat, place.area) };
  });
}

export interface Readiness {
  layers: LayerStatus[];
  loaded: number;
  open: number;
  partial: number;
  out: number;
  local: number;
  /** Layers that can be used today without fieldwork: loaded + open. */
  ready: number;
  total: number;
}

export function readiness(place: Place, caseRegion?: WaterRegion): Readiness {
  const layers = layersFor(place, caseRegion);
  const n = (s: LayerState) => layers.filter((l) => l.state === s).length;
  const loaded = n('loaded');
  const open = n('open');
  return { layers, loaded, open, partial: n('partial'), out: n('out'), local: n('local'), ready: loaded + open, total: layers.length };
}

export interface FirstLook {
  trend: WaterTrend;
  /** Sen's slope and the 95% interval of the least-squares slope, per decade (cm). */
  perDecade: number;
  ci: [number, number];
  /** One mascon is larger than the country: the figure speaks for the wider region. */
  wider: boolean;
}

/** The stored-water test of the cases, run on the GRACE series under the reference point of a country. */
export function firstLook(world: WorldData, c: WorldCountry): FirstLook | null {
  if (!c.tws) return null;
  const trend = waterTrend({ years: world.grace.years, values: c.tws });
  return { trend, perDecade: trend.sen * 10, ci: [trend.lo * 10, trend.hi * 10], wider: c.area !== null && c.area < COVERAGE.graceMasconKm2 };
}

export type LookClass = 'falling' | 'rising' | 'hintFalling' | 'hintRising' | 'none' | 'sea';

/** How the first look of a country is drawn on the globe. */
export function lookClass(look: FirstLook | null): LookClass {
  if (!look) return 'sea';
  const { label, dir } = look.trend;
  if (label === 'confirmed') return dir < 0 ? 'falling' : dir > 0 ? 'rising' : 'none';
  if (label === 'hint') return dir < 0 ? 'hintFalling' : dir > 0 ? 'hintRising' : 'none';
  return 'none';
}

/** How many countries fall in each class of the first look. */
export function tally(classes: Iterable<LookClass>): Record<LookClass, number> {
  const out: Record<LookClass, number> = { falling: 0, rising: 0, hintFalling: 0, hintRising: 0, none: 0, sea: 0 };
  for (const k of classes) out[k]++;
  return out;
}

/** Letters without accents and in lower case, to search names in either language. */
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Countries whose English or Spanish name contains the query; names that start with it go first. */
export function searchCountries(countries: WorldCountry[], query: string, lang: 'en' | 'es', limit = 8): WorldCountry[] {
  const q = fold(query.trim());
  if (!q) return [];
  const scored: { c: WorldCountry; rank: number; name: string }[] = [];
  for (const c of countries) {
    const names = [fold(c[lang]), fold(lang === 'en' ? c.es : c.en)];
    let rank = -1;
    if (names[0].startsWith(q)) rank = 0;
    else if (names[1].startsWith(q) || c.id.toLowerCase() === q || c.iso3.toLowerCase() === q) rank = 1;
    else if (names[0].split(/[\s-]+/).some((w) => w.startsWith(q))) rank = 2;
    else if (names[0].includes(q) || names[1].includes(q)) rank = 3;
    if (rank >= 0) scored.push({ c, rank, name: names[0] });
  }
  scored.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  return scored.slice(0, limit).map((x) => x.c);
}
