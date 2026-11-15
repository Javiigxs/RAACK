// Del archivo de datos al resultado que muestra cada sección de la página.
// Todo se calcula en el navegador: nada llega ya «cocinado».
// Código escrito con ayuda de IA (Claude) para el equipo RAACK.

import { MODIS_SITES, RULES, VARS, type Quality, type SiteId, type VarId } from './catalog';
import { rainIndicator, rainYears, type RainIndicatorId, type RainYear } from './stats/rain';
import {
  annualFromMonthly,
  anomalies,
  calendarMonthSeries,
  climatology,
  countValid,
  monthlyFromComposites,
  monthlyFromDaily,
  monthlyTimes,
  sliceMonthly,
  type AnnualValue,
  type Monthly
} from './stats/series';
import { analyzeTrend, judge, type TrendResult, type Verdict } from './stats/trend';
import type { CaseData, Num } from './types';

/** Filtro de calidad de MOD11A2 a partir de su campo de bits QC. */
function lstKeep(qc: Num[], q: Quality): (i: number) => boolean {
  return (i) => {
    const v = qc[i];
    if (v === null || v === undefined) return false;
    if (q === 'strict') return v === 0; // buena calidad, sin más que revisar
    const mandatory = v & 3; // 0 buena, 1 otra calidad, 2–3 no producida
    const lstError = (v >> 6) & 3; // 0: ≤1 K, 1: ≤2 K, 2: ≤3 K, 3: >3 K
    return mandatory <= 1 && lstError <= 1;
  };
}

/** Serie mensual completa de una variable en un lugar, con el filtro de calidad elegido. */
export function buildMonthly(data: CaseData, varId: VarId, site: SiteId, quality: Quality): Monthly {
  const d = data.daily;
  switch (varId) {
    case 'rain':
      return site === 'station'
        ? monthlyFromDaily(d.smn_mm, d.start, 'sum', 0.9)
        : monthlyFromDaily(d.imerg_mm, d.start, 'sum', 1);
    case 'airMax':
      return monthlyFromDaily(d.smn_tmax, d.start, 'mean', 0.8);
    case 'airMin':
      return monthlyFromDaily(d.smn_tmin, d.start, 'mean', 0.8);
    case 'soil':
      // De fracción 0–1 a porcentaje de saturación.
      return { y0: data.soil.y0, values: data.soil.values.map((v) => (v === null ? null : v * 100)) };
    case 'lstDay': {
      const s = data.lst.sites[site];
      return monthlyFromComposites(data.lst.dates, s.day, lstKeep(s.qcDay, quality), 2);
    }
    case 'lstNight': {
      const s = data.lst.sites[site];
      return monthlyFromComposites(data.lst.dates, s.night, lstKeep(s.qcNight, quality), 2);
    }
    case 'ndvi': {
      const s = data.ndvi.sites[site];
      const values = s.ndvi.map((v, i) => {
        const rel = s.rel[i];
        if (v === null || rel === null || v < -0.2 || v > 1) return null;
        return quality === 'strict' ? (rel === 0 ? v : null) : rel <= 1 ? v : null;
      });
      return { y0: data.ndvi.y0, values };
    }
  }
}

export interface SeriesAnalysis {
  varId: VarId;
  site: SiteId;
  y0: number;
  y1: number;
  deseason: boolean;
  /** Valores mensuales originales del periodo. */
  monthly: Monthly;
  times: number[];
  clim: Num[];
  /** Lo que se dibuja y se analiza: anomalías (sin ciclo estacional) o valores originales. */
  plotted: Num[];
  annual: AnnualValue[];
  trend: TrendResult;
  verdict: Verdict;
  nValid: number;
  nTotal: number;
  coverage: number;
  /** Media de los valores originales del periodo. */
  mean: number | null;
  /** Ritmo de cambio por década en la unidad de presentación de la variable. */
  perDecade: number;
  ci: [number, number];
  olsPerDecade: number;
  olsCi: [number, number];
  bootCi: [number, number] | null;
}

