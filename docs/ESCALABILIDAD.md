---
tags: [raack, escalabilidad, países, agua]
fecha: 2026-11-15
estado: en GitHub, pendiente de revisión del equipo
---
# Escalabilidad · llevar el caso a cualquier país

[Índice](../INDICE.md) · [Página web](../app/README.md) · [Ideas](IDEAS.md) · [Validación](VALIDACION.md) · [Verificación del caso del agua](DIAGNOSTICO_AGUA.md) · [Pendientes](PENDIENTES.md)

Paso 9 del Caso 001 de la [página web](../app/README.md), en inglés «Take the case to any country». Construido el 15 de noviembre de 2026. El código, los datos y el sitio generado están en GitHub. Quedan el despliegue en GitHub Pages y la revisión de los textos por el equipo.

## De quién es la idea

Es de **Fran**, del 15 de noviembre de 2026. La planteó así: para cumplir la escalabilidad, la página debe decir, país por país, cuántas de las bases de datos que hicieron falta en Nuevo León ya existen allí («cumples 7/10»), de modo que se vea cuánto falta recopilar. Nuevo León es el caso más valioso porque tiene 10 de 10. Pidió también el modo de elegir el país: se selecciona, por ejemplo, Italia, y el mundo gira hasta quedar encima de ella.

Claude (IA) escribió el código, los textos en inglés y español y esta nota. Lo que sigue describe cómo quedó construido; las decisiones abiertas están al final.

## Qué hace

1. La persona elige un país con el buscador, con los botones de ejemplo o pulsando un punto del globo.
2. El globo gira hasta ese país. Es el mismo planeta que abre la página, sin marco, dibujado con el mismo código.
3. Aparece la cuenta, por ejemplo **7 / 10**, con diez cuadros: uno por capa de datos.
4. Debajo, las diez capas una por una: qué tiene Nuevo León y qué hay para el país elegido, con el motivo.
5. Un primer vistazo al agua almacenada bajo ese país, con las dos pruebas del caso.

Nuevo León y el Valle Central de California aparecen como casos (cuadros blancos en el globo). Al elegir México o Estados Unidos, la página avisa de que dentro hay un caso y enlaza con él.

Capturas del 15 de noviembre de 2026, tomadas de la página en local: [Italia, 7 de 10](capturas/1-italia-7-de-10.jpg), [Finlandia, 5 de 10, con los límites de 50° y 60°](capturas/2-finlandia-5-de-10.jpg) y [Nuevo León, 10 de 10](capturas/3-nuevo-leon-10-de-10.jpg).

## Las diez capas

Son las diez piezas de evidencia que usa el caso de Nuevo León. Proceden de **siete fuentes**: cuatro productos abiertos y mundiales y tres registros mexicanos. GLDAS aporta cuatro capas, por eso la página dice «capas de datos» y no «bases de datos».

| N.º | Capa | En Nuevo León | Regla para otro país |
|---|---|---|---|
| 1 | Lluvia de satélite | GPM IMERG Final V07 (NASA) | Abierta entre 60° S y 60° N. Más allá, «en parte»: el producto tiene huecos sobre nieve y hielo |
| 2 | Segundo registro de lluvia | CHIRPS v2.0 (UC Santa Barbara) | Abierta entre 50° S y 50° N. Más allá, «sin cobertura» |
| 3 | Temperatura del aire | GLDAS-2.1 Noah (NASA) | Abierta al norte de 60° S. «En parte» si el país es menor que una celda de 0.25° (unos 770 km²) |
| 4 | Demanda de evaporación | GLDAS-2.1 Noah (NASA) | Igual que la 3 |
| 5 | Humedad del suelo | GLDAS-2.1 Noah (NASA) | Igual que la 3 |
| 6 | Escurrimiento | GLDAS-2.1 Noah (NASA) | Igual que la 3 |
| 7 | Agua almacenada total | GRACE y GRACE-FO, mascons de JPL (NASA) | «En esta herramienta» si el mascon bajo el país tiene tierra: ya está calculada. «Sin cobertura» si ese mascon es mar abierto |
| 8 | Estación meteorológica en tierra | SMN 19052, Observatorio de Monterrey | «Por reunir» |
| 9 | Almacenamiento de presas | CONAGUA: El Cuchillo, Cerro Prieto y La Boca | «Por reunir» |
| 10 | Balance oficial del agua subterránea | Diario Oficial de la Federación, 23 acuíferos | «Por reunir» |

La cuenta suma las capas «en esta herramienta» y las «abiertas hoy». Las reglas están en `app/src/lib/world/layers.ts` y cada límite es la cobertura publicada del producto.

**Para los casos no hay regla:** Nuevo León y el Valle Central se leen de `water.json`. Una capa cuenta como cargada solo si sus series están en el archivo. Por eso Nuevo León da 10 de 10 y el Valle Central, 1 cargada (GRACE) y 6 abiertas.

## Cómo queda el mundo

Con las reglas anteriores, sobre los 243 países y territorios de la lista:

