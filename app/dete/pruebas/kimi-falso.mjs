// DE-T · Kimi simulado, para probar el servidor sin clave y sin gastar saldo.
// Imita /v1/models y /v1/chat/completions de un modelo que razona (reasoning_content) y pide
// herramientas, y falla como dice la documentación de Kimi (consultada el 15 de noviembre de 2026) que
// falla el servicio real: respuesta vacía si el tope de tokens no deja sitio al razonamiento, error si
// una llamada a herramientas vuelve sin su razonamiento y error con tool_choice "required".
// No es Kimi: sus respuestas son plantillas rellenadas con lo que devuelven las herramientas.
// Devuelve también los tokens que «cobra» (usage), con la parte repetida de las instrucciones como
// caché, y con LIMITE_RPM y VENTANA_MS imita el límite de peticiones por minuto de una cuenta pequeña.
// Guarda las peticiones que recibe: GET /_peticiones las devuelve y DELETE /_peticiones las borra.
// Lo usa prueba-servidor.mjs (npm run dete:prueba). Escrito con ayuda de IA (Claude) para el equipo RAACK.
import http from "node:http";

const PORT = Number(process.env.PORT || 8793);
const LIMITE_RPM = Number(process.env.LIMITE_RPM) || 0; // 0 = sin límite
const VENTANA_MS = Number(process.env.VENTANA_MS) || 60000;
let recibidas = [];
let atendidas = []; // momento de cada petición atendida, para el límite
let instruccionesVistas = ""; // lo que ya «está en caché»
const tokens = (texto) => Math.round(String(texto ?? "").length / 3);

const pregunta = (msgs) => [...msgs].reverse().find((m) => m.role === "user" && !m.content.startsWith("VERIFICADOR"))?.content ?? "";
const llamar = (...calls) => ({
  role: "assistant", content: "", reasoning_content: "Necesito los datos de la herramienta antes de responder.",
  tool_calls: calls.map(([name, args], i) => ({ id: `call_${i + 1}`, type: "function", function: { name, arguments: JSON.stringify(args) } })),
});
const decir = (content) => ({ role: "assistant", content, reasoning_content: "Ya tengo los datos; redacto la respuesta." });

function respuesta(body) {
  const msgs = body.messages;
  const ultima = msgs[msgs.length - 1];
  const q = pregunta(msgs);
  const lugar = /<LUGAR>[\s\S]*?ver_pais\("([A-Z]{2})"\)/.exec(q)?.[1];
  const sinContexto = q.replace(/<LUGAR>[\s\S]*?<\/LUGAR>/, "").replace(/<PAGINA>[\s\S]*?<\/PAGINA>/, "").trim();
  if (ultima.role === "user" && ultima.content.startsWith("VERIFICADOR")) {
    return decir("Corregido: con los datos de la herramienta no puedo dar esa cifra. La herramienta no tiene ese dato.");
  }
  const tools = msgs.filter((m) => m.role === "tool").map((m) => JSON.parse(m.content));
  if (body.tool_choice !== "none" && !tools.length) {
    if (/inventa/i.test(sinContexto)) return decir("El agua almacenada baja 99.9 cm por década.");
    if (/Madrid/i.test(sinContexto)) return decir("La herramienta no tiene ese dato. Puedo decirte qué capas de datos tiene lista España o cómo va su agua almacenada.");
    if (/m[aá]s (bajan|pierden)|which countries|qu[eé] pa[ií]ses/i.test(sinContexto)) return llamar(["ranking_paises", { orden: "baja", n: 3 }]);
    if (/compar/i.test(sinContexto) && lugar) return llamar(["ver_pais", { pais: lugar }], ["ver_serie", { serie: "grace_nl" }]);
    if (lugar) return llamar(["ver_pais", { pais: lugar }]);
    if (/Cerro Prieto/i.test(sinContexto)) return llamar(["anomalia", { serie: "presa_cerro_prieto_volumen", anio: 2022 }]);
    return llamar(["ver_serie", { serie: "grace_nl" }]);
  }
  const pais = tools.find((r) => r.pais);
  const serie = tools.find((r) => r.tendencia && r.id);
  const rank = tools.find((r) => r.lista);
  if (rank) {
    return decir(`Entre los **${rank.paises_que_cumplen} países** con tendencia confirmada, estos son los puntos de referencia que más bajan (${rank.unidad}):\n\n` +
      rank.lista.map((f) => `${f.puesto}. ${f.pais ?? f.paises_con_el_mismo_mascon.join(" y ")}: **${f.sen_por_decada}** (IC 95 % ${f.ic95_ols_por_decada[0]} a ${f.ic95_ols_por_decada[1]}, ${f.p})`).join("\n") +
      `\n\nEs un primer vistazo: un mascon de GRACE de unos 330 km bajo cada punto de referencia, no el promedio del país. GRACE también mide nieve y hielo.`);
  }
  if (pais && serie) {
    const t = pais.agua_almacenada.tendencia, s = serie.tendencia;
    return decir(`**${pais.pais}**: ${t.sen_por_decada} cm por década (IC 95 % ${t.ic95_ols_por_decada[0]} a ${t.ic95_ols_por_decada[1]}, ${t.p}, ${t.certeza}).\n\n` +
      `**Nuevo León**: ${s.sen_por_decada} cm por década (IC 95 % ${s.ic95_ols_por_decada[0]} a ${s.ic95_ols_por_decada[1]}, ${s.certeza}), fuente ${serie.fuente}.\n\n` +
      `No miden lo mismo: la de ${pais.pais} es un mascon de unos 330 km bajo su punto de referencia (primer vistazo); la de Nuevo León, el promedio de los mascons de su recuadro.`);
  }
  if (pais) {
    const a = pais.agua_almacenada;
    if (/falta|missing/i.test(sinContexto)) {
      const faltan = pais.capas.filter((k) => !/abierta|herramienta/.test(k.estado));
      return decir(`Para ${pais.pais} hay **${pais.capas_listas}** capas listas. Faltan:\n\n` + faltan.map((k) => `- **${k.capa}** (${k.estado}): ${k.motivo}`).join("\n"));
    }
    if (a.sin_dato) return decir(`Para ${pais.pais} la herramienta no tiene señal de agua almacenada: ${a.sin_dato} Tiene ${pais.capas_listas} capas listas.`);
    const t = a.tendencia;
    return decir(`Según ${a.fuente}, el agua almacenada bajo el punto de referencia de **${pais.pais}** ${t.direccion ?? "no muestra tendencia"} ` +
      `**${t.sen_por_decada} cm por década** (IC 95 % ${t.ic95_ols_por_decada[0]} a ${t.ic95_ols_por_decada[1]}, ${t.p}); certeza: ${t.certeza}.\n\n` +
      `- ${pais.avisos[0]}\n- Capas listas: ${pais.capas_listas}.`);
  }
  const r = tools[0] ?? {};
  if (r.serie === "presa_cerro_prieto_volumen") {
    return decir(`En 2022 Cerro Prieto tuvo en promedio **${r.valor} Mm³**, ${Math.abs(r.diferencia_pct)} % por debajo de su media de ${r.promedio} Mm³ (${r.fuente}).`);
  }
  const t = r.tendencia ?? {};
  const numero = /<PAGINA>[\s\S]*?Número que pulsó: ([^\n]+)/.exec(q)?.[1];
  return decir((numero ? `Ese número, **${numero}**, dice cuánto cambia el agua almacenada cada diez años.\n\n` : "") +
    `Según ${r.fuente}, el agua almacenada en Nuevo León baja **${t.sen_por_decada} cm por década** (intervalo del 95 %: ${t.ic95_ols_por_decada?.[0]} a ${t.ic95_ols_por_decada?.[1]}), certeza: ${t.certeza}.`);
}

