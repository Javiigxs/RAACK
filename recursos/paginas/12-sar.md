---
id: sar
revision: 2026-11-14
estado: repositorio-y-materiales-inspeccionados-sin-ejecucion
---
# 12 · Synthetic Aperture Radar Tutorial · CSA

[Catálogo](../README.md) · [Repositorio oficial del tutorial](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial)

**Revisión:** 14 de noviembre de 2026. **Alcance alcanzado:** README en Chrome, carpetas Python y QGIS, más inspección estática completa del notebook, guía y licencia ya guardados. No se ejecutó Python ni se abrió QGIS.

## Información que ofrece

El tutorial de la Agencia Espacial Canadiense enseña a visualizar un raster SAR y un archivo vectorial mediante Python o QGIS. Su caso usa incendios de Columbia Británica y la misión RCM3. La raíz del repositorio separa **Option 1 - QGIS** y **Option 2 - Python**. El README anuncia Python 3.8 o posterior, Jupyter y bibliotecas geoespaciales; para QGIS la guía guardada se basa en la versión 3.24. [README y estructura](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial).

## Qué se comprobó dentro de los archivos

| Archivo existente en RAACK | Información comprobada |
|---|---|
| [Notebook Python](../archivos/csa-sar-bc-wildfire.ipynb) | Tiene 7 celdas. Abre un `.tif`, consulta bandas, transformación y proyección; lee la banda raster, abre un `.shp`, consulta su CRS y muestra una superposición. |
| [Guía QGIS](../archivos/csa-sar-tutorial-qgis.md) | Describe crear un proyecto, añadir datos vectoriales y raster, etiquetar y localizar el raster sobre un mapa; usa imágenes enlazadas remotamente. |
| [Licencia SAR](../archivos/csa-sar-LICENSE.txt) | Conserva el aviso de la CSA de 2022 y la condición de mantener el aviso de copyright y permiso en las copias pertinentes. |

**Límite importante del ejemplo:** en la parte Cartopy del notebook, los contornos usan un campo calculado con coseno y seno sobre coordenadas derivadas de los límites del raster. Esa parte es una demostración sintética de representación, no un mapa de los valores SAR leídos. Esta observación se obtuvo leyendo el código original, sin ejecutarlo. [Notebook original](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial/blob/main/Option%202%20-%20Python/BC%20Wildfire%20raster%20plot.ipynb).

## Utilidad posible para RAACK

Puede servir para aprender manejo de coordenadas, CRS, raster, vectores y representación espacial. El ejemplo no proporciona por sí mismo una colección temporal, una estimación de pendiente ni una prueba de significación. Para detectar cambios harían falta observaciones comparables en varias fechas y un análisis definido por el equipo.

## Recorrido comprobado de esta revisión

1. Se abrió el repositorio oficial en Chrome y se leyó el README.
2. Se entró a [Option 2 - Python](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial/tree/main/Option%202%20-%20Python) y se comprobó la presencia del notebook.
3. Se entró a [Option 1 - QGIS](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial/tree/main/Option%201%20-%20QGIS): se vieron la guía Markdown, el proyecto `.qgz` y la carpeta **Tutorial Images**.
4. Se leyeron estáticamente las 7 celdas del notebook local, la guía completa y la licencia. Los resultados e imágenes que ya contiene el notebook son del archivo original, no de una ejecución nuestra.
5. Se detuvo antes de instalar dependencias, ejecutar, abrir un proyecto QGIS o descargar las escenas y vectores de ejemplo.

## Descargas y requisitos

- **Ya descargados en la preparación anterior y publicados:** notebook, guía Markdown y licencia enlazados arriba.
- **Descargas nuevas en esta revisión:** ninguna.
- **No descargados:** escenas de [BC fires](https://donnees-data.asc-csa.gc.ca/users/OpenData_DonneesOuvertes/pub/BC%20fires/), vectores de Natural Earth, proyecto `.qgz` e imágenes del tutorial.
- El notebook conserva rutas de Windows de su autor y requiere datos externos. Sus imports incluyen GDAL, GeoPandas, rasterio, earthpy, Basemap, NumPy, Matplotlib y Cartopy; no se verificó un entorno compatible.
- La guía local depende de imágenes remotas y conserva un error de marcado HTML original. Los archivos originales se mantuvieron íntegros.
- El ZIP completo había sido bloqueado en Chrome durante la preparación anterior. No se reintentó en esta revisión; los tres archivos individuales ya están disponibles.

## Qué falta y por qué

Elegir si SAR aporta al caso de demostración; reunir y revisar datos de varias fechas si se adopta; adaptar rutas y entorno; reproducir únicamente las partes elegidas y separar claramente datos reales y ejemplos sintéticos. La tarea actual era documentar el alcance, no implementar ni validar el tutorial.

**Punto de parada exacto:** estructura de ambas opciones y lectura completa de los tres archivos locales. No se llegó a una ejecución ni a un análisis de tendencias.
