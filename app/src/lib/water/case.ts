// From the data file to the case: every suspect questioned with the same two tests, and the
// verdict reached with the fixed rules the team wrote. Nothing here is specific to one region:
// a region with fewer series simply gets a verdict that says what is missing.
// Code written with AI assistance (Claude) for team RAACK.

import { DROUGHT_YEAR_PCT, REGIONS, SERIES, SUSPECTS, type LineRole, type PlaceId, type SeriesDef, type SuspectId } from './catalog';
import { anomalyPct, clip, meanOf, storageVsRain, valueAt, waterTrend, type Certainty, type RainFit, type WaterTrend, type YearSeries } from './engine';
import type { Aquifer, RegionId, WaterData } from './types';

export interface LineResult {
  id: string;
  def: SeriesDef;
  role: LineRole;
  /** Whole record and the part inside the chosen period. */
  full: YearSeries;
  series: YearSeries;
  trend: WaterTrend;
  /** Sen's slope and the least-squares interval, per decade. */
  perDecade: number;
  ci: [number, number];
  /** Change per decade as a percentage of the mean, where that makes sense. */
  pct: number | null;
}

export type Finding = 'down' | 'up' | 'hint' | 'none' | 'nodata' | 'downSome' | 'backed' | 'indirect' | 'officialOnly' | 'nodirect';

export interface SuspectResult {
  id: SuspectId;
  budget: 'in' | 'out' | 'store' | 'context';
  main: LineResult | null;
  lines: LineResult[];
  finding: Finding;
  /** cleared: its alibi holds · flagged: it moved · open: cannot be judged. */
  status: 'cleared' | 'flagged' | 'open';
  /** Witnesses and other places that tell the same story as the main line, out of how many. */
  agree: number;
  others: number;
  /** A place (other than the main one) where the change is confirmed. */
  hotPlace: LineResult | null;
}

export type VerdictKind = 'supply' | 'demand' | 'compound' | 'human' | 'none';
export type Missing = 'rain' | 'evap' | 'storage' | 'official';
export type RuleState = 'yes' | 'no' | 'unknown';

export interface CaseVerdict {
  kind: VerdictKind;
  /** For a human footprint: backed by independent official evidence, or only possible. */
  human: 'backed' | 'possible' | null;
  /** A drought year inside the period without a long-term fall of rain. */
  oneOff: boolean;
  crisisYear: number | null;
  droughtYears: number[];
  missing: Missing[];
  /** Overall certainty of the verdict, with the same four colours as every label. */
  certainty: Certainty;
  notSupply: boolean;
  notDemand: boolean;
  rules: { id: 'rain' | 'demand' | 'storage' | 'residual' | 'official' | 'year'; state: RuleState }[];
}

export interface ReservoirResult {
  line: LineResult;
  place: PlaceId;
  mean: number;
  crisis: number | null;
  crisisPct: number | null;
}

export interface AquiferSummary {
  total: number;
  negative: number;
  deficit: number;
  monterrey: Aquifer[];
  monterreyAllNegative: boolean;
  largest: Aquifer[];
}

export interface CaseAnalysis {
  region: RegionId;
  y0: number;
  y1: number;
  lines: Record<string, LineResult>;
  suspects: SuspectResult[];
  rain: LineResult | null;
  rainWitness: LineResult | null;
  demand: LineResult | null;
  storage: LineResult | null;
  rainFit: RainFit | null;
  /** Rain of every year against its long-term mean (%), for the main source and its witness. */
  rainAnomaly: YearSeries | null;
  witnessAnomaly: YearSeries | null;
  reservoirs: ReservoirResult[];
  aquifers: AquiferSummary | null;
  /** Stored-water loss turned into a yearly volume over the region's area (order of magnitude). */
  lossHm3: number | null;
  verdict: CaseVerdict;
}

function lineResult(id: string, role: LineRole, full: YearSeries, y0: number, y1: number): LineResult {
  const def = SERIES[id];
  const series = clip(full, y0, y1);
  const trend = waterTrend(series);
  const perDecade = trend.sen * 10;
  return {
    id,
    def,
    role,
    full,
    series,
    trend,
    perDecade,
    ci: [trend.lo * 10, trend.hi * 10],
    pct: def.pct && trend.ok && trend.mean !== 0 ? (perDecade / Math.abs(trend.mean)) * 100 : null
  };
}

/** Direction in which each suspect would drain the region: less rain, more heat, more evaporation… */
const CULPRIT_DIR: Record<SuspectId, 1 | -1> = { rain: -1, temp: 1, evap: 1, soil: -1, runoff: -1, storage: -1, human: 1 };

