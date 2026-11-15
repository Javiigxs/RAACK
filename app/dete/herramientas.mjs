// HydroDetective · Herramientas del agente y verificador de cifras.
// La IA NO calcula: pide estos cálculos al servidor y solo explica el resultado.
// Del zip «hydrodetective-asistente» (15-nov-2026). Al integrarlo en la página (Claude, 15-nov-2026):
// resumenSeries admite un p-valor que no se puede calcular y los años sin dato, y contextoPagina
// prepara lo que la persona tenía delante cuando pulsó «Pregúntale al DE-T».

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
];

export function ejecutarHerramienta(nombre, args, base) {
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
