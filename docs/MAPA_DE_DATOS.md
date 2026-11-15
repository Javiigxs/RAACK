# Qué oculta un año de datos en Monterrey

El 14 de noviembre de 2026 Fran propuso dos investigaciones: descubrir cambios que un resumen anual oculta y comprobar si los ciclos naturales cambian de fecha o duración. La primera se puede demostrar con lluvia diaria. Para la segunda, las fechas de acumulación de lluvia se pueden calcular ya; el ciclo de verdor requiere más control de los meses faltantes. Las dos propuestas siguen abiertas a la decisión del equipo. [Mensajes de Fran resumidos en Ideas](IDEAS.md).

## Qué archivo abrir

Las series de trabajo están separadas por variable física. La fuente y el lugar se conservan para que la app pueda mostrarlos al elegir el caso **México → Monterrey**. La lluvia de un píxel y la de una estación ocupan filas diferentes. Los originales se identifican mediante el [manifiesto de descargas](../recursos/archivos/descargas.json).

| Serie de trabajo | Qué representa | Qué se puede investigar |
|---|---|---|
| [Lluvia diaria](../datos/series/lluvia_diaria.csv) | mm diarios en la celda IMERG de 0,1° y en el pluviómetro SMN 19052. Periodo común de consulta 2002–2024. | Días húmedos, intensidad, concentración y duración de rachas secas. Comparar ambas fuentes en periodos con datos válidos y atender al corte del día. |
| [Temperatura del aire diaria](../datos/series/temperatura_aire_diaria.csv) | Máxima y mínima diarias del aire en la estación SMN, en °C, 2002–2024. | Elegir un umbral local documentado, contar días calurosos y estudiar cuántos días consecutivos dura un episodio. Revisar la cobertura de máxima y mínima por separado. |
| [Humedad mensual en las raíces](../datos/series/humedad_raices_mensual.csv) | Índice modelado MERRA-2, de 0 a 1, en una celda de 0,5° × 0,625°. Hay 276 meses, 2002–2024. | Contrastar varios meses de poca lluvia con suelo inusualmente seco para esa época. La resolución permite hablar de meses, y la clasificación oficial de sequía requiere más indicadores. |
| [Temperatura superficial de día y noche](../datos/series/temperatura_superficial_8dias.csv) | MODIS MOD11A2. Compuestos de ocho días, píxeles de 1 km en cinco puntos, 2001–2025. | Comparar superficies en las mismas fechas, usando la calidad de día y noche por separado. Para contar días de calor usar la serie diaria del aire. |
| [Verdor mensual](../datos/series/vegetacion_ndvi_mensual.csv) | Índice de vegetación NDVI de MODIS MOD13A3, adimensional, 1 km, cinco puntos, 2001–2025. | Describir el mes con mayor verdor, la amplitud estacional y, donde haya cobertura, el tiempo que el índice permanece elevado. Un píxel puede contener distintas coberturas. |

El [script de separación](separar_series.py) genera las cinco tablas a partir de los originales. `fila_en_origen=0` significa que faltaba el registro de esa fecha y lugar. Cuando la fila sí existe, un valor vacío indica que falta esa medición. En lluvia, cero es una observación válida. Las banderas de calidad de MODIS se conservan para elegir observaciones aptas para cada pregunta. La [solicitud AppEEARS](SOLICITUD_APPEEARS_MONTERREY.md) identifica los puntos. El [análisis previo de lluvia](LLUVIA_MONTERREY.md) documenta los productos y el contraste con el observatorio.

Para regenerar las series y el resumen anual desde la raíz del proyecto:

```sh
python3 docs/separar_series.py
python3 docs/calcular_calendario_lluvia.py
```

En las series diarias, la fila `fuente=SMN` y `sitio=19052` corresponde a `SMN-19052` en el resumen anual. Los nombres de los cinco sitios MODIS se conservan tal como los devolvió AppEEARS.

La [muestra de evapotranspiración GLDAS](../recursos/archivos/gldas-evapotranspiracion-muestra-2016-05.csv) procede de otro punto y solo contiene una semana. Está separada de las series de Monterrey. Los PDF, cuadernos de ejemplo, metadatos y listas de gránulos del [catálogo de recursos](../recursos/README.md) sirven para interpretar los datos.

## Demo de Fran: del total anual al calendario

