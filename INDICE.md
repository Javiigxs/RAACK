# Índice de RAACK

Mapa de las notas del repositorio, para personas e IAs. **Empieza aquí y abre solo lo que necesites:** cada línea dice qué contiene la nota y cuánto ocupa. El repositorio es también una bóveda de Obsidian; los enlaces funcionan en GitHub y en Obsidian. Los agentes de IA tienen sus reglas en [AGENTS.md](AGENTS.md).

## Estado en 30 segundos · 14 de noviembre de 2026, por la tarde

- **Reto:** NASA Space Apps 2026, *Be An Earth System Trend Detective!* Hay que construir una herramienta que elija variable, región y periodo, dibuje la serie y diga cuánto cambia y si la tendencia es significativa.
- **Entrega:** domingo 15 de noviembre de 2026 a las 23:59, hora local. Todo en inglés, demo de 30 segundos o 7 diapositivas y declaración de uso de IA: [docs/REGLAS_OFICIALES.md](docs/REGLAS_OFICIALES.md).
- **Hecho:**
  - Los 13 recursos oficiales revisados: 12 fichas; Giovanni sin abrir.
  - Página oficial y guías de evaluación y entrega leídas enteras.
  - 7 archivos descargados, cobertura y grafo de contexto.
  - Cuenta NASA Earthdata del equipo creada.
  - Solicitud de prueba de AppEEARS en Monterrey: procesándose, 28 % a las 14:13.
  - Servicios abiertos probados: el visor de hidrología entrega 26 años de Monterrey en menos de 20 segundos; NOAA y Hydrocron responden sin cuenta. Qué llega al instante y qué en cola: [docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md).
  - Primera señal, preliminar: en Monterrey la temperatura del aire sube de forma significativa; la humedad del suelo y la evapotranspiración, no.
  - [Ideas para la herramienta](docs/IDEAS.md) propuestas, con su paso por las cuatro reglas.
- **Regla clave:** toda propuesta debe pasar las cuatro reglas de [docs/VALIDACION.md](docs/VALIDACION.md).
- **Por decidir:**
  - Qué idea se construye y cuál es el diferenciador.
  - Variable, región y periodo de la demostración.
  - Formato de la demo.
  - Si la región está en Canadá, que decide si sirven GEO.ca y RCM.
  - Si se usa Giovanni.
- **No asumir:**
  - Las ideas son propuestas de un agente; el equipo no ha elegido ninguna.
  - Las cifras de Monterrey son preliminares: no hay ninguna serie larga guardada en el repo.
  - Las horas del CSV del visor no son UTC reales.
  - Giovanni no está aprobado.
  - Las fichas separan lo comprobado de lo que solo afirma cada fuente.

## Si buscas…

| Pregunta | Lee |
|---|---|
| ¿Qué pide exactamente el reto? | [docs/RETO.md](docs/RETO.md) |
| ¿Cómo puntúan los jueces y qué exige la entrega? | [docs/REGLAS_OFICIALES.md](docs/REGLAS_OFICIALES.md) |
| ¿Qué ideas hay para la herramienta y cuál podría ser el diferenciador? | [docs/IDEAS.md](docs/IDEAS.md) |
| ¿Qué recursos dieron y cuáles sirven para nuestro caso? | [recursos/COBERTURA.md](recursos/COBERTURA.md) |
| ¿Qué se puede hacer o pedir en cada recurso y cuánto tarda en llegar? | [docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md) |
| ¿Cómo saber si una idea o caso es válido? | [docs/VALIDACION.md](docs/VALIDACION.md) |
| ¿Qué dice o permite un recurso concreto? | Su ficha, en la sección «Fichas por recurso» de este índice |
| ¿Qué hay que pedir para conseguir datos y para qué? | [docs/SOLICITUDES_DE_DATOS.md](docs/SOLICITUDES_DE_DATOS.md) |
| ¿Cómo va la extracción de prueba de AppEEARS? | [docs/SOLICITUD_APPEEARS_MONTERREY.md](docs/SOLICITUD_APPEEARS_MONTERREY.md) |
| ¿Qué método estadístico usar y cómo explicarlo? | [recursos/paginas/06-metodos-estadisticos.md](recursos/paginas/06-metodos-estadisticos.md) · [recursos/paginas/07-significancia.md](recursos/paginas/07-significancia.md) · [recursos/paginas/04-seawifs.md](recursos/paginas/04-seawifs.md) · ideas 4 a 6 de [docs/IDEAS.md](docs/IDEAS.md) |
| ¿Qué variables y periodos ofrece el visor de hidrología? | [recursos/paginas/01-hydrology.md](recursos/paginas/01-hydrology.md) |
| ¿Qué unidades, escala y calidad tienen las capas de AppEEARS? | [recursos/paginas/02-appeears.md](recursos/paginas/02-appeears.md) |
| ¿Qué queda por decidir o hacer? | [docs/PENDIENTES.md](docs/PENDIENTES.md) |
| ¿Qué se hizo, en qué orden y quién? | [docs/CONTEXTO.md](docs/CONTEXTO.md) |

