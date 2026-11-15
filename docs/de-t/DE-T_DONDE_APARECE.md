---
tags: [raack, de-t, pagina]
fecha: 2026-11-15
---
# Dónde aparece DE-T en la página y por qué

[DE-T](DE-T.md) · [Cómo evita inventar](DE-T_COMO_EVITA_INVENTAR.md) · [Página web](../../app/README.md) · [Grafo de conocimiento](../CONOCIMIENTO.md)

| Lugar | Qué hace | Por qué ahí |
|---|---|---|
| Bajo la explicación de cada número | La tarjeta termina con «¿No quedó claro? Pregúntale al DE-T» («Not clear? Ask DE-T»). El botón abre el panel y pregunta qué significa ese número, con su contexto. | Es lo que pidió Fran: quien sigue con dudas después de la tarjeta pregunta sin perder el sitio. |
| En el veredicto del caso del agua | Una invitación a preguntar por el veredicto, eligiendo quién eres: ciudadanía, gobierno, prensa, investigación o industria. | El veredicto es la conclusión que más preguntas genera, y el sector cambia cómo responde DE-T. |
| En la cabecera, a partir de 1180 px | Botón «Ask DE-T». | Por debajo de ese ancho, el botón partía el nombre de la página en dos líneas. |
| Botón redondo abajo a la derecha, por debajo de 1180 px | Abre el mismo panel. No aparece sobre la Tierra de la entrada. | Para que DE-T siga a mano en pantallas estrechas sin romper la cabecera. |
| El panel | Se abre a la derecha (a pantalla completa en el teléfono) sin mover la página. Escape lo cierra. | Para volver al mismo número después de leer la respuesta. |

## Solo con su servidor

DE-T aparece cuando la página la sirve su propio servidor (`app/dete/server.mjs`) y este tiene la clave de Kimi. El servidor marca las páginas que sirve; una copia estática, como GitHub Pages o `site/`, no tiene esa marca y no muestra ningún botón ni hace ninguna petición.

**Por qué:** sin servidor no hay a quién preguntar, y un botón que no responde o un error 404 en la consola quedarían mal ante los jueces. Se comprobó con la copia estática: cero peticiones a DE-T.

## Diseño

Usa los colores, el modo oscuro y la regla de movimiento reducido de la página, como el resto de las piezas. Los textos están en inglés y español (`app/src/lib/i18n-dete.ts`), y las pruebas exigen las mismas frases en los dos idiomas.

## Actualización del 15 de noviembre de 2026, por la mañana · donde se elige el país

Fran pidió que DE-T pesara más en la página, porque la herramienta son el agente y las bases de datos, y propuso que se le pudiera preguntar donde se elige el país.

| Lugar | Qué hace | Por qué ahí |
|---|---|---|
| Paso 9, bajo los países de inicio | Enlace «Ask DE-T about Italy ↓» («Pregúntale al DE-T por Italia ↓»). Lleva a la línea de la pregunta y deja el cursor en ella. | Es donde se elige el país. Un enlace no baja el resultado «7 / 10», que es la cifra de esa sección. |
| Paso 9, bajo el globo y su resultado | Una franja a todo el ancho: a la izquierda, quién responde; a la derecha, la línea para escribir la pregunta y tres preguntas de inicio sobre el lugar elegido. | Primero se ve lo que hay del país y después se pregunta. Usa las dos columnas del globo y su resultado, sin caja, como el resto de la página. |
| El panel | Cada pregunta hecha desde la franja dice «About Italy». Las que se escriben después siguen siendo sobre ese lugar hasta pulsar «New conversation», abrir DE-T desde el veredicto o preguntar por un número de otra sección. | Para que se vea de qué lugar se habla sin añadir un control más. |
| Un número del globo | «Not clear? Ask DE-T» manda también el lugar del globo. | Antes llegaba el número sin el país y DE-T no podía comprobarlo. |

Las tres preguntas de inicio de un país: si pierde agua almacenada, qué falta para abrir el caso allí y cómo se compara con Nuevo León. Con Nuevo León elegido son las tres del panel.

Se probó añadir «Ask DE-T» a la cabecera del caso, junto a «Start the investigation», y se quitó: a ese ancho ya está el botón de la cabecera o el redondo de la esquina, y el enlace quedaba suelto en una segunda línea.

En desarrollo (`npm run dev`), si DE-T está apagado, en el sitio de la franja se lee por qué y cómo encenderlo. La página publicada no lo muestra.

**Cómo se comprobó:** en el navegador, con el estado de DE-T encendido a mano y las respuestas simuladas, en inglés y español, a 1024 y 375 px, en tema claro y oscuro. Se revisó lo que la página manda al servidor: el identificador del lugar y nada más.

## Actualización del 15 de noviembre de 2026, a media mañana · en la página pública, con interruptor

La página ya está publicada en GitHub Pages y Fran preguntó si DE-T podía estar ahí y poder apagarse, para que nadie más gaste el saldo de la prueba.

- **Lo que no se puede:** GitHub Pages solo sirve archivos. No puede correr el servidor de DE-T, y la clave de Kimi no puede ir en el repositorio.
- **Lo que se hizo:** un interruptor. La página pública lee un archivo de la rama `dete-publico`; si nombra una dirección, pregunta allí por DE-T y muestra sus botones, y si dice `null`, no muestra nada ni pregunta más. `npm run dete:publico` (desde `app/`) enciende a DE-T en el equipo que tiene la clave, le abre un túnel y escribe la dirección en el interruptor; Ctrl+C lo apaga todo.
- **Por qué así:** la clave se queda en el equipo, Fran decide cuándo se enciende y cuándo se apaga, y el interruptor vive en una rama aparte para no llenar `main` de commits ni tocar el trabajo de otros.
- **Lo que cuesta:** el equipo tiene que estar encendido; encender tarda hasta 5 minutos en verse (GitHub renueva ese archivo cada 5 minutos, medido ese día), y hay un tope de gasto por sesión (0,50 dólares o 40 preguntas, por defecto).
- **Cómo se comprobó:** con el Kimi simulado, en la página pública real, pulsando un número y «Not clear? Ask DE-T». Con Kimi real, por este camino, no se ha probado.

El detalle y las opciones del comando están en [las instrucciones de DE-T](../../app/dete/README.md), sección «DE-T en la página pública: encenderlo y apagarlo».

Nota redactada con ayuda de IA (Claude) para el equipo RAACK.
