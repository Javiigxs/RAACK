// «Why 10 / 10?»: what the count stands on, and how far the evidence behind it lets the page go.
// The question is Fran's (team RAACK): say why Nuevo León is 10 of 10 and how much certainty that
// gives. The count itself is about how complete the evidence is, not about how sure a figure is;
// this module measures what that evidence supports. Every number is computed from the data file
// of the case, with the engine of the page: nothing is typed by hand.
// Code written with AI assistance (Claude) for team RAACK.

import { analyzeCase } from '../water/case';
import { REGIONS, SERIES } from '../water/catalog';
import { WATER_RULES, waterTrend, type Certainty } from '../water/engine';
import type { RegionId, WaterData, WaterRegion } from '../water/types';
import { LAYERS } from './layers';

export interface CaseEvidence {
  /** Different sources behind the layers the case file holds (GLDAS gives four layers and is one). */
  sources: number;
  /** Source files the data file was built from: their size and SHA-256 travel inside it. */
  files: number;
  /** Yearly series of the case file. */
  series: number;
  /** Years that hold a value, out of the years between the first and the last of each series. */
  yearsWith: number;
  yearsSpan: number;
  /** What the two tests say on the whole record of each series. */
  labels: Record<Certainty, number>;
  /** Trends (series and periods) the automated tests compare with the Python reference. */
  checked: number;
  /** The verdict over the whole record, and how many of its rules have an answer. */
  verdict: Certainty;
  rulesKnown: number;
  rules: number;
  y0: number;
  y1: number;
  /**
   * The same verdict with the ground records taken away: how far the open layers alone can go.
   * Null when the case file holds no ground record to take away.
   */
  withoutGround: Certainty | null;
}

/**
 * Confidence level of the two tests behind every label, in per cent: 95 with the rules of the team.
 * It is the level each trend is tested at, not the chance that a verdict is true.
 */
export const CONFIDENCE_PCT = Math.round((1 - WATER_RULES.alpha) * 100);

/** A ground record: kept by a station, a reservoir or an authority, not by a mission or a model. */
const onGround = (id: string) => SERIES[id]?.kind === 'station';

/** The case file as it would be with open layers only. */
function openOnly(r: WaterRegion): WaterRegion {
  return { ...r, series: Object.fromEntries(Object.entries(r.series).filter(([id]) => !onGround(id))), aquifers: [] };
}

/** What the evidence of a case supports, measured on its whole record. */
export function caseEvidence(data: WaterData, id: RegionId): CaseEvidence {
  const reg = data.regions[id];
  const { y0, y1 } = REGIONS[id];
  const labels: Record<Certainty, number> = { confirmed: 0, hint: 0, none: 0, nodata: 0 };
  let yearsWith = 0;
  let yearsSpan = 0;
  for (const s of Object.values(reg.series)) {
    labels[waterTrend(s).label]++;
    if (!s.years.length) continue;
    yearsWith += s.years.length;
    yearsSpan += s.years[s.years.length - 1] - s.years[0] + 1;
  }
  const verdict = analyzeCase(data, id, y0, y1).verdict;
  const hasGround = Object.keys(reg.series).some(onGround) || reg.aquifers.length > 0;
  const stripped = hasGround ? analyzeCase({ ...data, regions: { ...data.regions, [id]: openOnly(reg) } }, id, y0, y1).verdict : null;
  return {
    sources: new Set(LAYERS.filter((l) => l.inCase(reg)).map((l) => l.source)).size,
    files: Object.keys(data.inputs).length,
    series: Object.keys(reg.series).length,
    yearsWith,
    yearsSpan,
    labels,
    checked: Object.values(reg.reference).reduce((q, windows) => q + Object.keys(windows).length, 0),
    verdict: verdict.certainty,
    rulesKnown: verdict.rules.filter((x) => x.state !== 'unknown').length,
    rules: verdict.rules.length,
    y0,
    y1,
    withoutGround: stripped ? stripped.certainty : null
  };
}
