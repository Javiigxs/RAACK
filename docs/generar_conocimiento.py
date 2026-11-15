"""Genera docs/CONOCIMIENTO.json y docs/CONOCIMIENTO.md de RAACK desde un único conjunto de datos.

Uso, desde la raíz del repo: python3 docs/generar_conocimiento.py docs
Para cambiar el grafo, edita NODOS, ARISTAS, VISTAS y ESENCIAL. El script comprueba que
cada arista une nodos que existen, que cada nodo aparece en alguna vista y que las rutas
citadas existen en el repositorio.

Código y redacción asistidos por IA (Claude y Codex) a petición del equipo RAACK.
"""
import argparse
import json
from collections import Counter
from pathlib import Path

RETO = "https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/"
FECHA = "2026-11-15"
CORTE = "15 de noviembre de 2026"

# tipo: (nombre legible, estilo Mermaid)
TIPOS = {
    "reto": ("Reto y reglas oficiales", "fill:#1f2a44,stroke:#1f2a44,color:#ffffff"),
    "regla": ("Regla del equipo", "fill:#eef0f2,stroke:#3d4650,color:#1d2430"),
    "pregunta": ("Pregunta o idea", "fill:#f6e8f7,stroke:#8e44ad,color:#1d2430"),
    "recurso": ("Recurso o portal", "fill:#e8f1fb,stroke:#2f6fb5,color:#1d2430"),
    "dato": ("Dato guardado", "fill:#e6f4f8,stroke:#1b7f99,color:#1d2430"),
    "metodo": ("Método", "fill:#f2f2f2,stroke:#8a8a8a,color:#1d2430"),
    "hallazgo": ("Hallazgo", "fill:#e7f5ec,stroke:#2e7d4f,color:#1d2430"),
    "preliminar": ("Hallazgo preliminar", "fill:#fff4e5,stroke:#d9822b,color:#1d2430"),
    "limite": ("Límite conocido", "fill:#fdecea,stroke:#c0392b,color:#1d2430"),
    "pagina": ("Página web", "fill:#dbe7ff,stroke:#2a4fb5,color:#1d2430"),
    "pendiente": ("Pendiente", "fill:#ffffff,stroke:#8a8a8a,stroke-dasharray:5 4,color:#1d2430"),
    "grupo": ("Resumen de un grupo", "fill:#eef0f2,stroke:#3d4650,color:#1d2430"),
}

NODOS = []


def N(nid, tipo, grupo, etiqueta, texto, estado, *fuentes):
    """Añade un nodo. `fuentes` son pares (título, ruta desde la raíz o URL)."""
    NODOS.append(dict(id=nid, tipo=tipo, grupo=grupo, etiqueta=etiqueta, texto=texto, estado=estado,
                      fuentes=[dict(titulo=t, ruta=r) for t, r in fuentes]))


# ---------- Reto y reglas
N("reto", "reto", "reglas", "Reto · Be An Earth System<br/>Trend Detective!",
  "Crear una herramienta que elija variables medidas por misiones o producidas por modelos, las dibuje en el tiempo "
  "y diga qué cambia, dónde, cuánto y si el cambio es significativo.",
  "oficial", ("Reto", "docs/RETO.md"))
N("criterios", "reto", "reglas", "Cinco criterios, de 1 a 5",
  "Los jueces puntúan Impact, Creativity, Validity, Relevance y Presentation.",
  "oficial", ("Reglas oficiales", "docs/REGLAS_OFICIALES.md"))
N("entrega", "reto", "reglas", "Entrega · domingo 15-nov,<br/>23:59 hora local",
  "Todo en inglés, demo de 30 segundos o 7 diapositivas, enlaces públicos y declaración de uso de IA.",
  "oficial", ("Reglas oficiales", "docs/REGLAS_OFICIALES.md"))
N("consideraciones", "reto", "reglas", "Consideraciones oficiales",
  "Público estudiantil, definiciones sencillas, preguntas guía y ejemplos de demostración. Las tendencias no "
  "significativas también interesan y algunas no se ven sin quitar el ciclo estacional.",
  "oficial", ("Reto", "docs/RETO.md"))
N("validacion", "regla", "reglas", "Cuatro reglas del equipo",
  "Toda propuesta debe mostrar que el problema existe, que es medible, que se hace con los datos dados y que "
  "tiene un diferenciador.",
  "regla del equipo", ("Validación", "docs/VALIDACION.md"))
N("regla_ia", "regla", "reglas", "La idea la decide el equipo",
  "La guía oficial pide que la IA no idee la solución: los agentes proponen opciones y declaran lo que generan.",
  "regla del equipo", ("Instrucciones para agentes", "AGENTS.md"))

# ---------- Preguntas e ideas
N("fran1", "pregunta", "preguntas", "Fran · ¿Qué esconde<br/>el total de un año?",
  "Dos años con casi la misma lluvia pueden diferir en cuántos días llueve, cuánta cae de golpe y cuánto dura "
  "la racha seca.",
  "propuesta del equipo", ("Ideas", "docs/IDEAS.md"), ("Mapa de datos", "docs/MAPA_DE_DATOS.md"))
N("fran2", "pregunta", "preguntas", "Fran · ¿Se adelantan o<br/>se acortan los ciclos?",
  "Seguir año a año las fechas en que se acumula parte de la lluvia o el mes de máximo verdor.",
  "propuesta del equipo", ("Ideas", "docs/IDEAS.md"), ("Mapa de datos", "docs/MAPA_DE_DATOS.md"))
N("ideas13", "pregunta", "preguntas", "13 ideas de un agente",
  "Expediente de detective, rueda de reconocimiento, ojo contra estadística, jurado de tres, coartadas, años que "
  "faltan, gemelos opuestos, dos testigos y otras.",
  "propuesta sin decidir", ("Ideas", "docs/IDEAS.md"))

# ---------- Recursos
N("recursos", "recurso", "recursos", "13 recursos oficiales",
  "Doce tienen ficha propia. Giovanni quedó excluido, salvo una autorización limitada.",
  "revisado", ("Cobertura", "recursos/COBERTURA.md"))
N("r_appeears", "recurso", "recursos", "AppEEARS · NASA",
  "Extrae productos de satélite por puntos o áreas con sus capas de calidad. Entrega en cola, no al instante.",
  "usado", ("Ficha 02", "recursos/paginas/02-appeears.md"))
N("r_hydro", "recurso", "recursos", "Hydrology Time Series · NASA",
  "Visor con 172 variables de 13 productos. Entrega series largas al instante y no calcula tendencias.",
  "usado", ("Ficha 01", "recursos/paginas/01-hydrology.md"))
N("r_giovanni", "recurso", "recursos", "Giovanni · NASA",
  "Fran lo autorizó solo como vía de descarga de las siete variables GLDAS. Usarlo como herramienta de la "
  "solución sigue sin decidir.",
  "autorización limitada", ("Decisión", "docs/decisiones/GIOVANNI.md"))
N("r_otros", "recurso", "recursos", "NOAA, KNMI, SWOT,<br/>GEO.ca y RCM",
  "NOAA responde sin token; KNMI pide una verificación humana; SWOT empieza en 2023; GEO.ca y RCM solo cubren "
  "Canadá.",
  "revisado, sin usar", ("Funcionalidades", "docs/FUNCIONALIDADES.md"))
N("r_externos", "recurso", "recursos", "Fuentes fuera de la lista",
  "NASA POWER, PO.DAAC, SMN, CHIRPS, INEGI y CONAGUA. Se usan con justificación escrita, como pide la regla 3.",
  "justificado", ("Lluvia en Monterrey", "docs/LLUVIA_MONTERREY.md"),
  ("Datos de Nuevo León", "docs/REQUISITOS_DATOS_NUEVO_LEON.md"))

# ---------- Datos de Monterrey
N("d_imerg", "dato", "monterrey", "Lluvia diaria GPM IMERG<br/>2002–2024 · misión",
  "8.401 días de lluvia estimada por satélite en la celda de 0,1° del centro de Monterrey, vía NASA POWER.",
  "en uso", ("Original", "recursos/archivos/monterrey-lluvia-nasa-power.csv"),
  ("Lluvia en Monterrey", "docs/LLUVIA_MONTERREY.md"))
N("d_merra", "dato", "monterrey", "Humedad en raíces MERRA-2<br/>2002–2024 · modelo",
  "276 meses de saturación del suelo, de 0 a 1, en una celda de 0,5° × 0,625°, vía NASA POWER.",
  "en uso", ("Original", "recursos/archivos/monterrey-humedad-nasa-power.csv"))
N("d_lst", "dato", "monterrey", "Temperatura superficial MODIS<br/>2001–2025 · misión",
  "MOD11A2: compuestos de ocho días, de día y de noche, en cinco píxeles de 1 km. Son 5.745 registros con "
  "su calidad.",
  "en uso", ("Solicitud AppEEARS", "docs/SOLICITUD_APPEEARS_MONTERREY.md"))
N("d_ndvi", "dato", "monterrey", "Verdor NDVI MODIS<br/>2001–2025 · misión",
  "MOD13A3: 300 meses por punto en los mismos cinco píxeles. Son 1.500 registros con su fiabilidad.",
  "en uso", ("Solicitud AppEEARS", "docs/SOLICITUD_APPEEARS_MONTERREY.md"))
