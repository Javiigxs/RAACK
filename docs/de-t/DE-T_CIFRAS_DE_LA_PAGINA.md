---
tags: [raack, de-t, datos]
fecha: 2026-11-15
---
# Las cifras de DE-T son las de la página

[DE-T](DE-T.md) · [La pendiente por paso del zip](DE-T_PENDIENTE_POR_PASO.md) · [Grafo de conocimiento](../CONOCIMIENTO.md)

## Qué se hizo

- La base de datos de DE-T (`app/dete/series_nl.json`) sale ahora de `app/public/data/water.json`, el mismo archivo que dibuja la página. Lo copia `app/dete/exportar_series.mjs`: los valores anuales de las 27 series y, para cada una, la tendencia de referencia del registro completo, sin recalcular nada. También copia los 23 acuíferos del DOF del 9 de noviembre de 2023, 13 con déficit.
- Esas tendencias las calcula en Python `app/scripts/build_water.py` (pymannkendall y statsmodels), y las pruebas de la página las fijan.
- Se conservan los nombres, fuentes y notas que escribió el zip para cada serie.
- En GRACE, que es una anomalía con media casi cero, ya no se da un porcentaje de cambio: salía −2.617 %, una cifra sin sentido.
- El script del zip (`exportar_series_nl.py`) no se copió al repositorio: lo sustituye el exportador.

## Por qué

Una sola fuente de cifras. Si los datos de la página cambian, basta con `npm run dete:data` (desde `app/`) para que DE-T diga lo mismo. Además, `app/dete/herramientas.test.mjs` falla si `series_nl.json` deja de coincidir con la página.

## Dónde se ve

En la [Página web](../../app/README.md) y en las [instrucciones de DE-T](../../app/dete/README.md), sección «Cambios respecto al zip».

Nota redactada con ayuda de IA (Claude) para el equipo RAACK.
