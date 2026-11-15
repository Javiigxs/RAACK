# RAACK
Be An Earth System Trend Detective Challenge

Your app should be able to do this:
1. Decide on the data variable(s) for analysis.
2. Choose a region for the analysis.
3. Select the time period for the time-series.
4. Create the time-series and examine it. Does it appear to have a trend?
5. Analyze the trend for significance.

## Recursos del hackathon

Materiales preparados para [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/).

- [Índice para personas e IAs](INDICE.md): estado del proyecto y mapa de todas las notas. Empieza aquí.
- [Reglas oficiales](docs/REGLAS_OFICIALES.md): cómo puntúan los jueces y qué exige la entrega del domingo 15 de noviembre de 2026.
- [Ideas para la herramienta](docs/IDEAS.md): propuestas por validar, con una primera señal en los datos de Monterrey.
- [Qué se puede hacer con cada recurso y cuánto tarda](docs/FUNCIONALIDADES.md), y las [cuatro reglas de validación](docs/VALIDACION.md) del equipo.
- [Catálogo de recursos y descargas](recursos/README.md): archivos iniciales y descargas posteriores, fuentes y estado de acceso a los portales.
- [Cobertura de los 13 recursos](recursos/COBERTURA.md): hasta dónde se llegó en cada página, qué se descargó y por qué aparece tanto Canadá.
- Fichas por página: una por cada uno de los 12 recursos revisados, enlazadas desde la [cobertura](recursos/COBERTURA.md) y el [índice](INDICE.md).
- [Bases de datos que hay que pedir](docs/SOLICITUDES_DE_DATOS.md) y para qué las usaríamos.
- [Grafo de conocimiento](docs/CONOCIMIENTO.md) con las fuentes, los métodos y los hallazgos de los casos de agua y clima.
- [Grafo de contexto](docs/CONTEXTO.md) de la preparación ([imagen](docs/CONTEXTO.svg), [datos](docs/CONTEXTO.json)).
- [Reto y objetivos](docs/RETO.md).
- [Referencia científica y muestra GLDAS](docs/REFERENCIA_CIENTIFICA.md).
- [Pendientes del equipo](docs/PENDIENTES.md).
- [Giovanni: pendiente de nuestra decisión](docs/decisiones/GIOVANNI.md).

El repositorio es también una bóveda de Obsidian: en Obsidian, usa «Abrir carpeta como bóveda» sobre esta carpeta. Los enlaces funcionan en GitHub y en Obsidian. Los agentes de IA tienen sus reglas en [AGENTS.md](AGENTS.md).

La carpeta `recursos/archivos/`, descrita en el [catálogo](recursos/README.md), conserva los archivos iniciales y los lotes posteriores de AppEEARS, lluvia, GLDAS, GRACE, cuencas y presas. El [manifiesto](recursos/archivos/descargas.json) registra procedencia, tamaño y SHA-256.

**El 14 de noviembre de 2026 se autorizó el servicio de Giovanni únicamente para descargar las siete variables GLDAS. Su selección como herramienta de la solución sigue pendiente del equipo; ver la actualización de [Giovanni](docs/decisiones/GIOVANNI.md).**

Los [datos regionales de Nuevo León](docs/REQUISITOS_DATOS_NUEVO_LEON.md) incluyen siete variables GLDAS en Monterrey y Galeana desde marzo de 2001 hasta julio de 2026, GRACE con originales reconstruibles y recorte regional, CHIRPS, cuencas y presas. IMERG Final V07 termina en septiembre de 2025; se conserva la evidencia oficial del límite. La elección del caso y sus conclusiones siguen sujetas a las cuatro reglas de validación. Codex asistió las descargas, transformaciones, código y documentación; los valores científicos proceden de sus proveedores.
