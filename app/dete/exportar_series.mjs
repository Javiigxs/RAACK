// DE-T · Exporta las bases de datos del agente desde los datos de la página:
//   series_nl.json  las 27 series anuales de Nuevo León y la tabla de acuíferos (de public/data/water.json)
//   paises.json     los 243 países y territorios del globo: qué capas de datos tiene listas cada uno y
//                   el primer vistazo a su agua almacenada (de public/data/world.json)
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
// La base por país (15 de noviembre de 2026, idea de Fran: preguntar a DE-T donde se elige el país)
// copia de public/data/world.json la serie de GRACE de cada país y su tendencia de referencia, y
// aplica las mismas reglas de cobertura que la página (src/lib/world/layers.ts) para decir qué capas
// están listas. Las pruebas comparan país por país el resultado con lo que muestra la página.
//
// Uso, desde app/:  node dete/exportar_series.mjs   (o npm run dete:data)
// Código escrito con ayuda de IA (Claude) para el equipo RAACK.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ENTRADA = path.join(AQUI, '../public/data/water.json');
const SALIDA = path.join(AQUI, 'series_nl.json');
const ENTRADA_MUNDO = path.join(AQUI, '../public/data/world.json');
const SALIDA_MUNDO = path.join(AQUI, 'paises.json');

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

// ---------- La base por país ----------

/** Límites publicados de los productos abiertos: los mismos de COVERAGE en src/lib/world/layers.ts. */
export const COBERTURA = { imergLat: 60, chirpsLat: 50, gldasSurLat: -60, gldasCeldaKm2: 770, graceMasconKm2: 112_000 };

/** Las diez capas de datos del caso, en el orden de la página (LAYERS en src/lib/world/layers.ts). */
export const CAPAS = [
  { id: 'rain', nombre: 'Lluvia de satélite', producto: 'GPM IMERG Final V07', origen: 'espacio', fuente: 'imerg' },
  { id: 'rain2', nombre: 'Un segundo registro de lluvia', producto: 'CHIRPS v2.0', origen: 'espacio', fuente: 'chirps' },
  { id: 'temp', nombre: 'Temperatura del aire', producto: 'GLDAS-2.1 Noah', origen: 'espacio', fuente: 'gldas' },
  { id: 'evap', nombre: 'Demanda de evaporación', producto: 'GLDAS-2.1 Noah', origen: 'espacio', fuente: 'gldas' },
  { id: 'soil', nombre: 'Humedad del suelo', producto: 'GLDAS-2.1 Noah', origen: 'espacio', fuente: 'gldas' },
  { id: 'runoff', nombre: 'Escurrimiento', producto: 'GLDAS-2.1 Noah', origen: 'espacio', fuente: 'gldas' },
  { id: 'storage', nombre: 'Agua almacenada total', producto: 'GRACE / GRACE-FO JPL RL06.3', origen: 'espacio', fuente: 'grace' },
  { id: 'station', nombre: 'Una estación meteorológica en tierra', producto: '', origen: 'tierra', fuente: 'station' },
  { id: 'reservoirs', nombre: 'Almacenamiento de las presas', producto: '', origen: 'tierra', fuente: 'reservoirs' },
  { id: 'official', nombre: 'Balance oficial del agua subterránea', producto: '', origen: 'tierra', fuente: 'official' }
];

/** Cómo se dice cada estado, con las palabras de la página (wr.sum.* en i18n-world.ts). */
export const ESTADOS = {
  loaded: 'ya en la herramienta',
  open: 'abierta para descargar hoy',
  partial: 'cubierta en parte',
  out: 'sin cobertura',
  local: 'por reunir en tierra'
};

