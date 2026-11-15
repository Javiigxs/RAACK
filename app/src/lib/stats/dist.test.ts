import { describe, expect, it } from 'vitest';
import { betai, erfc, mulberry32, normCdf, normInv, normTwoSidedP, roundHalfEven, tInv, tTwoSidedP } from './dist';

describe('distribuciones', () => {
  it('normal: valores de tabla', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 7);
    expect(normCdf(1.959964)).toBeCloseTo(0.975, 6);
    expect(normCdf(-1.281552)).toBeCloseTo(0.1, 6);
    expect(normTwoSidedP(1.959964)).toBeCloseTo(0.05, 6);
    expect(normTwoSidedP(3.290527)).toBeCloseTo(0.001, 6);
    expect(erfc(0)).toBeCloseTo(1, 6);
  });
  it('cuantil de la normal', () => {
    expect(normInv(0.975)).toBeCloseTo(1.959964, 5);
    expect(normInv(0.9)).toBeCloseTo(1.281552, 5);
    expect(normInv(0.5)).toBeCloseTo(0, 6);
    expect(normInv(0.001)).toBeCloseTo(-3.090232, 5);
  });
  it('t de Student: valores de tabla', () => {
    expect(tTwoSidedP(2.228139, 10)).toBeCloseTo(0.05, 5);
    expect(tTwoSidedP(2.570582, 5)).toBeCloseTo(0.05, 5);
    expect(tTwoSidedP(2.042272, 30)).toBeCloseTo(0.05, 5);
    expect(tTwoSidedP(63.656741, 1)).toBeCloseTo(0.01, 5);
    expect(tInv(0.975, 10)).toBeCloseTo(2.228139, 4);
    expect(tInv(0.975, 21)).toBeCloseTo(2.079614, 4);
    expect(tInv(0.025, 21)).toBeCloseTo(-2.079614, 4);
    // Grados de libertad no enteros: entre los dos enteros vecinos.
    const a = tInv(0.975, 10.5);
    expect(a).toBeLessThan(tInv(0.975, 10));
    expect(a).toBeGreaterThan(tInv(0.975, 11));
  });
  it('beta incompleta', () => {
    expect(betai(2, 3, 0.5)).toBeCloseTo(0.6875, 8);
    expect(betai(0.5, 0.5, 0.5)).toBeCloseTo(0.5, 8);
  });
  it('utilidades', () => {
    const r = mulberry32(1);
    const s = mulberry32(1);
    expect(r()).toBe(s());
    expect(roundHalfEven(2.5)).toBe(2);
    expect(roundHalfEven(3.5)).toBe(4);
    expect(roundHalfEven(2.4)).toBe(2);
  });
});
