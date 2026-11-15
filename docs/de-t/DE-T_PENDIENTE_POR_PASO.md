---
tags: [raack, de-t, hallazgo]
fecha: 2026-11-15
---
# La pendiente por paso del zip

[DE-T](DE-T.md) · [Grafo de conocimiento](../CONOCIMIENTO.md) · [Verificación del caso del agua](../DIAGNOSTICO_AGUA.md)

## Qué se encontró

Antes de integrar a DE-T se compararon sus 27 series (`series_nl.json` del zip) con las de la página (`app/public/data/water.json`). Los años y los valores coincidían, salvo el redondeo. Las tendencias no siempre:

| Serie | Zip | Página |
|---|---|---|
| Agua almacenada GRACE, Nuevo León | −8,53 cm por década | −7,135 cm por década |
| Evaporación de tanque, SMN Monterrey | −231,3 mm/año por década | −185,8 mm/año por década |
| Temperatura media, SMN Monterrey | 0,370 °C por década | 0,332 °C por década |
| Volumen de La Boca | «confirmada» | «indicio» |

## Por qué pasaba

- **La pendiente.** El script del zip (`exportar_series_nl.py`) medía la pendiente de Sen por paso de la serie, no por año real. Las tres series tienen años sin dato: GRACE no tiene 2015, 2017 ni 2018. Así, la pendiente por paso sale más empinada que por año. La página la mide sobre los años reales. El mismo problema ya estaba documentado en la [verificación del caso](../DIAGNOSTICO_AGUA.md).
- **La Boca.** La prueba de Hamed–Rao no se puede calcular en esa serie. El zip usaba entonces otra prueba (Yue–Wang), que daba «confirmada». La página deja la prueba sin calcular y, con solo la recta, la etiqueta es «indicio».

## Por qué importaba

Si un juez pulsa «−7.1 cm per decade» y DE-T contesta «−8,53», la herramienta se contradice a sí misma. Por eso no bastaba con corregir tres cifras a mano: DE-T pasó a tomar sus cifras de la página. Ver [Las cifras de DE-T son las de la página](DE-T_CIFRAS_DE_LA_PAGINA.md).

Qué cifra de GRACE cita la entrega, −7,1 o −8,5, sigue siendo una decisión del equipo ([Pendientes](../PENDIENTES.md)). Mientras tanto, DE-T y la página dicen lo mismo.

Nota redactada con ayuda de IA (Claude) para el equipo RAACK.
