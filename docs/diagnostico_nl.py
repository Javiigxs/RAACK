"""Diagnóstico preliminar del balance de agua en Nuevo León (RAACK).
Lee los archivos del repo y calcula tendencias anuales con:
  - Mann-Kendall modificado (Hamed-Rao) + pendiente de Sen
  - OLS con errores HAC (Newey-West, 2 rezagos)
Ejecutar desde la raíz del repo: python diagnostico_nl.py <ruta_repo>
"""
import sys, json
import numpy as np, pandas as pd
import pymannkendall as mk
import statsmodels.api as sm

R = sys.argv[1] if len(sys.argv) > 1 else "."
NL = f"{R}/recursos/archivos/nuevo-leon"
out = {}

def tendencia(serie, nombre, unidad):
    s = serie.dropna()
    y = s.values.astype(float); t = s.index.values.astype(float)
    hr = mk.hamed_rao_modification_test(y)
    X = sm.add_constant(t); ols = sm.OLS(y, X).fit(cov_type="HAC", cov_kwds={"maxlags": 2})
    b = ols.params[1]; lo, hi = ols.conf_int()[1]
    r = {"variable": nombre, "unidad": unidad, "años": f"{int(t[0])}-{int(t[-1])}", "n": len(y),
         "media": round(float(y.mean()), 2),
         "sen_por_decada": round(float(hr.slope * 10), 3), "p_hamed_rao": round(float(hr.p), 4),
         "ols_por_decada": round(float(b * 10), 3), "ic95_ols": [round(float(lo * 10), 3), round(float(hi * 10), 3)],
         "cambio_pct_por_decada": round(float(hr.slope * 10 / abs(y.mean()) * 100), 1) if y.mean() != 0 else None}
    r["veredicto"] = ("CONFIRMADA" if (hr.p < 0.05 and (lo > 0 or hi < 0)) else
                      "indicio (una prueba)" if (hr.p < 0.05 or lo > 0 or hi < 0) else "sin evidencia")
    return r

# ---------- Lluvia satelital: promedio regional del recuadro ----------
def regional_erddap(path, var, y0, y1):
    df = pd.read_csv(path, skiprows=[1])
    df["fecha"] = pd.to_datetime(df["time"].str[:10]); df["anio"] = df.fecha.dt.year
    df = df[(df.anio >= y0) & (df.anio <= y1)]
    w = np.cos(np.deg2rad(df["latitude"]))
    anual_celda = df.groupby(["anio", "latitude", "longitude"])[var].agg(["sum", "count"]).reset_index()
    anual_celda = anual_celda[anual_celda["count"] == 12]
    anual_celda["w"] = np.cos(np.deg2rad(anual_celda.latitude))
    g = anual_celda.groupby("anio").apply(lambda d: np.average(d["sum"], weights=d["w"]), include_groups=False)
    return g

imerg = regional_erddap(f"{NL}/imerg/nuevo-leon-imerg-mensual-1998-2025-09.csv", "precipitation", 1998, 2024)
chirps = regional_erddap(f"{NL}/chirps/nuevo-leon-chirps-mensual-1998-2025-paso5-combinado.csv", "precip", 1998, 2025)
out["lluvia_imerg_NL"] = tendencia(imerg, "Lluvia IMERG (recuadro NL)", "mm/año")
out["lluvia_chirps_NL"] = tendencia(chirps, "Lluvia CHIRPS (recuadro NL)", "mm/año")
anom = {}
for nom, s in [("IMERG", imerg), ("CHIRPS", chirps)]:
    anom[nom] = {int(a): round(float((s[a] / s.mean() - 1) * 100), 1) for a in [2011, 2012, 2022, 2023, 2024] if a in s.index}
out["anomalias_lluvia_pct"] = anom

# ---------- GLDAS en dos puntos (años completos 2002-2025) ----------
g = pd.read_csv(f"{NL}/gldas/gldas-dos-puntos-mensual-2001-03-2026-07.csv")
g["anio"] = g.month_utc.str[:4].astype(int)
g = g[(g.anio >= 2002) & (g.anio <= 2025)]
for punto in ["monterrey", "galeana"]:
    d = g[g.point == punto]
    piv_mean = d.pivot_table(index="anio", columns="variable", values="mean", aggfunc="mean")
    piv_tot = d.pivot_table(index="anio", columns="variable", values="total", aggfunc="sum")
    cnt = d[d.complete_month == True].groupby(["anio", "variable"]).size().unstack()
    ok = lambda v: cnt[v] == 12
    res = {}
    res["lluvia"] = tendencia(piv_tot["Rainf_tavg"][ok("Rainf_tavg")], "Lluvia líquida GLDAS", "mm/año")
    res["evap_real"] = tendencia(piv_tot["Evap_tavg"][ok("Evap_tavg")], "Evaporación real GLDAS", "mm/año")
    # PotEvap W m-2 -> mm/año (calor latente 2.45e6 J/kg)
    pe = piv_mean["PotEvap_tavg"] / 2.45e6 * 86400 * 365.25
    res["evap_potencial"] = tendencia(pe[ok("PotEvap_tavg")], "Evaporación potencial GLDAS", "mm/año (aprox.)")
    res["humedad_suelo"] = tendencia(piv_mean["RootMoist_inst"], "Humedad zona de raíces GLDAS", "mm")
    esc = piv_tot["Qs_acc"] + piv_tot["Qsb_acc"]
    res["escurrimiento"] = tendencia(esc[ok("Qs_acc") & ok("Qsb_acc")], "Escurrimiento total GLDAS", "mm/año")
    res["temperatura"] = tendencia(piv_mean["Tair_f_inst"] - 273.15, "Temperatura del aire GLDAS", "°C")
    lluv = piv_tot["Rainf_tavg"]; et = piv_tot["Evap_tavg"]
    res["fraccion_lluvia_que_escurre_pct"] = round(float((esc / lluv).mean() * 100), 1)
    res["fraccion_lluvia_que_se_evapora_pct"] = round(float((et / lluv).mean() * 100), 1)
    out[f"gldas_{punto}"] = res

