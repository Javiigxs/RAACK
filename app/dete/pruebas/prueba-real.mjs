// DE-T · Prueba con Kimi real. GASTA SALDO de la cuenta de Kimi: unos centavos de dólar por pregunta.
// Arranca el servidor de DE-T con la clave de dete/.env en un puerto aparte y le hace, una tras otra,
// las ocho pruebas rápidas del README. Antes de preguntar nada comprueba que Kimi acepta la clave y que
// la cuenta tiene el modelo (eso no gasta). Se para en el primer fallo para no gastar de más.
// No lee ni imprime la clave: la lee el servidor, y todo lo que parezca una clave se tacha en la salida.
//
// Uso, desde app/:
//   npm run dete:real              las ocho
//   npm run dete:real -- 1         solo la primera (o varias: 1 4 6)
//   npm run dete:real -- 0         solo comprobar la clave y el modelo, sin preguntar
// Escrito con ayuda de IA (Claude) para el equipo RAACK.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUERTO = Number(process.env.PUERTO_PRUEBA || 8805);
const PAUSA = Number(process.env.PAUSA_PRUEBA || 15000); // entre preguntas: la cuenta admite pocas peticiones por minuto
const TOPE_USD = Number(process.env.TOPE_PRUEBA || 0.6); // si la sesión pasa de aquí, no sigue

const PRUEBAS = [
  { n: 1, que: "País elegido en el globo: Italia", sector: "civil", lugar: "IT", pregunta: "Is Italy losing stored water?",
    debe: [["dice −6.7", /6\.7/], ["avisa de que es un primer vistazo", /first look|primer vistazo|mascon/i]] },
  { n: 2, que: "Qué falta en Italia", sector: "civil", lugar: "IT", pregunta: "What is still missing to open the case in Italy?",
    debe: [["nombra la estación en tierra", /station|estaci[oó]n/i], ["nombra las presas", /reservoir|presa/i], ["nombra el balance oficial", /aquifer|groundwater|acu[ií]fero|subterr/i]] },
  { n: 3, que: "Trampa con Italia elegida", sector: "civil", lugar: "IT", pregunta: "How much did it rain in Italy last year?",
    debe: [["dice que no tiene ese dato", /does(n't| not) have|no tiene ese dato|not available|cannot|can't/i]], noDebe: [["no da una cifra de lluvia", /\d+(\.\d+)?\s*mm/i]] },
  { n: 4, que: "Ciudadano, Cerro Prieto", sector: "civil", pregunta: "¿Por qué se secó Cerro Prieto en 2022?",
    debe: [["habla de Cerro Prieto en 2022", /Cerro Prieto[\s\S]*2022|2022[\s\S]*Cerro Prieto/]] },
  { n: 5, que: "Gobierno, recomendaciones", sector: "gobierno", pregunta: "¿Qué recomiendan hacer?",
    debe: [["da opciones del catálogo (📚)", /📚/]] },
  { n: 6, que: "Investigador, correlación con rezago", sector: "investigador", pregunta: "¿La lluvia se relaciona con el agua almacenada? Prueba con rezago de 1 año.",
    debe: [["da r y p", /\br\b[^\n]{0,12}[=≈:]|Pearson/i], ["recuerda que no es causalidad", /causalidad|causa/i]] },
  { n: 7, que: "Trampa, Madrid", sector: "civil", pregunta: "¿Cuánto llovió en Madrid?",
    debe: [["dice que no tiene ese dato", /no tiene ese dato/i]], noDebe: [["no da una cifra de lluvia", /\d+(\.\d+)?\s*mm/i]] },
  { n: 8, que: "Número pulsado en el veredicto", sector: "civil", pregunta: "What does −7.1 cm per decade mean here?",
    pagina: { numero: "−7.1 cm per decade", tipo: "Change per decade", explicacion: "How much it changes every ten years, following the trend line through all the years of the period (Sen’s slope × 10). A plus sign means it rises; a minus sign, it falls.",
      unidad: "cm: centimetres of water, the depth the stored water would have if it were spread evenly over the whole region.", seccion: "Step 2 · Case file — The verdict",
      texto: "Total stored water is falling by −7.1 cm per decade", estado: "Nuevo León, Mexico, 1998–2026; worry: Reservoirs are dropping", idioma: "en" },
    debe: [["explica el −7.1", /7\.1/]] },
];

const tachar = (t) => String(t).replace(/sk-[A-Za-z0-9_-]{6,}/g, "sk-…").replace(/Bearer\s+\S+/g, "Bearer …");
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const pedidas = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n));
const soloComprobar = pedidas.includes(0);
const lista = soloComprobar ? [] : pedidas.length ? PRUEBAS.filter((p) => pedidas.includes(p.n)) : PRUEBAS;

