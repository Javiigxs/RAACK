// DE-T · Exporta la base de datos del agente (series_nl.json) desde los datos de la página.
//
// La página (public/data/water.json) ya trae las 27 series anuales de Nuevo León y, para cada una,
// la tendencia calculada en Python con pymannkendall y statsmodels por scripts/build_water.py: es la
// referencia que fijan las pruebas de la página. Este script copia esos valores y esa referencia,
// sin volver a calcular nada, para que DE-T diga exactamente las mismas cifras que la página.
//
// Sustituye a exportar_series_nl.py del zip «hydrodetective-asistente» (15 de noviembre de 2026):
// aquel script medía la pendiente de Sen por paso de la serie y no por año real, así que en las
// series con años que faltan daba otra cifra (GRACE: −8,53 cm por década frente a −7,135), y
// usaba otra prueba cuando Hamed–Rao no se puede calcular (La Boca salía «confirmada» y la página
// dice «indicio»). Los nombres, fuentes y notas de cada serie son los del zip.
//
// Uso, desde app/:  node dete/exportar_series.mjs [entrada.json] [salida.json]
// Código escrito con ayuda de IA (Claude) para el equipo RAACK.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ENTRADA = process.argv[2] ?? path.join(AQUI, '../public/data/water.json');
const SALIDA = process.argv[3] ?? path.join(AQUI, 'series_nl.json');

const GLDAS = 'NASA GLDAS Noah 2.1 (modelo)';
const PRESA = 'CONAGUA, registros diarios de la presa';
const SMN = 'SMN/CONAGUA, estación 19052 Monterrey (Obs.)';

/** id del agente → id de la página, con lo que el agente dice de cada serie. */
const SERIES = {
  lluvia_imerg_nl: ['rain_imerg', 'Lluvia anual (satélite)', 'mm/año', 'NASA GPM IMERG Final V07', 'Recuadro Nuevo León'],
  lluvia_chirps_nl: ['rain_chirps', 'Lluvia anual (satélite + estaciones)', 'mm/año', 'CHIRPS v2 (UCSB/USGS)', 'Recuadro Nuevo León'],
  grace_nl: [
    'tws_grace',
    'Agua almacenada total (anomalía)',
    'cm de agua',
    'NASA GRACE/GRACE-FO JPL Mascon RL06.3 v04',
    'Recuadro Nuevo León',
    'Resolución efectiva ~300 km; hueco 2017-2018 entre misiones; incluye suelo, acuíferos y presas.'
  ],
  gldas_mty_lluvia: ['rain_gldas_mty', 'Lluvia líquida (modelo)', 'mm/año', GLDAS, 'Punto Monterrey'],
  gldas_mty_evap_real: ['et_gldas_mty', 'Evaporación real', 'mm/año', GLDAS, 'Punto Monterrey'],
  gldas_mty_evap_potencial: ['pet_gldas_mty', 'Evaporación potencial', 'mm/año (aprox.)', GLDAS, 'Punto Monterrey'],
  gldas_mty_humedad_suelo: ['soil_gldas_mty', 'Humedad del suelo (zona de raíces)', 'mm', GLDAS, 'Punto Monterrey'],
  gldas_mty_escurrimiento: ['runoff_gldas_mty', 'Escurrimiento total', 'mm/año', GLDAS, 'Punto Monterrey'],
  gldas_mty_temperatura: ['temp_gldas_mty', 'Temperatura media del aire', '°C', GLDAS, 'Punto Monterrey'],
  gldas_gal_lluvia: ['rain_gldas_gal', 'Lluvia líquida (modelo)', 'mm/año', GLDAS, 'Punto Galeana'],
  gldas_gal_evap_real: ['et_gldas_gal', 'Evaporación real', 'mm/año', GLDAS, 'Punto Galeana'],
  gldas_gal_evap_potencial: ['pet_gldas_gal', 'Evaporación potencial', 'mm/año (aprox.)', GLDAS, 'Punto Galeana'],
  gldas_gal_humedad_suelo: ['soil_gldas_gal', 'Humedad del suelo (zona de raíces)', 'mm', GLDAS, 'Punto Galeana'],
  gldas_gal_escurrimiento: ['runoff_gldas_gal', 'Escurrimiento total', 'mm/año', GLDAS, 'Punto Galeana'],
  gldas_gal_temperatura: ['temp_gldas_gal', 'Temperatura media del aire', '°C', GLDAS, 'Punto Galeana'],
  presa_cuchillo_volumen: ['vol_cuchillo', 'Volumen medio anual de El Cuchillo', 'Mm³', PRESA, 'El Cuchillo'],
  presa_cuchillo_evap_tanque: ['pan_cuchillo', 'Evaporación de tanque en El Cuchillo', 'mm/año', PRESA, 'El Cuchillo'],
  presa_cuchillo_lluvia: ['rain_cuchillo', 'Lluvia medida en El Cuchillo', 'mm/año', PRESA, 'El Cuchillo'],
  presa_cerro_prieto_volumen: ['vol_cerroprieto', 'Volumen medio anual de Cerro Prieto', 'Mm³', PRESA, 'Cerro Prieto'],
  presa_cerro_prieto_evap_tanque: ['pan_cerroprieto', 'Evaporación de tanque en Cerro Prieto', 'mm/año', PRESA, 'Cerro Prieto'],
  presa_cerro_prieto_lluvia: ['rain_cerroprieto', 'Lluvia medida en Cerro Prieto', 'mm/año', PRESA, 'Cerro Prieto'],
  presa_la_boca_volumen: ['vol_laboca', 'Volumen medio anual de La Boca', 'Mm³', PRESA, 'La Boca'],
  presa_la_boca_evap_tanque: ['pan_laboca', 'Evaporación de tanque en La Boca', 'mm/año', PRESA, 'La Boca'],
  presa_la_boca_lluvia: ['rain_laboca', 'Lluvia medida en La Boca', 'mm/año', PRESA, 'La Boca'],
  smn_lluvia: ['rain_smn', 'Lluvia anual (estación)', 'mm/año', SMN, 'Monterrey'],
  smn_evap_tanque: ['pan_smn', 'Evaporación de tanque (estación)', 'mm/año', SMN, 'Monterrey'],
  smn_temperatura: ['temp_smn', 'Temperatura media (estación)', '°C', SMN, 'Monterrey']
};