La [tabla anual de lluvia](../datos/derivados/lluvia_anual.csv) tiene una fila por año y fuente. El [cálculo](calcular_calendario_lluvia.py) conserva los 23 años de cada fuente; 23 de IMERG y 12 del observatorio tienen todos sus días. Los años incompletos conservan el recuento de cobertura y los indicadores anuales quedan vacíos. Así un hueco no alarga una racha seca.

| Qué ve el usuario en el píxel de Monterrey | 2016 | 2020 |
|---|---:|---:|
| Vista anual: lluvia total | 806,12 mm | 795,55 mm |
| Frecuencia: días con al menos 1 mm | 89 | 62 |
| Intensidad: media de lluvia en esos días | 8,78 mm | 12,62 mm |
| Concentración: fracción del total en los cinco días más lluviosos | 28,5 % | 51,7 % |
| Duración: racha más larga con menos de 1 mm al día, dentro del año | 53 días | 67 días |
| Calendario: fecha en que se alcanzó la mitad del total | 14 de agosto | 26 de julio |
| Días transcurridos entre alcanzar el 20 % y el 80 % del total | 132 | 46 |

**Lectura para la demo.** En 2020 llovieron apenas 10,57 mm menos que en 2016, pero hubo 27 días húmedos menos. Dos controles posibles en la interfaz en inglés son **Annual total** y **Daily pattern**. El primero muestra milímetros acumulados; el segundo, el calendario y los cinco días que más contribuyeron. Una tercera acción, **Compare with the rain gauge**, permite comprobar el mismo periodo en el observatorio. Si falta cobertura, se muestra cuántos días faltan. La celda satelital y el pluviómetro representan superficies diferentes.

## ¿Cambian de fecha los ciclos?

**Lluvia.** Para cada año, ordenar los días y señalar cuándo el acumulado llega al 20 %, 50 % y 80 % del total. El intervalo 20–80 % describe en cuánto tiempo llegó la parte central del agua. Una sola tormenta puede acortarlo y puede haber dos periodos lluviosos. Por eso no permite fechar por sí solo el inicio y final de la temporada. En 2020 se alcanzó el 50 % 19 días antes que en 2016. En toda la serie IMERG, la tendencia exploratoria de esa fecha fue de −7,5 días por década (IC del 95 % de −29,2 a +13,3; p = 0,46). Se usó pendiente de Sen y Kendall bilateral con 23 años, comparando mes y día en un mismo calendario bisiesto, sin ajuste por dependencia entre años. Los datos admiten tanto un adelanto como un retraso.

**Vegetación.** En el original MODIS hay 300 meses por punto. Para una primera prueba se exigió NDVI entre −0,2 y 1, fiabilidad del píxel igual a 0 y bits MODLAND 0–1 de VI Quality iguales a 00. Pasan 771 de 1.500 registros. Pesquería conserva 3 años con 12 meses válidos, Chipinque y Valle Alto 1 cada uno y García y Macroplaza 0. En los tres años completos de Pesquería (2004, 2006 y 2012), el NDVI máximo cayó en octubre. Para sostener un cambio de calendario hay que validar cómo identificar el inicio y el fin, comprobar la cobertura cerca de esas fechas y contrastarlo con registros independientes del ciclo local. La precisión del producto es mensual.

## Estado frente a las cuatro reglas

| Regla del equipo | Cambios ocultos dentro del año | Calendario de ciclos |
|---|---|---|
| Existe el problema | Dos totales casi iguales ocultan distribuciones distintas; hay episodios locales documentados y contraste con el SMN. | La fecha en que se acumula la lluvia varía entre años. Sigue pendiente demostrar un desplazamiento sostenido y validarlo de forma independiente. |
| Se puede medir | Frecuencia, intensidad y rachas salen de días con cobertura conocida. | La fecha del 50 % y el tramo 20–80 % son reproducibles. En verdor, la calidad limita cuántos calendarios pueden compararse. |
| Se hace con los datos del reto | IMERG es la fuente principal. El SMN aporta el contraste local complementario. | IMERG y el NDVI MODIS de AppEEARS están disponibles. Para interpretar el ciclo ecológico se requiere evidencia local adicional. |
| Aporta algo distinto | Frente al visor de una variable, la demo explica cómo dos años parecidos por total pueden ser muy diferentes para alguien que depende de cuándo llueve. | El detector mostraría fechas, duración e incertidumbre en lugar de limitarse al valor medio. Falta probar su utilidad con usuarios. |

**Autoría.** Las dos propuestas de producto son de Fran. Codex organizó las series, calculó los ejemplos y redactó esta nota interna. Los valores proceden de NASA y del SMN.
