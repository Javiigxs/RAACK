# Trend Detective · team RAACK

Web tool built for the NASA Space Apps Challenge 2026, challenge *Be An Earth System Trend Detective!*
It answers the questions the challenge asks (what is changing, where, how much, and is it significant) and adds the one the existing tools leave open: **why**.

Status on 15 November 2026: working, tested locally (189 automated tests, desktop and phone, light and dark, English and Spanish). Not published yet; the team still has to review the wording. DE-T, the case assistant, was tested end to end with a simulated Kimi and, on the same day, with the real model (Kimi K3.1 Pro) through its server: its eight quick questions were answered with every figure checked against the data. It has not yet been watched in the page served with the real model.

## What it does

A single static site with two investigations. Every trend is computed in the browser from three data files; nothing arrives pre-computed.

The page opens with the Earth, drawn by the site's own WebGL code: the camera pulls back from the horizon and the planet becomes the backdrop of the page. Then comes *the signal in squares* (one square per rainy day, one per month of temperature). Every number on the page explains itself when pressed, and when the page is served with DE-T, the case assistant, the explanation ends with *Not clear? Ask DE-T*.

### DE-T, the case assistant

DE-T answers questions about the water case of Nuevo León, and about what the tool holds for each of the 243 countries of the globe, with the data of this tool only. It is the team's design: a small server (`dete/`) gives the language model (Kimi, by Moonshot AI) six tools that compute or look up every figure (a series, the anomaly of a year, a correlation with and without trends, the official aquifer table, the data layers and first look at stored water of a country, and a ranking of countries), and a checker compares every figure of the answer with the data before it is shown; a figure it cannot find is flagged with ⚠️. The model has no web access, gives options only when asked (📚 from the team's catalogue with its source, 🤖 its own suggestion, not verified), remembers only the last two messages and adapts its words to who is asking: a citizen, an official, a journalist, a researcher or a business.

- **Under every explained number:** *Not clear? Ask DE-T* opens the panel and asks what that number means. DE-T is told the number, what the page calls it, the explanation the reader just saw, the section and the region, period and worry chosen on the page.
- **Where the country is chosen** (step 9): a line to write a question about the place the globe shows, with three questions to start from. The page sends only the identifier of the place; what DE-T knows about it comes from the server's own data. For a country that is two things: which of the ten data layers are ready, and a first look at stored water (one GRACE mascon under the reference point of the country, not a verdict), and DE-T has to say so.
- **In the verdict**, an invitation to ask about it; **in the header** (on a narrow screen, a round button in the corner), the panel with three example questions.
- DE-T's figures are the page's: `dete/exportar_series.mjs` copies the yearly values and the reference trends of `public/data/water.json` into `dete/series_nl.json`, and the countries of `public/data/world.json` into `dete/paises.json`. `dete/herramientas.test.mjs` checks that both are up to date, and `src/lib/dete/countries.test.ts` compares every country with what the page's own code computes.
- The panel appears only when the page is served by the DE-T server and it has an API key. A static copy of the site (such as GitHub Pages) shows no DE-T button and sends no request.

### Case 001 · Where did the water go?

The water of a region is treated as a bank account:

```
Change in stored water = Rain − Evaporation − Runoff − Human withdrawals
```

