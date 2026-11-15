// DE-T · Enciende y apaga DE-T para la página pública (GitHub Pages).
//
// GitHub solo puede servir archivos: no puede correr el servidor de DE-T ni guardar la clave de Kimi.
// Este comando deja que la página pública hable con un DE-T que corre en ESTE equipo, solo mientras
// el comando esté abierto:
//   1. arranca un servidor de DE-T aparte (puerto 8010), que solo responde preguntas, solo acepta las
//      que vienen de la página pública y tiene tope de gasto;
//   2. abre un túnel (localhost.run, por ssh, sin instalar nada) que le da una dirección de internet;
//   3. escribe esa dirección en el interruptor, un archivo en la rama «dete-publico» de GitHub que la
//      página pública lee al abrirse. Con dirección, la página muestra a DE-T; con null, no.
// Al pulsar Ctrl+C apaga el interruptor y cierra el túnel y el servidor. La clave no sale del equipo.
//
// Uso, desde app/:
//   npm run dete:publico                      encender (Ctrl+C para apagar)
//   npm run dete:publico -- --tope 0.25       tope de gasto en dólares de esta sesión (por defecto 0.50)
//   npm run dete:publico -- --preguntas 20    tope de preguntas (por defecto 40)
//   npm run dete:publico -- --minutos 60      se apaga solo pasado ese tiempo (por defecto 120)
//   npm run dete:publico -- --simulado        ensayo con el Kimi simulado: no usa la clave ni gasta
//   npm run dete:publico -- apagar            solo apaga el interruptor (por si el equipo se cerró de golpe)
//
// Pedido de Fran el 15 de noviembre de 2026. Escrito con ayuda de IA (Claude) para el equipo RAACK.
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(AQUI, "..");
const CONFIG = JSON.parse(fs.readFileSync(path.join(AQUI, "publico.json"), "utf8"));
// Por dónde se sube el interruptor: el alias de ssh de este equipo para GitHub (ver ~/.ssh/config).
const REMOTO = process.env.DETE_REMOTO || "git@github-frannrocha:Javiigxs/RAACK.git";
const PUERTO = Number(process.env.DETE_PUERTO_PUBLICO || 8010);
const PUERTO_KIMI_SIMULADO = 8811;

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 && args[i + 1] && Number(args[i + 1]) > 0 ? args[i + 1] : porDefecto;
};
const SIMULADO = args.includes("--simulado");
const TOPE = opcion("tope", "0.50");
const PREGUNTAS = opcion("preguntas", "40");
const MINUTOS = Number(opcion("minutos", "120"));

const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const hora = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
const decir = (texto) => console.log(`[${hora()}] ${texto}`);

const git = (argv, entrada) =>
  execFileSync("git", argv, { cwd: APP, input: entrada, encoding: "utf8", env: { ...process.env, GIT_SSH_COMMAND: "ssh -o BatchMode=yes" }, stdio: ["pipe", "pipe", "pipe"] });

/** Escribe el interruptor en su rama de GitHub: un solo archivo y un solo commit, sin tocar main ni la carpeta de trabajo. */
function publicar(url) {
  const json = JSON.stringify({ url, desde: new Date().toISOString() }, null, 1) + "\n";
  const blob = git(["hash-object", "-w", "--stdin"], json).trim();
  const tree = git(["mktree"], `100644 blob ${blob}\tdete.json\n`).trim();
  const commit = git(["commit-tree", tree, "-m", url ? "DE-T público: encendido" : "DE-T público: apagado"]).trim();
  git(["push", "--force", "--quiet", REMOTO, `${commit}:refs/heads/${CONFIG.rama}`]);
}