/** Analiza una variable en un lugar y un periodo. */
export function analyzeSeries(
  data: CaseData,
  varId: VarId,
  site: SiteId,
  quality: Quality,
  y0: number,
  y1: number,
  deseason: boolean,
  bootstrap = 2000
): SeriesAnalysis {
  const def = VARS[varId];
  const monthly = sliceMonthly(buildMonthly(data, varId, site, quality), y0, y1);
  const times = monthlyTimes(monthly);
  const clim = climatology(monthly.values);
  const plotted = deseason ? anomalies(monthly.values, clim) : monthly.values;
  const trend = analyzeTrend(times, plotted, { perYear: 12, bootstrap });
  const verdict = judge(trend, RULES);
  const nValid = countValid(plotted);
  const nTotal = plotted.length;
  let sum = 0;
  let cnt = 0;
  for (const v of monthly.values) {
    if (v !== null) {
      sum += v;
      cnt++;
    }
  }
  const k = 10 * def.trendScale;
  return {
    varId,
    site,
    y0: monthly.y0,
    y1: monthly.y0 + Math.floor(nTotal / 12) - 1,
    deseason,
    monthly,
    times,
    clim,
    plotted,
    annual: annualFromMonthly({ y0: monthly.y0, values: plotted }, 'mean', 10),
    trend,
    verdict,
    nValid,
    nTotal,
    coverage: nTotal ? nValid / nTotal : 0,
    mean: cnt ? sum / cnt : null,
    perDecade: trend.sen.slope * k,
    ci: [trend.sen.ci[0] * k, trend.sen.ci[1] * k],
    olsPerDecade: trend.ols.slope * k,
    olsCi: [trend.ols.ci[0] * k, trend.ols.ci[1] * k],
    bootCi: trend.boot ? [trend.boot.ci[0] * k, trend.boot.ci[1] * k] : null
  };
}

export interface MonthTrend {
  month: number;
  n: number;
  perDecade: number | null;
  ci: [number, number] | null;
  verdict: Verdict;
  trend: TrendResult;
}

/** Tendencia de cada mes del calendario por separado: ¿en qué meses se concentra el cambio? */
export function monthTrends(monthly: Monthly): MonthTrend[] {
  const out: MonthTrend[] = [];
  for (let m = 0; m < 12; m++) {
    const { years, values } = calendarMonthSeries(monthly, m);
    const trend = analyzeTrend(years, values, { perYear: 1, bootstrap: 1000, seed: 100 + m });
    const verdict = judge(trend, RULES);
    out.push({
      month: m,
      n: trend.n,
      perDecade: trend.ok ? trend.sen.slope * 10 : null,
      ci: trend.ok ? [trend.sen.ci[0] * 10, trend.sen.ci[1] * 10] : null,
      verdict,
      trend
    });
  }
  return out;
}

export interface WindowCell {
  start: number;
  end: number;
  years: number;
  perDecade: number | null;
  p: number | null;
  significant: boolean;
  enough: boolean;
}

export interface WindowScan {
  cells: WindowCell[];
  yMin: number;
  yMax: number;
  maxAbs: number;
  minYears: number;
}

/**
 * Coartada del periodo: la misma prueba para todas las combinaciones de año inicial y final.
 * Deja ver si el resultado depende de dónde se empieza a contar.
 */
export function windowScan(
  data: CaseData,
  varId: VarId,
  site: SiteId,
  quality: Quality,
  deseason: boolean,
  minYears = 10
): WindowScan {
  const def = VARS[varId];
  const full = sliceMonthly(buildMonthly(data, varId, site, quality), def.y0, def.y1);
  const times = monthlyTimes(full);
  const plotted = deseason ? anomalies(full.values, climatology(full.values)) : full.values;
  const yMin = full.y0;
  const yMax = full.y0 + Math.floor(full.values.length / 12) - 1;
  const cells: WindowCell[] = [];
  let maxAbs = 0;
  const k = 10 * def.trendScale;
  for (let a = yMin; a <= yMax - minYears + 1; a++) {
    for (let b = a + minYears - 1; b <= yMax; b++) {
      const i0 = (a - yMin) * 12;
      const i1 = (b - yMin + 1) * 12;
      const tr = analyzeTrend(times.slice(i0, i1), plotted.slice(i0, i1), { perYear: 12, bootstrap: 0 });
      const enough = tr.ok && tr.n / (i1 - i0) >= RULES.minCoverage;
      const perDecade = tr.ok ? tr.sen.slope * k : null;
      if (enough && perDecade !== null) maxAbs = Math.max(maxAbs, Math.abs(perDecade));
      cells.push({
        start: a,
        end: b,
        years: b - a + 1,
        perDecade,
        p: tr.ok ? tr.mk.p : null,
        significant: enough && tr.votes.t && tr.votes.mk,
        enough
      });
    }
  }
  return { cells, yMin, yMax, maxAbs, minYears };
}

