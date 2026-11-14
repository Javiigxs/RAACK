---
tags: [raack, recursos, cobertura]
fecha: 2026-11-14
---
# Cobertura de los recursos del reto

[Catálogo de recursos](README.md) · [Página oficial de recursos](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/?tab=resources) · [Grafo de contexto](../docs/CONTEXTO.md) · [Bases de datos que hay que pedir](../docs/SOLICITUDES_DE_DATOS.md)

La lista oficial se comprobó en Chrome el **14 de noviembre de 2026**. Tiene **13 recursos**. Hay una ficha por cada uno de los 12 que revisamos; **Giovanni sigue excluido y pendiente de nuestra decisión** ([decisión](../docs/decisiones/GIOVANNI.md)). No falta ningún recurso de la página.

## Por qué aparece tanto Canadá

La página oficial divide los recursos en dos bloques:

- **NASA Data & Resources (5):** Giovanni, Hydrology Time Series, AppEEARS, Climate Data Online y el artículo SeaWiFS.
- **Space Agency Partner Resources (8):**
  - KNMI Climate Explorer (Países Bajos) y dos artículos de estadística.
  - Bajo el título **«CSA (Canadian Space Agency)»**, cinco recursos de la Agencia Espacial Canadiense: RCM, GEO.ca, SWOT, la página de ecosistemas y el tutorial SAR.

Canadá aparece porque la CSA es una de las agencias socias del Space Apps y aportó esos cinco enlaces. Su utilidad depende de la región que elijamos:

- **GEO.ca y las imágenes RCM públicas cubren solo Canadá.** Sirven si la demostración se hace allí.
- **SWOT es global.** La CSA participa, pero los datos son de NASA y CNES y sirven en cualquier región con ríos o lagos grandes.
- **La página de ecosistemas y el tutorial SAR** aportan contexto y técnica, no series de datos.

La página oficial también avisa de que NASA no avala sitios ajenos al Gobierno de EE. UU. y de que hay que respetar las condiciones de uso de cada uno. Esto afecta a las licencias de RCM, KNMI y Statsig.

## Recurso por recurso

| # | Recurso · bloque oficial | Hasta dónde se llegó | Descargado | Acceso | Relevancia estimada |
|---|---|---|---|---|---|
| 01 | [Hydrology Time Series](paginas/01-hydrology.md) · NASA | Visor, About, guía y tabla de variables de GLDAS V2.1. Después: visor probado con Monterrey, 13 productos y serie de 26 años | CSV GLDAS de una semana | Abierto; su API enlaza Giovanni | **Alta:** 172 variables en un punto, al instante |
| 02 | [AppEEARS](paginas/02-appeears.md) · NASA | Catálogo y ayuda hasta la descarga de muestras de puntos. Después: API público del catálogo y solicitud de prueba enviada | Nada | Cuenta Earthdata **creada**; [solicitud de prueba](../docs/SOLICITUD_APPEEARS_MONTERREY.md) en cola | **Alta:** series de MODIS, VIIRS, Landsat o SMAP con calidad |
| 03 | [Climate Data Online](paginas/03-cdo.md) · NASA | Catálogo GSOM y documentación de la consulta `/data` del API v2. Después: servicio de datos sin token y buscador de estaciones probados | PDF de documentación GSOM | Abierto; el token solo hace falta para el API v2 | **Media:** estaciones para contrastar; cerca de Monterrey terminan en 2011 o 2012 |
| 04 | [Artículo SeaWiFS](paginas/04-seawifs.md) · NASA | Ficha NTRS y metodología del PDF | PDF de 27 páginas | Abierto | **Media:** ejemplo de método |
| 05 | [KNMI Climate Explorer](paginas/05-knmi.md) · socio | Portada, ayuda bloqueada por verificación humana y manual completo | Manual PDF de 15 páginas | **Verificación humana** | **Media:** herramienta de referencia |
| 06 | [Métodos estadísticos · Medium](paginas/06-metodos-estadisticos.md) · socio | Artículo hasta *References* y documentación de ADF | Nada (síntesis) | Abierto | **Media:** elegir prueba |
| 07 | [Guía de significación · Statsig](paginas/07-significancia.md) · socio | Artículo completo y documentación de intervalos | Nada (síntesis) | Abierto | **Media-baja:** explicar resultados |
| 08 | [RCM · Data](paginas/08-rcm.md) · CSA | Carpeta pública, tutorial EO, EODMS y STAC hasta una escena ARD | Nada | **Pedir:** registro EODMS y licencia | **Baja** salvo región en Canadá |
| 09 | [GEO.ca](paginas/09-geo.md) · CSA | Portada, galería de 21 conjuntos y API STAC del Datacube | Nada | Abierto (OGL-Canadá) | **Alta** si la región es Canadá; baja si no |
| 10 | [SWOT](paginas/10-swot.md) · CSA | Página CSA, PO.DAAC, Hydrocron y tutorial. Después: Hydrocron probado con su ejemplo | Nada | Hydrocron abierto; Earthdata para los granulos | **Media:** global pero desde 2023 |
| 11 | [Ecosistemas](paginas/11-ecosistemas.md) · CSA | Página completa y BioSpace | Nada (no hay datos) | No aplica | **Baja:** contexto |
| 12 | [Tutorial SAR](paginas/12-sar.md) · CSA | README, carpetas y lectura de notebook, guía y licencia | Notebook, guía QGIS y licencia | Abierto | **Baja-media:** técnica geoespacial |
| — | Giovanni · NASA | **No se abrió** | Nada | Pendiente de decisión | Lo decide el equipo |

