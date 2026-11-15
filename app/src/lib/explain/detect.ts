// «Press a number and it tells you what it is»: this module reads the text around a number and
// decides what kind of figure it is (a change per decade, a p-value, a percentage, a year…) and in
// which unit. It only looks at text, so it works for every number of the page, in English and in
// Spanish, without marking them one by one. Tested in detect.test.ts with sentences of the page.
// Code written with AI assistance (Claude) for team RAACK.

export type NumKind =
  | 'rate' // change per decade
  | 'interval' // «−46 to +109»
  | 'pvalue'
  | 'r2'
  | 'percent'
  | 'confidence' // the «95 %» of a 95 % interval
  | 'points' // percentage points
  | 'year'
  | 'period' // «2001–2025»
  | 'ratio' // «13 / 23», «3 of 3»
  | 'measure' // a quantity with a known unit
  | 'date' // day of a month
  | 'identifier' // part of a name: «MOD11A2», «station 19052», «Case 001»
  | 'count'; // any other number

export type UnitId = 'mm' | 'mmyr' | 'mmmonth' | 'degc' | 'cm' | 'hm3' | 'mm3' | 'm3' | 'km2' | 'km' | 'days' | 'years' | 'months' | 'ndvi' | 'deg';

export interface NumHit {
  kind: NumKind;
  unit: UnitId | null;
  /** The figure as it should be quoted: the number with its sign, unit and «per decade». */
  phrase: string;
  /** Position of the number itself (with its sign) in the text. */
  start: number;
  end: number;
  /** For an interval, a period or a ratio: where the pair of numbers starts and ends. */
  spanStart: number;
  spanEnd: number;
  value: number;
}

const MINUS = '−';
const NUMBER = /(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/gu;
const LETTER = /\p{L}/u;
const SPACE = /[\s  ]/;

/** Units, longest first, as they are written in either language after a number. */
const UNITS: [RegExp, UnitId][] = [
  [/^(?:mm\s?\/\s?(?:yr|year|año)|mm per year|mm al año|mm (?:of yearly rain|de lluvia anual))/i, 'mmyr'],
  [/^(?:mm\s?\/\s?(?:month|mes))/i, 'mmmonth'],
  [/^mm(?![\p{L}\d³])/iu, 'mm'],
  [/^°\s?C(?![\p{L}])/u, 'degc'],
  [/^cm(?![\p{L}\d³])/iu, 'cm'],
  [/^hm(?:³|3)(?:\s?\/\s?(?:yr|year|año)| per year| al año)?/i, 'hm3'],
  [/^Mm(?:³|3)/, 'mm3'],
  [/^m(?:³|3)/, 'm3'],
  [/^km(?:²|2)/i, 'km2'],
  [/^km(?![\p{L}\d])/iu, 'km'],
  [/^(?:days?|días?|dias?)(?![\p{L}])/iu, 'days'],
  [/^(?:years?|años?|yr)(?![\p{L}])/iu, 'years'],
  [/^(?:months?|mes(?:es)?)(?![\p{L}])/iu, 'months'],
  [/^NDVI(?![\p{L}])/u, 'ndvi'],
  [/^°(?!\s?C)/, 'deg']
];

const PER_DECADE = /^\s*(?:per decade|por década|\/\s?decade|\/\s?década)/i;
const MONTH =
  /^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|mayo|jun(?:io)?|jul(?:io)?|ago(?:sto)?|sep(?:tiembre)?|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?)\.?(?![\p{L}])/iu;
const MONTH_BEFORE =
  /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|ene(?:ro)?|febrero|marzo|abr(?:il)?|mayo|junio|julio|ago(?:sto)?|septiembre|octubre|noviembre|dic(?:iembre)?)\.?\s$/iu;
/** Words that turn the number after them into a name, not a quantity. */
const NAMING = /(?:station|estación|estacion|observatorio|case|caso|SMN|no\.|n\.º|nº|#|version|versión|collection|colección|release|RL|GLDAS|IMERG|MODIS|CHIRPS|MERRA|S30|HLS|step|paso|figure|figura|table|tabla)\s?$/iu;

interface Token {
  start: number;
  end: number;
  /** Start including the sign. */
  from: number;
  value: number;
  integer: boolean;
  digits: number;
}

function tokens(text: string): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(NUMBER)) {
    const start = m.index;
    const end = start + m[0].length;
    let from = start;
    const sign = text[start - 1];
    // A sign belongs to the number when nothing but a space, a bracket or the start comes before it.
    if ((sign === '+' || sign === MINUS || sign === '-') && (start < 2 || !/[\p{L}\d]/u.test(text[start - 2]))) from = start - 1;
    out.push({ start, end, from, value: Number(m[0].replaceAll(',', '')) * (from < start && sign !== '+' ? -1 : 1), integer: !m[0].includes('.'), digits: m[0].replaceAll(',', '').length });
  }
  return out;
}

const skipSpace = (text: string, i: number) => {
  while (i < text.length && SPACE.test(text[i])) i++;
  return i;
};
const backSpace = (text: string, i: number) => {
  while (i > 0 && SPACE.test(text[i - 1])) i--;
  return i;
};