const srv = spawn(process.execPath, ["--env-file-if-exists=dete/.env", "dete/server.mjs"], { cwd: APP, env: { ...process.env, PORT: String(PUERTO) }, stdio: ["ignore", "pipe", "pipe"] });
let salida = "";
srv.stdout.on("data", (d) => (salida += d));
srv.stderr.on("data", (d) => (salida += d));
const lineas = () => tachar(salida).split("\n").filter(Boolean);
let fallos = 0;
let avisos = 0;

try {
  for (let i = 0; ; i++) {
    try { await fetch(`http://127.0.0.1:${PUERTO}/api/chat`); break; } catch { if (i > 60) throw new Error("el servidor no arranca"); await espera(100); }
  }
  // La comprobación de la clave tarda lo que tarde Kimi en responder (hasta 8 s).
  for (let i = 0; i < 90 && !/Kimi aceptó la clave|rechazó la clave|No pude comprobar|falta MOONSHOT_API_KEY/.test(salida); i++) await espera(100);
  console.log("— arranque");
  for (const l of lineas()) console.log("  " + l);
  if (/falta MOONSHOT_API_KEY|rechazó la clave|no tiene el modelo/.test(salida)) throw new Error("no se pregunta nada: hay que arreglar la clave o el modelo");
  if (soloComprobar) console.log("\nSolo se comprobó la clave y el modelo: no se gastó nada.");

  let vistas = lineas().length;
  for (const [i, p] of lista.entries()) {
    if (i) await espera(PAUSA);
    console.log(`\n— prueba ${p.n} · ${p.que} · sector ${p.sector}${p.lugar ? ` · lugar ${p.lugar}` : ""}`);
    console.log(`  pregunta: ${p.pregunta}`);
    const inicio = Date.now();
    const r = await fetch(`http://127.0.0.1:${PUERTO}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sector: p.sector, region: "nuevo-leon", messages: [{ role: "user", content: p.pregunta }], ...(p.lugar ? { lugar: p.lugar } : {}), ...(p.pagina ? { pagina: p.pagina } : {}) }),
    });
    const cuerpo = await r.json().catch(() => ({}));
    await espera(300);
    const nuevas = lineas().slice(vistas);
    vistas = lineas().length;
    console.log(`  estado ${r.status} en ${Math.round((Date.now() - inicio) / 1000)} s · verificado: ${cuerpo.verificado}`);
    for (const l of nuevas) console.log("  [servidor] " + l);
    if (r.status !== 200 || !cuerpo.answer?.trim()) {
      fallos++;
      console.log(`  FALLA: ${r.status !== 200 ? tachar(JSON.stringify(cuerpo)) : "la respuesta llegó vacía"}`);
      break;
    }
    console.log("  respuesta:\n" + cuerpo.answer.trim().split("\n").map((l) => "    " + l).join("\n"));
    for (const [nombre, re] of p.debe ?? []) { const ok = re.test(cuerpo.answer); if (!ok) avisos++; console.log(`  ${ok ? "ok   " : "REVISAR"} ${nombre}`); }
    for (const [nombre, re] of p.noDebe ?? []) { const ok = !re.test(cuerpo.answer); if (!ok) avisos++; console.log(`  ${ok ? "ok   " : "REVISAR"} ${nombre}`); }
    if (cuerpo.verificado !== true) { avisos++; console.log("  REVISAR el verificador no encontró alguna cifra en los datos (⚠️)"); }
    const gasto = /en esta sesión, ([\d.]+) (centavos de dólar|dólares)/.exec(nuevas.join("\n"));
    const usd = gasto ? Number(gasto[1]) / (gasto[2].startsWith("centavos") ? 100 : 1) : 0;
    if (usd > TOPE_USD) { console.log(`\nLa sesión lleva ${usd.toFixed(2)} dólares, más del tope de ${TOPE_USD}: no sigo.`); break; }
  }
} catch (e) {
  fallos++;
  console.log("ERROR: " + tachar(e.message));
  for (const l of lineas().slice(-6)) console.log("  [servidor] " + l);
} finally {
  srv.kill();
}
const total = lineas().filter((l) => /^Pregunta \d+:/.test(l)).pop();
if (total) console.log("\nÚltima línea de gasto: " + total);
console.log(fallos ? "\nLa prueba se paró por un fallo." : lista.length ? `\nTerminó sin fallos${avisos ? `, con ${avisos} cosas que revisar` : ""}.` : "");
process.exit(fallos ? 1 : 0);