| Capas listas | Países y territorios | Ejemplos |
|---|---|---|
| 7 | 151 | Italia, India, Chile, Sudáfrica, Australia, México |
| 6 | 29 | Alemania, Reino Unido, Canadá, Rusia (sin CHIRPS); varias islas sin señal de GRACE |
| 5 | 9 | Finlandia, Noruega, Suecia, Islandia, Groenlandia |
| 4 | 1 | Islas Feroe |
| 3 | 17 | Malta, Singapur, Andorra, Mónaco |
| 2 | 36 | Islas pequeñas: solo las dos capas de lluvia |

## Primer vistazo al agua almacenada

El repositorio ya guarda el archivo mundial de GRACE. `app/scripts/build_world.py` toma, para cada país, la serie del mascon que queda bajo su punto de referencia y la convierte en valores anuales con la misma receta del caso (sin ciclo estacional, años con al menos 9 meses). La página aplica las dos pruebas del caso.

- 166 países tienen el punto de referencia sobre tierra.
- En 23 el punto cae en el mar y se usa la parte terrestre del mascon costero.
- En 54, casi todos islas pequeñas, el mascon es mar abierto: no hay serie.

Resultado con el archivo generado el 15 de noviembre de 2026 (2003–2026, 21 valores anuales): el agua almacenada **baja en 70 países y sube en 53** con las dos pruebas de acuerdo; 18 muestran un indicio y 48 ninguna tendencia. El motor del navegador da lo mismo que pymannkendall y statsmodels en los 189 países (prueba automática en `app/src/lib/world/world.test.ts`).

## Paso por las cuatro reglas

| Regla | Cómo la cumple | Lo que no cumple o falta |
|---|---|---|
| 1 · El problema existe | El reto pide una herramienta que sirva para elegir región. Hoy la página solo abre dos regiones y no dice qué haría falta para una tercera | No hay una fuente independiente que confirme el primer vistazo de cada país; por eso la página lo llama «primer vistazo, no veredicto» |
| 2 · Es medible | La cuenta sale de reglas escritas y de un archivo guardado. El agua almacenada lleva unidades (cm por década), intervalo del 95 %, valor p y etiqueta | La cobertura se comprueba en un solo punto por país, no en todo su territorio |
| 3 · Con los datos que nos dieron | GRACE, GLDAS e IMERG son de la NASA y están entre los recursos del reto o en el repositorio | La lista de países no es un recurso del reto: se justifica como tabla de nombres, puntos y superficies. No se descargó nada nuevo de internet |
| 4 · Diferenciador | Las herramientas oficiales dan la serie de un punto; ninguna dice qué parte de un diagnóstico completo está lista en cada país ni cuánto falta | Depende de que el equipo lo cuente así en la demo |

## Límites

- **No es una prueba de descarga.** La página no baja IMERG, CHIRPS ni GLDAS de ningún país: aplica la cobertura que publica cada producto.
- **Un punto por país.** El punto de referencia de la lista es aproximado. En países grandes o alargados no representa todo el territorio: Canadá y Rusia tienen su punto en los 60° N.
- **Un mascon no es un país.** Mide unos 330 km de ancho. En países más pequeños la cifra habla de la región que los rodea, y la página lo dice.
- **Los registros en tierra solo se buscaron en México.** «Por reunir» no significa que no existan en otro país.
- **Sin contornos.** El globo marca cada país con un punto. No se dibujan fronteras porque no hay ningún mapa de fronteras en el repositorio.

## De dónde salen los datos

- **Países:** `recursos/archivos/mundo/countries-mledoze-mintsources-2.4.3.json`. Es copia del archivo que trae el paquete `mintsources` 2.4.3 de Linux Mint. Su estructura coincide con el conjunto abierto «countries» de Mohammed Le Doze. Registrado en `recursos/archivos/descargas.json`.
- **GRACE:** el archivo mundial en seis partes de `recursos/archivos/nuevo-leon/grace/`.
- **Salida:** `app/public/data/world.json`, 100 kB, con el tamaño y el SHA-256 de cada entrada.

Para regenerarlo, desde la raíz del repositorio y con el mismo entorno de `build_water.py`:

```bash
.venv/bin/python app/scripts/build_world.py
```

## Movimiento

El equipo donde se construyó tiene las animaciones del sistema desactivadas. Con ese ajuste la página se queda en su versión quieta: la Tierra de la entrada no hace el recorrido y el globo salta al país en vez de girar. Hay tres formas de activar el movimiento: el botón ▶ de la cabecera, el botón «Turn motion on» bajo el globo, o añadir `?motion=full` a la dirección. La elección se recuerda en ese navegador.

## Decisiones para el equipo

1. **«Capas» o «bases de datos».** La página dice «10 data layers» porque cuatro salen de GLDAS. Si se prefiere «databases», la cuenta honesta es 7 fuentes.
2. **Revisar los textos** en inglés y en español: son un primer borrador hecho con IA.
3. **Contornos de países.** Dibujarlos y calcular promedios por país pide descargar un mapa de fronteras (Natural Earth, dominio público, unos 110 kB). No se hizo sin permiso.
4. **Licencia de la lista de países.** El proyecto de origen la publica como ODbL 1.0 y el paquete de Linux Mint como GPL-3+; falta confirmarlo antes de citarla en las referencias de la entrega.
5. **Texturas de la Tierra.** Ver [Pendientes](PENDIENTES.md): los tres mapas del planeta vienen del tutorial de referencia, cuyo repositorio no declara licencia.
