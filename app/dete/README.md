# DE-T · el asistente del caso (HydroDetective, con Kimi)

DE-T responde preguntas sobre el caso del agua de Nuevo León y sobre lo que la herramienta tiene de cada país **solo con los datos de la herramienta**. El servidor calcula las cifras con sus herramientas (la IA no calcula) y un verificador comprueba que cada cifra de la respuesta exista en los datos antes de mostrarla. La persona elige su sector (ciudadano, gobierno, periodista, investigador o industria) y DE-T adapta el lenguaje.

El diseño es el del zip `hydrodetective-asistente.zip` que entregó Fran el 15 de noviembre de 2026 (SHA-256 `447688766a4f0097100da3e43be4d3698d4b0b1cbcee9466a417082e4772f0e6`). Esta carpeta lo integra en la página. Qué se hizo y por qué, nota por nota: [DE-T](../../docs/de-t/DE-T.md).

## Dónde aparece en la página

- **Bajo la explicación de cada número.** Al pulsar un número, la tarjeta que lo explica termina con «¿No quedó claro? Pregúntale al DE-T» (en inglés, «Not clear? Ask DE-T»). El botón abre el panel y pregunta qué significa ese número. DE-T recibe el número, el nombre que le da la página, la explicación que ya se leyó, la sección y lo que la persona tiene elegido (región, periodo y preocupación).
- **Donde se elige el país** (paso 9, «Take the case to any country»). Bajo los países de inicio hay un enlace «Ask DE-T about Italy ↓», y bajo el resultado, una franja con una línea para escribir la pregunta y tres preguntas de inicio sobre el lugar elegido en el globo. La respuesta se abre en el panel. La página manda solo el identificador del lugar; lo que DE-T sabe de él lo pone el servidor.
- **En el veredicto del caso del agua**, una invitación a preguntar por el veredicto.
- **En la cabecera** («Ask DE-T») con la página a todo lo ancho, y en un botón redondo en la esquina inferior derecha en pantallas más estrechas.

El panel se abre a la derecha (a pantalla completa en el teléfono), sin mover la página. Si el servidor de DE-T no está encendido o no tiene clave, la página no muestra ninguno de esos botones y funciona igual. La copia estática del sitio (`site/`, GitHub Pages) no pregunta por DE-T: solo lo hace la página que sirve `server.mjs`, que lleva la marca `<meta name="dete">`.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `server.mjs` | Servidor local: sirve la página (`app/dist`) y responde a DE-T en `/api/chat` (`GET` dice si está listo, `POST` responde). |
| `herramientas.mjs` | Herramientas del agente (`ver_serie`, `anomalia`, `correlacionar`, `ver_acuiferos`, `ver_pais`, `ranking_paises`), el verificador de cifras y los bloques `<PAGINA>` (el número pulsado) y `<LUGAR>` (el lugar elegido en el globo). |
| `series_nl.json` | Base de datos de Nuevo León: 27 series anuales y la tabla de acuíferos del DOF 2023. Sale de `exportar_series.mjs`. |
| `paises.json` | Base de datos por país: los 243 países y territorios del globo, con sus diez capas de datos (lista o no, y por qué) y el primer vistazo a su agua almacenada (GRACE) en 189 de ellos; además, los dos casos de la página. Sale de `exportar_series.mjs`. |
| `exportar_series.mjs` | Regenera las dos bases desde los datos de la página (`app/public/data/water.json` y `world.json`): las mismas cifras que se ven en ella. |
| `catalogo.md` | Catálogo de opciones con fuentes. **Borrador: el equipo debe revisarlo y aprobarlo.** |
| `publico.mjs`, `publico.json` | Enciende y apaga DE-T para la página pública (`npm run dete:publico`), y dónde están esa página y su interruptor. |
| `herramientas.test.mjs` | Pruebas: los datos de DE-T coinciden con la página, las herramientas, los bloques `<PAGINA>` y `<LUGAR>` y el verificador. |
| `pruebas/` | `kimi-falso.mjs`, un Kimi simulado que falla como dice la documentación de Kimi que falla el real, y `prueba-servidor.mjs`, que arranca los dos y hace 40 comprobaciones por HTTP (`npm run dete:prueba`, sin clave). `prueba-real.mjs` hace las ocho pruebas rápidas con Kimi real (`npm run dete:real`; **gasta saldo**, unos centavos por pregunta) y `resultado-kimi-real-2026-11-15.txt` guarda lo que salió ese día. |
| `.env.example` | Plantilla de configuración. |

