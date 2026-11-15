#!/usr/bin/env python3
"""Build the data file of the water case (RAACK · Trend Detective).

What it does
------------
1. Reads the source files stored in this repository (NASA GPM IMERG, GLDAS and GRACE/GRACE-FO,
   CHIRPS, CONAGUA reservoirs, the SMN weather station and the official aquifer table).
2. Builds one yearly series per "suspect" of the water budget, with the rules the team fixed:
   yearly sums for flows, yearly means for states, complete years only, regional means weighted
   by cos(latitude), GRACE with its seasonal cycle removed.
3. Writes ``app/public/data/water.json``. The web page computes every trend in the browser from
   those yearly series.
4. Computes the same trends here with pymannkendall (Hamed-Rao modified Mann-Kendall) and
   statsmodels (OLS with Newey-West errors). They travel inside the JSON as the reference the
   browser engine is tested against (``src/lib/water/engine.test.ts``).
5. Writes ``docs/DIAGNOSTICO_AGUA.md``: every figure the team validated next to the figure
   reproduced from the files.

Usage, from the repository root::

    python -m venv .venv && .venv/bin/pip install -r app/scripts/requirements-water.txt
    .venv/bin/python app/scripts/build_water.py

Code written with AI assistance (Anthropic Claude) for team RAACK. It generates no scientific
value: every number is computed from the files listed under "inputs" in the output.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import sys
import tempfile
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import pymannkendall as mk
import statsmodels.api as sm

REPO = Path(__file__).resolve().parents[2]
NL = REPO / "recursos/archivos/nuevo-leon"
CV = REPO / "recursos/archivos/valle-central"  # optional: rainfall of the Central Valley box
OUT_JSON = REPO / "app/public/data/water.json"
OUT_NOTE = REPO / "docs/DIAGNOSTICO_AGUA.md"

GRACE_NAME = "GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc"
GRACE_SHA256 = "3522dd579cc10326339efdecece550ba01f41b9bee599d0ed915fc35f9eafb64"
GRACE_PARTS = 6

BOXES = {
    "nl": {"latMin": 23.1, "latMax": 27.8, "lonMin": -101.2, "lonMax": -98.4},
    "cv": {"latMin": 35.5, "latMax": 39.5, "lonMin": -122.0, "lonMax": -119.5},
}
GLDAS_POINTS = {"mty": "monterrey", "gal": "galeana"}
DAMS = {"cuchillo": "CCHNL", "cerroprieto": "CPRNL", "laboca": "LBCNL"}
# Aquifers that supply the Monterrey metropolitan area (list given by the team).
MTY_AQUIFERS = {1906, 1907, 1908, 1909, 1911}
LATENT_HEAT = 2.45e6  # J/kg, to turn W m-2 into mm of water (approximate)

inputs: dict[str, dict] = {}


def use(path: Path) -> Path:
    """Registers a source file (size and SHA-256) and returns it."""
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    inputs[str(path.relative_to(REPO))] = {"bytes": path.stat().st_size, "sha256": h.hexdigest()}
    return path


def r4(v: float) -> float:
    return round(float(v), 4)


def pack(s: pd.Series) -> dict:
    """Yearly series -> {years, values}; years without a complete record are simply absent."""
    s = s.dropna()
    return {"years": [int(y) for y in s.index], "values": [r4(v) for v in s.values]}


# --------------------------------------------------------------------------- statistics


def sen_time(t: np.ndarray, y: np.ndarray) -> float:
    """Sen's slope with the real time axis: median of (y_j - y_i) / (t_j - t_i)."""
    i, j = np.triu_indices(len(y), 1)
    return float(np.median((y[j] - y[i]) / (t[j] - t[i])))


def trend(years, values) -> dict:
    """The team's two tests on one yearly series (slopes per year, not per decade)."""
    t = np.asarray(years, float)
    y = np.asarray(values, float)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")  # Hamed-Rao variance can turn negative: p is then NaN
        hr = mk.hamed_rao_modification_test(y)
    ols = sm.OLS(y, sm.add_constant(t)).fit(cov_type="HAC", cov_kwds={"maxlags": 2})
    lo, hi = (float(v) for v in ols.conf_int()[1])
    p = float(hr.p)
    p_ok = math.isfinite(p)
    mk_sig = p_ok and p < 0.05
    ols_sig = lo > 0 or hi < 0
    return {
        "n": int(len(y)),
        "y0": int(t[0]),
        "y1": int(t[-1]),
        "mean": float(y.mean()),
        "sen": sen_time(t, y),  # per year, real time axis (what the page shows)
        "senStep": float(hr.slope),  # per step, as pymannkendall returns it (gaps ignored)
        "p": p if p_ok else None,
        "z": float(hr.z) if math.isfinite(float(hr.z)) else None,
        "s": float(hr.s),
        "varS": float(hr.var_s),
        "ols": float(ols.params[1]),
        "lo": lo,
        "hi": hi,
        "label": "confirmed" if (mk_sig and ols_sig) else "hint" if (mk_sig or ols_sig) else "none",
    }


