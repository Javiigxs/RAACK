// The water case: the two tests the team fixed, computed in the browser on yearly series.
//   1. Mann–Kendall with the Hamed–Rao (1998) variance correction, and Sen's slope.
//   2. Least squares with Newey–West errors (HAC, Bartlett kernel, 2 lags) and its 95% interval.
// It mirrors pymannkendall.hamed_rao_modification_test and statsmodels OLS(cov_type="HAC",
// maxlags=2); engine.test.ts checks it against both for every series of the data file.
// Code written with AI assistance (Claude) for team RAACK.

import { normTwoSidedP } from '../stats/dist';

export interface YearSeries {
  years: number[];
  values: number[];
}

/** confirmed: both tests agree · hint: only one · none: neither · nodata: too short to judge. */
export type Certainty = 'confirmed' | 'hint' | 'none' | 'nodata';

export interface WaterTrend {
  ok: boolean;
  n: number;
  y0: number;
  y1: number;
  mean: number;
  /** Sen's slope per year on the real time axis (the figure the page shows). */
  sen: number;
  /** Value of the Sen line at year 0: line(t) = senIntercept + sen · t. */
  senIntercept: number;
  /** Sen's slope per step of the series, as pymannkendall returns it (ignores missing years). */
  senStep: number;
  /** Hamed–Rao p-value; null when the corrected variance is not positive. */
  p: number | null;
  z: number | null;
  s: number;
  varS: number;
  /** Least-squares slope per year and its 95% Newey–West interval. */
  ols: number;
  lo: number;
  hi: number;
  mkSig: boolean;
  olsSig: boolean;
  label: Certainty;
  /** +1 rising, −1 falling, 0 flat. */
  dir: 1 | -1 | 0;
}

/** Rules for judging a yearly series at all: the team asks for at least 15 years. */
export const WATER_RULES = { minValues: 10, minSpan: 15, alpha: 0.05, hacLags: 2 };

const Z975 = 1.959963984540054;

const EMPTY: WaterTrend = {
  ok: false,
  n: 0,
  y0: NaN,
  y1: NaN,
  mean: NaN,
  sen: NaN,
  senIntercept: NaN,
  senStep: NaN,
  p: null,
  z: null,
  s: 0,
  varS: NaN,
  ols: NaN,
  lo: NaN,
  hi: NaN,
  mkSig: false,
  olsSig: false,
  label: 'nodata',
  dir: 0
};

function median(values: number[]): number {
  const v = Float64Array.from(values).sort();
  const n = v.length;
  if (!n) return NaN;
  const h = n >> 1;
  return n % 2 ? v[h] : (v[h - 1] + v[h]) / 2;
}

/** Ranks from 1, ties share the average rank (scipy.stats.rankdata, method "average"). */
export function rankAverage(x: number[]): number[] {
  const n = x.length;
  const order = x.map((v, i) => [v, i] as [number, number]).sort((a, b) => a[0] - b[0]);
  const ranks = new Array<number>(n);
  let k = 0;
  while (k < n) {
    let e = k;
    while (e + 1 < n && order[e + 1][0] === order[k][0]) e++;
    const r = (k + e) / 2 + 1;
    for (let q = k; q <= e; q++) ranks[order[q][1]] = r;
    k = e + 1;
  }
  return ranks;
}

/** Keeps the years of a series that fall inside [y0, y1]. */
export function clip(s: YearSeries, y0: number, y1: number): YearSeries {
  const years: number[] = [];
  const values: number[] = [];
  for (let i = 0; i < s.years.length; i++) {
    if (s.years[i] >= y0 && s.years[i] <= y1) {
      years.push(s.years[i]);
      values.push(s.values[i]);
    }
  }
  return { years, values };
}

