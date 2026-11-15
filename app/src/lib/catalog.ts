// Catálogo del caso: variables, lugares, reglas de validación y formato de números.
// Los nombres y definiciones visibles están en i18n.ts.

import type { RainIndicatorId } from './stats/rain';

export type VarId = 'rain' | 'soil' | 'lstDay' | 'lstNight' | 'ndvi' | 'airMax' | 'airMin';
export type SiteId =
  | 'cell'
  | 'merra'
  | 'station'
  | 'mtycentro'
  | 'chipinque'
  | 'carreteranacional'
  | 'pesqueriakia'
  | 'garcia';
export type Quality = 'standard' | 'strict';
export type Lang = 'en' | 'es';

export interface VarDef {
  id: VarId;
  group: 'water' | 'heat' | 'life';
  /** Medida por una misión, producida por un modelo u observada en una estación en tierra. */
  kind: 'mission' | 'model' | 'station';
  product: string;
  sites: SiteId[];
  y0: number;
  y1: number;
  /** Unidad de los valores mensuales. */
  unit: string;
  /** Unidad del ritmo de cambio (por década) y factor para pasar de la pendiente mensual a esa unidad. */
  trendUnit: string;
  trendScale: number;
  trendDecimals: number;
  valueDecimals: number;
  /** Cómo se resume un año: suma (lluvia) o media. */
  agg: 'sum' | 'mean';
  /** Tiene capas de calidad que el usuario puede endurecer. */
  hasQuality: boolean;
  /** Tiene datos diarios para mirar «dentro del año». */
  daily: boolean;
  /** Variable que sirve de segundo testigo, si la hay. */
  witness: { varId: VarId; site: SiteId } | null;
}

export const MODIS_SITES: SiteId[] = ['mtycentro', 'chipinque', 'carreteranacional', 'pesqueriakia', 'garcia'];

export const VARS: Record<VarId, VarDef> = {
  rain: {
    id: 'rain',
    group: 'water',
    kind: 'mission',
    product: 'GPM IMERG',
    sites: ['cell', 'station'],
    y0: 2002,
    y1: 2024,
    unit: 'mm/month',
    trendUnit: 'mm/yr',
    trendScale: 12,
    trendDecimals: 0,
    valueDecimals: 0,
    agg: 'sum',
    hasQuality: false,
    daily: true,
    witness: null
  },
  soil: {
    id: 'soil',
    group: 'water',
    kind: 'model',
    product: 'MERRA-2 GWETROOT',
    sites: ['merra'],
    y0: 2002,
    y1: 2024,
    unit: '%',
    trendUnit: 'pts',
    trendScale: 1,
    trendDecimals: 1,
    valueDecimals: 0,
    agg: 'mean',
    hasQuality: false,
    daily: false,
    witness: null
  },
  lstDay: {
    id: 'lstDay',
    group: 'heat',
    kind: 'mission',
    product: 'MODIS/Terra MOD11A2',
    sites: MODIS_SITES,
    y0: 2001,
    y1: 2025,
    unit: '°C',
    trendUnit: '°C',
    trendScale: 1,
    trendDecimals: 2,
    valueDecimals: 1,
    agg: 'mean',
    hasQuality: true,
    daily: false,
    witness: { varId: 'airMax', site: 'station' }
  },
  lstNight: {
    id: 'lstNight',
    group: 'heat',
    kind: 'mission',
    product: 'MODIS/Terra MOD11A2',
    sites: MODIS_SITES,
    y0: 2001,
    y1: 2025,
    unit: '°C',
    trendUnit: '°C',
    trendScale: 1,
    trendDecimals: 2,
    valueDecimals: 1,
    agg: 'mean',
    hasQuality: true,
    daily: false,
    witness: { varId: 'airMin', site: 'station' }
  },
  ndvi: {
    id: 'ndvi',
    group: 'life',
    kind: 'mission',
    product: 'MODIS/Terra MOD13A3',
    sites: MODIS_SITES,
    y0: 2001,
    y1: 2025,
    unit: 'NDVI',
    trendUnit: 'NDVI',
    trendScale: 1,
    trendDecimals: 3,
    valueDecimals: 2,
    agg: 'mean',
    hasQuality: true,
    daily: false,
    witness: null
  },
  airMax: {
    id: 'airMax',
    group: 'heat',
    kind: 'station',
    product: 'SMN 19052',
    sites: ['station'],
    y0: 2002,
    y1: 2024,
    unit: '°C',
    trendUnit: '°C',
    trendScale: 1,
    trendDecimals: 2,
    valueDecimals: 1,
    agg: 'mean',
    hasQuality: false,
    daily: false,
    witness: { varId: 'lstDay', site: 'mtycentro' }
  },
  airMin: {
    id: 'airMin',
    group: 'heat',
    kind: 'station',
    product: 'SMN 19052',
    sites: ['station'],
    y0: 2002,
    y1: 2024,
    unit: '°C',
    trendUnit: '°C',
    trendScale: 1,
    trendDecimals: 2,
    valueDecimals: 1,
    agg: 'mean',
    hasQuality: false,
    daily: false,
    witness: { varId: 'lstNight', site: 'mtycentro' }
  }
};

