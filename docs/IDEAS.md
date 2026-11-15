---
tags: [raack, ideas, diferenciador]
fecha: 2026-11-14
estado: propuestas-sin-decidir
---
# Ideas para la herramienta · propuestas por validar

[Índice](../INDICE.md) · [Reto](RETO.md) · [Validación de la propuesta](VALIDACION.md) · [Reglas oficiales](REGLAS_OFICIALES.md) · [Funcionalidades y tiempos](FUNCIONALIDADES.md)

**Qué es esta nota.** Una lista de ideas para discutir, escrita el 14 de noviembre de 2026 por un agente de IA (Claude) a petición del equipo. **No hay nada decidido.** La guía oficial pide que la IA no se use para idear la solución ([Reglas oficiales](REGLAS_OFICIALES.md)): el equipo debe elegir, cambiar y formular su propia idea, y declarar este uso de IA. Casi todas las ideas desarrollan frases del enunciado oficial o las cuatro ideas que el equipo ya había apuntado en [Validación](VALIDACION.md).

## De dónde salen

| Lo que dice la página oficial ([Reto](RETO.md)) | Idea que lo desarrolla |
|---|---|
| El concepto es que el usuario se vuelva «detective de datos» | Hilo conductor: el expediente |
| Unas pocas preguntas sobre qué o dónde investigar llevan a las variables | 1 · Preguntas guía |
| Hay tantas variables que cuesta elegir las que indican cambio | 2 · Rueda de reconocimiento |
| Paso 4 de la lista de la [portada](../README.md): «¿parece que hay tendencia?» | 3 · Ojo contra estadística |
| Probar con prueba t, Mann–Kendall o intervalos de confianza | 4 · Jurado de tres |
| Algunas tendencias no se ven sin quitar el ciclo estacional | 5 · Coartadas |
| Una tendencia no significativa también interesa; a veces solo falta más tiempo | 6 · ¿Cuántos años faltan? |
| La misma variable sube en una región y baja en otra | 7 · Gemelos opuestos |
| Variables medidas por misiones o producidas por modelos | 8 · Dos testigos |
| Serían muy útiles un par de ejemplos de demostración que el usuario pueda ver | 9 · Casos resueltos |
| Dar definiciones sencillas de las variables | 1 y 10 |

## Primera señal en los datos · preliminar

El 14 de noviembre de 2026 se cargó en el visor [Hydrology Time Series](../recursos/paginas/01-hydrology.md) el punto 25,67, −100,31 (Monterrey) con GLDAS Noah 2.1, de enero de 2000 a julio de 2026. Cada serie tiene 319 meses válidos de 319. Con las anomalías mensuales se calculó una tendencia de prueba:

| Variable | Tendencia por década | Intervalo del 95 % | Mann–Kendall, p | Lectura |
|---|---|---|---|---|
| Temperatura del aire `Tair_f_inst` | +0,39 K | +0,15 a +0,62 K | 0,00002 · ajustada 0,001 | Sube y es significativa |
| Humedad del suelo en la zona de raíces `RootMoist_inst` | −1,8 kg m⁻² (−1,6 %) | −11,3 a +7,6 kg m⁻² | 0,23 · ajustada 0,74 | Sin pruebas de tendencia. Años secos: 2011–2012 y 2022–2023 |
| Evapotranspiración `Evap_tavg` | −0,7 % | −8,9 a +7,6 % | 0,44 · ajustada 0,69 | Sin pruebas de tendencia |

**Límites de este cálculo.** Se hizo en el navegador con los datos que dibuja el visor, sin guardar ningún CSV; no es reproducible todavía. El intervalo y la p «ajustada» corrigen la autocorrelación de forma aproximada. Hay que repetirlo con el CSV en el repo y desde marzo de 2001, porque GLDAS-2.1 cambió sus datos de entrada ese mes ([ficha 01](../recursos/paginas/01-hydrology.md)). Ninguna cifra dice por qué cambia la temperatura.

Sirve para dos cosas: confirma que hay un caso con tendencia significativa y otro sin ella en el mismo lugar, y que los datos llegan al instante.

## Hilo conductor · el expediente

Cada análisis es un caso de detective que recorre los cinco pasos de la lista de la [portada del repositorio](../README.md). La metáfora no es adorno: cada paso del detective es una comprobación científica, y juntos son las [cuatro reglas de validación](VALIDACION.md) del equipo aplicadas a cualquier análisis del usuario.