N("d_smn", "dato", "monterrey", "Estación SMN 19052<br/>2002–2024 · en tierra",
  "Lluvia y temperaturas máxima y mínima diarias del Observatorio de Monterrey. Es el testigo en tierra; no es "
  "un dato de la NASA.",
  "en uso", ("Original", "recursos/archivos/smn-monterrey-19052.txt"))
N("s_series", "dato", "monterrey", "Cinco series de trabajo",
  "Una tabla por variable con unidades, fuente, lugar y banderas de calidad. Se regeneran con un script.",
  "en uso", ("Mapa de datos", "docs/MAPA_DE_DATOS.md"), ("Script", "docs/separar_series.py"))
N("s_anual", "dato", "monterrey", "Resumen anual de lluvia",
  "Una fila por año y fuente con el total, los días con lluvia, la concentración, la racha seca y las fechas "
  "del 20, 50 y 80 %.",
  "en uso", ("Tabla", "datos/derivados/lluvia_anual.csv"), ("Script", "docs/calcular_calendario_lluvia.py"))

# ---------- Datos de Nuevo León
N("d_gldas", "dato", "nuevo_leon", "GLDAS 2.1 · 7 variables<br/>mar-2001 a jul-2026 · modelo",
  "Lluvia, evapotranspiración, evaporación potencial, humedad en raíces, dos escurrimientos y temperatura del "
  "aire, cada tres horas, en Monterrey y Galeana.",
  "datos del caso", ("Detalle", "recursos/archivos/nuevo-leon/gldas/README.md"))
N("d_grace", "dato", "nuevo_leon", "GRACE y GRACE-FO<br/>2002–2026 · misión",
  "Anomalías de agua total (lwe_thickness) de JPL mascon RL06.3: 261 soluciones, un recorte de 50 celdas y el "
  "original mundial en seis partes.",
  "datos del caso", ("Detalle", "recursos/archivos/nuevo-leon/grace/README.md"))
N("d_lluvia_nl", "dato", "nuevo_leon", "Lluvia mensual regional<br/>IMERG y CHIRPS",
  "IMERG Final V07 de enero de 1998 a septiembre de 2025 y CHIRPS de 1998 a 2025, en el recuadro de Nuevo León.",
  "datos del caso", ("Datos de Nuevo León", "docs/REQUISITOS_DATOS_NUEVO_LEON.md"))
N("d_agua_nl", "dato", "nuevo_leon", "Cuencas INEGI y<br/>tres presas CONAGUA",
  "Límites de la cuenca Bravo–San Juan y volumen diario de El Cuchillo, Cerro Prieto y La Boca desde 1993.",
  "datos del caso", ("Datos de Nuevo León", "docs/REQUISITOS_DATOS_NUEVO_LEON.md"))
N("manifiesto", "dato", "nuevo_leon", "Manifiesto de descargas",
  "Origen, tamaño y SHA-256 de los archivos registrados. Las notas de cada producto identifican los recortes y las transformaciones.",
  "verificado", ("Manifiesto", "recursos/archivos/descargas.json"))

# ---------- Métodos
N("m_calidad", "metodo", "metodo", "Filtro de calidad",
  "En MODIS se conservan las temperaturas con error estimado de 2 K o menos y los NDVI de fiabilidad 0 o 1. "
  "Hay un modo estricto.",
  "en la página", ("Laboratorio", "app/src/lib/analysis.ts"))
N("m_anom", "metodo", "metodo", "Quitar el ciclo estacional",
  "Cada mes se compara con lo habitual de ese mes. Así el verano y el invierno no esconden un cambio lento.",
  "en la página", ("Laboratorio", "app/src/lib/analysis.ts"))
N("m_sen", "metodo", "metodo", "Ritmo · pendiente de Theil–Sen",
  "Cambio por década con su intervalo del 95 % por el método de Sen. Coincide con SciPy en las series de lluvia.",
  "comprobado contra SciPy", ("Lluvia en Monterrey", "docs/LLUVIA_MONTERREY.md"))
N("m_jurado", "metodo", "metodo", "Jurado de tres pruebas",
  "Prueba t de la pendiente, Mann–Kendall y bootstrap de bloques con semilla fija: los tres métodos que nombra "
  "el reto.",
  "en la página", ("Métodos estadísticos", "recursos/paginas/06-metodos-estadisticos.md"))
N("m_memoria", "metodo", "metodo", "Corrección por memoria",
  "Si un mes se parece al anterior, las tres pruebas se ensanchan. Sin esa corrección las falsas alarmas se "
  "vuelven más frecuentes.",
  "probado con series simuladas", ("Pruebas", "app/src/lib/stats/trend.test.ts"))
N("m_regla", "metodo", "metodo", "Regla de datos suficientes",
  "Con menos de 15 años o menos del 80 % de meses válidos no hay veredicto.",
  "regla del equipo", ("Validación", "docs/VALIDACION.md"))
N("m_veredicto", "metodo", "metodo", "Veredicto graduado",
  "Tres pruebas de tres dan pruebas sólidas; dos, indicios; una, pista débil; ninguna, sin pruebas.",
  "en la página", ("Laboratorio", "app/src/lib/analysis.ts"))
N("m_pistas", "metodo", "metodo", "Ocho pistas dentro del año",
  "Total, días con lluvia, lluvia por día lluvioso, parte en cinco días, día más lluvioso, racha seca, fecha "
  "del 50 % y días entre el 20 y el 80 %.",
  "documentado", ("Script", "docs/calcular_calendario_lluvia.py"))
N("m_coartadas", "metodo", "metodo", "Coartadas",
  "El veredicto se repite con otros periodos, mes a mes, sin los años de deriva del satélite, con un escalón "
  "en vez de una recta y sin quitar las estaciones.",
  "en la página", ("Laboratorio", "app/src/lib/analysis.ts"))
N("m_anios", "metodo", "metodo", "Años que faltan",
  "Estima cuántos años de datos harían falta para detectar un cambio de ese tamaño con ese ruido.",
  "cita por verificar", ("Ideas", "docs/IDEAS.md"))

# ---------- Hallazgos
N("h_noches", "hallazgo", "hallazgos", "Las noches se calientan<br/>+0,96 °C por década",
  "Temperatura superficial nocturna en el centro, 2001–2025: +0,96 °C por década, con intervalo de 0,71 a 1,20. "
  "Las tres pruebas coinciden, con 259 de 300 meses válidos.",
  "fijado por prueba", ("Pruebas del laboratorio", "app/src/lib/analysis.test.ts"))
N("h_lugares", "hallazgo", "hallazgos", "Suben en los cinco lugares",
  "De +0,67 °C por década en Chipinque a +1,10 en García. Ningún par de lugares va en sentidos opuestos.",
  "fijado por prueba", ("Pruebas del laboratorio", "app/src/lib/analysis.test.ts"))
N("h_deriva", "hallazgo", "hallazgos", "Aguanta sin los años de deriva",
  "Solo con 2001–2019 la tendencia nocturna del centro sigue ahí: +0,69 °C por década, con pruebas sólidas.",
  "fijado por prueba", ("Pruebas del laboratorio", "app/src/lib/analysis.test.ts"))
N("h_aire", "hallazgo", "hallazgos", "La estación coincide<br/>mínima +0,50 °C por década",
  "Temperatura mínima del aire en el Observatorio, 2002–2024: +0,50 °C por década, de 0,22 a 0,78. El satélite "
  "da +0,91 en esos mismos años.",
  "calculado por la página", ("Motor", "app/src/lib/analysis.ts"), ("Datos", "app/public/data/monterrey.json"))
N("h_dia", "hallazgo", "hallazgos", "De día, sin pruebas",
  "La temperatura superficial diurna de MODIS no muestra tendencia en ninguno de los cinco lugares.",
  "cálculo exploratorio", ("Motor", "app/src/lib/analysis.ts"), ("Datos", "app/public/data/monterrey.json"))
N("h_lluvia", "hallazgo", "hallazgos", "Lluvia sin tendencia confirmada",
  "Ninguna de las ocho métricas anuales muestra pruebas de tendencia en 2002–2024. La concentración da "
  "+0,52 puntos por década, de −4,06 a +6,33.",
  "comprobado contra SciPy", ("Lluvia en Monterrey", "docs/LLUVIA_MONTERREY.md"))
N("h_gemelos", "hallazgo", "hallazgos", "Años gemelos 2016 y 2020",
  "806 y 796 mm de lluvia, pero 89 y 62 días con lluvia, y 28,5 % frente a 51,7 % del total en cinco días.",
  "documentado", ("Mapa de datos", "docs/MAPA_DE_DATOS.md"))
N("h_episodios", "hallazgo", "hallazgos", "Sequía de 2022 y<br/>diluvio de junio de 2024",
  "Enero–julio de 2022: 120 mm frente a una mediana de 312. Junio de 2024: 367 mm, 5,9 veces la mediana "
  "de junio.",
  "documentado", ("Lluvia en Monterrey", "docs/LLUVIA_MONTERREY.md"))
N("h_testigo", "hallazgo", "hallazgos", "Satélite y pluviómetro<br/>coinciden · r = 0,92",
  "Totales mensuales de IMERG y del Observatorio en 257 meses comunes. El satélite marca unos 9 mm menos "
  "al mes.",
  "fijado por prueba", ("Pruebas del laboratorio", "app/src/lib/analysis.test.ts"))
N("h_verdor", "hallazgo", "hallazgos", "El verdor solo cambia<br/>en Pesquería",
  "−0,088 de NDVI por década, 2001–2025. Se describe mejor como un escalón hacia 2011, de −0,155, que como "
  "una recta.",
  "fijado por prueba", ("Pruebas del laboratorio", "app/src/lib/analysis.test.ts"))