/** Por qué una capa está en su estado: [estado, frase]. Las frases son las de la página (wr.why.*). */
export const MOTIVOS = {
  'imerg.open': ['open', 'Campos completos entre 60° S y 60° N.'],
  'imerg.partial': ['partial', 'Más allá de los 60° de latitud el producto tiene huecos: no estima sobre nieve ni hielo.'],
  'imerg.loaded': ['loaded', 'Lluvia mensual de cada celda del recuadro, guardada en el repositorio.'],
  'chirps.open': ['open', 'Cubre la tierra firme entre 50° S y 50° N.'],
  'chirps.out': ['out', 'Termina en los 50° de latitud y este punto queda más allá: el segundo registro de lluvia tiene que salir de otra fuente.'],
  'chirps.loaded': ['loaded', 'Lluvia mensual de cada celda del recuadro, guardada en el repositorio.'],
  'gldas.open': ['open', 'Cubre toda la tierra firme al norte de 60° S.'],
  'gldas.small': ['partial', 'Más pequeño que una celda del modelo (0.25°, unos 770 km²): puede no haber ninguna celda de tierra aquí.'],
  'gldas.out': ['out', 'El modelo no tiene celdas al sur de 60° S.'],
  'gldas.loaded': ['loaded', 'Dos puntos del modelo, mes a mes, guardados en el repositorio.'],
  'grace.open': ['open', 'Mundial. El archivo ya está en el repositorio: solo hay que recortar el recuadro.'],
  'grace.point': ['loaded', 'Ya calculada con el archivo mundial del repositorio: el mascon bajo el punto de referencia.'],
  'grace.coast': ['loaded', 'Ya calculada con el archivo mundial del repositorio: la parte terrestre del mascon costero bajo el punto de referencia.'],
  'grace.sea': ['out', 'El mascon aquí es mar abierto: GRACE no tiene señal de tierra para un lugar tan pequeño.'],
  'grace.loaded': ['loaded', 'Promedio de los mascons dentro del recuadro, con el archivo mundial del repositorio.'],
  'station.local': [
    'local',
    'Un registro diario largo de lluvia, temperatura y evaporación de tanque. Pídelo al servicio meteorológico nacional; NOAA lista estaciones de todo el mundo, pero revisa dónde termina cada registro.'
  ],
  'station.loaded': ['loaded', 'Lluvia, temperatura y evaporación de tanque diarias, guardadas en el repositorio.'],
  'reservoirs.local': [
    'local',
    'El almacenamiento de las presas principales, día a día. Pídelo a la agencia nacional del agua. SWOT, de la NASA, mide el nivel de embalses en todo el mundo, pero solo desde 2023: muy poco para una tendencia.'
  ],
  'reservoirs.loaded': ['loaded', 'Almacenamiento diario de tres presas, guardado en el repositorio.'],
  'official.local': [
    'local',
    'El balance oficial de cada acuífero: la recarga frente a lo concesionado. Pídelo a la autoridad del agua. Sin él, el veredicto se queda en «posible huella humana».'
  ],
  'official.loaded': ['loaded', 'La tabla oficial, contrastada con el acuerdo publicado.']
};

const CONTINENTE = { Africa: 'África', Americas: 'América', Asia: 'Asia', Europe: 'Europa', Oceania: 'Oceanía' };

/** Qué dice la cobertura publicada de cada producto en un punto (coverageAt en layers.ts). */
function motivoAbierto(capa, lat, area) {
  switch (capa.fuente) {
    case 'imerg':
      return Math.abs(lat) <= COBERTURA.imergLat ? 'imerg.open' : 'imerg.partial';
    case 'chirps':
      return Math.abs(lat) <= COBERTURA.chirpsLat ? 'chirps.open' : 'chirps.out';
    case 'gldas':
      if (lat < COBERTURA.gldasSurLat) return 'gldas.out';
      return area !== null && area < COBERTURA.gldasCeldaKm2 ? 'gldas.small' : 'gldas.open';
    case 'grace':
      return 'grace.open';
    default:
      return `${capa.fuente}.local`;
  }
}

/** Las diez capas de un país: el agua almacenada ya está calculada; el resto sale de la cobertura. */
function capasDePais(c) {
  return Object.fromEntries(
    CAPAS.map((k) => {
      if (k.fuente === 'grace') return [k.id, c.tws ? (c.twsKind === 'coast' ? 'grace.coast' : 'grace.point') : 'grace.sea'];
      return [k.id, motivoAbierto(k, c.lat, c.area)];
    })
  );
}

