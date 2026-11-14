---
id: appeears
fecha_revision: 2026-11-14
estado: catálogo-y-api-pública-revisados-solicitud-de-prueba-en-cola
---
# AppEEARS · NASA

[Catálogo de recursos](../README.md) · [Fuente principal](https://appeears.earthdatacloud.nasa.gov/)

**Alcance real:** se revisaron portada, catálogo de productos, instrucciones de extracción por puntos y áreas y documentación de descarga de puntos. En esa primera revisión no se inició sesión ni se creó una solicitud.

**Actualización del 14 de noviembre de 2026:** después de la revisión, el equipo creó su cuenta Earthdata y se envió una [solicitud de prueba en Monterrey](../../docs/SOLICITUD_APPEEARS_MONTERREY.md), que estaba en cola a las 14:13. Por la tarde se consultó el API público del catálogo; ver «Ampliación» al final. Todavía no hay un resultado de AppEEARS descargado en RAACK.

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

**Último punto de la primera revisión:** instrucciones de descarga de muestras de puntos. Se llegó hasta documentación y catálogo, no hasta un resultado de extracción. En esa revisión no se pulsó el envío de una solicitud, no se introdujeron coordenadas del equipo ni se comprobó un inicio de sesión. La parada responde a la falta de una selección de producto, región y fechas para RAACK; el requisito de cuenta está documentado, no se infirió de un error de credenciales.

## Archivos y próximos pasos

**Archivos descargados de AppEEARS: ninguno hasta el 14 de noviembre de 2026 por la tarde.** Las capturas ilustrativas de la ayuda tampoco se guardaron como un paquete local.

- Elegir si el caso necesita puntos o áreas y qué capas se analizarán.
- Confirmar cobertura, resolución, unidades, factor de escala y reglas de calidad del producto elegido.
- Enviar la extracción definitiva cuando el equipo elija la región. La de prueba ya está enviada.
- Descargar el resultado, sus parámetros JSON, citas, archivos de apoyo y sumas de comprobación.
- Construir y comprobar la serie antes de estimar pendientes o significación.

## Ampliación del 14 de noviembre de 2026 por la tarde

Hecha por Claude con el API público de AppEEARS, sin iniciar sesión. Enviar o descargar solicitudes sigue pidiendo la sesión de Earthdata.

### Tres consultas que funcionan sin cuenta

| Consulta | Qué devuelve |
|---|---|
| `https://appeears.earthdatacloud.nasa.gov/api/product` | Los **193 productos** del catálogo, con resolución, frecuencia, periodo y DOI |
| `https://appeears.earthdatacloud.nasa.gov/api/product/MOD13A3.061` | Las capas de un producto, con unidades, factor de escala, valor de relleno y rango válido |
| `https://appeears.earthdatacloud.nasa.gov/api/quality/MOD11A2.061/QC_Day/65` | La explicación, bit a bit, de un valor de una capa de calidad |

### Capas de la solicitud de prueba

| Capa | Unidades | Escala | Relleno | Rango válido |
|---|---|---|---|---|
| `MOD13A3.061` · `_1_km_monthly_NDVI` | Sin unidades | 0,0001 | −3000 | −0,2 a 1 |
| `MOD13A3.061` · `_1_km_monthly_pixel_reliability` | Categoría | — | −1 | 0 a 3 |
| `MOD11A2.061` · `LST_Day_1km` y `LST_Night_1km` | Kelvin | 0,02 | 0 | 150 a 1310,7 |
| `MOD11A2.061` · `QC_Day` y `QC_Night` | Campo de bits | — | 0 | 0 a 255 |

- `pixel_reliability`: 0 es dato bueno, 1 marginal, 2 nieve o hielo y 3 nublado. El API solo marca como aceptable el 0.
- Ejemplo de `QC_Day` = 65: temperatura producida con «otra calidad», error medio de emisividad de 0,01 o menos y error medio de temperatura de 2 K o menos.
- **Por comprobar al recibir los CSV:** si los valores ya vienen multiplicados por la escala.

### Productos del catálogo por tema

Solo los de cobertura global o de Norteamérica. Fechas de inicio según el catálogo.

| Tema | Producto | Resolución y frecuencia | Desde |
|---|---|---|---|
| Temperatura superficial | `MOD11A2.061` Terra · `MYD11A2.061` Aqua | 1 km, 8 días | 2000 · 2002 |
| Temperatura superficial, otro algoritmo | `MOD21A2.061` | 1 km, 8 días | 2000 |
| Vegetación (NDVI y EVI) | `MOD13A3.061` · `MOD13Q1.061` | 1 km mensual · 250 m cada 16 días | 2000 |
| Vegetación a 30 m | `HLSL30_VI.020` · `HLSS30_VI.020` | 30 m | 2013 · 2015 |
| Cobertura del suelo | `MCD12Q1.061` | 500 m, anual | 2001 |
| Cobertura arbórea | `MOD44B.061` | 250 m, anual | 2000 |
| Área quemada | `MCD64A1.061` | 500 m, mensual | noviembre de 2000 |
| Evapotranspiración | `MOD16A2GF.061` | 500 m, 8 días | 2000 |
| Productividad vegetal | `MOD17A2HGF.061` · `MOD17A3HGF.061` | 500 m, 8 días · anual | 2000 · 2001 |
| Hojas (LAI y FPAR) | `MCD15A2H.061` | 500 m, 8 días | 2002 |
| Albedo | `MCD43A3.061` | 500 m, diario | 2000 |
| Nieve | `MOD10A1.061` · `MOD10A2.061` | 500 m, diario · 8 días | 2000 |
| Humedad del suelo | `SPL3SMP_E.006` · `SPL4SMGP.008` | 9 km, diario | marzo de 2015 |
| Meteorología diaria de Norteamérica | `DAYMET.004` | 1 km, diario | El catálogo declara 1950 a 2025 |
| Temperatura superficial fina | `ECO_L2T_LSTE.002` | 70 m, pasadas irregulares | julio de 2018 |
| VIIRS, continuación de MODIS | `VNP13A3.002`, `VNP21A2.002` y otros | 500 m a 1 km | 2012 |
| Elevación | `SRTMGL1_NC.003` · `NASADEM_NC.001` | 30 m, fija | — |

- Los diez productos «Landsat ARD» y los dos «NPS Water Balance» parecen ser solo de EE. UU. por su nombre. No se comprobó.
- El catálogo no incluye luces nocturnas.
- La cobertura real de DAYMET en México y su primer año continental no se comprobaron.
