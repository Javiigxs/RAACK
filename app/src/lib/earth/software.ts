// Fallback renderer of the opening Earth for browsers without WebGL 2: the same rays and the same
// light as the shader, computed pixel by pixel on a small 2D canvas that the page stretches.
// The loop repeats the formulas of scene.ts inline (calling them per pixel would be too slow).
// Code written with AI assistance (Claude) for team RAACK.

import { LOOK, hexToLinear, lens, normalize, toModel } from './scene';
import { EARTH } from './sequence';
import type { EarthMaps, EarthRenderer, View } from './webgl';

/** Width of the picture this renderer computes; the canvas is stretched to the screen. */
export const SOFT_WIDTH = 560;

interface Map {
  w: number;
  h: number;
  /** Linear light, three values per texel. */
  data: Float32Array;
}

const TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
const TO_BYTE = new Uint8ClampedArray(2049);
for (let i = 0; i <= 2048; i++) {
  const c = i / 2048;
  TO_BYTE[i] = Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
}

function read(image: HTMLImageElement, width: number, linear: boolean): Map | null {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width / 2;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const data = new Float32Array(canvas.width * canvas.height * 3);
  for (let i = 0, j = 0; i < px.length; i += 4, j += 3) {
    data[j] = linear ? TO_LINEAR[px[i]] : px[i] / 255;
    data[j + 1] = linear ? TO_LINEAR[px[i + 1]] : px[i + 1] / 255;
    data[j + 2] = linear ? TO_LINEAR[px[i + 2]] : px[i + 2] / 255;
  }
  return { w: canvas.width, h: canvas.height, data };
}

