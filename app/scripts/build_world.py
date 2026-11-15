#!/usr/bin/env python3
"""Build the data file of the world section (RAACK · Trend Detective): "Take the case elsewhere".

What it does
------------
1. Reads the list of countries and territories stored in this repository
   (``recursos/archivos/mundo/``): names in English and Spanish, a reference point (latitude and
   longitude) and the area of each one.
2. Reads the global GRACE / GRACE-FO JPL mascon file already stored in the repository (the same
   file the water case uses) and takes, for every country, the stored-water series of the mascon
   under its reference point (its land part; none when the whole mascon is sea).
3. Turns each series into yearly values with the recipe of the water case (seasonal cycle
   removed, years with at least 9 months), by calling the same functions of ``build_water.py``.
4. Computes the trend of every series with pymannkendall and statsmodels, as the reference the
   browser engine is tested against (``src/lib/world/world.test.ts``).
5. Writes ``app/public/data/world.json``.

What it does NOT do: it does not check rainfall, model or ground records country by country. Which
of the ten data layers of the Nuevo León case reach a country is decided in the browser from the
published coverage of each product (``src/lib/world/layers.ts``).

Usage, from the repository root (same environment as build_water.py)::

    .venv/bin/python app/scripts/build_world.py

Code written with AI assistance (Anthropic Claude) for team RAACK. It generates no scientific
value: every number is computed from the files listed under "inputs" in the output.
"""
from __future__ import annotations

import datetime as dt
import json
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_water as bw  # noqa: E402  (same folder: the recipe of the water case)

REPO = bw.REPO
COUNTRIES = REPO / "recursos/archivos/mundo/countries-mledoze-mintsources-2.4.3.json"
OUT_JSON = REPO / "app/public/data/world.json"

# Entries of the list that are not places where a water case can be opened: no region in the
# source (Antarctica and three uninhabited sub-Antarctic territories).
SKIP_WITHOUT_REGION = True


def load_countries() -> list[dict]:
    raw = json.loads(bw.use(COUNTRIES).read_text(encoding="utf-8"))
    out = []
    for c in raw:
        latlng = c.get("latlng") or []
        if len(latlng) != 2:
            continue  # no reference point in the source
        if SKIP_WITHOUT_REGION and not c.get("region"):
            continue
        area = c.get("area")
        out.append(
            {
                "id": c["cca2"],
                "iso3": c["cca3"],
                "en": c["name"]["common"],
                "es": c.get("translations", {}).get("spa", {}).get("common") or c["name"]["common"],
                "lat": round(float(latlng[0]), 3),
                "lon": round(float(latlng[1]), 3),
                # km²; None when the source has no valid figure
                "area": float(area) if isinstance(area, (int, float)) and area > 0 else None,
                "region": c["region"],
                "sub": c.get("subregion") or "",
            }
        )
    out.sort(key=lambda c: c["en"])
    return out


def sample_grace(nc_path: Path, countries: list[dict]) -> tuple[list[int], dict]:
    """Adds to every country the yearly stored-water series of the GRACE mascon under its
    reference point. Returns the years shared by all the series and a summary.

    The JPL file is a 0.5° grid, but each value belongs to a mascon about 3° wide; with the CRI
    filter a coastal mascon carries one value for its land part and another for its sea part.
    - 'point': the grid cell under the reference point is land -> its value.
    - 'coast': that cell is sea, but its mascon has a land part -> the value of that land part.
    - none: the whole mascon is sea -> GRACE has no land signal there (tws = null).
    """
    import netCDF4

    with netCDF4.Dataset(nc_path) as f:
        lat = np.asarray(f["lat"][:])
        lon = np.asarray(f["lon"][:])
        land = np.asarray(f["land_mask"][:]) >= 0.5
        mascon = np.asarray(f["mascon_ID"][:])
        times = netCDF4.num2date(f["time"][:], f["time"].units, only_use_cftime_datetimes=False)
        months = [f"{t.year:04d}-{t.month:02d}" for t in times]
        picks: list[tuple[str, int, int] | None] = []
        for c in countries:
            i = int(np.argmin(np.abs(lat - c["lat"])))
            j = int(np.argmin(np.abs(lon - (c["lon"] % 360))))
            c["mascon"] = int(mascon[i, j])
            if land[i, j]:
                picks.append(("point", i, j))
                continue
            ii, jj = np.nonzero((mascon == mascon[i, j]) & land)
            picks.append(("coast", int(ii[0]), int(jj[0])) if len(ii) else None)
        series = {}
        for pick in picks:
            if pick and pick[1:] not in series:
                series[pick[1:]] = np.ma.filled(f["lwe_thickness"][:, pick[1], pick[2]].astype(float), np.nan)

    years_ref: list[int] | None = None
    count = {"point": 0, "coast": 0}
    for c, pick in zip(countries, picks):
        if pick is None:
            c["tws"] = None  # the mascon under the reference point is all sea
            continue
        kind, i, j = pick
        yearly, _ = bw.grace_yearly(pd.Series(series[(i, j)], index=months))
        if years_ref is None:
            years_ref = yearly["years"]
        elif yearly["years"] != years_ref:
            raise SystemExit(f"{c['id']}: the yearly GRACE series has other years than the rest")
        # The reference is computed on the values as they are written (3 decimals of a centimetre),
        # so Python and the browser judge exactly the same series.
        c["tws"] = [round(v, 3) for v in yearly["values"]]
        ref = bw.trend(yearly["years"], c["tws"])
        c["twsKind"] = kind
        # Reference for the browser tests: Sen per year on the real time axis, Hamed-Rao p,
        # least-squares slope and its Newey-West interval, and the label.
        c["ref"] = {k: ref[k] for k in ("n", "sen", "p", "ols", "lo", "hi", "label")}
        count[kind] += 1
    summary = {"countries": len(countries), "gracePoint": count["point"], "graceCoast": count["coast"], "graceSea": len(countries) - count["point"] - count["coast"]}
    return years_ref or [], summary


def main() -> None:
    countries = load_countries()
    with tempfile.TemporaryDirectory() as tmp:
        nc_path = bw.reassemble_grace(Path(tmp))
        years, summary = sample_grace(nc_path, countries)

    import netCDF4

    data = {
        "id": "world",
        "generated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "note": "Built by app/scripts/build_world.py. One entry per country or territory of the source list: "
        "names, reference point, area, and the yearly stored-water series (GRACE / GRACE-FO JPL mascons, cm, "
        "seasonal cycle removed) of the land part of the mascon under that point; null when that mascon is all sea. "
        "'ref' holds the trend computed with pymannkendall and statsmodels. Code written with AI assistance.",
        "software": {
            "python": sys.version.split()[0],
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "netCDF4": netCDF4.__version__,
        },
        "inputs": dict(sorted(bw.inputs.items())),
        "grace": {"product": "GRACE / GRACE-FO JPL RL06.3 v04 CRI mascons", "unit": "cm", "years": years, "minMonths": 9},
        "summary": summary,
        "countries": countries,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    print(f"{OUT_JSON.relative_to(REPO)}: {OUT_JSON.stat().st_size / 1024:.0f} kB, {summary}")
    print(f"years: {years[0]}–{years[-1]} ({len(years)} values)")


if __name__ == "__main__":
    main()
