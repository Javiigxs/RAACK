// Toda frase que el caso del agua pide existe en los dos idiomas: las que se escriben tal cual en
// los componentes y las que se construyen con el identificador de una serie, un lugar o un sospechoso.
// Código escrito con ayuda de IA (Claude) para el equipo RAACK.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DICTS } from '../i18n';
import { CONCERNS, REGION_ORDER, SERIES, SUSPECTS } from './catalog';

const en = DICTS.en;
const here = new URL('./', import.meta.url);
const sections = new URL('../sections/', import.meta.url);
const sources = [
  ...readdirSync(here)
    .filter((f) => /\.(svelte|ts)$/.test(f) && !f.endsWith('.test.ts'))
    .map((f) => new URL(f, here)),
  ...readdirSync(sections)
    .filter((f) => f.endsWith('.svelte'))
    .map((f) => new URL(f, sections)),
  new URL('../../App.svelte', import.meta.url)
];

describe('textos del caso del agua', () => {
  it('las claves escritas en los componentes existen', () => {
    const missing: string[] = [];
    for (const file of sources) {
      const text = readFileSync(file, 'utf8');
      // 'w.algo.mas' entre comillas: una clave completa. Las plantillas (`w.x.${id}`) se comprueban aparte.
      for (const m of text.matchAll(/['"](w\.[A-Za-z0-9_.]*[A-Za-z0-9_])['"]/g)) {
        const key = m[1];
        if (!(key in en) && !Object.keys(en).some((k) => k.startsWith(`${key}.`))) missing.push(`${key} (${file.pathname.split('/').pop()})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('las claves que se construyen con un identificador existen', () => {
    const need: string[] = [];
    for (const id of Object.keys(SERIES)) need.push(`w.series.${id}`);
    for (const d of Object.values(SERIES)) need.push(`w.place.${d.place}`, `w.kind.${d.kind}`, `w.unit.${d.unit}`, `w.unit.${d.unit}.axis`, `w.tunit.${d.unit}`);
    for (const s of SUSPECTS) need.push(`w.sus.${s.id}.name`, `w.sus.${s.id}.def`, `w.budget.${s.budget}`);
    for (const f of ['down', 'up', 'hint', 'none', 'nodata', 'downSome']) need.push(`w.find.any.${f}`);
    need.push('w.find.human.backed', 'w.find.human.indirect', 'w.find.human.officialOnly', 'w.find.human.nodirect');
    for (const r of REGION_ORDER) need.push(`w.region.${r}.name`, `w.region.${r}.desc`);
    for (const c of CONCERNS) need.push(`w.concern.${c}`);
    for (const k of ['confirmed', 'hint', 'none', 'nodata']) need.push(`w.cert.${k}`);
    for (const k of ['cleared', 'flagged', 'open', 'losing']) need.push(`w.status.${k}`);
    for (const k of ['main', 'place', 'witness', 'related']) need.push(`w.role.${k}`);
    for (const k of ['rain', 'evap', 'storage', 'official']) need.push(`w.missing.${k}`);
    for (const k of ['rain', 'demand', 'storage', 'residual', 'official', 'year']) need.push(`w.rule.${k}`);
    for (const k of ['yes', 'no', 'unknown']) need.push(`w.rule.state.${k}`);
    for (const k of ['rain', 'demand', 'storage', 'official']) need.push(`w.ex.${k}`);
    for (const k of ['supply', 'demand', 'compound', 'human', 'human.oneoff', 'human.incomplete', 'none', 'none.oneoff', 'nodata']) need.push(`w.v.head.${k}`);
    for (const k of ['supply', 'demand', 'compound', 'none', 'human.backed', 'human.possible', 'human.incomplete']) need.push(`w.v.sub.${k}`);
    for (const k of ['backed', 'possible', 'supply', 'demand', 'compound', 'none']) need.push(`w.g.verdict.${k}`);
    for (const k of ['temp', 'pet', 'et', 'soil', 'runoff', 'rain']) need.push(`w.where.${k}`);
    for (const k of ['full', 'grace', 'mid', 'last15']) need.push(`w.sel.preset.${k}`);
    for (const k of ['human', 'oneoff', 'supply', 'demand', 'nl']) need.push(`w.opt.group.${k}`);
    for (const k of ['w.sel', 'w.vsec', 'w.ssec', 'w.bsec', 'w.csec', 'w.esec', 'w.osec', 'w.gsec', 'w.lsec', 'w.msec']) need.push(`${k}.kicker`, `${k}.title`, `${k}.lead`);
    for (let i = 1; i <= 12; i++) need.push(`w.mt.${i}`);
    for (let i = 1; i <= 9; i++) need.push(`w.lm.${i}`, `w.lm.${i}.h`);
    for (const k of ['imerg', 'gldas', 'grace', 'hydro', 'chirps', 'conagua', 'smn', 'dof', 'challenge', 'repo', 'build', 'engine', 'note']) need.push(`w.src.${k}.name`, `w.src.${k}.desc`);
    expect(need.filter((k) => !(k in en))).toEqual([]);
  });

  it('ninguna frase del caso del agua sobra', () => {
    const all = sources.map((f) => readFileSync(f, 'utf8')).join('\n');
    // Una clave se usa si aparece entera o si algún prefijo suyo aparece en una plantilla (`w.x.${…}`).
    const unused = Object.keys(en).filter((k) => {
      if (!k.startsWith('w.')) return false;
      if (all.includes(`'${k}'`) || all.includes(`"${k}"`) || all.includes(`\`${k}\``)) return false;
      const parts = k.split('.');
      for (let n = parts.length - 1; n >= 2; n--) {
        const prefix = parts.slice(0, n).join('.');
        if (all.includes(`${prefix}.\${`) || all.includes(`${prefix}.' +`)) return false;
      }
      // Frases construidas con una clave base más un sufijo fijo.
      return !/^w\.(lm\.\d+\.h|sel|vsec|ssec|bsec|csec|esec|osec|gsec|lsec|msec)(\.|$)/.test(k);
    });
    expect(unused).toEqual([]);
  });
});