export function createSoftwareEarth(canvas: HTMLCanvasElement, maps: EarthMaps): EarthRenderer | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  // The day map and the masks share one size, so they share the four texels and weights of each pixel.
  const day = read(maps.day, 2048, true);
  const night = read(maps.night, 1024, true);
  const mask = read(maps.mask, 2048, false);
  if (!day || !night || !mask) return null;

  const sun = normalize(EARTH.sun);
  const skyDay = hexToLinear(EARTH.skyDay);
  const skyDusk = hexToLinear(EARTH.skyDusk);
  const R = EARTH.radius;
  const AIR = R * (EARTH.atmosphere - 1);
  const L = LOOK;
  const TAU = Math.PI * 2;
  const step = (a: number, b: number, x: number) => {
    const t = x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a);
    return t * t * (3 - 2 * t);
  };
  let image: ImageData | null = null;

  return {
    kind: 'canvas',
    resize(width, height) {
      // The caller gives device pixels; this renderer keeps its own small size with the same shape.
      const w = Math.min(SOFT_WIDTH, width);
      const h = Math.max(1, Math.round((w * height) / width));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        image = null;
      }
    },
    draw(view: View) {
      const W = canvas.width;
      const H = canvas.height;
      if (!image) image = ctx.createImageData(W, H);
      const out = image.data;
      const [lx, ly] = lens(W / H);
      const pixel = (2 * ly) / H;
      const m = toModel(view.tilt, view.spin);
      const clouds = view.clouds ?? 1;
      const cx = view.cam[0];
      const cy = view.cam[1];
      const cz = view.cam[2];
      const d2 = cx * cx + cy * cy + cz * cz;
      const reach = (R + AIR) * (R + AIR);
      const dw = day.w;
      const dh = day.h;
      const dd = day.data;
      const nw = night.w;
      const nh = night.h;
      const nd = night.data;
      const md = mask.data;

      let o = 0;
      for (let py = 0; py < H; py++) {
        const sy = (1 - (2 * (py + 0.5)) / H) * ly;
        for (let pxl = 0; pxl < W; pxl++, o += 4) {
          const sx = ((2 * (pxl + 0.5)) / W - 1) * lx;
          const inv = 1 / Math.sqrt(sx * sx + sy * sy + 1);
          const rx = sx * inv;
          const ry = sy * inv;
          const rz = -inv;
          const b = cx * rx + cy * ry + cz * rz;
          const rho2 = d2 - b * b;
          if (b >= 0 || rho2 >= reach) {
            out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
            continue;
          }
          const rho = Math.sqrt(rho2 > 0 ? rho2 : 0);
          const px = pixel * -b;
          let cover = (R - rho) / px + 0.5;
          cover = cover < 0 ? 0 : cover > 1 ? 1 : cover;

          // glow of the air outside the disc
          let qx = cx - b * rx;
          let qy = cy - b * ry;
          let qz = cz - b * rz;
          const qn = 1 / (Math.sqrt(qx * qx + qy * qy + qz * qz) || 1);
          qx *= qn;
          qy *= qn;
          qz *= qn;
          const limbSun = sun[0] * qx + sun[1] * qy + sun[2] * qz;
          const x = rho <= R ? 0 : (rho - R) / AIR;
          const haloMix = step(-0.1, 0.7, limbSun);
          const haloAlpha = x >= 1 ? 0 : L.haloAlpha * Math.pow(1 - x, L.haloPower) * step(-0.45, 0.25, limbSun);
          let alpha = haloAlpha;
          let r = (skyDusk[0] + (skyDay[0] - skyDusk[0]) * haloMix) * haloAlpha;
          let g = (skyDusk[1] + (skyDay[1] - skyDusk[1]) * haloMix) * haloAlpha;
          let bl = (skyDusk[2] + (skyDay[2] - skyDusk[2]) * haloMix) * haloAlpha;

          if (cover > 0) {
            const hh = b * b - (d2 - R * R);
            const t = -b - Math.sqrt(hh > 0 ? hh : 0);
            let nx = cx + t * rx;
            let ny = cy + t * ry;
            let nz = cz + t * rz;
            const nn = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
            nx *= nn;
            ny *= nn;
            nz *= nn;
            const mx = m[0] * nx + m[1] * ny + m[2] * nz;
            const my = m[3] * nx + m[4] * ny + m[5] * nz;
            const mz = m[6] * nx + m[7] * ny + m[8] * nz;
            let u = Math.atan2(mz, -mx) / TAU;
            if (u < 0) u += 1;
            const v = Math.acos(my < -1 ? -1 : my > 1 ? 1 : my) / Math.PI;

            // day map: four texels, weighted by distance
            const fx = u * dw - 0.5;
            const fy = v * dh - 0.5;
            const x0 = Math.floor(fx);
            const y0 = Math.floor(fy);
            const ax = fx - x0;
            const ay = fy - y0;
            const xa = ((x0 % dw) + dw) % dw;
            const xb = (xa + 1) % dw;
            const ya = y0 < 0 ? 0 : y0 >= dh ? dh - 1 : y0;
            const yb = ya + 1 >= dh ? dh - 1 : ya + 1;
            const i00 = (ya * dw + xa) * 3;
            const i10 = (ya * dw + xb) * 3;
            const i01 = (yb * dw + xa) * 3;
            const i11 = (yb * dw + xb) * 3;
            const w00 = (1 - ax) * (1 - ay);
            const w10 = ax * (1 - ay);
            const w01 = (1 - ax) * ay;
            const w11 = ax * ay;
            const dr = dd[i00] * w00 + dd[i10] * w10 + dd[i01] * w01 + dd[i11] * w11;
            const dg = dd[i00 + 1] * w00 + dd[i10 + 1] * w10 + dd[i01 + 1] * w01 + dd[i11 + 1] * w11;
            const db = dd[i00 + 2] * w00 + dd[i10 + 2] * w10 + dd[i01 + 2] * w01 + dd[i11 + 2] * w11;
            const shine = md[i00] * w00 + md[i10] * w10 + md[i01] * w01 + md[i11] * w11;
            const cloudMask = md[i00 + 1] * w00 + md[i10 + 1] * w10 + md[i01 + 1] * w01 + md[i11 + 1] * w11;
            // night lights: nearest texel
            const ni = (Math.min(nh - 1, Math.floor(v * nh)) * nw + Math.min(nw - 1, Math.floor(u * nw))) * 3;

            const sunDot = sun[0] * nx + sun[1] * ny + sun[2] * nz;
            const lit = step(L.terminator[0], L.terminator[1], sunDot);
            const cloud = clouds * step(L.cloud[0], L.cloud[1], cloudMask);
            const cloudLight = cloud * (L.cloudNight + (1 - L.cloudNight) * lit);
            const facing = -(rx * nx + ry * ny + rz * nz);
            const rim = Math.pow(1 - (facing > 0 ? facing : 0), L.rimPower);
            const skyMix = step(-0.1, 0.7, sunDot);
            let air = L.rimStrength * rim * step(-0.35, 0.3, sunDot);
            if (air > 1) air = 1;
            const k = 2 * sunDot;
            const glintDot = -((k * nx - sun[0]) * rx + (k * ny - sun[1]) * ry + (k * nz - sun[2]) * rz);
            const glint = glintDot > 0 ? L.glintStrength * Math.pow(glintDot, L.glintPower) * shine * (1 - cloud) : 0;
            const dark = L.nightGain * (1 - lit) * (1 - cloud);
            const bright = L.dayGain * lit;

            const s0 = skyDusk[0] + (skyDay[0] - skyDusk[0]) * skyMix;
            const s1 = skyDusk[1] + (skyDay[1] - skyDusk[1]) * skyMix;
            const s2 = skyDusk[2] + (skyDay[2] - skyDusk[2]) * skyMix;
            let c0 = nd[ni] * dark + dr * bright;
            let c1 = nd[ni + 1] * dark + dg * bright;
            let c2 = nd[ni + 2] * dark + db * bright;
            c0 += (1 - c0) * cloudLight;
            c1 += (1 - c1) * cloudLight;
            c2 += (1 - c2) * cloudLight;
            c0 += (s0 - c0) * air + glint * (1 + (s0 - 1) * rim);
            c1 += (s1 - c1) * air + glint * (1 + (s1 - 1) * rim);
            c2 += (s2 - c2) * air + glint * (1 + (s2 - 1) * rim);

            r += (c0 - r) * cover;
            g += (c1 - g) * cover;
            bl += (c2 - bl) * cover;
            alpha += (1 - alpha) * cover;
          }

          if (alpha <= 0) {
            out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
            continue;
          }
          // ImageData is not premultiplied: divide the colour back by its opacity
          const ia = 2048 / alpha;
          const e0 = r * ia;
          const e1 = g * ia;
          const e2 = bl * ia;
          out[o] = TO_BYTE[e0 < 0 ? 0 : e0 > 2048 ? 2048 : e0 | 0];
          out[o + 1] = TO_BYTE[e1 < 0 ? 0 : e1 > 2048 ? 2048 : e1 | 0];
          out[o + 2] = TO_BYTE[e2 < 0 ? 0 : e2 > 2048 ? 2048 : e2 | 0];
          out[o + 3] = alpha >= 1 ? 255 : (alpha * 255 + 0.5) | 0;
        }
      }
      ctx.putImageData(image, 0, 0);
    },
    dispose() {
      image = null;
    }
  };
}
