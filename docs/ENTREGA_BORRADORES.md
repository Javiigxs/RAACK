---
tags: [raack, entrega, borradores]
fecha: 2026-11-14
estado: borrador
---
# Entrega · borradores para la página del proyecto y la demo

[Índice](../INDICE.md) · [Reglas oficiales](REGLAS_OFICIALES.md) · [Página web](../app/README.md) · [Verificación de las cifras](DIAGNOSTICO_AGUA.md) · [Pendientes](PENDIENTES.md)

Borradores escritos por Claude (IA) el 14 de noviembre de 2026 a partir de la página web y de las cifras verificadas. **El equipo decide el texto final y el pitch.** Los bloques en inglés están listos para copiar en la página del proyecto de Space Apps; lo que está entre corchetes falta.

## Antes de copiar nada: tres decisiones del equipo

1. **Qué cifra de GRACE se cita.** La página muestra **−7.1 cm por década** (pendiente medida en años reales). El script original daba −8.5 porque contaba los años que faltan como consecutivos; el detalle está en el [hallazgo 1 de la verificación](DIAGNOSTICO_AGUA.md). Estos borradores usan −7.1.
2. **Formato de la demo:** 7 diapositivas o vídeo de 30 segundos. Abajo hay un borrador de cada uno.
3. **Nombres del equipo** para la portada, los créditos de la página y el segundo 0 del vídeo.

## Campos de la página del proyecto

### 1 · Project Name

```text
Trend Detective: why is the water running out?
```

### 2 · High-Level Project Summary

```text
Trend Detective is a web tool that investigates why a region is running out of water. It treats water as a bank account (change in stored water = rain − evaporation − runoff − human withdrawals) and questions every term with the same two significance tests on NASA data: GPM IMERG rainfall, GLDAS land-surface variables and GRACE/GRACE-FO stored water. Every result gets a certainty label, independent witnesses and a robustness check over any period the user chooses. Fixed rules then turn the evidence into a verdict that states what the data can and cannot prove.

In Nuevo León, Mexico, rain shows no trend in eight different records, yet stored water has been falling 7.1 cm per decade and 13 of the state's 23 aquifers are officially over-allocated. The verdict: a one-off drought in 2022 on top of a long-term loss consistent with a human footprint. It matters because the response to a dry year and the response to over-extraction are different decisions.
```

### 3 · Link to Project Demo

```text
[enlace público a las diapositivas o al vídeo]
```

### 4 · Link to Final Project

```text
[enlace público al sitio]
https://github.com/Javiigxs/RAACK
```

### 5 · Detailed Project Description

