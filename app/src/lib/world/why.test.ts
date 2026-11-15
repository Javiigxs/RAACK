// «Why 10 / 10?»: the figures the page gives for the evidence of each case, fixed against the data file.
// If the data changes, these numbers change with it and this test says which.
// Code written with AI assistance (Claude) for team RAACK.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { WaterData } from '../water/types';
import { CONFIDENCE_PCT, caseEvidence } from './why';

const data = JSON.parse(readFileSync(new URL('../../../public/data/water.json', import.meta.url), 'utf8')) as WaterData;

describe('lo que respaldan las capas de un caso', () => {
  it('el nivel de confianza que cita la página es el de las pruebas: 95 %', () => {
    expect(CONFIDENCE_PCT).toBe(95);
  });

  it('Nuevo León, 10 de 10: siete fuentes, veredicto confirmado y todas sus reglas con respuesta', () => {
    const e = caseEvidence(data, 'nl');
    expect(e.sources).toBe(7);
    expect(e.files).toBe(15);
    expect(e.series).toBe(27);
    expect([e.yearsWith, e.yearsSpan]).toEqual([670, 682]);
    expect(e.labels).toEqual({ confirmed: 8, hint: 4, none: 15, nodata: 0 });
    expect(e.verdict).toBe('confirmed');
    expect([e.rulesKnown, e.rules]).toEqual([6, 6]);
    expect([e.y0, e.y1]).toEqual([1998, 2026]);
    expect(e.checked).toBeGreaterThan(400);
  });

  it('sin los registros en tierra, el mismo caso se queda en indicio', () => {
    expect(caseEvidence(data, 'nl').withoutGround).toBe('hint');
  });

  it('las etiquetas suman las series y ninguna serie tiene más años que su periodo', () => {
    for (const id of ['nl', 'cv'] as const) {
      const e = caseEvidence(data, id);
      expect(Object.values(e.labels).reduce((q, n) => q + n, 0), id).toBe(e.series);
      expect(e.yearsWith, id).toBeLessThanOrEqual(e.yearsSpan);
      expect(e.rulesKnown, id).toBeLessThanOrEqual(e.rules);
    }
  });

  it('Valle Central: una sola fuente cargada, indicio y nada en tierra que quitar', () => {
    const e = caseEvidence(data, 'cv');
    expect(e.sources).toBe(1);
    expect(e.series).toBe(1);
    expect(e.verdict).toBe('hint');
    expect(e.rulesKnown).toBe(1);
    expect(e.withoutGround).toBeNull();
  });
});
