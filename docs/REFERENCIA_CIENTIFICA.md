---
tags: [raack, ciencia, estadística, gldas]
fecha: 2026-11-14
---
# Referencia científica y muestra GLDAS

## Artículo NASA

**Acker, James G.; McMahon, Erin; Shen, Suhung; Hearty, Thomas; Casey, Nancy (2009).** *Time-Series Analysis of Remotely-Sensed SeaWiFS Chlorophyll in River-Influenced Coastal Regions*. [Ficha NASA NTRS](https://ntrs.nasa.gov/citations/20090042747). [PDF local](../recursos/archivos/nasa-seawifs-series-temporales-20090042747.pdf).

Estudia medias regionales de clorofila SeaWiFS y utiliza regresión lineal por mínimos cuadrados, ANOVA/prueba F, p < 0.05 y R². Examina anomalías mensuales y anuales y compara con regresión robusta frente a extremos. No presenta Mann–Kendall ni estimación de Sen.

La turbidez y la materia orgánica disuelta pueden confundirse con clorofila costera; crecidas y valores extremos afectan las pendientes. Encontrar una asociación no basta para atribuir una causa. El trabajo usa Giovanni como antecedente histórico: eso no determina la herramienta de RAACK; ver [Giovanni - decisión pendiente](decisiones/GIOVANNI.md).

## Muestra real de GLDAS

Archivo: [GLDAS_NOAH025_3H_2_1_Evap_tavg_36.6100_-80.2400_05_01_2016_to_05_07_2016.csv](../recursos/archivos/gldas-evapotranspiracion-muestra-2016-05.csv). Descargado desde [Hydrology Time Series](https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series), con los valores iniciales del visor.

| Campo | Valor |
|---|---|
| Producto mostrado | GLDAS_NOAH025_3H_2.1 |
| Variable | Evap_tavg · evapotranspiración |
| Punto del visor | Latitud 36.6100, longitud −80.2400 |
| Primera observación | 2016-05-01 11:00 UTC |
| Última observación | 2016-05-07 23:00 UTC |
| Frecuencia verificada | Cada 3 horas |
| Filas de datos | 53 |
| Columnas originales | x, y |
| Unidades | kg m⁻² s⁻¹, según metadatos oficiales de GLDAS; no están escritas dentro del CSV |
| Uso inmediato | Probar importación, fechas, selección de variable y gráficas |

[Descripción oficial de las variables y unidades GLDAS](https://ldas.gsfc.nasa.gov/gldas/model-output).

El archivo no contiene un mapa ni una serie larga. No permite concluir tendencias climáticas, diferencias regionales ni significación de un cambio a largo plazo. Conserva los valores originales, incluidos valores negativos; habrá que revisar la convención y calidad del producto al preparar el análisis definitivo.

## Documentación mensual NOAA

[GSOM_documentation.pdf](../recursos/archivos/noaa-gsom-documentacion.pdf) describe los campos de los resúmenes mensuales. [Directorio oficial con documentación y muestras](https://www.ncei.noaa.gov/data/global-summary-of-the-month/doc/). La documentación se guardó; las muestras de ese directorio quedaron pendientes por problemas de descarga en Chrome.
