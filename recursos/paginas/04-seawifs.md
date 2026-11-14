---
id: seawifs
fecha_revision: 2026-11-14
estado: ficha-y-metodología-revisadas-pdf-disponible
---
# Artículo SeaWiFS · series de clorofila en regiones costeras

[Catálogo de recursos](../README.md) · [Ficha NASA NTRS](https://ntrs.nasa.gov/citations/20090042747) · [PDF original](https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf) · [PDF guardado](../archivos/nasa-seawifs-series-temporales-20090042747.pdf)

**Alcance real:** se abrió la ficha bibliográfica y se revisó el PDF ya descargado, especialmente Methods y la discusión de significación y regresión robusta. No se descargaron los datos originales, no se digitalizaron las figuras y no se reprodujeron los cálculos.

## Identificación comprobada

**James G. Acker, Erin McMahon, Suhung Shen, Thomas Hearty y Nancy Casey (2009).** *Time-Series Analysis of Remotely-Sensed SeaWiFS Chlorophyll in River-Influenced Coastal Regions*.

La ficha NTRS identifica el documento **20090042747**, lo clasifica como **Preprint** y presenta la referencia EARSeL eProceedings, volumen 8, número 2. Marca distribución pública y uso público permitido. La fecha de adquisición de NTRS en 2013 no debe confundirse con el año de publicación 2009. La ficha ofrece el PDF, pero indica que no hay vista previa ni registros asociados. [Metadatos NASA](https://ntrs.nasa.gov/citations/20090042747).

## Información científica extraída

El estudio analiza clorofila estimada por SeaWiFS en nueve sistemas fluviales, con diez regiones porque divide el Mississippi en dos. Usa productos mensuales Level 3 y regiones de 0.5° × 0.5° durante 1998–2007. El método calcula medias espaciales y ajusta regresiones lineales; contrasta significación con ANOVA/prueba F, p < 0.05 y R². También analiza anomalías mensuales y anuales y compara pendientes con regresión robusta. [PDF, Methods, página 3; discusión y tabla de resultados desde la página 17](../archivos/nasa-seawifs-series-temporales-20090042747.pdf).

El trabajo advierte interferencia de sedimentos y materia orgánica disuelta en la señal de clorofila costera. Crecidas y observaciones extremas pueden alterar pendientes; una asociación temporal necesita más evidencia para atribuir causas. El artículo no presenta Mann–Kendall ni estimación de Sen. [PDF, introducción, Methods y discusión](../archivos/nasa-seawifs-series-temporales-20090042747.pdf).

## Por qué sirve para RAACK

Ofrece un ejemplo de la secuencia **variable → región → serie → pendiente → significación → interpretación** y muestra que una misma variable puede tener resultados diferentes entre regiones. Permite diseñar una presentación que muestre la pendiente y la incertidumbre junto al contexto ambiental, sin convertir una tendencia en una afirmación causal automática.

Su ejemplo es metodológico e histórico. No proporciona por sí solo un conjunto de datos de entrada preparado para la nueva herramienta. Las decisiones sobre prueba estadística, manejo de estacionalidad y calidad deben justificarse para la serie que el equipo elija.

## Recorrido realizado y punto de parada

1. Se abrió en Chrome la [ficha NTRS](https://ntrs.nasa.gov/citations/20090042747).
2. Se comprobaron título, autores, fechas, clasificación del documento, condiciones de distribución y enlaces de descarga.
3. Se leyó el resumen y se comprobó que el PDF disponible corresponde al archivo ya guardado.
4. Se extrajo el texto del PDF local para revisar Methods (página 3), resultados, conclusiones y comparación de regresiones (desde página 17). Se usó el texto y la estructura del documento; no se recalcularon las tablas.

**Último punto:** revisión de la metodología y sus límites. La parada responde al alcance de esta preparación: documentar la referencia y su utilidad. No se dispone en el repositorio de las series de clorofila del estudio ni de un análisis reproducido de ellas.

## Archivos, Giovanni y pendientes

El PDF de 27 páginas ya fue descargado durante la preparación inicial y está en [archivos](../archivos/nasa-seawifs-series-temporales-20090042747.pdf), con procedencia y SHA-256 en el [manifiesto](../archivos/descargas.json). **No hubo nuevas descargas en esta ampliación.**

El artículo utiliza **Giovanni** para generar sus series históricas. Se documenta ese hecho para entender el método; no se abrió el servicio ni se adoptó para RAACK. Su uso sigue [pendiente de nuestra decisión](../../docs/decisiones/GIOVANNI.md).

- Si se quiere reproducir el ejemplo, obtener las series y precisar producto, procesamiento y regiones del estudio.
- Elegir la prueba apropiada para el caso del equipo y documentar sus supuestos.
- Separar tendencia, significación estadística, calidad de la observación e interpretación ambiental en la interfaz.

