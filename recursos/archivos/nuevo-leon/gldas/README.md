# GLDAS para dos puntos de Nuevo León

Descarga realizada el 14 de noviembre de 2026 mediante el servicio público usado por Hydrology Time Series de NASA. El equipo autorizó el uso de Giovanni exclusivamente para descargar estas siete variables. No se propone ni se decide aquí una solución del reto.

El documento del equipo solicita `GLDAS_NOAH025_3H_2.1` desde el 1 de marzo de 2001 hasta la fecha más reciente. El [catálogo consultado](gldas-siete-variables-catalogo.json) termina el 31 de julio de 2026 a las 21:00 UTC para las siete variables. Los [metadatos de capacidades](gldas-capacidades-harmony.json) confirman que la vía de series temporales es puntual. Se usa la alternativa de dos puntos permitida por el documento para evitar descargar décadas de una malla regional.

| Punto solicitado | Latitud | Longitud | Alcance |
|---|---|---|---|
| Monterrey | 25,67 | −100,31 | Coordenadas del documento del equipo |
| Galeana | 24,83 | −100,08 | Segundo punto de extracción en el sur de Nuevo León, elegido por Codex dentro de la alternativa permitida |

Cada punto representa una celda de 0,25°. Las coordenadas del centro de celda que realmente devuelve el servicio se guardan en los metadatos de cada CSV y en el [registro de procedencia](procedencia-gldas-dos-puntos.json). Estos puntos no equivalen al promedio del estado ni de una cuenca. No se interpola entre ellos.

Los catorce CSV `*-3h-2001-03-2026-07.csv` conservan los bytes de la respuesta del servicio: metadatos, unidades originales y valores cada tres horas. Los tiempos salen de la columna `Timestamp (UTC)` de la API; no pasan por el exportador del navegador que desplaza horas según el huso local. No se unen GLDAS 2.0 y 2.1, y se evita el cambio de forzantes anterior al 1 de marzo de 2001.

El [CSV mensual de los dos puntos](gldas-dos-puntos-mensual-2001-03-2026-07.csv) se deriva localmente de esas series. Para cada variable y mes registra cuántos intervalos se esperaban, cuántos llegaron, cuántos son válidos y su proporción. Los valores de relleno no se convierten en cero. La media aritmética corresponde a una ponderación temporal uniforme porque cada observación está separada tres horas. Las medias de meses incompletos se identifican con `complete_month=false`.

El [README oficial de GLDAS](https://hydro1.gesdisc.eosdis.nasa.gov/data/GLDAS/README_GLDAS2.pdf), revisión del 13 de agosto de 2025, sección 3.3, página impresa 23, indica que `_tavg` y `_acc` describen las tres horas anteriores al sello temporal. Esa página se consultó mediante el lector web el 14 de noviembre de 2026; el PDF no se descargó al repositorio. Para asignar sus intervalos al mes correcto se usa el mes del sello menos un microsegundo; la observación del primer día a las 00:00 cierra el mes anterior. Se descarta del agregado el primer intervalo, que pertenece a febrero de 2001. La última observación disponible no cubre las últimas tres horas de julio de 2026: para esas cinco variables julio tiene 247 de 248 intervalos, queda incompleto y no recibe un total mensual. Las variables instantáneas se agrupan por el mes de su sello UTC. La columna `time_basis` distingue ambos casos. Este agregado local no se presenta como el producto mensual oficial `GLDAS_NOAH025_M`.

| Variable | Media conservada | Total mensual adicional si el mes está completo |
|---|---|---|
| `Rainf_tavg`, `Evap_tavg` | kg m⁻² s⁻¹ | Suma del flujo × 10.800 segundos; mm de agua |
| `PotEvap_tavg` | W m⁻² | No se convierte a agua |
| `RootMoist_inst` | kg m⁻² | No se suma un almacenamiento |
| `Qs_acc`, `Qsb_acc` | kg m⁻² por intervalo de tres horas | Suma de acumulaciones; mm de agua |
| `Tair_f_inst` | K | No se suma una temperatura |

`Rainf_tavg` es lluvia líquida; no se sustituye por la precipitación total `Rainf_f_tavg`. La humedad de la zona de raíces y el escurrimiento subterráneo tampoco representan por sí solos un volumen de agua disponible en un acuífero.

El [script reproducible](descargar_gldas.py) usa Python estándar y `curl`, reutiliza los archivos existentes y se detiene ante errores de cuota o una respuesta que no sea un CSV científico. La procedencia contiene las URL, tamaño y SHA-256 de los originales, metadatos de las celdas y el método mensual. La consulta del catálogo y las capacidades son metadatos, no observaciones adicionales.

La descarga comprueba disponibilidad, identidad del producto, estructura temporal y unidades. No calcula tendencias ni demuestra que un caso del proyecto pase las cuatro reglas: la evidencia independiente del problema y el diferenciador siguen siendo decisiones y verificaciones del equipo. Codex escribió el script, verificó los archivos y redactó esta nota; los valores científicos proceden de NASA y no se generaron con IA.
