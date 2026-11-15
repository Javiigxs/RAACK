// Phrases of the water case: amounts with their unit, in the chosen language.
// Code written with AI assistance (Claude) for team RAACK.

import { fmt, fmtP, fmtSigned } from '../catalog';
import { t } from '../i18n';
import { ui } from '../state.svelte';
import type { LineResult } from './case';
import type { SeriesDef } from './catalog';

const ok = (v: number | null | undefined): v is number => v !== null && v !== undefined && Number.isFinite(v);

/** «+33 mm/yr per decade» */
export function rateW(def: SeriesDef, perDecade: number | null | undefined, decimals = def.trendDecimals): string {
  if (!ok(perDecade)) return '—';
  return `${fmtSigned(perDecade, decimals, ui.lang)} ${t(`w.tunit.${def.unit}`)} ${t('unit.perDecade')}`;
}

/** «+33» with the decimals of the series, no unit. */
export function rateNum(def: SeriesDef, perDecade: number | null | undefined): string {
  return ok(perDecade) ? fmtSigned(perDecade, def.trendDecimals, ui.lang) : '—';
}

/** «+5%» in English, «+5 %» in Spanish. */
export function pctW(v: number | null | undefined, decimals = 0, signed = true): string {
  if (!ok(v)) return '—';
  const n = signed ? fmtSigned(v, decimals, ui.lang) : fmt(v, decimals, ui.lang);
  return ui.lang === 'es' ? `${n} %` : `${n}%`;
}

/** «−46 to +109» */
export function ciW(def: SeriesDef, ci: [number, number] | null | undefined, decimals = def.trendDecimals): string {
  if (!ci || !ok(ci[0]) || !ok(ci[1])) return '—';
  return t('fmt.range', { lo: fmtSigned(ci[0], decimals, ui.lang), hi: fmtSigned(ci[1], decimals, ui.lang) });
}

/** «p = 0.36», «p < 0.001» or «p not computable». */
export function pW(p: number | null | undefined): string {
  if (!ok(p)) return t('w.p.na');
  return p < 0.001 ? `p ${fmtP(p, ui.lang)}` : `p = ${fmtP(p, ui.lang)}`;
}

/** A value of the series with its unit: «611 mm», «20.2 °C», «−3.7 cm». */
export function valueW(def: SeriesDef, v: number | null | undefined, signed = false, decimals = def.decimals): string {
  if (!ok(v)) return '—';
  return `${signed ? fmtSigned(v, decimals, ui.lang) : fmt(v, decimals, ui.lang)} ${t(`w.unit.${def.unit}`)}`;
}

/** Name of a line: what it is and where. */
export function lineName(l: LineResult | { def: SeriesDef }): string {
  return t(`w.series.${l.def.id}`);
}

export const num = (v: number | null | undefined, decimals = 0) => fmt(v, decimals, ui.lang);
export const signed = (v: number | null | undefined, decimals = 0) => fmtSigned(v, decimals, ui.lang);
