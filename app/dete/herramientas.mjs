// HydroDetective · Herramientas del agente y verificador de cifras.
// La IA NO calcula: pide estos cálculos al servidor y solo explica el resultado.
// Del zip «hydrodetective-asistente» (15-nov-2026). Al integrarlo en la página (Claude, 15-nov-2026):
// resumenSeries admite un p-valor que no se puede calcular y los años sin dato, y contextoPagina
// prepara lo que la persona tenía delante cuando pulsó «Pregúntale al DE-T».
// Base por país (Claude, 15-nov-2026, idea de Fran: preguntar donde se elige el país): ver_pais y
// ranking_paises leen paises.json, y contextoLugar dice qué lugar está elegido en el globo.

// ---------- Estadística ----------
function betacf(a, b, x) {
  const MAXIT = 200, EPS = 3e-14, FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d; let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function lgamma(z) {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015; for (const c of g) ser += c / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}
function betai(a, b, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}
function pearson(x, y) {
  const n = x.length, mx = x.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  const r = sxy / Math.sqrt(sxx * syy);
  const df = n - 2;
  const p = Math.abs(r) >= 1 ? 0 : betai(df / 2, 0.5, df / (df + (r * r * df) / (1 - r * r))); // t-test bilateral
  return { r, p };
}
function rangos(v) {
  const idx = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), out = new Array(v.length);
  for (let i = 0; i < idx.length;) {
    let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    for (let k = i; k <= j; k++) out[idx[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return out;
}
function sinTendencia(t, y) { // residuos de una recta y = a + b·t
  const n = t.length, mt = t.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n;
  let stt = 0, sty = 0; for (let i = 0; i < n; i++) { stt += (t[i] - mt) ** 2; sty += (t[i] - mt) * (y[i] - my); }
  const b = sty / stt; return y.map((v, i) => v - (my + b * (t[i] - mt)));
}
const r3 = v => Math.round(v * 1000) / 1000;
const r4 = v => Math.round(v * 10000) / 10000;

// ---------- Herramientas ----------
export const DEFINICION_HERRAMIENTAS = [
  { type: "function", function: {
      name: "ver_serie",
      description: "Devuelve los valores anuales, fuente, unidad y tendencia de una serie de la herramienta.",
      parameters: { type: "object", properties: { serie: { type: "string", description: "id de la serie (ver lista en <DATOS>)" } }, required: ["serie"] } } },
  { type: "function", function: {
      name: "anomalia",
      description: "Compara el valor de una serie en un año contra su promedio: diferencia absoluta y porcentaje.",
      parameters: { type: "object", properties: { serie: { type: "string" }, anio: { type: "integer" } }, required: ["serie", "anio"] } } },
  { type: "function", function: {
      name: "correlacionar",
      description: "Calcula la correlación entre dos series anuales en los años que comparten: Pearson (r, p), Spearman (rho) " +
        "y Pearson sin tendencia (quitando la recta de cada serie, para evitar correlaciones falsas por tendencias comunes). " +
        "rezago_anios = k compara la serie A del año t con la serie B del año t+k (p. ej. lluvia de un año vs. agua almacenada del siguiente: k=1).",
      parameters: { type: "object", properties: {
        serie_a: { type: "string" }, serie_b: { type: "string" },
        rezago_anios: { type: "integer", description: "0 a 3; por defecto 0" } }, required: ["serie_a", "serie_b"] } } },
  { type: "function", function: {
      name: "ver_acuiferos",
      description: "Tabla oficial (DOF 2023) de recarga, volumen concesionado y disponibilidad de los acuíferos de Nuevo León.",
      parameters: { type: "object", properties: {} } } },
  { type: "function", function: {
      name: "ver_pais",
      description: "Lo que la herramienta tiene de un país o territorio: cuántas de las 10 capas de datos del caso están listas y por qué, " +
        "y el primer vistazo a su agua almacenada (GRACE): valores anuales, pendiente por década, intervalo, p y certeza. " +
        "Es un primer vistazo (un mascon de GRACE bajo el punto de referencia del país), no un veredicto.",
      parameters: { type: "object", properties: {
        pais: { type: "string", description: "Nombre en español o inglés, o código ISO de 2 o 3 letras (p. ej. \"Italia\", \"Italy\", \"IT\")" } }, required: ["pais"] } } },
  { type: "function", function: {
      name: "ranking_paises",
      description: "Ordena los países por la pendiente del agua almacenada (GRACE) de su primer vistazo; solo entran los de certeza confirmada. " +
        "orden = \"baja\" (los que más bajan) o \"sube\" (los que más suben).",
      parameters: { type: "object", properties: {
        orden: { type: "string", enum: ["baja", "sube"] },
        n: { type: "integer", description: "cuántos devolver, de 1 a 15; por defecto 5" },
        continente: { type: "string", description: "opcional: África, América, Asia, Europa u Oceanía" } }, required: ["orden"] } } },
];

export function ejecutarHerramienta(nombre, args, base, mundo) {
  const S = base.series;
  const serie = id => { const s = S[id]; if (!s) throw new Error(`No existe la serie "${id}". Ids válidos: ${Object.keys(S).join(", ")}`); return s; };
  switch (nombre) {
    case "ver_serie": {
      const s = serie(args.serie); return { id: args.serie, ...s };
    }
    case "anomalia": {
      const s = serie(args.serie), v = s.valores[String(args.anio)];
      if (v === undefined) return { error: `La serie ${args.serie} no tiene dato completo para ${args.anio}`, años_disponibles: s.años };
      return { serie: args.serie, nombre: s.nombre, fuente: s.fuente, unidad: s.unidad, anio: args.anio, valor: v,
               promedio: s.media, diferencia: r3(v - s.media), diferencia_pct: s.media ? Math.round((v / s.media - 1) * 1000) / 10 : null,
               promedio_de: s.años };
    }
    case "correlacionar": {
      const A = serie(args.serie_a), B = serie(args.serie_b);
      const k = Math.max(0, Math.min(3, Number(args.rezago_anios) || 0));
      const t = [], x = [], y = [];
      for (const [anio, va] of Object.entries(A.valores)) {
        const vb = B.valores[String(Number(anio) + k)];
        if (vb !== undefined) { t.push(Number(anio)); x.push(va); y.push(vb); }
      }
      const n = t.length;
      if (n < 8) return { error: `Solo ${n} años en común: no alcanza para una correlación confiable (mínimo 8).` };
      const p = pearson(x, y), sp = pearson(rangos(x), rangos(y)), dt = pearson(sinTendencia(t, x), sinTendencia(t, y));
      const sig = v => v < 0.05 ? "significativa (p<0.05)" : "no significativa";
      const avisos = ["Correlación no es causalidad.", "Con series anuales cortas y autocorrelacionadas el p-valor puede ser optimista."];
      if (n < 15) avisos.push(`Muestra pequeña (n=${n}).`);
      if (p.p < 0.05 && dt.p >= 0.05) avisos.push("La relación desaparece al quitar las tendencias: puede deberse solo a que ambas series cambian con el tiempo.");
      return {
        serie_a: `${args.serie_a} (${A.nombre}, ${A.fuente}, ${A.lugar})`, serie_b: `${args.serie_b} (${B.nombre}, ${B.fuente}, ${B.lugar})`,
        rezago_anios: k, n, años_a: `${t[0]}-${t[n - 1]}`,
        pearson_r: r3(p.r), pearson_p: r4(p.p), pearson: sig(p.p),
        spearman_rho: r3(sp.r), spearman_p: r4(sp.p),
        pearson_sin_tendencia_r: r3(dt.r), pearson_sin_tendencia_p: r4(dt.p), sin_tendencia: sig(dt.p),
        r2_pct: Math.round(p.r * p.r * 1000) / 10, avisos,
      };
    }
    case "ver_acuiferos":
      return base.acuiferos || { error: "La herramienta no tiene la tabla de acuíferos cargada." };
    case "ver_pais": {
      if (!mundo) return { error: "La herramienta no tiene cargada la base por país." };
      const quien = buscarPais(mundo, args.pais);
      if (quien.error) return quien;
      return quien.caso ? fichaCaso(mundo, quien.caso) : fichaPais(mundo, quien.id);
    }
    case "ranking_paises":
      return mundo ? rankingPaises(mundo, args) : { error: "La herramienta no tiene cargada la base por país." };
    default:
      throw new Error(`Herramienta desconocida: ${nombre}`);
  }
}

// Resumen compacto para las instrucciones: ids, qué son y su tendencia (los valores se piden con herramientas).
export function resumenSeries(base) {
  const lineas = Object.entries(base.series).map(([id, s]) => {
    const t = s.tendencia;
    const pct = t.cambio_pct_por_decada === null || t.cambio_pct_por_decada === undefined ? "" : ` (${t.cambio_pct_por_decada}%/década)`;
    const p = t.p_mk === null || t.p_mk === undefined ? "p no calculable" : `p=${t.p_mk}`;
    const huecos = s.años_sin_dato?.length ? ` | años sin dato: ${s.años_sin_dato.join(", ")}` : "";
    return `- ${id}: ${s.nombre} | ${s.lugar} | ${s.fuente} | ${s.unidad} | ${s.años} (n=${s.n})${huecos} | media ${s.media} | ` +
      `tendencia Sen ${t.sen_por_decada}/década${pct}, ${p} (${t.metodo_mk}), ` +
      `OLS IC95 [${t.ic95_ols_por_decada.join(", ")}] → ${t.certeza}${s.nota ? " | nota: " + s.nota : ""}`;
  });
  return `Región: ${base.region}\nSeries anuales disponibles (id: descripción):\n${lineas.join("\n")}` +
    (base.acuiferos ? `\nTabla de acuíferos DOF 2023: usar la herramienta ver_acuiferos.` : "");
}

// ---------- La base por país ----------
// paises.json sale de los datos del globo de la página (npm run dete:data). De cada país hay dos cosas:
// qué capas de datos están listas y el primer vistazo a su agua almacenada. Nada más.
const plegar = v => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const ALIAS = { uk: "GB", "reino unido de gran bretana": "GB", "gran bretana": "GB", eeuu: "US", "ee uu": "US", "estados unidos de america": "US", "united states of america": "US", holanda: "NL" };
const AVISO_VISTAZO = "Primer vistazo, no un veredicto: es UN mascon de GRACE (unos 330 km de ancho) bajo el punto de referencia del país, " +
  "con las dos pruebas del caso. No es el promedio del país y no dice la causa del cambio.";
// El título oficial del producto (metadatos de NASA guardados en recursos/archivos/nuevo-leon/grace/) es
// «Mascon Ocean, Ice, and Hydrology Equivalent Water Height»: la masa que mide incluye el hielo.
const AVISO_HIELO = "GRACE mide cambios de masa de agua en todas sus formas, también nieve y hielo: en lugares con glaciares o hielo " +
  "la cifra puede hablar sobre todo del hielo, no del agua disponible.";
const AVISO_SOLO_ESTO = "De este país la herramienta no tiene lluvia, temperatura, presas ni acuíferos: solo dice qué capas están abiertas para descargarlas.";

/** Busca un país por código ISO o por nombre (español o inglés, sin acentos). Devuelve { id }, { caso } o { error }. */
export function buscarPais(mundo, texto) {
  const q = plegar(texto);
  if (!q) return { error: "Falta el nombre del país." };
  // Los dos casos de la herramienta no son países.
  if (q.includes("nuevo leon") || q === "monterrey") return { caso: "nl" };
  if (q.includes("valle central") || q.includes("central valley")) return { caso: "cv" };
  const todos = Object.entries(mundo.paises);
  if (ALIAS[q]) return { id: ALIAS[q] };
  const codigo = todos.find(([id, p]) => id.toLowerCase() === q || p.iso3.toLowerCase() === q);
  if (codigo) return { id: codigo[0] };
  const nombres = ([, p]) => [plegar(p.nombre), plegar(p.name)];
  const exacto = todos.filter(e => nombres(e).includes(q));
  if (exacto.length === 1) return { id: exacto[0][0] };
  const empieza = todos.filter(e => nombres(e).some(n => n.startsWith(q)));
  const candidatos = empieza.length ? empieza : todos.filter(e => nombres(e).some(n => n.includes(q)));
  if (candidatos.length === 1) return { id: candidatos[0][0] };
  if (candidatos.length > 1) {
    return { error: `Varios países coinciden con "${texto}": di cuál.`, opciones: candidatos.slice(0, 8).map(([id, p]) => `${p.nombre} (${id})`) };
  }
  return { error: `La herramienta no tiene ningún país llamado "${texto}". Tiene ${todos.length} países y territorios; prueba con el nombre en español o inglés o con su código ISO.` };
}

const coordenada = p => `${Math.abs(p.lat)}° ${p.lat >= 0 ? "N" : "S"}, ${Math.abs(p.lon)}° ${p.lon >= 0 ? "E" : "O"}`;
const direccion = t => (t.certeza === "sin evidencia" ? {} : { direccion: t.sen_por_decada < 0 ? "baja" : t.sen_por_decada > 0 ? "sube" : "sin cambio" });
function tablaCapas(mundo, capas) {
  return mundo.capas.map((k, i) => {
    const [estado, motivo] = mundo.motivos[capas[k.id]];
    return { n: i + 1, capa: k.nombre, origen: k.producto || "registro en tierra", estado: mundo.estados[estado], motivo };
  });
}
function tendenciaPublica(t) {
  return { sen_por_decada: t.sen_por_decada, ic95_ols_por_decada: t.ic95_ols_por_decada, p: t.p, certeza: t.certeza, ...direccion(t), n_valores_anuales: t.n };
}

/** Todo lo que la herramienta sabe de un país. */
export function fichaPais(mundo, id) {
  const p = mundo.paises[id];
  const G = mundo.agua_almacenada;
  const total = mundo.capas.length;
  const ficha = {
    pais: p.nombre, name: p.name, codigo: id, continente: p.continente,
    punto_de_referencia: coordenada(p), ...(p.area_km2 === null ? {} : { area_km2: p.area_km2 }),
    capas_listas: `${p.listas} de ${total}`,
    faltan: total - p.listas,
    capas: tablaCapas(mundo, p.capas),
  };
  const avisos = [];
  if (p.agua) {
    ficha.agua_almacenada = {
      fuente: G.producto, unidad: G.unidad, años: `${G.años[0]}-${G.años[G.años.length - 1]}`, años_sin_dato: G.años_sin_dato,
      tendencia: tendenciaPublica(p.agua.tendencia), unidad_tendencia: "cm de agua por década",
      valores: Object.fromEntries(G.años.map((y, i) => [String(y), p.agua.valores[i]])),
    };
    avisos.push(AVISO_VISTAZO);
    if (p.agua.tipo === "costa") avisos.push("El punto de referencia cae en el mar: la serie es la parte terrestre del mascon costero que tiene debajo.");
    if (p.agua.mayor_que_el_pais) avisos.push("Ese mascon es más grande que el país: la cifra habla de la región que lo rodea.");
    const vecinos = Object.entries(mundo.paises).filter(([otro, q]) => otro !== id && q.agua && q.agua.mascon === p.agua.mascon).map(([, q]) => q.nombre);
    if (vecinos.length) avisos.push(`Comparte mascon con ${vecinos.join(", ")}: es la misma serie, no una prueba independiente.`);
    if (Math.abs(p.lat) > 60) avisos.push(AVISO_HIELO);
  } else {
    ficha.agua_almacenada = { sin_dato: "El mascon de GRACE bajo el punto de referencia es mar abierto: no hay señal de agua almacenada que probar en un lugar tan pequeño." };
  }
  avisos.push(AVISO_SOLO_ESTO);
  for (const [cid, c] of Object.entries(mundo.casos || {})) {
    if (c.pais !== id) continue;
    avisos.push(cid === "nl"
      ? `Dentro de ${p.nombre} la herramienta tiene el caso completo de ${c.nombre} (${c.en_expediente} de ${total} capas en su expediente): sus series están en <DATOS>.`
      : `Dentro de ${p.nombre} la página tiene ${c.nombre} como caso de comparación; de él solo hay agua almacenada (ver_pais("${c.nombre}")).`);
  }
  ficha.avisos = avisos;
  return ficha;
}

/** Los dos casos de la herramienta, que no son países: Nuevo León (completo) y el Valle Central (comparación). */
export function fichaCaso(mundo, id) {
  const c = mundo.casos?.[id];
  if (!c) return { error: "La herramienta no tiene ese caso." };
  const total = mundo.capas.length;
  const pais = mundo.paises[c.pais];
  const ficha = {
    caso: c.nombre, name: c.name, pais: `${pais?.nombre ?? c.pais} (${c.pais})`,
    capas_en_el_expediente: `${c.en_expediente} de ${total}`, capas_listas: `${c.listas} de ${total}`,
    capas: tablaCapas(mundo, c.capas),
  };
  if (c.agua) {
    ficha.agua_almacenada = {
      fuente: mundo.agua_almacenada.producto, años: c.agua.años,
      de_donde: `promedio de los ${c.agua.mascons} mascons de GRACE dentro del recuadro del caso`,
      tendencia: tendenciaPublica(c.agua.tendencia), unidad_tendencia: "cm de agua por década",
    };
  }
  ficha.avisos = [id === "nl"
    ? "Es el caso completo: sus 27 series y la tabla de acuíferos están en <DATOS>; usa ver_serie, anomalia, correlacionar y ver_acuiferos."
    : "Es el caso de comparación de la página: la herramienta solo tiene su agua almacenada. No tiene su lluvia, sus presas ni sus acuíferos."];
  return ficha;
}

const CONTINENTES = { africa: "África", america: "América", americas: "América", asia: "Asia", europa: "Europa", europe: "Europa", oceania: "Oceanía" };

/** Los países cuya agua almacenada más baja o más sube, entre los de certeza confirmada. Un mascon cuenta una vez. */
export function rankingPaises(mundo, args = {}) {
  const orden = args.orden === "sube" ? "sube" : "baja";
  const n = Math.max(1, Math.min(15, Math.round(Number(args.n)) || 5));
  let continente = "";
  if (args.continente) {
    continente = CONTINENTES[plegar(args.continente)];
    if (!continente) return { error: `No conozco el continente "${args.continente}". Valen: África, América, Asia, Europa, Oceanía.` };
  }
  const signo = orden === "baja" ? -1 : 1;
  const porMascon = new Map();
  let cumplen = 0;
  for (const [id, p] of Object.entries(mundo.paises)) {
    const t = p.agua?.tendencia;
    if (!t || t.certeza !== "confirmada" || Math.sign(t.orden) !== signo) continue;
    if (continente && p.continente !== continente) continue;
    cumplen++;
    const fila = porMascon.get(p.agua.mascon) ?? { paises: [], t };
    fila.paises.push(`${p.nombre} (${id})`);
    porMascon.set(p.agua.mascon, fila);
  }
  const filas = [...porMascon.values()].sort((a, b) => signo * (b.t.orden - a.t.orden) || a.paises[0].localeCompare(b.paises[0], "es"));
  return {
    orden: orden === "baja" ? "los que más bajan" : "los que más suben",
    ...(continente ? { continente } : {}),
    criterio: "pendiente de Sen del agua almacenada (GRACE), solo certeza confirmada (las dos pruebas de acuerdo)",
    unidad: "cm de agua por década", años: `${mundo.agua_almacenada.años[0]}-${mundo.agua_almacenada.años[mundo.agua_almacenada.años.length - 1]}`,
    paises_que_cumplen: cumplen,
    lista: filas.slice(0, n).map((f, i) => ({
      puesto: i + 1, ...(f.paises.length > 1 ? { paises_con_el_mismo_mascon: f.paises } : { pais: f.paises[0] }),
      sen_por_decada: f.t.sen_por_decada, ic95_ols_por_decada: f.t.ic95_ols_por_decada, p: f.t.p,
    })),
    avisos: [
      AVISO_VISTAZO,
      "El orden compara puntos de referencia, no países enteros ni volúmenes de agua: no digas que un país «pierde más agua» que otro, di que el mascon bajo su punto de referencia baja más deprisa.",
      "Los mascons vecinos no son observaciones independientes.",
      AVISO_HIELO,
    ],
  };
}

/** Lo que va en las instrucciones sobre la base por país: qué hay, el recuento global y las diez capas. */
export function resumenPaises(mundo) {
  const R = mundo.resumen, G = mundo.agua_almacenada;
  const casos = Object.values(mundo.casos || {}).map(c => {
    const t = c.agua?.tendencia;
    return `- ${c.nombre}: ${c.en_expediente} de ${mundo.capas.length} capas en su expediente` +
      (t ? `; agua almacenada ${t.sen_por_decada} cm/década, IC95 [${t.ic95_ols_por_decada.join(", ")}], ${t.p}, ${t.certeza}` : "");
  });
  return `Base por país (primer vistazo, no veredicto): ${R.paises} países y territorios.
De cada uno hay dos cosas: (a) cuántas de las ${mundo.capas.length} capas de datos del caso de Nuevo León están listas y por qué, y (b) en ${R.con_agua_almacenada} de ellos, ` +
    `la serie anual de agua almacenada ${G.años[0]}-${G.años[G.años.length - 1]} (${G.producto}; ${G.unidad}` +
    `${G.años_sin_dato.length ? `; sin los años ${G.años_sin_dato.join(", ")}` : ""}) con las dos pruebas del caso.
Recuento: el agua almacenada baja en ${R.baja_confirmada} y sube en ${R.sube_confirmada} con las dos pruebas de acuerdo (confirmada); ` +
    `${R.indicio_o_sin_tendencia} muestran un indicio o ninguna tendencia; ${R.sin_senal} islas pequeñas no tienen señal.
Las ${mundo.capas.length} capas: ${mundo.capas.map((k, i) => `${i + 1} ${k.nombre}${k.producto ? ` (${k.producto})` : " (registro en tierra)"}`).join(" · ")}.
Casos de la herramienta (no son países):
${casos.join("\n")}
Para un país usa ver_pais; para ordenar países usa ranking_paises.`;
}

/**
 * El lugar que la persona tiene elegido en el globo de la página. La página manda solo su
 * identificador («nl», «cv» o el código ISO de dos letras) y el bloque lo escribe el servidor con sus
 * propios datos: nada de lo que diga viene del navegador.
 */
export function contextoLugar(lugar, mundo) {
  if (typeof lugar !== "string" || !mundo) return "";
  let lineas;
  if (lugar === "nl" || lugar === "cv") {
    const c = mundo.casos?.[lugar];
    if (!c) return "";
    const t = c.agua?.tendencia;
    lineas = [
      `Lugar elegido en el globo de la página: ${c.nombre} (caso de la herramienta, no un país).`,
      lugar === "nl"
        ? `Es el caso completo (${c.en_expediente} de ${mundo.capas.length} capas en su expediente): responde con las series de <DATOS> y sus herramientas.`
        : `Es el caso de comparación: tu base solo tiene su agua almacenada. No tienes su lluvia, sus presas ni sus acuíferos: dilo si te los piden.`,
      ...(t ? [`Agua almacenada (GRACE, promedio de ${c.agua.mascons} mascons, ${c.agua.años}): ${t.sen_por_decada} cm por década, IC 95 % ${t.ic95_ols_por_decada[0]} a ${t.ic95_ols_por_decada[1]}, ${t.p}, certeza ${t.certeza}.`] : []),
    ];
  } else if (/^[A-Z]{2}$/.test(lugar) && Object.hasOwn(mundo.paises, lugar)) {
    const p = mundo.paises[lugar];
    const t = p.agua?.tendencia;
    lineas = [
      `Lugar elegido en el globo de la página: ${p.nombre} (código ${lugar}, ${p.continente}).`,
      `Capas de datos listas: ${p.listas} de ${mundo.capas.length}.`,
      t ? `Agua almacenada (GRACE, primer vistazo): ${t.sen_por_decada} cm por década, IC 95 % ${t.ic95_ols_por_decada[0]} a ${t.ic95_ols_por_decada[1]}, ${t.p}, certeza ${t.certeza}.`
        : "Agua almacenada (GRACE): sin señal; el mascon bajo su punto de referencia es mar abierto.",
      `Para el detalle (qué capas faltan y por qué, valores por año, avisos) usa ver_pais("${lugar}").`,
    ];
  } else return "";
  return `<LUGAR>\n${lineas.join("\n")}\n</LUGAR>`;
}

// ---------- Lo que la persona estaba viendo en la página ----------
// La página manda, al pulsar «Pregúntale al DE-T» bajo un número, qué número era, cómo lo llama la
// página y qué explicación ya leyó. Solo se aceptan estos campos, como texto y recortados: es contexto,
// no instrucciones (la regla 10 lo dice al modelo).
const CAMPOS_PAGINA = [
  ["numero", "Número que pulsó", 60],
  ["tipo", "Qué tipo de cifra es, según la página", 80],
  ["explicacion", "Explicación que ya leyó en la tarjeta", 420],
  ["unidad", "Unidad, según la tarjeta", 220],
  ["etiqueta", "Cómo lo llama la página", 160],
  ["seccion", "Sección de la página", 160],
  ["texto", "Texto alrededor del número", 420],
  ["estado", "Lo que tiene elegido en la página", 240],
  ["idioma", "Idioma de la página", 5],
];
const limpio = v => String(v).replace(/[<>]/g, " ").replace(/\s+/g, " ").trim();

/** Devuelve el bloque <PAGINA>…</PAGINA> que va delante de la pregunta, o "" si no hay contexto válido. */
export function contextoPagina(pagina) {
  if (!pagina || typeof pagina !== "object" || Array.isArray(pagina)) return "";
  const lineas = [];
  for (const [campo, nombre, max] of CAMPOS_PAGINA) {
    const v = pagina[campo];
    if (typeof v !== "string" && typeof v !== "number") continue;
    let s = limpio(v);
    if (!s) continue;
    if (s.length > max) s = s.slice(0, max - 1).trimEnd() + "…";
    lineas.push(`${nombre}: ${s}`);
  }
  if (!lineas.some(l => l.startsWith("Número que pulsó"))) return "";
  return `<PAGINA>\n${lineas.join("\n")}\n</PAGINA>`;
}

// ---------- Verificador de cifras ----------
const RE_NUM = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?/g;
function numeros(texto) {
  return (String(texto).match(RE_NUM) || []).map(m => {
    const limpio = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(m) ? m.replace(/,/g, "") : m.replace(",", ".");
    const dec = (limpio.split(".")[1] || "").length;
    return { txt: m, v: Number(limpio), dec };
  });
}
// Devuelve las cifras de la respuesta que NO aparecen (ni redondeadas) en la evidencia.
export function cifrasNoVerificadas(respuesta, evidencia) {
  const ev = numeros(evidencia).map(n => n.v);
  const ignorar = n => (Number.isInteger(n.v) && n.dec === 0 && (n.v <= 10 || (n.v >= 1990 && n.v <= 2035)));
  const faltan = [];
  for (const n of numeros(respuesta)) {
    if (ignorar(n)) continue;
    const tol = 0.5 * 10 ** -n.dec + 1e-9;
    if (!ev.some(e => Math.abs(e - n.v) <= tol)) faltan.push(n.txt);
  }
  return [...new Set(faltan)];
}