/** Qué series del expediente de una región hablan por cada capa (inCase en layers.ts). */
const EN_EXPEDIENTE = {
  rain: (k) => k === 'rain_imerg',
  rain2: (k) => k === 'rain_chirps',
  temp: (k) => k.startsWith('temp_gldas'),
  evap: (k) => k.startsWith('pet_gldas'),
  soil: (k) => k.startsWith('soil_gldas'),
  runoff: (k) => k.startsWith('runoff_gldas'),
  storage: (k) => k === 'tws_grace',
  station: (k) => /^(rain|temp|pan)_smn$/.test(k),
  reservoirs: (k) => k.startsWith('vol_')
};

/** Las diez capas de un caso de la herramienta: lo que está en su expediente y, si no, la cobertura. */
function capasDeCaso(region) {
  const lat = (region.box.latMin + region.box.latMax) / 2;
  const claves = Object.keys(region.series);
  return Object.fromEntries(
    CAPAS.map((k) => {
      const esta = k.id === 'official' ? region.aquifers.length > 0 : claves.some(EN_EXPEDIENTE[k.id]);
      return [k.id, esta ? `${k.fuente}.loaded` : motivoAbierto(k, lat, null)];
    })
  );
}

const listas = (capas) => Object.values(capas).filter((m) => MOTIVOS[m][0] === 'loaded' || MOTIVOS[m][0] === 'open').length;

/** Un decimal, redondeado como lo hace la página (Intl.NumberFormat sobre el valor completo). */
const r1 = (v) => (v === null || v === undefined || !Number.isFinite(v) ? null : Math.sign(v) * Number(Math.abs(v).toFixed(1)) || 0);

/** El p-valor como lo escribe la página (pW en src/lib/water/format.ts). */
function textoP(p) {
  if (p === null || p === undefined || !Number.isFinite(p)) return 'p no calculable';
  return p < 0.001 ? 'p < 0.001' : `p = ${p.toFixed(p < 0.01 ? 3 : 2)}`;
}

/**
 * El primer vistazo al agua almacenada con las mismas cifras que enseña la página: pendiente de Sen e
 * intervalo de la recta por década con un decimal, y el p-valor escrito igual. Se redondea desde el
 * valor completo: redondear dos veces cambiaba la cifra en nueve países (Italia: −6,7495 daría −6,8
 * y la página dice −6,7; su p = 0,000997 daría «p = 0,001» y la página dice «p < 0,001»).
 * «orden» es la pendiente con tres decimales y solo sirve para ordenar países: DE-T no la dice.
 */
function tendenciaDe(ref) {
  return {
    sen_por_decada: r1(ref.sen * 10),
    ic95_ols_por_decada: [r1(ref.lo * 10), r1(ref.hi * 10)],
    p: textoP(ref.p),
    certeza: CERTEZA[ref.label] ?? ref.label,
    n: ref.n,
    orden: r(ref.sen * 10, 3)
  };
}

const CASOS = {
  nl: { nombre: 'Nuevo León, México', name: 'Nuevo León, Mexico', pais: 'MX' },
  cv: { nombre: 'Valle Central, California', name: 'Central Valley, California', pais: 'US' }
};