El panel y la franja de la página están en `app/src/lib/dete/` y sus textos en `app/src/lib/i18n-dete.ts`. `app/src/lib/dete/countries.test.ts` compara `paises.json`, país por país, con lo que calcula el código de la página.

## Las bases de datos de DE-T y cómo se le dan

DE-T no tiene acceso a internet ni a archivos sueltos: solo ve lo que el servidor le pasa.

| Base | Qué contiene | De dónde sale | Cómo llega al modelo |
|---|---|---|---|
| `series_nl.json` | 27 series anuales de Nuevo León y los 23 acuíferos del DOF | `app/public/data/water.json` | Un resumen en las instrucciones (`<DATOS>`) y los valores, al pedirlos con `ver_serie`, `anomalia`, `correlacionar` o `ver_acuiferos` |
| `paises.json` | 243 países: capas de datos listas y agua almacenada | `app/public/data/world.json` | Un resumen en las instrucciones (`<PAISES>`) y la ficha de cada país, al pedirla con `ver_pais` o `ranking_paises` |
| `catalogo.md` | Opciones de actuación, con su fuente | Lo escribe el equipo | Entero en las instrucciones (`<CATALOGO>`) |

Para actualizar las dos primeras, desde `app/`:

```bash
npm run dete:data
```

```bash
npm test
```

La segunda orden falla si las bases no coinciden con la página. El servidor las lee en cada pregunta: no hace falta reiniciarlo.

Para darle una base nueva hacen falta tres cosas: exportarla a un JSON en esta carpeta (en `exportar_series.mjs`, copiando las cifras de la página sin recalcular), añadir una herramienta que la consulte en `herramientas.mjs` y una línea en las instrucciones de `server.mjs` que diga qué contiene y qué no.

## Cómo encenderlo (Node.js 20.6 o más reciente, sin instalar paquetes)

1. Copia `.env.example` como `.env` en esta carpeta y pega la API key de Kimi después de `MOONSHOT_API_KEY=`, sin comillas. La crea una persona del equipo en platform.kimi.ai → API Keys. **Nunca subas `.env` al repo ni compartas la clave**; ya está en `.gitignore`.
2. Desde `app/`:
   ```bash
   npm run build
   npm run dete
   ```
3. Mira la terminal. Al arrancar, el servidor pregunta a Kimi qué modelos ve la clave (no gasta saldo) y dice una de estas tres cosas: que la clave vale y la cuenta tiene el modelo, que Kimi rechazó la clave, o que la cuenta no tiene ese modelo y cuáles tiene.
4. Abre http://localhost:8000. Para abrirla desde otros dispositivos de la misma red, pon `HOST=0.0.0.0` en `.env` y usa la IP del equipo (`http://192.168.x.x:8000`).

**El modelo.** El diseño del equipo usaba `kimi-k2.6`. Según la documentación de Kimi consultada el 15 de noviembre de 2026, ese modelo ya no se da a las cuentas registradas desde el 1 de noviembre y se retira a finales de diciembre de 2026. Con la clave del equipo, Kimi respondió ese día que la cuenta solo tiene `kimi-k3.1-pro` y `kimi-k3`. Por eso el servidor usa ahora `kimi-k3.1-pro`, el de tarifa más baja de los dos, con el razonamiento en `low` (`KIMI_REASONING_EFFORT`): razona siempre, y lo que razona se cobra como salida. Si la terminal dice que la cuenta no tiene el modelo, cambia `KIMI_MODEL` en `.env`. **Que el equipo confirme el modelo.**

En desarrollo (`npm run dev`), Vite pasa `/api` al servidor de DE-T en el puerto 8000: enciende también `npm run dete` en otra terminal. Si DE-T está apagado, la página de desarrollo lo dice bajo el selector de país y explica cómo encenderlo; la página publicada no muestra nada.

## DE-T en la página pública: encenderlo y apagarlo

GitHub Pages solo sirve archivos: no puede correr el servidor de DE-T ni guardar la clave de Kimi. Para que DE-T se vea en la página pública solo cuando el equipo quiera, hay un **interruptor**: un archivo en la rama `dete-publico` del repositorio que la página pública lee al abrirse. Si nombra una dirección, la página pregunta allí por DE-T y muestra sus botones; si dice `null`, no muestra nada. Pedido de Fran el 15 de noviembre de 2026.

**Encender**, desde `app/`, en el equipo que tiene la clave:

