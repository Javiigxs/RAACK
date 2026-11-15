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

Nota redactada con ayuda de IA (Claude) para el equipo RAACK.
