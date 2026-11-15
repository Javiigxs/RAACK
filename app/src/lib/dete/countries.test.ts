// DE-T's database of countries (dete/paises.json) against the page: for every country and territory,
// the layers DE-T calls ready and the stored-water figures it quotes are the ones the world section
// shows. If the page's rules or data change, `npm run dete:data` brings DE-T back in line.
// Code written with AI assistance (Claude) for team RAACK.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fmtP, fmtSigned } from '../catalog';
import { worldEs } from '../i18n-world';
import { waterEn, waterEs } from '../i18n-water';
import { REGIONS } from '../water/catalog';
import { waterTrend } from '../water/engine';
import type { RegionId, WaterData } from '../water/types';
import { LAYERS, casePlace, countryPlace, firstLook, lookClass, readiness, tally } from '../world/layers';
import type { WorldData } from '../world/types';

interface Trend {
  sen_por_decada: number;
  ic95_ols_por_decada: [number, number];
  p: string;
  certeza: string;
  n: number;
  orden: number;
}
interface Base {
  agua_almacenada: { años: number[]; años_sin_dato: number[] };
  capas: { id: string; nombre: string; producto: string; origen: string }[];
  motivos: Record<string, [string, string]>;
  resumen: { paises: number; con_agua_almacenada: number; baja_confirmada: number; sube_confirmada: number; indicio_o_sin_tendencia: number; sin_senal: number };
  casos: Record<string, { nombre: string; name: string; pais: string; capas: Record<string, string>; listas: number; en_expediente: number; agua: { años: string; mascons: number; tendencia: Trend } | null }>;
  paises: Record<
    string,
    { nombre: string; name: string; capas: Record<string, string>; listas: number; agua: { tipo: string; mayor_que_el_pais: boolean; valores: number[]; tendencia: Trend } | null }
  >;
}

const read = <T>(file: string) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8')) as T;
const water = read<WaterData>('../../../public/data/water.json');
const world = read<WorldData>('../../../public/data/world.json');
const base = read<Base>('../../../dete/paises.json');

/** A figure as the page writes it («−6.7», «+5.1»), back to a number. */
const shown = (v: number) => Number(fmtSigned(v, 1, 'en').replace('−', '-').replace('+', ''));
/** The p-value as the page writes it (pW in water/format.ts). */
const pShown = (p: number | null) => (p === null ? 'p no calculable' : p < 0.001 ? `p ${fmtP(p, 'en')}` : `p = ${fmtP(p, 'en')}`);
const CERTAINTY: Record<string, string> = { confirmed: 'confirmada', hint: 'indicio', none: 'sin evidencia', nodata: 'sin datos' };

describe('la base por país de DE-T dice lo mismo que la página', () => {
  it('tiene los mismos países y las mismas diez capas, con sus nombres', () => {
    expect(Object.keys(base.paises)).toEqual(world.countries.map((c) => c.id));
    expect(base.capas.map((k) => [k.id, k.producto, k.origen])).toEqual(LAYERS.map((l) => [l.id, l.product, l.group === 'space' ? 'espacio' : 'tierra']));
    for (const k of base.capas) expect(k.nombre, k.id).toBe(worldEs[`wr.layer.${k.id}.name`]);
    for (const c of world.countries) {
      expect(base.paises[c.id].nombre).toBe(c.es);
      expect(base.paises[c.id].name).toBe(c.en);
    }
  });

  it('cada motivo es la frase de la página', () => {
    for (const [key, [, text]] of Object.entries(base.motivos)) expect(text, key).toBe(worldEs[`wr.why.${key}`]);
  });

  it('las capas listas de cada país son las que cuenta el globo', () => {
    for (const c of world.countries) {
      const r = readiness(countryPlace(c));
      const mine = base.paises[c.id];
      expect(mine.listas, c.id).toBe(r.ready);
      for (const l of r.layers) {
        expect(mine.capas[l.def.id], `${c.id} ${l.def.id}`).toBe(l.why);
        expect(base.motivos[l.why][0], `${c.id} ${l.def.id}`).toBe(l.state);
      }
    }
  });

  it('el primer vistazo de cada país lleva las cifras que enseña la página', () => {
    let withWater = 0;
    for (const c of world.countries) {
      const look = firstLook(world, c);
      const mine = base.paises[c.id].agua;
      if (!look) {
        expect(mine, c.id).toBeNull();
        continue;
      }
      withWater++;
      const t = mine!.tendencia;
      expect(t.sen_por_decada, `${c.id} pendiente`).toBe(shown(look.perDecade));
      expect(t.ic95_ols_por_decada, `${c.id} intervalo`).toEqual([shown(look.ci[0]), shown(look.ci[1])]);
      expect(t.p, `${c.id} p`).toBe(pShown(look.trend.p));
      expect(t.certeza, `${c.id} certeza`).toBe(CERTAINTY[look.trend.label]);
      expect(t.n, c.id).toBe(look.trend.n);
      expect(mine!.valores, c.id).toEqual(c.tws);
      expect(mine!.mayor_que_el_pais, c.id).toBe(look.wider);
      expect(mine!.tipo, c.id).toBe(c.twsKind === 'coast' ? 'costa' : 'punto');
      // The slope kept for sorting has the sign of the one shown.
      expect(Math.sign(t.orden), c.id).toBe(Math.sign(look.perDecade));
    }
    expect(withWater).toBe(base.resumen.con_agua_almacenada);
    expect(base.agua_almacenada.años).toEqual(world.grace.years);
  });

  it('el recuento global es el de la frase bajo el globo', () => {
    const total = tally(world.countries.map((c) => lookClass(firstLook(world, c))));
    expect(base.resumen).toEqual({
      paises: world.countries.length,
      con_agua_almacenada: world.countries.length - total.sea,
      baja_confirmada: total.falling,
      sube_confirmada: total.rising,
      indicio_o_sin_tendencia: total.hintFalling + total.hintRising + total.none,
      sin_senal: total.sea
    });
  });

  it('los dos casos de la herramienta: sus capas y su agua almacenada', () => {
    for (const id of ['nl', 'cv'] as RegionId[]) {
      const region = water.regions[id];
      const mine = base.casos[id];
      const r = readiness(casePlace(id, region, REGIONS[id].areaKm2), region);
      expect(mine.nombre).toBe(waterEs[`w.region.${id}.name`]);
      expect(mine.name).toBe(waterEn[`w.region.${id}.name`]);
      expect([mine.listas, mine.en_expediente], id).toEqual([r.ready, r.loaded]);
      for (const l of r.layers) expect(mine.capas[l.def.id], `${id} ${l.def.id}`).toBe(l.why);
      // The figure of the globe for a case: the whole record of its stored water.
      const trend = waterTrend(region.series.tws_grace);
      const t = mine.agua!.tendencia;
      expect(t.sen_por_decada, id).toBe(shown(trend.sen * 10));
      expect(t.ic95_ols_por_decada, id).toEqual([shown(trend.lo * 10), shown(trend.hi * 10)]);
      expect(t.p, id).toBe(pShown(trend.p));
      expect(t.certeza, id).toBe(CERTAINTY[trend.label]);
      expect(mine.agua!.años, id).toBe(`${trend.y0}-${trend.y1}`);
      expect(mine.agua!.mascons, id).toBe(region.cells.tws_grace_mascons);
    }
    expect(base.casos.nl.en_expediente).toBe(10);
  });
});
