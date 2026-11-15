// The opening sequence of the site: the camera pulls back from the horizon until the whole Earth is
// in view, holds, and the planet blurs into the backdrop of the information.
//
// Visual reference: the 3D hero tutorial by Robinzon100 (github.com/Robinzon100/3D_hero). The camera,
// field of view, phase lengths and blur keep the values of that reference so its notes still apply.
// Nothing of its code is used: this file is plain arithmetic, tested in sequence.test.ts.
// Code written with AI assistance (Claude) for team RAACK.

export type Vec3 = [number, number, number];

export const EARTH = {
  radius: 2,
  /** Vertical field of view of the camera, in degrees. It always looks straight ahead (down −Z). */
  fovDeg: 15,
  /** Camera at the start: just above the top of the planet, so only the horizon is in view. */
  camStart: [0, 2.15, 4.5] as Vec3,
  /** Camera at the end of the pull-back, on wide screens and on narrow ones (further away). */
  camEndWide: [0, 0.1, 19] as Vec3,
  camEndNarrow: [0.1, 0.1, 30] as Vec3,
  narrowMaxWidth: 768,
  /** Scroll that the sequence takes, in viewport heights. */
  scrollDistance: 2.4,
  /** Relative length of the three phases: pull back, hold, blur. */
  phases: { zoom: 5.2, hold: 1.2, blur: 1.6 },
  /** Length of the fade of the opening text, in the same units. */
  textFade: 2,
  blurPx: 10,
  /** Opacity of the planet once it is the backdrop of the information. */
  restOpacity: 0.6,
  /** Seconds the picture takes to catch up with the scroll. */
  scrubSeconds: 0.75,
  /** Drift of the planet, radians per second. The reference spins at 0.2; here the region stays in view. */
  spin: 0.012,
  /**
   * Tilt of the north pole toward the camera, in degrees. It starts tilted away, so the horizon of
   * the first frame lies over northern Mexico, and ends tilted forward, so North America faces the camera.
   */
  tiltStartDeg: -52,
  tiltEndDeg: 27,
  /** Meridian that faces the camera when the page opens, in degrees east. */
  lonStartDeg: -92,
  /** Radius of the atmosphere, as a multiple of the planet's. */
  atmosphere: 1.13,
  skyDay: '#4a96e8',
  skyDusk: '#1950e5',
  /** Height of the camera in the still version (for people who ask for less motion), on wide screens. */
  stillCamY: 1.75,
  /** Direction of the sunlight, fixed with respect to the camera: from the left, above and in front. */
  sun: [-0.78, 0.3, 0.55] as Vec3
};

const DEG = Math.PI / 180;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Slow start and slow end. */
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** Fast start, slow end. */
export const easeOut = (t: number) => 1 - (1 - t) ** 2;

/** Where each phase ends, as a share of the sequence (0–1). */
export function phaseEnds(): { zoom: number; hold: number; text: number } {
  const { zoom, hold, blur } = EARTH.phases;
  const total = zoom + hold + blur;
  return { zoom: zoom / total, hold: (zoom + hold) / total, text: EARTH.textFade / total };
}

export interface Shot {
  /** Camera position. */
  cam: Vec3;
  /** Tilt of the north pole toward the camera, radians. */
  tilt: number;
  /** Opening text: 1 visible, 0 gone. */
  text: number;
  /** Blur of the planet layer, in CSS pixels. */
  blur: number;
  /** Opacity of the planet layer. */
  opacity: number;
  /** 1 while the planet drifts, 0 once it rests behind the information. */
  drift: number;
}

/** The picture at a point of the sequence: `p` is 0 at the top of the page and 1 where it ends. */
export function shotAt(p: number, narrow: boolean): Shot {
  const q = clamp01(p);
  const ends = phaseEnds();
  const z = easeInOut(clamp01(q / ends.zoom));
  const end = narrow ? EARTH.camEndNarrow : EARTH.camEndWide;
  const blur = clamp01((q - ends.hold) / (1 - ends.hold));
  return {
    cam: [lerp(EARTH.camStart[0], end[0], z), lerp(EARTH.camStart[1], end[1], z), lerp(EARTH.camStart[2], end[2], z)],
    tilt: lerp(EARTH.tiltStartDeg, EARTH.tiltEndDeg, z) * DEG,
    text: 1 - easeOut(clamp01(q / ends.text)),
    blur: EARTH.blurPx * blur,
    opacity: lerp(1, EARTH.restOpacity, blur),
    drift: 1 - blur
  };
}

/**
 * The picture for people who ask for less motion: no pull-back and no drift. The whole Earth is in
 * view from the start and only softens as the information scrolls over it (`p` = share of the first
 * screen already scrolled).
 */
export function stillShotAt(p: number, narrow: boolean): Shot {
  const end = shotAt(1, narrow);
  const blur = clamp01(p);
  // The camera sits higher than at the end of the sequence: the planet rests low on the screen,
  // like a horizon, and leaves the opening text on a clear background.
  const cam: Vec3 = [end.cam[0], EARTH.stillCamY * (end.cam[2] / EARTH.camEndWide[2]), end.cam[2]];
  return { ...end, cam, text: 1, blur: EARTH.blurPx * blur, opacity: lerp(1, EARTH.restOpacity, blur), drift: 0 };
}

/** Share of the sequence already scrolled. `trackTop` and `trackHeight` are in page pixels. */
export function progressAt(scrollY: number, trackTop: number, trackHeight: number, viewport: number): number {
  const span = trackHeight - viewport;
  return span > 0 ? clamp01((scrollY - trackTop) / span) : scrollY > trackTop ? 1 : 0;
}

/** One step of the picture catching up with the scroll: after `scrubSeconds` it has covered 98 % of the gap. */
export function approach(current: number, target: number, dtSeconds: number, scrubSeconds = EARTH.scrubSeconds): number {
  if (scrubSeconds <= 0 || dtSeconds <= 0) return dtSeconds <= 0 ? current : target;
  const next = current + (target - current) * (1 - Math.exp((-4 * dtSeconds) / scrubSeconds));
  return Math.abs(target - next) < 0.0005 ? target : next;
}

/** Spin angle (radians) that puts the meridian `lonDeg` in front of the camera. */
export function spinForLon(lonDeg: number): number {
  return -(lonDeg + 90) * DEG;
}
