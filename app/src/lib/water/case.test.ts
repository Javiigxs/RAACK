// Fija las cifras y el veredicto que la página enseña en el caso del agua.
// Si un cambio en los datos, en el motor o en las reglas mueve uno de estos resultados,
// la prueba avisa antes de que llegue a la demo.
// Código escrito con ayuda de IA (Claude) para el equipo RAACK.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeCase, monthlyProfile, regionSpan } from './case';
import { REGIONS, SERIES, SUSPECTS } from './catalog';
import type { WaterData } from './types';

const data = JSON.parse(readFileSync(new URL('../../../public/data/water.json', import.meta.url), 'utf8')) as WaterData;

describe('Nuevo León, registro completo', () => {
  const c = analyzeCase(data, 'nl', REGIONS.nl.y0, REGIONS.nl.y1);
  const suspect = (id: string) => c.suspects.find((s) => s.id === id)!;

  it('veredicto: huella humana respaldada sobre una sequía puntual en 2022', () => {
    expect(c.verdict.kind).toBe('human');
    expect(c.verdict.human).toBe('backed');
    expect(c.verdict.oneOff).toBe(true);
    expect(c.verdict.crisisYear).toBe(2022);
    expect(c.verdict.droughtYears).toEqual([1999, 2011, 2022]);
    expect(c.verdict.notSupply).toBe(true);
    expect(c.verdict.notDemand).toBe(true);
    expect(c.verdict.missing).toEqual([]);
    expect(c.verdict.certainty).toBe('confirmed');
    expect(c.verdict.rules.map((r) => r.state)).toEqual(['no', 'no', 'yes', 'yes', 'yes', 'yes']);
    expect(suspect('human').finding).toBe('backed');
    expect(suspect('human').status).toBe('flagged');
  });

  it('lluvia: sin evidencia en la fuente principal y en sus siete testigos', () => {
    const r = suspect('rain');
    expect(r.main!.id).toBe('rain_imerg');
    expect(r.main!.perDecade).toBeCloseTo(33.0, 1);
    expect(r.main!.pct).toBeCloseTo(5.4, 1);
    expect(r.main!.trend.p).toBeCloseTo(0.359, 3);
    expect(r.main!.ci[0]).toBeCloseTo(-46.5, 1);
    expect(r.main!.ci[1]).toBeCloseTo(109.1, 1);
    expect(r.main!.trend.label).toBe('none');
    expect(r.others).toBe(7);
    expect(r.agree).toBe(7);
    expect(r.status).toBe('cleared');
  });

  it('anomalías de lluvia de 2022 y 2011', () => {
    const at = (s: typeof c.rainAnomaly, y: number) => s!.values[s!.years.indexOf(y)];
    expect(at(c.rainAnomaly, 2022)).toBeCloseTo(-32.7, 1);
    expect(at(c.witnessAnomaly, 2022)).toBeCloseTo(-26.8, 1);
    expect(at(c.rainAnomaly, 2011)).toBeCloseTo(-45.1, 1);
    expect(at(c.witnessAnomaly, 2011)).toBeCloseTo(-36.0, 1);
  });

  it('temperatura: sube, confirmada, en los tres registros', () => {
    const t = suspect('temp');
    expect(t.main!.perDecade).toBeCloseTo(0.6, 2);
    expect(t.lines.map((l) => l.trend.label)).toEqual(['confirmed', 'confirmed', 'confirmed']);
    expect(c.lines.temp_gldas_gal.perDecade).toBeCloseTo(0.93, 2);
    expect(c.lines.temp_smn.perDecade).toBeCloseTo(0.33, 2); // con años reales; 0,37 por paso
    expect(t.status).toBe('flagged');
  });

  it('evaporación: la demanda baja, no sube', () => {
    const e = suspect('evap');
    expect(e.main!.perDecade).toBeCloseTo(-95.5, 1);
    expect(e.main!.pct).toBeCloseTo(-2.7, 1);
    expect(e.finding).toBe('down');
    expect(e.status).toBe('cleared');
    expect(c.lines.pan_smn.perDecade).toBeCloseTo(-185.8, 1); // 19 años completos, con años reales
    expect(c.lines.pan_smn.trend.label).toBe('confirmed');
    expect(c.lines.pan_cerroprieto.trend.label).toBe('confirmed');
    expect(c.lines.pan_cuchillo.trend.label).toBe('none');
  });

  it('humedad del suelo: se seca Galeana, no Monterrey', () => {
    const s = suspect('soil');
    expect(s.main!.trend.label).toBe('none');
    expect(s.finding).toBe('downSome');
    expect(s.hotPlace!.id).toBe('soil_gldas_gal');
    expect(s.hotPlace!.perDecade).toBeCloseTo(-28.1, 1);
    expect(s.hotPlace!.pct).toBeCloseTo(-13.7, 1);
  });

  it('agua almacenada: baja 7,1 cm por década y la lluvia no lo explica', () => {
    expect(c.storage!.series.years.length).toBe(21);
    expect(c.storage!.perDecade).toBeCloseTo(-7.135, 2);
    expect(c.storage!.trend.senStep * 10).toBeCloseTo(-8.53, 2);
    expect(c.storage!.ci[0]).toBeCloseTo(-8.25, 2);
    expect(c.storage!.ci[1]).toBeCloseTo(-5.65, 2);
    expect(c.storage!.trend.label).toBe('confirmed');
    expect(c.rainFit!.n).toBe(19);
    expect(c.rainFit!.r2).toBeCloseTo(0.44, 2);
    expect(c.rainFit!.trend.sen * 10).toBeCloseTo(-4.05, 2);
    expect(c.rainFit!.trend.label).toBe('confirmed');
    expect(c.lossHm3).toBeCloseTo(457.7, 0);
  });

  it('presas: sin tendencia confirmada; en 2022 Cerro Prieto quedó en el 13 % de su media', () => {
    expect(c.reservoirs.map((r) => r.line.trend.label)).toEqual(['none', 'none', 'hint']);
    const cp = c.reservoirs.find((r) => r.place === 'cerroprieto')!;
    expect(cp.crisis).toBeCloseTo(27.5, 1);
    expect(cp.mean).toBeCloseTo(209.9, 1);
    expect(cp.crisisPct).toBeCloseTo(-86.9, 1);
    const ec = c.reservoirs.find((r) => r.place === 'cuchillo')!;
    expect(ec.crisis).toBeCloseTo(592.9, 1);
    expect(ec.mean).toBeCloseTo(900.0, 1);
    // La Boca: la corrección de Hamed-Rao deja la varianza negativa; el valor p no existe.
    expect(c.reservoirs.find((r) => r.place === 'laboca')!.line.trend.p).toBeNull();
  });

  it('acuíferos del DOF: 13 de 23 en déficit', () => {
    expect(c.aquifers!.total).toBe(23);
    expect(c.aquifers!.negative).toBe(13);
    expect(c.aquifers!.deficit).toBeCloseTo(-381.1, 1);
    expect(c.aquifers!.monterrey.length).toBe(5);
    expect(c.aquifers!.monterreyAllNegative).toBe(true);
    expect(c.aquifers!.largest.map((a) => a.name)).toEqual(['Citrícola Sur', 'Sabinas-Parás', 'Navidad-Potosí-Raíces', 'Citrícola Norte']);
  });

  it('el perfil mensual de 2022 tiene doce meses', () => {
    const p = monthlyProfile(data.regions.nl.monthly.rain_imerg, 2022)!;
    expect(p.year.length).toBe(12);
    expect(p.usual.every(Number.isFinite)).toBe(true);
    expect(monthlyProfile(data.regions.nl.monthly.rain_imerg, 2025)).toBeNull(); // IMERG acaba en septiembre de 2025
  });
});