| Paso del detective | Qué hace la herramienta | Paso de la portada |
|---|---|---|
| La pregunta | Preguntas guía en lenguaje claro | 1 · variable |
| Los sospechosos | Variables candidatas con su definición sencilla | 1 · variable |
| La escena | Punto o región en el mapa | 2 · región |
| La línea de tiempo | Periodo y serie dibujada | 3 y 4 · serie |
| El interrogatorio | Pendiente y pruebas de significación | 5 · significación |
| Las coartadas | Estacionalidad, autocorrelación, artefactos, periodo elegido | 5 · significación |
| Los testigos | Otra fuente independiente sobre el mismo lugar | Regla 1 del equipo |
| El veredicto | Qué cambió, cuánto, con qué seguridad y qué no se puede concluir | Resultado |

## Ideas

### 1 · Preguntas guía hacia los sospechosos

- **Qué hace:** el usuario responde qué le preocupa (calor, sequía, lluvia, vegetación, agua, nieve) y dónde. La herramienta propone las variables que podrían delatar ese cambio, cada una con una definición de una frase, su producto, su periodo y si llega al instante o en cola.
- **Datos:** un catálogo pequeño hecho con lo comprobado: 172 variables del visor de hidrología y 193 productos de AppEEARS ([Funcionalidades](FUNCIONALIDADES.md)).
- **Nota:** basta una tabla de palabras clave. Si se usa un modelo de lenguaje para interpretar la pregunta, solo debe elegir entre variables del catálogo, y hay que declararlo.

### 2 · Rueda de reconocimiento

- **Qué hace:** aplica la misma prueba a varias variables del mismo lugar y las ordena por fuerza de la evidencia: cuánto cambia respecto a su variabilidad y con qué seguridad. Cada variable sale como «con pruebas», «con indicios», «sin pruebas» o «datos insuficientes».
- **Por qué es distinto:** el visor de NASA dibuja una variable por gráfico y no calcula tendencias; comparar tres variables costó tres búsquedas y un cálculo aparte.
- **Ejemplo real:** la tabla preliminar de arriba es una rueda de tres sospechosos.
- **Cuidado:** al probar muchas variables, alguna saldrá significativa por azar. Hay que corregir las comparaciones múltiples, como avisa la [ficha 07](../recursos/paginas/07-significancia.md).

### 3 · Ojo contra estadística

- **Qué hace:** antes de enseñar el resultado, pide al usuario que dibuje sobre la gráfica la línea que cree ver, o que elija «sube», «baja» o «no se sabe». Después muestra la tendencia calculada con su intervalo y cuánto se acercó.
- **Por qué:** es el paso 4 de la portada seguido del paso 5. Enseña por qué hace falta la prueba: el ciclo estacional esconde tendencias y el ruido las inventa.
- **Esfuerzo:** bajo; es interfaz sobre el mismo cálculo.

### 4 · Jurado de tres y veredicto en lenguaje claro

- **Qué hace:** los tres métodos que nombra la página oficial votan por separado: la prueba t de la pendiente, Mann–Kendall con pendiente de Sen y un intervalo de confianza. Si coinciden, el veredicto es firme; si no, «jurado dividido».
- **Veredicto:** una frase generada con plantilla, en español e inglés. Ejemplo con el dato preliminar: «En Monterrey, la temperatura del aire subió unos 0,4 K por década entre 2000 y 2026. Es muy poco probable ver algo así por azar. Esto no dice por qué subió».
- **Escala en vez de sí o no:** pruebas sólidas, indicios, sin pruebas, datos insuficientes. Evita leer «significativo» como «grande» o «causado por».

### 5 · Coartadas

Una tendencia solo se da por buena si aguanta estas comprobaciones, que la herramienta muestra una a una:

- **Estaciones:** con y sin ciclo estacional.
- **Autocorrelación:** el valor de un mes se parece al del anterior, y eso hace parecer más segura una tendencia. En la humedad del suelo la p pasó de 0,23 a 0,74 al corregirlo.
- **Periodo elegido:** un mapa triangular con la pendiente para todas las combinaciones de año inicial y final. Deja ver si el resultado depende de dónde se empieza a contar.
- **Artefactos conocidos del producto:** avisos sacados de sus metadatos, como el cambio de datos de entrada de GLDAS-2.1 en marzo de 2001 o los filtros de calidad de MODIS.

### 6 · ¿Cuántos años faltan?

- **Qué hace:** si una tendencia no es significativa, estima cuántos años de datos harían falta para detectar una tendencia de ese tamaño con ese ruido. El caso no se cierra: queda «abierto».
- **Ejemplo con los datos preliminares:** temperatura, unos 28 años, y hay 26,6: está en el umbral y ya sale significativa. Humedad del suelo, unos 110 años. Evapotranspiración, unos 200.
- **Por comprobar:** las cifras usan la fórmula de Weatherhead et al. (1998), citada de memoria por el agente. Hay que verificarla en el artículo antes de usarla.
- **Complemento:** GLDAS-2.0 cubre 1948–2014 en el mismo visor. Permite enseñar cómo cambia el veredicto con una serie más larga.

### 7 · Gemelos opuestos

