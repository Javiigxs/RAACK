"""Verification note of the water case: every figure the team validated next to the figure
reproduced from the files of the repository. Called by build_water.py.

The note is internal and written in Spanish (docs/DIAGNOSTICO_AGUA.md).
Code written with AI assistance (Anthropic Claude) for team RAACK.
"""
from __future__ import annotations

import datetime as dt
from pathlib import Path

MINUS = "−"
STATE_AREA_KM2 = 64156  # Nuevo León; figure given by the team (INEGI)


def num(v: float | None, d: int = 1, sign: bool = True) -> str:
    if v is None:
        return "no calculable"
    s = f"{abs(v):.{d}f}"
    if float(s) == 0:
        return s
    return (MINUS if v < 0 else "+" if sign else "") + s


def label_es(label: str) -> str:
    return {"confirmed": "confirmada", "hint": "indicio", "none": "sin evidencia"}[label]


class Table:
    def __init__(self) -> None:
        self.rows: list[tuple[str, str, str, str, str]] = []
        self.failed = 0
        self.near = 0

    def add(self, what: str, expected: str, team: str, page: str, ok: bool | str | None) -> None:
        # ok: True (reproduced), "near" (same sign, within the stated margin), False, None (no files)
        status = "sin archivos" if ok is None else "≈" if ok == "near" else "✓" if ok else "≠"
        if ok is False:
            self.failed += 1
        if ok == "near":
            self.near += 1
        self.rows.append((what, expected, team, page, status))

    def value(self, what: str, expected: float, team: float, page: float | None = None, d: int = 1, tol: float | None = None, unit: str = "", near: float = 0.0) -> None:
        tol = (0.6 * 10 ** (-d)) if tol is None else tol
        ok: bool | str = abs(team - expected) <= tol
        if not ok and near and expected * team > 0 and abs(team - expected) <= near * abs(expected):
            ok = "near"
        u = f" {unit}" if unit else ""
        sign = unit not in ("", "Mm³")  # p-values, R2 and volumes are not changes: no "+"
        self.add(what, num(expected, d, sign) + u, num(team, d, sign) + u, (num(page, d, sign) + u) if page is not None else "igual", ok)

    def md(self) -> str:
        head = "| Cifra | Esperada (equipo) | Reproducida, método del equipo | En la página (años reales) | Estado |\n|---|---|---|---|---|\n"
        return head + "\n".join(f"| {a} | {b} | {c} | {d} | {e} |" for a, b, c, d, e in self.rows)


