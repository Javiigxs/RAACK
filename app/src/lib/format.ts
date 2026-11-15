// Frases de cantidades con su unidad, en el idioma elegido.

import { VARS, fmt, fmtP, fmtSigned, type VarId } from './catalog';
import { t } from './i18n';
import { ui } from './state.svelte';

const ok = (v: number | null | undefined): v is number => v !== null && v !== undefined && Number.isFinite(v);

/** «+0,96 °C por década» */
export function rateText(varId: VarId, perDecade: number | null | undefined): string {
  if (!ok(perDecade)) return '—';
  return `${fmtSigned(perDecade, VARS[varId].trendDecimals, ui.lang)} ${t(`trendUnit.${varId}`)} ${t('unit.perDecade')}`;
}

/** «0,96 °C por década», sin signo: la dirección la dice la frase. */
export function rateAbsText(varId: VarId, perDecade: number | null | undefined): string {
  if (!ok(perDecade)) return '—';
  return `${fmt(Math.abs(perDecade), VARS[varId].trendDecimals, ui.lang)} ${t(`trendUnit.${varId}`)} ${t('unit.perDecade')}`;
}

/** «+2,4 °C» */
export function amountText(varId: VarId, v: number | null | undefined, decimals = VARS[varId].trendDecimals): string {
  if (!ok(v)) return '—';
  return `${fmtSigned(v, decimals, ui.lang)} ${t(`trendUnit.${varId}`)}`;
}

/** «de +0,71 a +1,20» */
export function ciText(varId: VarId, ci: [number, number] | null | undefined): string {
  if (!ci || !ok(ci[0]) || !ok(ci[1])) return '—';
  const d = VARS[varId].trendDecimals;
  return t('fmt.range', { lo: fmtSigned(ci[0], d, ui.lang), hi: fmtSigned(ci[1], d, ui.lang) });
}

/** «p < 0.001» o «p = 0.03». */
export function pText(p: number | null | undefined): string {
  if (!ok(p)) return 'p = —';
  return p < 0.001 ? `p ${fmtP(p, ui.lang)}` : `p = ${fmtP(p, ui.lang)}`;
}

/** Porcentaje de meses válidos sin redondear a 100 cuando falta alguno: «99,5». */
export function covText(valid: number, total: number): string {
  if (!total) return '—';
  const pct = (valid / total) * 100;
  const rounded = Math.round(pct);
  if (rounded === 100 && valid < total) return fmt(Math.floor(pct * 10) / 10, 1, ui.lang);
  if (rounded === 0 && valid > 0) return fmt(Math.ceil(pct * 10) / 10, 1, ui.lang);
  return fmt(pct, 0, ui.lang);
}

/** «25.6708° N, 100.3092° W» (en español, «O» de oeste). */
export function coordText(p: { lat: number; lon: number }): string {
  const ns = p.lat >= 0 ? 'N' : 'S';
  const ew = p.lon >= 0 ? 'E' : ui.lang === 'es' ? 'O' : 'W';
  return `${fmt(Math.abs(p.lat), 4, ui.lang)}° ${ns}, ${fmt(Math.abs(p.lon), 4, ui.lang)}° ${ew}`;
}

/** Lista con «y» final: «marzo, julio y agosto». */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${t('fmt.and')} ${items[items.length - 1]}`;
}
