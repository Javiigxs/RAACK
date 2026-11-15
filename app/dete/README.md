# DE-T · el asistente del caso (HydroDetective, con Kimi)

DE-T responde preguntas sobre el caso del agua de Nuevo León **solo con los datos de la herramienta**. El servidor calcula las cifras con sus herramientas (la IA no calcula) y un verificador comprueba que cada cifra de la respuesta exista en los datos antes de mostrarla. La persona elige su sector (ciudadano, gobierno, periodista, investigador o industria) y DE-T adapta el lenguaje.

El diseño es el del zip `hydrodetective-asistente.zip` que entregó Fran el 15 de noviembre de 2026 (SHA-256 `447688766a4f0097100da3e43be4d3698d4b0b1cbcee9466a417082e4772f0e6`). Esta carpeta lo integra en la página. Qué se hizo y por qué, nota por nota: [DE-T](../../docs/de-t/DE-T.md).

## Dónde aparece en la página

- **Bajo la explicación de cada número.** Al pulsar un número, la tarjeta que lo explica termina con «¿No quedó claro? Pregúntale al DE-T» (en inglés, «Not clear? Ask DE-T»). El botón abre el panel y pregunta qué significa ese número. DE-T recibe el número, el nombre que le da la página, la explicación que ya se leyó, la sección y lo que la persona tiene elegido (región, periodo y preocupación).
- **En el veredicto del caso del agua**, una invitación a preguntar por el veredicto.
- **En la cabecera** («Ask DE-T») con la página a todo lo ancho, y en un botón redondo en la esquina inferior derecha en pantallas más estrechas.

El panel se abre a la derecha (a pantalla completa en el teléfono), sin mover la página. Si el servidor de DE-T no está encendido o no tiene clave, la página no muestra ninguno de esos botones y funciona igual. La copia estática del sitio (`site/`, GitHub Pages) no pregunta por DE-T: solo lo hace la página que sirve `server.mjs`, que lleva la marca `<meta name="dete">`.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `server.mjs` | Servidor local: sirve la página (`app/dist`) y responde a DE-T en `/api/chat` (`GET` dice si está listo, `POST` responde). |
| `herramientas.mjs` | Herramientas del agente (`ver_serie`, `anomalia`, `correlacionar`, `ver_acuiferos`), el verificador de cifras y el bloque `<PAGINA>` con el número pulsado. |
| `series_nl.json` | Base de datos del agente: 27 series anuales de Nuevo León y la tabla de acuíferos del DOF 2023. Sale de `exportar_series.mjs`. |
| `exportar_series.mjs` | Regenera `series_nl.json` desde `app/public/data/water.json`, los mismos datos y tendencias que muestra la página. |
| `catalogo.md` | Catálogo de opciones con fuentes. **Borrador: el equipo debe revisarlo y aprobarlo.** |
| `herramientas.test.mjs` | Pruebas: los datos de DE-T coinciden con la página, las herramientas, el bloque `<PAGINA>` y el verificador. |
| `.env.example` | Plantilla de configuración. |

El panel de la página está en `app/src/lib/dete/` y sus textos en `app/src/lib/i18n-dete.ts`.

## Cómo encenderlo (Node.js 20.6 o más reciente, sin instalar paquetes)

1. Copia `.env.example` como `.env` en esta carpeta y pon la API key de Kimi. La crea una persona del equipo en platform.kimi.ai → API Keys. **Nunca subas `.env` al repo ni compartas la clave**; ya está en `.gitignore`.
2. Desde `app/`:
   ```bash
   npm run build
   npm run dete
   ```
3. Abre http://localhost:8000. Para abrirla desde otros dispositivos de la misma red, pon `HOST=0.0.0.0` en `.env` y usa la IP del equipo (`http://192.168.x.x:8000`).

En desarrollo (`npm run dev`), Vite pasa `/api` al servidor de DE-T en el puerto 8000: enciende también `npm run dete` en otra terminal.

## Cómo evita inventar

