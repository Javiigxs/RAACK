---
tags: [raack, hackathon, nasa, space-apps]
fecha: 2026-11-14
estado: preparación
---
# RAACK · Be An Earth System Trend Detective!

**Repositorio del equipo:** [Javiigxs/RAACK](https://github.com/Javiigxs/RAACK). El README consultado el 14 de noviembre de 2026 identifica este reto.

**Reto oficial:** [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/). [Recursos oficiales](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/?tab=resources).

## Qué debemos resolver

Crear una herramienta que permita seleccionar variables de misiones o modelos de ciencias de la Tierra, elegir una región y visualizar su evolución temporal. Debe ayudar a responder:

- **Qué cambia:** variable y significado comprensibles.
- **Dónde cambia:** región o ubicación elegida; puede haber tendencias opuestas en distintas zonas.
- **Cuánto cambia:** dirección y tasa de cambio, con sus unidades.
- **Si el cambio es significativo:** prueba estadística o intervalo de confianza, explicados junto con sus límites.

La página oficial pide una serie suficientemente larga para el análisis. Menciona pruebas t, Mann–Kendall e intervalos de confianza como posibles métodos; empezar por tendencias lineales cumple el enfoque planteado. Recomienda datos diarios o mensuales por su facilidad de procesamiento.

## Material preparado

- [Recursos y descargas](../recursos/README.md): catálogo de los 12 recursos distintos de Giovanni, archivos locales y estado de acceso.
- [Referencia científica y muestra GLDAS](REFERENCIA_CIENTIFICA.md): métodos del artículo NASA y metadatos de la muestra descargada.
- [Pendientes](PENDIENTES.md): decisiones sobre variable, región, periodo y acceso a datos.
- [Giovanni - decisión pendiente](decisiones/GIOVANNI.md): excluido por indicación del equipo, pendiente de nuestra decisión.
- [2026-11-14 - Preparación de recursos](PREPARACION_2026-11-14.md): registro de esta revisión.

Los siete archivos descargados están en `recursos/archivos/`. Hay tres PDF, un notebook, una guía Markdown, una licencia y una muestra CSV. La muestra permite probar la importación y las gráficas; todavía falta seleccionar y descargar la serie larga del caso de demostración.
