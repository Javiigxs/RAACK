---
tags: [raack, hackathon, nasa, space-apps]
fecha: 2026-11-14
estado: preparación
---
# RAACK · Be An Earth System Trend Detective!

**Repositorio del equipo:** [Javiigxs/RAACK](https://github.com/Javiigxs/RAACK). El README consultado el 14 de noviembre de 2026 identifica este reto.

**Reto oficial:** [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/). [Recursos oficiales](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/?tab=resources).

## Enunciado oficial

> Change is always occurring in the Earth’s interconnected environmental system, and when it runs in a consistent direction – rising or falling, increasing or decreasing, thickening or thinning – measured variables reflect it. But a measured Earth science data variable can trend one way in one region and the opposite way in another, even when the same process drives both. The multitude of Earth science data variables makes it difficult to select variables that could indicate change, and to then perform an analysis on the selected variables. Your challenge is to create a tool that can select variables measured by Earth science missions or produced by Earth science models, visualize how they change over time, and determine what is changing, where it is changing, how much it is changing, and if these changes are what scientists call “significant.”

**En español:** el sistema terrestre cambia siempre, y cuando el cambio va en una dirección constante, las variables medidas lo reflejan. Una misma variable puede tener tendencia en un sentido en una región y en el contrario en otra, aunque las mueva el mismo proceso. Hay tantas variables que cuesta elegir las que indican cambio y analizarlas. El reto es crear una herramienta que permita:

- Seleccionar variables medidas por misiones o producidas por modelos.
- Ver cómo cambian en el tiempo.
- Determinar qué cambia, dónde, cuánto y si el cambio es «significativo».

## Lo que añade la página oficial

La pestaña *Details* tiene tres secciones más, leídas el 14 de noviembre de 2026. Aquí van resumidas; no son obligatorias, pero dicen qué espera quien escribió el reto. Dificultad declarada: avanzada.

**Antecedentes (*Background*)**

- El problema tiene dos partes: encontrar variables con tendencia, de las simples (temperatura, lluvia) a las complejas (evaporación, caudal), y analizarlas en regiones concretas de la tierra, el océano o la atmósfera.
- Cita como fuentes los instrumentos MODIS, OMI, AIRS y GPM, y los modelos MERRA-2 y GLDAS.

**Objetivos (*Objectives*)**

1. Identificar variables de interés que puedan tener tendencia.
2. Conseguir sus datos para una región concreta, porque la mayoría de las tendencias no son globales.
3. Generar y dibujar la serie durante un periodo suficientemente largo.
4. Hacer un análisis estadístico básico: ritmo de cambio y prueba de significación con prueba t, Mann–Kendall o intervalos de confianza.

Hacer la visualización y el análisis cubre el alcance completo del reto.

**Consideraciones (*Potential Considerations*)**

- **Público:** estudiantes de bachillerato y universidad, y personas con algo de formación científica. Ayudan mucho unas definiciones sencillas de las variables. La idea es que el usuario se vuelva «detective de datos».
- **Enfoque:** el usuario podría responder unas pocas preguntas sobre qué o dónde quiere investigar, y con eso buscar variables relacionadas. Serían muy útiles un par de ejemplos de demostración que se puedan ver.
- **IA:** no es obligatoria, pero podría servir para identificar datos con posibles tendencias a partir de noticias, artículos o del tipo de región: un desierto, una selva, un estuario o la atmósfera sobre una gran ciudad.
- **Datos:** los diarios y mensuales son los más fáciles de procesar.
- **Tendencias no significativas:** también interesan. A veces solo falta un periodo más largo para que lo sean.
- **Herramientas externas:** sugiere mirar las de organizaciones como CUAHSI para dibujar datos hidrológicos. CUAHSI no está en la lista de [13 recursos](../recursos/COBERTURA.md).
- **Complejidad:** las tendencias pueden no ser lineales y algunas no se ven sin quitar ciclos regulares, como el estacional. Los análisis complejos quedan fuera del alcance: con tendencias lineales basta para empezar.

## Contexto del equipo

- **Reglas de la organización:** cinco criterios de evaluación, plazo, formato de la demo, idioma y uso de IA, en [Reglas oficiales](REGLAS_OFICIALES.md).
- **Ideas por validar:** [Ideas para la herramienta](IDEAS.md).
- **Duración:** el hackathon dura dos días. Este enunciado se añadió el 14 de noviembre de 2026, a mediodía del primero.
- **Tiempos de los datos:** muchos portales no entregan al instante. Qué se puede pedir en cada uno y cuánto tarda: [Funcionalidades y tiempos](FUNCIONALIDADES.md).
- **Validación:** toda propuesta debe pasar las cuatro reglas de [Validación de la propuesta](VALIDACION.md): problema real, medible, hecha con los datos que nos dieron y con un diferenciador.
- **Estado y mapa de notas:** [Índice](../INDICE.md).

## Qué debemos resolver

Crear una herramienta que permita seleccionar variables de misiones o modelos de ciencias de la Tierra, elegir una región y visualizar su evolución temporal. Debe ayudar a responder:

- **Qué cambia:** variable y significado comprensibles.
- **Dónde cambia:** región o ubicación elegida; puede haber tendencias opuestas en distintas zonas.
- **Cuánto cambia:** dirección y tasa de cambio, con sus unidades.
- **Si el cambio es significativo:** prueba estadística o intervalo de confianza, explicados junto con sus límites.

La página oficial pide una serie suficientemente larga para el análisis. Menciona pruebas t, Mann–Kendall e intervalos de confianza como posibles métodos; empezar por tendencias lineales cumple el enfoque planteado. Recomienda datos diarios o mensuales por su facilidad de procesamiento.

## Material preparado

- [Reglas oficiales](REGLAS_OFICIALES.md): cómo se evalúa y qué exige la entrega.
- [Ideas para la herramienta](IDEAS.md): propuestas por validar y una primera señal en los datos de Monterrey.
- [Recursos y descargas](../recursos/README.md): catálogo de los 12 recursos distintos de Giovanni, archivos locales y estado de acceso.
- [Referencia científica y muestra GLDAS](REFERENCIA_CIENTIFICA.md): métodos del artículo NASA y metadatos de la muestra descargada.
- [Pendientes](PENDIENTES.md): decisiones sobre variable, región, periodo y acceso a datos.
- [Giovanni - decisión pendiente](decisiones/GIOVANNI.md): excluido por indicación del equipo, pendiente de nuestra decisión.
- [2026-11-14 - Preparación de recursos](PREPARACION_2026-11-14.md): registro de esta revisión.

Los siete archivos descargados están en `recursos/archivos/`. Hay tres PDF, un notebook, una guía Markdown, una licencia y una muestra CSV. La muestra permite probar la importación y las gráficas; todavía falta seleccionar y descargar la serie larga del caso de demostración.