N("h_suelo", "hallazgo", "hallazgos", "Humedad sin tendencia confirmada",
  "La humedad en raíces de MERRA-2 no muestra pruebas de cambio en 2002–2024. Es una serie con mucha memoria.",
  "cálculo exploratorio", ("Motor", "app/src/lib/analysis.ts"), ("Datos", "app/public/data/monterrey.json"))
N("h_gldas", "preliminar", "hallazgos", "Preliminar · aire GLDAS<br/>+0,39 K por década",
  "Estimación histórica del visor para 2000–2026, sin CSV guardado entonces. Para el caso actual hay series "
  "guardadas desde marzo de 2001 y resultados sobre años completos en el diagnóstico del agua.",
  "preliminar", ("Ideas", "docs/IDEAS.md"))
N("h_vacio", "hallazgo", "hallazgos", "Las herramientas oficiales<br/>no dan veredicto",
  "El visor dibuja una variable por gráfico y no calcula tendencia ni significación. AppEEARS entrega los "
  "datos en cola.",
  "comprobado al usarlas", ("Funcionalidades", "docs/FUNCIONALIDADES.md"))

# ---------- Límites
N("l_terra", "limite", "limites", "Terra deriva desde 2020",
  "La hora de paso de Terra cambió a partir de 2020. Observar la superficie a otra hora puede alterar la lectura. La página repite el cálculo hasta 2019 para evaluar su efecto.",
  "aviso de la NASA", ("Terra orbital drift information", "https://terra.nasa.gov/about/terra-orbital-drift-information"))
N("l_calidad", "limite", "limites", "Calidad MODIS en el centro",
  "El centro nunca recibe la marca de mejor calidad en temperatura y casi no tiene meses fiables de NDVI.",
  "comprobado", ("Mapa de datos", "docs/MAPA_DE_DATOS.md"))
N("l_celda", "limite", "limites", "Un píxel no es la ciudad",
  "Cada serie es un píxel de 1 km o una celda de 10 a 55 km. No representa un distrito, el estado ni una cuenca.",
  "comprobado", ("Mapa de datos", "docs/MAPA_DE_DATOS.md"))
N("l_multiples", "limite", "limites", "Muchas pruebas a la vez",
  "Con ocho pistas o doce meses a prueba se espera alguna falsa alarma. Una pista débil suelta no es fiable.",
  "advertido", ("Significación", "recursos/paginas/07-significancia.md"))
N("l_causa", "limite", "limites", "Significativo no es causa",
  "Una tendencia significativa describe un patrón en un lugar y un periodo. No dice por qué ocurre.",
  "advertido", ("Significación", "recursos/paginas/07-significancia.md"))
N("l_gldas", "limite", "limites", "GLDAS 2.1 cambió en 2001",
  "Cambió sus datos de entrada en marzo de 2001. Por eso las descargas empiezan ahí.",
  "oficial", ("Ficha 01", "recursos/paginas/01-hydrology.md"))
N("l_horas", "limite", "limites", "Horas del visor desplazadas",
  "El CSV del visor mueve las horas según el huso del navegador. Con medias mensuales no afecta.",
  "comprobado", ("Ficha 01", "recursos/paginas/01-hydrology.md"))
N("l_imerg", "limite", "limites", "IMERG Final acaba en sep-2025",
  "La versión V07 termina ahí por la transición a V08. No se rellenaron los meses que faltan.",
  "oficial", ("Detalle", "recursos/archivos/nuevo-leon/imerg/README.md"))
N("l_grace", "limite", "limites", "GRACE ve a unos 300 km",
  "Su resolución efectiva es de unos 3°. Mide agua total: no solo la subterránea ni el volumen de una presa.",
  "oficial", ("Detalle", "recursos/archivos/nuevo-leon/grace/README.md"))
N("l_noaa", "limite", "limites", "Estaciones NOAA hasta 2012",
  "49 de las 50 estaciones cercanas terminan en 2012 o antes. Por eso el testigo en tierra es el SMN.",
  "comprobado", ("Ficha 03", "recursos/paginas/03-cdo.md"))

# ---------- Página web
N("p_pagina", "pagina", "pagina", "Trend Detective<br/>página web",
  "Aplicación estática en Svelte y Vite. La interfaz en inglés y español calcula tendencias en el navegador "
  "para el caso del agua y para el laboratorio de Monterrey.",
  "implementado", ("Página web", "app/README.md"))
N("p_caso", "pagina", "pagina", "Caso guiado · dos barras,<br/>dos calendarios, ¿tendencia?",
  "México, Monterrey, lluvia: dos totales casi iguales, los días de cada año y el veredicto de 23 años. "
  "Incluye un buscador de años gemelos.",
  "implementado", ("Página web", "app/README.md"))
N("p_lab", "pagina", "pagina", "Investigación en ocho pasos",
  "Qué, dónde, cuándo, mirar y dibujar una línea, veredicto, coartadas, cinco lugares y segundo testigo, "
  "para siete variables.",
  "implementado", ("Página web", "app/README.md"))
N("p_expediente", "pagina", "pagina", "Expediente",
  "Fuentes, métodos, límites, declaración de uso de IA y descarga del resultado en JSON.",
  "implementado", ("Página web", "app/README.md"))
N("p_dete", "pagina", "pagina", "DE-T · asistente del caso",
  "Responde con Kimi solo con los datos del caso del agua: cuatro herramientas calculan las cifras y un verificador "
  "las busca en los datos antes de mostrarlas. Se abre bajo la explicación de cada número («¿No quedó claro? "
  "Pregúntale al DE-T»), desde el veredicto y desde la cabecera, y solo aparece si su servidor está encendido. "
  "Diseño de Fran; integración del 15 de noviembre de 2026.",
  "implementado", ("Qué se hizo y por qué", "docs/de-t/DE-T.md"), ("Dónde aparece", "docs/de-t/DE-T_DONDE_APARECE.md"),
  ("DE-T", "app/dete/README.md"))

N("p_cuadros", "pagina", "pagina", "La señal en cuadros",
  "Abre la página sobre la Tierra: un cuadro por día de lluvia de un año y un cuadro por mes de temperatura "
  "nocturna frente a lo habitual. Idea de Fran. El 15 de noviembre de 2026, a petición suya, las dos tarjetas "
  "quedaron centradas en la columna de la página (con la tabla abierta, la de temperatura se ensanchaba y se salía "
  "por la derecha) y la de temperatura recibió el mismo selector de año que la de lluvia: recuadra ese año en la "
  "cuadrícula y dice cuántos de sus meses fueron más cálidos de lo habitual y cuál se pasó más.",
  "implementado", ("Cuadros de la portada", "docs/CUADROS_PORTADA.md"),
  ("Sección de los cuadros", "app/src/lib/sections/Squares.svelte"), ("Página web", "app/README.md"))
N("p_numeros", "pagina", "pagina", "Cada número se explica<br/>al pulsarlo",
  "Un clic en cualquier cifra abre una tarjeta que dice qué tipo de número es (cambio por década, intervalo, "
  "p-valor…), su unidad y cómo lo llama la página. Desde el 15 de noviembre de 2026 termina con «¿No quedó claro? "
  "Pregúntale al DE-T» cuando DE-T está encendido.",
  "fijado por prueba", ("Detector de números", "app/src/lib/explain/detect.ts"),
  ("Pruebas del detector", "app/src/lib/explain/detect.test.ts"))

# ---------- DE-T, el asistente del caso (integrado el 15 de noviembre de 2026)
N("q_dete", "pregunta", "dete", "Fran · «¿No quedó claro?<br/>Pregúntale al DE-T»",
  "Fran entregó el diseño del asistente (zip «hydrodetective-asistente»: servidor con Kimi, cuatro herramientas, "
  "verificador de cifras, datos y catálogo de opciones) y pidió ponerlo donde tenga sentido en la página: bajo la "
  "explicación de cada número, para quien siga con dudas. También eligió el nombre, DE-T.",
  "propuesta del equipo", ("Qué se hizo y por qué", "docs/de-t/DE-T.md"), ("DE-T", "app/dete/README.md"))
N("d_dete", "dato", "dete", "Datos de DE-T<br/>27 series y 23 acuíferos",
  "series_nl.json sale de water.json, el mismo archivo que usa la página: copia los valores anuales y la tendencia "
  "de referencia de cada serie sin recalcular nada, más la tabla de acuíferos del DOF. Por qué: así DE-T dice las "
  "mismas cifras que la página. Se regenera con npm run dete:data y una prueba falla si dejan de coincidir.",
  "fijado por prueba", ("Las cifras de DE-T son las de la página", "docs/de-t/DE-T_CIFRAS_DE_LA_PAGINA.md"),
  ("Exportador", "app/dete/exportar_series.mjs"), ("Pruebas", "app/dete/herramientas.test.mjs"))
N("h_dete_paso", "hallazgo", "dete", "El zip medía la pendiente<br/>por paso, no por año",
  "Al comparar sus 27 series con la página, los valores coincidían, pero en las series con años sin dato la "
  "pendiente salía inflada: GRACE −8,53 frente a −7,135 cm por década; tanque del SMN −231,3 frente a −185,8 mm/año; "
  "temperatura del SMN 0,370 frente a 0,332 °C. En el volumen de La Boca, Hamed–Rao no se puede calcular y el zip "
  "usaba otra prueba que daba «confirmada»; la página dice «indicio». Sin corregirlo, DE-T habría contradicho a la "
  "página delante de los jueces.",
  "fijado por prueba", ("La pendiente por paso del zip", "docs/de-t/DE-T_PENDIENTE_POR_PASO.md"),
  ("DE-T, cambios respecto al zip", "app/dete/README.md"), ("Verificación del caso", "docs/DIAGNOSTICO_AGUA.md"))
