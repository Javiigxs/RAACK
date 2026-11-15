---
tags: [raack, agua, nuevo-leon, verificación]
fecha: 2026-11-14
---
# Diagnóstico del agua · verificación de las cifras

[Índice](../INDICE.md) · [Página web](../app/README.md) · [Datos de Nuevo León](REQUISITOS_DATOS_NUEVO_LEON.md) · [Script del equipo](diagnostico_nl.py) · [Generador de datos](../app/scripts/build_water.py)

Esta nota la escribe `app/scripts/build_water.py` cada vez que se ejecuta; no se edita a mano. Última ejecución: 14 de noviembre de 2026. Compara las cifras que el equipo dio por validadas con las que salen de los archivos guardados en el repositorio. La página web calcula las tendencias en el navegador a partir de las mismas series anuales, y unas pruebas automáticas comprueban que su motor da lo mismo que pymannkendall y statsmodels.

## Resultado

- **61 de 70 cifras reproducidas.** 4 se aproximan (≈, las del Valle Central: ver el hallazgo 3), 0 no coinciden y 5 no se pueden reproducir porque sus archivos no están en el repositorio.
- El script del equipo, [diagnostico_nl.py](diagnostico_nl.py), se ejecutó sin cambios sobre el repositorio y da los mismos números que esta tabla.
- Las etiquetas (confirmada, indicio, sin evidencia) no cambian en ningún caso.

## Hallazgo 1 · la pendiente «por década» cuando faltan años

`pymannkendall` calcula la pendiente de Sen **por paso de la serie**, no por año. Si no falta ningún año, es lo mismo. Cuando faltan años, los pasos se cuentan como años consecutivos y «× 10» deja de ser «por década». Pasa en estas series:

| Serie | Periodo | Años con dato | Sen por paso × 10 | Sen con años reales × 10 | OLS × 10 |
|---|---|---|---|---|---|
| `pan_smn` | 2000–2025 | 19 de 26 | −231.27 | −185.82 | −165.08 |
| `temp_smn` | 1998–2025 | 26 de 28 | +0.37 | +0.33 | +0.32 |
| `tws_grace` | 2003–2026 | 21 de 24 | −8.53 | −7.14 | −6.95 |

- GRACE no tiene 2015, 2017 ni 2018 (menos de 9 meses). Con los años reales la pérdida es **−7.1 cm por década**, no −8.5. La cifra anterior queda fuera de su propio intervalo de OLS ([−8.2, −5.6]); la corregida queda dentro.
- La evaporación de tanque del SMN tiene 19 años completos entre 2000 y 2025: **−186 mm por década (−11 %)**, no −231 (−14 %).
- La comparación de orden de magnitud pasa de 547 a **458 hm³ al año**, frente a un déficit oficial de 381.
- La prueba de Mann-Kendall usa rangos y el intervalo de OLS ya usa los años reales, así que **ningún veredicto cambia**: solo cambia el tamaño del cambio.

**La página muestra la pendiente con años reales.** La columna «método del equipo» conserva la cifra original para que el equipo decida cuál cita en la presentación.

## Hallazgo 2 · una prueba que no se puede calcular

En el volumen de La Boca la corrección de Hamed-Rao deja una varianza negativa y el valor p no existe. `pymannkendall` devuelve `nan`. La página lo dice («not computable») y deja la etiqueta en «indicio», porque solo el intervalo de OLS excluye el cero.

## Hallazgo 3 · Valle Central

La serie de GRACE del Valle Central sale del archivo mundial con la misma receta que Nuevo León: centros de celda dentro del recuadro, pesos cos(latitud) y sin factores de escala. Da −15.5 cm por década por paso y **−13.1 con años reales**; la cifra esperada era −16.4. La diferencia con la esperada (alrededor del 6 %) no se pudo explicar: probablemente otra selección de celdas. El valor p (0.0003), los años del mínimo y el signo coinciden.

La lluvia del Valle Central, el mapa del norte, Ciudad del Cabo y el Alto Madeira **no tienen archivos en el repositorio**. Siguiendo la regla del equipo, la página no muestra esas cifras. Para incluir la lluvia del Valle Central basta guardar los dos CSV de ERDDAP en `recursos/archivos/valle-central/imerg/` y `recursos/archivos/valle-central/chirps/` y volver a ejecutar el script.

