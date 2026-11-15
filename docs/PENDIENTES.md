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
- [ ] Activar GitHub Pages y probar el enlace público de la demo. El código y el sitio generado ya están en GitHub.
- [ ] Opcional: guardar la lluvia del Valle Central (IMERG y CHIRPS) en `recursos/archivos/valle-central/` y volver a ejecutar `app/scripts/build_water.py`. Sin esos archivos la página no muestra esas cifras.
- [ ] Opcional: guardar los datos del norte de México, Ciudad del Cabo y el Alto Madeira si se quieren mostrar. Hoy no están en el repositorio.

## Actualización del 15 de noviembre de 2026 · escalabilidad por país y diseño

Fran propuso que la página cuente, país por país, cuántas capas de datos del caso de Nuevo León ya existen. Está construido como paso 9 del Caso 001 y funciona en local: ver [Escalabilidad](ESCALABILIDAD.md). Lo que queda:

- [ ] **Texturas de la Tierra: permiso sin confirmar.** Los tres mapas del planeta (`app/public/earth/`) vienen del tutorial de referencia de la entrada (Robinzon100, «3D hero»). La guía que acompañaba al zip de diseño indica que ese repositorio no declara licencia. Las reglas de Space Apps piden no usar material sin permiso y citar todo lo externo. El 15 de noviembre de 2026, tras comparar el globo actual con una vista previa local de Blue Marble y Black Marble de la NASA, Fran eligió conservar el actual en GitHub. Queda obtener el permiso del autor para usar estas texturas en la entrega.
- [ ] Decidir si la página dice «10 data layers» (como está) o «databases»: las diez capas salen de siete fuentes.
- [ ] Revisar los textos del paso 9 en inglés y en español: son un primer borrador hecho con IA.
- [ ] Decidir si el paso 9 entra en la demo y cómo se cuenta. Hay un borrador en los [borradores de la entrega](ENTREGA_BORRADORES.md).
- [ ] Confirmar la licencia de la lista de países antes de citarla en las referencias (ODbL 1.0 según el proyecto de origen; GPL-3+ el paquete de Linux Mint).
- [ ] Opcional: descargar un mapa de fronteras (Natural Earth, dominio público) para dibujar el contorno del país y promediar GRACE en todo su territorio. No se hizo sin permiso.
- [ ] Al grabar la demo en un equipo con las animaciones del sistema desactivadas, activar el movimiento con el botón ▶ de la cabecera o con `?motion=full`.
- [x] Subir a GitHub la página, el sitio generado, los datos de países, las capturas y las notas. Codex verificó los cuatro commits en `main` el 15 de noviembre de 2026.

## Actualización del 15 de noviembre de 2026 · DE-T, el asistente del caso

Fran entregó el diseño del asistente (zip `hydrodetective-asistente`: servidor con Kimi, cuatro herramientas que calculan las cifras y un verificador) y pidió meterlo en la página. Está integrado en local: al pulsar un número, la explicación termina con «¿No quedó claro? Pregúntale al DE-T»; también se abre desde el veredicto y desde la cabecera. Cómo se enciende y qué cambió respecto al zip: [app/dete/README.md](../app/dete/README.md). Qué se hizo y por qué, nota por nota: [DE-T](de-t/DE-T.md). Lo que queda:

- [x] **Clave de Kimi.** Fran la puso en `app/dete/.env` el 15 de noviembre de 2026. Está solo en su equipo: nunca se sube al repositorio.
- [x] **Probar DE-T con Kimi real.** Hecho el 15 de noviembre de 2026 por HTTP contra el servidor: ocho de ocho pruebas rápidas, con todas las cifras verificadas. Detalle en el apartado siguiente. Falta verlo en la página.
- [ ] **Aprobar el catálogo de opciones** (`app/dete/catalogo.md`). Es un borrador preparado con ayuda de IA; DE-T lo cita como «📚 Del catálogo».
- [ ] **Declarar Kimi (Moonshot AI)** en el formulario de uso de IA de la entrega, además de Claude y Codex.
- [ ] **Decidir cómo lo verán los jueces.** La copia en GitHub Pages es estática y no muestra a DE-T; se ve con `npm run dete` en un equipo con la clave. Si entra en la demo, grabarlo desde ese servidor.
- [ ] Cuenta Tier0 de Kimi: cabe más o menos una pregunta por minuto. Si varias personas lo van a usar a la vez, recargar hasta Tier1.
- [x] **Subir a GitHub DE-T y los cuadros de la portada.** Subidos el 15 de noviembre de 2026: GitHub `main` está en `16e50a1`, igual que el clon. La bóveda de Obsidian de Fran también se actualizó.
- [x] **Regenerar el sitio publicado.** `site/` se regeneró el 15 de noviembre de 2026 con la página actual (rediseño, cuadros y paso 9). DE-T no aparece en la copia estática. Falta subirlo y activar GitHub Pages.
- [x] Las cifras de DE-T coinciden con las de la página. El zip daba −8,53 cm por década en GRACE (pendiente por paso de la serie); ahora DE-T usa −7,135, la cifra de la página, y lo comprueba una prueba automática.