def windows_for(years: list[int]) -> list[tuple[int, int]]:
    """Periods kept as reference for the browser tests: the full record and a spread of others."""
    y0, y1 = years[0], years[-1]
    cand = {(y0, y1)}
    for a in (y0, y0 + 2, y0 + 5, y0 + 8):
        for b in (y1, y1 - 2, y1 - 5):
            cand.add((a, b))
    cand |= {(2003, 2019), (2003, 2021), (2005, 2024), (2011, 2026), (2003, 2024), (2002, 2025), (2000, 2025)}
    out = []
    for a, b in sorted(cand):
        if a < y0 or b > y1:
            continue
        if sum(1 for y in years if a <= y <= b) >= 10:
            out.append((a, b))
    return out


def reference(series: dict[str, dict]) -> dict:
    ref = {}
    for sid, s in series.items():
        ref[sid] = {}
        for a, b in windows_for(s["years"]):
            sel = [(y, v) for y, v in zip(s["years"], s["values"]) if a <= y <= b]
            ref[sid][f"{a}-{b}"] = trend([y for y, _ in sel], [v for _, v in sel])
    return ref


def storage_vs_rain(tws: dict, rain: dict, a: int | None = None, b: int | None = None) -> dict:
    """Stored water explained by the rain of the same year and of the year before (plain OLS).
    Returns R2 and the trend that is left in the residual."""
    g = pd.Series(tws["values"], index=tws["years"], dtype=float)
    p = pd.Series(rain["values"], index=rain["years"], dtype=float)
    df = pd.DataFrame({"g": g, "p0": p, "p1": p.shift(1)}).dropna()
    # shift(1) is "the previous row": it is the previous year only where years are consecutive
    prev_ok = pd.Series(df.index, index=df.index).map(lambda yr: (yr - 1) in p.index)
    df = df[prev_ok.values]
    if a is not None:
        df = df[(df.index >= a) & (df.index <= b)]
    fit = sm.OLS(df.g, sm.add_constant(df[["p0", "p1"]])).fit()
    res = trend(df.index.values, fit.resid.values)
    return {
        "n": int(len(df)),
        "y0": int(df.index[0]),
        "y1": int(df.index[-1]),
        "r2": float(fit.rsquared),
        "coef": [float(fit.params["const"]), float(fit.params["p0"]), float(fit.params["p1"])],
        "residual": res,
    }


# --------------------------------------------------------------------------- yearly series


def gridded_rain(path: Path, var: str, y0: int, y1: int) -> tuple[pd.Series, pd.Series, int]:
    """ERDDAP monthly grid -> (yearly regional total, monthly regional total, number of cells).
    A cell counts in a year only with its 12 months; cells are weighted by cos(latitude)."""
    df = pd.read_csv(use(path), skiprows=[1])
    df["month"] = df["time"].str[:7]
    df["year"] = df["time"].str[:4].astype(int)
    df["w"] = np.cos(np.deg2rad(df["latitude"]))
    monthly = df.groupby("month").apply(lambda d: np.average(d[var], weights=d["w"]), include_groups=False)
    d = df[(df.year >= y0) & (df.year <= y1)]
    cell = d.groupby(["year", "latitude", "longitude"])[var].agg(["sum", "count"]).reset_index()
    cell = cell[cell["count"] == 12]
    cell["w"] = np.cos(np.deg2rad(cell.latitude))
    yearly = cell.groupby("year").apply(lambda d: np.average(d["sum"], weights=d["w"]), include_groups=False)
    n_cells = int(df.groupby(["latitude", "longitude"]).ngroups)
    return yearly, monthly, n_cells