export interface SiteResult {
  site: SiteId;
  analysis: SeriesAnalysis;
}

/** La misma prueba en los cinco puntos MODIS. */
export function compareSites(
  data: CaseData,
  varId: VarId,
  quality: Quality,
  y0: number,
  y1: number,
  deseason: boolean
): SiteResult[] {
  return MODIS_SITES.map((site) => ({
    site,
    analysis: analyzeSeries(data, varId, site, quality, y0, y1, deseason, 1000)
  }));
}

/** Busca dos lugares con tendencias opuestas y con pruebas (lo que describe el enunciado del reto). */
export function oppositeTwins(results: SiteResult[]): { up: SiteResult; down: SiteResult } | null {
  const solid = results.filter((r) => r.analysis.verdict.level === 'strong' || r.analysis.verdict.level === 'some');
  const ups = solid.filter((r) => r.analysis.verdict.direction > 0).sort((a, b) => b.analysis.perDecade - a.analysis.perDecade);
  const downs = solid.filter((r) => r.analysis.verdict.direction < 0).sort((a, b) => a.analysis.perDecade - b.analysis.perDecade);
  return ups.length && downs.length ? { up: ups[0], down: downs[0] } : null;
}

export const RAIN_INDICATORS: RainIndicatorId[] = [
  'total',
  'wetDays',
  'intensity',
  'top5Share',
  'max1Day',
  'maxDrySpell',
  'day50',
  'spread2080'
];

export interface IndicatorTrend {
  id: RainIndicatorId;
  years: number[];
  values: Num[];
  mean: number | null;
  trend: TrendResult;
  verdict: Verdict;
  perDecade: number | null;
  ci: [number, number] | null;
}

export interface RainInside {
  source: 'imerg' | 'smn';
  years: RainYear[];
  completeYears: number;
  indicators: IndicatorTrend[];
}

/** «Lo que esconde el año»: indicadores anuales de la lluvia diaria y su tendencia. */
export function rainInside(data: CaseData, source: 'imerg' | 'smn', y0: number, y1: number): RainInside {
  const daily = source === 'imerg' ? data.daily.imerg_mm : data.daily.smn_mm;
  const years = rainYears(daily, data.daily.start, y0, y1);
  const t = years.map((y) => y.year);
  const indicators = RAIN_INDICATORS.map((id, k) => {
    const values = years.map((y) => rainIndicator(y, id));
    // Los años se tratan como independientes, igual que en el análisis con SciPy del repositorio:
    // con una veintena de valores la memoria entre años no se puede estimar con fiabilidad.
    const trend = analyzeTrend(t, values, { perYear: 1, bootstrap: 2000, seed: 500 + k, autocorr: false });
    const valid = values.filter((v): v is number => v !== null);
    return {
      id,
      years: t,
      values,
      mean: valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : null,
      trend,
      verdict: judge(trend, RULES),
      perDecade: trend.ok ? trend.sen.slope * 10 : null,
      ci: trend.ok ? ([trend.sen.ci[0] * 10, trend.sen.ci[1] * 10] as [number, number]) : null
    };
  });
  return { source, years, completeYears: years.filter((y) => y.complete).length, indicators };
}

export interface RainWitness {
  /** Meses con dato en las dos fuentes. */
  n: number;
  /** Correlación de los totales mensuales. */
  r: number | null;
  /** Diferencia media satélite − pluviómetro (mm por mes). */
  bias: number | null;
  pairs: { t: number; sat: number; gauge: number }[];
}

/** Segundo testigo de la lluvia: celda del satélite frente al pluviómetro. */
export function rainWitness(data: CaseData, y0: number, y1: number): RainWitness {
  const sat = sliceMonthly(buildMonthly(data, 'rain', 'cell', 'standard'), y0, y1);
  const gauge = sliceMonthly(buildMonthly(data, 'rain', 'station', 'standard'), y0, y1);
  const times = monthlyTimes(sat);
  const pairs: RainWitness['pairs'] = [];
  for (let i = 0; i < sat.values.length; i++) {
    const a = sat.values[i];
    const b = gauge.values[i];
    if (a !== null && b !== null && b !== undefined) pairs.push({ t: times[i], sat: a, gauge: b });
  }
  const n = pairs.length;
  if (n < 3) return { n, r: null, bias: null, pairs };
  const ma = pairs.reduce((s, p) => s + p.sat, 0) / n;
  const mb = pairs.reduce((s, p) => s + p.gauge, 0) / n;
  let sab = 0;
  let saa = 0;
  let sbb = 0;
  for (const p of pairs) {
    sab += (p.sat - ma) * (p.gauge - mb);
    saa += (p.sat - ma) ** 2;
    sbb += (p.gauge - mb) ** 2;
  }
  return { n, r: saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : null, bias: ma - mb, pairs };
}