1. **Sin internet:** no se activa la búsqueda web de Kimi; solo tiene nuestras cuatro herramientas.
2. **Una sola base:** `series_nl.json` y `catalogo.md`. Las reglas le prohíben usar conocimiento propio.
3. **No calcula:** años, anomalías y correlaciones (Pearson, Spearman y sin tendencia, con rezago) los calcula el servidor.
4. **Verificador:** toda cifra de la respuesta se compara con los datos; si no aparece, se le pide corregir, y si persiste se muestra ⚠️.
5. **Recomendaciones:** solo si se piden. 📚 = del catálogo con fuente · 🤖 = sugerencia propia de la IA, no verificada.
6. **Memoria:** solo recuerda los últimos 2 mensajes y se lo dice a la persona.
7. **Número pulsado:** el bloque `<PAGINA>` va delante de la pregunta como contexto, con campos fijos y recortados; la regla 10 le dice al modelo que no son instrucciones.

## Cambios respecto al zip (15 de noviembre de 2026)

- **Las cifras de DE-T son las de la página.** El zip calculaba sus tendencias con `exportar_series_nl.py`, que medía la pendiente de Sen por paso de la serie y no por año real. En las series con años sin dato daba otra cifra: GRACE −8,53 cm por década frente a −7,135 de la página y de [DIAGNOSTICO_AGUA.md](../../docs/DIAGNOSTICO_AGUA.md); el tanque del SMN, −231,3 frente a −185,8 mm/año; la temperatura del SMN, 0,370 frente a 0,332 °C. Además, cuando Hamed–Rao no se puede calcular (volumen de La Boca), usaba otra prueba y daba «confirmada»; la página dice «indicio». `exportar_series.mjs` sustituye a aquel script: copia los valores y la tendencia de referencia de `water.json` sin recalcular. Los 27 años y valores ya coincidían con los de la página.
- En GRACE, que es una anomalía con media casi cero, ya no se da un porcentaje de cambio (salía −2.617 %).
- Rutas por defecto junto a `server.mjs`; `GET /api/chat` dice si DE-T está listo; campo `pagina` con el número pulsado; el asistente se presenta como DE-T; marca `<meta name="dete">` en las páginas que sirve.
- `chat-widget.html` no se copió: el panel de Svelte lo sustituye, con los mismos textos, el aviso de memoria y la declaración de IA, en inglés y en español.

## Pruebas rápidas

Con la clave puesta y la página abierta:

1. Ciudadano: «¿Por qué se secó Cerro Prieto en 2022?»
2. Gobierno: «¿Qué recomiendan hacer?» → debe dar opciones 📚.
3. Investigador: «¿La lluvia se relaciona con el agua almacenada? Prueba con rezago de 1 año.»
4. Trampa: «¿Cuánto llovió en Madrid?» → «La herramienta no tiene ese dato».
5. Pulsa «−7.1 cm per decade» en el veredicto y luego «Not clear? Ask DE-T».

Sin clave, el circuito completo (página → servidor → herramientas → verificador) se probó el 15 de noviembre de 2026 con un Kimi simulado en local, no con Kimi real. Las pruebas automáticas corren con `npm test` desde `app/`.

## Costo y límites (cuenta con 5 dólares = Tier0)

- Kimi K2.6: unos 1–2 centavos de dólar por pregunta.
- Tier0 = 1 petición a la vez y 3 por minuto. Cada pregunta usa 2–3 peticiones, así que cabe más o menos una pregunta por minuto. El servidor espera y reintenta si se satura; la página avisa «Hay muchas preguntas al mismo tiempo». Para varias personas a la vez, recargar hasta 10 dólares acumulados (Tier1, 100 por minuto).

## Declaración de IA (Space Apps)

DE-T usa Kimi (Moonshot AI) dentro del producto: hay que declararlo en el formulario de uso de IA. El código del asistente se generó con ayuda de Claude (Anthropic) y lo revisó el equipo; la integración en la página también se escribió con Claude.