def gldas_series() -> dict[str, dict]:
    """GLDAS-2.1 Noah at two cells, complete years 2002-2025 (the record starts in March 2001)."""
    g = pd.read_csv(use(NL / "gldas/gldas-dos-puntos-mensual-2001-03-2026-07.csv"))
    g["year"] = g.month_utc.str[:4].astype(int)
    g = g[(g.year >= 2002) & (g.year <= 2025)]
    out = {}
    for key, point in GLDAS_POINTS.items():
        d = g[g.point == point]
        mean = d.pivot_table(index="year", columns="variable", values="mean", aggfunc="mean")
        total = d.pivot_table(index="year", columns="variable", values="total", aggfunc="sum")
        complete = d[d.complete_month == True].groupby(["year", "variable"]).size().unstack()  # noqa: E712
        ok = lambda v: complete[v] == 12  # noqa: E731
        out[f"rain_gldas_{key}"] = pack(total["Rainf_tavg"][ok("Rainf_tavg")])
        out[f"et_gldas_{key}"] = pack(total["Evap_tavg"][ok("Evap_tavg")])
        pet = mean["PotEvap_tavg"] / LATENT_HEAT * 86400 * 365.25  # W m-2 -> mm per year (approx.)
        out[f"pet_gldas_{key}"] = pack(pet[ok("PotEvap_tavg")])
        out[f"soil_gldas_{key}"] = pack(mean["RootMoist_inst"])
        runoff = total["Qs_acc"] + total["Qsb_acc"]
        out[f"runoff_gldas_{key}"] = pack(runoff[ok("Qs_acc") & ok("Qsb_acc")])
        out[f"temp_gldas_{key}"] = pack(mean["Tair_f_inst"] - 273.15)
    return out


def dam_series() -> tuple[dict[str, dict], dict]:
    """CONAGUA daily records of three reservoirs, 2000-2025. Columns are read by name: La Boca
    lists them in another order. Volume: yearly mean. Gauges: yearly sums with >= 330 days."""
    out, monthly = {}, {}
    for key, code in DAMS.items():
        d = pd.read_csv(use(NL / f"presas/{code}.csv"), skiprows=7)
        d["Fecha"] = pd.to_datetime(d["Fecha"])
        d["year"] = d.Fecha.dt.year
        m = d[(d.year >= 2000)].set_index("Fecha")["VolumenAlm(Mm3)"].resample("MS").mean().dropna()
        monthly[key] = {"months": [x.strftime("%Y-%m") for x in m.index], "values": [round(float(v), 2) for v in m.values]}
        d = d[(d.year >= 2000) & (d.year <= 2025)]
        out[f"vol_{key}"] = pack(d.groupby("year")["VolumenAlm(Mm3)"].mean())
        for col, name in (("Evaporacion(mm)", "pan"), ("Precipitacion(mm)", "rain")):
            days = d.groupby("year")[col].count()
            out[f"{name}_{key}"] = pack(d.groupby("year")[col].sum()[days >= 330])
    return out, monthly


def smn_series() -> dict[str, dict]:
    """SMN station 19052 (Monterrey Observatory), 1998-2025, years with >= 330 days of data."""
    path = use(REPO / "recursos/archivos/smn-monterrey-19052.txt")
    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    rows = [l.split("\t") for l in lines if l[:2] in ("19", "20") and l[4:5] == "-"]
    s = pd.DataFrame([r[:1] + [x for x in r[1:] if x != ""] for r in rows]).iloc[:, :5]
    s.columns = ["date", "rain", "pan", "tmax", "tmin"]
    for c in ("rain", "pan", "tmax", "tmin"):
        s[c] = pd.to_numeric(s[c], errors="coerce")  # "NULO" -> missing
    s["year"] = pd.to_datetime(s.date).dt.year
    s = s[(s.year >= 1998) & (s.year <= 2025)]
    days = s.groupby("year").count()
    out = {
        "rain_smn": pack(s.groupby("year").rain.sum()[days.rain >= 330]),
        "pan_smn": pack(s.groupby("year").pan.sum()[days.pan >= 330]),
        "temp_smn": pack(((s.tmax + s.tmin) / 2).groupby(s.year).mean()[(days.tmax >= 330) & (days.tmin >= 330)]),
    }
    return out


def grace_yearly(monthly: pd.Series) -> tuple[dict, dict]:
    """Monthly regional anomaly -> yearly mean of the de-seasonalised series (>= 9 months)."""
    monthly = monthly.groupby(level=0).mean()  # two solutions can fall in the same calendar month
    clim = monthly.groupby(monthly.index.str[5:7]).transform("mean")
    anom = monthly - clim
    by_year = anom.groupby(anom.index.str[:4].astype(int)).agg(["mean", "count"])
    yearly = by_year[by_year["count"] >= 9]["mean"]
    packed_monthly = {
        "months": list(monthly.index),
        "values": [round(float(v), 3) for v in monthly.values],
        "deseasoned": [round(float(v), 3) for v in anom.values],
    }
    return pack(yearly), packed_monthly


