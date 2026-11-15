// Geometry and light of the Earth: the formulas the two renderers repeat (GLSL and the 2D fallback).
// Code written with AI assistance (Claude) for team RAACK.
import { describe, expect, it } from 'vitest';
import { apply, applyT, cast, dirOf, halo, hexToLinear, lens, lonLatOf, normalize, project, rayThrough, smoothstep, surface, toModel, uvOf } from './scene';
import { EARTH, spinForLon, type Vec3 } from './sequence';

const DEG = Math.PI / 180;

describe('geometry of the Earth', () => {
  it('goes from longitude and latitude to a direction and back', () => {
    for (const [lon, lat] of [
      [0, 0],
      [-99.8, 25.4],
      [12.8, 42.8],
      [151, -34],
      [-179, 60],
      [179.5, -75]
    ]) {
      const d = dirOf(lon, lat);
      expect(Math.hypot(d[0], d[1], d[2])).toBeCloseTo(1, 12);
      const [lon2, lat2] = lonLatOf(d);
      expect(lon2).toBeCloseTo(lon, 9);
      expect(lat2).toBeCloseTo(lat, 9);
    }
  });

  it('maps the texture with 180° W on the left edge and the north pole on top', () => {
    expect(uvOf(dirOf(0, 0))[0]).toBeCloseTo(0.5, 12);
    expect(uvOf(dirOf(-90, 0))[0]).toBeCloseTo(0.25, 12);
    expect(uvOf(dirOf(0, 90))[1]).toBeCloseTo(0, 12);
    expect(uvOf(dirOf(0, -90))[1]).toBeCloseTo(1, 12);
    expect(uvOf(dirOf(0, 0))[1]).toBeCloseTo(0.5, 12);
  });

  it('turns the planet with a rotation: lengths stay and the transpose undoes it', () => {
    const m = toModel(27 * DEG, spinForLon(-92));
    const v: Vec3 = normalize([0.3, -0.5, 0.8]);
    const w = apply(m, v);
    expect(Math.hypot(w[0], w[1], w[2])).toBeCloseTo(1, 12);
    const back = applyT(m, w);
    for (let i = 0; i < 3; i++) expect(back[i]).toBeCloseTo(v[i], 12);
  });

  it('tilt = latitude and spin = longitude bring a place to the centre of the picture', () => {
    for (const [lon, lat] of [
      [-99.8, 25.4],
      [12.8, 42.8],
      [133, -27]
    ]) {
      const p = project(lon, lat, [0, 0, 19], lat * DEG, spinForLon(lon), 16 / 9)!;
      expect(p[0]).toBeCloseTo(0, 9);
      expect(p[1]).toBeCloseTo(0, 9);
    }
    expect(project(80, 0, [0, 0, 19], 0, spinForLon(-100), 1)).toBeNull();
  });

  it('casts a ray: the centre hits the planet head on, a corner misses it', () => {
    const hit = cast([0, 0, 19], rayThrough(0, 0, 1));
    expect(hit.normal).not.toBeNull();
    expect(hit.normal![2]).toBeCloseTo(1, 12);
    expect(hit.rho).toBeCloseTo(0, 12);
    const miss = cast([0, 0, 19], rayThrough(1, 1, 1));
    expect(miss.normal).toBeNull();
    expect(miss.rho).toBeGreaterThan(EARTH.radius);
    // A ray that hits lands on the surface: the normal has length 1.
    const side = cast([0, 0, 19], rayThrough(0.5, 0.2, 1)).normal!;
    expect(Math.hypot(side[0], side[1], side[2])).toBeCloseTo(1, 12);
  });

  it('opens the lens with the aspect ratio', () => {
    const [lx, ly] = lens(2);
    expect(ly).toBeCloseTo(Math.tan((EARTH.fovDeg * DEG) / 2), 12);
    expect(lx).toBeCloseTo(2 * ly, 12);
  });
});

describe('light of the Earth', () => {
  const sun = normalize(EARTH.sun);
  const skyDay = hexToLinear(EARTH.skyDay);
  const skyDusk = hexToLinear(EARTH.skyDusk);
  const day: Vec3 = [0.2, 0.3, 0.1];
  const night: Vec3 = [0.5, 0.4, 0.2];
  const rd: Vec3 = [0, 0, -1];

  it('shows the day map where the sun is high and the night lights on the dark side', () => {
    const lit = surface(sun, normalize([-sun[0], -sun[1], -sun[2] - 0.2]), sun, day, night, [0, 0], skyDay, skyDusk, [0, 0, 0]);
    expect(lit[1]).toBeGreaterThan(day[1]);
    const away: Vec3 = [-sun[0], -sun[1], -sun[2]];
    const dark = surface(away, rd, sun, day, [0.5, 0.4, 0.2], [0, 0], skyDay, skyDusk, [0, 0, 0]);
    // No daylight at all: only the night map, with its gain, tinted by the air near the rim.
    expect(dark[0]).toBeGreaterThan(0);
    const darkNoLights = surface(away, rd, sun, day, [0, 0, 0], [0, 0], skyDay, skyDusk, [0, 0, 0]);
    expect(darkNoLights[0]).toBeLessThan(dark[0]);
  });

  it('whitens under a cloud, and a clear sky removes it', () => {
    const n: Vec3 = [0, 0, 1];
    const clear = [...surface(n, rd, sun, day, night, [0, 0], skyDay, skyDusk, [0, 0, 0])];
    const cloudy = [...surface(n, rd, sun, day, night, [0, 1], skyDay, skyDusk, [0, 0, 0])];
    const removed = [...surface(n, rd, sun, day, night, [0, 1], skyDay, skyDusk, [0, 0, 0], 0)];
    const faint = [...surface(n, rd, sun, day, night, [0, 1], skyDay, skyDusk, [0, 0, 0], 0.18)];
    for (let i = 0; i < 3; i++) {
      expect(cloudy[i]).toBeGreaterThan(clear[i]);
      expect(removed[i]).toBeCloseTo(clear[i], 12);
      expect(faint[i]).toBeGreaterThan(clear[i]);
      expect(faint[i]).toBeLessThan(cloudy[i]);
    }
  });

  it('glows outside the disc, fading to nothing at the top of the air', () => {
    const out: Vec3 = [0, 0, 0];
    const limb = normalize([-1, 0.3, 0.3]);
    const near = halo(EARTH.radius * 1.01, limb, sun, skyDay, skyDusk, out);
    const far = halo(EARTH.radius * 1.1, limb, sun, skyDay, skyDusk, out);
    expect(near).toBeGreaterThan(far);
    expect(halo(EARTH.radius * EARTH.atmosphere, limb, sun, skyDay, skyDusk, out)).toBe(0);
    // No glow on the side the sun does not reach.
    expect(halo(EARTH.radius * 1.01, [-limb[0], -limb[1], -limb[2]], sun, skyDay, skyDusk, out)).toBe(0);
  });

  it('reads colours and eases between two edges', () => {
    expect(hexToLinear('#ffffff')).toEqual([1, 1, 1]);
    expect(hexToLinear('#000000')).toEqual([0, 0, 0]);
    expect(hexToLinear('#808080')[0]).toBeCloseTo(0.2159, 3);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 12);
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });
});
