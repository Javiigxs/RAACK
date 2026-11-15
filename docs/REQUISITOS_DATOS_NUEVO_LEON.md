---
tags: [raack, datos, nuevo-leon, descargas]
fecha: 2026-11-14
estado: descargado-con-limite-imerg
---
# Datos solicitados para Nuevo León

[Índice](../INDICE.md) · [Documento aportado por el equipo](../recursos/archivos/RAACK_descarga_datos_Nuevo_Leon.docx) · [Manifiesto de procedencia y hashes](../recursos/archivos/descargas.json) · [Series de Monterrey ya preparadas](MAPA_DE_DATOS.md)

El 14 de noviembre de 2026 la persona del equipo pidió descargar y publicar los datos enumerados en el documento adjunto. Esta nota registra lo obtenido y lo que falta; no convierte las instrucciones del documento en resultados comprobados ni supone que el equipo haya elegido una solución final.

## Estado de las cinco familias de datos

| Requisito del documento | Estado comprobado el 14 de noviembre de 2026 |
|---|---|
| IMERG mensual, recuadro de Nuevo León, 1998–2025 | Descargado el intervalo disponible en el servidor USF: enero de 1998–septiembre de 2025. Son 333 meses, 48 latitudes y 28 longitudes, 447.552 registros. Octubre–diciembre de 2025 no están disponibles como Final V07; ver la actualización fechada al final. |
| CHIRPS mensual, mismo recuadro y periodo | Completo: enero de 1998–diciembre de 2025, 336 meses × 228 celdas = 76.608 registros. Se conserva NOAA hasta febrero de 2025 y se completaron los diez meses restantes desde UCSB, sin interpolación. |
| Siete variables GLDAS 2.1 desde marzo de 2001 | Descargadas mediante la API pública del visor: siete variables × dos puntos (Monterrey y Galeana), de marzo de 2001 a julio de 2026; 14 CSV originales cada tres horas y una tabla mensual. La persona autorizó el servicio de Giovanni únicamente para estas descargas. Detalles y límites temporales al final. |
| GRACE/GRACE-FO JPL Mascon RL06.3, CRI, versión 4 | Descargado y verificado el netCDF científico mundial (44,22 MiB; MD5 oficial coincidente). Se conserva íntegro en seis partes reconstruibles, más un netCDF y CSV recortados al recuadro regional: 261 soluciones × 50 celdas. Detalles al final. |
| Cuencas INEGI y tres presas CONAGUA | Descargadas y verificadas. Se detallan los nombres, identificadores y límites de interpretación más abajo. |

El recuadro solicitado es aproximadamente 23,1–27,8° N y 101,2–98,4° O. Incluye territorio fuera de Nuevo León: una rejilla recortada por ese recuadro no representa por sí sola un promedio del estado ni de una cuenca.

## Lluvia regional

- [IMERG mensual recibido](../recursos/archivos/nuevo-leon/imerg/nuevo-leon-imerg-mensual-1998-2025-09.csv), con [metadatos del servidor](../recursos/archivos/nuevo-leon/imerg/nuevo-leon-imerg-mensual-1998-2025-09.das). Unidades publicadas: milímetros por mes; malla de 0,1°.
- [CHIRPS de NOAA hasta febrero de 2025](../recursos/archivos/nuevo-leon/chirps/nuevo-leon-chirps-mensual-1998-2025-02-paso5.csv), con [metadatos del servidor](../recursos/archivos/nuevo-leon/chirps/nuevo-leon-chirps-mensual-1998-2025-02-paso5.das). El enlace del documento usa un paso de cinco celdas: selecciona muestras separadas unos 0,25° de una malla nativa de 0,05°. No realiza un promedio espacial ni conserva todas las celdas nativas.
- [CHIRPS combinado completo 1998–2025](../recursos/archivos/nuevo-leon/chirps/nuevo-leon-chirps-mensual-1998-2025-paso5-combinado.csv), [complemento marzo–diciembre de 2025](../recursos/archivos/nuevo-leon/chirps/nuevo-leon-chirps-mensual-2025-03-12-paso5-complemento.csv), [procedencia de las ventanas GeoTIFF](../recursos/archivos/nuevo-leon/chirps/procedencia-complemento-chirps-2025.json) y [script de extracción](../recursos/archivos/nuevo-leon/chirps/extraer_complemento_chirps.py). Se conservaron los mismos píxeles del paso cinco; el mes de solapamiento comprobado coincide en las 228 celdas salvo redondeo inferior a 0,000001 mm. Los [detalles de CHIRPS](../recursos/archivos/nuevo-leon/chirps/README.md) explican las dependencias y transformaciones.

Los enlaces originales que pedían diciembre de 2025 devuelven HTTP 404 de ERDDAP porque esa fecha supera la cobertura de sus copias. No se rellenan los meses ausentes con ceros ni con otro producto.

## Variables GLDAS solicitadas

La solicitud identifica el producto `GLDAS_NOAH025_3H_2.1`: malla de 0,25° y valores cada tres horas. Si no se obtiene un área, el documento permite usar Monterrey y otro punto de la sierra o del sur. Esos puntos no se presentarán como una serie de todo el estado.