function fallo(res, status, message) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: { message, type: "invalid_request_error" } }));
}

http.createServer((req, res) => {
  if (req.url === "/_peticiones") {
    if (req.method === "DELETE") recibidas = [];
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(recibidas));
  }
  if (req.method === "GET" && req.url.endsWith("/models")) {
    if (req.headers.authorization === "Bearer clave-mala") return fallo(res, 401, "Invalid Authentication");
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ object: "list", data: (process.env.MODELOS || "kimi-k2.6,kimi-k3,kimi-k3.1-pro").split(",").map((id) => ({ id, object: "model" })) }));
  }
  let datos = "";
  req.on("data", (c) => (datos += c));
  req.on("end", () => {
    if (!req.url.endsWith("/chat/completions") || req.method !== "POST") { res.writeHead(404); return res.end(); }
    const body = JSON.parse(datos);
    const ahora = Date.now();
    atendidas = atendidas.filter((t) => ahora - t < VENTANA_MS);
    if (LIMITE_RPM && atendidas.length >= LIMITE_RPM) {
      res.writeHead(429, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: { message: "Your account request reached max request: " + LIMITE_RPM + " RPM, please try again later", type: "rate_limit_reached_error" } }));
    }
    atendidas.push(ahora);
    recibidas.push(body);
    // Lo que el servicio real rechaza o estropea.
    if (body.tool_choice === "required") return fallo(res, 400, "tool_choice 'required' is not supported for this model");
    const sinRazonar = body.messages.findIndex((m) => m.role === "assistant" && m.tool_calls?.length && !m.reasoning_content);
    if (sinRazonar !== -1 && body.thinking?.type !== "disabled") return fallo(res, 400, `thinking is enabled but reasoning_content is missing in assistant tool call message at index ${sinRazonar}`);
    if (body.model.startsWith("kimi-k3") && body.thinking) return fallo(res, 400, "thinking is not supported for this model");
    const corto = !(body.max_tokens >= 16000) && body.thinking?.type !== "disabled";
    const msg = corto ? { role: "assistant", content: "", reasoning_content: "Estaba razonando cuando se acabó el tope de tokens…" } : respuesta(body);
    // Lo que cobraría: todo lo que entra, con las instrucciones ya vistas a precio de caché, y lo que sale.
    const instrucciones = body.messages[0]?.role === "system" ? body.messages[0].content : "";
    const usage = {
      prompt_tokens: tokens(JSON.stringify(body.messages)) + tokens(JSON.stringify(body.tools ?? [])),
      completion_tokens: tokens(msg.content) + tokens(msg.reasoning_content) + tokens(JSON.stringify(msg.tool_calls ?? "")),
      cached_tokens: instrucciones && instrucciones === instruccionesVistas ? tokens(instrucciones) : 0,
    };
    usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;
    instruccionesVistas = instrucciones;
    setTimeout(() => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: msg, finish_reason: corto ? "length" : msg.tool_calls ? "tool_calls" : "stop" }], usage }));
    }, 500);
  });
}).listen(PORT, "127.0.0.1", () => console.log(`Kimi simulado en http://127.0.0.1:${PORT}/v1`));
