// What each number of the page is, read from the text around it. The sentences are the ones the
// page writes, in English and in Spanish.
// Code written with AI assistance (Claude) for team RAACK.
import { describe, expect, it } from 'vitest';
import { numberAt, numbersIn, unitIn, type NumHit } from './detect';

/** The hit for the number written as `needle` (its first appearance). */
function at(text: string, needle: string, label = ''): NumHit {
  const i = text.indexOf(needle);
  if (i < 0) throw new Error(`"${needle}" is not in "${text}"`);
  const hit = numberAt(text, i + 1, label);
  if (!hit) throw new Error(`no number at "${needle}"`);
  return hit;
}
const kinds = (text: string, label = '') => numbersIn(text, label).map((h) => h.kind);

describe('what a number is', () => {
  it('change per decade, with its unit', () => {
    const en = at('Rain: +33 mm/yr per decade, no evidence', '+33');
    expect([en.kind, en.unit, en.phrase]).toEqual(['rate', 'mmyr', '+33 mm/yr per decade']);
    const es = at('Lluvia: +33 mm/año por década', '+33');
    expect([es.kind, es.unit, es.phrase]).toEqual(['rate', 'mmyr', '+33 mm/año por década']);
    expect(at('−7.1 cm per decade', '−7.1')).toMatchObject({ kind: 'rate', unit: 'cm', value: -7.1 });
    expect(at('+0.96 °C per decade', '0.96')).toMatchObject({ kind: 'rate', unit: 'degc' });
    expect(at('−11 mm of yearly rain per decade', '11')).toMatchObject({ kind: 'rate', unit: 'mmyr' });
    expect(at('+0.52 points per decade', '0.52')).toMatchObject({ kind: 'rate', unit: null });
    // the big figure of a suspect card: number and unit come from two different elements
    expect(at('+33 mm/yr per decade', '33').phrase).toBe('+33 mm/yr per decade');
    // a table cell under «Change per decade»
    expect(at('−95 mm/yr', '95', 'Change per decade')).toMatchObject({ kind: 'rate', unit: 'mmyr' });
  });

  it('the 95 % interval', () => {
    const en = at('95% interval −46 to +109', '−46');
    expect([en.kind, en.phrase]).toEqual(['interval', '−46 to +109']);
    expect(at('95% interval −46 to +109', '109').kind).toBe('interval');
    expect(at('95% interval −46 to +109', '95').kind).toBe('confidence');
    const es = at('Intervalo del 95 %: de −46 a +109', '+109');
    expect([es.kind, es.phrase]).toEqual(['interval', '−46 a +109']);
    expect(at('Intervalo del 95 %: de −46 a +109', '95').kind).toBe('confidence');
    expect(at('+0.71 to +1.20', '1.20', '95% interval')).toMatchObject({ kind: 'interval' });
    expect(at('0.71 to 1.20', '0.71', '95% interval').kind).toBe('interval');
    expect(at('−0.46 to +0.28 °C per decade', '0.28')).toMatchObject({ kind: 'interval', unit: 'degc', phrase: '−0.46 to +0.28 °C per decade' });
  });

  it('p-values and R²', () => {
    expect(at('p = 0.36', '0.36')).toMatchObject({ kind: 'pvalue', phrase: 'p = 0.36' });
    expect(at('Mann–Kendall — p < 0.001', '0.001').kind).toBe('pvalue');
    expect(at('0.36', '0.36', 'p-value').kind).toBe('pvalue');
    expect(at('0.04', '0.04', 'Valor p').kind).toBe('pvalue');
    expect(at('+33 mm/yr per decade · R² 0.42', '0.42')).toMatchObject({ kind: 'r2', phrase: 'R² 0.42' });
  });

  it('percentages and points', () => {
    expect(at('Rain in 2022: −32.7% against its mean', '32.7')).toMatchObject({ kind: 'percent', phrase: '−32.7%', value: -32.7 });
    expect(at('Lluvia en 2022: −32.7 % frente a su media', '32.7')).toMatchObject({ kind: 'percent', phrase: '−32.7 %' });
    expect(at('51.7 %', '51.7').kind).toBe('percent');
    expect(at('a gain of 4.2 points', '4.2').kind).toBe('points');
  });

  it('years, periods and dates', () => {
    expect(kinds('Nuevo León, 1998–2026')).toEqual(['period', 'period']);
    expect(at('Nuevo León, 1998–2026', '1998').phrase).toBe('1998–2026');
    expect(kinds('Drought years: 2011, 2022')).toEqual(['year', 'year']);
    expect(kinds('Diario Oficial de la Federación, 9 November 2023')).toEqual(['date', 'year']);
    expect(kinds('14 de marzo de 2025')).toEqual(['date', 'year']);
    expect(kinds('March 14, 2025')).toEqual(['date', 'year']);
    expect(kinds('Jul 26 (211 mm)')).toEqual(['date', 'measure']);
    expect(kinds('cut-off 2022-12-30')).toEqual(['date', 'date', 'date']);
    expect(at('cut-off 2022-12-30', '12').phrase).toBe('2022-12-30');
  });

  it('counts out of a total', () => {
    expect(at('13 / 23', '13')).toMatchObject({ kind: 'ratio', phrase: '13 / 23' });
    expect(at('13 / 23', '23').kind).toBe('ratio');
    expect(at('13 of 23 aquifers in deficit', '23').kind).toBe('ratio');
    expect(at('13 de 23 acuíferos en déficit', '13').phrase).toBe('13 de 23');
    expect(kinds('3 / 3')).toEqual(['ratio', 'ratio']);
  });

  it('quantities with a unit', () => {
    expect(at('806 mm', '806')).toMatchObject({ kind: 'measure', unit: 'mm', phrase: '806 mm' });
    expect(at('20.2 °C', '20.2')).toMatchObject({ kind: 'measure', unit: 'degc' });
    expect(at('−381.1 hm³', '381.1')).toMatchObject({ kind: 'measure', unit: 'hm3', value: -381.1 });
    expect(at('1 hm³ is one million m³', '1').unit).toBe('hm3');
    expect(at('64,155 km²', '64,155')).toMatchObject({ kind: 'measure', unit: 'km2', value: 64155 });
    expect(at('62 days', '62')).toMatchObject({ kind: 'measure', unit: 'days' });
    expect(at('62 días', '62')).toMatchObject({ kind: 'measure', unit: 'days' });
    expect(at('25.6708° N, 100.3092° W', '25.6708')).toMatchObject({ kind: 'measure', unit: 'deg' });
    expect(at('12.3', '12.3', 'Recharge (hm³/yr)')).toMatchObject({ kind: 'measure', unit: 'hm3' });
    expect(at('about 300 km across', '300').unit).toBe('km');
  });

  it('names are not measurements', () => {
    expect(kinds('MODIS/Terra MOD11A2 v061')).toEqual(['identifier', 'identifier', 'identifier']);
    expect(kinds('GLDAS-2.1 Noah, 0.25°')).toEqual(['identifier', 'measure']);
    expect(kinds('JPL mascons RL06.3 v04')).toEqual(['identifier', 'identifier']);
    expect(kinds('SMN station 19052')).toEqual(['identifier']);
    expect(kinds('Case 001 · Where did the water go?')).toEqual(['identifier']);
    expect(kinds('GPM IMERG Final V07, monthly, 0.1° (1,344 cells)')).toEqual(['identifier', 'measure', 'count']);
    // the card quotes the whole name, not the digits alone
    expect(at('MODIS/Terra MOD11A2 v061', '11').phrase).toBe('MOD11A2');
    expect(at('GLDAS-2.1 Noah, 0.25°', '2.1').phrase).toBe('GLDAS-2.1');
    expect(at('SMN station 19052', '19052').phrase).toBe('station 19052');
    expect(at('JPL mascons RL06.3 v04.', '04').phrase).toBe('v04');
  });

  it('plain counts', () => {
    expect(at('8,401', '8,401')).toMatchObject({ kind: 'count', value: 8401 });
    expect(kinds('28')).toEqual(['count']);
    expect(kinds('yearly values: 27')).toEqual(['count']);
  });

  it('finds the number under the caret, not its neighbours', () => {
    const text = 'from 1998 to 2024 it fell −7.1 cm per decade';
    expect(numberAt(text, text.indexOf('1998'))?.kind).toBe('year');
    expect(numberAt(text, text.indexOf('1998') + 4)?.value).toBe(1998);
    expect(numberAt(text, text.indexOf('it'))).toBeNull();
    expect(numberAt(text, text.indexOf('−7.1'))?.value).toBe(-7.1);
    expect(numberAt('no numbers here', 4)).toBeNull();
  });

  it('reads a unit from a heading', () => {
    expect(unitIn('Recharge (hm³/yr)')).toBe('hm3');
    expect(unitIn('cm of water, against its 2002–2026 average')).toBe('cm');
    expect(unitIn('Aquifer')).toBeNull();
    expect(unitIn('Summer')).toBeNull();
  });
});