def write_note(data: dict, out: Path | None) -> int:
    nl = data["regions"]["nl"]
    cv = data["regions"]["cv"]
    ref = nl["reference"]
    S = nl["series"]

    def full(sid: str, region: dict = nl) -> dict:
        s = region["series"][sid]
        return region["reference"][sid][f"{s['years'][0]}-{s['years'][-1]}"]

    def dec(r: dict, key: str = "senStep") -> float:
        return r[key] * 10

    def pct(r: dict, key: str = "senStep") -> float:
        return r[key] * 10 / abs(r["mean"]) * 100

    def anomaly(sid: str, year: int) -> float:
        s = S[sid]
        mean = sum(s["values"]) / len(s["values"])
        return (s["values"][s["years"].index(year)] / mean - 1) * 100

    t = Table()

    # ---- rain
    r = full("rain_imerg")
    t.value("Lluvia IMERG 1998–2024, pendiente de Sen", 33, dec(r), dec(r, "sen"), 0, unit="mm/década")
    t.value("Lluvia IMERG, cambio relativo", 5, pct(r), pct(r, "sen"), 0, unit="%/década")
    t.value("Lluvia IMERG, p de Hamed-Rao", 0.36, r["p"], None, 2)
    t.add("Lluvia IMERG, IC 95 % de OLS-HAC", f"[{MINUS}46, +109]", f"[{num(r['lo']*10,0)}, {num(r['hi']*10,0)}]", "igual", abs(r["lo"] * 10 + 46) < 0.6 and abs(r["hi"] * 10 - 109) < 0.6)
    t.add("Lluvia IMERG, etiqueta", "sin evidencia", label_es(r["label"]), "igual", r["label"] == "none")
    r = full("rain_chirps")
    t.value("Lluvia CHIRPS 1998–2025, pendiente de Sen", 2, dec(r), dec(r, "sen"), 0, unit="mm/década")
    t.value("Lluvia CHIRPS, p de Hamed-Rao", 0.95, r["p"], None, 2)
    r = full("rain_smn")
    t.value("Lluvia estación SMN Monterrey, pendiente de Sen", 44, dec(r), dec(r, "sen"), 0, unit="mm/década")
    t.value("Lluvia SMN, cambio relativo", 6, pct(r), pct(r, "sen"), 0, unit="%/década")
    t.value("Lluvia SMN, p de Hamed-Rao", 0.49, r["p"], None, 2)
    gauges = {k: full(f"rain_{k}") for k in ("cuchillo", "cerroprieto", "laboca")}
    lo_g, hi_g = min(pct(v) for v in gauges.values()), max(pct(v) for v in gauges.values())
    lo_p, hi_p = min(pct(v, "sen") for v in gauges.values()), max(pct(v, "sen") for v in gauges.values())
    t.add(
        "Pluviómetros de las tres presas, cambio relativo",
        f"de {MINUS}2 a {MINUS}14 %/década, sin evidencia",
        f"de {num(hi_g,1)} a {num(lo_g,1)} %/década; " + ", ".join(sorted({label_es(v['label']) for v in gauges.values()})),
        f"de {num(hi_p,1)} a {num(lo_p,1)} %/década",
        abs(hi_g + 2) < 0.6 and abs(lo_g + 14) < 0.6 and all(v["label"] == "none" for v in gauges.values()),
    )
    t.value("Anomalía de lluvia de 2022, IMERG", -32.7, anomaly("rain_imerg", 2022), None, 1, unit="%")
    t.value("Anomalía de lluvia de 2022, CHIRPS", -26.8, anomaly("rain_chirps", 2022), None, 1, unit="%")
    t.value("Anomalía de lluvia de 2011, IMERG", -45, anomaly("rain_imerg", 2011), None, 0, unit="%")
    t.value("Anomalía de lluvia de 2011, CHIRPS", -36, anomaly("rain_chirps", 2011), None, 0, unit="%")

    # ---- temperature
    for sid, name, exp in (("temp_gldas_mty", "GLDAS Monterrey", 0.60), ("temp_gldas_gal", "GLDAS Galeana", 0.93), ("temp_smn", "estación SMN", 0.37)):
        r = full(sid)
        t.value(f"Temperatura {name}, pendiente de Sen", exp, dec(r), dec(r, "sen"), 2, unit="°C/década")
        t.add(f"Temperatura {name}, etiqueta", "confirmada", label_es(r["label"]), "igual", r["label"] == "confirmed")

    # ---- evaporation
    r = full("pet_gldas_mty")
    t.value("Evaporación potencial GLDAS Monterrey, pendiente de Sen", -95, dec(r), dec(r, "sen"), 0, unit="mm/década")
    t.value("Evaporación potencial GLDAS Monterrey, cambio relativo", -2.7, pct(r), pct(r, "sen"), 1, unit="%/década")
    t.add("Evaporación potencial GLDAS Monterrey, etiqueta", "confirmada (baja)", label_es(r["label"]), "igual", r["label"] == "confirmed")
    r = full("pan_smn")
    t.value(f"Evaporación de tanque SMN ({r['n']} años completos), pendiente de Sen", -231, dec(r), dec(r, "sen"), 0, unit="mm/década")
    t.value("Evaporación de tanque SMN, cambio relativo", -14, pct(r), pct(r, "sen"), 0, unit="%/década")
    t.add("Evaporación de tanque SMN, etiqueta", "confirmada", label_es(r["label"]), "igual", r["label"] == "confirmed")
    r = full("pan_cerroprieto")
    t.value("Evaporación de tanque Cerro Prieto, pendiente de Sen", -116, dec(r), dec(r, "sen"), 0, unit="mm/década")
    t.value("Evaporación de tanque Cerro Prieto, cambio relativo", -6, pct(r), pct(r, "sen"), 0, unit="%/década")
    t.add("Evaporación de tanque Cerro Prieto, etiqueta", "confirmada", label_es(r["label"]), "igual", r["label"] == "confirmed")
    r = full("pan_cuchillo")
    t.value("Evaporación de tanque El Cuchillo, cambio relativo", -5.6, pct(r), pct(r, "sen"), 1, unit="%/década")
    t.value("Evaporación de tanque El Cuchillo, p de Hamed-Rao", 0.053, r["p"], None, 3)
    t.add("Evaporación de tanque El Cuchillo, etiqueta", "sin evidencia", label_es(r["label"]), "igual", r["label"] == "none")

    # ---- soil moisture
    r = full("soil_gldas_gal")
    t.value("Humedad del suelo Galeana, pendiente de Sen", -28, dec(r), dec(r, "sen"), 0, unit="mm/década")
    t.value("Humedad del suelo Galeana, cambio relativo", -13.7, pct(r), pct(r, "sen"), 1, unit="%/década")
    t.add("Humedad del suelo Galeana, etiqueta", "confirmada", label_es(r["label"]), "igual", r["label"] == "confirmed")
    r = full("soil_gldas_mty")
    t.add("Humedad del suelo Monterrey, etiqueta", "sin evidencia", label_es(r["label"]), "igual", r["label"] == "none")

    # ---- GRACE
    g = full("tws_grace")
    t.value(f"GRACE Nuevo León {g['y0']}–{g['y1']} ({g['n']} años), pendiente de Sen", -8.5, dec(g), dec(g, "sen"), 1, unit="cm/década")
    t.add("GRACE Nuevo León, p de Hamed-Rao", "≈ 0", f"{g['p']:.1e}", "igual", g["p"] < 0.001)
    t.add("GRACE Nuevo León, IC 95 % de OLS-HAC", f"[{MINUS}8.2, {MINUS}5.6]", f"[{num(g['lo']*10)}, {num(g['hi']*10)}]", "igual", abs(g["lo"] * 10 + 8.2) < 0.06 and abs(g["hi"] * 10 + 5.6) < 0.06)
    for win, exp in (("2003-2019", -4.5), ("2003-2021", -6.8), ("2005-2024", -8.5), ("2011-2026", -9.5)):
        r = ref["tws_grace"][win]
        t.value(f"GRACE Nuevo León, ventana {win.replace('-', '–')}", exp, dec(r), dec(r, "sen"), 1, unit="cm/década")
    rr = nl["referenceResidual"]["rain_imerg"]["full"]
    t.value(f"GRACE frente a la lluvia del año y del anterior (IMERG, {rr['n']} años), R²", 0.44, rr["r2"], None, 2)
    t.value("Residuo de esa regresión, pendiente de Sen", -5.0, dec(rr["residual"]), dec(rr["residual"], "sen"), 1, unit="cm/década")
    t.add("Residuo de esa regresión, etiqueta", "confirmada", label_es(rr["residual"]["label"]), "igual", rr["residual"]["label"] == "confirmed")
    team_vol = abs(g["senStep"]) * STATE_AREA_KM2 * 0.01
    page_vol = abs(g["sen"]) * STATE_AREA_KM2 * 0.01
    t.add("Orden de magnitud: pérdida × 64 156 km²", "≈ 545 hm³/año", f"{team_vol:.0f} hm³/año", f"{page_vol:.0f} hm³/año", abs(team_vol - 545) < 3)

    # ---- reservoirs
    vols = {k: full(f"vol_{k}") for k in ("cuchillo", "cerroprieto", "laboca")}
    t.add(
        "Volumen medio anual de las tres presas 2000–2025",
        "sin tendencia confirmada",
        "; ".join(f"{n}: {label_es(v['label'])}" for n, v in (("El Cuchillo", vols["cuchillo"]), ("Cerro Prieto", vols["cerroprieto"]), ("La Boca", vols["laboca"]))),
        "igual",
        all(v["label"] != "confirmed" for v in vols.values()),
    )
    for key, name, exp22, expmean, exppct in (("cerroprieto", "Cerro Prieto", 27.5, 209.9, -87), ("cuchillo", "El Cuchillo", 592.9, 900.0, -34)):
        s = S[f"vol_{key}"]
        v22 = s["values"][s["years"].index(2022)]
        mean = sum(s["values"]) / len(s["values"])
        t.value(f"{name}, volumen medio de 2022", exp22, v22, None, 1, unit="Mm³")
        t.value(f"{name}, media 2000–2025", expmean, mean, None, 1, unit="Mm³")
        t.value(f"{name}, 2022 frente a su media", exppct, (v22 / mean - 1) * 100, None, 0, unit="%")

    # ---- aquifers
    aq = nl["aquifers"]
    neg = [a for a in aq if a["availability"] < 0]
    t.add("Acuíferos con disponibilidad negativa (DOF 2023)", "13 de 23", f"{len(neg)} de {len(aq)}", "igual", len(neg) == 13 and len(aq) == 23)
    t.value("Suma de los déficits", -381.1, sum(a["availability"] for a in neg), None, 1, unit="hm³/año")
    mty = {a["name"]: a["availability"] for a in aq if a["monterrey"]}
    exp_mty = {"Área Metropolitana de Monterrey": -12.4, "Campo Buenos Aires": -5.9, "Campo Mina": -7.1, "Cañón del Huajuco": -2.2, "Campo Durazno": -1.4}
    t.add("Los cinco acuíferos que abastecen a Monterrey", "todos en déficit", "; ".join(f"{k} {num(v)}" for k, v in mty.items()), "igual", mty == exp_mty)
    top = sorted(neg, key=lambda a: a["availability"])[:4]
    exp_top = [("Citrícola Sur", -88.9), ("Sabinas-Parás", -74.1), ("Navidad-Potosí-Raíces", -69.7), ("Citrícola Norte", -57.5)]
    t.add("Los cuatro déficits mayores", "; ".join(f"{k} {num(v)}" for k, v in exp_top), "; ".join(f"{a['name']} {num(a['availability'])}" for a in top), "igual", [(a["name"], a["availability"]) for a in top] == exp_top)

    # ---- Central Valley
    c = full("tws_grace", cv)
    cref = cv["reference"]["tws_grace"]
    NEAR = 0.08  # the Central Valley series could not be cut with the exact cells of the team: see finding 3
    t.value(f"GRACE Valle Central {c['y0']}–{c['y1']}, pendiente de Sen", -16.4, dec(c), dec(c, "sen"), 1, unit="cm/década", near=NEAR)
    t.value("GRACE Valle Central, p de Hamed-Rao", 0.0003, c["p"], None, 4)
    ci_ok: bool | str = abs(c["lo"] * 10 + 17.9) < 0.06 and abs(c["hi"] * 10 + 7.2) < 0.06
    if not ci_ok and abs(c["lo"] * 10 + 17.9) <= NEAR * 17.9 and abs(c["hi"] * 10 + 7.2) <= NEAR * 7.2:
        ci_ok = "near"
    t.add("GRACE Valle Central, IC 95 % de OLS-HAC", f"[{MINUS}17.9, {MINUS}7.2]", f"[{num(c['lo']*10)}, {num(c['hi']*10)}]", "igual", ci_ok)
    for win, exp in (("2003-2021", -22.2), ("2005-2024", -21.4)):
        r = cref[win]
        t.value(f"GRACE Valle Central, ventana {win.replace('-', '–')}", exp, dec(r), dec(r, "sen"), 1, unit="cm/década", near=NEAR)
    cs = cv["series"]["tws_grace"]
    low = sorted(zip(cs["values"], cs["years"]))[:2]
    t.add("GRACE Valle Central, mínimo", f"2021–2022, de {MINUS}20 a {MINUS}22 cm", "; ".join(f"{y}: {num(v)} cm" for v, y in sorted(low, key=lambda x: x[1])), "igual", {y for _, y in low} == {2021, 2022} and all(-22.6 < v < -18.9 for v, _ in low))
    for sid, name, exp in (("rain_imerg", "IMERG", f"{MINUS}16 mm/década, IC [{MINUS}92, +61]"), ("rain_chirps", "CHIRPS", f"{MINUS}17 mm/década, IC [{MINUS}79, +46]")):
        if sid in cv["series"]:
            r = full(sid, cv)
            t.add(f"Lluvia {name} del Valle Central", exp, f"{num(dec(r),0)} mm/década, IC [{num(r['lo']*10,0)}, {num(r['hi']*10,0)}]", f"{num(dec(r,'sen'),0)} mm/década", abs(dec(r) - float(exp.split()[0].replace(MINUS, '-'))) < 0.6)
        else:
            t.add(f"Lluvia {name} del Valle Central", exp, "no reproducible", "no se muestra", None)
    t.add("Norte de México por celdas, con corrección FDR", "1–3 celdas significativas de ~150", "no reproducible", "no se muestra", None)
    t.add("Ciudad del Cabo: IMERG frente a CHIRPS", f"+6 frente a +92 mm/década", "no reproducible", "no se muestra", None)
    t.add("Auditoría del Alto Madeira", f"{MINUS}167 mm/década con quiebre tras 2011", "no reproducible", "no se muestra", None)

    if out is None:
        return t.failed

    pan = full("pan_smn")
    ok_rows = sum(1 for r in t.rows if r[4] == "✓")
    no_files = sum(1 for r in t.rows if r[4] == "sin archivos")
    today = dt.date.today()
    months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    fecha = f"{today.day} de {months[today.month - 1]} de {today.year}"
    gaps = [sid for sid, s in S.items() if len(s["years"]) != s["years"][-1] - s["years"][0] + 1]
    gap_rows = "\n".join(
        f"| `{sid}` | {full(sid)['y0']}–{full(sid)['y1']} | {full(sid)['n']} de {full(sid)['y1'] - full(sid)['y0'] + 1} | {num(dec(full(sid)), 2)} | {num(dec(full(sid), 'sen'), 2)} | {num(full(sid)['ols'] * 10, 2)} |"
        for sid in gaps
    )
    text = f"""---
tags: [raack, agua, nuevo-leon, verificación]
fecha: {today.isoformat()}
---
# Diagnóstico del agua · verificación de las cifras

[Índice](../INDICE.md) · [Página web](../app/README.md) · [Datos de Nuevo León](REQUISITOS_DATOS_NUEVO_LEON.md) · [Script del equipo](diagnostico_nl.py) · [Generador de datos](../app/scripts/build_water.py)

Esta nota la escribe `app/scripts/build_water.py` cada vez que se ejecuta; no se edita a mano. Última ejecución: {fecha}. Compara las cifras que el equipo dio por validadas con las que salen de los archivos guardados en el repositorio. La página web calcula las tendencias en el navegador a partir de las mismas series anuales, y unas pruebas automáticas comprueban que su motor da lo mismo que pymannkendall y statsmodels.

## Resultado

- **{ok_rows} de {len(t.rows)} cifras reproducidas.** {t.near} se aproximan (≈, las del Valle Central: ver el hallazgo 3), {t.failed} no coinciden y {no_files} no se pueden reproducir porque sus archivos no están en el repositorio.
- El script del equipo, [diagnostico_nl.py](diagnostico_nl.py), se ejecutó sin cambios sobre el repositorio y da los mismos números que esta tabla.
- Las etiquetas (confirmada, indicio, sin evidencia) no cambian en ningún caso.

## Hallazgo 1 · la pendiente «por década» cuando faltan años

`pymannkendall` calcula la pendiente de Sen **por paso de la serie**, no por año. Si no falta ningún año, es lo mismo. Cuando faltan años, los pasos se cuentan como años consecutivos y «× 10» deja de ser «por década». Pasa en estas series:

| Serie | Periodo | Años con dato | Sen por paso × 10 | Sen con años reales × 10 | OLS × 10 |
|---|---|---|---|---|---|
{gap_rows}

- GRACE no tiene 2015, 2017 ni 2018 (menos de 9 meses). Con los años reales la pérdida es **{num(dec(g, 'sen'))} cm por década**, no {num(dec(g))}. La cifra anterior queda fuera de su propio intervalo de OLS ([{num(g['lo']*10)}, {num(g['hi']*10)}]); la corregida queda dentro.
- La evaporación de tanque del SMN tiene {pan['n']} años completos entre {pan['y0']} y {pan['y1']}: **{num(dec(pan, 'sen'), 0)} mm por década ({num(pct(pan, 'sen'), 0)} %)**, no {num(dec(pan), 0)} ({num(pct(pan), 0)} %).
- La comparación de orden de magnitud pasa de {team_vol:.0f} a **{page_vol:.0f} hm³ al año**, frente a un déficit oficial de 381.
- La prueba de Mann-Kendall usa rangos y el intervalo de OLS ya usa los años reales, así que **ningún veredicto cambia**: solo cambia el tamaño del cambio.

**La página muestra la pendiente con años reales.** La columna «método del equipo» conserva la cifra original para que el equipo decida cuál cita en la presentación.

## Hallazgo 2 · una prueba que no se puede calcular

En el volumen de La Boca la corrección de Hamed-Rao deja una varianza negativa y el valor p no existe. `pymannkendall` devuelve `nan`. La página lo dice («not computable») y deja la etiqueta en «indicio», porque solo el intervalo de OLS excluye el cero.

## Hallazgo 3 · Valle Central

La serie de GRACE del Valle Central sale del archivo mundial con la misma receta que Nuevo León: centros de celda dentro del recuadro, pesos cos(latitud) y sin factores de escala. Da {num(dec(c))} cm por década por paso y **{num(dec(c, 'sen'))} con años reales**; la cifra esperada era {MINUS}16.4. La diferencia con la esperada (alrededor del 6 %) no se pudo explicar: probablemente otra selección de celdas. El valor p (0.0003), los años del mínimo y el signo coinciden.

La lluvia del Valle Central, el mapa del norte, Ciudad del Cabo y el Alto Madeira **no tienen archivos en el repositorio**. Siguiendo la regla del equipo, la página no muestra esas cifras. Para incluir la lluvia del Valle Central basta guardar los dos CSV de ERDDAP en `recursos/archivos/valle-central/imerg/` y `recursos/archivos/valle-central/chirps/` y volver a ejecutar el script.

## Hallazgo 4 · la tabla de acuíferos coincide con el Diario Oficial

El 14 de noviembre de 2026 se abrió el [acuerdo publicado](https://sidof.segob.gob.mx/notas/docFuente/5708074) y se compararon los 23 renglones de Nuevo León con el [CSV del equipo](../recursos/archivos/nuevo-leon/acuiferos/acuiferos_nuevo_leon_DOF_2023-11-09.csv): recarga, descarga natural comprometida, volumen concesionado y disponibilidad coinciden en todos, redondeados a un decimal. El acuerdo confirma la fecha de corte del 30 de diciembre de 2022.

La disponibilidad no sale solo de las columnas del CSV. El acuerdo la define como `DMA = R − DNC − VEAS`, y la extracción `VEAS` suma al volumen concesionado (`VCAS`) otros tres volúmenes que el CSV no trae: `VEALA` (zonas de suspensión provisional de libre alumbramiento), `VAPTYR` (pendiente de titulación o registro) y `VAPRH` (reservas, reglamentos y programación hídrica). Ejemplo, Lampazos-Villaldama: 21.8 − 8.0 − (11.592650 + 12.586924 + 0 + 0.028601) = −10.408.

## Tabla de verificación

{t.md()}

«Método del equipo»: pendiente de Sen por paso, como en `diagnostico_nl.py`. «En la página»: pendiente de Sen con los años reales; «igual» cuando no hay diferencia. Estado: ✓ reproducida, ≈ mismo signo y a menos del 8 %, ≠ distinta, «sin archivos» cuando no hay con qué calcularla.

## Cómo repetirlo

```bash
python3 -m venv .venv
.venv/bin/pip install -r app/scripts/requirements-water.txt
.venv/bin/python app/scripts/build_water.py --check
```

Versiones usadas en esta ejecución: {', '.join(f'{k} {v}' for k, v in data['software'].items())}. El archivo `app/public/data/water.json` guarda el tamaño y el SHA-256 de los {len(data['inputs'])} archivos de entrada.

## Uso de IA

El método y el diagnóstico los definió el equipo. Claude (IA) escribió el generador de datos, esta verificación y el motor del navegador, y detectó el hallazgo 1. Ningún valor científico se generó con IA: todos salen de los archivos de NASA, CHIRPS, CONAGUA, SMN y el DOF.
"""
    out.write_text(text, encoding="utf-8")
    print(f"{out.name}: {ok_rows}/{len(t.rows)} figures reproduced, {t.near} close, {t.failed} differ, {no_files} without files")
    return t.failed