export function exportarPaises(world, water) {
  const años = world.grace?.years;
  if (!Array.isArray(años) || !Array.isArray(world.countries)) throw new Error('world.json no tiene grace.years o countries');
  const faltan = [];
  for (let y = años[0]; y <= años[años.length - 1]; y++) if (!años.includes(y)) faltan.push(y);

  const paises = {};
  const resumen = { paises: world.countries.length, con_agua_almacenada: 0, baja_confirmada: 0, sube_confirmada: 0, indicio_o_sin_tendencia: 0, sin_senal: 0 };
  for (const c of world.countries) {
    const capas = capasDePais(c);
    let agua = null;
    if (c.tws) {
      if (!c.ref) throw new Error(`world.json no trae la tendencia de referencia de ${c.id}`);
      if (c.tws.length !== años.length) throw new Error(`La serie de ${c.id} no tiene un valor por año`);
      agua = {
        tipo: c.twsKind === 'coast' ? 'costa' : 'punto',
        mascon: c.mascon,
        mayor_que_el_pais: c.area !== null && c.area < COBERTURA.graceMasconKm2,
        valores: c.tws.map((v) => r(v, 3)),
        tendencia: tendenciaDe(c.ref)
      };
      resumen.con_agua_almacenada++;
      if (c.ref.label === 'confirmed' && c.ref.sen < 0) resumen.baja_confirmada++;
      else if (c.ref.label === 'confirmed' && c.ref.sen > 0) resumen.sube_confirmada++;
      else resumen.indicio_o_sin_tendencia++;
    } else resumen.sin_senal++;
    paises[c.id] = {
      iso3: c.iso3,
      nombre: c.es,
      name: c.en,
      continente: CONTINENTE[c.region] ?? c.region,
      lat: c.lat,
      lon: c.lon,
      area_km2: c.area,
      capas,
      listas: listas(capas),
      agua
    };
  }

  const casos = {};
  for (const [id, quien] of Object.entries(CASOS)) {
    const region = water.regions?.[id];
    if (!region) throw new Error(`water.json no tiene la región ${id}`);
    const capas = capasDeCaso(region);
    const s = region.series.tws_grace;
    const pares = s ? s.years.map((y, i) => [y, s.values[i]]).filter(([, v]) => v !== null && Number.isFinite(v)) : [];
    const periodo = pares.length ? `${pares[0][0]}-${pares[pares.length - 1][0]}` : '';
    const ref = region.reference?.tws_grace?.[periodo];
    casos[id] = {
      ...quien,
      capas,
      listas: listas(capas),
      en_expediente: Object.values(capas).filter((m) => MOTIVOS[m][0] === 'loaded').length,
      agua: ref ? { años: periodo, mascons: region.cells?.tws_grace_mascons ?? null, tendencia: tendenciaDe(ref) } : null
    };
  }

  return {
    region: 'mundo',
    origen:
      `app/public/data/world.json (${world.generated ?? 'sin fecha'}), de scripts/build_world.py: la serie de GRACE bajo el punto de ` +
      `referencia de cada país y su tendencia de referencia; las capas, con las reglas de cobertura de la página. ` +
      `Los dos casos, de app/public/data/water.json (${water.generated ?? 'sin fecha'}).`,
    agua_almacenada: {
      producto: 'NASA GRACE/GRACE-FO JPL Mascon RL06.3 v04',
      unidad: 'cm de agua (anomalía, sin el ciclo estacional)',
      años,
      años_sin_dato: faltan
    },
    capas: CAPAS.map(({ id, nombre, producto, origen }) => ({ id, nombre, producto, origen })),
    estados: ESTADOS,
    motivos: MOTIVOS,
    resumen,
    casos,
    paises
  };
}

/** paises.json con un país por línea, para que un cambio en los datos se lea en el diff. */
export function textoPaises(base) {
  const { paises, ...cabecera } = base;
  const filas = Object.entries(paises).map(([id, p]) => `  ${JSON.stringify(id)}: ${JSON.stringify(p)}`);
  return `${JSON.stringify(cabecera, null, 1).slice(0, -2)},\n "paises": {\n${filas.join(',\n')}\n }\n}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const water = JSON.parse(fs.readFileSync(ENTRADA, 'utf8'));
  const base = exportar(water);
  fs.writeFileSync(SALIDA, JSON.stringify(base, null, 1) + '\n', 'utf8');
  console.log(`${Object.keys(base.series).length} series y ${base.acuiferos.acuiferos.length} acuíferos -> ${path.relative(process.cwd(), SALIDA)}`);
  const mundo = exportarPaises(JSON.parse(fs.readFileSync(ENTRADA_MUNDO, 'utf8')), water);
  fs.writeFileSync(SALIDA_MUNDO, textoPaises(mundo), 'utf8');
  console.log(`${mundo.resumen.paises} países (${mundo.resumen.con_agua_almacenada} con agua almacenada) y ${Object.keys(mundo.casos).length} casos -> ${path.relative(process.cwd(), SALIDA_MUNDO)}`);
}