export interface TwinPair {
  a: number;
  b: number;
  /** Diferencia relativa de los totales anuales (0–1). */
  totalGap: number;
  /** Indicador que más separa a los dos años y cuántas desviaciones típicas los separan. */
  clue: RainIndicatorId;
  score: number;
}

/**
 * «Años gemelos»: parejas con casi la misma lluvia total y un interior muy distinto.
 * La puntuación suma, para cada pista oculta, cuántas desviaciones típicas separan a los dos años.
 */
export function twinYears(years: RainYear[], tolerance = 0.02): TwinPair[] {
  const complete = years.filter((y) => y.complete && (y.total ?? 0) > 0);
  const clues: RainIndicatorId[] = ['top5Share', 'wetDays', 'maxDrySpell', 'day50', 'intensity'];
  const sd: Partial<Record<RainIndicatorId, number>> = {};
  for (const c of clues) {
    const v = complete.map((y) => rainIndicator(y, c)).filter((x): x is number => x !== null);
    const mean = v.reduce((s, x) => s + x, 0) / Math.max(v.length, 1);
    sd[c] = Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(v.length - 1, 1)) || 1;
  }
  const out: TwinPair[] = [];
  for (let i = 0; i < complete.length; i++) {
    for (let j = i + 1; j < complete.length; j++) {
      const A = complete[i];
      const B = complete[j];
      const gap = Math.abs(A.total! - B.total!) / ((A.total! + B.total!) / 2);
      if (gap > tolerance) continue;
      let score = 0;
      let best: RainIndicatorId = clues[0];
      let bestZ = -1;
      for (const c of clues) {
        const va = rainIndicator(A, c);
        const vb = rainIndicator(B, c);
        if (va === null || vb === null) continue;
        const z = Math.abs(va - vb) / sd[c]!;
        score += z;
        if (z > bestZ) {
          bestZ = z;
          best = c;
        }
      }
      out.push({ a: A.year, b: B.year, totalGap: gap, clue: best, score });
    }
  }
  return out.sort((p, q) => q.score - p.score);
}

export interface StepCheck {
  /** Primer año del segundo tramo. */
  year: number;
  /** Salto entre la media de antes y la de después. */
  jump: number;
  /** Error del modelo «escalón» dividido por el de la recta: menos de 1 favorece al escalón. */
  ratio: number;
}

/**
 * ¿Recta o escalón? Compara una recta con dos niveles separados por un salto.
 * Si el escalón ajusta claramente mejor, el «por década» resume mal lo ocurrido.
 */
export function stepCheck(annual: AnnualValue[], minSide = 4): StepCheck | null {
  const pts = annual.filter((d) => d.value !== null) as { year: number; value: number }[];
  const n = pts.length;
  if (n < 2 * minSide + 2) return null;
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const tbar = mean(pts.map((p) => p.year));
  const ybar = mean(pts.map((p) => p.value));
  let sxx = 0;
  let sxy = 0;
  for (const p of pts) {
    sxx += (p.year - tbar) ** 2;
    sxy += (p.year - tbar) * (p.value - ybar);
  }
  const b = sxy / sxx;
  const sseLine = pts.reduce((s, p) => s + (p.value - (ybar + b * (p.year - tbar))) ** 2, 0);
  let best: StepCheck | null = null;
  for (let k = minSide; k <= n - minSide; k++) {
    const left = pts.slice(0, k).map((p) => p.value);
    const right = pts.slice(k).map((p) => p.value);
    const ml = mean(left);
    const mr = mean(right);
    const sse = left.reduce((s, v) => s + (v - ml) ** 2, 0) + right.reduce((s, v) => s + (v - mr) ** 2, 0);
    const ratio = sseLine > 0 ? sse / sseLine : 1;
    if (!best || ratio < best.ratio) best = { year: pts[k].year, jump: mr - ml, ratio };
  }
  return best;
}
