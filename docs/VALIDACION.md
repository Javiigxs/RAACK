---
tags: [raack, validación, reglas]
fecha: 2026-11-14
---
# Validación de la propuesta · reglas que hay que pasar

[Índice](../INDICE.md) · [Reto](RETO.md) · [Reglas oficiales](REGLAS_OFICIALES.md) · [Ideas](IDEAS.md) · [Funcionalidades y tiempos](FUNCIONALIDADES.md) · [Pendientes](PENDIENTES.md)

Ningún caso de demostración, funcionalidad o conclusión se construye ni se presenta sin pasar estas **cuatro reglas**. Valen para el equipo y para los agentes de IA. Si una regla no se cumple, se cambia la idea, no la regla. Son reglas del equipo; los criterios con los que puntúan los jueces están en [Reglas oficiales](REGLAS_OFICIALES.md).

## 1. El problema existe de verdad

Hay que comprobarlo en dos niveles.

- **El problema del reto:** hoy cuesta elegir una variable que indique cambio y analizarla. Para comprobarlo, intenta responder nuestra pregunta con las herramientas que ya existen (Hydrology Time Series, AppEEARS, KNMI) y anota qué falta y cuántos pasos cuesta.
- **El cambio de nuestro caso:** debe aparecer en los datos **y** en una fuente independiente: un artículo, un informe oficial, otra base de datos o una estación. No basta con que la serie suba o baje. Hay que descartar artefactos: cambios de sensor, nubes, huecos o un mal filtrado de calidad.

**Evidencia mínima:** la gráfica de la serie y el enlace a la fuente independiente.

## 2. Es medible

- Variable con nombre, unidades, producto y versión.
- Lugar definido: un punto (con el tamaño de su píxel) o una región (con cómo se promedia).
- Serie suficientemente larga, como pide la página oficial. **Propuesta inicial del equipo**, ajustable con razones: al menos 15 años de datos mensuales y al menos el 80 % de los meses válidos después de filtrar la calidad.
- Métrica explícita:
  - Dirección del cambio.
  - Tasa de cambio con unidades, por ejemplo °C por década.
  - Incertidumbre con un intervalo.
  - Prueba de significación con sus supuestos: estacionalidad y autocorrelación.
- Reproducible: CSV de entrada guardado en el repo, parámetros anotados y código para recalcular.

## 3. Se puede hacer con los datos que nos dieron

- Los datos salen de los [13 recursos oficiales](../recursos/COBERTURA.md). Si se usa otra fuente, se justifica por escrito.
- Cubren la región elegida. GEO.ca y las imágenes RCM públicas solo sirven en Canadá.
- Llegan a tiempo para el hackathon: al instante, o en cola con margen. Ver [Funcionalidades y tiempos](FUNCIONALIDADES.md).
- Se ha probado de punta a punta con una muestra real antes de construir encima.
- Su uso está permitido: la página oficial pide respetar las condiciones de cada sitio.

## 4. Tiene un diferenciador

Ya hay herramientas que hacen partes del reto:

| Herramienta | Qué ya hace |
|---|---|
| [Hydrology Time Series](../recursos/paginas/01-hydrology.md) | Serie de una variable en un punto, con gráfico y CSV |
| [AppEEARS](../recursos/paginas/02-appeears.md) | Extracción por puntos o áreas con calidad y estadísticas de apoyo |
| [KNMI Climate Explorer](../recursos/paginas/05-knmi.md) | Series, anomalías y tendencias con significación |
| Giovanni | Según la página oficial, series y descargas de muchas variables. Está [pendiente de decisión](decisiones/GIOVANNI.md) |

**Regla:** escribir en una frase qué hace RAACK que estas no hacen y que pide el reto: «A diferencia de X, RAACK…». El diferenciador debe verse en la demostración.

Ideas por validar, no decididas. Están desarrolladas, con su paso por las cuatro reglas, en [Ideas para la herramienta](IDEAS.md):

- **Ayudar a elegir la variable:** el enunciado dice que elegir entre tantas variables es difícil. Por ejemplo, de una pregunta pasar a las variables que indican ese cambio.
- **Comparar regiones con tendencias opuestas lado a lado**, como menciona el enunciado.
- **Explicar en lenguaje claro** si el cambio es significativo, cuánto es y qué no se puede concluir.
- **Cruzar dos variables**, como NDVI y temperatura superficial, para contar qué cambia y dónde.

## Estado del caso de prueba · Monterrey, 14 de noviembre de 2026

Actualizado por la tarde, tras probar el visor de hidrología con el punto de Monterrey.

| Regla | Estado | Qué falta |
|---|---|---|
| 1. El problema existe | **Problema del reto: comprobado.** El visor de NASA dibuja una variable por gráfico, no se le vio ninguna función de tendencia ni de significación y ofrece 172 variables con nombres técnicos ([Funcionalidades](FUNCIONALIDADES.md)). **Cambio de nuestro caso: pendiente** | Una fuente independiente sobre el cambio en Monterrey, como calor o crecimiento urbano, y contrastarla con los datos |
| 2. Es medible | En curso. GLDAS 2.1 en el punto 25,67, −100,31 da 319 meses válidos de 319, de enero de 2000 a julio de 2026. Cálculo preliminar: temperatura del aire +0,39 K por década, significativa; humedad del suelo y evapotranspiración, sin pruebas de tendencia ([Ideas](IDEAS.md)) | Guardar el CSV en el repo y repetir el cálculo desde marzo de 2001. Filtrar y medir los meses válidos de NDVI y temperatura superficial cuando llegue [AppEEARS](SOLICITUD_APPEEARS_MONTERREY.md) |
| 3. Datos que nos dieron | **Sí, probado.** El visor entregó la serie de 26 años en menos de 20 segundos. AppEEARS es oficial y global. NOAA sirve hasta 2011–2012: casi todas las estaciones cercanas terminan ahí. GEO.ca y RCM no aplican | Decidir la región definitiva |
| 4. Diferenciador | Pendiente | Elegir una idea de [Ideas](IDEAS.md) y escribir la frase «A diferencia de…» con palabras del equipo |