```text
WHAT IT DOES
Existing tools answer what is changing, where and how much, one variable at a time. Trend Detective follows the five steps of the challenge (choose variables, a region and a period, build the time series, test the trend) and then adds the question they leave open: why.

The user opens a case by choosing a region (Nuevo León, Mexico, or California's Central Valley), a period of at least 15 years and a worry: reservoirs dropping, wells going deeper, or drought. The tool then:
- Questions seven suspects of the water budget: rain, temperature, evaporation, soil moisture, runoff, total stored water and human withdrawals. Each card shows the yearly series, the trend line, the change per decade in units and as a percentage, the 95% interval, the p-value and a certainty label.
- Calls witnesses: the same tests on independent sources. Satellite rain is checked against a satellite-and-gauge blend, a weather station and three reservoir gauges.
- Shows who is moving: every term that shares a unit on one axis with its interval, and the same variable at two places 100 km apart, where five of six variables get a different label.
- Reaches a verdict with fixed rules: supply drought, demand drought, compound drought, possible human footprint (backed only with independent official evidence), one-off drought, or "we cannot tell yet". Missing data lowers the verdict and is named.
- Lists options for action and what to avoid, from a fixed catalogue tied to the verdict. Each option shows the figure that justifies it.
- States what it does NOT say.

A second case, "Inside the year", opens a year of Monterrey day by day: two years with the same rainfall total can be very different years to live through. It also lets the user test seven variables at five places of the city.

HOW IT WORKS
A Python script reads the source files stored in the repository and builds one yearly series per suspect: yearly sums for flows, yearly means for states, complete years only, regional means weighted by latitude, GRACE with its seasonal cycle removed. The page computes every trend in the browser:
- Rate of change: Sen's slope on the real time axis.
- Test 1: Mann-Kendall with the Hamed-Rao correction for serial correlation.
- Test 2: least squares with Newey-West errors and a 95% interval.
- Label: "confirmed" when both tests agree, "hint" when only one does, "no evidence" when neither.
Moving the period sliders recomputes everything, so a verdict that depends on hand-picked years is exposed. Automated tests compare the browser engine with pymannkendall and statsmodels in more than 400 series and periods, and pin every figure the page shows.

WHAT IT FOUND IN NUEVO LEÓN
- Rain: +33 mm per decade with a 95% interval from −46 to +109. No evidence of a trend, in the satellite and in seven other records.
- Temperature: rising 0.6 °C per decade, confirmed.
- Evaporative demand: falling, not rising (−95 mm per decade, confirmed).
- Total stored water (GRACE): −7.1 cm per decade, confirmed, in every period tested. After removing the effect of rain it still falls 4.1 cm per decade.
- Official record: 13 of 23 aquifers have negative availability; their deficits add up to 381 hm³ per year.
- 2022: rain 33% below normal and the Cerro Prieto reservoir at 13% of its usual volume.
Verdict: a one-off drought in 2022 on top of a steady loss of stored water, consistent with a human footprint and backed by official figures. Not a supply drought and not a demand drought.

The same global GRACE file cut over California's Central Valley shows the same signal (−13.1 cm per decade, confirmed). With no rainfall, evaporation or official record loaded for that region, the tool stops at "possible human footprint" and lists what is missing.

BENEFITS AND GOALS
Water managers, journalists and citizens get an answer they can check, with its uncertainty and its limits. The method is not tied to one place: adding a region needs only its files and one run of the build script.

TOOLS
Svelte 5, TypeScript, Vite and d3 (scale, shape, array) for the site; charts are SVG drawn from the data, with no external request at run time. Python with pandas, NumPy, pymannkendall, statsmodels and netCDF4 for the yearly series and the reference results. Vitest and svelte-check for the tests. English and Spanish, light and dark, phone and desktop.
```

### 6 · Use of Super Intelligence (SI)

```text
The idea was defined by the team: treat a region's water as a budget, question each term with the same method and reach a verdict with fixed rules. The team also fixed the statistical method, the rules of the verdict and the catalogue of options, and reviewed the diagnosis of Nuevo León.

AI coding assistants (Anthropic Claude and OpenAI Codex) worked under the team's direction. They wrote the code that retrieves and verifies the data files, the Python script that builds the yearly series, the statistical engine that runs in the browser, the interface and the first draft of its text. The source files say so in their headers, and the site has a "Use of AI" section.

While reproducing the team's figures, an AI assistant found that the slope "per decade" was being measured per step of the series when years were missing. The site shows the value measured in real years; the verification note in the repository shows both.

No AI-generated imagery, audio or data is used. Every number is computed from files of NASA, CHIRPS, CONAGUA, SMN and Mexico's Official Gazette, and the engine is checked by automated tests against pymannkendall and statsmodels. [Si la demo usa imágenes, voz o vídeo generados, decirlo aquí y ponerles marca de agua.]
```

### 7 · NASA Data

