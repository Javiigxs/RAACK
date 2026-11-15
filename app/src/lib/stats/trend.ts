// Análisis de tendencia con tres métodos independientes («el jurado»):
//   1. Prueba t de la pendiente de mínimos cuadrados.
//   2. Prueba de Mann–Kendall con pendiente de Sen.
//   3. Intervalo de confianza por bootstrap de bloques.
// Los tres se ensanchan cuando la serie tiene memoria (autocorrelación de un paso).
// Código escrito con ayuda de IA (Claude) para el equipo RAACK; verificado en trend.test.ts.

import { mulberry32, normInv, normTwoSidedP, roundHalfEven, tInv, tTwoSidedP } from './dist';

export interface TrendOptions {
  /** Muestras por año de la rejilla regular: 12 para series mensuales, 1 para anuales. */
  perYear: number;
  /** Nivel de significación bilateral. Por defecto 0,05. */
  alpha?: number;
  /** Réplicas de bootstrap (0 lo desactiva). Por defecto 2000. */
  bootstrap?: number;
  /** Semilla del generador aleatorio: mismo resultado en cada ejecución. */
  seed?: number;
  /** Corregir la autocorrelación de un paso cuando es claramente positiva. Por defecto sí. */
  autocorr?: boolean;
}

export interface TrendResult {
  ok: boolean;
  /** Número de valores válidos y tamaño de la rejilla. */
  n: number;
  nGrid: number;
  /** Años cubiertos entre el primer y el último valor válido. */
  spanYears: number;
  tFirst: number;
  tLast: number;
  /** Autocorrelación de un paso de los residuos y la que se usa para corregir (0 si no es clara). */
  r1: number;
  phi: number;
  nEff: number;
  ols: { slope: number; intercept: number; se: number; t: number; df: number; p: number; ci: [number, number] };
  mk: { s: number; varS: number; z: number; p: number; tau: number };
  sen: { slope: number; intercept: number; ci: [number, number] };
  boot: { ci: [number, number]; replicates: number; block: number } | null;
  votes: { t: boolean; mk: boolean; boot: boolean | null };
  nVotes: number;
  nJurors: number;
  /** Desviación típica del ruido (residuos sin tendencia). */
  sigmaNoise: number;
  /** Años de datos necesarios para detectar esta pendiente con 90 % de probabilidad al 95 %. */
  yearsToDetect: number | null;
  alpha: number;
}

const EMPTY: TrendResult = {
  ok: false,
  n: 0,
  nGrid: 0,
  spanYears: 0,
  tFirst: NaN,
  tLast: NaN,
  r1: 0,
  phi: 0,
  nEff: 0,
  ols: { slope: NaN, intercept: NaN, se: NaN, t: NaN, df: NaN, p: NaN, ci: [NaN, NaN] },
  mk: { s: 0, varS: 0, z: 0, p: NaN, tau: NaN },
  sen: { slope: NaN, intercept: NaN, ci: [NaN, NaN] },
  boot: null,
  votes: { t: false, mk: false, boot: null },
  nVotes: 0,
  nJurors: 0,
  sigmaNoise: NaN,
  yearsToDetect: null,
  alpha: 0.05
};

function median(sorted: ArrayLike<number>): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const h = n >> 1;
  return n % 2 ? sorted[h] : (sorted[h - 1] + sorted[h]) / 2;
}

