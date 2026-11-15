---
tags: [raack, pagina, cuadros]
fecha: 2026-11-15
---
# Cuadros de la portada: centrado y selector de año

[Índice](../INDICE.md) · [Grafo de conocimiento](CONOCIMIENTO.md) · [Página web](../app/README.md) · [DE-T](de-t/DE-T.md)

«La señal en cuadros» abre la página sobre la Tierra. Fran propuso los cuadros: uno por día de lluvia de un año y uno por mes de temperatura frente a lo habitual. El 15 de noviembre de 2026, viendo la página en Chrome a 1920 px, Fran pidió dos cambios.

## 1. Que todo esté centrado

- **Qué pasaba:** al abrir «View the numbers as a table» en la tarjeta de temperatura, la tabla medía 647 px y la tarjeta 548 px. La tarjeta crecía con la tabla y toda la sección se salía unos 100 px por la derecha de la columna de la página, así que se veía descentrada.
- **Qué se hizo:** cada tarjeta tiene ahora una sola columna que no crece más que ella (`grid-template-columns: minmax(0, 1fr)`), y la tabla se desplaza dentro. Es la misma lección del playbook del equipo (pb157).
- **Cómo se comprobó:** a 375, 1024 y 1920 px, con la tabla abierta y cerrada, las dos tarjetas quedan dentro de la columna con el mismo margen a cada lado.

## 2. Selector de año en la tarjeta de temperatura

- **Qué se hizo:** la tarjeta lleva el mismo control «‹ año ›» que la de lluvia y abre también en 2020. El año elegido se recuadra en la cuadrícula, con el año en negrita encima. Debajo de la leyenda, una frase dice cuántos de sus meses fueron más cálidos de lo habitual y cuál se pasó más. En 2020 fueron 7 de 10 meses válidos, y el que más, marzo, por +3,7 °C. Lo calcula la página; ninguna prueba fija todavía esa cifra.
- **Por qué independiente del de lluvia:** la temperatura cubre 2001–2025 y la lluvia 2002–2024. Si los dos selectores fueran juntos, algunos años dejarían una tarjeta vacía.
- **Detalle:** el título de la tarjeta se parte en dos líneas para que el selector quede arriba a la derecha, igual que en la de lluvia.

Código en `app/src/lib/sections/Squares.svelte` y `app/src/lib/charts/HeatGrid.svelte`; textos en inglés y español en `app/src/lib/i18n-design.ts`. Commit local `50800e9`, sin subir a GitHub.

Nota redactada con ayuda de IA (Claude) para el equipo RAACK.
