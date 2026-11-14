---
tags: [raack, datos, appeears, solicitud]
fecha: 2026-11-14
estado: recibida
---
# Solicitud de prueba AppEEARS · Monterrey

[Índice](../INDICE.md) · [Bases de datos que hay que pedir](SOLICITUDES_DE_DATOS.md) · [Ficha AppEEARS](../recursos/paginas/02-appeears.md)

Se envió el **14 de noviembre de 2026 a las 13:57 (hora del centro de México)** con la cuenta NASA Earthdata del equipo. Es una **prueba**: el equipo aún no ha elegido la región de la demostración. Sirve para probar el flujo de extracción y la herramienta con datos reales.

| Parámetro | Valor |
|---|---|
| Tipo | Point Sample (muestras de puntos) |
| Nombre en AppEEARS | RAACK prueba Monterrey NDVI LST 2001-2025 |
| ID de la solicitud | `b55ae841-fc36-4385-b584-e19c67b7b156` |
| Periodo | 1 de enero de 2001 a 31 de diciembre de 2025 |
| NDVI · MOD13A3.061 (mensual, 1 km) | `_1_km_monthly_NDVI`, `_1_km_monthly_VI_Quality`, `_1_km_monthly_pixel_reliability` |
| Temperatura · MOD11A2.061 (8 días, 1 km) | `LST_Day_1km`, `LST_Night_1km`, `QC_Day`, `QC_Night` |
| Estado al enviarla | Queued (en cola) |
| Estado a las 14:13 | Procesándose, 28 % |

## Puntos

Los puntos están en [appeears-monterrey-puntos.csv](appeears-monterrey-puntos.csv), con columnas `ID,Category,Latitude,Longitude`. Las coordenadas salen de OpenStreetMap. Cada punto representa un píxel de 1 km. Las categorías son hipótesis de la prueba: los datos dirán si hubo cambio.

| ID | Categoría | Latitud | Longitud | Lugar |
|---|---|---|---|---|
| `mty_centro` | urbano | 25.67081 | -100.30924 | Macroplaza, centro de Monterrey |
| `chipinque` | sierra | 25.59718 | -100.32813 | Parque Ecológico Chipinque, Sierra Madre |
| `carretera_nacional` | expansion_urbana | 25.58191 | -100.23418 | Valle Alto, Carretera Nacional |
| `pesqueria_kia` | industrial_reciente | 25.74464 | -99.98396 | Planta de KIA en Pesquería |
| `garcia` | periferia | 25.81219 | -100.59310 | García, Nuevo León |

## Qué hacer cuando termine

1. AppEEARS avisa por correo a la cuenta. Los resultados se descargan en **Explore**, con sesión iniciada.
2. Según la ayuda de AppEEARS, una muestra de puntos entrega archivos CSV, archivos de apoyo y un archivo de sumas SHA-256. Guardarlos en el repo y registrarlos en [descargas.json](../recursos/archivos/descargas.json).
3. Antes de calcular tendencias:
   - Filtrar por calidad: `pixel_reliability` y `VI_Quality` para NDVI; `QC_Day` y `QC_Night` para temperatura. En `pixel_reliability`, 0 es dato bueno, 1 marginal, 2 nieve o hielo y 3 nublado.
   - Comprobar unidades y factores de escala en los metadatos que acompañan a los CSV. Según el catálogo: NDVI con escala 0,0001 y relleno −3000; temperatura en Kelvin con escala 0,02 y relleno 0. Falta ver si los CSV ya vienen escalados.
   - El significado de cada valor de calidad se consulta sin cuenta; ver la [ficha de AppEEARS](../recursos/paginas/02-appeears.md).
4. Usar las series para probar la herramienta: gráfica, pendiente y significación por punto. Para mapear «dónde cambia» hará falta una solicitud de área cuando el equipo elija la región.

## Actualización · 14 de noviembre de 2026: resultados recibidos

La persona del equipo aportó el ZIP `b55ae841-fc36-4385-b584-e19c67b7b156.zip`. Se comprobó su integridad CRC y se guardaron los siete archivos de la entrega. Esta actualización sustituye el estado «en cola» de la consulta anterior; no se hicieron cálculos de tendencias.

| Resultado | Archivo | Registros de datos |
|---|---|---:|
| Temperatura superficial diurna/nocturna y calidad, MOD11A2.061 | [CSV LST](../recursos/archivos/appeears-monterrey-2001-2025/RAACK-prueba-Monterrey-NDVI-LST-2001-2025-MOD11A2-061-results.csv) | 5.745 |
| NDVI mensual y calidad, MOD13A3.061 | [CSV NDVI](../recursos/archivos/appeears-monterrey-2001-2025/RAACK-prueba-Monterrey-NDVI-LST-2001-2025-MOD13A3-061-results.csv) | 1.500 |

También se conservan el [README original de AppEEARS](../recursos/archivos/appeears-monterrey-2001-2025/README.md), los [metadatos LST](../recursos/archivos/appeears-monterrey-2001-2025/RAACK-prueba-Monterrey-NDVI-LST-2001-2025-MOD11A2-061-metadata.xml), los [metadatos NDVI](../recursos/archivos/appeears-monterrey-2001-2025/RAACK-prueba-Monterrey-NDVI-LST-2001-2025-MOD13A3-061-metadata.xml), la [lista de gránulos](../recursos/archivos/appeears-monterrey-2001-2025/RAACK-prueba-Monterrey-NDVI-LST-2001-2025-granule-list.txt) y la [solicitud JSON](../recursos/archivos/appeears-monterrey-2001-2025/RAACK-prueba-Monterrey-NDVI-LST-2001-2025-request.json).

- Los dos CSV contienen los cinco puntos solicitados. Los identificadores devueltos eliminan los guiones bajos: `mtycentro`, `chipinque`, `carreteranacional`, `pesqueriakia` y `garcia`.
- Se conservaron los bytes originales de seis archivos. Del JSON se omitió `user_id`, que contenía un correo personal, y se cambió únicamente el formato de indentación. El ZIP original queda en la descarga local y no se publica porque incluye ese correo. El manifiesto registra tamaños y SHA-256, también los del ZIP de origen y del JSON anterior a esa omisión.
- El README del proveedor incluye `Date Completed: 2026-11-14T19:59:02.427555`, sin zona horaria explícita. El JSON conserva `status: processing` de sus metadatos originales; no se interpreta como el estado actual de la entrega.
- Antes de analizar siguen pendientes los filtros de calidad y la comprobación de unidades, rellenos y escalado. El README de AppEEARS describe valores escalados: no aplicar los factores de escala de nuevo sin verificar las columnas y los metadatos.

**Uso de IA:** Codex comprobó y organizó los archivos, calculó hashes y recuentos, retiró el correo del JSON y redactó esta actualización. Los valores científicos proceden de AppEEARS y no se generaron con IA.