N("m_dete_herr", "metodo", "dete", "Herramientas que calculan",
  "El modelo no calcula: pide al servidor ver_serie, anomalia (un año frente a su media), correlacionar (Pearson, "
  "Spearman y sin tendencia, con rezago de hasta tres años) y ver_acuiferos. No tiene búsqueda web. Por qué: para "
  "que ninguna cifra salga de la memoria del modelo.",
  "probado con un Kimi simulado", ("Cómo evita inventar", "docs/de-t/DE-T_COMO_EVITA_INVENTAR.md"),
  ("Herramientas", "app/dete/herramientas.mjs"))
N("m_dete_verif", "metodo", "dete", "Verificador de cifras",
  "Cada cifra de la respuesta se busca en los datos, el catálogo, los resultados de las herramientas y el número "
  "pulsado. Si falta, se pide reescribir; si sigue faltando, la respuesta lleva ⚠️. Además: recomendaciones solo si "
  "se piden (📚 del catálogo con fuente, 🤖 propias y sin verificar) y memoria de dos mensajes.",
  "fijado por prueba", ("Cómo evita inventar", "docs/de-t/DE-T_COMO_EVITA_INVENTAR.md"),
  ("Herramientas", "app/dete/herramientas.mjs"), ("Pruebas", "app/dete/herramientas.test.mjs"))
N("m_dete_contexto", "metodo", "dete", "Contexto del número pulsado",
  "La página manda el número, su tipo, la explicación que ya se leyó, la sección, el texto alrededor y lo elegido "
  "(región, periodo y preocupación). El servidor acepta solo esos campos, recortados, y una regla le dice al modelo "
  "que son contexto y no instrucciones. Por qué: para que explique ese número con otras palabras, sin repetir la "
  "tarjeta y sin mezclar otro periodo con su registro completo.",
  "fijado por prueba", ("Cómo evita inventar", "docs/de-t/DE-T_COMO_EVITA_INVENTAR.md"),
  ("Contexto", "app/src/lib/dete/context.ts"), ("Servidor", "app/dete/server.mjs"))
N("l_dete", "limite", "dete", "DE-T puede equivocarse",
  "Las respuestas las escribe un modelo de lenguaje (Kimi, de Moonshot AI). El verificador confirma que cada cifra "
  "existe en los datos, no que la frase sea correcta. Sus series cubren el registro completo de Nuevo León, no el "
  "periodo ni la región elegidos en la página.",
  "advertido", ("Cómo evita inventar", "docs/de-t/DE-T_COMO_EVITA_INVENTAR.md"), ("Límites de la página", "app/README.md"))
N("l_dete_estatico", "limite", "dete", "Solo con su servidor",
  "DE-T aparece cuando sirve la página su propio servidor (dete/server.mjs) y tiene clave. Una copia estática no "
  "muestra ningún botón ni hace peticiones. La copia pública de GitHub Pages lee un interruptor (rama dete-publico): "
  "mientras alguien del equipo tiene abierto npm run dete:publico, muestra a DE-T, que responde desde ese equipo por un "
  "túnel y con tope de gasto; al cerrarlo, desaparece. Por qué: GitHub solo sirve archivos y la clave no puede ir en el "
  "repositorio; así Fran decide cuándo se enciende y cuándo se apaga.",
  "comprobado", ("Dónde aparece y por qué", "docs/de-t/DE-T_DONDE_APARECE.md"), ("DE-T", "app/dete/README.md"))

# ---------- Pendientes
N("t_entrega", "pendiente", "pendientes", "Registrar la entrega del reto",
  "El sitio generado está en GitHub. Queda habilitar la demo pública, verificar el enlace e incluirlo en la entrega oficial.",
  "pendiente", ("Pendientes", "docs/PENDIENTES.md"))
N("t_texturas", "pendiente", "pendientes", "Permiso de las texturas",
  "Fran eligió conservar el globo actual en GitHub después de una comparación local con mapas de la NASA. "
  "Queda obtener permiso para usar las texturas actuales en la entrega.",
  "pendiente", ("Decisión y procedencia", "docs/PENDIENTES.md"))
N("t_dete", "pendiente", "pendientes", "Clave de Kimi y catálogo de DE-T",
  "DE-T se probó con un Kimi simulado. Falta la clave del equipo, probarlo con el modelo real, aprobar el "
  "catálogo de opciones y declarar Kimi en el formulario de uso de IA.",
  "pendiente", ("Pendientes", "docs/PENDIENTES.md"))
N("t_subir", "pendiente", "pendientes", "Regenerar el sitio publicado",
  "DE-T y los cuadros ya están en GitHub (main en 16e50a1, 15 de noviembre de 2026). El sitio estático (site/) se "
  "generó antes: hay que ejecutar npm run site y subirlo para que la copia publicada tenga los cuadros centrados y el "
  "selector de año. DE-T no aparece en la copia estática.",
  "pendiente", ("Pendientes", "docs/PENDIENTES.md"))
N("t_demo", "pendiente", "pendientes", "Demo y textos en inglés",
  "Vídeo de 30 segundos o 7 diapositivas, y los campos de la página del proyecto.",
  "pendiente", ("Reglas oficiales", "docs/REGLAS_OFICIALES.md"))
N("t_textos", "pendiente", "pendientes", "Revisar los textos de la demo",
  "El equipo eligió el caso del agua. Falta que revise los borradores en inglés y explique el diferenciador con sus palabras.",
  "pendiente", ("Pendientes", "docs/PENDIENTES.md"))
N("t_lluvia_cv", "pendiente", "pendientes", "Completar la lluvia del Valle Central",
  "Los datos regionales de IMERG y CHIRPS para California faltan en el repositorio. El caso allí dispone de GRACE.",
  "pendiente", ("Diagnóstico", "docs/DIAGNOSTICO_AGUA.md"))
N("t_fuente", "pendiente", "pendientes", "Fuente independiente",
  "La regla 1 pide contrastar el cambio de Monterrey con un artículo o un informe externo.",
  "pendiente", ("Validación", "docs/VALIDACION.md"))
N("t_giovanni", "pendiente", "pendientes", "Decidir sobre Giovanni",
  "Si se usa como herramienta de la solución, más allá de las siete descargas autorizadas.",
  "pendiente", ("Decisión", "docs/decisiones/GIOVANNI.md"))
N("t_cita", "pendiente", "pendientes", "Verificar una cita",
  "La página atribuye el cálculo a Weatherhead et al. (1998). La revisión de la fórmula frente al artículo figura pendiente en la nota de ideas.",
  "pendiente", ("Ideas", "docs/IDEAS.md"))

# ---------- Resúmenes para el mapa general
N("g_reglas", "grupo", "reglas", "Reglas · 5 criterios oficiales<br/>y 4 reglas del equipo",
  "Cómo se evalúa el proyecto y qué exige el equipo a cada propuesta.", "resumen")
N("g_preguntas", "pregunta", "preguntas", "Preguntas de Fran<br/>y propuestas documentadas",
  "Qué se quiere averiguar y con qué enfoque.", "resumen")
N("g_recursos", "recurso", "recursos", "Recursos · 13 oficiales<br/>y fuentes justificadas",
  "De dónde se pueden sacar datos y métodos.", "resumen")
N("g_mty", "dato", "monterrey", "Datos de Monterrey<br/>5 series, 2001–2025",
  "Lluvia, temperatura del aire, humedad de las raíces, temperatura superficial y verdor.", "resumen")
N("g_nl", "dato", "nuevo_leon", "Datos de Nuevo León<br/>series regionales",
  "GLDAS, GRACE, lluvia regional, cuencas y presas.", "resumen")
N("g_metodo", "metodo", "metodo", "Método · ritmo, 3 pruebas<br/>y coartadas",
  "Cómo se pasa de una serie a un veredicto.", "resumen")
N("g_hallazgos", "hallazgo", "hallazgos", "Señales de Monterrey<br/>calor, lluvia y verdor",
  "Lo que dicen los datos de Monterrey.", "resumen")
N("g_limites", "limite", "limites", "Límites conocidos",
  "Lo que acompaña a cada resultado para no leerlo de más.", "resumen")
N("g_pendientes", "pendiente", "pendientes", "Entrega de la demo<br/>y revisión del equipo",
  "Lo que falta antes de la entrega.", "resumen")

