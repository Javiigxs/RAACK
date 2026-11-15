---
tags: [raack, de-t, asistente]
fecha: 2026-11-15
---
# DE-T, el asistente del caso · qué se hizo y por qué

[Índice](../../INDICE.md) · [Grafo de conocimiento](../CONOCIMIENTO.md) · [Pendientes](../PENDIENTES.md) · [Cómo se enciende](../../app/dete/README.md)

DE-T responde preguntas sobre el caso del agua de Nuevo León con los datos de la herramienta. Fran entregó su diseño el 15 de noviembre de 2026 de madrugada: el zip `hydrodetective-asistente`, con un servidor que usa Kimi, cuatro herramientas que calculan las cifras, un verificador, una base de datos y un catálogo de opciones. Pidió meterlo en la página donde tuviera sentido, que la explicación de cada número terminara con «¿No quedó claro? Pregúntale al DE-T» y que se llamara DE-T. La integración la hizo Claude ese mismo día. Esta nota resume qué se hizo; cada parte tiene su nota con el porqué.

## Lo que se hizo

1. **Comprobar sus datos contra los de la página.** Los valores coincidían, pero tres pendientes y una etiqueta no. Detalle en [La pendiente por paso del zip](DE-T_PENDIENTE_POR_PASO.md).
2. **Sacar sus cifras de la página.** Ahora DE-T copia los datos y las tendencias del mismo archivo que usa la página, y una prueba lo vigila. Ver [Las cifras de DE-T son las de la página](DE-T_CIFRAS_DE_LA_PAGINA.md).
3. **Mantener lo que evita que invente**, y añadir el contexto del número pulsado. Ver [Cómo evita inventar](DE-T_COMO_EVITA_INVENTAR.md).
4. **Ponerlo en la página**: bajo cada número, en el veredicto, en la cabecera o en un botón redondo. Solo aparece si su servidor está encendido. Ver [Dónde aparece y por qué](DE-T_DONDE_APARECE.md).
5. **Llamarlo DE-T** en toda la interfaz, en inglés y en español, en el servidor y en las notas. Las carpetas y los comandos siguen siendo `dete` para no tocar código que ya funcionaba.
6. **Registrarlo**: [Grafo de conocimiento](../CONOCIMIENTO.md), vista «8 · DE-T, el asistente del caso»; [Pendientes](../PENDIENTES.md); [Página web](../../app/README.md).

Esa misma noche, mientras se revisaba la página, también se centraron los cuadros de la portada: ver [Cuadros de la portada](../CUADROS_PORTADA.md).

## Cómo se comprobó

- 164 pruebas automáticas: las 139 que había y 25 nuevas de DE-T. `svelte-check` sin errores.
- El recorrido completo (página → servidor → herramientas → verificador) con un **Kimi simulado** en local, en inglés y español, en escritorio y teléfono. **No se ha probado con Kimi real**: falta la clave.
- Commits en `main`: `77a5d3b` (la página), `59bb5a1` (grafo y pendientes), `50800e9` (cuadros), `8fdcbed` y `16e50a1` (estas notas). Subidos a GitHub el 15 de noviembre de 2026.

## Lo que falta

La clave de Kimi y la prueba con el modelo real, aprobar el catálogo de opciones, declarar Kimi en el formulario de uso de IA y decidir cómo lo verán los jueces. La lista está en los [Pendientes](../PENDIENTES.md).

Nota redactada con ayuda de IA (Claude) para el equipo RAACK.
