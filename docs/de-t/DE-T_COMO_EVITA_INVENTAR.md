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

Nota redactada con ayuda de IA (Claude) para el equipo RAACK.
