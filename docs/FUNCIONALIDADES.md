---
tags: [raack, recursos, accesos, tiempos]
fecha: 2026-11-14
---
# Qué se puede hacer con cada recurso, qué hay que pedir y cuánto tarda

[Índice](../INDICE.md) · [Cobertura de los 13 recursos](../recursos/COBERTURA.md) · [Bases de datos que hay que pedir](SOLICITUDES_DE_DATOS.md) · [Validación de la propuesta](VALIDACION.md) · [Ideas](IDEAS.md)

El hackathon dura **dos días**. Esta nota se escribió el 14 de noviembre de 2026 a mediodía del primero y se amplió esa tarde con pruebas reales, así que lo que más importa es **cuánto tarda en llegar el dato**. Las fichas de cada recurso tienen el detalle.

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
| [Hydrology Time Series](../recursos/paginas/01-hydrology.md) | Serie de una variable en un punto y periodo, con gráfico y CSV. Ofrece **172 variables de 13 productos**: GLDAS 2.0 y 2.1, MERRA-2, NLDAS, lluvia IMERG y otros | Nada | **Al instante, probado:** Monterrey de 2000 a 2026 cada 3 horas (77 659 datos) en menos de 20 segundos. Una petición horaria de 26 años falló | **Sí, probado** con GLDAS 2.1 |
| [AppEEARS](../recursos/paginas/02-appeears.md) | Extraer por puntos o áreas **193 productos**: MODIS, VIIRS, SMAP, ECOSTRESS, HLS, Daymet y otros, con capas de calidad | Cuenta Earthdata (**ya creada**) y una solicitud | **En cola**: minutos u horas; avisa por correo | **Sí**: global, salvo los productos solo de EE. UU. |
| [Climate Data Online](../recursos/paginas/03-cdo.md) | Series mensuales de estaciones (GSOM): temperatura y lluvia | **Nada**: el servicio de datos de NCEI respondió sin token | **Al instante, probado** | **Solo hasta 2011–2012:** casi todas las estaciones cercanas terminan ahí. Monterrey City (`MXM00076393`) llega a 2026 con muchos huecos |
| [KNMI Climate Explorer](../recursos/paginas/05-knmi.md) | Series, anomalías y tendencias con significación sobre estaciones, reanálisis y modelos, calculadas en el portal | Verificación humana (la hace una persona) | Al instante tras verificar, según su manual; no lo hemos probado | Sí con datos globales en malla, como reanálisis |
| [SWOT](../recursos/paginas/10-swot.md) | Elevación y área de ríos y lagos grandes; Hydrocron devuelve la serie de un tramo o lago | **Nada para Hydrocron.** Cuenta Earthdata (**ya creada**) para los granulos | **Hydrocron al instante, probado** con el ejemplo de su documentación | Falta el identificador de un río o embalse de la zona; no comprobado. Datos desde 2023 |
| [GEO.ca](../recursos/paginas/09-geo.md) | Series ya calculadas (agua superficial, evapotranspiración, nieve) en COG | Nada | **Al instante** | **No**: solo Canadá |
| [RCM](../recursos/paginas/08-rcm.md) | Imágenes radar; colección ARD cada 12 días | Registro en EODMS y licencia | Las muestras públicas se bajan al momento (unos 660 MB cada una); los pedidos por EODMS no se han probado | **No**: el acceso público es sobre Canadá |
| [Artículo SeaWiFS](../recursos/paginas/04-seawifs.md), [Medium](../recursos/paginas/06-metodos-estadisticos.md), [Statsig](../recursos/paginas/07-significancia.md) | Método: series regionales, pruebas de tendencia, cómo explicar la significación | Nada | Ya están leídos | No son datos |
| [Ecosistemas](../recursos/paginas/11-ecosistemas.md), [Tutorial SAR](../recursos/paginas/12-sar.md) | Contexto y práctica con ráster y vector | Nada | Al instante | No son datos de Monterrey |
| Giovanni | Según la página oficial, ofrece muchas variables, genera series temporales y permite descargarlas | Cuenta Earthdata | No se ha abierto | **Pendiente de vuestra decisión** ([Giovanni](decisiones/GIOVANNI.md)) |

## Qué más se puede hacer o pedir · comprobado el 14 de noviembre de 2026 por la tarde

### Hydrology Time Series

