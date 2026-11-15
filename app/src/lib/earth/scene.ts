// Geometry and light of the opening Earth, shared by the two renderers (WebGL and the 2D fallback).
// The planet is not a mesh: every pixel casts a ray from the camera and intersects a sphere, so the
// edge is exact at any size. The same formulas are written again in GLSL in shader.ts; the tests in
// scene.test.ts pin this version.
// Code written with AI assistance (Claude) for team RAACK.

import { EARTH, type Vec3 } from './sequence';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

/** Numbers of the light model. shader.ts injects the same values into the GLSL source. */
export const LOOK = {
  /** Gain of the day map in linear light. */
  dayGain: 1.75,
  nightGain: 1.15,
  /** Day side: where the cosine of the sun angle goes from night (first) to full day (second). */
  terminator: [-0.2, 0.45] as [number, number],
  /** Cloud mask values that count as no cloud (first) and full cloud (second). */
  cloud: [0.26, 1] as [number, number],
  cloudNight: 0.05,
  /** How fast the air thickens toward the edge of the disc. */
  rimPower: 2.4,
  rimStrength: 0.85,
  /** Sun glint on the sea. */
  glintPower: 120,
  glintStrength: 0.2,
  /** Glow outside the disc. */
  haloPower: 2.3,
  haloAlpha: 0.62
};

/** Half-height of the view at distance 1, and its width for an aspect ratio (width / height). */
export function lens(aspect: number): [number, number] {
  const t = Math.tan((EARTH.fovDeg * DEG) / 2);
  return [t * aspect, t];
}

export const normalize = (v: Vec3): Vec3 => {
  const k = 1 / Math.hypot(v[0], v[1], v[2]);
  return [v[0] * k, v[1] * k, v[2] * k];
};

/**
 * Matrix (rows) that takes a direction in the scene to the planet's own frame: it undoes the tilt
 * (north pole toward the camera, around X) and the spin (around the planet's axis).
 */
export function toModel(tilt: number, spin: number): number[] {
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const cs = Math.cos(spin);
  const ss = Math.sin(spin);
  return [cs, ss * st, -ss * ct, 0, ct, st, ss, -cs * st, cs * ct];
}

export const apply = (m: number[], v: Vec3): Vec3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
];

/** Transpose of `apply`: from the planet's frame back to the scene. */
export const applyT = (m: number[], v: Vec3): Vec3 => [
  m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
  m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
  m[2] * v[0] + m[5] * v[1] + m[8] * v[2]
];

/**
 * Texture coordinates of a direction in the planet's frame, for an equirectangular map whose left
 * edge is the meridian 180° W and whose top row is the north pole. `u` is in (−0.5, 0.5].
 */
export function uvOf(m: Vec3): [number, number] {
  return [Math.atan2(m[2], -m[0]) / TAU, Math.acos(Math.max(-1, Math.min(1, m[1]))) / Math.PI];
}

/** Longitude and latitude (degrees) of a direction in the planet's frame. */
export function lonLatOf(m: Vec3): [number, number] {
  const [u, v] = uvOf(m);
  const lon = ((((u % 1) + 1) % 1) - 0.5) * 360;
  return [lon, 90 - v * 180];
}

/** Direction, in the planet's frame, of a place given by longitude and latitude in degrees. */
export function dirOf(lonDeg: number, latDeg: number): Vec3 {
  const phi = (lonDeg / 360 + 0.5) * TAU;
  const c = Math.cos(latDeg * DEG);
  return [-Math.cos(phi) * c, Math.sin(latDeg * DEG), Math.sin(phi) * c];
}

export interface Hit {
  /** Distance from the centre of the planet to the ray. */
  rho: number;
  /** Distance along the ray to its closest point to the centre (negative: the planet is behind). */
  along: number;
  /** Outward normal where the ray enters the planet, or null when it misses. */
  normal: Vec3 | null;
}

/** Ray from the camera through a point of the screen (x and y from −1 to 1, y up). */
export function rayThrough(x: number, y: number, aspect: number): Vec3 {
  const [lx, ly] = lens(aspect);
  return normalize([x * lx, y * ly, -1]);
}