export const VAR_ORDER: VarId[] = ['rain', 'soil', 'lstDay', 'lstNight', 'airMax', 'airMin', 'ndvi'];

/** Producto del que sale la serie. La lluvia del observatorio es del pluviómetro, no de IMERG. */
export function productOf(varId: VarId, site: SiteId): string {
  return site === 'station' ? 'SMN 19052' : VARS[varId].product;
}

/** Tipo de fuente de la serie en ese lugar: misión, modelo o estación. */
export function kindOf(varId: VarId, site: SiteId): VarDef['kind'] {
  return site === 'station' ? 'station' : VARS[varId].kind;
}

/** Regla 2 del equipo (docs/VALIDACION.md): al menos 15 años y 80 % de meses válidos. */
export const RULES = { minYears: 15, minCoverage: 0.8 };

/** Imagen de fondo del mapa (NASA GIBS, HLS S30, 14 de marzo de 2025) y su caja geográfica. */
export const MAP = {
  image: 'img/monterrey-hls-s30-2025-03-14.jpg',
  w: 1240,
  h: 875,
  latMin: 25.33,
  latMax: 26.03,
  lonMin: -100.85,
  lonMax: -99.75
};

/** Celdas aproximadas de los productos en malla (para dibujarlas en el mapa). */
export const CELLS = {
  cell: { latMin: 25.6, latMax: 25.7, lonMin: -100.4, lonMax: -100.3 },
  merra: { latMin: 25.25, latMax: 25.75, lonMin: -100.3125, lonMax: -99.6875 }
};

const NBSP = ' ';
const MINUS = '−';

export function fmt(v: number | null | undefined, decimals: number, lang: Lang): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const s = new Intl.NumberFormat(lang === 'es' ? 'es-MX' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(Math.abs(v));
  const isZero = Number(Math.abs(v).toFixed(decimals)) === 0;
  return (v < 0 && !isZero ? MINUS : '') + s;
}

export function fmtSigned(v: number | null | undefined, decimals: number, lang: Lang): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const isZero = Number(Math.abs(v).toFixed(decimals)) === 0;
  return (isZero ? '' : v > 0 ? '+' : '') + fmt(v, decimals, lang);
}

export function withUnit(text: string, unit: string): string {
  if (!unit) return text;
  return unit === '%' || unit === '°C' ? `${text}${NBSP}${unit}` : `${text}${NBSP}${unit}`;
}

export function fmtP(p: number, lang: Lang): string {
  if (!Number.isFinite(p)) return '—';
  if (p < 0.001) return '< 0.001';
  return fmt(p, p < 0.01 ? 3 : 2, lang);
}

const MONTHS: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
};

export function monthName(m0: number, lang: Lang): string {
  return MONTHS[lang][m0];
}

/** Fecha a partir del día del año en el calendario bisiesto de referencia (1–366). */
export function refDayLabel(doy: number, lang: Lang): string {
  const d = new Date(Date.UTC(2000, 0, Math.round(doy)));
  const day = d.getUTCDate();
  const mon = MONTHS[lang][d.getUTCMonth()];
  return lang === 'es' ? `${day} ${mon}` : `${mon} ${day}`;
}


/** Unidades y decimales de las pistas ocultas dentro del año de lluvia. */
export const RAIN_FMT: Record<
  RainIndicatorId,
  { unit: 'mm' | 'days' | 'pct' | 'date'; decimals: number; trendUnit: 'mm' | 'days' | 'pts'; trendDecimals: number }
> = {
  total: { unit: 'mm', decimals: 0, trendUnit: 'mm', trendDecimals: 0 },
  wetDays: { unit: 'days', decimals: 0, trendUnit: 'days', trendDecimals: 1 },
  intensity: { unit: 'mm', decimals: 1, trendUnit: 'mm', trendDecimals: 2 },
  top5Share: { unit: 'pct', decimals: 1, trendUnit: 'pts', trendDecimals: 2 },
  max1Day: { unit: 'mm', decimals: 0, trendUnit: 'mm', trendDecimals: 1 },
  maxDrySpell: { unit: 'days', decimals: 0, trendUnit: 'days', trendDecimals: 1 },
  day50: { unit: 'date', decimals: 0, trendUnit: 'days', trendDecimals: 1 },
  spread2080: { unit: 'days', decimals: 0, trendUnit: 'days', trendDecimals: 1 }
};

/** Tramos de lluvia diaria (mm) para colorear el calendario: una sola tonalidad, de claro a oscuro. */
export const RAIN_BINS = [1, 5, 20, 50];

/**
 * Tramos de la diferencia de temperatura de un mes frente a su media (°C) para colorear los cuadros
 * de calor: una sola tonalidad, de claro (más frío de lo habitual) a oscuro (más cálido).
 */
export const HEAT_BINS = [-1, 0, 1, 2];
