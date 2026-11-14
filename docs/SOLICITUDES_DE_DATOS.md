---
tags: [raack, datos, accesos, pendiente]
fecha: 2026-11-14
estado: nada-solicitado-todavía
---
# Bases de datos que hay que pedir y por qué las usaríamos

[Cobertura de los 13 recursos](../recursos/COBERTURA.md) · [Pendientes](PENDIENTES.md) · [Grafo de contexto](CONTEXTO.md)

Algunos recursos del reto no se pueden usar sin pedir acceso: una cuenta, un token, una solicitud de extracción o una verificación humana. **Todavía no se ha pedido nada.** Debe hacerlo una persona del equipo con sus propias credenciales; los agentes no crean cuentas ni escriben contraseñas.

## Qué hay que pedir

| Recurso | Qué hay que pedir | Para qué la usaríamos en RAACK | Prioridad |
|---|---|---|---|
| [AppEEARS](../recursos/paginas/02-appeears.md) | Cuenta **NASA Earthdata Login** y una **solicitud de extracción** por puntos o por área | Serie principal de la demostración: una variable de satélite, como temperatura superficial MODIS o NDVI, en la región y periodo elegidos, con sus capas de calidad, para calcular pendiente y significación | Alta |
| [Climate Data Online](../recursos/paginas/03-cdo.md) | **Token** gratuito del API v2, que se pide con un correo. Los CSV mensuales GSOM por estación se descargan sin token | Series mensuales de estaciones, como `TAVG` y `PRCP`, para contrastar la tendencia del satélite con observaciones en tierra | Media |
| [KNMI Climate Explorer](../recursos/paginas/05-knmi.md) | Una persona debe completar la **verificación humana** del portal | Comparar nuestra tendencia con la que calcula una herramienta científica de referencia sobre la misma región y periodo | Media |
| [SWOT · PO.DAAC](../recursos/paginas/10-swot.md) | Cuenta **NASA Earthdata**, la misma de AppEEARS, para descargar granulos | Si la región tiene lagos o ríos grandes: elevación o área del agua desde 2023, como complemento por ser una serie corta | Media-baja |
| [RCM · EODMS](../recursos/paginas/08-rcm.md) | **Registro en EODMS** («Register (Required to Download)») y aceptar la licencia de usuario de cada producto | Solo si la región está en Canadá: series de radar cada 12 días (agua, humedales, cultivos) que no dependen de las nubes | Baja |
| Giovanni | Nada hasta que el equipo decida | [Pendiente de nuestra decisión](decisiones/GIOVANNI.md) | — |

**No hace falta pedir nada para:**

- Hydrology Time Series: el visor es abierto y su CSV se bajó sin cuenta.
- GEO.ca y su Datacube: licencia abierta de Canadá.
- Los dos artículos de estadística y el artículo SeaWiFS.
- El tutorial SAR: sus escenas de ejemplo están en una carpeta pública.

## Orden recomendado

1. Elegir variable, región y periodo ([Pendientes](PENDIENTES.md)). Sin eso, cualquier solicitud quedaría a medias.
2. Crear **una** cuenta NASA Earthdata. Sirve para AppEEARS y SWOT, y también para Giovanni si se aprueba.
3. Enviar la extracción de AppEEARS con producto, capas, región y fechas concretas. Guardar el JSON de parámetros y las sumas de comprobación que entrega.
4. Pedir el token de NOAA solo si se usará el API; si bastan unas pocas estaciones, descargar sus CSV GSOM.
5. Completar la verificación de KNMI cuando se vaya a hacer la comparación.
6. Registrarse en EODMS solo si la demostración se hace en Canadá y con radar.

## Texto para el campo «uso previsto»

Algunos formularios preguntan para qué se usarán los datos. Este texto está en inglés porque esos formularios lo están. Hay que sustituir lo que va entre `< >`:

> We are a student team taking part in the 2026 NASA Space Apps Challenge, "Be An Earth System Trend Detective!". We will use `<product>` to build a time series of `<variable>` over `<region>` for `<period>`, estimate the direction and rate of change, and test whether the change is statistically significant. The results will be shown in an educational web tool that cites the data source and follows its terms of use.