- **Más productos que GLDAS 2.1.** El buscador de variables lista 13 productos. Los globales: GLDAS 2.0 (1948–2014), GLDAS 2.1 (2000–julio de 2026), MERRA-2 (1980–2026, horario) y lluvia IMERG (1998–septiembre de 2025). NLDAS (1979–2026) cubre de 25° a 53° N; Monterrey queda dentro de esa caja, sin probar. La tabla completa está en la [ficha 01](../recursos/paginas/01-hydrology.md).
- **Series largas al instante.** 26 años de GLDAS cada 3 horas llegan en menos de 20 segundos.
- **Límite.** Con peticiones grandes avisa de una cuota mensual. Una petición horaria de MERRA-2 de 26 años, unos 230 000 datos, falló. Conviene pedir los productos horarios por tramos.
- **Para tendencias largas, GLDAS 2.0.** Su ficha oficial dice que es temporalmente consistente de 1948 a 2014. GLDAS 2.1 cambió sus datos de entrada en marzo de 2001: mejor empezar las tendencias después.
- **Cuidado con las horas del CSV.** El visor las desplaza según el huso horario del navegador. Con medias mensuales no importa. Detalle en la [ficha 01](../recursos/paginas/01-hydrology.md).

### AppEEARS

- **Catálogo sin cuenta.** `https://appeears.earthdatacloud.nasa.gov/api/product` devuelve los 193 productos con resolución, frecuencia y periodo.
- **Capas, unidades y escala sin cuenta.** `…/api/product/MOD13A3.061` da cada capa con unidades, factor de escala y valor de relleno.
- **Significado de la calidad sin cuenta.** `…/api/quality/MOD11A2.061/QC_Day/65` explica un valor de calidad bit a bit.
- **Productos útiles fuera de EE. UU.**, además de los ya pedidos: cobertura del suelo anual (MCD12Q1, desde 2001), área quemada mensual (MCD64A1), evapotranspiración (MOD16A2GF), productividad (MOD17A2HGF), meteorología diaria de 1 km para Norteamérica (DAYMET), humedad del suelo SMAP (desde 2015) y vegetación a 30 m (HLS, desde 2013). Lista en la [ficha 02](../recursos/paginas/02-appeears.md).
- **Enviar solicitudes** sigue pidiendo la sesión de Earthdata, que inicia una persona.

### Climate Data Online · NOAA

- **Datos sin token.** `https://www.ncei.noaa.gov/access/services/data/v1?dataset=global-summary-of-the-month&stations=MXM00076393&startDate=1990-01-01&endDate=2025-12-31&dataTypes=TAVG,TMAX,TMIN,PRCP&format=csv&units=metric` devolvió el CSV en medio segundo.
- **Buscador de estaciones sin token.** El servicio de búsqueda de NCEI devolvió 50 estaciones mensuales alrededor de Monterrey. Detalle en la [ficha 03](../recursos/paginas/03-cdo.md).
- **Uso realista:** testigo en tierra hasta 2011 o 2012, no de los últimos años. Varias estaciones empiezan en la década de 1940.

### SWOT · Hydrocron

- **Sin cuenta y al instante.** La llamada de ejemplo de su documentación devolvió 25 observaciones de un tramo de río en 0,7 segundos, con unidades y bandera de calidad.
- **Qué hace falta:** el identificador del tramo (`reach_id`) o del lago (`lake_id`). Detalle en la [ficha 10](../recursos/paginas/10-swot.md).

### Página oficial

- La pestaña *Details* sugiere mirar herramientas externas como las de CUAHSI. No están en la lista de 13 recursos; usarlas pide justificarlo por escrito ([Validación](VALIDACION.md), regla 3).

## Qué no hacen las herramientas oficiales

Evidencia para la regla 1 de [Validación](VALIDACION.md), anotada al usar el visor y AppEEARS el 14 de noviembre de 2026:

- **Hydrology Time Series:** dibuja una variable por gráfico. No se vio ninguna función de tendencia, de significación ni para quitar el ciclo estacional. Comparar tres variables costó tres búsquedas y un cálculo aparte. Los nombres son técnicos, como «Sensible heat net flux».
- **AppEEARS:** entrega los datos y su calidad, pero en cola: la prueba de 5 puntos iba al 28 % a los 16 minutos.
- **KNMI Climate Explorer:** calcula tendencias, pero pide verificación humana y está pensado para quien ya sabe qué pedir.

## Ruta rápida para lo que queda de hackathon (propuesta)

1. **Ahora:** guardar en el repo el CSV de Monterrey del visor (GLDAS 2.1, 2000–2026), que llega al instante y ya está probado. Con él se construye la herramienta: carga del CSV, gráfica, pendiente y prueba de significación.
2. **Cuando AppEEARS avise:** añadir el NDVI y la temperatura superficial de los 5 puntos y comparar cómo cambian en ciudad, sierra y periferia.
3. **Si se quiere un mapa de «dónde cambia»:** decidir hoy la región y enviar cuanto antes una solicitud de área en AppEEARS, porque tarda más.
4. **Antes de presentar nada**, pasar las cuatro reglas de [Validación de la propuesta](VALIDACION.md) y la lista de [Reglas oficiales](REGLAS_OFICIALES.md).
