// Forma del archivo public/data/monterrey.json (lo genera scripts/build-data.mjs).

export type Num = number | null;

export interface LstSite {
  day: Num[];
  night: Num[];
  qcDay: Num[];
  qcNight: Num[];
}

export interface NdviSite {
  ndvi: Num[];
  rel: Num[];
  viq: Num[];
}

export interface CaseData {
  id: string;
  generated: string;
  note: string;
  inputs: Record<string, { bytes: number; sha256: string }>;
  sites: Record<string, { lat: number; lon: number }>;
  cell: { lat: number; lon: number };
  station: { id: string; lat: number; lon: number };
  daily: {
    start: string;
    n: number;
    imerg_mm: Num[];
    smn_mm: Num[];
    smn_tmax: Num[];
    smn_tmin: Num[];
  };
  soil: { y0: number; values: Num[] };
  lst: { dates: string[]; sites: Record<string, LstSite> };
  ndvi: { y0: number; sites: Record<string, NdviSite> };
}