function unitAfter(text: string, at: number): { unit: UnitId; end: number } | null {
  const i = skipSpace(text, at);
  if (i - at > 2) return null;
  const rest = text.slice(i, i + 28);
  for (const [re, unit] of UNITS) {
    const m = re.exec(rest);
    if (m) return { unit, end: i + m[0].length };
  }
  return null;
}

const isYear = (t: Token) => t.integer && t.digits === 4 && Math.abs(t.value) >= 1850 && Math.abs(t.value) <= 2100 && t.from === t.start;

/** Is this number glued to letters, so that it is a name («MOD11A2», «GLDAS-2.1», «v061», «2 °C» is not)? */
function isName(text: string, t: Token): boolean {
  const before = text[t.start - 1] ?? '';
  const before2 = text[t.start - 2] ?? '';
  const after = text[t.end] ?? '';
  if (LETTER.test(before)) return true;
  // «GLDAS-2.1», «v2_1», «km/2»: a letter, a joiner and the number. «1.2.3»: a second dot.
  if ((before === '-' || before === '_' || before === '/') && LETTER.test(before2) && t.from === t.start) return true;
  if (before === '.' && /\d/.test(before2)) return true;
  // «A2», «3x», «5th»: a letter right after, unless it starts a unit («5mm», «2°C»)
  if (LETTER.test(after) && !unitAfter(text, t.end)) return true;
  return NAMING.test(text.slice(Math.max(0, t.start - 14), t.start));
}

/** The connector between the two numbers of an interval: «to», «a», «and», «y». */
const RANGE_WORD = /^\s*(?:to|a|and|y|hasta)\s*$/i;
const RATIO_WORD = /^\s*(?:\/|of|de|out of|de un total de)\s*$/i;

/**
 * The number under position `offset` of `text` (a caret position: between two characters), with
 * what it is. `label` is the heading that names the number on the page (column header, the term of
 * a definition…): it settles what the text alone cannot.
 */
export function numberAt(text: string, offset: number, label = ''): NumHit | null {
  const all = tokens(text);
  const k = all.findIndex((t) => offset >= t.from && offset <= t.end);
  if (k < 0) return null;
  return classify(text, all, k, label);
}

/** Every number of a text with what it is (for tests and for elements that hold a single number). */
export function numbersIn(text: string, label = ''): NumHit[] {
  const all = tokens(text);
  return all.map((_, k) => classify(text, all, k, label));
}

