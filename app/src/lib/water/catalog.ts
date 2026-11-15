// Catalogue of the water case: regions, yearly series and the seven suspects of the water budget.
// Visible names and definitions live in i18n-water.ts.
// Code written with AI assistance (Claude) for team RAACK.

import type { RegionId } from './types';

/** Who produced the series: a mission, a model, a satellite + gauge blend, or a ground record. */
export type SourceKind = 'mission' | 'model' | 'blend' | 'station';
export type UnitId = 'mmyr' | 'mm' | 'degc' | 'cm' | 'mm3';
export type PlaceId = 'box' | 'mty' | 'gal' | 'station' | 'cuchillo' | 'cerroprieto' | 'laboca';
export type SuspectId = 'rain' | 'temp' | 'evap' | 'soil' | 'runoff' | 'storage' | 'human';
/** main: speaks for the suspect · place: same product, another place · witness: independent source · related: a neighbouring quantity. */
export type LineRole = 'main' | 'place' | 'witness' | 'related';
export type Concern = 'reservoirs' | 'wells' | 'drought';

export interface SeriesDef {
  id: string;
  kind: SourceKind;
  unit: UnitId;
  place: PlaceId;
  /** Short product name shown next to the series. */
  product: string;
  decimals: number;
  trendDecimals: number;
  /** A percentage of the mean makes sense (not for anomalies around zero or for °C). */
  pct: boolean;
}

const s = (id: string, kind: SourceKind, unit: UnitId, place: PlaceId, product: string, decimals: number, trendDecimals: number, pct = true): SeriesDef => ({
  id,
  kind,
  unit,
  place,
  product,
  decimals,
  trendDecimals,
  pct
});

export const SERIES: Record<string, SeriesDef> = Object.fromEntries(
  [
    s('rain_imerg', 'mission', 'mmyr', 'box', 'GPM IMERG Final V07', 0, 0),
    s('rain_chirps', 'blend', 'mmyr', 'box', 'CHIRPS v2.0', 0, 0),
    s('rain_smn', 'station', 'mmyr', 'station', 'SMN 19052', 0, 0),
    s('rain_cuchillo', 'station', 'mmyr', 'cuchillo', 'CONAGUA', 0, 0),
    s('rain_cerroprieto', 'station', 'mmyr', 'cerroprieto', 'CONAGUA', 0, 0),
    s('rain_laboca', 'station', 'mmyr', 'laboca', 'CONAGUA', 0, 0),
    s('rain_gldas_mty', 'model', 'mmyr', 'mty', 'GLDAS-2.1 Noah', 0, 0),
    s('rain_gldas_gal', 'model', 'mmyr', 'gal', 'GLDAS-2.1 Noah', 0, 0),
    s('temp_gldas_mty', 'model', 'degc', 'mty', 'GLDAS-2.1 Noah', 1, 2, false),
    s('temp_gldas_gal', 'model', 'degc', 'gal', 'GLDAS-2.1 Noah', 1, 2, false),
    s('temp_smn', 'station', 'degc', 'station', 'SMN 19052', 1, 2, false),
    s('pet_gldas_mty', 'model', 'mmyr', 'mty', 'GLDAS-2.1 Noah', 0, 0),
    s('pet_gldas_gal', 'model', 'mmyr', 'gal', 'GLDAS-2.1 Noah', 0, 0),
    s('pan_smn', 'station', 'mmyr', 'station', 'SMN 19052', 0, 0),
    s('pan_cuchillo', 'station', 'mmyr', 'cuchillo', 'CONAGUA', 0, 0),
    s('pan_cerroprieto', 'station', 'mmyr', 'cerroprieto', 'CONAGUA', 0, 0),
    s('pan_laboca', 'station', 'mmyr', 'laboca', 'CONAGUA', 0, 0),
    s('et_gldas_mty', 'model', 'mmyr', 'mty', 'GLDAS-2.1 Noah', 0, 0),
    s('et_gldas_gal', 'model', 'mmyr', 'gal', 'GLDAS-2.1 Noah', 0, 0),
    s('soil_gldas_mty', 'model', 'mm', 'mty', 'GLDAS-2.1 Noah', 0, 1),
    s('soil_gldas_gal', 'model', 'mm', 'gal', 'GLDAS-2.1 Noah', 0, 1),
    s('runoff_gldas_mty', 'model', 'mmyr', 'mty', 'GLDAS-2.1 Noah', 0, 1),
    s('runoff_gldas_gal', 'model', 'mmyr', 'gal', 'GLDAS-2.1 Noah', 0, 1),
    s('tws_grace', 'mission', 'cm', 'box', 'GRACE / GRACE-FO JPL RL06.3', 1, 1, false),
    s('vol_cuchillo', 'station', 'mm3', 'cuchillo', 'CONAGUA', 0, 0),
    s('vol_cerroprieto', 'station', 'mm3', 'cerroprieto', 'CONAGUA', 0, 0),
    s('vol_laboca', 'station', 'mm3', 'laboca', 'CONAGUA', 1, 1)
  ].map((d) => [d.id, d])
);

