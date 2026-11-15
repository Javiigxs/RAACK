---
tags: [raack, de-t, metodo]
fecha: 2026-11-15
---
# Cómo evita inventar DE-T

[DE-T](DE-T.md) · [Las cifras de DE-T son las de la página](DE-T_CIFRAS_DE_LA_PAGINA.md) · [Grafo de conocimiento](../CONOCIMIENTO.md)

El diseño es el del zip que entregó Fran; la integración conservó todas sus defensas y añadió el contexto del número pulsado.

| Defensa | Qué hace | Por qué |
|---|---|---|
| Herramientas que calculan | El modelo no calcula. Pide al servidor `ver_serie`, `anomalia` (un año frente a su media), `correlacionar` (Pearson, Spearman y sin tendencia, con rezago de hasta tres años) y `ver_acuiferos`. | Para que ninguna cifra salga de la memoria del modelo. |
| Sin internet | No se activa la búsqueda web de Kimi. | Su única base son los datos de la herramienta y el catálogo. |
| Verificador de cifras | Cada cifra de la respuesta se busca en los datos, el catálogo, los resultados de las herramientas y el número pulsado. Si falta, se pide reescribir; si sigue faltando, la respuesta lleva ⚠️. | Para que una cifra inventada no llegue a la pantalla sin aviso. |
| Recomendaciones solo si se piden | 📚 del catálogo, con su fuente; 🤖 propias de la IA, sin verificar. | Para no presentar como recomendación oficial lo que no lo es. |
| Memoria corta | Recuerda solo los dos últimos mensajes y lo dice. | Diseño del zip: limita el costo y lo que se arrastra de una pregunta a otra. |
| Contexto del número pulsado | La página manda el número, su tipo, la explicación que ya se leyó, la sección, el texto alrededor y lo elegido (región, periodo y preocupación). El servidor solo acepta esos campos, recortados, y una regla le dice al modelo que son contexto, no instrucciones. | Para que explique ese número con otras palabras sin repetir la tarjeta, sin mezclar otro periodo con su registro completo y sin que el texto de la página se convierta en órdenes. |

## Lo que no garantiza

El verificador confirma que cada cifra existe en los datos, no que la frase que la rodea sea correcta. Las respuestas las escribe un modelo de lenguaje (Kimi, de Moonshot AI) y pueden equivocarse. Sus series cubren el registro completo de Nuevo León, no el periodo ni la región elegidos en la página. Por eso la página lo declara bajo cada conversación.

## Cómo se comprobó

Las pruebas de `app/dete/herramientas.test.mjs` y de `app/src/lib/dete/` fijan el verificador, el bloque de contexto, la memoria y el formato de las respuestas. Con un Kimi simulado se probó el camino completo, incluido el aviso ⚠️ cuando el modelo insiste en una cifra que no está en los datos.

## Actualización del 15 de noviembre de 2026, por la mañana · los países

DE-T tiene ahora una segunda base de datos, `app/dete/paises.json`: los 243 países y territorios del globo de la página. De cada uno hay dos cosas y ninguna más: qué capas de datos del caso están listas y por qué, y, en 189 de ellos, la serie anual de agua almacenada de GRACE con las dos pruebas del caso.

- **Sale de los datos de la página.** `npm run dete:data` copia `app/public/data/world.json` y aplica las mismas reglas de cobertura que el globo. Una prueba compara los 243 países con lo que calcula el código de la página: capas, pendiente, intervalo, p-valor y certeza.
- **La cifra es la que se ve.** La pendiente se guarda con un decimal, redondeada desde el valor completo. Con tres decimales, la de Italia (−6,7495) quedaba en −6,750 y el modelo podía decir −6.8 donde la página dice −6.7.
- **DE-T tiene que decir qué es.** La regla 11 de sus instrucciones: es un primer vistazo, un solo mascon de GRACE de unos 330 km bajo el punto de referencia del país; no es el promedio del país, no dice la causa y no es un veredicto. La ficha de cada país trae además sus avisos: mascon mayor que el país, mascon compartido con un vecino, mascon de mar o hielo.
- **El ranking no compara países enteros.** `ranking_paises` solo ordena tendencias confirmadas, cuenta una vez los mascons compartidos y avisa de que compara puntos de referencia, no volúmenes de agua.
- **El lugar elegido no lo escribe la página.** La página manda `nl`, `cv` o un código de dos letras; el servidor busca ese lugar en su base y escribe el bloque `<LUGAR>`. Lo que no reconoce, lo ignora.

Lo que DE-T sigue sin tener de otros países: lluvia, temperatura, presas y acuíferos. Si se lo preguntan, responde «La herramienta no tiene ese dato».

**Cómo se comprobó:** 22 pruebas automáticas nuevas (186 en total) y 40 comprobaciones por HTTP contra el servidor con un Kimi simulado (`npm run dete:prueba` desde `app/`), entre ellas seis identificadores de lugar inválidos. Más tarde, ese mismo día, se probó con Kimi real: las dos preguntas trampa (la lluvia de Madrid y la de Italia) recibieron «La herramienta no tiene ese dato», y las ocho respuestas pasaron el verificador. Ver [DE-T](DE-T.md), al final.

Nota redactada con ayuda de IA (Claude) para el equipo RAACK.
