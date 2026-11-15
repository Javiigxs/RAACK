---
tags: [raack, datos, nuevo-leon, descargas]
fecha: 2026-11-14
estado: en-descarga
---
# Datos solicitados para Nuevo León

[Índice](../INDICE.md) · [Documento aportado por el equipo](../recursos/archivos/RAACK_descarga_datos_Nuevo_Leon.docx) · [Manifiesto de procedencia y hashes](../recursos/archivos/descargas.json) · [Series de Monterrey ya preparadas](MAPA_DE_DATOS.md)

El 14 de noviembre de 2026 la persona del equipo pidió descargar y publicar los datos enumerados en el documento adjunto. Esta nota registra lo obtenido y lo que falta; no convierte las instrucciones del documento en resultados comprobados ni supone que el equipo haya elegido una solución final.

## Estado de las cinco familias de datos

| Requisito del documento | Estado comprobado el 14 de noviembre de 2026 |
|---|---|
| IMERG mensual, recuadro de Nuevo León, 1998–2025 | Descargado el intervalo disponible en el servidor USF: enero de 1998–septiembre de 2025. Son 333 meses, 48 latitudes y 28 longitudes, 447.552 registros. Faltan octubre–diciembre de 2025 en ese servidor. |
| CHIRPS mensual, mismo recuadro y periodo | Completo: enero de 1998–diciembre de 2025, 336 meses × 228 celdas = 76.608 registros. Se conserva NOAA hasta febrero de 2025 y se completaron los diez meses restantes desde UCSB, sin interpolación. |
| Siete variables GLDAS 2.1 desde marzo de 2001 | Pendientes de descarga. Los accesos antiguos GDS y OPeNDAP de hydro1 responden HTTP 410; los accesos modernos HTTPS y Cloud OPeNDAP exigen Earthdata (HTTP 401). El visor Hydrology utiliza un servicio de Giovanni, excluido por las instrucciones del proyecto; se ha pedido una decisión expresa para esa vía. |
| GRACE/GRACE-FO JPL Mascon RL06.3, CRI, versión 4 | Producto y gránulo exactos identificados; cinco archivos oficiales de metadatos y verificación descargados. El netCDF científico, de 44,22 MiB, aún no se ha obtenido: requiere Earthdata y la sesión de Chrome devuelve «Cookie Too Large». Los metadatos no sustituyen la serie científica. |
| Cuencas INEGI y tres presas CONAGUA | Descargadas y verificadas. Se detallan los nombres, identificadores y límites de interpretación más abajo. |

El recuadro solicitado es aproximadamente 23,1–27,8° N y 101,2–98,4° O. Incluye territorio fuera de Nuevo León: una rejilla recortada por ese recuadro no representa por sí sola un promedio del estado ni de una cuenca.

## Lluvia regional

- [IMERG mensual recibido](../recursos/archivos/nuevo-leon/imerg/nuevo-leon-imerg-mensual-1998-2025-09.csv), con [metadatos del servidor](../recursos/archivos/nuevo-leon/imerg/nuevo-leon-imerg-mensual-1998-2025-09.das). Unidades publicadas: milímetros por mes; malla de 0,1°.
- [CHIRPS de NOAA hasta febrero de 2025](../recursos/archivos/nuevo-leon/chirps/nuevo-leon-chirps-mensual-1998-2025-02-paso5.csv), con [metadatos del servidor](../recursos/archivos/nuevo-leon/chirps/nuevo-leon-chirps-mensual-1998-2025-02-paso5.das). El enlace del documento usa un paso de cinco celdas: selecciona muestras separadas unos 0,25° de una malla nativa de 0,05°. No realiza un promedio espacial ni conserva todas las celdas nativas.
- [CHIRPS combinado completo 1998–2025](../recursos/archivos/nuevo-leon/chirps/nuevo-leon-chirps-mensual-1998-2025-paso5-combinado.csv), [complemento marzo–diciembre de 2025](../recursos/archivos/nuevo-leon/chirps/nuevo-leon-chirps-mensual-2025-03-12-paso5-complemento.csv), [procedencia de las ventanas GeoTIFF](../recursos/archivos/nuevo-leon/chirps/procedencia-complemento-chirps-2025.json) y [script de extracción](../recursos/archivos/nuevo-leon/chirps/extraer_complemento_chirps.py). Se conservaron los mismos píxeles del paso cinco; el mes de solapamiento comprobado coincide en las 228 celdas salvo redondeo inferior a 0,000001 mm. Los [detalles de CHIRPS](../recursos/archivos/nuevo-leon/chirps/README.md) explican las dependencias y transformaciones.

Los enlaces originales que pedían diciembre de 2025 devuelven HTTP 404 de ERDDAP porque esa fecha supera la cobertura de sus copias. No se rellenan los meses ausentes con ceros ni con otro producto.

## Variables GLDAS pendientes

La solicitud identifica el producto `GLDAS_NOAH025_3H_2.1`: malla de 0,25° y valores cada tres horas. Si no se obtiene un área, el documento permite usar Monterrey y otro punto de la sierra o del sur. Esos puntos no se presentarán como una serie de todo el estado.

Se conservan sus [metadatos oficiales CMR](../recursos/archivos/nuevo-leon/gldas/gldas-noah025-3h-2.1-coleccion-cmr.json), que identifican el producto y sus accesos. Este JSON no contiene las siete series.