# (origen, destino, relación, pendiente)
ARISTAS = [
    # Mapa general
    ("reto", "g_reglas", "se evalúa con", False),
    ("reto", "g_recursos", "ofrece", False),
    ("reto", "g_preguntas", "motiva", False),
    ("g_recursos", "g_mty", "entregan", False),
    ("g_recursos", "g_nl", "entregan", False),
    ("g_mty", "g_metodo", "se analizan con", False),
    ("g_metodo", "g_hallazgos", "da", False),
    ("g_limites", "g_hallazgos", "matizan", False),
    ("g_preguntas", "p_pagina", "dan forma a", False),
    ("g_hallazgos", "p_pagina", "se muestran en", False),
    ("g_reglas", "p_pagina", "condicionan", False),
    ("p_pagina", "g_pendientes", "falta", True),
    ("g_nl", "p_agua", "alimenta", False),
    ("p_agua", "p_pagina", "forma parte de", False),
    ("p_agua", "p_mundo", "se amplía con", False),
    ("d_grace", "h_almacen", "mide", False),
    ("d_gldas", "p_agua", "aporta variables modeladas", False),
    ("d_lluvia_nl", "h_residuo", "aporta precipitación", False),
    ("h_almacen", "h_residuo", "se ajusta por lluvia", False),
    ("m_agua", "h_almacen", "calcula la tendencia", False),
    ("h_residuo", "h_huella", "apoya", False),
    ("d_acuiferos", "h_huella", "aporta un testigo", False),
    ("h_huella", "p_agua", "se interpreta en", False),
    ("l_grace", "h_almacen", "acota la escala", False),
    ("d_agua_nl", "p_agua", "aporta series de presas", False),
    ("p_agua", "m_capas", "define las capas de referencia", False),
    ("m_capas", "p_mundo", "determina la cuenta", False),
    ("d_grace", "h_mundo", "permite el muestreo", False),
    ("m_agua", "h_mundo", "clasifica cada serie", False),
    ("l_punto", "h_mundo", "limita la interpretación", False),
    ("h_mundo", "p_mundo", "ofrece un primer vistazo", False),
    ("p_agua", "t_lluvia_cv", "requiere un contraste en California", True),
    # Reto, reglas e ideas
    ("reto", "criterios", "se evalúa con", False),
    ("reto", "entrega", "exige", False),
    ("reto", "consideraciones", "sugiere", False),
    ("consideraciones", "ideas13", "inspiran", False),
    ("validacion", "fran1", "filtra", False),
    ("validacion", "fran2", "filtra", False),
    ("validacion", "ideas13", "filtra", False),
    ("regla_ia", "ideas13", "deja en propuesta", False),
    ("regla_ia", "t_textos", "exige", True),
    ("fran1", "p_caso", "se ve en", False),
    ("fran2", "p_caso", "se pone a prueba en", False),
    ("ideas13", "p_lab", "dan forma a", False),
    # De dónde sale cada dato
    ("recursos", "r_appeears", "incluye", False),
    ("recursos", "r_hydro", "incluye", False),
    ("recursos", "r_giovanni", "incluye", False),
    ("recursos", "r_otros", "incluye", False),
    ("r_appeears", "d_lst", "entregó", False),
    ("r_appeears", "d_ndvi", "entregó", False),
    ("r_externos", "d_imerg", "NASA POWER", False),
    ("r_externos", "d_merra", "NASA POWER", False),
    ("r_externos", "d_smn", "SMN", False),
    ("r_hydro", "d_gldas", "permite explorar el producto", False),
    ("r_giovanni", "d_gldas", "vía autorizada", False),
    ("r_giovanni", "t_giovanni", "falta decidir", True),
    ("r_externos", "d_grace", "PO.DAAC", False),
    ("r_externos", "d_lluvia_nl", "USF, NOAA y UCSB", False),
    ("r_externos", "d_agua_nl", "INEGI y CONAGUA", False),
    ("r_otros", "l_noaa", "tiene", False),
    ("l_noaa", "d_smn", "por eso se usa", False),
    ("d_imerg", "s_series", "alimenta", False),
    ("d_merra", "s_series", "alimenta", False),
    ("d_lst", "s_series", "alimenta", False),
    ("d_ndvi", "s_series", "alimenta", False),
    ("d_smn", "s_series", "alimenta", False),
    ("d_imerg", "s_anual", "se resume en", False),
    ("d_smn", "s_anual", "se resume en", False),
    ("s_series", "p_pagina", "alimenta", False),
    ("s_series", "manifiesto", "originales en", False),
    ("d_gldas", "manifiesto", "registrado en", False),
    ("d_grace", "manifiesto", "registrado en", False),
    ("d_lluvia_nl", "manifiesto", "registrado en", False),
    ("d_agua_nl", "manifiesto", "registrado en", False),
    ("l_imerg", "d_lluvia_nl", "limita", False),
    ("l_grace", "d_grace", "limita", False),
    ("l_gldas", "d_gldas", "fija el inicio de", False),
    ("d_grace", "t_lluvia_cv", "falta el contraste de lluvia", True),
    # Del dato al veredicto
    ("s_series", "m_calidad", "pasa por", False),
    ("m_calidad", "m_anom", "después", False),
    ("m_anom", "m_sen", "cuánto cambia", False),
    ("m_anom", "m_jurado", "si es real", False),
    ("m_memoria", "m_jurado", "ensancha", False),
    ("m_sen", "m_veredicto", "ritmo", False),
    ("m_jurado", "m_veredicto", "votos", False),
    ("m_regla", "m_veredicto", "condiciona", False),
    ("m_veredicto", "m_coartadas", "se somete a", False),
    ("m_veredicto", "m_anios", "si no hay pruebas", False),
    ("m_anios", "t_cita", "falta", True),
    ("fran1", "m_pistas", "se mide con", False),
    ("fran2", "m_pistas", "se mide con", False),
    ("m_pistas", "s_anual", "produce", False),
    ("s_anual", "m_jurado", "una pista por año", False),
    # Qué sabemos de Monterrey
    ("d_lst", "h_noches", "sostiene", False),
    ("d_lst", "h_lugares", "sostiene", False),
    ("d_lst", "h_dia", "sostiene", False),
    ("h_noches", "h_deriva", "se pone a prueba", False),
    ("l_terra", "h_deriva", "motiva", False),
    ("l_terra", "h_dia", "matiza", False),
    ("l_calidad", "h_noches", "obliga al filtro estándar", False),
    ("l_causa", "h_noches", "matiza", False),
    ("d_smn", "h_aire", "sostiene", False),
    ("h_aire", "h_noches", "respalda", False),
    ("d_imerg", "h_lluvia", "sostiene", False),
    ("d_imerg", "h_gemelos", "sostiene", False),
    ("d_imerg", "h_episodios", "sostiene", False),
    ("d_merra", "h_episodios", "segunda señal", False),
    ("d_imerg", "h_testigo", "sostiene", False),
    ("d_smn", "h_testigo", "sostiene", False),
    ("h_testigo", "h_lluvia", "respalda", False),
    ("l_multiples", "h_lluvia", "matiza", False),
    ("l_celda", "h_lluvia", "matiza", False),
    ("d_ndvi", "h_verdor", "sostiene", False),
    ("l_calidad", "h_verdor", "deja fuera al centro", False),
    ("d_merra", "h_suelo", "sostiene", False),
    ("l_celda", "h_suelo", "matiza", False),
    ("l_gldas", "h_gldas", "matiza", False),
    ("l_horas", "h_gldas", "matiza", False),
    ("h_gldas", "d_gldas", "se contrasta con series posteriores", False),
    ("h_noches", "t_fuente", "falta contraste externo", True),
    # La página y lo que falta
    ("p_pagina", "p_caso", "contiene", False),
    ("p_pagina", "p_lab", "contiene", False),
    ("p_pagina", "p_expediente", "contiene", False),
    ("h_vacio", "p_pagina", "justifica", False),
    ("h_gemelos", "p_caso", "se muestra en", False),
    ("h_lluvia", "p_caso", "se muestra en", False),
    ("h_noches", "p_lab", "se muestra en", False),
    ("h_lugares", "p_lab", "se muestra en", False),
    ("h_verdor", "p_lab", "se muestra en", False),
    ("h_aire", "p_lab", "segundo testigo en", False),
    ("m_jurado", "p_lab", "decide en", False),
    ("m_coartadas", "p_lab", "pone a prueba en", False),
    ("p_pagina", "criterios", "se juzga con", False),
    ("p_expediente", "entrega", "declara IA y fuentes", False),
    ("p_pagina", "t_entrega", "se enlaza en", True),
    ("p_mundo", "t_texturas", "requiere para la entrega", True),
    ("entrega", "t_demo", "falta", True),
    ("p_pagina", "t_textos", "requiere revisión", True),
    ("p_dete", "p_pagina", "forma parte de", False),
    ("p_agua", "p_dete", "le da sus cifras", False),
    ("p_dete", "t_dete", "requiere", True),
    # Página: los cuadros y la explicación de cada número
    ("p_cuadros", "p_pagina", "abre", False),
    ("fran1", "p_cuadros", "se ve en", False),
    ("d_imerg", "p_cuadros", "un cuadro por día", False),
    ("d_lst", "p_cuadros", "un cuadro por mes", False),
    ("p_pagina", "p_numeros", "contiene", False),
    # DE-T: qué se hizo al integrarlo y por qué
    ("q_dete", "p_dete", "se construye como", False),
    ("p_numeros", "p_dete", "termina con «¿No quedó claro?»", False),
    ("p_numeros", "m_dete_contexto", "aporta el número y su explicación", False),
    ("m_dete_contexto", "p_dete", "le dice qué número se pulsó", False),
    ("m_agua", "d_dete", "da las tendencias de referencia", False),
    ("d_acuiferos", "d_dete", "aporta la tabla oficial", False),
    ("d_dete", "m_dete_herr", "es la única base de", False),
    ("m_dete_herr", "p_dete", "calcula las cifras de", False),
    ("m_dete_verif", "p_dete", "revisa cada cifra de", False),
    ("h_dete_paso", "d_dete", "obligó a exportar desde la página", False),
    ("h_dete_paso", "h_almacen", "habría contradicho", False),
    ("l_dete", "p_dete", "matiza", False),
    ("l_dete_estatico", "p_dete", "limita dónde aparece", False),
    ("p_cuadros", "t_subir", "falta en el sitio publicado", True),
]