function classify(text: string, all: Token[], k: number, label: string): NumHit {
  const t = all[k];
  const prev = all[k - 1];
  const next = all[k + 1];
  const raw = text.slice(t.from, t.end);
  const hit = (kind: NumKind, unit: UnitId | null = null, phraseEnd = t.end, spanStart = t.from, spanEnd = t.end, phraseStart = spanStart): NumHit => ({
    kind,
    unit,
    phrase: text.slice(phraseStart, Math.max(phraseEnd, spanEnd)).replace(/\s+/g, ' ').trim(),
    start: t.from,
    end: t.end,
    spanStart,
    spanEnd,
    value: t.value
  });

  // «2025-03-14»: the three numbers of a date written the ISO way
  for (const m of text.matchAll(/(?<![\d-])\d{4}-\d{2}-\d{2}(?![\d-])/g)) {
    if (t.start >= m.index && t.end <= m.index + 10) return hit('date', null, m.index + 10, m.index, m.index + 10);
  }
  if (isName(text, t)) {
    // Quote the whole name: «MOD11A2», «GLDAS-2.1», «station 19052»
    let a = t.start;
    let b = t.end;
    while (a > 0 && /[\p{L}\d._\-/]/u.test(text[a - 1])) a--;
    while (b < text.length && /[\p{L}\d._\-/]/u.test(text[b])) b++;
    while (b > t.end && /[._\-/]/.test(text[b - 1])) b--;
    while (a < t.start && /[._\-/]/.test(text[a])) a++;
    if (a === t.start) {
      const word = NAMING.exec(text.slice(Math.max(0, t.start - 14), t.start));
      if (word) a = t.start - word[0].length;
    }
    return hit('identifier', null, b, t.from, t.end, a);
  }

  const beforeText = text.slice(Math.max(0, t.from - 12), t.from);
  // p-value: «p = 0.36», «p < 0.001»
  if (/(?:^|[^\p{L}])p\s*[=<>≤≥]\s*$/iu.test(beforeText)) {
    const eq = text.lastIndexOf('p', t.from);
    return hit('pvalue', null, t.end, eq < 0 ? t.from : eq, t.end);
  }
  if (/R(?:²|2)\s*=?\s*$/.test(beforeText)) {
    const eq = text.lastIndexOf('R', t.from);
    return hit('r2', null, t.end, eq < 0 ? t.from : eq, t.end);
  }

  const unit = unitAfter(text, t.end);
  const afterIdx = skipSpace(text, t.end);
  const percent = text[afterIdx] === '%' && afterIdx - t.end <= 1;

  // Dates: «9 November 2023», «March 14, 2025», «14 de marzo de 2025»
  if (t.integer && !percent && !unit && t.from === t.start) {
    const rest = text.slice(afterIdx, afterIdx + 16).replace(/^de\s/i, '');
    if (!isYear(t) && t.value >= 1 && t.value <= 31 && (MONTH.test(rest) || MONTH_BEFORE.test(text.slice(Math.max(0, t.start - 12), t.start)))) return hit('date');
  }

  // Pairs: «2001–2025», «−46 to +109», «de −46 a +109», «13 / 23», «3 of 3»
  const pairWith = (a: Token, b: Token): NumHit | null => {
    const between = text.slice(a.end, b.from);
    const bothYears = isYear(a) && isYear(b);
    if (/^\s?[–-]\s?$/.test(between) && bothYears && b.value > a.value) return hit('period', null, b.end, a.from, b.end);
    if (RATIO_WORD.test(between) && a.integer && b.integer && a.value >= 0 && b.value >= a.value && !bothYears && a.from === a.start && b.from === b.start) {
      // «23 / 23 aquifers»: the total is not followed by a unit of measure
      if (!unitAfter(text, b.end) || /\//.test(between)) return hit('ratio', null, b.end, a.from, b.end);
    }
    if (RANGE_WORD.test(between) && !bothYears) {
      // Both ends carry a sign («−46 to +109»), or the text says interval, or they share a unit after the second.
      const signed = a.from < a.start && b.from < b.start;
      const said = /interval|intervalo|\bCI\b|\bIC\b|range|rango|between|entre/i.test(`${label} ${text.slice(Math.max(0, a.from - 28), a.from)}`);
      const lead = text.slice(Math.max(0, a.from - 4), a.from);
      const spanishDe = /\bde\s$/i.test(lead);
      if (signed || said || spanishDe) {
        const u = unitAfter(text, b.end);
        let end = u ? u.end : b.end;
        const pd = PER_DECADE.exec(text.slice(end, end + 16));
        if (pd) end += pd[0].length;
        return hit('interval', u?.unit ?? null, end, a.from, b.end);
      }
    }
    return null;
  };
  if (next) {
    const pair = pairWith(t, next);
    if (pair) return pair;
  }
  if (prev) {
    const pair = pairWith(prev, t);
    if (pair) return pair;
  }

  if (percent) {
    const end = afterIdx + 1;
    // «95% interval», «intervalo del 95 %», «95% uncertainty»: the level of confidence, not a share of the data
    const around = `${text.slice(Math.max(0, t.from - 26), t.from)}|${text.slice(end, end + 26)}`;
    if ((t.value === 95 || t.value === 90 || t.value === 99) && /interval|intervalo|uncertainty|incertidumbre|confidence|confianza/i.test(around)) return hit('confidence', null, end);
    return hit('percent', null, end);
  }
  if (/^(?:pts?|points?|puntos?|pp)(?![\p{L}])/iu.test(text.slice(afterIdx, afterIdx + 8)) && afterIdx - t.end <= 2) {
    const m = /^(?:pts?|points?|puntos?|pp)/i.exec(text.slice(afterIdx, afterIdx + 8))!;
    let end = afterIdx + m[0].length;
    const pd = PER_DECADE.exec(text.slice(end, end + 16));
    if (pd) return hit('rate', null, end + pd[0].length);
    return hit('points', null, end);
  }

  if (unit) {
    const pd = PER_DECADE.exec(text.slice(unit.end, unit.end + 16));
    if (pd) return hit('rate', unit.unit, unit.end + pd[0].length);
    if (/per decade|por década|change per|cambio por|rate|ritmo|tendencia|trend/i.test(label)) return hit('rate', unit.unit, unit.end);
    return hit('measure', unit.unit, unit.end);
  }
  {
    const pd = PER_DECADE.exec(text.slice(t.end, t.end + 16));
    if (pd) return hit('rate', null, t.end + pd[0].length);
  }

  // The heading that names the number decides the rest.
  if (label) {
    if (/p[-\s]?value|valor p|^p$|hamed|mann|kendall|t-test|prueba t/i.test(label) && Math.abs(t.value) <= 1) return hit('pvalue');
    if (/R²|R2/.test(label) && Math.abs(t.value) <= 1) return hit('r2');
    if (/per decade|por década|change per|cambio por/i.test(label)) return hit('rate', unitIn(label));
    if (/interval|intervalo/i.test(label)) return hit('interval', unitIn(label));
    const u = unitIn(label);
    if (u && !isYear(t)) return hit('measure', u);
  }
  if (isYear(t)) return hit('year');
  return hit('count');
}

/** A unit named inside a heading: «Recharge (hm³/yr)», «cm of water». */
export function unitIn(label: string): UnitId | null {
  for (let i = 0; i < label.length; i++) {
    if (i > 0 && /[\p{L}\d]/u.test(label[i - 1])) continue;
    const rest = label.slice(i, i + 28);
    for (const [re, unit] of UNITS) {
      if (unit === 'days' || unit === 'years' || unit === 'months' || unit === 'deg' || unit === 'km') continue;
      if (re.test(rest)) return unit;
    }
  }
  return null;
}