const confirmed = (l: LineResult | null, dir: 1 | -1) => !!l && l.trend.label === 'confirmed' && l.trend.dir === dir;
const known = (l: LineResult | null) => !!l && l.trend.label !== 'nodata';

/** Two lines tell the same story when both confirm the same direction, or neither confirms any. */
function sameStory(a: LineResult, b: LineResult): boolean {
  const ca = a.trend.label === 'confirmed';
  const cb = b.trend.label === 'confirmed';
  return ca && cb ? a.trend.dir === b.trend.dir : !ca && !cb;
}

function findingOf(main: LineResult | null): Finding {
  if (!main || main.trend.label === 'nodata') return 'nodata';
  if (main.trend.label === 'confirmed') return main.trend.dir < 0 ? 'down' : 'up';
  return main.trend.label === 'hint' ? 'hint' : 'none';
}

export function analyzeCase(data: WaterData, region: RegionId, y0: number, y1: number): CaseAnalysis {
  const reg = data.regions[region];
  const def = REGIONS[region];
  const lines: Record<string, LineResult> = {};
  const get = (id: string, role: LineRole): LineResult | null => {
    if (!reg.series[id]) return null;
    return (lines[id] ??= lineResult(id, role, reg.series[id], y0, y1));
  };

  const aq = reg.aquifers;
  const neg = aq.filter((a) => a.availability < 0);
  const aquifers: AquiferSummary | null = aq.length
    ? {
        total: aq.length,
        negative: neg.length,
        deficit: neg.reduce((q, a) => q + a.availability, 0),
        monterrey: aq.filter((a) => a.monterrey),
        monterreyAllNegative: aq.filter((a) => a.monterrey).every((a) => a.availability < 0),
        largest: [...neg].sort((a, b) => a.availability - b.availability).slice(0, 4)
      }
    : null;
  const official = !!aquifers && aquifers.negative > 0;

  const suspects: SuspectResult[] = SUSPECTS.map((sd) => {
    const ls = sd.lines.map((l) => get(l.id, l.role)).filter((l): l is LineResult => l !== null);
    const main = ls.find((l) => l.role === 'main') ?? null;
    const peers = ls.filter((l) => l.role === 'witness' || l.role === 'place').filter(known);
    const agree = main ? peers.filter((l) => sameStory(main, l)).length : 0;
    const hotPlace = ls.find((l) => l.role === 'place' && l.trend.label === 'confirmed' && (!main || main.trend.label !== 'confirmed')) ?? null;
    let finding = findingOf(main);
    // A suspect is flagged only when it moves in the direction that drains water.
    const bad = CULPRIT_DIR[sd.id];
    let status: SuspectResult['status'] = finding === 'nodata' ? 'open' : main && confirmed(main, bad) ? 'flagged' : 'cleared';
    if (sd.id === 'human') {
      // Settled below, once the verdict is known: this suspect has no series of its own.
      finding = 'nodirect';
      status = 'open';
    } else if (hotPlace && (finding === 'none' || finding === 'hint')) {
      finding = 'downSome';
      if (hotPlace.trend.dir === bad) status = 'flagged';
    }
    return { id: sd.id, budget: sd.budget, main, lines: ls, finding, status, agree, others: peers.length, hotPlace };
  });

  const byId = (id: SuspectId) => suspects.find((q) => q.id === id)!;
  const rain = byId('rain').main;
  const rainWitness = byId('rain').lines.find((l) => l.role === 'witness') ?? null;
  const demand = byId('evap').main;
  const storage = byId('storage').main;

  // ---- rain of each year against its long-term mean, and the drought years
  const rainAnomaly = rain ? anomalyPct(rain.full) : null;
  const witnessAnomaly = rainWitness ? anomalyPct(rainWitness.full) : null;
  const droughtYears: number[] = [];
  if (rainAnomaly) {
    rainAnomaly.years.forEach((yr, i) => {
      if (yr < y0 || yr > y1 || !(rainAnomaly.values[i] <= DROUGHT_YEAR_PCT)) return;
      const w = witnessAnomaly ? valueAt(witnessAnomaly, yr) : null;
      if (witnessAnomaly && (w === null || w > DROUGHT_YEAR_PCT)) return;
      droughtYears.push(yr);
    });
  }
  const crisisYear = droughtYears.length ? droughtYears[droughtYears.length - 1] : null;

  // ---- stored water once the rain of the year and of the year before is taken out
  let rainFit: RainFit | null = null;
  if (storage && rain) {
    const fit = storageVsRain(storage.series, rain.full);
    if (fit.ok) rainFit = fit;
  }

  // ---- the verdict, with the team's rules
  const rainKnown = known(rain);
  const demandKnown = known(demand);
  const storageKnown = known(storage);
  const rainDown = confirmed(rain, -1);
  const demandUp = confirmed(demand, 1);
  const storageDown = confirmed(storage, -1);
  const residualDown = !!rainFit && rainFit.trend.label === 'confirmed' && rainFit.trend.dir < 0;

  let kind: VerdictKind = 'none';
  if (rainDown && demandUp) kind = 'compound';
  else if (rainDown) kind = 'supply';
  else if (demandUp) kind = 'demand';
  else if (storageDown) kind = 'human';

  // Human withdrawals: accused only indirectly (the verdict) and backed only by an official record.
  const humanSuspect = byId('human');
  humanSuspect.finding = kind === 'human' ? (official ? 'backed' : 'indirect') : official ? 'officialOnly' : 'nodirect';
  humanSuspect.status = kind === 'human' && official ? 'flagged' : 'open';

  const missing: Missing[] = [];
  if (!rainKnown) missing.push('rain');
  if (!demandKnown) missing.push('evap');
  if (!storageKnown) missing.push('storage');
  if (kind === 'human' && !official) missing.push('official');

  // A human footprint is "backed" only with official evidence and with rain and evaporation ruled out.
  const human = kind === 'human' ? (official && rainKnown && demandKnown ? 'backed' : 'possible') : null;
  const oneOff = crisisYear !== null && !rainDown;
  const witnessBacks = !!rain && !!rainWitness && sameStory(rain, rainWitness);
  let certainty: Certainty;
  if (kind === 'human') certainty = human === 'backed' ? 'confirmed' : 'hint';
  else if (kind === 'none') certainty = !rainKnown && !demandKnown && !storageKnown ? 'nodata' : 'none';
  else certainty = (kind === 'demand' || witnessBacks) && missing.length === 0 ? 'confirmed' : 'hint';

  const state = (isKnown: boolean, value: boolean): RuleState => (!isKnown ? 'unknown' : value ? 'yes' : 'no');
  const verdict: CaseVerdict = {
    kind,
    human,
    oneOff,
    crisisYear,
    droughtYears,
    missing,
    certainty,
    notSupply: rainKnown && !rainDown,
    notDemand: demandKnown && !demandUp,
    rules: [
      { id: 'rain', state: state(rainKnown, rainDown) },
      { id: 'demand', state: state(demandKnown, demandUp) },
      { id: 'storage', state: state(storageKnown, storageDown) },
      { id: 'residual', state: state(!!rainFit && rainFit.trend.label !== 'nodata', residualDown) },
      { id: 'official', state: aq.length ? (official ? 'yes' : 'no') : 'unknown' },
      { id: 'year', state: state(rainKnown, crisisYear !== null) }
    ]
  };

  const reservoirs: ReservoirResult[] = def.reservoirs
    .map((r) => {
      const line = get(r.id, 'witness');
      if (!line) return null;
      const mean = meanOf(line.full);
      const crisis = crisisYear !== null ? valueAt(line.full, crisisYear) : null;
      return { line, place: r.place, mean, crisis, crisisPct: crisis !== null && mean ? (crisis / mean - 1) * 100 : null };
    })
    .filter((r): r is ReservoirResult => r !== null);

  const lossHm3 = storage && storage.trend.ok && def.areaKm2 ? Math.abs(storage.trend.sen) * def.areaKm2 * 0.01 : null;

  return { region, y0, y1, lines, suspects, rain, rainWitness, demand, storage, rainFit, rainAnomaly, witnessAnomaly, reservoirs, aquifers, lossHm3, verdict };
}

/** Earliest and latest year of any series of a region. */
export function regionSpan(data: WaterData, region: RegionId): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of Object.values(data.regions[region].series)) {
    if (!s.years.length) continue;
    lo = Math.min(lo, s.years[0]);
    hi = Math.max(hi, s.years[s.years.length - 1]);
  }
  return [lo, hi];
}

/** Monthly rain of one year next to the usual rain of each calendar month. */
export function monthlyProfile(monthly: { start: string; values: number[] } | undefined, year: number) {
  if (!monthly) return null;
  const y0 = Number(monthly.start.slice(0, 4));
  const m0 = Number(monthly.start.slice(5, 7)) - 1;
  const sums = new Array<number>(12).fill(0);
  const counts = new Array<number>(12).fill(0);
  const of: (number | null)[] = new Array(12).fill(null);
  monthly.values.forEach((v, i) => {
    const k = m0 + i;
    const yr = y0 + Math.floor(k / 12);
    const m = k % 12;
    sums[m] += v;
    counts[m]++;
    if (yr === year) of[m] = v;
  });
  if (of.some((v) => v === null)) return null;
  return { year: of as number[], usual: sums.map((q, m) => (counts[m] ? q / counts[m] : NaN)) };
}
