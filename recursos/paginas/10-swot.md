---
id: swot
revision: 2026-11-14
estado: pagina-csa-podaac-y-tutorial-revisados-sin-descargas
---
# 10 · SWOT Mission · Information · CSA

[Catálogo](../README.md) · [Cobertura de las 13 páginas](../COBERTURA.md) · [Fuente principal](https://www.asc-csa.gc.ca/eng/satellites/swot/)

**Revisión:** 14 de noviembre de 2026 en Chrome. **Alcance alcanzado:** página completa de la CSA, registro SWOT del portal de datos abiertos de la CSA, página de datos de PO.DAAC, portada de la documentación de Hydrocron y README del tutorial SWOT de la CSA. No se descargaron datos ni se consultó ningún API.

## Información que ofrece

SWOT (*Surface Water and Ocean Topography*) es una misión de la NASA y del CNES francés, con participación de la CSA y de la Agencia Espacial del Reino Unido. **Es global:** mide cambios en la elevación del agua de lagos, ríos, embalses y océanos y cubre alrededor del 90 % del agua superficial de la Tierra. La página de la CSA indica lanzamiento el 16 de diciembre de 2022, misión activa y duración prevista de 3 años con posible extensión. Fecha de modificación de la página: 22 de octubre de 2024. [Página CSA](https://www.asc-csa.gc.ca/eng/satellites/swot/).

La aportación canadiense son los klistrones EIK que amplifican la señal del radar de amplio barrido, fabricados por Communications & Power Industries Canada. En hidrología, la CSA enumera tres objetivos: medir altura y pendiente de cuerpos de agua dulce, calcular cuánta agua ganan o pierden lagos, embalses y humedales, y evaluar variaciones de caudal en ríos y estuarios. Según la página, SWOT observa la mayoría de lagos y ríos de Canadá hasta cuatro veces cada tres semanas.

**Esta página no enlaza datos.** El acceso aparece en el registro SWOT del [portal de datos abiertos de la CSA](https://donnees-data.asc-csa.gc.ca/en/dataset/swot), que lleva a PO.DAAC y al tutorial de la CSA.

## Datos en PO.DAAC

La [página SWOT de PO.DAAC](https://podaac.jpl.nasa.gov/SWOT) describe los productos. Los de aguas continentales son los más útiles para RAACK:

| Producto | Contenido | Formato |
|---|---|---|
| `L2_HR_RiverSP` | Tramos de ~10 km y nodos cada ~200 m: elevación del agua, pendiente, anchura, caudal derivado | Shapefile |
| `L2_HR_LakeSP` | Lagos: elevación, área, cambio de almacenamiento | Shapefile |
| `L2_HR_Raster` | Elevación, área y fracción de agua en teselas UTM de 100 m o 250 m | netCDF |
| `L2_HR_PIXC` | Nube de puntos con alturas y banderas de calidad | netCDF |
| `L2_LR_SSH` | Altura del mar en malla de 2 km | netCDF |

Datos útiles para planificar: SWOT observa ríos de más de 100 m de anchura y lagos de al menos 250 m × 250 m. El ciclo de repetición dura unos 21 días (20,86). Los datos de alta resolución solo existen dentro de su máscara HR. Hay dos versiones de productos: la C, distribuida en colecciones «Version 2.0», y la D.

**Hydrocron.** La [documentación de Hydrocron](https://podaac.github.io/hydrocron/) lo presenta como un API que reorganiza `RiverSP` y `LakeSP` (versión D por defecto, también 2.0) y los caudales L4 *SWORD of Science* en **series temporales con una sola llamada** por tramo o lago. Evita abrir miles de shapefiles fechados. No se comprobó si exige autenticación.

## Tutorial SWOT de la CSA

El [tutorial](https://github.com/asc-csa/SWOT-post-processing-tutorial) incluye `SWOT_filtre.ipynb`. Filtra rásteres `L2_HR_Raster` de 100 m (versión C), conserva los píxeles de buena calidad y convierte netCDF a TIFF. Sus ejemplos son dos escenas UTM 22J del 15 de abril y del 6 de mayo de 2024. Requiere `xarray`, `rioxarray` y GDAL, recomienda Google Colab y exige una **cuenta NASA Earthdata** para descargar. El README pide clonar un repositorio llamado `SWOT-Data-Filter`, que no coincide con el nombre del publicado. Licencia MIT modificada; último commit visible del 22 de agosto de 2025. No se ejecutó.

## Utilidad posible para RAACK

Es el recurso de la sección CSA que sirve **en cualquier región** con ríos o lagos grandes. Permite estudiar elevación del agua, área, almacenamiento o caudal. Su límite es la **duración**: con datos científicos desde 2023, la serie es corta y con fuerte estacionalidad. Sirve para mostrar variaciones estacionales o cambios recientes. Para afirmar una tendencia significativa de largo plazo habría que complementarlo con otras fuentes. Hydrocron facilita construir la serie de un tramo o un lago.

## Recorrido comprobado de esta revisión

1. Página SWOT de la CSA: texto completo, tablas de objetivos y lista de enlaces.
2. Registro SWOT del portal de datos abiertos de la CSA, mediante su API: recursos «Data» (PO.DAAC) y «Tutorial» (GitHub).
3. Página SWOT de PO.DAAC: productos, colecciones, versiones, cobertura y características orbitales.
4. Portada de la documentación de Hydrocron.
5. README y lista de archivos del tutorial de la CSA.

## Material guardado y límites

- **Descargas:** ninguna.
- **No realizado:** inicio de sesión en Earthdata, búsqueda o descarga de granulos, consultas a Hydrocron, visor de cobertura de SWOT, ejecución del notebook.
- La [página de ecosistemas](11-ecosistemas.md) de la CSA todavía describe SWOT como «en desarrollo». La página específica de la misión es la fuente más reciente.

## Qué falta y por qué

1. Elegir región y comprobar si tiene ríos o lagos dentro de la máscara HR.
2. Si se adopta, una persona del equipo debe tener cuenta NASA Earthdata; ver [Solicitudes de datos](../../docs/SOLICITUDES_DE_DATOS.md).
3. Probar Hydrocron con un tramo o lago y revisar banderas de calidad, versión y unidades.
4. Decidir cómo presentar una serie corta sin sobreinterpretar su significación.

**Punto de parada exacto:** portada de la documentación de Hydrocron y README del tutorial de la CSA. No hubo bloqueo: falta elegir región y masa de agua.
