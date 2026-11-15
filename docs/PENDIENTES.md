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
