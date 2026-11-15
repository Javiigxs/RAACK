// Los dos idiomas deben tener las mismas frases y los mismos huecos ({nombre}) en cada una.
// Código escrito con ayuda de IA (Claude) para el equipo RAACK.
import { describe, expect, it } from 'vitest';
import { RAIN_INDICATORS } from './analysis';
import { MODIS_SITES, VAR_ORDER } from './catalog';
import { DICTS } from './i18n';

const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('textos de la interfaz', () => {
  const en = DICTS.en;
  const es = DICTS.es;

  it('inglés y español tienen las mismas claves', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it('ninguna frase está vacía', () => {
    for (const [lang, dict] of Object.entries(DICTS)) {
      for (const [key, value] of Object.entries(dict)) expect(value.trim().length, `${lang}:${key}`).toBeGreaterThan(0);
    }
  });

  it('cada frase usa los mismos huecos en los dos idiomas', () => {
    for (const key of Object.keys(en)) expect(holes(es[key] ?? ''), key).toEqual(holes(en[key]));
  });

  it('existen las frases que se construyen con el identificador de variable, lugar o pista', () => {
    const need: string[] = [];
    for (const v of VAR_ORDER) need.push(`var.${v}.name`, `var.${v}.def`, `var.${v}.meta`, `var.${v}.subject`, `trendUnit.${v}`);
    for (const s of [...MODIS_SITES, 'cell', 'merra', 'station']) need.push(`site.${s}.name`, `site.${s}.short`, `site.${s}.desc`, `site.${s}.at`);
    for (const c of RAIN_INDICATORS) need.push(`clue.${c}.name`, `clue.${c}.def`, `clue.${c}.phrase`);
    for (const level of ['strong', 'some', 'weak', 'none', 'insufficient']) need.push(`verdict.${level}`, `oc.v.${level}`);
    for (const level of ['strong', 'some', 'weak', 'none']) need.push(`vd.${level}`);
    for (const reason of ['short', 'gaps', 'few']) need.push(`vd.insufficient.${reason}`);
    for (const v of ['rain', 'soil', 'airMax', 'airMin']) need.push(`wh.single.${v}`);
    for (const v of ['soil', 'ndvi']) need.push(`wi.none.${v}`);
    const missing = need.filter((k) => !(k in en));
    expect(missing).toEqual([]);
  });
});
