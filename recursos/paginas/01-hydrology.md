---
id: hydrology
fecha_revision: 2026-11-14
estado: documentación-revisada-y-muestra-disponible
---
# Hydrology Time Series · NASA GES DISC

[Catálogo de recursos](../README.md) · [Fuente principal](https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series)

**Alcance real:** se revisaron el visor, su sección About, la guía de uso y la ficha de GLDAS con sus variables. Hay una muestra CSV descargada en la preparación inicial. No se ha elegido la serie larga de RAACK ni se ha probado una API.

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

**Último punto:** tabla de variables y unidades de GLDAS V2.1. No se solicitaron otros puntos ni un periodo nuevo en esta ampliación, porque el equipo todavía debe elegir variable, región y periodo de demostración. La guía advierte que el selector de variables puede fallar; esta advertencia documental no equivale a un fallo observado en la revisión actual.

## Archivos y límites de la muestra

Ya está en el repositorio el [CSV GLDAS de ejemplo](../archivos/gldas-evapotranspiracion-muestra-2016-05.csv), obtenido en la preparación inicial: 53 observaciones cada 3 horas, del 1 de mayo de 2016 a las 11:00 UTC al 7 de mayo a las 23:00 UTC, con columnas `x,y`. Las unidades se recuperan de los metadatos; no están escritas dentro del CSV. [Verificación y metadatos de la muestra](../../docs/REFERENCIA_CIENTIFICA.md).

**Descargas nuevas en esta ampliación: ninguna.** La muestra es útil para importar fechas y dibujar una serie; una semana y un punto no sustentan una tendencia climática ni un resultado regional.

## Relación con Giovanni y trabajo pendiente

About y la guía enlazan una vía programática titulada **Giovanni in the Cloud: Time Series Service**. Ese enlace **no se abrió ni se usó**. Por tanto, no se presenta esa API como una alternativa independiente ya aprobada: debe revisarse dentro de la [decisión pendiente de Giovanni](../../docs/decisiones/GIOVANNI.md).

- Elegir una variable y una región científicamente justificadas.
- Descargar una serie suficientemente larga y conservar versión, unidades y calidad.
- Definir si se usarán puntos, una agregación regional o un mapa; el visor revisado es puntual.
- Resolver la decisión de Giovanni antes de adoptar la API que la documentación enlaza.