```text
- GPM IMERG Final Precipitation L3, monthly, 0.1°, V07 (GPM_3IMERGM), January 1998 to September 2025, retrieved through the USF IMaRS ERDDAP server. The rainfall of the region and of its crisis year.
- GLDAS Noah Land Surface Model L4, 3-hourly, 0.25°, V2.1 (GLDAS_NOAH025_3H_2.1), March 2001 to July 2026: rainfall, evapotranspiration, potential evaporation, root-zone soil moisture, surface and subsurface runoff and air temperature at two cells. Retrieved through the service behind the Hydrology Time Series viewer.
- GRACE and GRACE-FO JPL Mascon RL06.3 v04 with CRI filter (TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4), April 2002 to September 2026, from PO.DAAC. Total stored water in Nuevo León and in California's Central Valley.
- Hydrology Time Series (NASA GES DISC), one of the challenge resources.
- For the second case: GPM IMERG daily precipitation and MERRA-2 root-zone soil wetness through NASA POWER; MODIS/Terra land surface temperature (MOD11A2 v061) and vegetation index (MOD13A3 v061) extracted with AppEEARS; a Harmonized Landsat Sentinel-2 image from NASA GIBS.

NASA data are the core of the tool: the verdict rests on IMERG (is rain falling?), GLDAS (is evaporative demand rising?) and GRACE (is stored water falling?).
```

### 8 · Space Agency Partner Data and Other References

```text
Data
- The map of the second case contains modified Copernicus Sentinel data (2025), through NASA's Harmonized Landsat Sentinel-2 product.
- CHIRPS v2.0, Climate Hazards Center, UC Santa Barbara (Funk et al., 2015), through NOAA CoastWatch ERDDAP.
- CONAGUA, Sistema de Información Hidrológica: daily records of the El Cuchillo, Cerro Prieto and La Boca reservoirs.
- Servicio Meteorológico Nacional (Mexico): daily records of station 19052, Monterrey.
- Diario Oficial de la Federación, 9 November 2023: agreement that updates the mean annual availability of groundwater (the 23 aquifers of Nuevo León).

Methods
- Hamed, K. H., & Rao, A. R. (1998). A modified Mann-Kendall trend test for autocorrelated data. Journal of Hydrology, 204, 182–196.
- Sen, P. K. (1968). Estimates of the regression coefficient based on Kendall's tau. JASA, 63, 1379–1389.
- Newey, W. K., & West, K. D. (1987). A simple, positive semi-definite, heteroskedasticity and autocorrelation consistent covariance matrix. Econometrica, 55, 703–708.
- Mann, H. B. (1945). Nonparametric tests against trend. Econometrica, 13, 245–259.
- Watkins, M. M., et al. (2015) and Wiese, D. N., et al. (2016), for the JPL mascons.
- Rodell, M., et al. (2004). The Global Land Data Assimilation System. BAMS, 85, 381–394.
- Roderick, M. L., & Farquhar, G. D. (2002). The cause of decreased pan evaporation over the past 50 years. Science, 298, 1410–1411.

Software
Svelte, Vite, TypeScript, d3-scale, d3-shape, d3-array, Vitest, svelte-check; Python, pandas, NumPy, SciPy, pymannkendall, statsmodels, netCDF4. AI coding assistants: Anthropic Claude and OpenAI Codex.
```

## Demo, opción A · siete diapositivas

Máximo siete, contando la portada. Pocas palabras y una imagen de la herramienta en cada una.

| N.º | Título | Contenido | Imagen |
|---|---|---|---|
| 1 | Trend Detective: why is the water running out? | Team RAACK · [nombres] · challenge *Be An Earth System Trend Detective!* | Portada del sitio |
| 2 | Tools tell you what. Nobody tells you why. | Existing viewers answer what, where and how much, one variable at a time. In 2022 Monterrey ran out of water: was it the rain? | El año de la crisis: lluvia de 2022 mes a mes |
| 3 | Water is a bank account | Change in stored water = rain − evaporation − runoff − human withdrawals. Seven suspects, one method, two tests, a certainty label | La ecuación y una tarjeta de sospechoso |
| 4 | The suspects have alibis | Rain: no trend in 8 different records. Evaporative demand: falling, not rising. NASA IMERG and GLDAS | Gráfica «Who is moving?» |
| 5 | But the water is leaving | GRACE: −7.1 cm per decade, confirmed in every period. 13 of 23 aquifers officially in deficit | Tarjeta de agua almacenada y tabla de acuíferos |
| 6 | The verdict, and what it does NOT say | A one-off drought in 2022 on top of a steady loss, consistent with a human footprint. In California the same signal only reaches "possible": the tool names what is missing | Veredicto y comparación de las dos regiones |
| 7 | From diagnosis to options | A dry year and over-extraction need different decisions. Options tied to the verdict, each with its figure. Any region: add its files and rerun | Opciones de acción |

