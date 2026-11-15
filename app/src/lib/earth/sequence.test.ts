// The opening sequence: where each phase ends and what the picture is at every point of the scroll.
// Code written with AI assistance (Claude) for team RAACK.
import { describe, expect, it } from 'vitest';
import { EARTH, approach, clamp01, easeInOut, easeOut, phaseEnds, progressAt, shotAt, spinForLon, stillShotAt } from './sequence';

describe('opening sequence', () => {
  it('has three phases in order: pull back, hold, blur', () => {
    const ends = phaseEnds();
    expect(ends.zoom).toBeGreaterThan(0);
    expect(ends.hold).toBeGreaterThan(ends.zoom);
    expect(ends.hold).toBeLessThan(1);
    expect(ends.text).toBeLessThan(ends.zoom);
  });

  it('starts at the horizon, sharp, and ends with the whole planet blurred behind the page', () => {
    const start = shotAt(0, false);
    expect(start.cam).toEqual(EARTH.camStart);
    expect(start.blur).toBe(0);
    expect(start.opacity).toBe(1);
    expect(start.text).toBe(1);
    expect(start.drift).toBe(1);
    const end = shotAt(1, false);
    end.cam.forEach((v, i) => expect(v).toBeCloseTo(EARTH.camEndWide[i], 12));
    expect(end.blur).toBe(EARTH.blurPx);
    expect(end.opacity).toBeCloseTo(EARTH.restOpacity, 12);
    expect(end.text).toBe(0);
    expect(end.drift).toBe(0);
    shotAt(1, true).cam.forEach((v, i) => expect(v).toBeCloseTo(EARTH.camEndNarrow[i], 12));
  });

  it('holds: no blur until the hold is over, and the camera stops when the pull-back ends', () => {
    const ends = phaseEnds();
    expect(shotAt(ends.hold, false).blur).toBe(0);
    shotAt(ends.zoom, false).cam.forEach((v, i) => expect(v).toBeCloseTo(shotAt(ends.hold, false).cam[i], 12));
    expect(shotAt(-1, false)).toEqual(shotAt(0, false));
    expect(shotAt(2, false)).toEqual(shotAt(1, false));
  });

  it('the still version shows the whole planet from the start and only softens', () => {
    const a = stillShotAt(0, false);
    const b = stillShotAt(1, false);
    expect(a.cam).toEqual(b.cam);
    expect(a.cam[2]).toBeCloseTo(EARTH.camEndWide[2], 12);
    expect(a.blur).toBe(0);
    expect(b.blur).toBe(EARTH.blurPx);
    expect(a.drift).toBe(0);
    expect(a.text).toBe(1);
  });

  it('reads the progress from the scroll', () => {
    expect(progressAt(0, 0, 3400, 1000)).toBe(0);
    expect(progressAt(1200, 0, 3400, 1000)).toBe(0.5);
    expect(progressAt(5000, 0, 3400, 1000)).toBe(1);
    // A track no taller than the screen has nothing to scrub.
    expect(progressAt(10, 0, 800, 1000)).toBe(1);
    expect(progressAt(0, 0, 800, 1000)).toBe(0);
  });

  it('catches up with the scroll without overshooting', () => {
    let v = 0;
    for (let i = 0; i < 45; i++) {
      const next = approach(v, 1, 1 / 60);
      expect(next).toBeGreaterThanOrEqual(v);
      expect(next).toBeLessThanOrEqual(1);
      v = next;
    }
    // After the scrub time it has covered 98 % of the way.
    expect(v).toBeGreaterThan(0.97);
    expect(approach(0.99995, 1, 1 / 60)).toBe(1);
    expect(approach(0.3, 1, 0)).toBe(0.3);
  });

  it('eases and clamps', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 12);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(2)).toBe(1);
  });

  it('turns the planet so that a meridian faces the camera', () => {
    expect(spinForLon(-90)).toBeCloseTo(0, 12);
    expect(spinForLon(0) - spinForLon(90)).toBeCloseTo(Math.PI / 2, 12);
  });
});