GRUPOS = {
    "reglas": "Reto y reglas",
    "preguntas": "Preguntas e ideas",
    "recursos": "Recursos",
    "monterrey": "Datos de Monterrey",
    "nuevo_leon": "Datos de Nuevo León",
    "metodo": "Método",
    "hallazgos": "Hallazgos",
    "limites": "Límites",
    "pagina": "Página web",
    "agua": "Caso 001 · agua",
    "mundo": "Escalabilidad",
    "dete": "DE-T · asistente del caso",
    "pendientes": "Pendientes",
}

VISTAS = [
    dict(id="general", titulo="Mapa general", direccion="LR",
         intro="Cada caja resume un grupo; las secciones siguientes lo abren.",
         nodos=["reto", "g_reglas", "g_preguntas", "g_recursos", "g_mty", "g_nl", "g_metodo", "g_hallazgos",
                "g_limites", "p_agua", "p_mundo", "p_pagina", "p_dete", "g_pendientes"]),
    dict(id="reto", titulo="1 · Reto, reglas e ideas", direccion="LR",
         intro="Qué pide el reto, con qué se evalúa y qué preguntas guían la herramienta.",
         nodos=["reto", "criterios", "entrega", "consideraciones", "validacion", "regla_ia", "fran1", "fran2",
                "ideas13", "p_caso", "p_lab", "p_cuadros", "t_textos"]),
    dict(id="datos", titulo="2 · De dónde sale cada dato", direccion="LR",
         intro="El camino de cada serie, desde el recurso hasta la página. «Misión» es medido desde un satélite; "
               "«modelo», producido por un modelo; «en tierra», observado en una estación.",
         nodos=["recursos", "r_appeears", "r_hydro", "r_giovanni", "r_otros", "r_externos", "d_imerg", "d_merra",
                "d_lst", "d_ndvi", "d_smn", "s_series", "s_anual", "d_gldas", "d_grace", "d_lluvia_nl",
                "d_agua_nl", "manifiesto", "p_pagina", "l_noaa", "l_imerg", "l_grace", "l_gldas", "t_giovanni",
                "t_lluvia_cv"]),
    dict(id="metodo", titulo="3 · Del dato al veredicto", direccion="LR",
         intro="Caso 002. El laboratorio de Monterrey usa tres pruebas. El caso del agua emplea las dos pruebas que se describen en su propia vista.",
         nodos=["s_series", "m_calidad", "m_anom", "m_sen", "m_jurado", "m_memoria", "m_regla", "m_veredicto",
                "m_coartadas", "m_anios", "t_cita", "fran1", "fran2", "m_pistas", "s_anual"]),
    dict(id="hallazgos", titulo="4 · Qué sabemos de Monterrey", direccion="LR",
         intro="Cada hallazgo con el dato que lo sostiene, el testigo que lo respalda y el límite que lo matiza.",
         nodos=["d_lst", "d_smn", "d_imerg", "d_ndvi", "d_merra", "h_noches", "h_lugares", "h_deriva", "h_aire",
                "h_dia", "h_lluvia", "h_gemelos", "h_episodios", "h_testigo", "h_verdor", "h_suelo", "h_gldas",
                "l_terra", "l_calidad", "l_celda", "l_multiples", "l_causa", "l_gldas", "l_horas", "d_gldas",
                "t_fuente"]),
    dict(id="agua", titulo="5 · Caso del agua en Nuevo León y el Valle Central", direccion="TB",
         intro="¿Qué sigue explicando la pérdida de agua cuando se tiene en cuenta la lluvia?",
         nodos=["d_grace", "d_lluvia_nl", "m_agua", "h_almacen", "h_residuo", "d_acuiferos",
                "h_huella", "p_agua", "t_lluvia_cv"]),
    dict(id="mundo", titulo="6 · Del caso de Nuevo León al globo", direccion="TB",
         intro="El globo responde a dos preguntas distintas. Una se refiere a la disponibilidad de datos y otra al cambio ya medido por GRACE.",
         nodos=["p_agua", "m_capas", "m_agua", "d_grace", "h_mundo", "l_punto", "p_mundo"]),
    dict(id="pagina", titulo="7 · La página y la entrega", direccion="LR",
         intro="Qué enseña la herramienta, de dónde sale cada parte y qué queda antes de la entrega.",
         nodos=["h_vacio", "h_gemelos", "h_lluvia", "h_noches", "h_lugares", "h_verdor", "h_aire", "m_jurado",
                "m_coartadas", "p_pagina", "p_caso", "p_lab", "p_expediente", "criterios", "entrega",
                "p_agua", "p_mundo", "p_dete", "p_cuadros", "p_numeros", "t_entrega", "t_demo", "t_textos",
                "t_texturas", "t_dete", "t_subir"]),
    dict(id="dete", titulo="8 · DE-T, el asistente del caso", direccion="LR",
         intro="Qué se hizo el 15 de noviembre de 2026 al integrar el asistente que entregó Fran, y por qué: de dónde "
               "saca sus cifras, cómo evita inventarlas, dónde aparece y qué falta.",
         nodos=["q_dete", "p_numeros", "m_dete_contexto", "d_dete", "m_agua", "d_acuiferos", "h_dete_paso",
                "h_almacen", "m_dete_herr", "m_dete_verif", "l_dete", "l_dete_estatico", "p_dete", "p_pagina",
                "t_dete"]),
]

ESENCIAL = [
    "El equipo eligió investigar el ciclo del agua en Nuevo León. El Valle Central de California permite "
    "comparar el almacenamiento con menos datos locales. [Verificación de las cifras](DIAGNOSTICO_AGUA.md).",
    "El paso 9, propuesto por Fran, cuenta las capas que ya se tienen o se podrían obtener en otro país. "
    "[Escalabilidad](ESCALABILIDAD.md).",
    "En el Caso 002, las noches del centro de Monterrey se calientan a razón de 0,96 °C por década entre "
    "2001 y 2025. En 2016 y 2020, dos totales de lluvia casi iguales se distribuyeron de formas muy distintas. "
    "[Pruebas del laboratorio](../app/src/lib/analysis.test.ts) · [Tabla anual de lluvia](../datos/derivados/lluvia_anual.csv).",
    "DE-T, el asistente que entregó Fran, responde con las mismas cifras que la página: salen de water.json y un "
    "verificador las busca en los datos antes de mostrarlas. Se abre bajo la explicación de cada número. Al "
    "integrarlo se vio que el zip medía la pendiente por paso (GRACE −8,53 frente a −7,135 cm por década). "
    "[Qué se hizo y por qué](de-t/DE-T.md).",
]


ESTADOS = [
    ("oficial", "Lo dice una página oficial de Space Apps o de la NASA."),
    ("fijado por prueba", "Lo calcula la página y una prueba automática fija la cifra."),
    ("calculado por la página", "Lo calcula la página; ninguna prueba fija todavía la cifra."),
    ("cálculo exploratorio", "Se calculó una vez con el mismo motor; no está fijado ni documentado aparte."),
    ("documentado / comprobado contra SciPy", "Está en una nota publicada, con un script que lo reproduce."),
    ("preliminar", "Se calculó sin tener los datos guardados; hay que repetirlo."),
    ("datos del caso", "El producto aporta observaciones al caso del agua."),
    ("preliminar por punto", "Se ha calculado con GRACE mundial y falta corroboración local."),
]


# Caso 001 y paso mundial. Los números salen de las referencias Python que viajan
# con las series. El grafo usa los intervalos de OLS-HAC y las pendientes de Sen
# del análisis original, en lugar de implementar por segunda vez las pruebas.
AGUA = ("Series y resultados de referencia", "app/public/data/water.json")
MUNDO = ("Puntos y resultados de referencia", "app/public/data/world.json")
DIAGNOSTICO = ("Verificación del caso", "docs/DIAGNOSTICO_AGUA.md")
ESCALA = ("Cobertura y validación", "docs/ESCALABILIDAD.md")
ETIQUETAS = {"confirmed": "confirmada", "hint": "indicio", "none": "sin evidencia", "nodata": "datos insuficientes"}
TENDENCIAS = []


def numero(valor, decimales=1):
    return f"{valor:.{decimales}f}".replace("-", "−").replace(".", ",")


def tabla_tendencias():
    filas = []
    for t in TENDENCIAS:
        lo, hi = t["ic_ols_95_decada"]
        p = t["p_hamed_rao"]
        filas.append([t["nombre"], f'{t["desde"]}–{t["hasta"]} ({t["n"]})',
                      f'{numero(t["sen_decada"], 2)} {t["unidad"]}',
                      f'{numero(lo, 2)} a {numero(hi, 2)}', "—" if p is None else f"{p:.3g}".replace(".", ","),
                      t["etiqueta"]])
    return tabla(["Serie", "Periodo (años con datos)", "Sen por década", "IC OLS por década (95 %)", "p", "Resultado"], filas)


