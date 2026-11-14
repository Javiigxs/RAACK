---
id: cdo
fecha_revision: 2026-11-14
estado: catálogo-y-api-documentados-sin-consulta-de-datos
---
# Climate Data Online · NOAA NCEI

[Catálogo de recursos](../README.md) · [Fuente principal](https://www.ncei.noaa.gov/cdo-web/)

**Alcance real:** se revisaron el catálogo, la entrada GSOM, sus enlaces de documentación y muestras y las instrucciones de la API v2, incluidas las consultas de datos. Se leyó además el PDF GSOM que ya estaba descargado. No se solicitó un token ni se ejecutó una consulta autenticada.

## Qué información ofrece

CDO da acceso a observaciones climáticas e históricas por estación y ubicación: temperatura, precipitación, viento y otros elementos, con productos diarios, mensuales, anuales y normales climáticas. La portada ofrece búsqueda, mapas, herramientas y documentación. [Portada](https://www.ncei.noaa.gov/cdo-web/), [Datasets](https://www.ncei.noaa.gov/cdo-web/datasets).

Se amplió la entrada **Global Summary of the Month (GSOM)**. NOAA la describe como resúmenes mensuales derivados de GHCN-Daily y enlaza búsqueda, mapa mensual, archivo de datos, documentación y muestras. La cobertura global publicada no garantiza una serie completa desde 1763 para cada estación: se debe comprobar la cobertura de la estación elegida. [Catálogo GSOM](https://www.ncei.noaa.gov/cdo-web/datasets), [archivo GSOM](https://www.ncei.noaa.gov/data/global-summary-of-the-month/).

## Documentación y campos útiles

El [PDF GSOM guardado](../archivos/noaa-gsom-documentacion.pdf), versión documental 1.0.3 de mayo de 2023, describe archivos CSV por estación, identificador `STATION` y fecha `DATE` en formato año-mes. Incluye definiciones de variables y atributos de medición, calidad, fuente y días faltantes.

| Campo comprobado en el PDF | Significado |
|---|---|
| `TAVG` | Temperatura media mensual |
| `TMAX` / `TMIN` | Promedio mensual de las máximas o mínimas diarias |
| `PRCP` | Precipitación mensual acumulada |
| `AWND` | Velocidad media mensual del viento |
| Sufijos `_ATTRIBUTES` | Atributos de calidad, origen o datos faltantes según la variable |

Las unidades dependen de las opciones de entrega; no se deben suponer por el nombre del campo. GSOM tampoco es sinónimo de GHCN-Monthly: el PDF distingue ambos productos. [Documento oficial GSOM](https://www.ncei.noaa.gov/data/global-summary-of-the-month/doc/GSOM_documentation.pdf).

## Qué se verificó de la API

La [documentación v2](https://www.ncei.noaa.gov/cdo-web/webservices/v2) indica token obligatorio, respuestas JSON y paginación. Publica límites de cinco solicitudes por segundo y 10.000 por día. La sección **Data** describe `datasetid`, `datatypeid`, `stationid`, `locationid`, `startdate`, `enddate` y `units`. Documenta intervalos máximos de diez años por consulta para datos mensuales o anuales, y de un año para los demás. Estos límites implican dividir y paginar una serie larga; no se ha implementado ni probado ese flujo.

## Recorrido realizado y punto de parada

1. Se abrió **CDO Home** en una pestaña nueva de Chrome.
2. En **Datasets** se amplió **Global Summary of the Month**.
3. Se desplegó **Documentation & Samples** y se comprobaron los enlaces que ofrece el catálogo.
4. Se siguió **Climate Data Online Web Services**, que llevó a la documentación **v2**.
5. Se leyeron **Getting Started** y **Data**, con los parámetros y límites anteriores.
6. Fuera del navegador, se extrajo y revisó el texto del PDF GSOM ya guardado, sin modificarlo.

**Último punto:** documentación de la consulta `/data`. Los ejemplos de JSON son ejemplos de la documentación, no respuestas obtenidas en esta sesión. No se abrió un mapa ni se escogieron estaciones, no se solicitó un token y no se realizó un pedido de datos: faltan variable, estación o región y periodo del caso de RAACK.

## Descargas existentes y lo que no se consiguió

Está guardado [noaa-gsom-documentacion.pdf](../archivos/noaa-gsom-documentacion.pdf). En la preparación inicial se llegó también al [directorio de documentación y muestras](https://www.ncei.noaa.gov/data/global-summary-of-the-month/doc/): la muestra CSV fue bloqueada por Chrome y la muestra PDF no terminó de descargarse. Esos resultados previos constan en el catálogo general; **no se reintentaron ni se guardaron nuevas muestras en esta ampliación**. [Registro de descargas](../archivos/descargas.json).

## Utilidad para RAACK y pendientes

GSOM es una opción para una demostración basada en estaciones y series mensuales de temperatura o precipitación. Todavía no es una fuente seleccionada por el equipo.

- Elegir estaciones con cobertura suficiente y comprobar cambios de estación y datos faltantes.
- Decidir entre descarga de archivos públicos y consultas API; el token solo se requiere para la vía API documentada.
- Preservar unidades y atributos de calidad al convertir los datos para la herramienta.
- Conseguir una serie real larga; la documentación descargada no reemplaza esa serie.
- Definir cómo representar una región a partir de estaciones antes de producir un mapa de tendencias.

