# Instrucciones para agentes de IA · RAACK

Repositorio del equipo RAACK para el NASA Space Apps Challenge 2026, reto *Be An Earth System Trend Detective!*

## Cómo orientarte sin leerlo todo

1. Lee [INDICE.md](INDICE.md). Tiene el estado en 30 segundos, una tabla de «si buscas esto, lee aquello» y una línea por nota con su tamaño.
2. Abre solo las notas que necesites. Las fichas de `recursos/paginas/` resumen cada recurso del reto. No leas los PDF de `recursos/archivos/` salvo que necesites un dato concreto que la ficha no tenga.
3. Para saber qué se hizo, quién lo hizo y hasta dónde, lee [docs/CONTEXTO.md](docs/CONTEXTO.md). Los mismos datos están en `docs/CONTEXTO.json`.

## Reglas del equipo

- **Giovanni** está excluido y pendiente de decisión del equipo: no lo uses ni lo presentes como elegido.
- Distingue lo comprobado de lo que solo afirma una fuente. No inventes revisiones, descargas ni resultados.
- Las cuentas, inicios de sesión y verificaciones humanas los hace una persona del equipo. No escribas contraseñas.
- Usa fechas absolutas, como «14 de noviembre de 2026».

## Cómo editar

- Escribe las notas en Markdown y enlázalas con rutas relativas, como `[texto](ruta.md)`, no con `[[wikilinks]]`. Así funcionan en GitHub y en Obsidian: este repositorio es también la bóveda de Obsidian del equipo.
- Si creas una nota, la mueves o cambias su propósito, actualiza su línea en [INDICE.md](INDICE.md). Si cambia el estado del proyecto, actualiza también su «Estado en 30 segundos».
- Registra cada archivo descargado en `recursos/archivos/descargas.json`, con origen, tamaño y SHA-256.
- El grafo de contexto se regenera con `python3 docs/generar_contexto.py docs`, después de editar las listas del principio del script.
- No hay credenciales de git en las máquinas del equipo. Los cambios se suben por la web de GitHub (*Add file → Upload files*), con un commit por carpeta.