```bash
npm run dete:publico
```

El comando arranca un servidor de DE-T aparte (puerto 8010; no toca el del 8000), abre un túnel por ssh (localhost.run, sin instalar nada) que le da una dirección de internet y escribe esa dirección en el interruptor. GitHub tarda hasta 5 minutos en reflejarlo; la terminal avisa cuando la página pública ya ve a DE-T. El equipo tiene que seguir encendido y con esa terminal abierta.

**Apagar:** Ctrl+C en esa terminal. Apaga el interruptor y cierra el túnel y el servidor: desde ese momento nadie puede preguntar. Durante unos 5 minutos la página aún lee la dirección vieja; como ya no responde, DE-T no aparece, pero en la consola del navegador queda un error de esa petición.

| Opción | Qué hace |
|---|---|
| `npm run dete:publico -- --tope 0.25` | Tope de gasto de la sesión en dólares (por defecto 0,50, según la estimación del servidor). Al llegar, DE-T deja de responder y se apaga. |
| `npm run dete:publico -- --preguntas 20` | Tope de preguntas (por defecto 40). |
| `npm run dete:publico -- --minutos 60` | Se apaga solo pasado ese tiempo (por defecto 120). |
| `npm run dete:publico -- --simulado` | Ensayo con el Kimi simulado: no usa la clave ni gasta. Las respuestas son plantillas, no las de Kimi. |
| `npm run dete:publico -- apagar` | Solo apaga el interruptor, por si el equipo se cerró de golpe. |

**Qué cuida el saldo.** El tope de la sesión; el apagado automático; que desde un navegador solo puede preguntar la página pública (`DETE_ORIGENES`: una pregunta lanzada desde otra página se rechaza sin llegar a Kimi), y que la clave no sale del equipo. **Qué no cuida:** mientras está encendido, la dirección del túnel se puede leer en el interruptor, y quien la copie puede preguntar sin pasar por la página hasta agotar el tope. La terminal dice lo que gasta cada pregunta.

**Cómo se probó** (15 de noviembre de 2026): con `--simulado`, en la página pública real. La página leyó el interruptor, mostró «Ask DE-T», y una pregunta hecha desde la tarjeta de un número fue y volvió por el túnel con las cifras verificadas; al apagar, el interruptor volvió a `null` y la dirección dejó de responder. **No se ha probado con Kimi real por este camino**, para no gastar saldo sin que Fran lo decida. La dirección del túnel la da un servicio gratuito y puede cambiar sola: el comando vuelve a escribirla en el interruptor.

## Cómo evita inventar

1. **Sin internet:** no se activa la búsqueda web de Kimi; solo tiene nuestras cuatro herramientas.
2. **Solo sus bases:** `series_nl.json`, `paises.json` y `catalogo.md`. Las reglas le prohíben usar conocimiento propio.
3. **No calcula:** años, anomalías y correlaciones (Pearson, Spearman y sin tendencia, con rezago) los calcula el servidor.
4. **Verificador:** toda cifra de la respuesta se compara con los datos; si no aparece, se le pide corregir, y si persiste se muestra ⚠️.
5. **Recomendaciones:** solo si se piden. 📚 = del catálogo con fuente · 🤖 = sugerencia propia de la IA, no verificada.
6. **Memoria:** solo recuerda los últimos 2 mensajes y se lo dice a la persona.
7. **Número pulsado:** el bloque `<PAGINA>` va delante de la pregunta como contexto, con campos fijos y recortados; la regla 10 le dice al modelo que no son instrucciones.
8. **Países:** de cada país DE-T solo tiene sus capas de datos y un primer vistazo al agua almacenada; la regla 11 le obliga a decir que es un solo mascon de GRACE bajo el punto de referencia del país, no su promedio ni un veredicto, y cada ficha trae sus avisos (mascon mayor que el país, mascon compartido con un vecino, mascon de mar, hielo).
9. **Lugar elegido:** la página manda solo el identificador del lugar (`nl`, `cv` o el código ISO de dos letras). El bloque `<LUGAR>` lo escribe el servidor con `paises.json`; un identificador que no conoce se ignora.

## Cambios respecto al zip (15 de noviembre de 2026)

