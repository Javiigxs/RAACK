// Comprueba, con los datos reales de Monterrey, las cifras que la página enseña en el laboratorio.
// Si un cambio en el motor o en los datos mueve uno de estos resultados, la prueba avisa
// antes de que el número llegue a la demo.
// Código escrito con ayuda de IA (Claude) para el equipo RAACK.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  analyzeSeries,
  compareSites,
  monthTrends,
  oppositeTwins,
  rainInside,
  rainWitness,
  stepCheck,
  twinYears,
  windowScan
} from './analysis';
import { MODIS_SITES, VARS, VAR_ORDER, kindOf, productOf } from './catalog';
import type { CaseData } from './types';

const data = JSON.parse(readFileSync(new URL('../../public/data/monterrey.json', import.meta.url), 'utf8')) as CaseData;

describe('noches del centro (MODIS LST nocturna, 2001–2025)', () => {
  const a = analyzeSeries(data, 'lstNight', 'mtycentro', 'standard', 2001, 2025, true);

  it('ritmo, intervalo y veredicto', () => {
    expect(a.nTotal).toBe(300);
    expect(a.nValid).toBe(259);
    expect(a.perDecade).toBeCloseTo(0.96, 2);
    expect(a.ci[0]).toBeCloseTo(0.71, 2);
    expect(a.ci[1]).toBeCloseTo(1.2, 2);
    expect(a.verdict.level).toBe('strong');
    expect(a.verdict.direction).toBe(1);
    expect(a.trend.nVotes).toBe(3);
  });

  it('coartada de la deriva de Terra: la tendencia ya existía en 2001–2019', () => {
    const pre = analyzeSeries(data, 'lstNight', 'mtycentro', 'standard', 2001, 2019, true, 1000);
    expect(pre.perDecade).toBeCloseTo(0.69, 2);
    expect(pre.verdict.level).toBe('strong');
    expect(pre.verdict.direction).toBe(1);
  });

  it('coartada del periodo: 136 ventanas, 90 con tendencia y ninguna a la baja', () => {
    const scan = windowScan(data, 'lstNight', 'mtycentro', 'standard', true);
    expect(scan.cells.length).toBe(136);
    const sig = scan.cells.filter((c) => c.enough && c.significant);
    expect(sig.length).toBe(90);
    expect(sig.every((c) => (c.perDecade ?? 0) > 0)).toBe(true);
  });

  it('coartada de los meses: doce resultados, uno por mes', () => {
    const months = monthTrends(a.monthly);
    expect(months.map((m) => m.month)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(months.every((m) => m.perDecade === null || Number.isFinite(m.perDecade))).toBe(true);
  });

  it('el filtro estricto deja al centro sin datos: no se opina', () => {
    const strict = analyzeSeries(data, 'lstNight', 'mtycentro', 'strict', 2001, 2025, true, 0);
    expect(strict.nValid).toBe(0);
    expect(strict.verdict.level).toBe('insufficient');
  });

  it('un periodo corto no alcanza la regla de 15 años', () => {
    const short = analyzeSeries(data, 'lstNight', 'mtycentro', 'standard', 2015, 2025, true, 0);
    expect(short.verdict.level).toBe('insufficient');
    expect(short.verdict.reason).toBe('short');
  });
});

describe('dónde cambia: cinco puntos', () => {
  it('las noches suben en los cinco; García la que más y Chipinque la que menos', () => {
    const results = compareSites(data, 'lstNight', 'standard', 2001, 2025, true);
    expect(results.map((r) => r.site)).toEqual(MODIS_SITES);
    expect(results.every((r) => r.analysis.verdict.level === 'strong' && r.analysis.verdict.direction === 1)).toBe(true);
    const ranked = [...results].sort((p, q) => q.analysis.perDecade - p.analysis.perDecade);
    expect(ranked[0].site).toBe('garcia');
    expect(ranked[0].analysis.perDecade).toBeCloseTo(1.1, 2);
    expect(ranked[4].site).toBe('chipinque');
    expect(ranked[4].analysis.perDecade).toBeCloseTo(0.67, 2);
    expect(oppositeTwins(results)).toBeNull();
  });

  it('el verdor solo cambia en Pesquería, y baja', () => {
    const results = compareSites(data, 'ndvi', 'standard', 2001, 2025, true);
    const decided = results.filter((r) => r.analysis.verdict.level === 'strong' || r.analysis.verdict.level === 'some');
    expect(decided.map((r) => r.site)).toEqual(['pesqueriakia']);
    const p = decided[0].analysis;
    expect(p.perDecade).toBeCloseTo(-0.088, 3);
    expect(p.verdict.direction).toBe(-1);
    // El centro tiene pocos meses fiables de NDVI: la regla del 80 % lo deja fuera.
    const centro = results.find((r) => r.site === 'mtycentro')!.analysis;
    expect(centro.verdict.level).toBe('insufficient');
    expect(centro.verdict.reason).toBe('gaps');
  });

  it('en Pesquería un escalón hacia 2011 describe el verdor mejor que una recta', () => {
    const a = analyzeSeries(data, 'ndvi', 'pesqueriakia', 'standard', 2001, 2025, true, 0);
    const step = stepCheck(a.annual);
    expect(step).not.toBeNull();
    expect(step!.year).toBe(2011);
    expect(step!.ratio).toBeLessThan(0.7);
    expect(step!.jump).toBeCloseTo(-0.155, 3);
  });
});

describe('lluvia: satélite y pluviómetro', () => {
  it('sin pruebas de tendencia en el total, ni en la celda ni en el observatorio', () => {
    const cell = analyzeSeries(data, 'rain', 'cell', 'standard', 2002, 2024, true);
    const gauge = analyzeSeries(data, 'rain', 'station', 'standard', 2002, 2024, true);
    expect(cell.nValid).toBe(276);
    expect(gauge.nValid).toBe(257);
    expect(cell.verdict.level).toBe('none');
    expect(gauge.verdict.level).toBe('none');
  });

  it('segundo testigo: 257 meses en común, correlación 0,92', () => {
    const w = rainWitness(data, 2002, 2024);
    expect(w.n).toBe(257);
    expect(w.r).toBeCloseTo(0.92, 2);
    expect(Math.round(w.bias!)).toBe(-9);
  });

  it('2016 y 2020 son años gemelos: casi el mismo total', () => {
    const inside = rainInside(data, 'imerg', 2002, 2024);
    expect(inside.completeYears).toBe(23);
    const twins = twinYears(inside.years, 0.02);
    const pair = twins.find((p) => p.a === 2016 && p.b === 2020);
    expect(pair).toBeDefined();
    expect(pair!.totalGap).toBeLessThan(0.02);
  });
});

describe('catálogo', () => {
  it('cada variable se puede analizar en cada uno de sus lugares', () => {
    for (const id of VAR_ORDER) {
      const def = VARS[id];
      for (const site of def.sites) {
        const a = analyzeSeries(data, id, site, 'standard', def.y0, def.y1, true, 0);
        expect(a.nTotal, `${id} en ${site}`).toBe((def.y1 - def.y0 + 1) * 12);
        expect(a.y0).toBe(def.y0);
        expect(a.y1).toBe(def.y1);
      }
    }
  });

  it('la lluvia del observatorio se rotula como estación, no como IMERG', () => {
    expect(productOf('rain', 'cell')).toBe('GPM IMERG');
    expect(kindOf('rain', 'cell')).toBe('mission');
    expect(productOf('rain', 'station')).toBe('SMN 19052');
    expect(kindOf('rain', 'station')).toBe('station');
    expect(kindOf('soil', 'merra')).toBe('model');
  });
});
