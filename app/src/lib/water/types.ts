// Shape of public/data/water.json (written by scripts/build_water.py).

import type { YearSeries } from './engine';

export interface RefTrend {
  n: number;
  y0: number;
  y1: number;
  mean: number;
  sen: number;
  senStep: number;
  p: number | null;
  z: number | null;
  s: number;
  varS: number;
  ols: number;
  lo: number;
  hi: number;
  label: 'confirmed' | 'hint' | 'none';
}

export interface RefResidual {
  n: number;
  y0: number;
  y1: number;
  r2: number;
  coef: [number, number, number];
  residual: RefTrend;
}

export interface Aquifer {
  id: number;
  name: string;
  recharge: number;
  committed: number;
  concessioned: number;
  availability: number;
  monterrey: boolean;
}

export interface MonthlyFrom {
  start: string;
  values: number[];
}

export interface MonthlyList {
  months: string[];
  values: number[];
  deseasoned?: number[];
}

export interface WaterRegion {
  box: { latMin: number; latMax: number; lonMin: number; lonMax: number };
  series: Record<string, YearSeries>;
  monthly: {
    rain_imerg?: MonthlyFrom;
    rain_chirps?: MonthlyFrom;
    tws_grace?: MonthlyList;
    dams?: Record<string, MonthlyList>;
  };
  cells: Record<string, number>;
  aquifers: Aquifer[];
  reference: Record<string, Record<string, RefTrend>>;
  referenceResidual?: Record<string, Record<string, RefResidual>>;
}

export type RegionId = 'nl' | 'cv';

export interface WaterData {
  id: string;
  generated: string;
  note: string;
  software: Record<string, string>;
  inputs: Record<string, { bytes: number; sha256: string }>;
  regions: Record<RegionId, WaterRegion>;
}
