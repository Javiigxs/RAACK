// Convierte las series de trabajo del repositorio (datos/series/*.csv) en el archivo
// compacto que lee la página: public/data/monterrey.json.
// No modifica ningún CSV. Guarda el SHA-256 de cada archivo de entrada para poder
// comprobar con qué datos exactos se generó la página.
// Uso, desde app/:  node scripts/build-data.mjs
// Código escrito con ayuda de IA (Claude) para el equipo RAACK.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..');
const seriesDir = join(repo, 'datos', 'series');
const outFile = join(here, '..', 'public', 'data', 'monterrey.json');

const inputs = {};

function readCsv(name) {
  const path = join(seriesDir, name);
  const bytes = readFileSync(path);
  inputs[`datos/series/${name}`] = {
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex')
  };
  const lines = bytes.toString('utf8').split(/\r?\n/).filter((l) => l.length > 0);
  const header = lines[0].split(',');
  return lines.slice(1).map((line, n) => {
    const cells = line.split(',');
    if (cells.length !== header.length) throw new Error(`${name}: fila ${n + 2} con ${cells.length} columnas`);
    return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  });
}

const num = (s) => (s === '' || s === undefined ? null : Number(s));
const DAY = 86400000;
const utc = (iso) => Date.parse(`${iso}T00:00:00Z`);

function fail(msg) {
  throw new Error(`build-data: ${msg}`);
}

// ---------- Lluvia diaria (IMERG y pluviómetro SMN) y temperatura del aire (SMN)
const rain = readCsv('lluvia_diaria.csv');
const air = readCsv('temperatura_aire_diaria.csv');
const dailyStart = '2002-01-01';
const dailyEnd = '2024-12-31';
const nDays = Math.round((utc(dailyEnd) - utc(dailyStart)) / DAY) + 1;
const daily = {
  imerg_mm: new Array(nDays).fill(null),
  smn_mm: new Array(nDays).fill(null),
  smn_tmax: new Array(nDays).fill(null),
  smn_tmin: new Array(nDays).fill(null)
};
const seen = { IMERG: 0, SMN: 0 };
for (const r of rain) {
  const i = Math.round((utc(r.fecha) - utc(dailyStart)) / DAY);
  if (i < 0 || i >= nDays) fail(`lluvia fuera de rango: ${r.fecha}`);
  const v = num(r.lluvia_mm);
  if (v !== null && (!(v >= 0) || !Number.isFinite(v))) fail(`lluvia inválida el ${r.fecha}`);
  if (r.fuente === 'IMERG') daily.imerg_mm[i] = v;
  else if (r.fuente === 'SMN') daily.smn_mm[i] = v;
  else fail(`fuente de lluvia desconocida: ${r.fuente}`);
  seen[r.fuente]++;
}
if (seen.IMERG !== nDays || seen.SMN !== nDays) fail(`se esperaban ${nDays} días por fuente de lluvia`);
for (const r of air) {
  const i = Math.round((utc(r.fecha) - utc(dailyStart)) / DAY);
  if (i < 0 || i >= nDays) fail(`temperatura fuera de rango: ${r.fecha}`);
  daily.smn_tmax[i] = num(r.maxima_c);
  daily.smn_tmin[i] = num(r.minima_c);
}

// ---------- Humedad en la zona de raíces (MERRA-2, mensual)
const soilRows = readCsv('humedad_raices_mensual.csv');
const soilY0 = Number(soilRows[0].fecha_inicio.slice(0, 4));
const soil = soilRows.map((r, k) => {
  const expected = `${soilY0 + Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}-01`;
  if (r.fecha_inicio !== expected) fail(`humedad: se esperaba ${expected} y llegó ${r.fecha_inicio}`);
  return num(r.saturacion_relativa_0_1);
});

// ---------- Temperatura superficial MODIS (compuestos de 8 días, cinco sitios)
const lstRows = readCsv('temperatura_superficial_8dias.csv');
const lstDates = [...new Set(lstRows.map((r) => r.fecha_inicio))].sort();
const dateIndex = new Map(lstDates.map((d, i) => [d, i]));
const sites = {};
const lst = {};
for (const r of lstRows) {
  const s = r.sitio;
  if (!lst[s]) {
    lst[s] = {
      day: new Array(lstDates.length).fill(null),
      night: new Array(lstDates.length).fill(null),
      qcDay: new Array(lstDates.length).fill(null),
      qcNight: new Array(lstDates.length).fill(null)
    };
    sites[s] = { lat: Number(r.latitud), lon: Number(r.longitud) };
  }
  const i = dateIndex.get(r.fecha_inicio);
  lst[s].day[i] = num(r.superficie_dia_c);
  lst[s].night[i] = num(r.superficie_noche_c);
  lst[s].qcDay[i] = num(r.qc_dia);
  lst[s].qcNight[i] = num(r.qc_noche);
}

// ---------- Verdor NDVI MODIS (mensual, cinco sitios)
const ndviRows = readCsv('vegetacion_ndvi_mensual.csv');
const ndviY0 = Number(ndviRows.map((r) => r.fecha_inicio).sort()[0].slice(0, 4));
const ndviY1 = Number(ndviRows.map((r) => r.fecha_inicio).sort().at(-1).slice(0, 4));
const nMonths = (ndviY1 - ndviY0 + 1) * 12;
const ndvi = {};
for (const r of ndviRows) {
  const s = r.sitio;
  if (!ndvi[s]) {
    ndvi[s] = {
      ndvi: new Array(nMonths).fill(null),
      rel: new Array(nMonths).fill(null),
      viq: new Array(nMonths).fill(null)
    };
  }
  const k = (Number(r.fecha_inicio.slice(0, 4)) - ndviY0) * 12 + Number(r.fecha_inicio.slice(5, 7)) - 1;
  ndvi[s].ndvi[k] = num(r.ndvi);
  ndvi[s].rel[k] = num(r.pixel_reliability);
  ndvi[s].viq[k] = num(r.vi_quality);
}
for (const s of Object.keys(lst)) if (!ndvi[s]) fail(`falta NDVI del sitio ${s}`);

const out = {
  id: 'monterrey',
  generated: new Date().toISOString(),
  note: 'Generado por app/scripts/build-data.mjs a partir de datos/series/*.csv del repositorio RAACK.',
  inputs,
  sites,
  cell: { lat: Number(rain[0].latitud), lon: Number(rain[0].longitud) },
  station: {
    id: '19052',
    lat: Number(rain.find((r) => r.fuente === 'SMN').latitud),
    lon: Number(rain.find((r) => r.fuente === 'SMN').longitud)
  },
  daily: { start: dailyStart, n: nDays, ...daily },
  soil: { y0: soilY0, values: soil },
  lst: { dates: lstDates, sites: lst },
  ndvi: { y0: ndviY0, sites: ndvi }
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(out));
const kb = (JSON.stringify(out).length / 1024).toFixed(0);
console.log(
  `monterrey.json: ${kb} kB · ${nDays} días · ${soil.length} meses de humedad · ${lstDates.length} compuestos LST × ${Object.keys(lst).length} sitios · ${nMonths} meses NDVI`
);
