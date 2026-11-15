// «Lo que esconde el año»: indicadores de lluvia calculados dentro de cada año
// a partir de datos diarios. Propuesta de Fran (equipo RAACK), 14 de noviembre de 2026.
// Las definiciones coinciden con docs/calcular_calendario_lluvia.py del repositorio.
// Código escrito con ayuda de IA (Claude).

import { dayIndex, daysInYear, isLeap } from './series';

/** Un día cuenta como lluvioso desde este umbral (mm). */
export const WET_DAY_MM = 1;

export interface RainYear {
  year: number;
  daysExpected: number;
  daysValid: number;
  complete: boolean;
  /** Valores diarios del año (mm); `null` donde falta. */
  daily: (number | null)[];
  /** Lluvia total del año (mm). */
  total: number | null;
  /** Días con al menos 1 mm. */
  wetDays: number | null;
  /** Lluvia media en los días lluviosos (mm por día lluvioso). */
  intensity: number | null;
  /** Porcentaje del total que cayó en los cinco días más lluviosos. */
  top5Share: number | null;
  /** Lluvia del día más lluvioso (mm). */
  max1Day: number | null;
  /** Racha más larga de días con menos de 1 mm, dentro del año. */
  maxDrySpell: number | null;
  /** Posición (0-based, dentro del año) de los cinco días más lluviosos. */
  top5Days: number[];
  /** Primer día (0-based, dentro del año) en que el acumulado llega al 20, 50 y 80 % del total. */
  day20: number | null;
  day50: number | null;
  day80: number | null;
  /** Días entre alcanzar el 20 % y el 80 %. */
  spread2080: number | null;
  /** Acumulado diario (mm). */
  cumulative: number[];
}

/** Día del año (1–366) en un calendario bisiesto de referencia: el 1 de marzo es siempre el 61. */
export function refDayOfYear(year: number, dayOfYear0: number): number {
  const doy = dayOfYear0 + 1;
  return isLeap(year) || doy <= 59 ? doy : doy + 1;
}

export function rainYear(daily: ArrayLike<number | null>, startISO: string, year: number): RainYear {
  const nd = daysInYear(year);
  const i0 = dayIndex(startISO, year, 0, 1);
  const vals: (number | null)[] = [];
  let valid = 0;
  for (let d = 0; d < nd; d++) {
    const i = i0 + d;
    const v = i >= 0 && i < daily.length ? daily[i] : null;
    const ok = v !== null && v !== undefined && Number.isFinite(v);
    vals.push(ok ? (v as number) : null);
    if (ok) valid++;
  }
  const base: RainYear = {
    year,
    daysExpected: nd,
    daysValid: valid,
    complete: valid === nd,
    daily: vals,
    total: null,
    wetDays: null,
    intensity: null,
    top5Share: null,
    max1Day: null,
    maxDrySpell: null,
    top5Days: [],
    day20: null,
    day50: null,
    day80: null,
    spread2080: null,
    cumulative: []
  };
  // Un hueco no debe alargar una racha seca ni rebajar un total: solo años completos.
  if (!base.complete) return base;

  const v = vals as number[];
  let total = 0;
  let wet = 0;
  let wetSum = 0;
  let spell = 0;
  let maxSpell = 0;
  const cumulative: number[] = [];
  for (let d = 0; d < nd; d++) {
    total += v[d];
    cumulative.push(total);
    if (v[d] >= WET_DAY_MM) {
      wet++;
      wetSum += v[d];
      spell = 0;
    } else {
      spell++;
      if (spell > maxSpell) maxSpell = spell;
    }
  }
  const order = v.map((x, d) => [x, d] as [number, number]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  const top5 = order.slice(0, 5);
  base.total = total;
  base.wetDays = wet;
  base.intensity = wet > 0 ? wetSum / wet : null;
  base.maxDrySpell = maxSpell;
  base.max1Day = order[0][0];
  base.cumulative = cumulative;
  if (total > 0) {
    base.top5Share = (100 * top5.reduce((s, x) => s + x[0], 0)) / total;
    base.top5Days = top5.filter((x) => x[0] > 0).map((x) => x[1]);
    const first = (pct: number) => cumulative.findIndex((c) => 100 * c >= pct * total - 1e-9);
    base.day20 = first(20);
    base.day50 = first(50);
    base.day80 = first(80);
    base.spread2080 = base.day80 - base.day20;
  }
  return base;
}

export type RainIndicatorId =
  | 'total'
  | 'wetDays'
  | 'intensity'
  | 'top5Share'
  | 'max1Day'
  | 'maxDrySpell'
  | 'day50'
  | 'spread2080';

/** Valor de un indicador para un año (las fechas, en el calendario bisiesto de referencia). */
export function rainIndicator(y: RainYear, id: RainIndicatorId): number | null {
  if (!y.complete) return null;
  if (id === 'day50') return y.day50 === null ? null : refDayOfYear(y.year, y.day50);
  return y[id];
}

export function rainYears(daily: ArrayLike<number | null>, startISO: string, yStart: number, yEnd: number): RainYear[] {
  const out: RainYear[] = [];
  for (let y = yStart; y <= yEnd; y++) out.push(rainYear(daily, startISO, y));
  return out;
}