describe('robustez del veredicto de Nuevo León con otros periodos', () => {
  for (const [a, b, rate] of [
    [2003, 2019, -4.24],
    [2003, 2021, -5.21],
    [2005, 2024, -6.76],
    [2011, 2026, -8.14]
  ] as const) {
    it(`${a}–${b}: el agua almacenada sigue bajando, confirmada`, () => {
      const c = analyzeCase(data, 'nl', a, b);
      expect(c.storage!.perDecade).toBeCloseTo(rate, 2);
      expect(c.storage!.trend.label).toBe('confirmed');
      expect(c.verdict.kind).toBe('human');
    });
  }

  it('un periodo de menos de 15 años no recibe veredicto', () => {
    const c = analyzeCase(data, 'nl', 2015, 2024);
    expect(c.storage!.trend.label).toBe('nodata');
    expect(c.verdict.kind).toBe('none');
    expect(c.verdict.missing).toContain('storage');
    // El registro oficial sigue ahí, pero sin caso indirecto no se acusa a nadie.
    expect(c.suspects.find((s) => s.id === 'human')!.finding).toBe('officialOnly');
  });
});

describe('Valle Central de California', () => {
  const c = analyzeCase(data, 'cv', REGIONS.cv.y0, REGIONS.cv.y1);

  it('el agua almacenada baja; sin lluvia ni evaporación cargadas, solo «posible»', () => {
    expect(c.storage!.perDecade).toBeCloseTo(-13.06, 2);
    expect(c.storage!.trend.p).toBeCloseTo(0.0003, 4);
    expect(c.storage!.trend.label).toBe('confirmed');
    expect(c.verdict.kind).toBe('human');
    expect(c.verdict.human).toBe('possible');
    expect(c.suspects.find((s) => s.id === 'human')!.finding).toBe('indirect');
    expect(c.verdict.certainty).toBe('hint');
    expect(c.verdict.notSupply).toBe(false);
    expect(c.verdict.notDemand).toBe(false);
    if (!data.regions.cv.series.rain_imerg) expect(c.verdict.missing).toEqual(['rain', 'evap', 'official']);
  });

  it('mínimo en 2021 y 2022', () => {
    const s = c.storage!.full;
    const low = s.years.map((y, i) => [s.values[i], y]).sort((p, q) => p[0] - q[0]).slice(0, 2);
    expect(low.map((x) => x[1]).sort()).toEqual([2021, 2022]);
  });
});

describe('catálogo', () => {
  it('toda serie del archivo de datos está descrita y toda línea de un sospechoso existe en el catálogo', () => {
    for (const region of Object.values(data.regions)) for (const id of Object.keys(region.series)) expect(SERIES[id], id).toBeDefined();
    for (const s of SUSPECTS) for (const l of s.lines) expect(SERIES[l.id], l.id).toBeDefined();
  });

  it('los periodos del catálogo cubren los datos', () => {
    expect(regionSpan(data, 'nl')).toEqual([REGIONS.nl.y0, REGIONS.nl.y1]);
    expect(regionSpan(data, 'cv')).toEqual([REGIONS.cv.y0, REGIONS.cv.y1]);
  });
});
