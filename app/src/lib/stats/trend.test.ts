import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mulberry32, normInv } from './dist';
import { rainIndicator, rainYears, refDayOfYear } from './rain';
import { annualFromMonthly, anomalies, climatology, monthlyFromDaily } from './series';
import { analyzeTrend, judge, yearsToDetect } from './trend';

const data = JSON.parse(readFileSync(new URL('../../../public/data/monterrey.json', import.meta.url), 'utf8'));

describe('tendencia: casos de libro', () => {
  it('Mann–Kendall en una serie estrictamente creciente', () => {
    const t = Array.from({ length: 10 }, (_, i) => 2000 + i);
    const y = t.map((_, i) => i + 1);
    const r = analyzeTrend(t, y, { perYear: 1, bootstrap: 0, autocorr: false });
    expect(r.mk.s).toBe(45);
    expect(r.mk.varS).toBeCloseTo(125, 10);
    expect(r.mk.z).toBeCloseTo(44 / Math.sqrt(125), 10);
    expect(r.mk.p).toBeCloseTo(8.3e-5, 5);
    expect(r.sen.slope).toBeCloseTo(1, 12);
    expect(r.ols.slope).toBeCloseTo(1, 12);
    expect(r.mk.tau).toBeCloseTo(1, 12);
  });

  it('empates reducen la varianza de S', () => {
    const y = [1, 1, 2, 2, 3, 3, 4, 4];
    const t = y.map((_, i) => i);
    const r = analyzeTrend(t, y, { perYear: 1, bootstrap: 0, autocorr: false });
    // n=8, cuatro grupos de 2 empates: (8·7·21 − 4·2·1·9)/18 = (1176 − 72)/18
    expect(r.mk.varS).toBeCloseTo((1176 - 72) / 18, 10);
    expect(r.mk.s).toBe(24);
  });

  it('recupera la pendiente y el intervalo de mínimos cuadrados', () => {
    // Ejemplo calculable a mano: y = 2t + (−1, +1, −1, +1, ...)
    const t = Array.from({ length: 12 }, (_, i) => i);
    const y = t.map((x, i) => 2 * x + (i % 2 ? 1 : -1));
    const r = analyzeTrend(t, y, { perYear: 1, bootstrap: 0, autocorr: false });
    const tbar = 5.5;
    const sxx = t.reduce((s, x) => s + (x - tbar) ** 2, 0);
    const sxy = t.reduce((s, x, i) => s + (x - tbar) * y[i], 0);
    expect(r.ols.slope).toBeCloseTo(sxy / sxx, 12);
    expect(r.ols.df).toBe(10);
    expect(r.ols.p).toBeLessThan(1e-6);
    expect(r.ols.ci[0]).toBeLessThan(r.ols.slope);
    expect(r.ols.ci[1]).toBeGreaterThan(r.ols.slope);
  });

  it('ruido blanco sin tendencia: rara vez declara tendencia (≈5 %)', () => {
    const rand = mulberry32(7);
    const gauss = () => normInv(Math.min(Math.max(rand(), 1e-9), 1 - 1e-9));
    let falsePositives = 0;
    const N = 400;
    for (let k = 0; k < N; k++) {
      const t = Array.from({ length: 120 }, (_, i) => 2000 + (i + 0.5) / 12);
      const y = t.map(() => gauss());
      const r = analyzeTrend(t, y, { perYear: 12, bootstrap: 200, seed: k });
      if (judge(r, { minYears: 5, minCoverage: 0.5 }).level === 'strong') falsePositives++;
    }
    expect(falsePositives / N).toBeLessThan(0.08);
  });

  it('ruido con memoria: la corrección evita falsas alarmas', () => {
    const rand = mulberry32(11);
    const gauss = () => normInv(Math.min(Math.max(rand(), 1e-9), 1 - 1e-9));
    let naive = 0;
    let corrected = 0;
    const N = 300;
    for (let k = 0; k < N; k++) {
      const t = Array.from({ length: 300 }, (_, i) => 2000 + (i + 0.5) / 12);
      const y: number[] = [];
      let prev = 0;
      for (let i = 0; i < 300; i++) {
        prev = 0.7 * prev + gauss();
        y.push(prev);
      }
      if (analyzeTrend(t, y, { perYear: 12, bootstrap: 0, autocorr: false }).mk.p < 0.05) naive++;
      if (analyzeTrend(t, y, { perYear: 12, bootstrap: 0 }).mk.p < 0.05) corrected++;
    }
    // Sin corregir, la tasa de falsas alarmas se dispara; corregida, queda cerca del 5 %.
    expect(naive / N).toBeGreaterThan(0.2);
    expect(corrected / N).toBeLessThan(0.1);
  });

  it('años para detectar: la potencia simulada ronda el 90 %', () => {
    const sigma = 1;
    const slope = 0.05; // por año
    const phi = 0.3;
    const years = yearsToDetect(sigma * Math.sqrt(1 / (1 - phi * phi)), slope, phi, 12)!;
    expect(years).toBeGreaterThan(10);
    const rand = mulberry32(3);
    const gauss = () => normInv(Math.min(Math.max(rand(), 1e-9), 1 - 1e-9));
    const n = Math.round(years * 12);
    let detected = 0;
    const N = 300;
    for (let k = 0; k < N; k++) {
      const t = Array.from({ length: n }, (_, i) => (i + 0.5) / 12);
      const y: number[] = [];
      let prev = 0;
      for (let i = 0; i < n; i++) {
        prev = phi * prev + sigma * gauss();
        y.push(prev + slope * t[i]);
      }
      if (analyzeTrend(t, y, { perYear: 12, bootstrap: 0 }).ols.p < 0.05) detected++;
    }
    expect(detected / N).toBeGreaterThan(0.8);
    expect(detected / N).toBeLessThan(0.97);
  });

  it('pocos datos: no opina', () => {
    const r = analyzeTrend([1, 2, 3], [1, null, 3], { perYear: 1 });
    expect(r.ok).toBe(false);
    expect(judge(r, { minYears: 15, minCoverage: 0.8 }).level).toBe('insufficient');
  });
});

