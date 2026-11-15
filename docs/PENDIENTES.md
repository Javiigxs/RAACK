---
tags: [raack, pendientes]
fecha: 2026-11-14
---
# Pendientes de RAACK

## Decisiones del equipo

- [ ] **Giovanni como herramienta del proyecto: pendiente de nuestra decisión.** El 14 de noviembre de 2026 se autorizó únicamente su servicio para descargar las siete variables GLDAS. Ver la actualización en [Giovanni](decisiones/GIOVANNI.md).
- [ ] Elegir la idea de la herramienta entre las [propuestas](IDEAS.md) y escribir la frase diferenciadora con palabras del equipo. La guía oficial pide que la idea sea del equipo, no de una IA.
- [ ] Decidir el formato de la demo: vídeo de 30 segundos o 7 diapositivas ([Reglas oficiales](REGLAS_OFICIALES.md)).
- [ ] Elegir una o dos variables para la primera demostración.
- [ ] Definir región o puntos comparables, periodo y frecuencia temporal.
- [ ] Decidir si la región está en Canadá: de eso depende usar GEO.ca y RCM. Ver [Cobertura de los 13 recursos](../recursos/COBERTURA.md).
- [ ] Pasar la [validación de la propuesta](VALIDACION.md) antes de elegir el caso final: problema real, medible, hecha con los datos que nos dieron y con un diferenciador.
- [ ] Elegir la fuente principal de datos y el método para comunicar tasa de cambio e incertidumbre.

## Datos y acceso

- [x] Descargar series largas: siete variables GLDAS en dos puntos de marzo de 2001 a julio de 2026, además de GRACE regional. Ver [descargas de Nuevo León](REQUISITOS_DATOS_NUEVO_LEON.md).
- [ ] Confirmar unidades, versión, calidad, cobertura y cita del producto seleccionado.
- [x] Crear la cuenta NASA Earthdata del equipo (14 de noviembre de 2026).
- [x] Probar que Hydrology Time Series entrega una serie larga de Monterrey: 26 años en menos de 20 segundos (14 de noviembre de 2026). Ver [Funcionalidades y tiempos](FUNCIONALIDADES.md).
- [x] Guardar GLDAS 2.1 de Monterrey desde marzo de 2001, tras el cambio de insumos, con originales y mensuales registrados en `descargas.json`. No se repitieron enero de 2000–febrero de 2001.
- [ ] Repetir con el CSV el cálculo preliminar de tendencias de [Ideas](IDEAS.md), desde marzo de 2001.
- [ ] Buscar una fuente independiente sobre el cambio en Monterrey, como pide la regla 1 de [Validación](VALIDACION.md).
- [ ] Verificar en el artículo original la fórmula de «años que faltan» antes de usarla ([Ideas](IDEAS.md), idea 6).
- [ ] Si se quiere SWOT: localizar el identificador de un embalse o río de la zona ([ficha 10](../recursos/paginas/10-swot.md)).
- [ ] Revisar el resultado de la [solicitud de prueba AppEEARS en Monterrey](SOLICITUD_APPEEARS_MONTERREY.md) (NDVI y temperatura 2001–2025) y probar con ella la importación y el cálculo de tendencias.
- [ ] Pedir los demás accesos que hagan falta una vez elegidos variable, región y periodo: verificación de KNMI o registro en EODMS. El token de NOAA ya no hace falta. Qué pedir y para qué: [Bases de datos que hay que pedir](SOLICITUDES_DE_DATOS.md).
- [ ] Si se quiere un mapa de «dónde cambia», enviar el 14 de noviembre la solicitud de área en AppEEARS: tarda más que la de puntos.
- [ ] Si se necesitan, resolver las descargas bloqueadas del ZIP SAR y las muestras NOAA; ver [Recursos y descargas](../recursos/README.md).
- [ ] Si se usa el notebook SAR, adaptar rutas y reunir sus datos externos. La guía QGIS conserva imágenes remotas.

## Criterios que debe cubrir la herramienta

- [ ] Selección comprensible de variable y región.
- [ ] Visualización temporal con fechas y unidades.
- [ ] Dirección y tasa de cambio.
- [ ] Prueba o intervalo de confianza con límites explicados.
- [ ] Procedencia de los datos y posibilidad de reproducir el resultado.
- [ ] Definiciones sencillas de las variables y un par de ejemplos de demostración, como sugiere la página oficial ([Reto](RETO.md)).