/** Series que son una anomalía (su media es casi cero): un porcentaje de su media no significa nada. */
const ANOMALIA = new Set(['grace_nl']);
const CERTEZA = { confirmed: 'confirmada', hint: 'indicio', none: 'sin evidencia', nodata: 'sin datos' };
const r = (v, d) => (v === null || v === undefined || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);

export function exportar(water) {
  const nl = water.regions?.nl;
  if (!nl) throw new Error('water.json no tiene la región nl');
  const series = {};
  for (const [id, [pid, nombre, unidad, fuente, lugar, nota]] of Object.entries(SERIES)) {
    const s = nl.series[pid];
    if (!s) throw new Error(`water.json no tiene la serie ${pid}`);
    const pares = s.years.map((y, i) => [y, s.values[i]]).filter(([, v]) => v !== null && Number.isFinite(v));
    const y0 = pares[0][0];
    const y1 = pares[pares.length - 1][0];
    const ref = nl.reference?.[pid]?.[`${y0}-${y1}`];
    if (!ref) throw new Error(`water.json no trae la tendencia de referencia de ${pid} para ${y0}-${y1}`);
    const faltan = [];
    for (let y = y0; y <= y1; y++) if (!pares.some(([a]) => a === y)) faltan.push(y);
    const media = ref.mean;
    series[id] = {
      id_pagina: pid,
      nombre,
      unidad,
      fuente,
      lugar,
      años: `${y0}-${y1}`,
      n: pares.length,
      ...(faltan.length ? { años_sin_dato: faltan } : {}),
      media: r(media, 2),
      valores: Object.fromEntries(pares.map(([y, v]) => [String(y), r(v, 2)])),
      tendencia: {
        metodo_mk: ref.p === null ? 'Hamed-Rao no calculable (autocorrelación muy fuerte): el veredicto usa solo la recta OLS-HAC' : 'Hamed-Rao',
        sen_por_decada: r(ref.sen * 10, 3),
        p_mk: r(ref.p, 4),
        ols_por_decada: r(ref.ols * 10, 3),
        ic95_ols_por_decada: [r(ref.lo * 10, 3), r(ref.hi * 10, 3)],
        cambio_pct_por_decada: media && !ANOMALIA.has(id) ? r(((ref.sen * 10) / Math.abs(media)) * 100, 1) : null,
        certeza: CERTEZA[ref.label] ?? ref.label
      },
      ...(nota ? { nota } : {})
    };
  }
  const acuiferos = {
    fuente: 'DOF 9-nov-2023, disponibilidad media anual de agua subterránea (corte 30-dic-2022)',
    unidad: 'hm³/año',
    columnas: { R: 'recarga', DNC: 'descarga natural comprometida', VCAS: 'volumen concesionado', DMA: 'disponibilidad (negativo = déficit)' },
    nota: 'surte_area_monterrey: los cinco acuíferos que abastecen al área metropolitana de Monterrey, según la lista del equipo.',
    acuiferos: nl.aquifers.map((a) => ({
      clave: a.id,
      acuifero: a.name,
      recarga_R_hm3: a.recharge,
      descarga_natural_comprometida_DNC_hm3: a.committed,
      volumen_concesionado_VCAS_hm3: a.concessioned,
      disponibilidad_media_anual_DMA_hm3: a.availability,
      surte_area_monterrey: a.monterrey
    }))
  };
  return {
    region: 'nuevo-leon',
    origen: `app/public/data/water.json (${water.generated ?? 'sin fecha'}): valores anuales y tendencias de referencia de scripts/build_water.py`,
    series,
    acuiferos
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const base = exportar(JSON.parse(fs.readFileSync(ENTRADA, 'utf8')));
  fs.writeFileSync(SALIDA, JSON.stringify(base, null, 1) + '\n', 'utf8');
  console.log(`${Object.keys(base.series).length} series y ${base.acuiferos.acuiferos.length} acuíferos -> ${path.relative(process.cwd(), SALIDA)}`);
}