- **Las cifras de DE-T son las de la página.** El zip calculaba sus tendencias con `exportar_series_nl.py`, que medía la pendiente de Sen por paso de la serie y no por año real. En las series con años sin dato daba otra cifra: GRACE −8,53 cm por década frente a −7,135 de la página y de [DIAGNOSTICO_AGUA.md](../../docs/DIAGNOSTICO_AGUA.md); el tanque del SMN, −231,3 frente a −185,8 mm/año; la temperatura del SMN, 0,370 frente a 0,332 °C. Además, cuando Hamed–Rao no se puede calcular (volumen de La Boca), usaba otra prueba y daba «confirmada»; la página dice «indicio». `exportar_series.mjs` sustituye a aquel script: copia los valores y la tendencia de referencia de `water.json` sin recalcular. Los 27 años y valores ya coincidían con los de la página.
- En GRACE, que es una anomalía con media casi cero, ya no se da un porcentaje de cambio (salía −2.617 %).
- Rutas por defecto junto a `server.mjs`; `GET /api/chat` dice si DE-T está listo; campo `pagina` con el número pulsado; el asistente se presenta como DE-T; marca `<meta name="dete">` en las páginas que sirve.
- `chat-widget.html` no se copió: el panel de Svelte lo sustituye, con los mismos textos, el aviso de memoria y la declaración de IA, en inglés y en español.

## Cambios del 15 de noviembre de 2026 por la mañana: países, franja y petición a Kimi

Pedido de Fran: que DE-T pese más en la página y que se le pueda preguntar donde se elige el país.

- **Base por país** (`paises.json`) y dos herramientas, `ver_pais` y `ranking_paises`. Antes, DE-T contestaba «La herramienta no tiene ese dato» a cualquier pregunta que no fuera de Nuevo León.
- **Las cifras de un país son las de la página.** Se redondean desde el valor completo. Redondear dos veces cambiaba la cifra en nueve países: en Italia la pendiente es −6,7495 cm por década y la página dice −6.7; con tres decimales quedaba −6,750, que un modelo puede leer como −6.8. Su p es 0,000997: la página dice «p < 0.001» y con cuatro decimales salía «p = 0.001».
- **Aviso del hielo.** GRACE mide la masa de agua en todas sus formas. El título oficial del producto, en los metadatos de NASA guardados en `recursos/archivos/nuevo-leon/grace/`, es «Ocean, Ice, and Hydrology Equivalent Water Height». Las fichas de los países más allá de 60° de latitud y el ranking lo dicen: el punto que más baja es Svalbard y Jan Mayen, y es hielo. **El equipo debe revisar esta frase.**
- **Petición a Kimi.** El zip pedía como máximo 900 tokens por respuesta. Según la documentación de Kimi, sus modelos actuales razonan antes de responder y ese razonamiento cuenta dentro del tope: con 900 la respuesta puede llegar vacía. Ahora el tope es 16000 (`KIMI_MAX_TOKENS`), el que recomienda Kimi. Las herramientas se declaran en todas las peticiones y, cuando solo se quiere texto, se manda `tool_choice: "none"`. Si el modelo gasta sus cuatro rondas pidiendo herramientas, una petición más le hace responder con lo que tiene. `KIMI_THINKING` y `KIMI_REASONING_EFFORT` son opcionales (ver `.env.example`).
- **Clave.** Una clave vacía o el texto de la plantilla cuentan como «sin clave». El servidor comprueba la clave y el modelo al arrancar.
- **Gasto y límite de la cuenta.** Cada pregunta deja en la terminal una línea con sus tokens y su costo estimado, y las esperas ante un 429 suman ahora algo más de un minuto (antes, 28 segundos).
- **En la página:** la franja bajo el selector de país, el enlace junto a los países de inicio, el lugar de la conversación («Sobre Italia» en cada pregunta) y el número del globo, que ahora llega a DE-T con su país.

Probado el 15 de noviembre de 2026 con un Kimi simulado que se comporta como describe la documentación (razona, rechaza una llamada a herramientas sin su razonamiento y corta la respuesta si el tope es corto): 40 comprobaciones por HTTP contra el servidor real, que se repiten con `npm run dete:prueba` desde `app/`. En el navegador se recorrió la página en inglés y español, en escritorio y teléfono, con las respuestas simuladas en la propia página, porque no se pudo arrancar un servidor más de vista previa.