## Entrega oficial · domingo 15 de noviembre de 2026, 23:59 hora local

Detalle en [Reglas oficiales](REGLAS_OFICIALES.md).

- [ ] Pasar a inglés lo que se vaya a enlazar: portada del repositorio, textos de la herramienta y demo.
- [ ] Preparar la demo sin pasarse del límite: 30 segundos de vídeo o 7 diapositivas.
- [ ] Escribir la declaración de uso de IA y marcar lo generado con IA.
- [ ] Reunir las referencias: datos de NASA, datos de agencias socias, bibliotecas, imágenes y textos.
- [ ] Probar los enlaces públicos en una ventana privada.
- [ ] Completar todos los campos de la página del proyecto y pulsar **Submit for Judging** con margen.

## Actualización del 14 de noviembre de 2026, por la noche · caso del agua

Según el encargo de Fran, el equipo eligió la idea «detective del ciclo del agua». Está construida en la [página web](../app/README.md) como Caso 001 y funciona en local. Lo que queda es del equipo:

- [ ] Revisar los textos de la página en inglés y en español: son un primer borrador hecho con IA.
- [ ] Decidir qué cifra de GRACE se cita: −7.1 cm por década (años reales, la que muestra la página) o −8.5 (script original). Ver la [verificación](DIAGNOSTICO_AGUA.md).
- [ ] Poner los nombres del equipo en los créditos de la página y en la demo.
- [ ] Elegir el formato de la demo y terminarla a partir de los [borradores](ENTREGA_BORRADORES.md).
- [ ] Publicar el sitio: subir `app/` y `site/` a GitHub y activar GitHub Pages (lo hace quien administra el repositorio).
- [ ] Opcional: guardar la lluvia del Valle Central (IMERG y CHIRPS) en `recursos/archivos/valle-central/` y volver a ejecutar `app/scripts/build_water.py`. Sin esos archivos la página no muestra esas cifras.
- [ ] Opcional: guardar los datos del norte de México, Ciudad del Cabo y el Alto Madeira si se quieren mostrar. Hoy no están en el repositorio.

## Actualización del 15 de noviembre de 2026 · escalabilidad por país y diseño

Fran propuso que la página cuente, país por país, cuántas capas de datos del caso de Nuevo León ya existen. Está construido como paso 9 del Caso 001 y funciona en local: ver [Escalabilidad](ESCALABILIDAD.md). Lo que queda:

- [ ] **Texturas de la Tierra: permiso sin confirmar.** Los tres mapas del planeta (`app/public/earth/`) vienen del tutorial de referencia de la entrada (Robinzon100, «3D hero»). La guía que acompañaba al zip de diseño indica que ese repositorio no declara licencia. Las reglas de Space Apps piden no usar material sin permiso y citar todo lo externo. Opciones: pedir permiso al autor, o sustituirlos por los mapas Blue Marble y Black Marble de la NASA, de uso libre. Lo segundo pide descargar archivos y no se ha hecho.
- [ ] Decidir si la página dice «10 data layers» (como está) o «databases»: las diez capas salen de siete fuentes.
- [ ] Revisar los textos del paso 9 en inglés y en español: son un primer borrador hecho con IA.
- [ ] Decidir si el paso 9 entra en la demo y cómo se cuenta. Hay un borrador en los [borradores de la entrega](ENTREGA_BORRADORES.md).
- [ ] Confirmar la licencia de la lista de países antes de citarla en las referencias (ODbL 1.0 según el proyecto de origen; GPL-3+ el paquete de Linux Mint).
- [ ] Opcional: descargar un mapa de fronteras (Natural Earth, dominio público) para dibujar el contorno del país y promediar GRACE en todo su territorio. No se hizo sin permiso.
- [ ] Al grabar la demo en un equipo con las animaciones del sistema desactivadas, activar el movimiento con el botón ▶ de la cabecera o con `?motion=full`.
- [ ] Publicar: `app/`, `site/`, `recursos/archivos/mundo/` y las notas nuevas siguen solo en el clon local.
