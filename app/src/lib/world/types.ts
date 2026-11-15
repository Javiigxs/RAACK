// Shape of public/data/world.json (written by scripts/build_world.py).

export interface WorldCountry {
  /** ISO 3166-1 alpha-2 code. */
  id: string;
  iso3: string;
  en: string;
  es: string;
  /** Reference point of the country in the source list, degrees. */
  lat: number;
  lon: number;
  /** km²; null when the source has no valid figure. */
  area: number | null;
  region: string;
  sub: string;
  /** Identifier of the GRACE mascon under the reference point. */
  mascon: number;
  /** Yearly stored water (cm, seasonal cycle removed) for the years of `grace.years`; null when that mascon is all sea. */
  tws: number[] | null;
  /** point: the cell under the reference point is land · coast: land part of a coastal mascon. */
  twsKind?: 'point' | 'coast';
  /** The same trend computed in Python (pymannkendall + statsmodels), slopes per year. */
  ref?: { n: number; sen: number; p: number | null; ols: number; lo: number; hi: number; label: 'confirmed' | 'hint' | 'none' };
}

export interface WorldData {
  id: string;
  generated: string;
  note: string;
  software: Record<string, string>;
  inputs: Record<string, { bytes: number; sha256: string }>;
  grace: { product: string; unit: string; years: number[]; minMonths: number };
  summary: { countries: number; gracePoint: number; graceCoast: number; graceSea: number };
  countries: WorldCountry[];
}