## Demo, opción B · guion del vídeo de 30 segundos

Sigue el reparto que sugiere la guía oficial. Unas 70 palabras: se dicen en 30 segundos sin correr.

| Segundo | Voz (inglés) | En pantalla |
|---|---|---|
| 0–2 | We are team RAACK, from Monterrey. | Nombres del equipo |
| 2–5 | In 2022 our city ran out of water. We wanted to know why. | Presa Cerro Prieto al 13 % (dato en pantalla) |
| 5–10 | Trend Detective: ask the data why the water is running out. | Portada y la ecuación del balance |
| 10–20 | It treats water like a bank account and questions every suspect with NASA data. Rain from IMERG: no trend. Stored water from GRACE: falling 7 centimetres a decade. | Selector, tarjetas de lluvia y de GRACE, veredicto |
| 20–30 | A drought year on top of a long-term loss. The tool says what the data prove, what they don't, and what can be done, for any region. | Opciones de acción y comparación con California |

Si la voz no es en inglés, el vídeo necesita subtítulos en inglés.

## Lista antes de enviar

- [ ] Revisar los textos de la página (inglés y español): son un primer borrador.
- [ ] Decidir la cifra de GRACE que se cita y usar la misma en la página, la demo y la descripción.
- [ ] Poner los nombres del equipo en los créditos (`w.credits.team` en `app/src/lib/i18n-water.ts`) y en la demo.
- [ ] Publicar el sitio: subir la carpeta `site/` y activar GitHub Pages. El enlace quedaría como `https://javiigxs.github.io/RAACK/site/`.
- [ ] Abrir el enlace del sitio y el de la demo en una ventana privada.
- [ ] Completar los ocho campos y pulsar **Submit for Judging** con margen.
- [ ] Opcional: guardar la lluvia del Valle Central en `recursos/archivos/valle-central/` para que su veredicto use lluvia y no solo GRACE.

## Uso de IA

Claude (IA) redactó estos borradores. Las cifras salen de la [nota de verificación](DIAGNOSTICO_AGUA.md) y de las pruebas automáticas de la página. La idea, el método y las reglas del veredicto son del equipo.

## Actualización del 15 de noviembre de 2026 · escalabilidad

Borradores de Claude (IA) para contar el paso 9, «Take the case to any country». La idea es de Fran. Las cifras salen de `app/public/data/world.json` y de las pruebas automáticas; el detalle está en [Escalabilidad](ESCALABILIDAD.md). **El equipo decide si lo usa y cómo.**

Para añadir al campo 5, *Detailed Project Description*:

> **It scales.** The Nuevo León case stands on ten data layers. Seven of them are open and global: NASA's GPM IMERG, GLDAS and GRACE/GRACE-FO, plus CHIRPS. The other three are ground records that each country has to supply: a weather station, reservoir storage and the official groundwater balance. Pick any country on the globe and Trend Detective turns to it and counts what is ready: 10 of 10 for Nuevo León, 7 of 10 for most of the world, fewer where a product stops (CHIRPS at 50° of latitude, complete IMERG at 60°). For 189 countries and territories it already runs the stored-water test on the GRACE mascon under them.

Para una diapositiva o para los segundos 20 a 30 del vídeo:

> One case, any country. 7 of 10 data layers are ready today, anywhere NASA looks. The other 3 are local homework.

Para el campo 8, *Space Agency Partner Data and Other References*, si se confirma la licencia:

> Countries, an open data set by Mohammed Le Doze (names, reference points and areas), from the copy packaged in Linux Mint.

**Antes de enviar:** resolver el permiso de las texturas de la Tierra, anotado en [Pendientes](PENDIENTES.md).
