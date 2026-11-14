---
id: geo
revision: 2026-11-14
estado: portal-galeria-y-api-stac-revisados-sin-descargas
---
# 09 · GEO.ca

[Catálogo](../README.md) · [Cobertura de las 13 páginas](../COBERTURA.md) · [Fuente principal](http://geo.ca/)

**Revisión:** 14 de noviembre de 2026 en Chrome. **Alcance alcanzado:** portada, iniciativa *Understanding Canada's land from space*, dos fichas de datos con series temporales y el API STAC del Datacube del CCMEO, hasta los metadatos de colecciones e ítems. No se descargaron datos ni se usó el buscador por palabras.

## Información que ofrece

GEO.ca es el portal de Recursos Naturales de Canadá (NRCan) para la información geoespacial abierta del país, dentro de la infraestructura canadiense de datos geoespaciales (CGDI). `http://geo.ca/` lleva a un selector de idioma y después a [la portada](https://geo.ca/home/). El 14 de noviembre la portada mostraba **103.425 conjuntos de datos y 42 contribuyentes**. Por temas: Imagery 95.973, Science 3.793, Environment 2.600, Economy 1.021, Society 516, Administration 384, Infrastructure 216, Legal 110 y Foundation Data 41.

La página oficial del reto lo resume así: *«Some of this data might be helpful for monitoring environmental issues in Canada.»* **Casi todo su contenido cubre solo Canadá.**

## Series temporales encontradas

La iniciativa [Understanding Canada's land from space](https://geo.ca/initiatives/understanding-canadas-land-from-space/) reúne mapas y una galería de 21 conjuntos derivados de satélite. Los que tienen dimensión temporal son los más cercanos al reto:

| Conjunto | Periodo o frecuencia que indica GEO.ca |
|---|---|
| Dynamic Surface Water Maps (Landsat, 30 m) | Máscaras anuales 1984–2023 |
| Water Inundation Frequency Maps | 1984–2023 |
| Surface Water Frequency Maps | Frecuencia 1991–2020 |
| Minimum snow and ice extent (MSI) | Anual desde 2000 |
| Land surface evapotranspiration (5 km) | Mensual y anual |
| MODIS Surface Albedo (250 m) | Compuestos de 10 días desde febrero de 2000 |
| Land Cover of Canada | Cambios entre 2010, 2015 y 2020 |
| Snow dynamics (30 m) | Años de nieve 2018-2019 a 2023-2024 |
| Active deformation (Sentinel-1) | Tasa de deformación 2017–2024, en m/año |
| RCM CEOS ARD (30 m) | Cobertura de Canadá cada 12 días |

La galería incluye además índices de vegetación mensuales a 20 m (LAI, FCOVER, FAPAR), NDVI diario de VIIRS, inventarios de humedales, el mosaico nacional RCM y Sentinel-1.

### Dos fichas abiertas

- **[MSI · Annual Minimum Snow and Ice Extent Time Series](https://app.geo.ca/en-ca/map-browser/record/93d94cac-05d2-4ea0-82e1-3ff8500ebf93):** datos anuales del CCRS sobre la presencia continua de nieve o hielo entre el 1 de abril y el 20 de septiembre. Cobertura temporal declarada de abril de 2000 a agosto de 2023. Ofrece aplicación web, **WMS, WCS**, ZIP de vectores 2000–2019 y API STAC. Licencia Open Government Licence – Canada.
- **[Dynamic Surface Water · máscaras anuales](https://app.geo.ca/en-ca/map-browser/record/ccmeo-dynamic-surface-water-annual):** dónde y con qué frecuencia hubo agua en cada píxel de 30 m de Canadá, 1984–2023, a partir del archivo Landsat. Se distribuye como colección STAC del Datacube. Licencia Open Government Licence – Canada.

## API STAC del Datacube

El [API STAC del Datacube del CCMEO](https://datacube.services.geo.ca/pgstac/api/) publicaba **52 colecciones**. Se revisaron las extensiones temporales y licencias de algunas:

| Colección | Extensión temporal declarada | Licencia |
|---|---|---|
| `dynamic-surface-water-annual` | 1984-07-01 → 2023-07-01 | OGL-Canada-2.0 |
| `et-month` · evapotranspiración mensual | 2000-01-01 → 2023-12-01 | OGL-Canada-2.0 |
| `et-year` · evapotranspiración anual | 2000-06-01 → 2023-06-01 | OGL-Canada-2.0 |
| `avhrr_monthly_composite_1985_2013` | 1985-01-21 → 2013-12-21 | OGL-Canada-2.0 |
| `landcover` | 2010-07-01 → 2020-07-01 | OGL-Canada-2.0 |
| `fs-trends` · tendencias de susceptibilidad a inundaciones | 2023-04-01 | OGL-Canada-2.0 |
| `land-deformation-mosaic` | 2012-07-01 → 2024-07-05 | `private` |

El primer ítem de `dynamic-surface-water-annual`, `et-month` y `msi` se entrega como **Cloud-Optimized GeoTIFF** con miniatura PNG. El primer ítem que devolvió `msi` tenía fecha 2025-08-15, posterior a la cobertura escrita en su ficha. Antes de usar una colección hay que comprobar su cobertura real.

## Utilidad posible para RAACK

Si **la región del equipo está en Canadá**, GEO.ca es de lo más directo de la lista. Tiene series ya calculadas (agua superficial, evapotranspiración mensual, nieve y hielo mínimos), formato COG, API STAC y licencia abierta **sin solicitar acceso**. Encaja con el flujo variable → región → serie → pendiente → significación.

Si la región está fuera de Canadá, sirve solo como ejemplo de cómo se publican series de satélite con STAC y WCS. No aporta datos para la demostración.

## Recorrido comprobado de esta revisión

1. `http://geo.ca/`, selector de idioma y portada: contadores, temas, destacados (Flood Mapping, GeoAI, Canadian Hydrospatial Network) e iniciativas.
2. Iniciativa *Understanding Canada's land from space*: mapas y galería completa de 21 conjuntos.
3. Ficha MSI mediante su botón *Explore*: descripción, cobertura, recursos WMS, WCS, ZIP y STAC, y licencia.
4. Ficha *Dynamic Surface Water* anual: recursos STAC y licencia.
5. API STAC del Datacube: lista de colecciones, extensiones y licencias de las de la tabla, y tipo de archivo del primer ítem de tres colecciones.

## Material guardado y límites

- **Descargas:** ninguna. No se pidió ningún COG ni capa WCS.
- **No realizado:** búsqueda por palabras en el catálogo de 103.425 conjuntos, apertura de mapas interactivos, revisión de calidad o de documentación científica de cada producto.
- Las cifras de la portada cambian con el tiempo; son las del día de la revisión.

## Qué falta y por qué

1. Decidir si la demostración se hace en Canadá. Esa decisión define si GEO.ca entra en RAACK.
2. Si entra, elegir colección y región, comprobar cobertura, unidades y documentación, y probar una lectura de COG o WCS para un área pequeña.
3. Citar el producto y NRCan según la licencia abierta.

**Punto de parada exacto:** metadatos de colecciones e ítems en el API STAC del Datacube. No hubo bloqueos: la parada responde a que falta elegir región y variable.
