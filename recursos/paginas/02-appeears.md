---
id: appeears
fecha_revision: 2026-11-14
estado: catálogo-y-documentación-revisados-sin-extracción
---
# AppEEARS · NASA

[Catálogo de recursos](../README.md) · [Fuente principal](https://appeears.earthdatacloud.nasa.gov/)

**Alcance real:** se revisaron portada, catálogo de productos, instrucciones de extracción por puntos y áreas y documentación de descarga de puntos. No se inició sesión ni se creó una solicitud de datos. No hay un resultado de AppEEARS descargado en RAACK.

## Información que ofrece

AppEEARS permite seleccionar productos geoespaciales y recortarlos por ubicación o área, intervalo temporal y bandas o capas. Entrega los valores y sus datos de calidad, con visualizaciones y estadísticas de apoyo. La aplicación reúne archivos de varios centros; que una capa esté en el catálogo no significa que ya se haya extraído ni que sirva automáticamente para una tendencia. [Portada](https://appeears.earthdatacloud.nasa.gov/), [catálogo](https://appeears.earthdatacloud.nasa.gov/products).

La [ayuda oficial](https://appeears.earthdatacloud.nasa.gov/help) especifica una cuenta **NASA Earthdata Login** para usar el servicio y su API. La documentación pública se pudo leer sin iniciar sesión.

## Productos y capas examinados

El catálogo ofrece grupos como Aqua y Terra MODIS, MODIS combinado, Landsat, Harmonized Landsat and Sentinel-2, ECOSTRESS, SMAP, DAYMET y VIIRS. Se examinó la tabla que se carga con **Aqua MODIS**, versión 061; no se inspeccionaron todas las capas de todos los grupos. [Available Products](https://appeears.earthdatacloud.nasa.gov/products).

Ejemplos visibles y pertinentes para explorar un caso de RAACK:

| Producto del catálogo | Capas observadas | Posible uso que debe decidirse |
|---|---|---|
| MYD11A1 / MYD11A2 | `LST_Day_1km`, `LST_Night_1km`, `QC_Day`, `QC_Night` | Temperatura superficial y control de calidad |
| MYD13A3 | NDVI y EVI mensuales de 1 km; fiabilidad del píxel y calidad de vegetación | Cambios en índices de vegetación |
| MYD10A1 | `NDSI_Snow_Cover` y capas de calidad | Cobertura de nieve |

Estas son capas de ejemplo del catálogo, **no una selección final ni archivos obtenidos**. Algunas filas de otros productos aparecen como no disponibles; cada capa debe comprobarse al preparar una extracción.

## Qué se aprendió del flujo de extracción

La ayuda de **Point Samples** explica puntos en el mapa, coordenadas introducidas manualmente o un CSV de latitud/longitud. Documenta un máximo de 1.000 coordenadas por solicitud, selección de fechas y capas y reutilización de parámetros desde un archivo JSON. La sección de descarga describe salidas CSV, un paquete ZIP, archivos de apoyo y un archivo de sumas SHA-256. [Ayuda, Point Samples](https://appeears.earthdatacloud.nasa.gov/help).

La ayuda de **Area Samples** admite un polígono dibujado, un GeoJSON o un shapefile comprimido con sus componentes. Documenta salidas **GeoTIFF** o **NetCDF-4**, selección de proyección y organización de archivos según producto y área. Esto podría servir para estudiar una región, pero exige definir después la agregación espacial y el tratamiento de calidad. [Ayuda, Area Samples](https://appeears.earthdatacloud.nasa.gov/help).

## Recorrido realizado y punto de parada

1. **Home:** se leyó el propósito del servicio y la diferencia entre muestras de puntos y áreas.
2. **Help → Getting Started:** se confirmó el requisito de Earthdata.
3. **Help → Point Samples → Performing Point Extractions:** se revisaron entradas, fechas, capas y envío de solicitudes como documentación.
4. **Products:** se examinó la tabla de Aqua MODIS 061 y los grupos disponibles.
5. **Help → Area Samples → Performing Area Extractions:** se revisaron regiones de interés, formatos y proyecciones.
6. **Help → Point Samples → Downloading Your Request:** se comprobó qué contendría un resultado terminado.

**Último punto:** instrucciones de descarga de muestras de puntos. Se llegó hasta documentación y catálogo, no hasta un resultado de extracción. No se pulsó el envío de una solicitud, no se introdujeron coordenadas del equipo ni se comprobó un inicio de sesión. La parada responde a la falta de una selección de producto, región y fechas para RAACK; el requisito de cuenta está documentado, no se infirió de un error de credenciales.

## Archivos y próximos pasos

**Archivos descargados de AppEEARS: ninguno, tanto en la preparación inicial como en esta ampliación.** Las capturas ilustrativas de la ayuda tampoco se guardaron como un paquete local.

- Elegir si el caso necesita puntos o áreas y qué capas se analizarán.
- Confirmar cobertura, resolución, unidades, factor de escala y reglas de calidad del producto elegido.
- Acceder con Earthdata y enviar una extracción concreta cuando estén definidos esos parámetros.
- Descargar el resultado, sus parámetros JSON, citas, archivos de apoyo y sumas de comprobación.
- Construir y comprobar la serie antes de estimar pendientes o significación.