/** Lo que la página pública lee ahora mismo en el interruptor (GitHub renueva ese archivo cada 5 minutos: medido el 15-nov-2026). */
async function interruptor() {
  try {
    const r = await fetch(CONFIG.interruptor, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    return r.ok ? ((await r.json()).url ?? null) : undefined;
  } catch {
    return undefined;
  }
}

if (args.includes("apagar")) {
  try {
    publicar(null);
    console.log("Interruptor apagado en GitHub. La página pública deja de mostrar a DE-T en unos minutos.");
    process.exit(0);
  } catch (e) {
    console.log(`No pude apagar el interruptor: ${String(e.stderr || e.message).trim().split("\n").pop()}`);
    process.exit(1);
  }
}

const hijos = [];
let apagando = false;
let encendido = false;
function apagar(codigo, motivo) {
  if (apagando) return;
  apagando = true;
  console.log("");
  decir(motivo);
  if (encendido) {
    try {
      publicar(null);
      decir("Interruptor apagado en GitHub. La página pública deja de mostrar a DE-T (GitHub tarda hasta 5 minutos en reflejarlo; desde ya, nadie puede preguntar).");
    } catch (e) {
      decir(`No pude apagar el interruptor en GitHub (${String(e.stderr || e.message).trim().split("\n").pop()}). El túnel sí se cierra, así que nadie puede preguntar. Cuando haya conexión: npm run dete:publico -- apagar`);
    }
  }
  for (const h of hijos) h.kill();
  process.exit(codigo);
}
for (const senal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(senal, () => apagar(0, "Apagando DE-T público…"));

function arrancar(cmd, argv, opciones) {
  const h = spawn(cmd, argv, opciones);
  hijos.push(h);
  return h;
}

async function estadoLocal() {
  try {
    return await (await fetch(`http://127.0.0.1:${PUERTO}/api/chat`, { signal: AbortSignal.timeout(3000) })).json();
  } catch {
    return null;
  }
}

// ---- 0 · ¿Se puede escribir el interruptor?
try {
  git(["ls-remote", "--heads", REMOTO, CONFIG.rama]);
} catch (e) {
  console.log(`No puedo llegar a GitHub por ${REMOTO}: ${String(e.stderr || e.message).trim().split("\n").pop()}\nSin eso no se puede encender el interruptor. Si tu acceso es otro, ponlo en DETE_REMOTO.`);
  process.exit(1);
}

// ---- 1 · El servidor de DE-T para la página pública
console.log(`DE-T para la página pública ${CONFIG.pagina}${SIMULADO ? "  ·  ENSAYO con el Kimi simulado: no usa la clave ni gasta" : ""}`);
const entorno = { ...process.env, PORT: String(PUERTO), DETE_ORIGENES: CONFIG.pagina, DETE_SOLO_API: "1", DETE_TOPE_USD: TOPE, DETE_TOPE_PREGUNTAS: PREGUNTAS };
if (SIMULADO) {
  arrancar(process.execPath, [path.join(AQUI, "pruebas/kimi-falso.mjs")], { env: { PATH: process.env.PATH, PORT: String(PUERTO_KIMI_SIMULADO) }, stdio: "ignore" });
  // Sin el archivo .env: en un ensayo el servidor no llega a ver la clave de verdad.
  const { MOONSHOT_API_KEY: _clave, ...sinClave } = entorno;
  arrancar(process.execPath, ["dete/server.mjs"], { cwd: APP, env: { ...sinClave, KIMI_BASE: `http://127.0.0.1:${PUERTO_KIMI_SIMULADO}/v1`, MOONSHOT_API_KEY: "clave-falsa-de-prueba" }, stdio: "inherit" });
} else {
  arrancar(process.execPath, ["--env-file-if-exists=dete/.env", "dete/server.mjs"], { cwd: APP, env: entorno, stdio: "inherit" });
}
hijos[hijos.length - 1].on("exit", () => apagar(1, "El servidor de DE-T se cerró."));

let estado = null;
for (let i = 0; i < 40 && !estado; i++) {
  await espera(250);
  estado = await estadoLocal();
}
if (!estado?.listo) {
  apagar(1, estado ? "DE-T no está listo: falta la clave de Kimi en dete/.env (copia dete/.env.example y ponla)." : `El servidor de DE-T no arrancó en el puerto ${PUERTO} (¿está ocupado?).`);
}
await espera(1200); // deja que el servidor diga en la terminal si Kimi aceptó la clave

// ---- 2 · El túnel y el interruptor
let direccion = "";
let reintentos = 0;
async function alCambiar(url) {
  if (apagando || url === direccion) return;
  direccion = url;
  // Antes de anunciarla: que por esa dirección responda DE-T y deje leer la respuesta a la página pública.
  let bien = false;
  for (let i = 0; i < 8 && !bien && !apagando; i++) {
    try {
      const r = await fetch(`${url}/api/chat`, { headers: { Origin: CONFIG.pagina, Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
      bien = r.ok && r.headers.get("access-control-allow-origin") === CONFIG.pagina && (await r.json()).listo === true;
    } catch {
      // el túnel aún se está abriendo
    }
    if (!bien) await espera(1500);
  }
  if (!bien) return decir(`La dirección del túnel (${url}) no responde como DE-T. No toco el interruptor; si sigue así, apaga con Ctrl+C y vuelve a encender.`);
  try {
    publicar(`${url}/api/chat`);
  } catch (e) {
    return apagar(1, `No pude escribir el interruptor en GitHub: ${String(e.stderr || e.message).trim().split("\n").pop()}`);
  }
  encendido = true;
  decir(`Encendido. DE-T responde en ${url} y el interruptor ya está en GitHub.`);
  decir("La página pública tarda hasta 5 minutos en verlo; aquí aviso cuando lo vea.");
  for (let i = 0; i < 40 && !apagando && direccion === url; i++) {
    if ((await interruptor()) === `${url}/api/chat`) {
      decir(`Listo: quien abra o recargue ${CONFIG.pagina}/RAACK/ ya ve a DE-T.`);
      break;
    }
    await espera(10000);
  }
}

function abrirTunel() {
  const t = arrancar(
    "ssh",
    ["-o", "StrictHostKeyChecking=accept-new", "-o", "PubkeyAuthentication=no", "-o", "IdentitiesOnly=yes", "-o", "ServerAliveInterval=30", "-o", "ServerAliveCountMax=3", "-o", "ExitOnForwardFailure=yes", "-R", `80:localhost:${PUERTO}`, "nokey@localhost.run"],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  let resto = "";
  const leer = (trozo) => {
    // El servicio escribe la dirección al abrir el túnel y cada vez que se la cambia, seguida de un
    // código QR de miles de caracteres: se busca en todo lo recibido y se guarda solo el final, por
    // si una dirección llega partida entre dos trozos.
    const texto = resto + trozo;
    resto = texto.slice(-200);
    const todas = texto.match(/https:\/\/[a-z0-9.-]+\.lhr\.life/g);
    if (todas) void alCambiar(todas[todas.length - 1]);
  };
  t.stdout.on("data", leer);
  t.stderr.on("data", leer);
  t.on("exit", async () => {
    if (apagando) return;
    if (++reintentos > 5) return apagar(1, "El túnel se cayó demasiadas veces.");
    decir("El túnel se cerró; lo abro otra vez…");
    await espera(3000);
    if (!apagando) abrirTunel();
  });
}
abrirTunel();

console.log(`\nTope de esta sesión: ${TOPE} dólares o ${PREGUNTAS} preguntas; se apaga solo a los ${MINUTOS} minutos.`);
console.log("Mientras esto esté abierto, cualquiera que entre a la página pública puede preguntar a DE-T.");
console.log("Para APAGARLO: Ctrl+C en esta terminal.\n");

// ---- 3 · Vigilar: el tope, el reloj y que el servidor siga vivo
const inicio = Date.now();
setInterval(async () => {
  if (apagando) return;
  if (Date.now() - inicio > MINUTOS * 60000) return apagar(0, `Pasaron ${MINUTOS} minutos: DE-T público se apaga solo.`);
  const e = await estadoLocal();
  if (e && e.listo === false && e.motivo === "tope") apagar(0, "Se alcanzó el tope de esta sesión: DE-T público se apaga.");
}, 15000);
