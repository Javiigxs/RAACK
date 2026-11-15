# RAACK
Be An Earth System Trend Detective Challenge

🌎 **Visit our project page: [https://javiigxs.github.io/RAACK/site/](https://javiigxs.github.io/RAACK/site/)**

Your app should be able to do this:
1. Decide on the data variable(s) for analysis.
2. Choose a region for the analysis.
3. Select the time period for the time-series.
4. Create the time-series and examine it. Does it appear to have a trend?
5. Analyze the trend for significance.

## Hackathon resources

Materials prepared for [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/). The team's internal notes linked below are written in Spanish.

- [Index for people and AIs](INDICE.md): project status and a map of every note. Start here.
- [Official rules](docs/REGLAS_OFICIALES.md): how the judges score and what the Sunday, November 15, 2026 submission requires.
- [Ideas for the tool](docs/IDEAS.md): proposals still to be validated, with a first signal in the Monterrey data.
- [What each resource can do and how long it takes](docs/FUNCIONALIDADES.md), and the team's [four validation rules](docs/VALIDACION.md).
- [Resource and download catalog](recursos/README.md): initial files and later downloads, sources, and portal access status.
- [Coverage of the 13 resources](recursos/COBERTURA.md): how far we got on each page, what was downloaded, and why Canada shows up so often.
- Per-page fact sheets: one for each of the 12 reviewed resources, linked from the [coverage](recursos/COBERTURA.md) note and the [index](INDICE.md).
- [Databases we need to request](docs/SOLICITUDES_DE_DATOS.md) and what we would use them for.
- [Knowledge graph](docs/CONOCIMIENTO.md) with the sources, methods, and findings of the water and climate cases.
- [Context graph](docs/CONTEXTO.md) of the preparation work ([image](docs/CONTEXTO.svg), [data](docs/CONTEXTO.json)).
- [Challenge and objectives](docs/RETO.md).
- [Scientific reference and GLDAS sample](docs/REFERENCIA_CIENTIFICA.md).
- [Team to-dos](docs/PENDIENTES.md).
- [Giovanni: pending our decision](docs/decisiones/GIOVANNI.md).

The repository is also an Obsidian vault: in Obsidian, use "Open folder as vault" on this folder. Links work both on GitHub and in Obsidian. AI agents have their rules in [AGENTS.md](AGENTS.md).

The `recursos/archivos/` folder, described in the [catalog](recursos/README.md), holds the initial files and later batches from AppEEARS, rainfall, GLDAS, GRACE, watersheds, and dams. The [manifest](recursos/archivos/descargas.json) records provenance, size, and SHA-256.

**On November 14, 2026, the Giovanni service was authorized solely to download the seven GLDAS variables. Whether it will be selected as a tool for the solution is still pending the team's decision; see the [Giovanni](docs/decisiones/GIOVANNI.md) update.**

The [regional data for Nuevo León](docs/REQUISITOS_DATOS_NUEVO_LEON.md) include seven GLDAS variables for Monterrey and Galeana from March 2001 to July 2026, GRACE with reconstructible originals and a regional subset, CHIRPS, watersheds, and dams. IMERG Final V07 ends in September 2025; the official evidence of that limit is kept. The choice of case and its conclusions remain subject to the four validation rules. Codex assisted with the downloads, transformations, code, and documentation; the scientific values come from their providers. Claude translated this README into English.