/** The two tests on one yearly series. Slopes are per year. */
export function waterTrend(series: YearSeries, rules = WATER_RULES): WaterTrend {
  const t = series.years;
  const y = series.values;
  const n = y.length;
  if (n < 3) return { ...EMPTY, n };

  let ybar = 0;
  let tbar = 0;
  for (let i = 0; i < n; i++) {
    ybar += y[i];
    tbar += t[i];
  }
  ybar /= n;
  tbar /= n;

  // --- Mann–Kendall score, Sen's slope per step and on the real time axis
  let s = 0;
  const perStep: number[] = [];
  const perYear: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dy = y[j] - y[i];
      if (dy > 0) s++;
      else if (dy < 0) s--;
      perStep.push(dy / (j - i));
      perYear.push(dy / (t[j] - t[i]));
    }
  }
  const senStep = median(perStep);
  const sen = median(perYear);
  const senIntercept = median(y.map((v, i) => v - sen * t[i]));

  // Variance of S with the correction for ties
  const sorted = Float64Array.from(y).sort();
  let ties = 0;
  let run = 1;
  for (let k = 1; k <= n; k++) {
    if (k < n && sorted[k] === sorted[k - 1]) run++;
    else {
      if (run > 1) ties += run * (run - 1) * (2 * run + 5);
      run = 1;
    }
  }
  const var0 = (n * (n - 1) * (2 * n + 5) - ties) / 18;

  // Hamed–Rao: autocorrelation of the ranks of the detrended series, significant lags only
  const ranks = rankAverage(y.map((v, i) => v - (i + 1) * senStep));
  const rbar = (n + 1) / 2;
  let acov0 = 0;
  for (let i = 0; i < n; i++) acov0 += (ranks[i] - rbar) ** 2;
  const bound = Z975 / Math.sqrt(n);
  let sni = 0;
  if (acov0 > 0) {
    for (let k = 1; k < n; k++) {
      let c = 0;
      for (let i = 0; i + k < n; i++) c += (ranks[i] - rbar) * (ranks[i + k] - rbar);
      const rho = c / acov0;
      if (rho > bound || rho < -bound) sni += (n - k) * (n - k - 1) * (n - k - 2) * rho;
    }
  }
  const varS = var0 * (1 + (2 / (n * (n - 1) * (n - 2))) * sni);
  let z: number | null = null;
  let p: number | null = null;
  if (s === 0) {
    z = 0;
    p = 1;
  } else if (varS > 0) {
    z = (s > 0 ? s - 1 : s + 1) / Math.sqrt(varS);
    p = normTwoSidedP(z);
  }

  // --- Least squares with Newey–West errors. With the time axis centred, X'X is diagonal and the
  // variance of the slope is S11 / sxx², where S is the HAC "meat" built from x·u.
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = t[i] - tbar;
    sxx += dx * dx;
    sxy += dx * (y[i] - ybar);
  }
  if (!(sxx > 0)) return { ...EMPTY, n };
  const ols = sxy / sxx;
  const xu = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const dx = t[i] - tbar;
    xu[i] = dx * (y[i] - ybar - ols * dx);
  }
  let s11 = 0;
  for (let i = 0; i < n; i++) s11 += xu[i] * xu[i];
  for (let lag = 1; lag <= rules.hacLags && lag < n; lag++) {
    let g = 0;
    for (let i = lag; i < n; i++) g += xu[i] * xu[i - lag];
    s11 += (1 - lag / (rules.hacLags + 1)) * 2 * g;
  }
  const se = Math.sqrt(Math.max(s11, 0)) / sxx;
  const lo = ols - Z975 * se;
  const hi = ols + Z975 * se;

  const mkSig = p !== null && p < rules.alpha;
  const olsSig = lo > 0 || hi < 0;
  const y0 = t[0];
  const y1 = t[n - 1];
  const enough = n >= rules.minValues && y1 - y0 + 1 >= rules.minSpan;
  const label: Certainty = !enough ? 'nodata' : mkSig && olsSig ? 'confirmed' : mkSig || olsSig ? 'hint' : 'none';
  const lead = sen !== 0 ? sen : ols;

  return {
    ok: true,
    n,
    y0,
    y1,
    mean: ybar,
    sen,
    senIntercept,
    senStep,
    p,
    z,
    s,
    varS,
    ols,
    lo,
    hi,
    mkSig,
    olsSig,
    label,
    dir: lead > 0 ? 1 : lead < 0 ? -1 : 0
  };
}

export interface RainFit {
  ok: boolean;
  n: number;
  y0: number;
  y1: number;
  r2: number;
  /** Intercept, coefficient of the rain of the same year and of the year before. */
  coef: [number, number, number];
  residual: YearSeries;
  trend: WaterTrend;
}

/**
 * How much of the stored water is explained by rain: plain least squares of storage on the rain of
 * the same year and of the year before. What is left (the residual) is tested for a trend.
 */
export function storageVsRain(storage: YearSeries, rain: YearSeries, rules = WATER_RULES): RainFit {
  const rainAt = new Map<number, number>();
  rain.years.forEach((yr, i) => rainAt.set(yr, rain.values[i]));
  const years: number[] = [];
  const g: number[] = [];
  const a: number[] = [];
  const b: number[] = [];
  storage.years.forEach((yr, i) => {
    const p0 = rainAt.get(yr);
    const p1 = rainAt.get(yr - 1);
    if (p0 !== undefined && p1 !== undefined) {
      years.push(yr);
      g.push(storage.values[i]);
      a.push(p0);
      b.push(p1);
    }
  });
  const n = years.length;
  const none: RainFit = { ok: false, n, y0: NaN, y1: NaN, r2: NaN, coef: [NaN, NaN, NaN], residual: { years: [], values: [] }, trend: { ...EMPTY } };
  if (n < 6) return none;
  const mean = (v: number[]) => v.reduce((q, x) => q + x, 0) / n;
  const gm = mean(g);
  const am = mean(a);
  const bm = mean(b);
  let saa = 0;
  let sab = 0;
  let sbb = 0;
  let sga = 0;
  let sgb = 0;
  let sgg = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - am;
    const db = b[i] - bm;
    const dg = g[i] - gm;
    saa += da * da;
    sab += da * db;
    sbb += db * db;
    sga += dg * da;
    sgb += dg * db;
    sgg += dg * dg;
  }
  const det = saa * sbb - sab * sab;
  if (!(det > 0) || !(sgg > 0)) return none;
  const b1 = (sga * sbb - sgb * sab) / det;
  const b2 = (sgb * saa - sga * sab) / det;
  let sse = 0;
  const res = g.map((v, i) => {
    const e = v - gm - b1 * (a[i] - am) - b2 * (b[i] - bm);
    sse += e * e;
    return e;
  });
  const residual = { years, values: res };
  return {
    ok: true,
    n,
    y0: years[0],
    y1: years[n - 1],
    r2: 1 - sse / sgg,
    coef: [gm - b1 * am - b2 * bm, b1, b2],
    residual,
    trend: waterTrend(residual, rules)
  };
}

/** Each year as a percentage above or below the mean of the series. */
export function anomalyPct(s: YearSeries): YearSeries {
  const mean = s.values.reduce((q, x) => q + x, 0) / (s.values.length || 1);
  return { years: s.years, values: s.values.map((v) => (mean ? (v / mean - 1) * 100 : NaN)) };
}

export function valueAt(s: YearSeries, year: number): number | null {
  const i = s.years.indexOf(year);
  return i < 0 ? null : s.values[i];
}

export function meanOf(s: YearSeries): number {
  return s.values.length ? s.values.reduce((q, x) => q + x, 0) / s.values.length : NaN;
}