def cargar_resultados(raiz):
    agua = json.loads((raiz / AGUA[1]).read_text(encoding="utf-8"))["regions"]
    mundo = json.loads((raiz / MUNDO[1]).read_text(encoding="utf-8"))
    for region, serie, nombre, unidad in (
        ("nl", "rain_imerg", "Lluvia anual IMERG · Nuevo León", "mm"),
        ("nl", "rain_chirps", "Lluvia anual CHIRPS · Nuevo León", "mm"),
        ("nl", "temp_gldas_mty", "Temperatura GLDAS · Monterrey", "°C"),
        ("nl", "pet_gldas_mty", "Demanda evaporativa anual GLDAS · Monterrey", "mm"),
        ("nl", "soil_gldas_gal", "Humedad de las raíces GLDAS · Galeana", "mm"),
        ("nl", "tws_grace", "Agua total GRACE · Nuevo León", "cm"),
        ("cv", "tws_grace", "Agua total GRACE · Valle Central (preliminar)", "cm"),
    ):
        r = agua[region]
        years = r["series"][serie]["years"]
        ref = r["reference"][serie][f"{years[0]}-{years[-1]}"]
        TENDENCIAS.append(dict(region=region, serie=serie, nombre=nombre, unidad=unidad, n=ref["n"],
                               desde=years[0], hasta=years[-1], sen_decada=10 * ref["sen"],
                               ic_ols_95_decada=[10 * ref["lo"], 10 * ref["hi"]],
                               p_hamed_rao=ref["p"], etiqueta=ETIQUETAS[ref["label"]]))

    nl = agua["nl"]
    ac = nl["aquifers"]
    deficit = [a["availability"] for a in ac if a["availability"] < 0]
    residuo = nl["referenceResidual"]["rain_imerg"]["full"]
    agua_nl = next(t for t in TENDENCIAS if t["region"] == "nl" and t["serie"] == "tws_grace")
    N("p_agua", "pagina", "agua", "Caso 001 · ¿Adónde fue el agua?",
      "El caso elegido por el equipo contrasta lluvia, calor, demanda evaporativa, humedad del suelo, "
      "escurrimiento, agua almacenada y posibles extracciones. La extracción se examina de forma indirecta.",
      "implementado", ("Página y autoría", "app/README.md"), ("Reglas del caso", "app/src/lib/water/case.ts"))
    N("m_agua", "metodo", "agua", "Dos pruebas del caso del agua",
      "Sobre medias o totales anuales se calcula la pendiente de Sen por año natural, la prueba "
      "Mann–Kendall corregida por Hamed–Rao y el intervalo al 95 % de mínimos cuadrados con errores "
      "Newey–West. La etiqueta «confirmada» requiere p < 0,05 e intervalo que excluye cero.",
      "en la página", ("Motor", "app/src/lib/water/engine.ts"), DIAGNOSTICO)
    N("h_almacen", "hallazgo", "agua", f'Nuevo León · GRACE<br/>{numero(agua_nl["sen_decada"])} cm por década',
      f'El almacenamiento total de agua desciende entre {agua_nl["desde"]} y {agua_nl["hasta"]}. '
      f'Hay {agua_nl["n"]} años con suficiente cobertura. Los huecos se conservan al calcular la pendiente.',
      "calculado desde la referencia", AGUA, DIAGNOSTICO)
    N("h_residuo", "hallazgo", "agua", "Pérdida tras ajustar por lluvia",
      f'La lluvia del año y del anterior explican una fracción R² = {numero(residuo["r2"], 2)} de la variación '
      f'anual de GRACE en {residuo["n"]} años comunes. El residuo tiene una pendiente de Sen de '
      f'{numero(10 * residuo["residual"]["sen"])} cm por década. Otros procesos pueden contribuir.',
      "calculado desde la referencia", AGUA, DIAGNOSTICO)
    N("d_acuiferos", "dato", "agua", f"{len(deficit)} de {len(ac)} acuíferos<br/>con disponibilidad negativa",
      f"El balance administrativo publicado por el DOF el 9 de noviembre de 2023 registra {len(deficit)} acuíferos "
      f"con disponibilidad negativa. Sus déficits suman {numero(sum(deficit))} hm³ al año. El balance ofrece "
      "un contraste independiente con la señal del satélite.",
      "dato oficial contrastado", ("Tabla de acuíferos", "recursos/archivos/nuevo-leon/acuiferos/acuiferos_nuevo_leon_DOF_2023-11-09.csv"), DIAGNOSTICO)
    N("h_huella", "hallazgo", "agua", "Huella humana compatible",
      "La pérdida persistente tras ajustar por precipitación y el déficit oficial son compatibles con presión "
      "humana en Nuevo León. La contribución de las extracciones queda sin cuantificar. El Valle Central sólo "
      "dispone de almacenamiento para esta comparación.",
      "interpretación del equipo", DIAGNOSTICO, ("Pruebas del veredicto", "app/src/lib/water/case.test.ts"))
    N("p_mundo", "pagina", "mundo", "Paso 9 · llevar el caso a otro país",
      "Propuesta de Fran. Nuevo León tiene las diez capas cargadas. Italia tiene siete listas y Finlandia cinco. "
      "Para otro país cuentan las capas cargadas y las abiertas que cubren su punto. La tabla de cobertura documenta 151 países y territorios con 7 de 10 y 29 con 6 de 10. Allí se puede consultar la distribución completa.",
      "implementado", ESCALA, ("Pruebas de las cuentas por país", "app/src/lib/world/world.test.ts"))
    N("m_capas", "metodo", "mundo", "Diez capas de siete fuentes",
      "IMERG y CHIRPS aportan lluvia. GLDAS aporta temperatura, demanda evaporativa, humedad del suelo y "
      "escurrimiento. GRACE aporta agua total. Las tres fuentes locales son la estación, las presas y el balance "
      "de acuíferos. En la regla del globo CHIRPS cubre hasta 50° de latitud e IMERG es completo hasta 60°. Una capa con cobertura parcial queda fuera de la cuenta.",
      "reglas del globo", ("Reglas por capa", "app/src/lib/world/layers.ts"), ESCALA)
    paises = mundo["countries"]
    refs = [c["ref"] for c in paises if c["tws"] is not None]
    clases = Counter(r["label"] for r in refs)
    bajan = sum(r["label"] == "confirmed" and r["sen"] < 0 for r in refs)
    suben = sum(r["label"] == "confirmed" and r["sen"] > 0 for r in refs)
    N("h_mundo", "preliminar", "mundo", f"GRACE · serie bajo {len(refs)}<br/>de {len(paises)} puntos",
      f"De los {len(paises)} países y territorios, {len(refs)} tienen serie terrestre o costera en su mascon. "
      f"Las dos pruebas dan descenso en {bajan} puntos y ascenso en {suben}. Hay indicio en {clases['hint']} "
      f"y falta evidencia de tendencia en {clases['none']}. Los otros {len(paises) - len(refs)} carecen de serie.",
      "preliminar por punto", MUNDO, ("Muestreo del mascon", "app/scripts/build_world.py"))
    N("l_punto", "limite", "mundo", "Un punto por país o territorio",
      "El mascon mide unos 3° de ancho. Los recuentos describen señales en puntos de referencia o su parte "
      "terrestre costera. En islas pequeñas la señal puede corresponder a una región mucho más extensa. Falta "
      "un testigo independiente para atribuir el cambio en cada país.",
      "alcance geográfico", ESCALA, ("GRACE", "recursos/archivos/nuevo-leon/grace/README.md"))


def porid():
    return {n["id"]: n for n in NODOS}


def comprobar(raiz):
    ids = [n["id"] for n in NODOS]
    assert len(ids) == len(set(ids)), "identificadores repetidos"
    nodos = porid()
    for a, b, _rel, _p in ARISTAS:
        assert a in nodos and b in nodos, f"arista con nodo inexistente: {a} → {b}"
    en_vista = set()
    for v in VISTAS:
        for nid in v["nodos"]:
            assert nid in nodos, f"vista {v['id']}: nodo inexistente {nid}"
        en_vista.update(v["nodos"])
        usados = set()
        for a, b, _rel, _p in ARISTAS:
            if a in v["nodos"] and b in v["nodos"]:
                usados.update((a, b))
        sueltos = set(v["nodos"]) - usados
        assert not sueltos, f"vista {v['id']}: nodos sin ninguna relación {sorted(sueltos)}"
    assert set(ids) == en_vista, f"nodos fuera de toda vista: {sorted(set(ids) - en_vista)}"
    for n in NODOS:
        assert n["tipo"] in TIPOS and n["grupo"] in GRUPOS, n["id"]
        for f in n["fuentes"]:
            if not f["ruta"].startswith("http"):
                assert (raiz / f["ruta"]).is_file(), f"{n['id']}: no existe {f['ruta']}"


def plano(etiqueta):
    return etiqueta.replace("<br/>", " ")


def enlace(fuente):
    """Enlace Markdown relativo a docs/, donde vive la nota."""
    ruta = fuente["ruta"]
    if ruta.startswith("http"):
        return f"[{fuente['titulo']}]({ruta})"
    rel = ruta[len("docs/"):] if ruta.startswith("docs/") else "../" + ruta
    return f"[{fuente['titulo']}]({rel})"


def fuentes_md(n):
    return " · ".join(enlace(f) for f in n["fuentes"]) if n["fuentes"] else "—"