- **Qué hace:** pone lado a lado dos lugares donde la misma variable va en sentidos contrarios, y busca sola la pareja más opuesta entre los puntos del usuario.
- **Datos:** los cinco puntos de la [solicitud de AppEEARS en Monterrey](SOLICITUD_APPEEARS_MONTERREY.md): centro, sierra, expansión urbana, zona industrial reciente y periferia, con NDVI y temperatura superficial de día y de noche.
- **Estado:** hipótesis. Hasta que lleguen los datos no se sabe si hay tendencias opuestas.

### 8 · Dos testigos

- **Qué hace:** compara la tendencia de un mismo lugar según fuentes distintas: una misión (temperatura superficial MODIS), un modelo (GLDAS o MERRA-2) y estaciones en tierra (NOAA). Si coinciden en sentido y ritmo, sube el nivel de prueba; si no, se avisa.
- **Por qué:** el enunciado habla de variables «medidas por misiones o producidas por modelos», y es la regla 1 del equipo hecha función.
- **Límite:** cerca de Monterrey casi todas las estaciones de NOAA terminan en 2011 o 2012 ([ficha 03](../recursos/paginas/03-cdo.md)). Sirven de testigo hasta entonces.

### 9 · Casos resueltos

- **Qué hace:** dos o tres casos ya montados que el usuario puede reproducir paso a paso, como pide la página oficial.
- **Candidatos:** «Monterrey se calienta» (con pruebas), «¿Se seca Monterrey?» (sin pruebas, con sequías visibles y más de un siglo para confirmarlo) y «gemelos opuestos» cuando llegue AppEEARS.
- **Doble uso:** son el guion de la demo de 30 segundos o de las 7 diapositivas.

### 10 · Ficha del sospechoso, rayas y sonido

- **Ficha:** una tarjeta por hallazgo, lista para compartir: variable, definición sencilla, lugar, ritmo de cambio y nivel de prueba.
- **Rayas:** una franja de color por año según su anomalía. Se entiende de un vistazo.
- **Sonido:** la serie convertida en tonos, para oír la tendencia. Ayuda a personas con baja visión.

### 11 · Expediente reproducible

- **Qué hace:** cada resultado se exporta como un archivo pequeño con producto, versión, DOI, punto, periodo, filtros, método, cifras y la suma SHA-256 del CSV de entrada.
- **Por qué:** es la «cadena de custodia» de la prueba. El equipo ya registra SHA-256 en [descargas.json](../recursos/archivos/descargas.json).

### 12 · El agua, con SWOT

- **Qué hace:** nivel de un embalse o río desde 2023 con Hydrocron, que respondió al instante y sin cuenta ([ficha 10](../recursos/paginas/10-swot.md)).
- **Por qué:** usa un recurso de una agencia socia, que la guía recomienda. La serie es corta, así que la propia herramienta dirá «datos insuficientes para hablar de tendencia» y cuántos años faltan.
- **Falta:** localizar el identificador de los embalses de Monterrey. No se ha comprobado que SWOT los observe.

### 13 · Mapa de sospecha

- **Qué hace:** pendiente por píxel en una región, con marcas donde es significativa. Responde «dónde cambia».
- **Coste:** necesita una solicitud de área en AppEEARS, que tarda más. Solo es viable si se envía el 14 de noviembre.

## Paso por las cuatro reglas

| Idea | 1 · Problema real | 2 · Medible | 3 · Con los datos que nos dieron | 4 · Diferenciador |
|---|---|---|---|---|
| 1 Preguntas guía | Sí: 172 variables con nombres técnicos en el visor | Sí: variables del catálogo | Sí, instantáneo | Ninguna herramienta oficial parte de una pregunta |
| 2 Rueda de reconocimiento | Sí: una variable por gráfico | Sí: pendiente, intervalo y p por variable | Sí, instantáneo | Ninguna compara variables por evidencia |
| 3 Ojo contra estadística | Sí: paso 4 de la portada | Sí: distancia entre lo dibujado y lo calculado | Sí | Nueva forma de enseñar la prueba |
| 4 Jurado de tres | Sí: «significativo» se malinterpreta | Sí | Sí | KNMI calcula, pero no explica ni gradúa |
| 5 Coartadas | Sí: autocorrelación y artefactos comprobados | Sí | Sí | No existe en las herramientas oficiales |
| 6 ¿Cuántos años faltan? | Sí: lo dice la página oficial | Sí, tras verificar la fórmula | Sí | No existe en las herramientas oficiales |
| 7 Gemelos opuestos | Por comprobar con los datos | Sí | En cola: AppEEARS | Lo menciona el enunciado; nadie lo busca solo |
| 8 Dos testigos | Sí: regla 1 del equipo | Sí | Sí, con estaciones hasta 2011–2012 | Cruza fuentes que hoy están en portales distintos |
| 9 Casos resueltos | Sí: lo pide la página oficial | Sí | Sí | Apoya a las demás |
| 12 SWOT | Por comprobar | Serie corta | Falta el identificador del embalse | Dato de agencia socia |
| 13 Mapa | Por comprobar | Sí | En cola y lento | Parcial: AppEEARS ya da mapas, sin tendencia |

