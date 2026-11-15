// GLSL of the opening Earth: one triangle covers the screen and every pixel casts its own ray.
// It repeats, line by line, the formulas of scene.ts; the numbers come from the same LOOK object.
// Code written with AI assistance (Claude) for team RAACK.

import { LOOK } from './scene';
import { EARTH } from './sequence';

const f = (v: number) => (Number.isInteger(v) ? `${v}.0` : String(v));

export const VERTEX = `#version 300 es
out vec2 vNdc;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vNdc = p * 2.0 - 1.0;
  gl_Position = vec4(vNdc, 0.0, 1.0);
}`;

export const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vNdc;
out vec4 outColor;

uniform vec3 uCam;        // camera position; it looks down -Z
uniform vec2 uLens;       // half-width and half-height of the view at distance 1
uniform mat3 uToModel;    // scene direction -> the planet's own frame
uniform vec3 uSun;
uniform vec3 uSkyDay;
uniform vec3 uSkyDusk;
uniform float uPixel;     // height of one pixel at distance 1
uniform float uClouds;    // 1 = the clouds of the mask, 0 = a clear sky
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uMask;  // red = sea shine, green = cloud

const float RADIUS = ${f(EARTH.radius)};
const float AIR = ${f(EARTH.radius * (EARTH.atmosphere - 1))};
const float TAU = 6.283185307179586;
const float PI = 3.141592653589793;

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec3 rd = normalize(vec3(vNdc * uLens, -1.0));
  float b = dot(uCam, rd);
  float d2 = dot(uCam, uCam);
  float rho = sqrt(max(d2 - b * b, 0.0));
  float px = uPixel * max(-b, 0.0001);
  float cover = b < 0.0 ? clamp((RADIUS - rho) / px + 0.5, 0.0, 1.0) : 0.0;

  // glow of the air outside the disc
  vec3 limb = normalize(uCam - b * rd);
  float limbSun = dot(uSun, limb);
  float x = clamp((rho - RADIUS) / AIR, 0.0, 1.0);
  vec3 haloColor = mix(uSkyDusk, uSkyDay, smoothstep(-0.1, 0.7, limbSun));
  float haloAlpha = b < 0.0 ? ${f(LOOK.haloAlpha)} * pow(1.0 - x, ${f(LOOK.haloPower)}) * smoothstep(-0.45, 0.25, limbSun) : 0.0;

  // colour already multiplied by its opacity, in linear light
  vec3 pre = haloColor * haloAlpha;
  float alpha = haloAlpha;

  if (cover > 0.0) {
    float h = max(b * b - (d2 - RADIUS * RADIUS), 0.0);
    vec3 n = normalize(uCam + (-b - sqrt(h)) * rd);
    vec3 m = uToModel * n;
    float u = atan(m.z, -m.x) / TAU;
    float v = acos(clamp(m.y, -1.0, 1.0)) / PI;
    // The map wraps around at the meridian opposite to u = 0. There the derivative of u jumps and the
    // sampler would pick its smallest copy: a visible seam. The second copy of u jumps elsewhere.
    float u2 = fract(u);
    vec2 uv = fwidth(u) <= fwidth(u2) ? vec2(u, v) : vec2(u2, v);
    vec2 gx = dFdx(uv);
    vec2 gy = dFdy(uv);
    vec3 day = textureGrad(uDay, vec2(u, v), gx, gy).rgb;
    vec3 night = textureGrad(uNight, vec2(u, v), gx, gy).rgb;
    vec2 mask = textureGrad(uMask, vec2(u, v), gx, gy).rg;

    float sunDot = dot(uSun, n);
    float lit = smoothstep(${f(LOOK.terminator[0])}, ${f(LOOK.terminator[1])}, sunDot);
    float cloud = uClouds * smoothstep(${f(LOOK.cloud[0])}, ${f(LOOK.cloud[1])}, mask.g);
    float cloudLight = cloud * (${f(LOOK.cloudNight)} + ${f(1 - LOOK.cloudNight)} * lit);
    float facing = -dot(rd, n);
    float rim = pow(1.0 - max(facing, 0.0), ${f(LOOK.rimPower)});
    vec3 sky = mix(uSkyDusk, uSkyDay, smoothstep(-0.1, 0.7, sunDot));
    float air = ${f(LOOK.rimStrength)} * rim * smoothstep(-0.35, 0.3, sunDot);
    float glint = ${f(LOOK.glintStrength)} * pow(max(dot(reflect(-uSun, n), -rd), 0.0), ${f(LOOK.glintPower)}) * mask.r * (1.0 - cloud);

    vec3 c = night * ${f(LOOK.nightGain)} * (1.0 - lit) * (1.0 - cloud) + day * ${f(LOOK.dayGain)} * lit;
    c += (1.0 - c) * cloudLight;
    c += (sky - c) * min(air, 1.0);
    c += glint * mix(vec3(1.0), sky, rim);

    pre = mix(pre, c, cover);
    alpha = mix(haloAlpha, 1.0, cover);
  }

  outColor = vec4(toSrgb(alpha > 0.0 ? pre / alpha : vec3(0.0)) * alpha, alpha);
}`;