def mermaid(vista):
    nodos = porid()
    sel = vista["nodos"]
    lineas = [f"flowchart {vista['direccion']}"]
    grupos = []
    for nid in sel:
        g = nodos[nid]["grupo"]
        if g not in grupos:
            grupos.append(g)
    agrupar = vista["id"] != "general"
    for g in grupos:
        miembros = [nid for nid in sel if nodos[nid]["grupo"] == g]
        sangria = "  "
        if agrupar:
            lineas.append(f'  subgraph sg_{vista["id"]}_{g}["{GRUPOS[g]}"]')
            sangria = "    "
        for nid in miembros:
            lineas.append(f'{sangria}{nid}["{nodos[nid]["etiqueta"]}"]')
        if agrupar:
            lineas.append("  end")
    for a, b, rel, pendiente in ARISTAS:
        if a in sel and b in sel:
            flecha = "-.->" if pendiente else "-->"
            lineas.append(f"  {a} {flecha}|{rel}| {b}")
    usados = []
    for nid in sel:
        t = nodos[nid]["tipo"]
        if t not in usados:
            usados.append(t)
    for t in usados:
        lineas.append(f"  classDef {t} {TIPOS[t][1]}")
        lineas.append(f"  class {','.join(nid for nid in sel if nodos[nid]['tipo'] == t)} {t}")
    return "\n".join(lineas)


def tabla(cabecera, filas):
    out = ["| " + " | ".join(cabecera) + " |", "|" + "---|" * len(cabecera)]
    out += ["| " + " | ".join(f) + " |" for f in filas]
    return "\n".join(out)


def de_grupo(grupo, tipos=None):
    return [n for n in NODOS if n["grupo"] == grupo and n["estado"] != "resumen" and (tipos is None or n["tipo"] in tipos)]


def bloque(vista_id):
    v = next(x for x in VISTAS if x["id"] == vista_id)
    return f"## {v['titulo']}\n\n{v['intro']}\n\n```mermaid\n{mermaid(v)}\n```"


def markdown():
    reglas = tabla(["Qué", "Qué dice", "Origen", "Fuente"],
                   [[plano(n["etiqueta"]), n["texto"], n["estado"], fuentes_md(n)]
                    for n in de_grupo("reglas") + de_grupo("preguntas")])
    recursos = tabla(["Recurso", "Qué sabemos de él", "Estado", "Fuente"],
                     [[plano(n["etiqueta"]), n["texto"], n["estado"], fuentes_md(n)] for n in de_grupo("recursos")])
    datos = tabla(["Dato", "Qué contiene", "Estado", "Dónde está"],
                  [[plano(n["etiqueta"]), n["texto"], n["estado"], fuentes_md(n)]
                   for n in de_grupo("monterrey") + de_grupo("nuevo_leon")])
    metodos = tabla(["Paso", "Qué hace", "Estado", "Fuente"],
                    [[plano(n["etiqueta"]), n["texto"], n["estado"], fuentes_md(n)] for n in de_grupo("metodo")])
    hallazgos = tabla(["Hallazgo", "Qué dicen los datos", "Cómo se sabe", "Fuente"],
                      [[plano(n["etiqueta"]), n["texto"], n["estado"], fuentes_md(n)] for n in de_grupo("hallazgos")])
    limites = tabla(["Límite", "Qué significa", "Origen", "Fuente"],
                    [[plano(n["etiqueta"]), n["texto"], n["estado"], fuentes_md(n)] for n in de_grupo("limites")])
    pagina = tabla(["Parte", "Qué hace", "Estado"],
                   [[plano(n["etiqueta"]), n["texto"], n["estado"]] for n in de_grupo("pagina")])
    pendientes = "\n".join(f"- [ ] **{plano(n['etiqueta'])}.** {n['texto']} {fuentes_md(n)}" for n in de_grupo("pendientes"))
    esencial = "\n".join(f"- {linea}" for linea in ESENCIAL)
    estados = "\n".join(f"- **{e}:** {d}" for e, d in ESTADOS)
    n_nodos = len(NODOS)
    return f"""---
tags: [raack, conocimiento, grafo]
fecha: {FECHA}
---
# Grafo de conocimiento de RAACK

[Índice](../INDICE.md) · [Reto](RETO.md) · [Reglas oficiales](REGLAS_OFICIALES.md) · [Mapa de datos](MAPA_DE_DATOS.md) · [Grafo de contexto](CONTEXTO.md) · [Datos del grafo en JSON](CONOCIMIENTO.json)

El equipo investiga qué explica la pérdida de agua en Nuevo León y qué ocultan los promedios anuales en Monterrey. Este grafo conecta las preguntas con los datos, el método, los hallazgos y las pruebas que aún faltan. Cada vista abre una parte del grafo. El [contexto](CONTEXTO.md) conserva la historia del trabajo.

Actualizado el {CORTE}. Contiene {n_nodos} nodos y {len(ARISTAS)} relaciones. Las etiquetas «fijado por prueba» y «calculado por la página» remiten al motor del caso correspondiente.

## Lo esencial en un minuto

{esencial}

{bloque("general")}

Una flecha continua conecta hechos documentados. Una flecha punteada lleva a algo que queda pendiente.

{bloque("reto")}

{reglas}

{bloque("datos")}

{recursos}

{datos}

{bloque("metodo")}

{metodos}

{bloque("hallazgos")}

{hallazgos}

### Cómo se sabe cada cosa

{estados}

### Límites que acompañan a los resultados

{limites}

{bloque("agua")}

{tabla(["Evidencia", "Cómo se interpreta", "Fuente"], [[plano(n["etiqueta"]), n["texto"], fuentes_md(n)] for n in de_grupo("agua")])}

{tabla_tendencias()}

Las tendencias de California son preliminares. El archivo mundial y las series guardadas en JSON permiten reproducirlas, y sigue pendiente el contraste regional con precipitación. El intervalo al 95 % corresponde a la pendiente de mínimos cuadrados con errores Newey–West. El ritmo que se muestra es la pendiente de Sen sobre años naturales. [Método](../app/src/lib/water/engine.ts) · [Verificación frente a Python](DIAGNOSTICO_AGUA.md).

{bloque("mundo")}

{tabla(["Elemento", "Qué sabemos", "Fuente"], [[plano(n["etiqueta"]), n["texto"], fuentes_md(n)] for n in de_grupo("mundo")])}

### Cuatro reglas para interpretar el paso mundial

El punto de referencia de un país permite medir cobertura y calcular una tendencia preliminar. La regla 1 queda abierta para atribuir un cambio local en cada país, porque faltan testigos independientes. La regla 2 se puede comprobar con la cuenta de capas y las dos pruebas de tendencia. Para la regla 3, la serie mundial procede de GRACE y la lista externa aporta coordenadas. La regla 4 se ve al elegir un país y consultar qué registros en tierra habría que reunir. [Validación por regla](ESCALABILIDAD.md) · [Criterios del equipo](VALIDACION.md).

{bloque("pagina")}

{pagina}

### Pendientes

{pendientes}

{bloque("dete")}

{tabla(["Pieza", "Qué es y por qué", "Estado", "Fuente"], [[plano(n["etiqueta"]), n["texto"], n["estado"], fuentes_md(n)] for n in de_grupo("dete")])}

## Cómo actualizarlo

`CONOCIMIENTO.json` y esta nota se generan con [generar_conocimiento.py](generar_conocimiento.py) a partir de las mismas listas y de los datos científicos de la aplicación. Para añadir un hallazgo, un dato o un pendiente, edita `NODOS` y `ARISTAS` al principio del script y ejecuta `python3 docs/generar_conocimiento.py docs` desde la raíz del repo. El script se niega a escribir si una relación apunta a un nodo que no existe o si una fuente citada no está en el repositorio.

Claude preparó el grafo inicial del laboratorio y sus recursos. Codex recuperó ese trabajo y añadió el caso del agua y la extensión mundial con las cifras de los archivos del proyecto. El caso del agua fue elegido por el equipo. Las preguntas sobre el calendario y la extensión por país son de Fran. Claude integró DE-T, el asistente que diseñó el equipo y entregó Fran ([qué se hizo y por qué](de-t/DE-T.md)), centró los [cuadros de la portada](CUADROS_PORTADA.md) y añadió su vista a este grafo el 15 de noviembre de 2026.
"""


def datos():
    return {
        "proyecto": "RAACK",
        "reto": RETO,
        "fecha": FECHA,
        "corte": CORTE,
        "nota": "Grafo de conocimiento del equipo. Generado por docs/generar_conocimiento.py con ayuda de IA (Claude y Codex). "
                "Las rutas son relativas a la raíz del repositorio.",
        "tendencias_caso_agua": TENDENCIAS,
        "tipos": {t: nombre for t, (nombre, _e) in TIPOS.items()},
        "grupos": GRUPOS,
        "estados": {e: d for e, d in ESTADOS},
        "nodos": [dict(id=n["id"], tipo=n["tipo"], grupo=n["grupo"], etiqueta=plano(n["etiqueta"]), texto=n["texto"],
                       estado=n["estado"], fuentes=n["fuentes"]) for n in NODOS],
        "aristas": [dict(origen=a, destino=b, relacion=rel, pendiente=p) for a, b, rel, p in ARISTAS],
        "vistas": [dict(id=v["id"], titulo=v["titulo"], nodos=v["nodos"]) for v in VISTAS],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("destino", nargs="?", type=Path, default=Path("docs"))
    parser.add_argument("--raiz", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    destino = args.destino
    cargar_resultados(args.raiz)
    comprobar(args.raiz)
    (destino / "CONOCIMIENTO.json").write_text(json.dumps(datos(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (destino / "CONOCIMIENTO.md").write_text(markdown(), encoding="utf-8")
    print(f"{len(NODOS)} nodos · {len(ARISTAS)} relaciones · {len(VISTAS)} vistas")


if __name__ == "__main__":
    main()