La evidencia de la regla 1 para el visor y AppEEARS está en [Funcionalidades](FUNCIONALIDADES.md). Falta la fuente independiente sobre el cambio en Monterrey.

## Qué da más por menos

Orden sugerido para día y medio, a decidir por el equipo:

1. **Núcleo, con datos instantáneos de GLDAS:** expediente con las ideas 1, 2 y 4. Cumple el reto completo: variable, región, periodo, serie y significación.
2. **Lo que más distingue con poco código:** ideas 3, 5 y 6.
3. **Cuando llegue AppEEARS:** ideas 7 y 8.
4. **Presentación:** idea 9 como guion de la demo, y la ficha de la idea 10.
5. **Solo si sobra tiempo:** ideas 11, 12 y 13.

Criterio oficial que empuja cada grupo: el núcleo da *Relevance*; las coartadas, el jurado y los testigos dan *Validity*; la rueda, el ojo contra estadística y los años que faltan dan *Creativity*; los casos resueltos y la ficha dan *Presentation*; el caso de Monterrey, con calor y agua, da *Impact* local.

## Frase diferenciadora · borrador

Para que el equipo la reescriba con sus palabras, como pide la regla 4:

> A diferencia de Hydrology Time Series y AppEEARS, que entregan la serie, y de KNMI Climate Explorer, que calcula la tendencia para quien ya sabe pedirla, RAACK lleva a un estudiante desde una pregunta hasta un veredicto: compara varias variables sospechosas, somete cada tendencia a sus coartadas y dice en lenguaje claro qué cambió, cuánto, con qué seguridad y qué no se puede concluir.

## Riesgos

- **Muchas pruebas a la vez:** corregir comparaciones múltiples en la rueda de reconocimiento y en el mapa.
- **Horas del visor:** el CSV del visor desplaza las horas según el huso del navegador. Trabajar con medias mensuales lo hace inofensivo ([ficha 01](../recursos/paginas/01-hydrology.md)).
- **Cuota del visor:** avisa de un límite mensual con peticiones grandes; una petición horaria de 26 años falló.
- **Idioma:** la página del proyecto y lo enlazado deben estar en inglés.
- **Giovanni** sigue [excluido y pendiente de decisión](decisiones/GIOVANNI.md).

## Propuestas de Fran · 14 de noviembre de 2026

Fran planteó dos preguntas para el detective en los mensajes de las 16:12. El equipo aún debe decidir cuáles llevará a la demo.

1. **¿Qué cambios desaparecen al mirar un año entero?** Dos años pueden recibir casi la misma lluvia y diferir en cuántos días llueve, cuánta agua cae de golpe y cuánto dura la racha seca más larga. Fran propone alternar entre una vista anual y lo que ocurrió dentro del año, y explorar el mismo principio con calor y sequías.
2. **¿Se adelantan, se retrasan o se acortan los ciclos naturales?** Fran propone investigar cambios en el calendario. Para ponerlo a prueba se pueden seguir, año a año, las fechas en que se acumula cierta parte de la lluvia o el mes de máximo verdor. Cada indicador necesita una definición y suficiente cobertura en la época que se compara.

El [mapa de datos para estas propuestas](MAPA_DE_DATOS.md) reúne las series por variable, un ejemplo para la demo, las reglas de calidad y el estado de validación. La propuesta de Fran y la pregunta del equipo sobre la fiabilidad de los datos se complementan: después de descubrir un patrón, se puede comprobar si también aparece en la estación cercana. Codex organizó los datos y redactó esta actualización a partir de los mensajes del equipo.

## Propuesta de Fran · 15 de noviembre de 2026 · escalabilidad por país

Fran propuso, para cubrir la escalabilidad, que la página diga país por país cuántas de las bases de datos que hicieron falta en Nuevo León ya existen allí, por ejemplo «7/10», de modo que se vea cuánto falta recopilar. Nuevo León sería el caso más valioso, con 10 de 10, y el Valle Central de California el segundo caso. Pidió elegir el país en un globo interactivo: al seleccionar Italia, el mundo gira hasta quedar encima de ella.

Está construida como paso 9 del caso del agua y funciona en local. Qué hace, las reglas de la cuenta, su paso por las cuatro reglas y lo que falta decidir están en [Escalabilidad](ESCALABILIDAD.md). Claude (IA) escribió el código y los textos; la idea y la forma de presentarla son de Fran. El equipo aún no ha revisado los textos ni ha decidido si entra en la demo.