## Hallazgo 4 · la tabla de acuíferos coincide con el Diario Oficial

El 14 de noviembre de 2026 se abrió el [acuerdo publicado](https://sidof.segob.gob.mx/notas/docFuente/5708074) y se compararon los 23 renglones de Nuevo León con el [CSV del equipo](../recursos/archivos/nuevo-leon/acuiferos/acuiferos_nuevo_leon_DOF_2023-11-09.csv): recarga, descarga natural comprometida, volumen concesionado y disponibilidad coinciden en todos, redondeados a un decimal. El acuerdo confirma la fecha de corte del 30 de diciembre de 2022.

La disponibilidad no sale solo de las columnas del CSV. El acuerdo la define como `DMA = R − DNC − VEAS`, y la extracción `VEAS` suma al volumen concesionado (`VCAS`) otros tres volúmenes que el CSV no trae: `VEALA` (zonas de suspensión provisional de libre alumbramiento), `VAPTYR` (pendiente de titulación o registro) y `VAPRH` (reservas, reglamentos y programación hídrica). Ejemplo, Lampazos-Villaldama: 21.8 − 8.0 − (11.592650 + 12.586924 + 0 + 0.028601) = −10.408.

## Tabla de verificación

| Cifra | Esperada (equipo) | Reproducida, método del equipo | En la página (años reales) | Estado |
|---|---|---|---|---|
| Lluvia IMERG 1998–2024, pendiente de Sen | +33 mm/década | +33 mm/década | +33 mm/década | ✓ |
| Lluvia IMERG, cambio relativo | +5 %/década | +5 %/década | +5 %/década | ✓ |
| Lluvia IMERG, p de Hamed-Rao | 0.36 | 0.36 | igual | ✓ |
| Lluvia IMERG, IC 95 % de OLS-HAC | [−46, +109] | [−46, +109] | igual | ✓ |
| Lluvia IMERG, etiqueta | sin evidencia | sin evidencia | igual | ✓ |
| Lluvia CHIRPS 1998–2025, pendiente de Sen | +2 mm/década | +2 mm/década | +2 mm/década | ✓ |
| Lluvia CHIRPS, p de Hamed-Rao | 0.95 | 0.95 | igual | ✓ |
| Lluvia estación SMN Monterrey, pendiente de Sen | +44 mm/década | +44 mm/década | +44 mm/década | ✓ |
| Lluvia SMN, cambio relativo | +6 %/década | +6 %/década | +6 %/década | ✓ |
| Lluvia SMN, p de Hamed-Rao | 0.49 | 0.49 | igual | ✓ |
| Pluviómetros de las tres presas, cambio relativo | de −2 a −14 %/década, sin evidencia | de −2.0 a −13.7 %/década; sin evidencia | de −2.0 a −13.7 %/década | ✓ |
| Anomalía de lluvia de 2022, IMERG | −32.7 % | −32.7 % | igual | ✓ |
| Anomalía de lluvia de 2022, CHIRPS | −26.8 % | −26.8 % | igual | ✓ |
| Anomalía de lluvia de 2011, IMERG | −45 % | −45 % | igual | ✓ |
| Anomalía de lluvia de 2011, CHIRPS | −36 % | −36 % | igual | ✓ |
| Temperatura GLDAS Monterrey, pendiente de Sen | +0.60 °C/década | +0.60 °C/década | +0.60 °C/década | ✓ |
| Temperatura GLDAS Monterrey, etiqueta | confirmada | confirmada | igual | ✓ |
| Temperatura GLDAS Galeana, pendiente de Sen | +0.93 °C/década | +0.93 °C/década | +0.93 °C/década | ✓ |
| Temperatura GLDAS Galeana, etiqueta | confirmada | confirmada | igual | ✓ |
| Temperatura estación SMN, pendiente de Sen | +0.37 °C/década | +0.37 °C/década | +0.33 °C/década | ✓ |
| Temperatura estación SMN, etiqueta | confirmada | confirmada | igual | ✓ |
| Evaporación potencial GLDAS Monterrey, pendiente de Sen | −95 mm/década | −95 mm/década | −95 mm/década | ✓ |
| Evaporación potencial GLDAS Monterrey, cambio relativo | −2.7 %/década | −2.7 %/década | −2.7 %/década | ✓ |
| Evaporación potencial GLDAS Monterrey, etiqueta | confirmada (baja) | confirmada | igual | ✓ |
| Evaporación de tanque SMN (19 años completos), pendiente de Sen | −231 mm/década | −231 mm/década | −186 mm/década | ✓ |
| Evaporación de tanque SMN, cambio relativo | −14 %/década | −14 %/década | −11 %/década | ✓ |
| Evaporación de tanque SMN, etiqueta | confirmada | confirmada | igual | ✓ |
| Evaporación de tanque Cerro Prieto, pendiente de Sen | −116 mm/década | −116 mm/década | −116 mm/década | ✓ |
| Evaporación de tanque Cerro Prieto, cambio relativo | −6 %/década | −6 %/década | −6 %/década | ✓ |
| Evaporación de tanque Cerro Prieto, etiqueta | confirmada | confirmada | igual | ✓ |
| Evaporación de tanque El Cuchillo, cambio relativo | −5.6 %/década | −5.6 %/década | −5.6 %/década | ✓ |
| Evaporación de tanque El Cuchillo, p de Hamed-Rao | 0.053 | 0.053 | igual | ✓ |
| Evaporación de tanque El Cuchillo, etiqueta | sin evidencia | sin evidencia | igual | ✓ |
| Humedad del suelo Galeana, pendiente de Sen | −28 mm/década | −28 mm/década | −28 mm/década | ✓ |
| Humedad del suelo Galeana, cambio relativo | −13.7 %/década | −13.7 %/década | −13.7 %/década | ✓ |
| Humedad del suelo Galeana, etiqueta | confirmada | confirmada | igual | ✓ |
| Humedad del suelo Monterrey, etiqueta | sin evidencia | sin evidencia | igual | ✓ |
| GRACE Nuevo León 2003–2026 (21 años), pendiente de Sen | −8.5 cm/década | −8.5 cm/década | −7.1 cm/década | ✓ |
| GRACE Nuevo León, p de Hamed-Rao | ≈ 0 | 2.9e-06 | igual | ✓ |
| GRACE Nuevo León, IC 95 % de OLS-HAC | [−8.2, −5.6] | [−8.2, −5.6] | igual | ✓ |
| GRACE Nuevo León, ventana 2003–2019 | −4.5 cm/década | −4.5 cm/década | −4.2 cm/década | ✓ |
| GRACE Nuevo León, ventana 2003–2021 | −6.8 cm/década | −6.8 cm/década | −5.2 cm/década | ✓ |
| GRACE Nuevo León, ventana 2005–2024 | −8.5 cm/década | −8.5 cm/década | −6.8 cm/década | ✓ |
| GRACE Nuevo León, ventana 2011–2026 | −9.5 cm/década | −9.5 cm/década | −8.1 cm/década | ✓ |
| GRACE frente a la lluvia del año y del anterior (IMERG, 19 años), R² | 0.44 | 0.44 | igual | ✓ |
| Residuo de esa regresión, pendiente de Sen | −5.0 cm/década | −5.0 cm/década | −4.1 cm/década | ✓ |
| Residuo de esa regresión, etiqueta | confirmada | confirmada | igual | ✓ |
| Orden de magnitud: pérdida × 64 156 km² | ≈ 545 hm³/año | 547 hm³/año | 458 hm³/año | ✓ |
| Volumen medio anual de las tres presas 2000–2025 | sin tendencia confirmada | El Cuchillo: sin evidencia; Cerro Prieto: sin evidencia; La Boca: indicio | igual | ✓ |
| Cerro Prieto, volumen medio de 2022 | 27.5 Mm³ | 27.5 Mm³ | igual | ✓ |
| Cerro Prieto, media 2000–2025 | 209.9 Mm³ | 209.9 Mm³ | igual | ✓ |
| Cerro Prieto, 2022 frente a su media | −87 % | −87 % | igual | ✓ |
| El Cuchillo, volumen medio de 2022 | 592.9 Mm³ | 592.9 Mm³ | igual | ✓ |
| El Cuchillo, media 2000–2025 | 900.0 Mm³ | 900.0 Mm³ | igual | ✓ |
| El Cuchillo, 2022 frente a su media | −34 % | −34 % | igual | ✓ |
| Acuíferos con disponibilidad negativa (DOF 2023) | 13 de 23 | 13 de 23 | igual | ✓ |
| Suma de los déficits | −381.1 hm³/año | −381.1 hm³/año | igual | ✓ |
| Los cinco acuíferos que abastecen a Monterrey | todos en déficit | Área Metropolitana de Monterrey −12.4; Campo Buenos Aires −5.9; Campo Mina −7.1; Campo Durazno −1.4; Cañón del Huajuco −2.2 | igual | ✓ |
| Los cuatro déficits mayores | Citrícola Sur −88.9; Sabinas-Parás −74.1; Navidad-Potosí-Raíces −69.7; Citrícola Norte −57.5 | Citrícola Sur −88.9; Sabinas-Parás −74.1; Navidad-Potosí-Raíces −69.7; Citrícola Norte −57.5 | igual | ✓ |
| GRACE Valle Central 2003–2026, pendiente de Sen | −16.4 cm/década | −15.5 cm/década | −13.1 cm/década | ≈ |
| GRACE Valle Central, p de Hamed-Rao | 0.0003 | 0.0003 | igual | ✓ |
| GRACE Valle Central, IC 95 % de OLS-HAC | [−17.9, −7.2] | [−16.8, −6.7] | igual | ≈ |
| GRACE Valle Central, ventana 2003–2021 | −22.2 cm/década | −20.9 cm/década | −17.1 cm/década | ≈ |
| GRACE Valle Central, ventana 2005–2024 | −21.4 cm/década | −20.0 cm/década | −15.6 cm/década | ≈ |
| GRACE Valle Central, mínimo | 2021–2022, de −20 a −22 cm | 2021: −19.1 cm; 2022: −21.1 cm | igual | ✓ |
| Lluvia IMERG del Valle Central | −16 mm/década, IC [−92, +61] | no reproducible | no se muestra | sin archivos |
| Lluvia CHIRPS del Valle Central | −17 mm/década, IC [−79, +46] | no reproducible | no se muestra | sin archivos |
| Norte de México por celdas, con corrección FDR | 1–3 celdas significativas de ~150 | no reproducible | no se muestra | sin archivos |
| Ciudad del Cabo: IMERG frente a CHIRPS | +6 frente a +92 mm/década | no reproducible | no se muestra | sin archivos |
| Auditoría del Alto Madeira | −167 mm/década con quiebre tras 2011 | no reproducible | no se muestra | sin archivos |

«Método del equipo»: pendiente de Sen por paso, como en `diagnostico_nl.py`. «En la página»: pendiente de Sen con los años reales; «igual» cuando no hay diferencia. Estado: ✓ reproducida, ≈ mismo signo y a menos del 8 %, ≠ distinta, «sin archivos» cuando no hay con qué calcularla.

## Cómo repetirlo

```bash
python3 -m venv .venv
.venv/bin/pip install -r app/scripts/requirements-water.txt
.venv/bin/python app/scripts/build_water.py --check
```

Versiones usadas en esta ejecución: python 3.12.3, numpy 2.5.4, pandas 3.1.1, statsmodels 0.15.0, pymannkendall 1.4.3, netCDF4 1.7.5.1.post1. El archivo `app/public/data/water.json` guarda el tamaño y el SHA-256 de los 15 archivos de entrada.

## Uso de IA

El método y el diagnóstico los definió el equipo. Claude (IA) escribió el generador de datos, esta verificación y el motor del navegador, y detectó el hallazgo 1. Ningún valor científico se generó con IA: todos salen de los archivos de NASA, CHIRPS, CONAGUA, SMN y el DOF.
