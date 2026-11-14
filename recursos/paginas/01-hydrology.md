---
id: hydrology
fecha_revision: 2026-11-14
estado: visor-probado-con-serie-larga-de-monterrey-sin-csv-guardado
---
# Hydrology Time Series · NASA GES DISC

[Catálogo de recursos](../README.md) · [Fuente principal](https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series)

**Alcance real:** se revisaron el visor, su sección About, la guía de uso y la ficha de GLDAS con sus variables. Hay una muestra CSV descargada en la preparación inicial. El 14 de noviembre de 2026 por la tarde se probó el visor con el punto de Monterrey y una serie de 26 años; el resultado está al final de esta ficha, en «Ampliación del 14 de noviembre de 2026 por la tarde». No se ha guardado esa serie ni se ha probado una API.

## Qué ofrece la página

El servicio reorganiza datos de ciencias de la Tierra para facilitar series temporales. El visor representa **una variable en un punto geográfico** y permite exportar datos CSV y gráficos. No produce por sí solo un mapa de tendencias regionales. La guía explica la selección de variable, coordenadas y fechas, los controles del gráfico y la transición a JupyterLite. [About y visor](https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series), [guía oficial](https://disc.gsfc.nasa.gov/information/documents?title=Hydrology%20Time%20Series%20User%20Guide).

La ubicación puede indicarse con latitud y longitud separadas por coma o con el mapa. El intervalo se ajusta mediante el control deslizante; cambiar variable, ubicación o fechas solicita un gráfico automáticamente. La guía describe una variable por gráfico y advierte que los valores de relleno no se dibujan. El servicio excluye las celdas sobre agua y devuelve error si el punto queda fuera del dominio. [Guía](https://disc.gsfc.nasa.gov/information/documents?title=Hydrology%20Time%20Series%20User%20Guide), [About](https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series).

## Producto y variables que sí se comprobaron

Se abrió la [ficha GLDAS_NOAH025_3H V2.1](https://disc.gsfc.nasa.gov/datasets/GLDAS_NOAH025_3H_2.1/summary), a la que redirige el enlace antiguo del visor.

| Característica observada | Valor |
|---|---|
| Producto | GLDAS Noah Land Surface Model L4 V2.1 |
| Resolución espacial | 0.25° × 0.25° |
| Frecuencia original | 3 horas |
| Formato del producto | NetCDF; la exportación del visor es CSV |
| Cobertura que mostraba la ficha al revisar | 2000-01-01 a 2026-07-31 |
| DOI | [10.5067/E7TYRXPJKWOQ](https://doi.org/10.5067/E7TYRXPJKWOQ) |

En la pestaña Variables se comprobaron, entre otras, `Evap_tavg` (evapotranspiración, kg m⁻² s⁻¹), `Rainf_tavg` (precipitación de lluvia, kg m⁻² s⁻¹), `Qs_acc` (escurrimiento superficial, kg m⁻²), `RootMoist_inst` (humedad de la zona radicular, kg m⁻²), `SnowDepth_inst` (profundidad de nieve, m) y `Tair_f_inst` (temperatura del aire, K). La ficha distingue GLDAS-2.1, de tipo *open-loop*, de productos GLDAS-2.2 que incorporan asimilación. No se deben mezclar productos o unidades por compartir la etiqueta GLDAS. [Ficha y tabla de variables](https://disc.gsfc.nasa.gov/datasets/GLDAS_NOAH025_3H_2.1/summary).

## Recorrido realizado y punto de parada

1. Se abrió el enlace del reto en una pestaña nueva de Chrome y se observó el gráfico predeterminado de evapotranspiración, punto 36.6100, −80.2400.
2. Se abrió **About** y se leyó qué exporta el visor y cómo trata el dominio terrestre.
3. Se siguió **user guide** y se revisaron las secciones sobre fechas, ubicación, variable, gráficos, descargas, Jupyter y problemas conocidos.
4. Se abrió el enlace del producto GLDAS y se revisaron **Product Summary** y **Variables**.

**Último punto de la primera revisión:** tabla de variables y unidades de GLDAS V2.1. No se solicitaron otros puntos ni un periodo nuevo en esa revisión, porque el equipo todavía debía elegir variable, región y periodo de demostración. La prueba posterior con Monterrey está más abajo. La guía advierte que el selector de variables puede fallar; esta advertencia documental no equivale a un fallo observado en la revisión actual.

## Archivos y límites de la muestra

Ya está en el repositorio el [CSV GLDAS de ejemplo](../archivos/gldas-evapotranspiracion-muestra-2016-05.csv), obtenido en la preparación inicial: 53 observaciones cada 3 horas, del 1 de mayo de 2016 a las 11:00 UTC al 7 de mayo a las 23:00 UTC, con columnas `x,y`. Las unidades se recuperan de los metadatos; no están escritas dentro del CSV. [Verificación y metadatos de la muestra](../../docs/REFERENCIA_CIENTIFICA.md).

**Descargas nuevas en esta ampliación: ninguna.** La muestra es útil para importar fechas y dibujar una serie; una semana y un punto no sustentan una tendencia climática ni un resultado regional.

## Relación con Giovanni y trabajo pendiente

About y la guía enlazan una vía programática titulada **Giovanni in the Cloud: Time Series Service**. Ese enlace **no se abrió ni se usó**. Por tanto, no se presenta esa API como una alternativa independiente ya aprobada: debe revisarse dentro de la [decisión pendiente de Giovanni](../../docs/decisiones/GIOVANNI.md).

- Elegir una variable y una región científicamente justificadas.
- Descargar una serie suficientemente larga y conservar versión, unidades y calidad.
- Definir si se usarán puntos, una agregación regional o un mapa; el visor revisado es puntual.
- Resolver la decisión de Giovanni antes de adoptar la API que la documentación enlaza.

## Ampliación del 14 de noviembre de 2026 por la tarde

Hecha por Claude en el navegador integrado, sin iniciar sesión y sin descargar archivos.

### Productos y variables que ofrece el visor

El buscador de variables lista **13 productos y 172 variables**. Periodo, resolución y cobertura salen de los metadatos oficiales de cada producto en GES DISC, consultados el mismo día.

| Producto | Variables | Periodo | Resolución | Cobertura |
|---|---|---|---|---|
| `GLDAS_NOAH025_3H_2.0` | 33 | 1948-01-01 a 2014-12-31 | 0,25°, 3 horas | Global, 60° S a 90° N |
| `GLDAS_NOAH025_3H_2.1` | 35 | 2000-01-01 a 2026-07-31 | 0,25°, 3 horas | Global, 60° S a 90° N |
| `GPM_3IMERGHH_07` · lluvia IMERG | 4 | 1998-01-01 a 2025-09-30 | 0,1°, 30 minutos | Global |
| `M2I1NXLFO_5.12.4` · MERRA-2 | 3 | 1980-01-01 a 2026-10-01 | 0,5° × 0,625°, 1 hora | Global |
| `M2T1NXFLX_5.12.4` · MERRA-2 | 8 | 1980-01-01 a 2026-10-01 | 0,5° × 0,625°, 1 hora | Global |
| `M2T1NXLFO_5.12.4` · MERRA-2 | 2 | 1980-01-01 a 2026-10-01 | 0,5° × 0,625°, 1 hora | Global |
| `M2T1NXSLV_5.12.4` · MERRA-2 | 9 | 1980-01-01 a 2026-10-01 | 0,5° × 0,625°, 1 hora | Global |
| `NLDAS_FORA0125_H_2.0` | 11 | 1979-01-01 a 2026-11-11 | 0,125°, 1 hora | 25° a 53° N, 125° a 67° O |
| `NLDAS_NOAH0125_H_2.0` | 38 | 1979-01-02 a 2026-11-10 | 0,125°, 1 hora | 25° a 53° N, 125° a 67° O |
| `NLDAS_MOS0125_H_2.0` | 12 | 1979-01-02 a 2026-11-10 | 0,125°, 1 hora | 25° a 53° N, 125° a 67° O |
| `NLDAS_VIC0125_H_2.0` | 12 | 1979-01-02 a 2026-11-10 | 0,125°, 1 hora | 25° a 53° N, 125° a 67° O |
| `GRACEDADM_CLSM0125US_7D_4.0` | 3 | 2002-04-01 a 2026-09-06 | 0,125°, 7 días | 25° a 53° N, 125° a 67° O |
| `SMERGE_RZSM0_40CM_2.0` | 2 | 1979-01-02 a 2019-05-10 | 0,125°, 1 día | 25° a 53° N, 125° a 67° O |

Variables fáciles de explicar a un estudiante:

- **GLDAS 2.1:** temperatura del aire, temperatura de la superficie, precipitación total, lluvia, nieve, evapotranspiración, humedad del suelo a cuatro profundidades y en la zona de raíces, escurrimiento, albedo, radiación y viento.
- **MERRA-2:** temperatura del aire sobre tierra, precipitación, viento, presión al nivel del mar, vapor de agua y ozono total en columna.
- **IMERG:** precipitación estimada por satélite con calibración de pluviómetros.
- **NLDAS Noah:** incluye caudal y cobertura de nieve.

Monterrey (25,67° N) queda dentro de la caja de NLDAS, GRACE y SMERGE por poco. No se probó si esos productos devuelven datos allí.

### Prueba con Monterrey

- **Punto:** se escribió `25.6708,-100.3092`; el visor lo redondeó a 25,67, −100,31.
- **Serie larga:** al llevar el periodo de 2000-01-01 a 2026-07-31, GLDAS 2.1 devolvió **77 659 datos** de evapotranspiración en menos de 20 segundos. La temperatura del aire y la humedad del suelo en la zona de raíces tardaron lo mismo. Las tres series dieron 319 meses completos de 319.
- **Aviso de cuota:** con peticiones grandes el visor muestra «This is a large request» y avisa de un límite mensual de datos.
- **Fallo con datos horarios:** la temperatura de MERRA-2 para los mismos 26 años, unos 230 000 datos, terminó con el error «Failed to fetch subset job link contents». No se reintentó con un periodo más corto.
- **Qué no hace el visor:** no se vio ninguna función de tendencia, de significación ni para quitar el ciclo estacional. Dibuja una variable por gráfico.
- **Cálculo de prueba:** las tendencias preliminares de las tres variables están en [Ideas](../../docs/IDEAS.md). Se calcularon en el navegador; no hay CSV guardado.

### Las horas del CSV están desplazadas

Las horas que entrega el visor **no son UTC reales**, aunque terminen en `Z`. Evidencia:

- GLDAS da valores a las 00, 03, 06… UTC. El visor mostró 02, 05, 08… en mayo de 2016.
- El primer dato de GLDAS 2.1 corresponde a las 03:00 UTC del 1 de enero de 2000. El visor lo etiqueta `2000-01-01T09:00:00.000Z`.
- El máximo diario de evapotranspiración aparecía al anochecer en vez de a mediodía.

Las tres cosas se explican si el visor lee cada hora como hora local del navegador. Aquí el huso es América/Monterrey: 6 horas de diferencia, o 5 con el horario de verano que hubo hasta 2022.

Consecuencias:

- La [muestra guardada](../archivos/gldas-evapotranspiracion-muestra-2016-05.csv) empieza en realidad a las 06:00 UTC del 1 de mayo de 2016, no a las 11:00.
- Con medias mensuales el efecto es despreciable.
- Para análisis por horas hay que restar el desfase, o exportar desde un navegador con el huso en UTC.

### GLDAS 2.0 o 2.1 para tendencias

El resumen oficial de ambos productos dice:

- **GLDAS 2.0** usa un único conjunto de datos de entrada, el de Princeton, y es temporalmente consistente de 1948 a 2014.
- **GLDAS 2.1** combina modelo y observaciones desde 2000. Solo usó GDAS y GPCP hasta febrero de 2001; desde el 1 de marzo de 2001 añade la radiación de AGRMET.

Por eso conviene empezar las tendencias de GLDAS 2.1 en marzo de 2001 o después, y usar GLDAS 2.0 para mirar más atrás. No se deben unir las dos series como si fueran una.