function quantile(sorted: ArrayLike<number>, q: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.min(lo + 1, n - 1);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** z(1−α/2) + z(0,90): detectar al 95 % con una probabilidad del 90 %. */
export const DETECTION_Z = 1.959963985 + 1.281551566;

/**
 * Años de registro necesarios para detectar una tendencia `slopePerYear` en una serie con
 * ruido de desviación típica `sigma`, autocorrelación de un paso `phi` y `perYear` muestras por año.
 * Sale de la varianza de la pendiente de mínimos cuadrados: Var(b) ≈ 12 σ² / (m n³) · (1+φ)/(1−φ).
 * Con m = 12 coincide con la expresión de Weatherhead et al. (1998), que redondea z a 3,3.
 */
export function yearsToDetect(sigma: number, slopePerYear: number, phi: number, perYear: number): number | null {
  const w = Math.abs(slopePerYear);
  if (!(w > 0) || !(sigma > 0)) return null;
  const f = Math.max(0, Math.min(phi, 0.98));
  const years = Math.pow(
    ((DETECTION_Z * sigma * Math.sqrt(12 / perYear)) / w) * Math.sqrt((1 + f) / (1 - f)),
    2 / 3
  );
  return Number.isFinite(years) ? years : null;
}

/**
 * Analiza la tendencia de una serie sobre una rejilla regular.
 * @param t Tiempo de cada muestra en años decimales (regular, `perYear` muestras por año).
 * @param y Valores; `null` o NaN donde falta el dato.
 */
export function analyzeTrend(t: ArrayLike<number>, y: ArrayLike<number | null>, options: TrendOptions): TrendResult {
  const alpha = options.alpha ?? 0.05;
  const B = options.bootstrap ?? 2000;
  const useAutocorr = options.autocorr ?? true;
  const nGrid = Math.min(t.length, y.length);

  const idx: number[] = [];
  for (let i = 0; i < nGrid; i++) {
    const v = y[i];
    if (v !== null && v !== undefined && Number.isFinite(v) && Number.isFinite(t[i])) idx.push(i);
  }
  const n = idx.length;
  if (n < 4) return { ...EMPTY, n, nGrid, alpha };

  const tt = new Float64Array(n);
  const yy = new Float64Array(n);
  let tbar = 0;
  let ybar = 0;
  for (let k = 0; k < n; k++) {
    tt[k] = t[idx[k]];
    yy[k] = y[idx[k]] as number;
    tbar += tt[k];
    ybar += yy[k];
  }
  tbar /= n;
  ybar /= n;

  // --- 1. Mínimos cuadrados
  let sxx = 0;
  let sxy = 0;
  for (let k = 0; k < n; k++) {
    const dt = tt[k] - tbar;
    sxx += dt * dt;
    sxy += dt * (yy[k] - ybar);
  }
  if (!(sxx > 0)) return { ...EMPTY, n, nGrid, alpha };
  const slope = sxy / sxx;
  const intercept = ybar - slope * tbar;
  const res = new Float64Array(n);
  let sse = 0;
  for (let k = 0; k < n; k++) {
    res[k] = yy[k] - (intercept + slope * tt[k]);
    sse += res[k] * res[k];
  }

  // --- Autocorrelación de un paso (solo entre muestras consecutivas de la rejilla)
  let num = 0;
  let pairs = 0;
  for (let k = 0; k < n - 1; k++) {
    if (idx[k + 1] === idx[k] + 1) {
      num += res[k] * res[k + 1];
      pairs++;
    }
  }
  let r1 = 0;
  if (pairs >= 3 && sse > 0) r1 = num / pairs / (sse / n);
  r1 = Math.max(-0.99, Math.min(0.99, r1));
  // Solo se corrige si la memoria es claramente positiva (umbral unilateral del 5 %).
  const phi = useAutocorr && r1 > 1.645 / Math.sqrt(n) ? r1 : 0;
  const nEff = (n * (1 - phi)) / (1 + phi);
  const df = Math.max(nEff - 2, 1);

  const sigmaNoise = Math.sqrt(sse / Math.max(n - 2, 1));
  const se = Math.sqrt(sse / df / sxx);
  let tStat: number;
  let pT: number;
  if (sse === 0) {
    tStat = slope === 0 ? 0 : Infinity * Math.sign(slope);
    pT = slope === 0 ? 1 : 0;
  } else {
    tStat = slope / se;
    pT = tTwoSidedP(tStat, df);
  }
  const tCrit = tInv(1 - alpha / 2, df);
  const olsCi: [number, number] = [slope - tCrit * se, slope + tCrit * se];

  // --- 2. Mann–Kendall y pendiente de Sen
  const nPairs = (n * (n - 1)) / 2;
  const slopes = new Float64Array(nPairs);
  let s = 0;
  let m = 0;
  for (let i = 0; i < n - 1; i++) {
    const yi = yy[i];
    const ti = tt[i];
    for (let j = i + 1; j < n; j++) {
      const dy = yy[j] - yi;
      if (dy > 0) s++;
      else if (dy < 0) s--;
      slopes[m++] = dy / (tt[j] - ti);
    }
  }
  slopes.sort();
  const senSlope = median(slopes);
  const inter = new Float64Array(n);
  for (let k = 0; k < n; k++) inter[k] = yy[k] - senSlope * tt[k];
  inter.sort();
  const senIntercept = median(inter);

  // Varianza de S con corrección por empates.
  const sortedY = Float64Array.from(yy).sort();
  let tieTerm = 0;
  let run = 1;
  for (let k = 1; k <= n; k++) {
    if (k < n && sortedY[k] === sortedY[k - 1]) run++;
    else {
      if (run > 1) tieTerm += run * (run - 1) * (2 * run + 5);
      run = 1;
    }
  }
  const varS0 = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18;
  // Corrección por memoria AR(1): n/n* = 1 + 2 Σ (1 − k/n) φ^k.
  let cf = 1;
  if (phi > 0) {
    let pk = 1;
    let sum = 0;
    for (let k = 1; k < n; k++) {
      pk *= phi;
      if (pk < 1e-12) break;
      sum += (1 - k / n) * pk;
    }
    cf = 1 + 2 * sum;
  }
  const varS = varS0 * cf;
  let z = 0;
  if (varS > 0) z = s > 0 ? (s - 1) / Math.sqrt(varS) : s < 0 ? (s + 1) / Math.sqrt(varS) : 0;
  const pMk = varS > 0 ? normTwoSidedP(z) : 1;

  // Intervalo de Sen (misma regla de índices que scipy.stats.theilslopes).
  const zq = normInv(1 - alpha / 2);
  const sigmaS = Math.sqrt(varS);
  const ru = Math.min(roundHalfEven((nPairs + zq * sigmaS) / 2), nPairs - 1);
  const rl = Math.max(roundHalfEven((nPairs - zq * sigmaS) / 2) - 1, 0);
  const senCi: [number, number] = [slopes[rl], slopes[ru]];

  // --- 3. Bootstrap de bloques circulares sobre los residuos
  let boot: TrendResult['boot'] = null;
  let voteBoot: boolean | null = null;
  if (B > 0 && n >= 8) {
    const block = phi > 0 ? Math.max(1, Math.min(Math.floor(n / 5), Math.ceil(-2 / Math.log(phi)))) : 1;
    const w = new Float64Array(n);
    for (let k = 0; k < n; k++) w[k] = (tt[k] - tbar) / sxx;
    const rand = mulberry32(options.seed ?? 20261114);
    const reps = new Float64Array(B);
    for (let b = 0; b < B; b++) {
      let acc = 0;
      let k = 0;
      while (k < n) {
        const start = Math.floor(rand() * n);
        for (let q = 0; q < block && k < n; q++, k++) acc += w[k] * res[(start + q) % n];
      }
      reps[b] = slope + acc;
    }
    reps.sort();
    const ci: [number, number] = [quantile(reps, alpha / 2), quantile(reps, 1 - alpha / 2)];
    boot = { ci, replicates: B, block };
    voteBoot = ci[0] > 0 || ci[1] < 0;
  }

  const votes = { t: pT < alpha, mk: pMk < alpha, boot: voteBoot };
  const nJurors = voteBoot === null ? 2 : 3;
  const nVotes = (votes.t ? 1 : 0) + (votes.mk ? 1 : 0) + (voteBoot ? 1 : 0);

  return {
    ok: true,
    n,
    nGrid,
    spanYears: tt[n - 1] - tt[0] + 1 / options.perYear,
    tFirst: tt[0],
    tLast: tt[n - 1],
    r1,
    phi,
    nEff,
    ols: { slope, intercept, se, t: tStat, df, p: pT, ci: olsCi },
    mk: { s, varS, z, p: pMk, tau: s / nPairs },
    sen: { slope: senSlope, intercept: senIntercept, ci: senCi },
    boot,
    votes,
    nVotes,
    nJurors,
    sigmaNoise,
    yearsToDetect: yearsToDetect(sigmaNoise, slope, phi, options.perYear),
    alpha
  };
}

export type VerdictLevel = 'strong' | 'some' | 'weak' | 'none' | 'insufficient';

export interface Verdict {
  level: VerdictLevel;
  /** +1 sube, −1 baja, 0 sin dirección. */
  direction: 1 | -1 | 0;
  /** Motivo cuando no hay datos suficientes. */
  reason: 'short' | 'gaps' | 'few' | null;
}

export interface VerdictRules {
  /** Años mínimos de registro. */
  minYears: number;
  /** Fracción mínima de valores válidos sobre la rejilla. */
  minCoverage: number;
}

/**
 * Convierte los votos del jurado en un veredicto graduado.
 * Tres de tres: pruebas sólidas. Dos: indicios. Uno: pista débil. Cero: sin pruebas.
 */
export function judge(r: TrendResult, rules: VerdictRules): Verdict {
  if (!r.ok) return { level: 'insufficient', direction: 0, reason: 'few' };
  if (r.spanYears < rules.minYears) return { level: 'insufficient', direction: 0, reason: 'short' };
  if (r.n / r.nGrid < rules.minCoverage) return { level: 'insufficient', direction: 0, reason: 'gaps' };
  const direction = r.sen.slope > 0 ? 1 : r.sen.slope < 0 ? -1 : r.ols.slope > 0 ? 1 : r.ols.slope < 0 ? -1 : 0;
  if (r.nVotes === r.nJurors) return { level: 'strong', direction, reason: null };
  if (r.nVotes >= 2) return { level: 'some', direction, reason: null };
  if (r.nVotes === 1) return { level: 'weak', direction, reason: null };
  return { level: 'none', direction, reason: null };
}
