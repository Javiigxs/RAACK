"""Genera datos/derivados/lluvia_anual.csv con los originales locales (Codex, IA).

Cada fila conserva una fuente y un año calendario, de 2002 a 2024. Los
indicadores requieren todos los días de ese año. Las fechas 20/50/80 son
los primeros días que alcanzan ese porcentaje del acumulado anual.
"""

import calendar
import csv
from datetime import date, timedelta
from decimal import Decimal
from itertools import accumulate, groupby
from pathlib import Path


RAIZ = Path(__file__).resolve().parents[1]
ORIGINALES = RAIZ / "recursos" / "archivos"
SALIDA = RAIZ / "datos" / "derivados" / "lluvia_anual.csv"
ANIOS = range(2002, 2025)
COLUMNAS = (
    "fuente", "anio", "dias_esperados", "dias_validos", "cobertura_pct",
    "total_mm", "dias_con_1mm_o_mas", "media_mm_por_dia_con_1mm_o_mas",
    "racha_max_dias_menos_1mm", "porcentaje_en_5_dias_mas_lluviosos",
    "fecha_20_pct", "fecha_50_pct", "fecha_80_pct", "dias_entre_20_y_80_pct",
)


def lluvia_imerg():
    with (ORIGINALES / "monterrey-lluvia-nasa-power.csv").open(encoding="utf-8") as archivo:
        for linea in archivo:
            if linea.strip() == "-END HEADER-":
                break
        else:
            raise ValueError("No se encontró el fin de la cabecera NASA POWER")
        for fila in csv.DictReader(archivo):
            anio = int(fila["YEAR"])
            fecha = date(anio, 1, 1) + timedelta(days=int(fila["DOY"]) - 1)
            if fecha.year != anio:
                raise ValueError(f"Día inválido en IMERG: {fila}")
            valor = Decimal(fila["IMERG_PRECTOT"])
            yield fecha, None if valor == -999 else valor


def lluvia_smn():
    with (ORIGINALES / "smn-monterrey-19052.txt").open(encoding="utf-8") as archivo:
        for linea in archivo:
            if linea[:4].isdigit():
                dia, lluvia, *_ = linea.split()
                yield date.fromisoformat(dia), None if lluvia == "NULO" else Decimal(lluvia)


def resumen(fuente, anio, registros):
    inicio = date(anio, 1, 1)
    esperados = 366 if calendar.isleap(anio) else 365
    valores = [registros.get(inicio + timedelta(days=i)) for i in range(esperados)]
    validos = sum(v is not None for v in valores)
    fila = dict(fuente=fuente, anio=anio, dias_esperados=esperados, dias_validos=validos,
                cobertura_pct=f"{100 * validos / esperados:.2f}")
    if validos != esperados:
        return fila

    total = sum(valores)
    humedos = [v for v in valores if v >= 1]
    fila["total_mm"] = f"{total:.2f}"
    fila["dias_con_1mm_o_mas"] = len(humedos)
    if humedos:
        fila["media_mm_por_dia_con_1mm_o_mas"] = f"{sum(humedos) / len(humedos):.2f}"
    fila["racha_max_dias_menos_1mm"] = max(
        (sum(1 for _ in dias) for seco, dias in groupby(valores, key=lambda v: v < 1) if seco),
        default=0,
    )
    if total == 0:
        return fila

    fila["porcentaje_en_5_dias_mas_lluviosos"] = f"{100 * sum(sorted(valores)[-5:]) / total:.2f}"
    acumulados = list(accumulate(valores))
    for porcentaje in (20, 50, 80):
        indice = next(i for i, acum in enumerate(acumulados) if 100 * acum >= porcentaje * total)
        fila[f"fecha_{porcentaje}_pct"] = inicio + timedelta(days=indice)
    fila["dias_entre_20_y_80_pct"] = (fila["fecha_80_pct"] - fila["fecha_20_pct"]).days
    return fila


def main():
    filas = []
    for fuente, serie in (("IMERG", lluvia_imerg()), ("SMN-19052", lluvia_smn())):
        registros = {}
        for fecha, valor in serie:
            if fecha.year not in ANIOS:
                continue
            if fecha in registros or (valor is not None and (not valor.is_finite() or valor < 0)):
                raise ValueError(f"{fuente}: fecha duplicada o precipitación inválida el {fecha}")
            registros[fecha] = valor
        filas.extend(resumen(fuente, anio, registros) for anio in ANIOS)

    SALIDA.parent.mkdir(exist_ok=True, parents=True)
    with SALIDA.open("w", encoding="utf-8", newline="") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=COLUMNAS, lineterminator="\n")
        escritor.writeheader()
        escritor.writerows(filas)


if __name__ == "__main__":
    main()
