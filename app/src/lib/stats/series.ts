// Utilidades para series mensuales: agregación desde datos diarios o de 8 días,
// climatología, anomalías (quitar el ciclo estacional) y resúmenes anuales.
// Código escrito con ayuda de IA (Claude) para el equipo RAACK.

/** Serie mensual que empieza en enero de `y0`. `values[i]` es el mes i-ésimo; `null` si falta. */
export interface Monthly {
  y0: number;
  values: (number | null)[];
}

const DAY_MS = 86400000;

export function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInYear(year: number): number {
  return isLeap(year) ? 366 : 365;
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

export function parseISO(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d || 1);
}

/** Índice del día `iso` dentro de una serie diaria que empieza en `startISO`. */
export function dayIndex(startISO: string, year: number, month0: number, day: number): number {
  return Math.round((Date.UTC(year, month0, day) - parseISO(startISO)) / DAY_MS);
}

/** Tiempo (años decimales, centro del mes) de cada elemento de una serie mensual. */
export function monthlyTimes(m: Monthly): number[] {
  return m.values.map((_, i) => m.y0 + (i + 0.5) / 12);
}

/**
 * Agrega una serie diaria a mensual.
 * - 'sum': total del mes (p. ej. lluvia). Si faltan hasta `1 − minCoverage` de los días,
 *   se escala la media de los días válidos al mes completo.
 * - 'mean': media de los días válidos.
 */
export function monthlyFromDaily(
  daily: ArrayLike<number | null>,
  startISO: string,
  agg: 'sum' | 'mean',
  minCoverage = 0.9
): Monthly {
  const start = new Date(parseISO(startISO));
  const y0 = start.getUTCFullYear();
  const lastDate = new Date(parseISO(startISO) + (daily.length - 1) * DAY_MS);
  const y1 = lastDate.getUTCFullYear();
  const values: (number | null)[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let m = 0; m < 12; m++) {
      const nd = daysInMonth(y, m);
      const i0 = dayIndex(startISO, y, m, 1);
      let sum = 0;
      let valid = 0;
      for (let d = 0; d < nd; d++) {
        const i = i0 + d;
        if (i < 0 || i >= daily.length) continue;
        const v = daily[i];
        if (v !== null && v !== undefined && Number.isFinite(v)) {
          sum += v;
          valid++;
        }
      }
      if (valid === 0 || valid / nd < minCoverage) values.push(null);
      else values.push(agg === 'sum' ? (sum / valid) * nd : sum / valid);
    }
  }
  return { y0, values };
}

/**
 * Agrega compuestos de 8 días (fecha de inicio ISO) a medias mensuales.
 * `keep(i)` decide si el compuesto i pasa el filtro de calidad. Hace falta un mínimo de compuestos válidos.
 */
export function monthlyFromComposites(
  dates: string[],
  values: ArrayLike<number | null>,
  keep: (i: number) => boolean,
  minPerMonth = 2
): Monthly {
  const y0 = Number(dates[0].slice(0, 4));
  const y1 = Number(dates[dates.length - 1].slice(0, 4));
  const nMonths = (y1 - y0 + 1) * 12;
  const sum = new Float64Array(nMonths);
  const cnt = new Uint16Array(nMonths);
  for (let i = 0; i < dates.length; i++) {
    const v = values[i];
    if (v === null || v === undefined || !Number.isFinite(v) || !keep(i)) continue;
    const y = Number(dates[i].slice(0, 4));
    const m = Number(dates[i].slice(5, 7)) - 1;
    const k = (y - y0) * 12 + m;
    sum[k] += v;
    cnt[k]++;
  }
  const out: (number | null)[] = [];
  for (let k = 0; k < nMonths; k++) out.push(cnt[k] >= minPerMonth ? sum[k] / cnt[k] : null);
  return { y0, values: out };
}

/** Recorta una serie mensual a los años [yStart, yEnd], ambos incluidos. */
export function sliceMonthly(m: Monthly, yStart: number, yEnd: number): Monthly {
  const a = Math.max(yStart, m.y0);
  const lastYear = m.y0 + Math.floor(m.values.length / 12) - 1;
  const b = Math.min(yEnd, lastYear);
  if (b < a) return { y0: a, values: [] };
  return { y0: a, values: m.values.slice((a - m.y0) * 12, (b - m.y0 + 1) * 12) };
}

/** Media de cada mes del calendario (12 valores). Hace falta un mínimo de años por mes. */
export function climatology(values: ArrayLike<number | null>, minYears = 3): (number | null)[] {
  const sum = new Float64Array(12);
  const cnt = new Uint16Array(12);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null || v === undefined || !Number.isFinite(v)) continue;
    sum[i % 12] += v;
    cnt[i % 12]++;
  }
  return Array.from({ length: 12 }, (_, k) => (cnt[k] >= minYears ? sum[k] / cnt[k] : null));
}

/** Anomalías: cada valor menos la media de su mes. Quita el ciclo estacional. */
export function anomalies(values: ArrayLike<number | null>, clim: (number | null)[]): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const c = clim[i % 12];
    out.push(v === null || v === undefined || !Number.isFinite(v) || c === null ? null : v - c);
  }
  return out;
}

export interface AnnualValue {
  year: number;
  value: number | null;
  months: number;
}

/**
 * Resumen anual de una serie mensual.
 * 'mean' exige `minMonths` meses válidos (por defecto 10); 'sum' exige los 12.
 */
export function annualFromMonthly(
  m: Monthly,
  mode: 'mean' | 'sum',
  minMonths = mode === 'sum' ? 12 : 10
): AnnualValue[] {
  const out: AnnualValue[] = [];
  const years = Math.floor(m.values.length / 12);
  for (let k = 0; k < years; k++) {
    let sum = 0;
    let cnt = 0;
    for (let j = 0; j < 12; j++) {
      const v = m.values[k * 12 + j];
      if (v !== null && v !== undefined && Number.isFinite(v)) {
        sum += v;
        cnt++;
      }
    }
    out.push({
      year: m.y0 + k,
      value: cnt >= minMonths ? (mode === 'sum' ? sum : sum / cnt) : null,
      months: cnt
    });
  }
  return out;
}

/** Valores de un mes del calendario (0–11), uno por año. */
export function calendarMonthSeries(m: Monthly, month0: number): { years: number[]; values: (number | null)[] } {
  const years: number[] = [];
  const values: (number | null)[] = [];
  const n = Math.floor(m.values.length / 12);
  for (let k = 0; k < n; k++) {
    years.push(m.y0 + k);
    values.push(m.values[k * 12 + month0] ?? null);
  }
  return { years, values };
}

/** Número de valores válidos de una serie. */
export function countValid(values: ArrayLike<number | null>): number {
  let c = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== null && v !== undefined && Number.isFinite(v)) c++;
  }
  return c;
}