def grace_nl_csv() -> tuple[pd.Series, int]:
    gr = pd.read_csv(use(NL / "grace/nuevo-leon-grace-jpl-rl06.3-v04-2002-2026-09.csv"))
    gr["w"] = np.cos(np.deg2rad(gr.latitude))
    m = gr.groupby("month").apply(lambda d: np.average(d.lwe_thickness_cm, weights=d.w), include_groups=False)
    return m, int(gr.mascon_ID.nunique())


def grace_world_box(nc_path: Path, box: dict) -> tuple[pd.Series, int, int]:
    """Regional mean of lwe_thickness from the global JPL mascon file (grid centres inside the
    box, cos(latitude) weights, scale factors not applied: same recipe as the Nuevo León file)."""
    import netCDF4

    with netCDF4.Dataset(nc_path) as f:
        lat = np.asarray(f["lat"][:])
        lon = np.asarray(f["lon"][:])
        ii = np.where((lat >= box["latMin"]) & (lat <= box["latMax"]))[0]
        jj = np.where((lon >= box["lonMin"] % 360) & (lon <= box["lonMax"] % 360))[0]
        cube = np.ma.filled(f["lwe_thickness"][:, ii, :][:, :, jj].astype(float), np.nan)
        mascons = int(len(np.unique(np.asarray(f["mascon_ID"][ii, :][:, jj]))))
        w = np.cos(np.deg2rad(lat[ii]))[:, None] * np.ones((1, len(jj)))
        values = np.nansum(cube * w[None], axis=(1, 2)) / w.sum()
        times = netCDF4.num2date(f["time"][:], f["time"].units, only_use_cftime_datetimes=False)
    months = [f"{t.year:04d}-{t.month:02d}" for t in times]
    return pd.Series(values, index=months), mascons, int(len(ii) * len(jj))


def reassemble_grace(tmp: Path) -> Path:
    """Joins the six byte parts of the global GRACE file and checks its SHA-256."""
    out = tmp / GRACE_NAME
    h = hashlib.sha256()
    with out.open("wb") as dst:
        for k in range(1, GRACE_PARTS + 1):
            part = use(NL / f"grace/{GRACE_NAME}.part{k:03d}")
            data = part.read_bytes()
            h.update(data)
            dst.write(data)
    if h.hexdigest() != GRACE_SHA256:
        raise SystemExit("The reassembled GRACE file does not match its SHA-256.")
    return out


def aquifers() -> list[dict]:
    df = pd.read_csv(use(NL / "acuiferos/acuiferos_nuevo_leon_DOF_2023-11-09.csv"))
    return [
        {
            "id": int(r.clave),
            "name": r.acuifero,
            "recharge": float(r.recarga_R_hm3),
            "committed": float(r.descarga_natural_comprometida_DNC_hm3),
            "concessioned": float(r.volumen_concesionado_VCAS_hm3),
            "availability": float(r.disponibilidad_media_anual_DMA_hm3),
            "monterrey": int(r.clave) in MTY_AQUIFERS,
        }
        for r in df.itertuples()
    ]


# --------------------------------------------------------------------------- build


