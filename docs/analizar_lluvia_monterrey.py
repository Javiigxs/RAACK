"""Recalcula el caso de Monterrey con los archivos locales. Análisis de Codex (IA)."""

import calendar
import csv
import math
from datetime import date, timedelta
from itertools import groupby
from pathlib import Path
from statistics import median

from scipy.stats import kendalltau, theilslopes

DATOS = Path(__file__).resolve().parents[1] / "recursos" / "archivos"
ANIOS = range(2002, 2025)


def filas_power(nombre):
    with (DATOS / nombre).open(encoding="utf-8") as archivo:
        for linea in archivo:
            if linea.strip() == "-END HEADER-":
                return list(csv.DictReader(archivo))
    raise ValueError(f"Falta la cabecera de NASA en {nombre}")


def dias_del_anio(anio):
    inicio = date(anio, 1, 1)
    return [inicio + timedelta(days=i) for i in range(365 + calendar.isleap(anio))]


def leer_lluvia():
    lluvia = {}
    for fila in filas_power("monterrey-lluvia-nasa-power.csv"):
        anio = int(fila["YEAR"])
        fecha = date(anio, 1, 1) + timedelta(days=int(fila["DOY"]) - 1)
        valor = float(fila["IMERG_PRECTOT"])
        if fecha.year != anio or fecha in lluvia or not math.isfinite(valor) or valor < 0:
            raise ValueError(f"Lluvia o fecha no válida: {fila}")
        lluvia[fecha] = valor
    if sorted(lluvia) != [dia for anio in ANIOS for dia in dias_del_anio(anio)]:
        raise ValueError("La cobertura de IMERG no coincide con el periodo previsto")
    return lluvia


def leer_humedad():
    meses = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split()
    humedad = {}
    for fila in filas_power("monterrey-humedad-nasa-power.csv"):
        anio = int(fila["YEAR"])
        if fila["PARAMETER"] != "GWETROOT" or anio in humedad:
            raise ValueError("Año repetido o variable inesperada en MERRA-2")
        humedad[anio] = [float(fila[mes]) for mes in meses]
    if sorted(humedad) != list(ANIOS) or not all(
        0 <= valor <= 1 for fila in humedad.values() for valor in fila
    ):
        raise ValueError("Humedad fuera de rango o cobertura incompleta")
    return humedad


def leer_estacion_2022():
    estacion = {}
    for linea in (DATOS / "smn-monterrey-19052.txt").read_text().splitlines():
        if linea.startswith("2022-"):
            dia, lluvia, *_ = linea.split()
            fecha, valor = date.fromisoformat(dia), float(lluvia)
            if fecha in estacion or not math.isfinite(valor) or valor < 0:
                raise ValueError(f"Registro de estación no válido: {linea}")
            estacion[fecha] = valor
    if sorted(estacion) != dias_del_anio(2022):
        raise ValueError("Faltan días en el observatorio en 2022")
    return estacion


def resumen_anual(serie, anio):
    dias = dias_del_anio(anio)
    valores = [serie[dia] for dia in dias]
    total = sum(valores)
    secos = [list(grupo) for seco, grupo in groupby(dias, lambda d: serie[d] < 1) if seco]
    racha = max(secos, key=len, default=[])
    return {
        "total": total, "cinco_pct": 100 * sum(sorted(valores)[-5:]) / total if total else math.nan,
        "racha": len(racha), "desde": racha[0] if racha else None, "hasta": racha[-1] if racha else None,
        "ene_jul": sum(serie[d] for d in dias if d.month <= 7),
        "junio": sum(serie[d] for d in dias if d.month == 6),
    }


def main():
    lluvia, humedad, estacion = leer_lluvia(), leer_humedad(), leer_estacion_2022()
    anuales = {anio: resumen_anual(lluvia, anio) for anio in ANIOS}
    print("Año     mm   % en 5 días   racha <1 mm    inicio         fin")
    for anio, r in anuales.items():
        print(f"{anio} {r['total']:7.2f} {r['cinco_pct']:10.2f} {r['racha']:12}    {r['desde']}   {r['hasta']}")
    base = range(2002, 2022)
    ref_ene_jul = median(anuales[a]["ene_jul"] for a in base)
    ref_junio = median(anuales[a]["junio"] for a in range(2002, 2024))
    print("Enero–julio 2022 / mediana 2002–21 (mm):", anuales[2022]["ene_jul"], ref_ene_jul)
    print("Humedad julio 2022 / mediana 2002–21:", humedad[2022][6], median(humedad[a][6] for a in base))
    print("Junio 2024 / mediana 2002–23 (mm):", anuales[2024]["junio"], ref_junio)
    print("20 de junio de 2024 UTC (mm):", lluvia[date(2024, 6, 20)])
    r = resumen_anual(estacion, 2022)
    print("Estación SMN 2022:", r, "4 de septiembre (mm):", estacion[date(2022, 9, 4)])
    porcentajes = [r["cinco_pct"] for r in anuales.values()]
    sen = theilslopes(porcentajes, list(ANIOS), alpha=0.95)
    prueba = kendalltau(list(ANIOS), porcentajes, method="exact")
    print(f"Sen (puntos porcentuales por década): {10*sen.slope:.2f}, "
          f"IC 95 % [{10*sen.low_slope:.2f}, {10*sen.high_slope:.2f}], p de Kendall bilateral = {prueba.pvalue:.3f}")


if __name__ == "__main__":
    main()