describe('lluvia de Monterrey: coincide con el análisis del repositorio (SciPy)', () => {
  const years = rainYears(data.daily.imerg_mm, data.daily.start, 2002, 2024);
  const byYear = Object.fromEntries(years.map((y) => [y.year, y]));

  it('indicadores de 2016 y 2020 (docs/MAPA_DE_DATOS.md)', () => {
    const a = byYear[2016];
    const b = byYear[2020];
    expect(a.total).toBeCloseTo(806.12, 2);
    expect(b.total).toBeCloseTo(795.55, 2);
    expect(a.wetDays).toBe(89);
    expect(b.wetDays).toBe(62);
    expect(a.intensity).toBeCloseTo(8.78, 2);
    expect(b.intensity).toBeCloseTo(12.62, 2);
    expect(a.top5Share).toBeCloseTo(28.5, 1);
    expect(b.top5Share).toBeCloseTo(51.7, 1);
    expect(a.maxDrySpell).toBe(53);
    expect(b.maxDrySpell).toBe(67);
    expect(a.spread2080).toBe(132);
    expect(b.spread2080).toBe(46);
    // 14 de agosto de 2016 (bisiesto) = día 227; 26 de julio de 2020 (bisiesto) = día 208.
    expect(refDayOfYear(2016, a.day50!)).toBe(227);
    expect(refDayOfYear(2020, b.day50!)).toBe(208);
  });

  it('23 años completos de IMERG', () => {
    expect(years.length).toBe(23);
    expect(years.every((y) => y.complete)).toBe(true);
  });

  it('tendencia de la concentración en cinco días: +0,52 puntos por década, IC −4,06 a +6,33', () => {
    const t = years.map((y) => y.year);
    const v = years.map((y) => rainIndicator(y, 'top5Share'));
    const r = analyzeTrend(t, v, { perYear: 1, bootstrap: 0, autocorr: false });
    expect(r.sen.slope * 10).toBeCloseTo(0.52, 2);
    expect(r.sen.ci[0] * 10).toBeCloseTo(-4.06, 2);
    expect(r.sen.ci[1] * 10).toBeCloseTo(6.33, 2);
    expect(Math.abs(r.mk.p - 0.794)).toBeLessThan(0.03);
  });

  it('tendencia de la fecha del 50 %: −7,5 días por década, IC −29,2 a +13,3', () => {
    const t = years.map((y) => y.year);
    const v = years.map((y) => rainIndicator(y, 'day50'));
    const r = analyzeTrend(t, v, { perYear: 1, bootstrap: 0, autocorr: false });
    expect(r.sen.slope * 10).toBeCloseTo(-7.5, 1);
    expect(r.sen.ci[0] * 10).toBeCloseTo(-29.2, 1);
    expect(r.sen.ci[1] * 10).toBeCloseTo(13.3, 1);
    expect(Math.abs(r.mk.p - 0.46)).toBeLessThan(0.03);
  });

  it('series mensuales: totales, climatología y anomalías', () => {
    const m = monthlyFromDaily(data.daily.imerg_mm, data.daily.start, 'sum');
    expect(m.y0).toBe(2002);
    expect(m.values.length).toBe(23 * 12);
    const annual = annualFromMonthly(m, 'sum');
    expect(annual.find((a) => a.year === 2016)!.value).toBeCloseTo(806.12, 2);
    // Junio de 2024: 366,81 mm (docs/LLUVIA_MONTERREY.md)
    expect(m.values[(2024 - 2002) * 12 + 5]).toBeCloseTo(366.81, 2);
    const clim = climatology(m.values);
    const an = anomalies(m.values, clim);
    const mean = an.reduce((s: number, x) => s + (x ?? 0), 0) / an.length;
    expect(Math.abs(mean)).toBeLessThan(1e-9);
  });
});