1. **Open the case** — a region (Nuevo León, Mexico, or the Central Valley of California), a period (any years, at least 15) and a worry (reservoirs, wells or drought).
2. **Verdict** — one sentence with its level of certainty, the four pieces of evidence behind it, and the rule table that produced it.
3. **Seven suspects, one method** — rain, temperature, evaporation, soil moisture, runoff, total stored water and human withdrawals. Each one shows its yearly series, the Sen trend line, the change per decade (units and % of its mean), the 95% interval, the p-value, a certainty label, and its independent witnesses on the same axis.
4. **Who is moving?** — the change per decade of every term that shares a unit, with its interval; and the same variable at two places 100 km apart.
5. **The crisis year** — the rain of the driest year month by month, and the reservoirs against their usual volume.
6. **Independent evidence** — the official balance of 23 aquifers (Mexico's Official Gazette) and the reservoirs of CONAGUA.
7. **Options for action, and what to avoid** — a fixed catalogue tied to the verdict; each option shows the figure that justifies it and how certain that figure is.
8. **Same signal, two countries** — Nuevo León and the Central Valley side by side, on the same axis.
9. **Take the case to any country** — the reader picks a country, the globe turns to it and the page counts how many of the ten data layers of the Nuevo León case are ready there. Nuevo León is the complete case, 10 of 10; a country between 50° S and 50° N has 7 (open NASA and satellite products) and 3 ground records to collect. It also gives a first look at stored water under each of 243 countries and territories, with the two tests of the case.
10. **What this does NOT say**, **methods and sources**, **use of AI**.

Verdict for Nuevo León, full record: *a one-off drought in 2022, on top of a steady loss of stored water, consistent with a human footprint and backed by official figures. Not a supply drought, not a demand drought.*

### Case 002 · Inside the year, Monterrey

1. **Guided case — "Same rain, different year".** Two years in Monterrey with almost the same yearly rainfall (806 mm and 796 mm) turn out to be very different inside: in one of them five days brought half of the rain.
2. **Full investigation**, in eight steps that follow the challenge statement: what, where, when, look, verdict, cross-examination, where it is changing, a second witness. Seven variables, five 1 km points across the city, any period.
3. **Case file** — sources, methods, limits, use of AI, and a JSON download of the current result.

The interface is in English, with a Spanish version behind the `ES` switch.

## Data

### Case 001 (water)

| Suspect | Source | Record |
|---|---|---|
| Rain | **NASA** GPM IMERG Final V07, monthly, 0.1° (1,344 cells) | 1998–2024 |
| Rain, witness | CHIRPS v2.0 (UC Santa Barbara), satellite and gauges | 1998–2025 |
| Rain, temperature and pan evaporation on the ground | SMN station 19052; CONAGUA gauges at three reservoirs | 1998–2025 |
| Temperature, evaporation, soil moisture, runoff | **NASA** GLDAS-2.1 Noah, 0.25°, at Monterrey and Galeana | 2002–2025 |
| Total stored water | **NASA** GRACE and GRACE-FO, JPL mascons RL06.3 v04 (global file kept in the repository) | 2002–2026 |
| Reservoir volume | CONAGUA: El Cuchillo, Cerro Prieto, La Boca | 2000–2025 |
| Human withdrawals | No direct data. Official aquifer balance, Diario Oficial de la Federación, 9 November 2023 | cut-off 30 Dec 2022 |

`scripts/build_water.py` reads the source files of the repository (`recursos/archivos/`), builds the yearly series and writes `public/data/water.json`, with the size and SHA-256 of every input. The same script computes the trends in Python (pymannkendall and statsmodels); they travel inside the JSON as the reference the browser engine is tested against. It also writes [`docs/DIAGNOSTICO_AGUA.md`](../docs/DIAGNOSTICO_AGUA.md): every figure the team validated next to the figure reproduced from the files.

Adding a region needs only its files and one run of the script. The Central Valley shows what happens with less data: only GRACE is loaded, so the verdict stops at "possible" and names what is missing.

### Step 9 of Case 001 (the world)

| What | Source | Scope |
|---|---|---|
| Stored water under each country | **NASA** GRACE and GRACE-FO, JPL mascons RL06.3 v04: the global file already kept in the repository | 2003–2026, 189 countries and territories |
| Names (English and Spanish), reference point and area | Open data set "countries" by Mohammed Le Doze, from the copy packaged in Linux Mint (`mintsources` 2.4.3) | 243 countries and territories |
| Which layers reach a country | The published coverage of each product: GPM IMERG complete between 60° S and 60° N, CHIRPS on land between 50° S and 50° N, GLDAS-2.1 on land north of 60° S | A rule checked at one point per country, not a download test |

`scripts/build_world.py` reads the list of countries and the global GRACE file, takes the mascon under the reference point of each country (its land part; none when the mascon is all sea), builds the yearly series with the functions of `build_water.py` and writes `public/data/world.json`, again with the Python trends as the reference for the tests. The rules that decide which layer is ready are in `src/lib/world/layers.ts`. The team's note, in Spanish: [`docs/ESCALABILIDAD.md`](../docs/ESCALABILIDAD.md).

### The Earth

The three maps of the planet (`public/earth/`: day, night, and a mask of sea shine and clouds) come from the visual reference of the opening, the 3D hero tutorial by Robinzon100; `scripts/build-earth.py` copies them and halves the mask for phones. **That repository declares no licence, so permission to publish these maps is not confirmed**: see [`docs/PENDIENTES.md`](../docs/PENDIENTES.md). None of the tutorial's code is used.

### Case 002 (Monterrey)

| Variable | Source | Record |
|---|---|---|
| Rainfall | GPM IMERG daily precipitation, via NASA POWER | 2002–2024 |
| Soil wetness at root depth | MERRA-2 `GWETROOT`, via NASA POWER | 2002–2024 |
| Surface temperature, day and night | MODIS/Terra MOD11A2 v061, extracted with AppEEARS | 2001–2025 |
| Greenness (NDVI) | MODIS/Terra MOD13A3 v061, extracted with AppEEARS | 2001–2025 |
| Rainfall and air temperature at the station | Servicio Meteorológico Nacional (Mexico), station 19052 | 2002–2024 |

The map is a NASA GIBS image (Harmonized Landsat Sentinel-2, 14 March 2025). It contains modified Copernicus Sentinel data (2025). `scripts/build-data.mjs` packs `datos/series/*.csv` into `public/data/monterrey.json`.

## Run it

Requires Node.js 20 or later.

```bash
npm install
npm run dev      # development server at http://127.0.0.1:5173
npm test         # 189 automated tests
npm run check    # type check of every component
npm run build    # writes the static site to dist/
npm run site     # builds and copies the site to ../site, the folder to publish
npm run dete     # serves dist/ with DE-T at http://localhost:8000 (needs the Kimi key in dete/.env)
npm run dete:data  # rebuilds DE-T's data (dete/series_nl.json, dete/paises.json) from public/data/
npm run dete:prueba  # end-to-end test of the DE-T server against a simulated Kimi (no key needed)
npm run dete:real    # the eight quick questions against the real Kimi (needs the key; spends a few cents)
```

DE-T needs a Kimi API key in `dete/.env` (copy `dete/.env.example`; the file is ignored by git and must never be published). During `npm run dev`, Vite passes `/api` to the DE-T server on port 8000. How to run it, costs and limits: [`dete/README.md`](dete/README.md), in Spanish.

`dist/` (and its copy `site/`) is self-contained and uses relative paths, so it can be served from any folder of any static host. Open `?lang=es` for Spanish, `?view=city` for Case 002 and `?place=IT` to start step 9 on a country (its two-letter code; `cv` for the Central Valley).

**Motion.** When the system asks for less motion (`prefers-reduced-motion`), the Earth holds still and the globe jumps to a country instead of turning. The reader can turn motion on for this site with the button in the header or the one under the globe, or with `?motion=full` in the address; the choice is remembered.

To rebuild the water data (only when a source file changes), from the root of the repository:

```bash
python3 -m venv .venv
.venv/bin/pip install -r app/scripts/requirements-water.txt
.venv/bin/python app/scripts/build_water.py --check
.venv/bin/python app/scripts/build_world.py     # step 9: one GRACE series per country
```

## How the verdicts are reached

### Case 001: two tests on yearly series, then fixed rules

- **Rate of change:** Sen's slope, measured on the real time axis (a missing year cannot stretch it).
- **Test 1:** Mann–Kendall with the Hamed–Rao correction for serial correlation.
- **Test 2:** least squares with Newey–West errors (HAC, 2 lags) and its 95% interval.
- **Labels:** *confirmed* when both tests agree, *hint* when only one does, *no evidence* when neither, *no data* below 15 years.
- **Witnesses:** the same tests on an independent source. **Robustness:** the period sliders recompute everything.
- **Rules of the verdict:** rain falling → supply drought; evaporative demand rising → demand drought; both → compound; stored water falling with neither → possible human footprint, "backed" only with independent official evidence; a very dry year without a trend → one-off drought; nothing confirmed → cannot tell yet; missing data lowers the verdict and is named.

`src/lib/water/engine.test.ts` compares the browser engine with pymannkendall and statsmodels in every series and in more than 400 periods. `src/lib/water/case.test.ts` pins the figures and the verdicts the page shows.

### Case 002: three tests on monthly series

Theil–Sen slope with Sen's interval; a t-test on the least-squares slope, Mann–Kendall and a circular block bootstrap, all widened when the series has memory. Three votes are "strong evidence", two "some evidence", one a "weak hint". Fewer than 15 years, or fewer than 80% of valid months, gives "not enough data". Tests in `src/lib/stats/trend.test.ts` and `src/lib/analysis.test.ts`.

## Code map

| Path | Contents |
|---|---|
| `scripts/build_water.py`, `scripts/verify_water.py` | Source files → `public/data/water.json` and the verification note |
| `scripts/build_world.py` | List of countries + global GRACE file → `public/data/world.json` |
| `scripts/build-data.mjs` | CSV series → `public/data/monterrey.json` |
| `scripts/build-earth.py` | Prepares the three maps of the planet in `public/earth/` |
| `scripts/copy-site.mjs` | `dist/` → `../site` |
| `src/lib/water/engine.ts` | The two tests of Case 001 as they run in the browser |
| `src/lib/water/case.ts` | Suspects, witnesses, drought years and the rules of the verdict |
| `src/lib/water/catalog.ts` | Regions, series and suspects |
| `src/lib/water/*.svelte` | Sections and charts of Case 001 |
| `src/lib/world/layers.ts` | The ten data layers and the rules that say which are ready for a place |
| `src/lib/world/view.ts`, `src/lib/world/Globe.svelte`, `src/lib/world/WorldReach.svelte` | The globe that turns to a country, and step 9 around it |
| `src/lib/earth/` | The Earth: the opening sequence, the geometry and light of the planet, and its two renderers (WebGL 2 and a 2D fallback) |
| `src/lib/explain/` | The explanation that opens when a number is pressed |
| `dete/` | DE-T's server, its six tools, the figure checker, its data (Nuevo León and the countries) and the team's catalogue of options |
| `src/lib/dete/`, `src/lib/i18n-dete.ts` | DE-T's panel, the question line under the country finder, its buttons and its text in English and Spanish |
| `src/lib/ui/motion.svelte.ts` | Motion on or off for the whole site |
| `src/lib/stats/`, `src/lib/analysis.ts`, `src/lib/sections/`, `src/lib/charts/` | Case 002 |
| `src/lib/i18n.ts`, `src/lib/i18n-lab.ts`, `src/lib/i18n-water.ts`, `src/lib/i18n-world.ts`, `src/lib/i18n-design.ts` | Interface text in English and Spanish |

Built with Svelte 5, Vite and the d3-scale, d3-shape and d3-array modules. Charts are SVG drawn from the data; no chart library and no external request at run time.

The typeface is Hanken Grotesk (The Hanken Grotesk Project Authors, SIL Open Font License 1.1), installed from `@fontsource-variable/hanken-grotesk` and served from the site itself; its licence travels with the site in `public/licenses/hanken-grotesk-OFL.txt`. The rules of the visual system (one type family and three weights, a short scale of sizes and spaces, thin lines instead of boxes, colour kept for the data) are written at the top of `src/app.css`.

## Use of AI

The idea of Case 001 was defined by the team: treat a region's water as a budget, question each term with the same method and reach a verdict with fixed rules. The team also fixed the statistical method, the rules of the verdict and the catalogue of options, and reviewed the diagnosis of Nuevo León. The two questions behind Case 002 (what a yearly total hides, and whether nature's calendar is shifting) were proposed by team member Fran. So were the squares that open the page and the idea of step 9: count, country by country, how many of the data layers of the Nuevo León case already exist, with Nuevo León as the complete case, on a globe that turns to the chosen country.

