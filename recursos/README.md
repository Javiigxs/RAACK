---
tags: [raack, recursos, datos]
fecha: 2026-11-14
---
# Recursos y descargas

[Volver al reto](../docs/RETO.md) · [Página de recursos del reto](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/?tab=resources) · [Cobertura de los 13 recursos](COBERTURA.md) · [Índice](../INDICE.md)

Revisión realizada en Chrome el **14 de noviembre de 2026**. Se distinguen archivos guardados, portales de datos y referencias enlazadas.

## Archivos guardados

| Archivo local | Contenido | Tamaño | Fuente |
|---|---|---|---|
| [NASA_SeaWiFS_Time_Series_20090042747.pdf](archivos/nasa-seawifs-series-temporales-20090042747.pdf) | Artículo de NASA sobre análisis de series de clorofila · 27 páginas | 8.81 MB | [Origen](https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf) |
| [training_climexp_Accessing-and-downloading-data.pdf](archivos/knmi-manual-acceso-descarga.pdf) | Manual KNMI para acceder y descargar datos · 15 páginas | 12.77 MB | [Origen](https://climexp.knmi.nl/publications/training_climexp_Accessing-and-downloading-data.pdf) |
| [GSOM_documentation.pdf](archivos/noaa-gsom-documentacion.pdf) | Documentación de datos mensuales NOAA GSOM · 20 páginas | 156.8 kB | [Origen](https://www.ncei.noaa.gov/data/global-summary-of-the-month/doc/GSOM_documentation.pdf) |
| [BC Wildfire raster plot.ipynb](archivos/csa-sar-bc-wildfire.ipynb) | Notebook original de radar SAR de la CSA | 993.4 kB | [Origen](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial/blob/main/Option%202%20-%20Python/BC%20Wildfire%20raster%20plot.ipynb) |
| [Synthetic Aperture Radar tutorial on QGIS.md](archivos/csa-sar-tutorial-qgis.md) | Guía original de SAR en QGIS | 7.0 kB | [Origen](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial/blob/main/Option%201%20-%20QGIS/Synthetic%20Aperture%20Radar%20tutorial%20on%20QGIS.md) |
| [SAR_LICENSE.txt](archivos/csa-sar-LICENSE.txt) | Licencia del tutorial SAR conservada junto a los archivos | 3.6 kB | [Origen](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial/blob/main/LICENSE) |
| [GLDAS_NOAH025_3H_2_1_Evap_tavg_36.6100_-80.2400_05_01_2016_to_05_07_2016.csv](archivos/gldas-evapotranspiracion-muestra-2016-05.csv) | Muestra real de evapotranspiración del visor NASA | 2.0 kB | [Origen](https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series) |

Registro de procedencia, tamaños y SHA-256: [descargas.json](archivos/descargas.json). Los nombres de archivo se adaptaron para el repositorio, conservando íntegros los siete materiales descargados. La licencia del tutorial SAR acompaña al notebook y a la guía.

## Catálogo del reto — Giovanni pendiente de decisión

| Recurso | Para qué nos sirve | Estado y siguiente paso |
|---|---|---|
| [Hydrology Time Series · NASA GES DISC](https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series) | Seleccionar variables hidrológicas y exportar series. | CSV de evapotranspiración guardado. Elegir después ubicación, variable y periodo del equipo. [Ficha 01](paginas/01-hydrology.md). |
| [AppEEARS](https://appeears.earthdatacloud.nasa.gov/) | Extraer datos por puntos o áreas, fechas y capas, junto con calidad. | Portal y [ayuda](https://appeears.earthdatacloud.nasa.gov/help) revisados. Requiere cuenta NASA Earthdata para usar el sitio y la API. Sin extracción solicitada. [Ficha 02](paginas/02-appeears.md). |
| [Climate Data Online · NOAA](https://www.ncei.noaa.gov/cdo-web/) | Temperatura, precipitación y otras observaciones históricas por estación. | Documentación mensual GSOM descargada. Muestras CSV/PDF no guardadas por los bloqueos y fallos de descarga descritos abajo. [Ficha 03](paginas/03-cdo.md). |
| [Artículo SeaWiFS · NASA NTRS](https://ntrs.nasa.gov/citations/20090042747) | Ejemplo real de series regionales, regresión y significación. | PDF de 27 páginas guardado; ver [Referencia científica y muestra GLDAS](../docs/REFERENCIA_CIENTIFICA.md). [Ficha 04](paginas/04-seawifs.md). |
| [KNMI Climate Explorer](https://climexp.knmi.nl/) | Explorar observaciones, reanálisis, modelos y tendencias. | Manual de acceso y descarga guardado. El análisis interactivo muestra una verificación humana pendiente. [Ficha 05](paginas/05-knmi.md). |
| [Statistical test methods to detect trends in time series data](https://medium.com/@snp.kriss/statistical-test-methods-to-detect-trends-in-time-series-data-b361a0ec530b) | Lectura complementaria sobre métodos estadísticos. | Artículo de Medium abierto; referencia enlazada, sin copia íntegra descargada. [Ficha 06](paginas/06-metodos-estadisticos.md). |
| [A Comprehensive Guide to Statistical Significance](https://www.statsig.com/perspectives/a-comprehensive-guide-to-statistical-significance) | Lectura introductoria sobre hipótesis, p y significación. | Página revisada; referencia enlazada, sin archivo descargable guardado. [Ficha 07](paginas/07-significancia.md). |
| [RADARSAT Constellation Mission · CSA](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm) | Imágenes SAR para cambios en tierra, ecosistemas y costas. | Carpeta pública, EODMS y su catálogo STAC revisados. Las muestras abiertas son de una sola fecha; para series, la colección RCM ARD cubre Canadá cada 12 días. Descargar exige registro en EODMS y aceptar la licencia. [Ficha 08](paginas/08-rcm.md). |
| [GEO.ca](https://geo.ca/home/) | Descubrir información geoespacial y capas de contexto de Canadá. | Galería y API STAC del Datacube revisados: series abiertas de Canadá (agua superficial 1984–2023, evapotranspiración mensual, nieve y hielo). Útil solo si la región está en Canadá. [Ficha 09](paginas/09-geo.md). |
| [SWOT Mission · CSA](https://www.asc-csa.gc.ca/eng/satellites/swot/) | Explorar cambios en elevación del agua en lagos, ríos, embalses y océanos. | Página de la CSA, PO.DAAC, Hydrocron y tutorial revisados. Datos globales desde 2023; descargar requiere cuenta NASA Earthdata. [Ficha 10](paginas/10-swot.md). |
| [Monitoring and protecting our ecosystems from space · CSA](https://www.asc-csa.gc.ca/eng/satellites/everyday-lives/monitoring-and-protecting-our-ecosystems-from-space.asp) | Contexto para casos sobre bosques, biodiversidad y ecosistemas. | Página completa y BioSpace revisados. Contexto sin datos descargables; la página es de 2022 y aún llama a SWOT «en desarrollo». [Ficha 11](paginas/11-ecosistemas.md). |
| [Synthetic Aperture Radar Tutorial · CSA](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial) | Ejemplos de visualización geoespacial en Python y QGIS. | Notebook, guía Markdown y licencia guardados individualmente. No es el repositorio RAACK. [Ficha 12](paginas/12-sar.md). |

**Giovanni:** [pendiente de nuestra decisión](../docs/decisiones/GIOVANNI.md). No se abrió ni se descargó material desde ese servicio.

## Accesos y descargas pendientes

- **AppEEARS:** exige NASA Earthdata Login. Seleccionar primero producto, capas, región y fechas.
- **KNMI:** la página pide verificar que la persona es humana antes de usar las herramientas de análisis. Se guardó su manual público sin completar esa verificación.
- **NOAA:** [muestra GSOM CSV](https://www.ncei.noaa.gov/data/global-summary-of-the-month/doc/gsom_sample_csv.csv) bloqueada por Chrome con `ERR_BLOCKED_BY_CLIENT`. La [muestra PDF](https://www.ncei.noaa.gov/data/global-summary-of-the-month/doc/gsom_sample_pdf.pdf) tampoco terminó de descargarse. La documentación mensual sí está guardada.
- **SAR:** Chrome bloqueó el ZIP completo de `codeload.github.com`. Se guardaron los archivos individuales accesibles. Las imágenes del tutorial QGIS usan enlaces remotos y no se descargaron; el notebook contiene rutas de Windows que habrá que adaptar y requiere archivos raster/vectoriales externos. No se ejecutó.
- **Manual KNMI de temperatura:** el enlace de ese manual adicional no terminó de descargarse. El manual principal de acceso y descarga está disponible localmente.
- **RCM:** descargar exige registro en EODMS y aceptar la licencia de cada producto; ver [ficha 08](paginas/08-rcm.md).
- **SWOT:** descargar granulos exige cuenta NASA Earthdata; ver [ficha 10](paginas/10-swot.md).

Qué hay que pedir en cada caso y para qué lo usaríamos: [Bases de datos que hay que pedir](../docs/SOLICITUDES_DE_DATOS.md).

## Antes de elegir datos para la demostración

Definir variable, región y periodo. Conservar fuente, versión del producto, unidades, coordenadas, frecuencia, cobertura temporal, indicadores de calidad y cita. Una muestra de un punto facilita probar la interfaz; un resultado regional requiere observaciones de la región y un tratamiento espacial definido.
