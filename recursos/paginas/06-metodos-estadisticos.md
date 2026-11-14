---
id: metodos-estadisticos
revision: 2026-11-14
estado: articulo-revisado-sin-ejecucion
---
# 06 · Statistical test methods to detect trends in time series data

[Catálogo](../README.md) · [Artículo de Medium](https://medium.com/@snp.kriss/statistical-test-methods-to-detect-trends-in-time-series-data-b361a0ec530b)

**Autor mostrado:** MCMC Addict. **Fecha mostrada:** 19 de julio de 2024. **Revisión:** 14 de noviembre de 2026 en Chrome. **Alcance alcanzado:** texto y bloques de código de todas las secciones, hasta *References*; los ejemplos no se ejecutaron.

## Información que ofrece

El artículo compara métodos sobre datos **sintéticos** de concentración de metano, con pendiente, ruido y estacionalidad controlados. Presenta regresión por mínimos cuadrados con contraste de la pendiente, Mann–Kendall, una variante estacional y Augmented Dickey–Fuller (ADF). Muestra ejemplos con NumPy, pandas, Matplotlib, statsmodels y pyMannKendall. El periodo estacional de ejemplo es 12 y también se muestra qué ocurre al elegir otro. Las cifras y conclusiones numéricas pertenecen a sus simulaciones; no son resultados medidos por RAACK ni validación de una tendencia terrestre real. [Fuente revisada](https://medium.com/@snp.kriss/statistical-test-methods-to-detect-trends-in-time-series-data-b361a0ec530b).

## Utilidad posible para RAACK

Sirve como lectura introductoria para comparar un contraste de pendiente con un contraste monotónico y para advertir que el ciclo estacional importa. Puede inspirar pruebas con series conocidas antes de trabajar con observaciones reales. No determina cuál será el método del equipo.

**Distinción comprobada en fuente primaria:** ADF contrasta la hipótesis de raíz unitaria; no es el mismo contraste que preguntar si una pendiente lineal vale cero. Se consultó la [documentación oficial de `statsmodels.tsa.stattools.adfuller`](https://www.statsmodels.org/stable/generated/statsmodels.tsa.stattools.adfuller.html), que describe esa hipótesis y las opciones de constante/tendencia. Por ello, RAACK no debería mostrar los resultados de esos tests como si fueran intercambiables.

## Recorrido comprobado de esta revisión

1. Se abrió el artículo de Medium en una pestaña propia de Chrome, sin iniciar sesión.
2. Se revisaron **Introduction**, **Generating toy datasets**, **Ordinary Least Square Regression**, **Mann-Kendall Trend Test**, **Seasonal Kendall Test**, **Unit Root Tests**, **Closing Remarks** y **References**.
3. Se inspeccionaron los bloques de código visibles y la procedencia sintética de las series. Algunas fórmulas están en imágenes; no se hizo una auditoría visual de cada fórmula.
4. Para aclarar la diferencia de hipótesis se abrió aparte la documentación oficial de ADF y se revisaron descripción, parámetros y notas.
5. Se detuvo la revisión al terminar el artículo y ese contraste documental. No se siguieron los enlaces sociales, suscripciones ni todas las referencias bibliográficas.

## Material guardado y límites

- **Ya guardado del artículo:** no hay una copia íntegra ni un archivo de código descargado; su enlace estaba en el catálogo.
- **Descargas nuevas:** ninguna. Esta ficha es una síntesis propia, no una reproducción del artículo.
- **No realizado:** instalación de bibliotecas, ejecución, reproducción de sus gráficas ni aplicación a GLDAS u otro producto.
- La presencia de código en una página no prueba que funcione con las versiones actuales ni que sus supuestos se ajusten a la serie elegida.

## Qué falta y por qué

1. Elegir el objetivo: tasa de cambio, tendencia monotónica u otra propiedad.
2. Validar supuestos, tratamiento de estacionalidad y dependencia temporal con documentación y literatura adecuadas.
3. Diseñar casos de verificación con pendiente conocida, ausencia de tendencia y faltantes.
4. Reproducir los ejemplos que realmente se adopten y después evaluar una serie científica suficientemente larga.

**Punto de parada exacto:** *References* de Medium y notas de ADF de statsmodels. Se llegó al final del contenido textual accesible; la implementación y validación siguen pendientes porque esta revisión era documental.