La relevancia es una estimación para el reto: seleccionar variable y región, construir una serie y medir su tendencia y significación. No es una evaluación de la calidad de cada fuente.

## Quién hizo cada parte

- **Codex (GPT), 14 de noviembre:**
  - Preparación inicial con los 7 archivos descargados.
  - Fichas 01 a 07 y 12.
  - Primera publicación en RAACK.
- **Claude (cuenta 2), 14 de noviembre:** relevo de las tareas que Codex no pudo terminar por quedarse sin uso:
  - Revisión en Chrome de las 4 páginas de la CSA y fichas 08 a 11.
  - Esta cobertura, la nota de [bases de datos que hay que pedir](../docs/SOLICITUDES_DE_DATOS.md) y el [grafo de contexto](../docs/CONTEXTO.md).
- **Claude (cuenta 1), 14 de noviembre por la tarde:**
  - Lectura de la página oficial completa y de las guías de evaluación y entrega: [Reglas oficiales](../docs/REGLAS_OFICIALES.md).
  - Pruebas de los servicios abiertos: visor de hidrología con Monterrey, catálogo de AppEEARS, datos de NOAA sin token y Hydrocron. Ampliaciones en las fichas 01, 02, 03 y 10.
  - [Ideas para la herramienta](../docs/IDEAS.md).

## Lo que no se hizo al revisar las páginas

Durante la revisión de las 12 páginas no se abrieron cuentas ni se inició sesión en portales de datos. No se aceptaron licencias, no se enviaron solicitudes de datos, no se completaron verificaciones humanas y no se ejecutó código descargado. Las fichas distinguen lo comprobado de lo que solo afirma cada fuente.

**Después de esa revisión**, el 14 de noviembre de 2026:

- Una persona del equipo creó la cuenta NASA Earthdata y se envió la [solicitud de prueba de AppEEARS](../docs/SOLICITUD_APPEEARS_MONTERREY.md).
- Por la tarde se probaron sin cuenta el visor de hidrología, el catálogo de AppEEARS, el servicio de datos de NOAA y Hydrocron ([Funcionalidades y tiempos](../docs/FUNCIONALIDADES.md)).

Siguen sin hacerse: aceptar licencias, la verificación humana de KNMI, el registro en EODMS y ejecutar el código descargado.