def build() -> tuple[dict, dict]:
    regions: dict[str, dict] = {}

    # ---- Nuevo León
    s: dict[str, dict] = {}
    imerg_y, imerg_m, imerg_cells = gridded_rain(NL / "imerg/nuevo-leon-imerg-mensual-1998-2025-09.csv", "precipitation", 1998, 2024)
    chirps_y, chirps_m, chirps_cells = gridded_rain(NL / "chirps/nuevo-leon-chirps-mensual-1998-2025-paso5-combinado.csv", "precip", 1998, 2025)
    s["rain_imerg"] = pack(imerg_y)
    s["rain_chirps"] = pack(chirps_y)
    s.update(smn_series())
    dams, dam_monthly = dam_series()
    s.update(dams)
    s.update(gldas_series())
    grace_m, nl_mascons = grace_nl_csv()
    s["tws_grace"], grace_monthly = grace_yearly(grace_m)
    regions["nl"] = {
        "box": BOXES["nl"],
        "series": s,
        "monthly": {
            "rain_imerg": {"start": imerg_m.index[0], "values": [round(float(v), 2) for v in imerg_m.values]},
            "rain_chirps": {"start": chirps_m.index[0], "values": [round(float(v), 2) for v in chirps_m.values]},
            "tws_grace": grace_monthly,
            "dams": dam_monthly,
        },
        "cells": {"rain_imerg": imerg_cells, "rain_chirps": chirps_cells, "tws_grace_mascons": nl_mascons},
        "aquifers": aquifers(),
    }

    # ---- Central Valley of California: GRACE from the global file; rainfall only if stored
    with tempfile.TemporaryDirectory() as tmp:
        nc_path = reassemble_grace(Path(tmp))
        cv_m, cv_mascons, cv_cells = grace_world_box(nc_path, BOXES["cv"])
        nl_check, _, _ = grace_world_box(nc_path, BOXES["nl"])
    c: dict[str, dict] = {}
    c["tws_grace"], cv_monthly = grace_yearly(cv_m)
    cv_extra_monthly = {}
    for sid, sub, var in (("rain_imerg", "imerg", "precipitation"), ("rain_chirps", "chirps", "precip")):
        files = sorted((CV / sub).glob("*.csv")) if (CV / sub).is_dir() else []
        if files:
            y1 = 2024 if sid == "rain_imerg" else 2025
            yearly, monthly, _ = gridded_rain(files[0], var, 1998, y1)
            c[sid] = pack(yearly)
            cv_extra_monthly[sid] = {"start": monthly.index[0], "values": [round(float(v), 2) for v in monthly.values]}
    regions["cv"] = {
        "box": BOXES["cv"],
        "series": c,
        "monthly": {"tws_grace": cv_monthly, **cv_extra_monthly},
        "cells": {"tws_grace_mascons": cv_mascons, "tws_grace_cells": cv_cells},
        "aquifers": [],
    }

    # The Nuevo León box cut from the global file must equal the cropped CSV of the repository.
    nl_from_world, _ = grace_yearly(nl_check)
    diff = max(abs(a - b) for a, b in zip(nl_from_world["values"], s["tws_grace"]["values"]))
    if nl_from_world["years"] != s["tws_grace"]["years"] or diff > 1e-3:
        raise SystemExit(f"GRACE cross-check failed: global file vs cropped CSV differ by {diff}")

    # ---- Python reference (pymannkendall + statsmodels) for the browser tests
    for reg in regions.values():
        reg["reference"] = reference(reg["series"])
    nl = regions["nl"]
    nl["referenceResidual"] = {
        "rain_imerg": {"full": storage_vs_rain(s["tws_grace"], s["rain_imerg"])},
        "rain_chirps": {"full": storage_vs_rain(s["tws_grace"], s["rain_chirps"])},
    }
    for a, b in ((2005, 2024), (2003, 2021)):
        nl["referenceResidual"]["rain_imerg"][f"{a}-{b}"] = storage_vs_rain(s["tws_grace"], s["rain_imerg"], a, b)

    import netCDF4
    import statsmodels

    data = {
        "id": "water",
        "generated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "note": "Built by app/scripts/build_water.py from the source files of the RAACK repository. "
        "Yearly series only: the page computes the trends in the browser. 'reference' holds the same "
        "trends computed with pymannkendall and statsmodels. Code written with AI assistance.",
        "software": {
            "python": sys.version.split()[0],
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "statsmodels": statsmodels.__version__,
            "pymannkendall": getattr(mk, "__version__", "1.4.3"),
            "netCDF4": netCDF4.__version__,
        },
        "inputs": dict(sorted(inputs.items())),
        "regions": regions,
    }
    return data, {"grace_crosscheck_max_diff_cm": diff}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="exit with an error if a team figure is not reproduced")
    ap.add_argument("--no-note", action="store_true", help="do not rewrite docs/DIAGNOSTICO_AGUA.md")
    args = ap.parse_args()

    data, extra = build()
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    n_series = sum(len(r["series"]) for r in data["regions"].values())
    print(f"{OUT_JSON.relative_to(REPO)}: {OUT_JSON.stat().st_size / 1024:.0f} kB, {n_series} yearly series, {len(data['inputs'])} source files")
    print(f"GRACE cross-check (global file vs cropped CSV): max difference {extra['grace_crosscheck_max_diff_cm']:.2e} cm")

    from verify_water import write_note  # same folder

    failed = write_note(data, None if args.no_note else OUT_NOTE)
    if failed and args.check:
        raise SystemExit(f"{failed} team figure(s) were not reproduced: see {OUT_NOTE.relative_to(REPO)}")


if __name__ == "__main__":
    main()