## Reto, estado y decisiones

| Nota | Qué contiene | Tamaño |
|---|---|---|
| [docs/RETO.md](docs/RETO.md) | Enunciado oficial (en inglés y en español), resumen de antecedentes, objetivos y consideraciones de la página oficial, y qué debemos resolver. | 7 kB |
| [docs/REGLAS_OFICIALES.md](docs/REGLAS_OFICIALES.md) | Reglas de la organización: 5 criterios de evaluación, plazo, demo, idioma, uso de IA, campos de la página del proyecto y premios. | 8 kB |
| [docs/IDEAS.md](docs/IDEAS.md) | 13 ideas por validar con su paso por las 4 reglas, primera señal preliminar en los datos de Monterrey y borrador de frase diferenciadora. | 15 kB |
| [docs/VALIDACION.md](docs/VALIDACION.md) | Las 4 reglas que toda propuesta debe pasar (problema real, medible, con los datos que nos dieron, diferenciador) y estado del caso Monterrey. | 6 kB |
| [docs/PENDIENTES.md](docs/PENDIENTES.md) | Decisiones y tareas abiertas del equipo: idea, variable, región, periodo, accesos, criterios de la herramienta y lista de la entrega oficial. | 4 kB |
| [docs/decisiones/GIOVANNI.md](docs/decisiones/GIOVANNI.md) | Por qué Giovanni está excluido y qué falta para decidir si se usa. | 1 kB |
| [README.md](README.md) | Portada del repositorio: requisitos de la app y enlaces principales. | 3 kB |

## Recursos del reto

| Nota | Qué contiene | Tamaño |
|---|---|---|
| [recursos/COBERTURA.md](recursos/COBERTURA.md) | Los 13 recursos oficiales: hasta dónde se llegó en cada uno, qué se descargó, qué acceso piden, relevancia y por qué aparece tanto Canadá. | 7 kB |
| [recursos/README.md](recursos/README.md) | Catálogo: los 7 archivos descargados, estado de cada recurso con enlace a su ficha y descargas que fallaron. | 10 kB |

## Fichas por recurso (una por página oficial)

| Nota | Qué contiene | Tamaño |
|---|---|---|
| [recursos/paginas/01-hydrology.md](recursos/paginas/01-hydrology.md) | Hydrology Time Series (NASA GES DISC): series puntuales; tabla de sus 13 productos y 172 variables; prueba con Monterrey de 26 años; aviso de las horas del CSV; GLDAS 2.0 frente a 2.1; su API enlaza Giovanni. | 11 kB |
| [recursos/paginas/02-appeears.md](recursos/paginas/02-appeears.md) | AppEEARS: extracción por puntos o áreas con capas de calidad; requiere Earthdata. Consultas sin cuenta, unidades y escala de las capas pedidas y productos del catálogo por tema. | 9 kB |
| [recursos/paginas/03-cdo.md](recursos/paginas/03-cdo.md) | Climate Data Online (NOAA): estaciones GSOM mensuales (TAVG, PRCP…), API v2 con token y sus límites. Datos sin token, estaciones cercanas a Monterrey y su cobertura real. | 8 kB |
| [recursos/paginas/04-seawifs.md](recursos/paginas/04-seawifs.md) | Artículo NASA 2009 sobre clorofila SeaWiFS: medias regionales, regresión, ANOVA/F y regresión robusta. | 5 kB |
| [recursos/paginas/05-knmi.md](recursos/paginas/05-knmi.md) | KNMI Climate Explorer: flujo región → serie → tendencia; bloqueado por verificación humana; manual leído. | 4 kB |
| [recursos/paginas/06-metodos-estadisticos.md](recursos/paginas/06-metodos-estadisticos.md) | OLS, Mann–Kendall, Kendall estacional y ADF con datos sintéticos; ADF no contrasta una pendiente. | 4 kB |
| [recursos/paginas/07-significancia.md](recursos/paginas/07-significancia.md) | Cómo explicar p-valores, intervalos y significación sin confundirla con relevancia o causa. | 4 kB |
| [recursos/paginas/08-rcm.md](recursos/paginas/08-rcm.md) | Radar RCM (CSA): muestras de una fecha, EODMS con registro, colección RCM ARD cada 12 días; solo Canadá. | 8 kB |
| [recursos/paginas/09-geo.md](recursos/paginas/09-geo.md) | GEO.ca: series abiertas de Canadá (agua 1984–2023, evapotranspiración mensual, nieve y hielo) en COG y STAC. | 6 kB |
| [recursos/paginas/10-swot.md](recursos/paginas/10-swot.md) | SWOT: elevación y área de ríos y lagos, global y desde 2023; productos de PO.DAAC; Hydrocron da series por tramo o lago, probado sin cuenta. | 7 kB |
| [recursos/paginas/11-ecosistemas.md](recursos/paginas/11-ecosistemas.md) | Página divulgativa de la CSA (2022): bosques, humedales, cultivos y costas; BioSpace; sin datos descargables. | 4 kB |
| [recursos/paginas/12-sar.md](recursos/paginas/12-sar.md) | Tutorial SAR de la CSA en Python y QGIS (incendios de BC): qué hace el notebook; sin series temporales. | 5 kB |