# ---------- GRACE: almacenamiento total del recuadro NL ----------
gr = pd.read_csv(f"{NL}/grace/nuevo-leon-grace-jpl-rl06.3-v04-2002-2026-09.csv")
gr["w"] = np.cos(np.deg2rad(gr.latitude))
m = gr.groupby("month").apply(lambda d: np.average(d.lwe_thickness_cm, weights=d.w), include_groups=False)
m.index = pd.PeriodIndex(m.index, freq="M")
mon = m.groupby(m.index.month).transform("mean"); anomm = m - mon  # quita ciclo estacional
ga = anomm.groupby(anomm.index.year).agg(["mean", "count"])
ga = ga[ga["count"] >= 9]["mean"]
out["grace_NL"] = tendencia(ga, "Agua almacenada total GRACE (anomalía)", "cm de agua")
out["grace_NL"]["años_usados"] = [int(a) for a in ga.index]
out["grace_mascons_distintos"] = int(gr.mascon_ID.nunique())

# ---------- Presas (CONAGUA): volumen, evaporación de tanque y lluvia ----------
pres = {}
for clave, nombre in [("CCHNL", "El Cuchillo"), ("CPRNL", "Cerro Prieto"), ("LBCNL", "La Boca")]:
    d = pd.read_csv(f"{NL}/presas/{clave}.csv", skiprows=7)
    d["Fecha"] = pd.to_datetime(d["Fecha"]); d["anio"] = d.Fecha.dt.year
    d = d[(d.anio >= 2000) & (d.anio <= 2025)]
    vol = d.groupby("anio")["VolumenAlm(Mm3)"].mean()
    ev_c = d.groupby("anio")["Evaporacion(mm)"].count()
    ev = d.groupby("anio")["Evaporacion(mm)"].sum()[ev_c >= 330]
    pr_c = d.groupby("anio")["Precipitacion(mm)"].count()
    pr = d.groupby("anio")["Precipitacion(mm)"].sum()[pr_c >= 330]
    pres[nombre] = {
        "volumen": tendencia(vol, f"Volumen medio anual {nombre}", "Mm³"),
        "evaporacion_tanque": tendencia(ev, f"Evaporación de tanque {nombre}", "mm/año"),
        "lluvia_en_presa": tendencia(pr, f"Lluvia medida en {nombre}", "mm/año"),
        "volumen_2022": round(float(vol.get(2022, np.nan)), 1), "volumen_medio": round(float(vol.mean()), 1),
    }
out["presas"] = pres

# ---------- Estación SMN 19052 Monterrey (Obs.) ----------
lines = open(f"{R}/recursos/archivos/smn-monterrey-19052.txt", encoding="utf-8", errors="ignore").read().splitlines()
rows = [l.split("\t") for l in lines if l[:2] in ("19", "20") and l[4:5] == "-"]
s = pd.DataFrame([r[:1] + [x for x in r[1:] if x != ""] for r in rows])
s = s.iloc[:, :5]; s.columns = ["fecha", "precip", "evap", "tmax", "tmin"]
for c in ["precip", "evap", "tmax", "tmin"]:
    s[c] = pd.to_numeric(s[c], errors="coerce")
s["anio"] = pd.to_datetime(s.fecha).dt.year
s = s[(s.anio >= 1998) & (s.anio <= 2025)]
cnt = s.groupby("anio").count()
smn = {}
pp = s.groupby("anio").precip.sum()[cnt.precip >= 330]
smn["lluvia"] = tendencia(pp, "Lluvia estación SMN Monterrey", "mm/año")
ev = s.groupby("anio").evap.sum()[cnt.evap >= 330]
if len(ev) >= 10:
    smn["evaporacion_tanque"] = tendencia(ev, "Evaporación de tanque SMN Monterrey", "mm/año")
tm = ((s.tmax + s.tmin) / 2).groupby(s.anio).mean()[(cnt.tmax >= 330) & (cnt.tmin >= 330)]
smn["temperatura"] = tendencia(tm, "Temperatura media SMN Monterrey", "°C")
smn["años_con_datos_completos"] = {k: int(v) for k, v in {"lluvia": len(pp), "evap": len(ev), "temp": len(tm)}.items()}
out["smn_19052"] = smn

print(json.dumps(out, ensure_ascii=False, indent=1, default=str))