### DE-T donde se elige el país (15 de noviembre de 2026, por la mañana)

Fran pidió que DE-T pesara más en la página y propuso preguntarle donde se elige el país. Está hecho en local y **sin commit** (tarea #241 del tablero): una franja «Ask DE-T about …» bajo el selector de país del paso 9, una base de datos por país para el agente (`app/dete/paises.json`, 243 países, sacada de los datos del globo) y la petición a Kimi corregida. Detalle: [app/dete/README.md](../app/dete/README.md) y [Dónde aparece DE-T](de-t/DE-T_DONDE_APARECE.md). Hecho con ayuda de IA (Claude). Lo que queda:

- [ ] **Confirmar el modelo de Kimi.** La cuenta del equipo no tiene `kimi-k2.6`, el del diseño: Kimi respondió el 15 de noviembre de 2026 que solo tiene `kimi-k3.1-pro` y `kimi-k3`. El servidor usa ahora `kimi-k3.1-pro`, el de tarifa más baja de los dos, con el razonamiento en `low`. Lo eligió Claude para poder probar: falta que el equipo lo confirme.
- [x] **Probarlo con Kimi real**, con las ocho pruebas rápidas del README. Hecho el 15 de noviembre de 2026 con la clave de Fran (`npm run dete:real` desde `app/`): ocho de ocho respondidas y verificadas, entre 11 y 40 segundos cada una. Salida guardada en `app/dete/pruebas/resultado-kimi-real-2026-11-15.txt`.
- [ ] **Ver a DE-T real en la página.** La prueba real fue por HTTP contra el servidor. Falta abrir http://localhost:8000 con `npm run dete` y repetir alguna pregunta desde la franja del paso 9.
- [ ] **Comparar el costo con el saldo de Kimi.** El servidor estimó entre 0,4 y 3,0 centavos de dólar por pregunta (1,7 de media, unos 15 centavos toda la prueba), con una tarifa de `kimi-k3.1-pro` que no se pudo leer en la tabla oficial. Falta mirar en la consola de Kimi cuánto bajó el saldo de 5 dólares.
- [ ] **Revisar el aviso del hielo.** DE-T dice que GRACE mide también nieve y hielo en los países más allá de 60° de latitud y en el ranking de países. Sale del título oficial del producto, no de un análisis del equipo.
- [ ] **Revisar los textos nuevos**, en inglés y en español (`dete.place.*` en `app/src/lib/i18n-dete.ts`): el título de la franja y sus tres preguntas de inicio.
- [ ] **Cuidar la clave de Kimi.** Está solo en `app/dete/.env`, en el equipo de Fran. Git ignora ese archivo y cualquier otro `.env` (reglas en `.gitignore`, `app/.gitignore` y `app/dete/.gitignore`), y tres pruebas fallan si la plantilla trae una clave, si se quitan esas reglas o si algún archivo de `app/dete/` lleva una escrita. **No subir la carpeta `app/dete/` arrastrándola a la web de GitHub:** esa vía no respeta `.gitignore` y se llevaría `.env`. Se sube con `git push`. Si la clave se llegara a publicar, hay que borrarla en platform.kimi.ai y crear otra.
- [ ] **DE-T no está en el enlace público.** GitHub Pages solo sirve la página estática. Para que los jueces usen a DE-T hace falta un servidor con la clave guardada como secreto, o grabarlo en la demo desde el equipo de Fran.

## Actualización del 15 de noviembre de 2026 · rediseño visual de la página

Fran pidió que la página «se vea diseñada, no generada», con menos información a la vista y sin perder funciones, tomando reglas de Apple, Google y Palantir. Está hecho en local sobre `app/` (tarea #239 del tablero) y **sin commit**. No cambian cifras, datos ni lógica: solo la presentación. Las reglas del sistema visual están escritas al inicio de `app/src/app.css` y resumidas en la [guía de la página](../app/README.md). Hecho con ayuda de IA (Claude). Lo que queda:

- [ ] **Que el equipo lo vea y lo apruebe.** Vista previa `raack-app-5177` de `.claude/launch.json`, o `npm run dev` desde `app/`. Si no convence, `git checkout -- app` devuelve la página anterior.
- [ ] **Revisar lo que ahora empieza plegado:** los sospechosos con coartada firme (una línea que se abre al pulsar), los acuíferos sin déficit (botón bajo la tabla), la tabla de las diez capas cuando el caso está completo y los doce pasos del método. Todo sigue a un clic.
- [ ] **Revisar dos textos nuevos**, en inglés y en español: el botón «Show the 10 aquifers with water available» y su contrario (`w.ev.showRest`, `w.ev.hideRest`).
- [ ] **Citar la tipografía** en las referencias de la entrega: Hanken Grotesk, licencia SIL Open Font License 1.1. Viaja dentro del sitio, con su licencia en `app/public/licenses/`.
- [ ] Hacer commit, regenerar `site/` con `npm run site` desde `app/` y subirlo.
- [ ] Añadir a [INDICE.md](../INDICE.md) el cambio de estado cuando quede libre (lo tiene reservado la tarea #225).