The code, the statistical routines, the tests and the first draft of the interface text were written with AI coding assistants (Anthropic Claude and OpenAI Codex) under the team's direction; the source files say so in their headers. While reproducing the team's figures, an AI assistant found that the slope "per decade" was being measured per step of the series when years were missing; the page shows the corrected value and the verification note shows both.

No AI-generated imagery, audio or data is used: the numbers come from files of NASA, CHIRPS, CONAGUA, SMN and Mexico's Official Gazette, and the map is a NASA satellite image.

DE-T, the case assistant, uses AI inside the product: its answers are generated by Kimi (Moonshot AI) from the results of this tool, and the panel says so under every conversation. The team designed the assistant (its rules, tools, checker and catalogue of options); its code was written with Claude, and the catalogue of options is a draft the team still has to approve.

## Limits

GRACE weighs areas about 300 km across and cannot separate groundwater from reservoirs or soil. GLDAS is a model, read here at two cells. The official aquifer deficit is administrative, not a measurement of pumping. "Human footprint" is an indication, not proof. A significant trend is not a cause. Step 9 checks the published coverage of each product at one point per country: it is not a download test, the team looked for ground records only in Mexico, and its first look reads one GRACE mascon, not the average of a country. In Case 002 each satellite series is a single 1 km pixel, surface temperature is not air temperature, and the Terra satellite has drifted since 2020.

DE-T can be wrong: a language model writes its answers. The checker only confirms that each figure exists in the data, not that the sentence around it is right, and DE-T's series cover the full record of Nuevo León, not the period or region chosen on the page. For any other country DE-T has only the count of data layers and a first look at stored water: no rain, no reservoirs, no aquifers, no cause and no verdict.

This is not an official NASA product.