## Datos y solicitudes

| Nota | Qué contiene | Tamaño |
|---|---|---|
| [docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md) | Qué se puede hacer y pedir en cada recurso y cuánto tarda en llegar el dato; lo comprobado por la tarde; qué no hacen las herramientas oficiales; ruta rápida para el hackathon. | 9 kB |
| [docs/SOLICITUDES_DE_DATOS.md](docs/SOLICITUDES_DE_DATOS.md) | Qué acceso pedir en cada portal (Earthdata, NOAA, KNMI, EODMS), para qué lo usaríamos y texto para «uso previsto». | 5 kB |
| [docs/SOLICITUD_APPEEARS_MONTERREY.md](docs/SOLICITUD_APPEEARS_MONTERREY.md) | Solicitud de prueba enviada: 5 puntos en Monterrey, NDVI y temperatura 2001–2025, ID y qué hacer al terminar. | 3 kB |
| [docs/REFERENCIA_CIENTIFICA.md](docs/REFERENCIA_CIENTIFICA.md) | Resumen del método del artículo SeaWiFS y metadatos de la muestra GLDAS descargada. | 3 kB |

## Historia del trabajo

| Nota | Qué contiene | Tamaño |
|---|---|---|
| [docs/CONTEXTO.md](docs/CONTEXTO.md) | Grafo de contexto (imagen y Mermaid): qué se revisó, hasta dónde, qué se descargó, qué falta; cronología. | 9 kB |
| [docs/PREPARACION_2026-11-14.md](docs/PREPARACION_2026-11-14.md) | Bitácora de la preparación inicial de recursos hecha por Codex. | 1 kB |

## Archivos que no conviene leer enteros

| Archivo | Qué es | Tamaño | Lee antes |
|---|---|---|---|
| [recursos/archivos/nasa-seawifs-series-temporales-20090042747.pdf](recursos/archivos/nasa-seawifs-series-temporales-20090042747.pdf) | Artículo SeaWiFS (27 páginas) | 8.8 MB | [recursos/paginas/04-seawifs.md](recursos/paginas/04-seawifs.md) |
| [recursos/archivos/knmi-manual-acceso-descarga.pdf](recursos/archivos/knmi-manual-acceso-descarga.pdf) | Manual KNMI de acceso y descarga (15 páginas) | 12.8 MB | [recursos/paginas/05-knmi.md](recursos/paginas/05-knmi.md) |
| [recursos/archivos/noaa-gsom-documentacion.pdf](recursos/archivos/noaa-gsom-documentacion.pdf) | Documentación de NOAA GSOM (20 páginas) | 157 kB | [recursos/paginas/03-cdo.md](recursos/paginas/03-cdo.md) |
| [recursos/archivos/csa-sar-bc-wildfire.ipynb](recursos/archivos/csa-sar-bc-wildfire.ipynb) | Notebook SAR de la CSA | 993 kB | [recursos/paginas/12-sar.md](recursos/paginas/12-sar.md) |
| [recursos/archivos/csa-sar-tutorial-qgis.md](recursos/archivos/csa-sar-tutorial-qgis.md) | Guía QGIS del tutorial SAR | 7 kB | [recursos/paginas/12-sar.md](recursos/paginas/12-sar.md) |
| [recursos/archivos/csa-sar-LICENSE.txt](recursos/archivos/csa-sar-LICENSE.txt) | Licencia del tutorial SAR | 4 kB | [recursos/paginas/12-sar.md](recursos/paginas/12-sar.md) |
| [recursos/archivos/gldas-evapotranspiracion-muestra-2016-05.csv](recursos/archivos/gldas-evapotranspiracion-muestra-2016-05.csv) | Muestra GLDAS de una semana (53 filas) | 2 kB | [docs/REFERENCIA_CIENTIFICA.md](docs/REFERENCIA_CIENTIFICA.md) |
| [recursos/archivos/descargas.json](recursos/archivos/descargas.json) | Manifiesto de descargas: origen, tamaño y SHA-256 | 4 kB | [recursos/README.md](recursos/README.md) |
| [docs/CONTEXTO.json](docs/CONTEXTO.json) | Nodos y aristas del grafo de contexto | 15 kB | [docs/CONTEXTO.md](docs/CONTEXTO.md) |
| [docs/CONTEXTO.svg](docs/CONTEXTO.svg) | Imagen del grafo de contexto | 21 kB | [docs/CONTEXTO.md](docs/CONTEXTO.md) |
| [docs/generar_contexto.py](docs/generar_contexto.py) | Script que genera el grafo de contexto | 27 kB | [docs/CONTEXTO.md](docs/CONTEXTO.md) |
| [docs/appeears-monterrey-puntos.csv](docs/appeears-monterrey-puntos.csv) | Puntos de la solicitud de prueba de AppEEARS | 1 kB | [docs/SOLICITUD_APPEEARS_MONTERREY.md](docs/SOLICITUD_APPEEARS_MONTERREY.md) |