export function cast(cam: Vec3, rd: Vec3, radius = EARTH.radius): Hit {
  const b = cam[0] * rd[0] + cam[1] * rd[1] + cam[2] * rd[2];
  const d2 = cam[0] * cam[0] + cam[1] * cam[1] + cam[2] * cam[2];
  const rho = Math.sqrt(Math.max(d2 - b * b, 0));
  const h = b * b - (d2 - radius * radius);
  if (h < 0 || b > 0) return { rho, along: -b, normal: null };
  const t = -b - Math.sqrt(h);
  return { rho, along: -b, normal: [(cam[0] + t * rd[0]) / radius, (cam[1] + t * rd[1]) / radius, (cam[2] + t * rd[2]) / radius] };
}

/**
 * Where a place of the planet falls on the screen (x and y from −1 to 1, y up), or null when it is
 * on the far side. Used to check the framing of the sequence.
 */
export function project(lonDeg: number, latDeg: number, cam: Vec3, tilt: number, spin: number, aspect: number): [number, number] | null {
  const n = applyT(toModel(tilt, spin), dirOf(lonDeg, latDeg));
  const p: Vec3 = [n[0] * EARTH.radius, n[1] * EARTH.radius, n[2] * EARTH.radius];
  const toCam: Vec3 = [cam[0] - p[0], cam[1] - p[1], cam[2] - p[2]];
  if (toCam[0] * n[0] + toCam[1] * n[1] + toCam[2] * n[2] <= 0) return null;
  const depth = cam[2] - p[2];
  if (depth <= 0) return null;
  const [lx, ly] = lens(aspect);
  return [(p[0] - cam[0]) / depth / lx, (p[1] - cam[1]) / depth / ly];
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function hexToLinear(hex: string): Vec3 {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255)) as Vec3;
}

/**
 * Colour of a point of the surface, in linear light. `day`, `night` and `mask` are the three maps
 * sampled there (mask: red = sea shine, green = cloud). `clouds` scales the cloud cover (0 = clear
 * sky). Writes into `out` and returns it.
 */
export function surface(n: Vec3, rd: Vec3, sun: Vec3, day: Vec3, night: Vec3, mask: [number, number], skyDay: Vec3, skyDusk: Vec3, out: Vec3, clouds = 1): Vec3 {
  const L = LOOK;
  const sunDot = sun[0] * n[0] + sun[1] * n[1] + sun[2] * n[2];
  const lit = smoothstep(L.terminator[0], L.terminator[1], sunDot);
  const cloud = clouds * smoothstep(L.cloud[0], L.cloud[1], mask[1]);
  const cloudLight = cloud * (L.cloudNight + (1 - L.cloudNight) * lit);
  const facing = -(rd[0] * n[0] + rd[1] * n[1] + rd[2] * n[2]);
  const rim = Math.pow(1 - Math.max(facing, 0), L.rimPower);
  const skyMix = smoothstep(-0.1, 0.7, sunDot);
  const air = L.rimStrength * rim * smoothstep(-0.35, 0.3, sunDot);
  // reflect(−sun, n) · (−rd): the sun mirrored on the sea toward the camera
  const k = 2 * sunDot;
  const glintDot = (k * n[0] - sun[0]) * -rd[0] + (k * n[1] - sun[1]) * -rd[1] + (k * n[2] - sun[2]) * -rd[2];
  const glint = L.glintStrength * Math.pow(Math.max(glintDot, 0), L.glintPower) * mask[0] * (1 - cloud);
  for (let i = 0; i < 3; i++) {
    const sky = skyDusk[i] + (skyDay[i] - skyDusk[i]) * skyMix;
    let c = night[i] * L.nightGain * (1 - lit) * (1 - cloud) + day[i] * L.dayGain * lit;
    c += (1 - c) * cloudLight;
    c += (sky - c) * Math.min(air, 1);
    out[i] = c + glint * (1 + (sky - 1) * rim);
  }
  return out;
}

/** Glow of the air outside the disc: colour (linear light) in `out`, and its opacity as the result. */
export function halo(rho: number, limb: Vec3, sun: Vec3, skyDay: Vec3, skyDusk: Vec3, out: Vec3): number {
  const span = EARTH.radius * (EARTH.atmosphere - 1);
  const x = Math.max(0, Math.min(1, (rho - EARTH.radius) / span));
  const sunDot = sun[0] * limb[0] + sun[1] * limb[1] + sun[2] * limb[2];
  const skyMix = smoothstep(-0.1, 0.7, sunDot);
  for (let i = 0; i < 3; i++) out[i] = skyDusk[i] + (skyDay[i] - skyDusk[i]) * skyMix;
  return LOOK.haloAlpha * Math.pow(1 - x, LOOK.haloPower) * smoothstep(-0.45, 0.25, sunDot);
}