**Probado con Kimi real el 15 de noviembre de 2026**, con la clave de Fran, `kimi-k3.1-pro` y el razonamiento en `low`. Las ocho pruebas rápidas, por HTTP contra el servidor (`npm run dete:real`): las ocho respondidas y todas con las cifras verificadas. Italia sale con −6.7 cm por década y el aviso de primer vistazo; las dos trampas (lluvia de Madrid y de Italia) reciben «La herramienta no tiene ese dato»; las recomendaciones llegan marcadas 📚 con su fuente. Cada pregunta tardó entre 11 y 40 segundos y costó entre 0,4 y 3,0 centavos de dólar según la estimación del servidor (unos 15 centavos en total, con una repetición). En cuatro de ellas la cuenta chocó con su límite por minuto y el servidor esperó. La salida completa está en [`pruebas/resultado-kimi-real-2026-11-15.txt`](pruebas/resultado-kimi-real-2026-11-15.txt). De esa prueba salió un cambio: la regla 2 pide ahora decir en el idioma de la persona que la herramienta no tiene el dato (a una pregunta en inglés le respondió esa frase en español). **Falta verlo en la página** servida por `npm run dete`.

## Pruebas rápidas

Con la clave puesta y la página abierta:

1. Ciudadano: «¿Por qué se secó Cerro Prieto en 2022?»
2. Gobierno: «¿Qué recomiendan hacer?» → debe dar opciones 📚.
3. Investigador: «¿La lluvia se relaciona con el agua almacenada? Prueba con rezago de 1 año.»
4. Trampa: «¿Cuánto llovió en Madrid?» → «La herramienta no tiene ese dato».
5. Pulsa «−7.1 cm per decade» en el veredicto y luego «Not clear? Ask DE-T».
6. En el paso 9 elige Italia y pulsa «Is Italy losing stored water?» → debe decir −6.7 cm por década y que es un primer vistazo.
7. Con Italia elegida: «What is still missing to open the case in Italy?» → las tres capas que hay que reunir en tierra.
8. Trampa: con Italia elegida, «How much did it rain in Italy last year?» → «La herramienta no tiene ese dato».

Sin clave, el circuito completo (página → servidor → herramientas → verificador) se probó el 15 de noviembre de 2026 con un Kimi simulado en local. Ese mismo día, ya con la clave, las ocho pruebas de esta lista se hicieron con Kimi real contra el servidor (`npm run dete:real`) y salieron bien; falta repetirlas a mano en la página. Las pruebas automáticas corren con `npm test` desde `app/`.

## Costo y límites (cuenta con 5 dólares = Tier0)

- **La terminal dice lo que gasta cada pregunta**: cuántas peticiones hizo a Kimi, cuánto tardó, los tokens de entrada y de salida que Kimi dice haber cobrado y, con la tarifa del modelo, lo que costó y lo que va en la sesión. El servidor trae la de `kimi-k3.1-pro` (2 dólares por millón de tokens de entrada, 0.2 con caché y 10 de salida) y la de `kimi-k3` (3, 0.3 y 15), tomadas de páginas que citan a Kimi, y la de `kimi-k2.6` (0.95, 0.16 y 4), de la página de Kimi al 26 de octubre de 2026. Es una estimación; el saldo real se ve en platform.kimi.ai. Para otro modelo, o si el precio cambia, se pone en `.env`.
- **Cuánto cabe en 5 dólares.** Medido con Kimi real el 15 de noviembre de 2026 (`kimi-k3.1-pro`, razonamiento en `low`): cada petición manda unos 8 500 tokens de instrucciones, datos y catálogo, casi todos a precio de caché a partir de la segunda, y cada pregunta usa de 1 a 3 peticiones. Las ocho pruebas rápidas costaron entre 0,4 y 3,0 centavos cada una, 1,7 de media: 5 dólares dan para unas 300 preguntas. La cuenta usa una tarifa que no se pudo leer en la tabla oficial de Kimi y no incluye la escritura en caché: **falta compararla con lo que bajó el saldo en la consola de Kimi**.
- **Una pregunta por minuto.** Según el zip, Tier0 admite 1 petición a la vez y 3 por minuto (no se pudo leer la tabla en la documentación de Kimi). Si Kimi responde 429, el servidor espera 8, 20 y 35 segundos y reintenta: la pregunta llega tarde en vez de fallar. Si ni así cabe, la página avisa «Hay muchas preguntas al mismo tiempo». Para varias personas a la vez, recargar hasta 10 dólares acumulados (Tier1, 100 por minuto, según el zip).

## Declaración de IA (Space Apps)

DE-T usa Kimi (Moonshot AI) dentro del producto: hay que declararlo en el formulario de uso de IA. El código del asistente se generó con ayuda de Claude (Anthropic) y lo revisó el equipo; la integración en la página también se escribió con Claude.
