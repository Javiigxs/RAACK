# Instrucciones para agentes de IA · RAACK

Repositorio del equipo RAACK para el NASA Space Apps Challenge 2026, reto *Be An Earth System Trend Detective!* La entrega cierra el **domingo 15 de noviembre de 2026 a las 23:59**, hora local.

## Cómo orientarte sin leerlo todo

1. Lee [INDICE.md](INDICE.md). Tiene el estado en 30 segundos, una tabla de «si buscas esto, lee aquello» y una línea por nota con su tamaño.
2. Abre solo las notas que necesites. Las fichas de `recursos/paginas/` resumen cada recurso del reto. No leas los PDF de `recursos/archivos/` salvo que necesites un dato concreto que la ficha no tenga.
3. Antes de proponer o construir algo, lee [docs/REGLAS_OFICIALES.md](docs/REGLAS_OFICIALES.md) (cómo puntúan y qué exige la entrega) y [docs/IDEAS.md](docs/IDEAS.md) (qué se ha propuesto ya).
4. Para saber qué se hizo, quién lo hizo y hasta dónde, lee [docs/CONTEXTO.md](docs/CONTEXTO.md). Los mismos datos están en `docs/CONTEXTO.json`.

## Reglas del equipo

- **Validación obligatoria:** todo caso, funcionalidad o conclusión debe pasar las cuatro reglas de [docs/VALIDACION.md](docs/VALIDACION.md): el problema existe, es medible, se hace con los datos que nos dieron y tiene un diferenciador. Si una regla falla, dilo antes de seguir.
- **La idea la decide el equipo.** La guía oficial pide que la IA no se use para idear la solución. Un agente puede proponer opciones en [docs/IDEAS.md](docs/IDEAS.md), con su paso por las cuatro reglas; no las presentes como decididas ni elijas por las personas.
- **Declara lo que generes.** La entrega exige decir dónde y cómo se usó IA. Si escribes código, datos o textos para el proyecto, déjalo indicado; las imágenes generadas llevan marca de agua visible y nada puede usar logotipos de NASA.
- **Lo que vean los jueces va en inglés:** página del proyecto, demo y material enlazado. Las notas internas siguen en español.
- **Giovanni** está excluido y pendiente de decisión del equipo: no lo uses ni lo presentes como elegido.
- Distingue lo comprobado de lo que solo afirma una fuente. No inventes revisiones, descargas ni resultados. Marca como «preliminar» cualquier cifra calculada sin un CSV guardado en el repo.
- Las cuentas, inicios de sesión y verificaciones humanas los hace una persona del equipo. No escribas contraseñas.
- Usa fechas absolutas, como «14 de noviembre de 2026».

## Datos: lo que ya se sabe

El detalle está en [docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md). Lo que más tiempo ahorra:

- **Al instante y sin cuenta:** el visor Hydrology Time Series (172 variables; 26 años de Monterrey en menos de 20 segundos), el catálogo de AppEEARS, los datos mensuales de estaciones de NOAA y las series de SWOT por Hydrocron.
- **En cola:** las extracciones de AppEEARS. Hay una de prueba enviada.
- **Cuida la cuota del visor:** avisa de un límite mensual. No pidas series horarias de décadas; una falló.
- **Las horas del CSV del visor no son UTC reales:** se desplazan con el huso del navegador. Trabaja con medias mensuales o corrige el desfase ([ficha 01](recursos/paginas/01-hydrology.md)).
- **GLDAS 2.1 cambió sus datos de entrada en marzo de 2001:** empieza las tendencias después.
- **Estaciones de NOAA cerca de Monterrey:** casi todas terminan en 2011 o 2012.

## Cómo editar

- Escribe las notas en Markdown y enlázalas con rutas relativas, como `[texto](ruta.md)`, no con `[[wikilinks]]`. Así funcionan en GitHub y en Obsidian: este repositorio es también la bóveda de Obsidian del equipo.
- No enlaces carpetas ni anclas de GitHub (`#titulo`): Obsidian no las resuelve. Enlaza la nota y nombra la sección en el texto.
- Si amplías una ficha, hazlo en una sección fechada al final. No reescribas lo que otro agente comprobó: corrige con una nota de «actualización».
- Si creas una nota, la mueves o cambias su propósito, actualiza su línea en [INDICE.md](INDICE.md). Si cambia el estado del proyecto, actualiza también su «Estado en 30 segundos».
- Registra cada archivo descargado en `recursos/archivos/descargas.json`, con origen, tamaño y SHA-256.
- El grafo de contexto se regenera con `python3 docs/generar_contexto.py docs`, después de editar las listas del principio del script.
- No hay credenciales de git en las máquinas del equipo. Los cambios se suben por la web de GitHub (*Add file → Upload files*), con un commit por carpeta.