| Variable | Nombre técnico | Unidad del producto |
|---|---|---|
| Lluvia líquida | `Rainf_tavg` | kg m⁻² s⁻¹ |
| Evapotranspiración | `Evap_tavg` | kg m⁻² s⁻¹ |
| Evaporación potencial | `PotEvap_tavg` | W m⁻² |
| Humedad en la zona de raíces | `RootMoist_inst` | kg m⁻² |
| Escurrimiento superficial | `Qs_acc` | kg m⁻² acumulados en tres horas |
| Escurrimiento subterráneo | `Qsb_acc` | kg m⁻² acumulados en tres horas |
| Temperatura del aire | `Tair_f_inst` | K |

La precipitación total `Rainf_f_tavg` incluye lluvia y nieve y es una variable diferente de `Rainf_tavg`. El flujo de energía de evaporación potencial tampoco es directamente un volumen de agua. Las unidades se mantienen antes de cualquier conversión. Fuente: [tabla oficial del producto NASA](https://disc.gsfc.nasa.gov/datasets/GLDAS_NOAH025_3H_2.1/summary).

## GRACE identificado y acceso pendiente

- Producto: `TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4`.
- Cobertura declarada del gránulo: abril de 2002–septiembre de 2026; 261 pasos temporales. Las interrupciones entre misiones no se rellenan.
- Variable: `lwe_thickness`, centímetros de agua equivalente, anomalías respecto a 2004–2009. No mide exclusivamente agua subterránea ni un volumen absoluto de las presas.
- La malla publicada es de 0,5°; la resolución efectiva de los mascons es de unos 3°. Más píxeles dibujados no equivalen a más observaciones independientes.
- [Colección CMR](../recursos/archivos/nuevo-leon/grace/grace-jpl-rl06.3-v04-coleccion-cmr.json), [gránulo CMR](../recursos/archivos/nuevo-leon/grace/grace-jpl-rl06.3-v04-granulo-cmr.json), [notas originales de versión](../recursos/archivos/nuevo-leon/grace/GRACE_GRACE-FO_ReleaseNotes_JPL_MASCON.txt) y [descriptor virtual oficial](../recursos/archivos/nuevo-leon/grace/TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4_virtual_https.json). Las referencias científicas del descriptor apuntan al netCDF protegido; el JSON no contiene sus valores de agua.
- [Enlace oficial al netCDF pendiente](https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4/GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc).

## Cuencas y presas obtenidas

Se conserva el [ZIP original de la cuenca R. Bravo–San Juan RH24B de INEGI](../recursos/archivos/nuevo-leon/cuencas/san-juan-cuenca-inegi.zip). También se ofrece un [ZIP ligero con tres límites de subcuenca](../recursos/archivos/nuevo-leon/cuencas/limites-subcuencas-san-juan-pesqueria-monterrey.zip): R. San Juan `RH24Bb`, R. Pesquería `RH24Bc` y R. Monterrey `RH24Bf`. Esta última es la unidad devuelta por SIATL para el punto metropolitano consultado próximo al Santa Catarina; no es una delimitación independiente llamada «Santa Catarina».

El paquete ligero reúne los componentes originales `.shp`, `.shx`, `.dbf` y `.prj`, sin modificar sus bytes, geometrías, atributos ni sistema de coordenadas. El manifiesto identifica sus ZIP de origen y los hashes de cada miembro. Los tres ZIP individuales completos se conservan fuera del repositorio para evitar duplicar el paquete de cuenca.

| Presa | Archivo original SIH | Inicio de observaciones de volumen | Última fecha recibida |
|---|---|---|---|
| El Cuchillo / Cuchillo Solidaridad | [CCHNL.csv](../recursos/archivos/nuevo-leon/presas/CCHNL.csv) | 1 de septiembre de 1993 | 13 de noviembre de 2026 |
| Cerro Prieto / José López Portillo | [CPRNL.csv](../recursos/archivos/nuevo-leon/presas/CPRNL.csv) | 1 de enero de 1993 | 13 de noviembre de 2026 |
| La Boca / Rodrigo Gómez | [LBCNL.csv](../recursos/archivos/nuevo-leon/presas/LBCNL.csv) | 1 de enero de 1993 | 13 de noviembre de 2026 |

El [catálogo original de presas](../recursos/archivos/nuevo-leon/presas/0_Catalogo_de_presas.csv) identifica las claves, nombres y coordenadas. Las series contienen nivel y volumen, además de otras variables. `VolumenAlm(Mm3)` se expresa en millones de metros cúbicos, equivalentes a hm³. Hay huecos; se conservan vacíos y fechas ausentes. El inicio del archivo puede corresponder a otra variable y no al volumen. La Boca presenta un orden distinto de columnas: se debe leer la cabecera, no suponer posiciones. El catálogo usa Windows-1252 y las series UTF-8.

## Procedencia y uso de IA

Los archivos fuente proceden de sus proveedores. Codex coordinó las descargas, comprobó estructura, cobertura y hashes, preparó el paquete ligero de límites y redactó esta nota. Los valores científicos y los límites geográficos no se generaron con IA. Las transformaciones y fuentes concretas se registran en el manifiesto; lo pendiente permanece señalado como pendiente.
