---
tags: [raack, recursos, accesos, tiempos]
fecha: 2026-11-14
---
# Qué se puede hacer con cada recurso, qué hay que pedir y cuánto tarda

[Índice](../INDICE.md) · [Cobertura de los 13 recursos](../recursos/COBERTURA.md) · [Bases de datos que hay que pedir](SOLICITUDES_DE_DATOS.md) · [Validación de la propuesta](VALIDACION.md)

El hackathon dura **dos días**. Esta nota se escribió el 14 de noviembre de 2026 a mediodía del primero, así que lo que más importa es **cuánto tarda en llegar el dato**. Las fichas de cada recurso tienen el detalle.

## Dónde nos registramos y por qué no llegó al instante

- **Cuenta:** NASA Earthdata Login (`urs.earthdata.nasa.gov`). La misma cuenta sirve para AppEEARS, SWOT y, si se aprueba, Giovanni.
- **Qué se pidió:** una extracción en AppEEARS, descrita en [la solicitud de prueba en Monterrey](SOLICITUD_APPEEARS_MONTERREY.md).
- **Por qué no fue instantáneo:** AppEEARS no entrega al momento. Pone la solicitud en una cola, la procesa y avisa por correo al terminar.
  - Se envió a las **13:57**.
  - A las **14:13** iba al **28 %**.
  - Las solicitudes de área tardan más que las de puntos.

## Tabla rápida

| Recurso | Qué puedes hacer | Qué hay que pedir | Cuándo llega el dato | ¿Sirve en Monterrey? |
|---|---|---|---|---|
| [Hydrology Time Series](../recursos/paginas/01-hydrology.md) | Serie de una variable GLDAS (temperatura del aire, lluvia, evapotranspiración, humedad del suelo, nieve) en un punto y periodo; gráfico y CSV | Nada | **Al instante**: CSV desde el visor; así se bajó la muestra. Aún no se ha probado una serie de 25 años | **Sí**: GLDAS es global, 0,25°, de 2000 a 2026 |
| [AppEEARS](../recursos/paginas/02-appeears.md) | Extraer MODIS, VIIRS, Landsat o SMAP por puntos o áreas, con capas de calidad | Cuenta Earthdata (**ya creada**) y una solicitud | **En cola**: minutos u horas; avisa por correo | **Sí**: global |
| [Climate Data Online](../recursos/paginas/03-cdo.md) | Series mensuales de estaciones (GSOM): temperatura y lluvia | Nada para los CSV; token por correo para el API | **Al instante** los CSV de cada estación | **Débil**: estación Monterrey City (`MXM00076393`): temperatura media solo hasta 2008; lluvia en 108 de 300 meses de 2001–2025 |
| [KNMI Climate Explorer](../recursos/paginas/05-knmi.md) | Series, anomalías y tendencias con significación sobre estaciones, reanálisis y modelos, calculadas en el portal | Verificación humana (la hace una persona) | Al instante tras verificar, según su manual; no lo hemos probado | Sí con datos globales en malla, como reanálisis |
| [SWOT](../recursos/paginas/10-swot.md) | Elevación y área de ríos y lagos grandes; Hydrocron devuelve la serie de un tramo o lago | Cuenta Earthdata (**ya creada**) para los granulos | Granulos: descarga directa. Hydrocron: una llamada al API (no probada) | Solo con un río o embalse grande; no comprobado. Datos desde 2023 |
| [GEO.ca](../recursos/paginas/09-geo.md) | Series ya calculadas (agua superficial, evapotranspiración, nieve) en COG | Nada | **Al instante** | **No**: solo Canadá |
| [RCM](../recursos/paginas/08-rcm.md) | Imágenes radar; colección ARD cada 12 días | Registro en EODMS y licencia | Las muestras públicas se bajan al momento (unos 660 MB cada una); los pedidos por EODMS no se han probado | **No**: el acceso público es sobre Canadá |
| [Artículo SeaWiFS](../recursos/paginas/04-seawifs.md), [Medium](../recursos/paginas/06-metodos-estadisticos.md), [Statsig](../recursos/paginas/07-significancia.md) | Método: series regionales, pruebas de tendencia, cómo explicar la significación | Nada | Ya están leídos | No son datos |
| [Ecosistemas](../recursos/paginas/11-ecosistemas.md), [Tutorial SAR](../recursos/paginas/12-sar.md) | Contexto y práctica con ráster y vector | Nada | Al instante | No son datos de Monterrey |
| Giovanni | Según la página oficial, ofrece muchas variables, genera series temporales y permite descargarlas | Cuenta Earthdata | No se ha abierto | **Pendiente de vuestra decisión** ([Giovanni](decisiones/GIOVANNI.md)) |

## Ruta rápida para lo que queda de hackathon (propuesta)

1. **Ahora:** sacar de Hydrology Time Series una serie de Monterrey (GLDAS, 2001–2025), que llega al instante. Con ella se construye ya la herramienta: carga del CSV, gráfica, pendiente y prueba de significación.
2. **Cuando AppEEARS avise:** añadir el NDVI y la temperatura superficial de los 5 puntos y comparar cómo cambian en ciudad, sierra y periferia.
3. **Si se quiere un mapa de «dónde cambia»:** decidir hoy la región y enviar cuanto antes una solicitud de área en AppEEARS, porque tarda más.
4. **Antes de presentar nada**, pasar las cuatro reglas de [Validación de la propuesta](VALIDACION.md).