export interface SuspectDef {
  id: SuspectId;
  /** Sign of the term in the water budget: what comes in, what goes out, what is stored, context. */
  budget: 'in' | 'out' | 'store' | 'context';
  lines: { id: string; role: LineRole }[];
}

/** The seven suspects, in the order of the budget. A region shows the lines it has data for. */
export const SUSPECTS: SuspectDef[] = [
  {
    id: 'rain',
    budget: 'in',
    lines: [
      { id: 'rain_imerg', role: 'main' },
      { id: 'rain_chirps', role: 'witness' },
      { id: 'rain_smn', role: 'witness' },
      { id: 'rain_cuchillo', role: 'witness' },
      { id: 'rain_cerroprieto', role: 'witness' },
      { id: 'rain_laboca', role: 'witness' },
      { id: 'rain_gldas_mty', role: 'witness' },
      { id: 'rain_gldas_gal', role: 'witness' }
    ]
  },
  {
    id: 'temp',
    budget: 'context',
    lines: [
      { id: 'temp_gldas_mty', role: 'main' },
      { id: 'temp_gldas_gal', role: 'place' },
      { id: 'temp_smn', role: 'witness' }
    ]
  },
  {
    id: 'evap',
    budget: 'out',
    lines: [
      { id: 'pet_gldas_mty', role: 'main' },
      { id: 'pet_gldas_gal', role: 'place' },
      { id: 'pan_smn', role: 'witness' },
      { id: 'pan_cuchillo', role: 'witness' },
      { id: 'pan_cerroprieto', role: 'witness' },
      { id: 'pan_laboca', role: 'witness' },
      { id: 'et_gldas_mty', role: 'related' },
      { id: 'et_gldas_gal', role: 'related' }
    ]
  },
  {
    id: 'soil',
    budget: 'store',
    lines: [
      { id: 'soil_gldas_mty', role: 'main' },
      { id: 'soil_gldas_gal', role: 'place' }
    ]
  },
  {
    id: 'runoff',
    budget: 'out',
    lines: [
      { id: 'runoff_gldas_mty', role: 'main' },
      { id: 'runoff_gldas_gal', role: 'place' }
    ]
  },
  { id: 'storage', budget: 'store', lines: [{ id: 'tws_grace', role: 'main' }] },
  { id: 'human', budget: 'out', lines: [] }
];

export interface RegionDef {
  id: RegionId;
  /** Area used only for the order-of-magnitude check of the stored-water loss (km²). */
  areaKm2: number | null;
  /** Years the sliders can reach. */
  y0: number;
  y1: number;
  reservoirs: { id: string; place: PlaceId }[];
}

export const REGIONS: Record<RegionId, RegionDef> = {
  nl: {
    id: 'nl',
    areaKm2: 64156,
    y0: 1998,
    y1: 2026,
    reservoirs: [
      { id: 'vol_cuchillo', place: 'cuchillo' },
      { id: 'vol_cerroprieto', place: 'cerroprieto' },
      { id: 'vol_laboca', place: 'laboca' }
    ]
  },
  cv: { id: 'cv', areaKm2: null, y0: 2003, y1: 2026, reservoirs: [] }
};

export const REGION_ORDER: RegionId[] = ['nl', 'cv'];
export const CONCERNS: Concern[] = ['reservoirs', 'wells', 'drought'];

/** Suspects listed first for each worry of the user. */
export const CONCERN_ORDER: Record<Concern, SuspectId[]> = {
  reservoirs: ['rain', 'evap', 'runoff', 'temp', 'soil', 'storage', 'human'],
  wells: ['storage', 'human', 'rain', 'soil', 'evap', 'runoff', 'temp'],
  drought: ['rain', 'soil', 'temp', 'evap', 'runoff', 'storage', 'human']
};

/** A year counts as a drought year when rain is at least this far below its long-term mean in every rain source of the region. */
export const DROUGHT_YEAR_PCT = -25;

/** Chart colours, in fixed order: the main line is always the first. */
export const LINE_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)'];
