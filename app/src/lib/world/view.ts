// Where the small globe of the world section looks: which point of the planet faces the reader and
// from how far, how it travels from one country to the next, and what lies under the pointer.
// It reuses the geometry of the opening Earth (earth/scene.ts): same sphere, same camera.
// Code written with AI assistance (Claude) for team RAACK.

import { apply, cast, lonLatOf, project, rayThrough, toModel } from '../earth/scene';
import { EARTH, clamp01, easeInOut, lerp, spinForLon, type Vec3 } from '../earth/sequence';

const DEG = Math.PI / 180;

/** The point of the planet at the centre of the picture (degrees) and the distance of the camera. */
export interface GlobeView {
  lon: number;
  lat: number;
  dist: number;
}

/**
 * The planet has no frame: it floats on the page. Its picture is this many times wider than the
 * box it sits in, which leaves room for the glow of the air around the planet.
 */
export const BLEED = 1.3;
/** Camera distance from which the planet takes about 82 % of the width of its box (large countries). */
export const FIT_DIST = 24.2;
/** Closest the camera comes: the planet fills its box, a fifth larger, and never reaches beyond it. */
export const NEAR_DIST = 19.85;
/** The camera never looks straight down a pole: the picture would lose its "up". */
export const MAX_LAT = 80;

/** Camera, tilt and spin (what the renderers draw) for a view. */
export function renderOf(v: GlobeView): { cam: Vec3; tilt: number; spin: number } {
  return { cam: [0, 0, v.dist], tilt: v.lat * DEG, spin: spinForLon(v.lon) };
}

/** Camera distance for a place of a given area (km²): continents from afar, small countries from near. */
export function distFor(areaKm2: number | null): number {
  if (areaKm2 === null || !(areaKm2 > 0)) return (NEAR_DIST + FIT_DIST) / 2;
  const t = clamp01((Math.log10(areaKm2) - 5) / 1.7);
  return lerp(NEAR_DIST, FIT_DIST, t);
}

export const wrapLon = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;
export const clampLat = (lat: number) => Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));

/** Angle between two points of the planet, in radians. */
export function angleBetween(lonA: number, latA: number, lonB: number, latB: number): number {
  const a = latA * DEG;
  const b = latB * DEG;
  const d = (lonB - lonA) * DEG;
  const c = Math.sin(a) * Math.sin(b) + Math.cos(a) * Math.cos(b) * Math.cos(d);
  return Math.acos(Math.max(-1, Math.min(1, c)));
}

/** Seconds a trip takes: longer the further the planet has to turn. */
export function tripSeconds(from: GlobeView, to: GlobeView): number {
  return 0.8 + 1.1 * (angleBetween(from.lon, from.lat, to.lon, to.lat) / Math.PI);
}

/**
 * The view at a share `p` (0–1) of a trip: the planet turns the short way round, and the camera
 * backs away in the middle of a long trip so the reader sees where it is going.
 */
export function tripAt(from: GlobeView, to: GlobeView, p: number): GlobeView {
  const e = easeInOut(clamp01(p));
  const dLon = wrapLon(to.lon - from.lon);
  const far = angleBetween(from.lon, from.lat, to.lon, to.lat) / Math.PI;
  const lift = Math.sin(Math.PI * e) * far * (2 + (FIT_DIST - Math.min(from.dist, to.dist)) * 0.9);
  return {
    lon: wrapLon(from.lon + dLon * e),
    lat: lerp(from.lat, to.lat, e),
    dist: Math.min(FIT_DIST + 2, lerp(from.dist, to.dist, e) + lift)
  };
}

/** Where a place falls in a square picture (x and y from −1 to 1, y up), or null on the far side. */
export function screenOf(lon: number, lat: number, v: GlobeView, aspect = 1): [number, number] | null {
  const r = renderOf(v);
  return project(lon, lat, r.cam, r.tilt, r.spin, aspect);
}

/** Longitude and latitude under a point of the picture (x and y from −1 to 1, y up), or null off the planet. */
export function placeAt(x: number, y: number, v: GlobeView, aspect = 1): [number, number] | null {
  const r = renderOf(v);
  const hit = cast(r.cam, rayThrough(x, y, aspect));
  if (!hit.normal) return null;
  return lonLatOf(apply(toModel(r.tilt, r.spin), hit.normal));
}

/** Radius of the planet's disc in the picture, as a share of its half-height. */
export function discRadius(v: GlobeView): number {
  const half = Math.tan((EARTH.fovDeg * DEG) / 2);
  return Math.tan(Math.asin(Math.min(1, EARTH.radius / v.dist))) / half;
}

/** Degrees the planet turns when the pointer drags one half-height of the picture across its centre. */
export function dragDegrees(v: GlobeView): number {
  // At the centre, the surface is (dist − radius) away: one half-height spans that many scene units.
  const half = Math.tan((EARTH.fovDeg * DEG) / 2);
  return ((v.dist - EARTH.radius) * half) / EARTH.radius / DEG;
}

/**
 * Points of a parallel that face the camera, as picture coordinates, in runs (a run breaks where
 * the parallel goes behind the planet).
 */
export function parallelRuns(lat: number, v: GlobeView, stepDeg = 3): [number, number][][] {
  const runs: [number, number][][] = [];
  let run: [number, number][] = [];
  for (let d = -180; d <= 180; d += stepDeg) {
    const p = screenOf(v.lon + d, lat, v);
    if (p) run.push(p);
    else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs.filter((r) => r.length > 1);
}