Se conservan sus [metadatos oficiales CMR](../recursos/archivos/nuevo-leon/gldas/gldas-noah025-3h-2.1-coleccion-cmr.json), que identifican el producto y sus accesos. Este JSON no contiene las siete series; los CSV científicos descargados posteriormente están enlazados en la actualización del final.

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

## GRACE identificado y descargado

- Producto: `TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4`.
- Cobertura declarada del gránulo: abril de 2002–septiembre de 2026; 261 pasos temporales. Las interrupciones entre misiones no se rellenan.
- Variable: `lwe_thickness`, centímetros de agua equivalente, anomalías respecto a 2004–2009. No mide exclusivamente agua subterránea ni un volumen absoluto de las presas.
- La malla publicada es de 0,5°; la resolución efectiva de los mascons es de unos 3°. Más píxeles dibujados no equivalen a más observaciones independientes.
- [Colección CMR](../recursos/archivos/nuevo-leon/grace/grace-jpl-rl06.3-v04-coleccion-cmr.json), [gránulo CMR](../recursos/archivos/nuevo-leon/grace/grace-jpl-rl06.3-v04-granulo-cmr.json), [notas originales de versión](../recursos/archivos/nuevo-leon/grace/GRACE_GRACE-FO_ReleaseNotes_JPL_MASCON.txt) y [descriptor virtual oficial](../recursos/archivos/nuevo-leon/grace/TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4_virtual_https.json). Las referencias científicas del descriptor apuntan al netCDF protegido; el JSON no contiene sus valores de agua.
- [Enlace oficial al netCDF mundial](https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4/GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc).

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


## Actualización del 14 de noviembre de 2026 · descargas completadas y límite de IMERG

La persona pidió continuar la conversación anterior, que incluye la autorización expresa de usar Giovanni solo como vía de descarga de las siete variables GLDAS. El acceso general de Giovanni como herramienta de la solución sigue pendiente del equipo; ver [la autorización limitada](decisiones/GIOVANNI.md).

**GLDAS:** se conservaron [14 CSV originales y su documentación](../recursos/archivos/nuevo-leon/gldas/README.md), con 74.272 muestras cada uno, desde el 1 de marzo de 2001 hasta el 31 de julio de 2026 a las 21:00 UTC: 1.039.808 observaciones. Los puntos pedidos son Monterrey (25,67, −100,31) y, como segundo punto exploratorio permitido por el Word, Galeana (24,83, −100,08). Sus centros de celda son respectivamente (25,625, −100,375) y (24,875, −100,125), con malla de 0,25°. No constituyen promedios del estado ni de una cuenca. La [tabla mensual](../recursos/archivos/nuevo-leon/gldas/gldas-dos-puntos-mensual-2001-03-2026-07.csv) conserva unidades, conteos y cobertura. Los flujos promediados y acumulados describen las tres horas anteriores al sello temporal según NASA; julio de 2026 queda incompleto en diez combinaciones de punto y variable (247 de 248 intervalos), marcadas sin total mensual. No se interpolan muestras. La evaporación potencial permanece en W m⁻².

**GRACE:** el original mundial descargado tiene 46.365.171 bytes; SHA-256 `3522dd579cc10326339efdecece550ba01f41b9bee599d0ed915fc35f9eafb64` y MD5 `1567b9401ec2a704aab16598fcce5e70`, igual al archivo de comprobación oficial. Por el límite de subida de GitHub web, se conserva sin alterar sus bytes en seis partes de hasta 8 MiB, con [instrucciones y reconstrucción verificable](../recursos/archivos/nuevo-leon/grace/README.md). El [netCDF regional](../recursos/archivos/nuevo-leon/grace/nuevo-leon-grace-jpl-rl06.3-v04-2002-2026-09.nc) conserva las 12 variables y los límites temporales y espaciales originales; el [CSV regional](../recursos/archivos/nuevo-leon/grace/nuevo-leon-grace-jpl-rl06.3-v04-2002-2026-09.csv) contiene 13.050 filas (261 soluciones × 10 latitudes × 5 longitudes). Se seleccionaron centros dentro del recuadro, sin promedio ni interpolación y sin aplicar `scale_factor`. Todas las variables del recorte y las filas del CSV se contrastaron con el original. La malla de 0,5° conserva una resolución efectiva aproximada de 3° y huecos entre meses; no es una serie exclusiva de acuíferos.

**IMERG:** la limitación se confirmó también en la fuente NASA: Final V07 termina en septiembre de 2025 por la transición de algoritmo e insumos a V08. La búsqueda CMR del 14 de noviembre de 2026 devolvió cero gránulos mensuales de octubre–diciembre de 2025 para ese producto. Se guardaron [avisos oficiales y consultas de verificación](../recursos/archivos/nuevo-leon/imerg/README.md). El CSV previo permanece intacto; no se mezclaron Early/Late ni otra versión. CHIRPS, cuencas y presas mantienen lo ya descargado.

La integridad del lote completo se comprobó contra [el manifiesto](../recursos/archivos/descargas.json): 88 archivos con tamaños y SHA-256 coincidentes. Codex asistió en acceso, descarga, empaquetado, recortes, agregación mensual, código, documentación y verificaciones. Los valores científicos proceden de NASA y los demás proveedores, no fueron inventados por IA. Esta descarga no valida por sí sola un caso de demostración: las cuatro reglas de [Validación](VALIDACION.md) siguen siendo obligatorias antes de presentar conclusiones o elegir la solución.
