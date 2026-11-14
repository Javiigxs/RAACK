---
id: knmi
revision: 2026-11-14
estado: documentacion-revisada-acceso-interactivo-pendiente
---
# 05 · KNMI Climate Explorer

[Catálogo](../README.md) · [Fuente principal](https://climexp.knmi.nl/)

**Revisión:** 14 de noviembre de 2026, con Chrome y lectura del manual local. **Alcance alcanzado:** portada, intento de ayuda pública y las 15 páginas del manual de acceso/descarga. No se produjo una extracción ni un análisis en el portal.

## Información que ofrece

KNMI presenta un explorador de observaciones de estaciones, campos en malla, reanálisis y modelos climáticos. La portada enumera temperatura, precipitación, presión, viento, escenarios y salidas de modelos. Ofrece series, anomalías respecto de una referencia, gráficos y análisis de tendencias con significación. [Descripción del servicio](https://climexp.knmi.nl/).

El [manual de acceso y descarga](https://climexp.knmi.nl/publications/training_climexp_Accessing-and-downloading-data.pdf) explica una ruta de trabajo: localizar estaciones o seleccionar un campo, delimitar una región, revisar cobertura y faltantes, obtener una serie y descargarla. Su ejemplo usa la ola de calor del noroeste del Pacífico de 2021 y muestra un índice anual a partir de medias móviles de dos días. Incluye familias como GHCN-D, ERA5, CPC, GPCC, GPM-IMERG, E-OBS y CRU TS; sus tablas son ejemplos del manual, no una comprobación de la cobertura vigente de cada producto.

## Utilidad posible para RAACK

Puede orientar el flujo variable → región → periodo → serie → gráfico → análisis. La parte de estaciones y la de promedios regionales permiten estudiar dos formas distintas de definir «dónde cambia». Es una opción por evaluar; todavía no se ha elegido como fuente de datos del equipo.

El manual también entra en ajustes de extremos y tiempos de retorno. Esa parte requiere más decisiones que una primera tendencia lineal y no se aplicó a RAACK.

## Recorrido comprobado de esta revisión

1. Se abrió [la portada](https://climexp.knmi.nl/) y se revisaron descripción, categorías, manuales, citas, restricciones y noticias visibles.
2. Se siguió el enlace **Help**. La URL pasó a [help.cgi](https://climexp.knmi.nl/help.cgi?id=someone@somewhere), pero el contenido seguía siendo **Welcome to Climate Explorer** y mostraba la verificación humana. No se afirma haber accedido a la ayuda interactiva detrás de ese aviso.
3. Se leyó por extracción de texto el [PDF local de 15 páginas](../archivos/knmi-manual-acceso-descarga.pdf), desde búsqueda de estaciones hasta resultados de análisis de extremos.
4. Se detuvo la navegación interactiva en el aviso **I verify that I am human**. No se pulsó su botón ni se inició sesión.

## Material guardado y límites

- **Ya guardado en la preparación anterior:** [manual KNMI de acceso y descarga](../archivos/knmi-manual-acceso-descarga.pdf).
- **Descargas nuevas en esta revisión:** ninguna.
- **No obtenido:** una serie de datos de KNMI, gráficos generados por nosotros, máscaras o resultados de un ajuste.
- El manual se revisó como documentación; sus capturas no son pruebas de que ejecutáramos esos pasos.
- El portal avisa que algunos manuales no se actualizan regularmente. Para usar un producto habrá que comprobar su versión y cobertura en el catálogo operativo.

## Qué falta y por qué

1. La persona debe completar la verificación humana si el equipo decide usar el servicio.
2. Elegir producto, variable, región, periodo y resolución; comprobar disponibilidad y faltantes.
3. Obtener y guardar los datos, metadatos y cita del producto original, además de citar KNMI.
4. Definir el análisis y sus supuestos antes de interpretar significación.

**Punto de parada exacto:** la portada de bienvenida que reaparece en `help.cgi`, más revisión documental del manual. La verificación impidió avanzar con las herramientas; no se sustituyó por una ruta para eludirla.
