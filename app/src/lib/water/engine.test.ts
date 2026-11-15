// The browser engine must give the same numbers as the Python reference stored in water.json
// (pymannkendall for Hamed–Rao and Sen, statsmodels for least squares with Newey–West errors).
// Code written with AI assistance (Claude) for team RAACK.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { clip, rankAverage, storageVsRain, waterTrend, WATER_RULES } from './engine';
import type { RefTrend, WaterData } from './types';

const data = JSON.parse(readFileSync(new URL('../../../public/data/water.json', import.meta.url), 'utf8')) as WaterData;

/** Relative closeness, with an absolute floor for values near zero. */
function close(got: number, want: number, rel = 1e-7, abs = 1e-9) {
  expect(Math.abs(got - want), `${got} vs ${want}`).toBeLessThanOrEqual(Math.max(abs, Math.abs(want) * rel));
}

function sameAsPython(got: ReturnType<typeof waterTrend>, want: RefTrend) {
  expect(got.n).toBe(want.n);
  expect(got.y0).toBe(want.y0);
  expect(got.y1).toBe(want.y1);
  close(got.mean, want.mean);
  close(got.sen, want.sen);
  close(got.senStep, want.senStep);
  expect(got.s).toBe(want.s);
  close(got.varS, want.varS, 1e-9, 1e-6);
  if (want.p === null) {
    expect(got.p).toBeNull();
  } else {
    expect(got.p).not.toBeNull();
    close(got.p as number, want.p, 1e-5, 1e-12);
    close(got.z as number, want.z as number);
  }
  close(got.ols, want.ols);
  close(got.lo, want.lo);
  close(got.hi, want.hi);
}

describe('motor del caso del agua frente a pymannkendall y statsmodels', () => {
  let checked = 0;
  for (const [regionId, region] of Object.entries(data.regions)) {
    for (const [sid, windows] of Object.entries(region.reference)) {
      it(`${regionId} · ${sid}: ${Object.keys(windows).length} periodos`, () => {
        for (const [win, want] of Object.entries(windows)) {
          const [a, b] = win.split('-').map(Number);
          const got = waterTrend(clip(region.series[sid], a, b));
          sameAsPython(got, want);
          // La etiqueta coincide siempre que el periodo cumpla la regla de años mínimos.
          if (got.label !== 'nodata') expect(got.label, `${sid} ${win}`).toBe(want.label);
          checked++;
        }
      });
    }
  }

  it('se comprobaron cientos de periodos', () => {
    expect(checked).toBeGreaterThan(400);
  });

  it('regresión del agua almacenada contra la lluvia', () => {
    const nl = data.regions.nl;
    for (const [rainId, windows] of Object.entries(nl.referenceResidual ?? {})) {
      for (const [win, want] of Object.entries(windows)) {
        const [a, b] = win === 'full' ? [-Infinity, Infinity] : win.split('-').map(Number);
        const fit = storageVsRain(clip(nl.series.tws_grace, a, b), nl.series[rainId]);
        expect(fit.ok).toBe(true);
        expect(fit.n).toBe(want.n);
        close(fit.r2, want.r2);
        close(fit.coef[1], want.coef[1]);
        close(fit.coef[2], want.coef[2]);
        close(fit.coef[0], want.coef[0], 1e-6);
        close(fit.trend.sen, want.residual.sen, 1e-6);
        close(fit.trend.senStep, want.residual.senStep, 1e-6);
        close(fit.trend.p as number, want.residual.p as number, 1e-4, 1e-12);
        close(fit.trend.lo, want.residual.lo, 1e-6);
        close(fit.trend.hi, want.residual.hi, 1e-6);
      }
    }
  });
});

describe('piezas del motor', () => {
  it('rangos con empates: comparten el rango medio', () => {
    expect(rankAverage([10, 20, 20, 5])).toEqual([2, 3.5, 3.5, 1]);
  });

  it('serie estrictamente creciente', () => {
    const years = Array.from({ length: 20 }, (_, i) => 2000 + i);
    const r = waterTrend({ years, values: years.map((_, i) => 3 + 2 * i) });
    expect(r.s).toBe(190);
    expect(r.sen).toBeCloseTo(2, 12);
    expect(r.ols).toBeCloseTo(2, 12);
    expect(r.label).toBe('confirmed');
    expect(r.dir).toBe(1);
  });

  it('con años que faltan, la pendiente se mide en años reales', () => {
    // Sube 1 por año, pero faltan 2005–2009: por paso parecería más inclinada.
    const years = [2000, 2001, 2002, 2003, 2004, 2010, 2011, 2012, 2013, 2014, 2015, 2016];
    const r = waterTrend({ years, values: years.map((y) => y - 2000) });
    expect(r.sen).toBeCloseTo(1, 12);
    expect(r.senStep).toBeGreaterThan(1);
    expect(r.ols).toBeCloseTo(1, 12);
  });

  it('menos años de los que pide la regla: no se opina', () => {
    const years = Array.from({ length: 9 }, (_, i) => 2010 + i);
    const r = waterTrend({ years, values: years.map((_, i) => i) });
    expect(r.label).toBe('nodata');
    expect(WATER_RULES.minSpan).toBe(15);
  });
});
