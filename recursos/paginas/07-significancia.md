---
id: significancia
revision: 2026-11-14
estado: articulo-y-documentacion-revisados
---
# 07 · A Comprehensive Guide to Statistical Significance

[Catálogo](../README.md) · [Artículo de Statsig](https://www.statsig.com/perspectives/a-comprehensive-guide-to-statistical-significance)

**Autor mostrado:** Allon Korem, Bell Statistics. **Fecha mostrada:** 7 de agosto de 2025. **Revisión:** 14 de noviembre de 2026 en Chrome. **Alcance alcanzado:** artículo completo hasta recomendaciones de comunicación y documentación oficial enlazada de intervalos de confianza.

## Información que ofrece

La guía introduce hipótesis nula y alternativa, nivel de significación, p-valores e intervalos de confianza. Expone comparaciones entre grupos y subraya que un resultado significativo necesita contexto: tamaño de efecto, tamaño muestral, variabilidad, valores extremos, posibles confundidores y comparaciones múltiples. También distingue no rechazar una hipótesis de demostrar que sea verdadera y separa relevancia práctica de significación estadística. Su contexto principal es la experimentación y el análisis de productos, no una serie ambiental de una misión espacial. [Artículo](https://www.statsig.com/perspectives/a-comprehensive-guide-to-statistical-significance).

La [documentación oficial de intervalos](https://docs.statsig.com/experiments/statistical-methods/confidence-intervals) amplía los cálculos de Statsig para diferencias entre métricas de experimentos: pruebas de una o dos colas, métodos para diferencias relativas y uso de Welch con muestras pequeñas. Se revisó como documentación del producto, no como especificación ya adoptada por RAACK.

## Utilidad posible para RAACK

Ayuda a redactar una explicación comprensible junto a una gráfica: qué se contrastó, nivel elegido, estimación, incertidumbre y límites. Puede orientar el texto de la interfaz para evitar que «significativo» se entienda como «grande», «causado por» o «seguro».

Antes de trasladar fórmulas a una tendencia temporal habrá que seleccionar un método apropiado para ese problema. No se convirtió esta guía general en el algoritmo de RAACK ni se auditaron todas sus fórmulas.

## Recorrido comprobado de esta revisión

1. Se abrió el artículo y se revisaron **Calculating statistical significance**, interpretación de p-valores e intervalos, errores habituales, factores que afectan la significación y **Best practices for reporting statistical significance**.
2. Se identificó y siguió el enlace **Confidence intervals**. El destino antiguo `/stats-engine/confidence-intervals` redirige a [la documentación actual](https://docs.statsig.com/experiments/statistical-methods/confidence-intervals).
3. Se revisaron en esa página los apartados de cálculo, pruebas de una y dos colas, Welch para muestras pequeñas y comparación con una referencia fija.
4. Se detuvo ahí: no se abrió una cuenta, no se solicitó una demostración, no se enviaron formularios ni se configuró un experimento.

## Material guardado y límites

- **Ya guardado en la preparación anterior:** enlace del artículo en el catálogo; no una copia íntegra.
- **Descargas nuevas:** ninguna.
- Esta ficha es una síntesis propia y conserva enlaces para continuar leyendo.
- No contiene resultados estadísticos producidos con datos del equipo.
- Las explicaciones de intervalos de la documentación corresponden al motor y métricas de Statsig; no se ha demostrado su adecuación a observaciones temporales de NASA.

## Qué falta y por qué

1. Definir el contraste concreto y cómo se calculará su incertidumbre.
2. Validar los supuestos del método para la frecuencia, faltantes y dependencia temporal de nuestros datos.
3. Si se comparan muchas regiones o variables, decidir cómo se tratarán las múltiples pruebas.
4. Mostrar la tasa y unidades del cambio junto a p o intervalo y explicar lo que el resultado permite concluir.

**Punto de parada exacto:** final de las recomendaciones del artículo y sección de comparación con referencia fija de la documentación de intervalos. El contenido público requerido se pudo leer; no hubo un bloqueo de acceso al artículo.
