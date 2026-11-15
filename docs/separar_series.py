"""Separa los originales locales en cinco CSV de análisis. Ejecutar con Python 3.

Codex (IA) preparó el código. Las mediciones y estimaciones provienen de NASA y
del SMN. Cada fila representa una fecha y un sitio de un solo producto. Para un
periodo esperado sin fila original se escribe fila_en_origen=0 y valores vacíos.
Un dato faltante dentro de una fila presente también queda vacío. No se interpola.
IMERG usa días UTC y el SMN conserva la fecha de su registro. Las coordenadas de
NASA son las consultadas, no las esquinas ni el centro calculado de la celda.

MODIS conserva los códigos de calidad sin aplicar un corte analítico. Las LST
de AppEEARS ya vienen en kelvin; se restan 273,15 para obtener °C. Su relleno
0 K se deja vacío. En NDVI se conserva el índice escalado del original y se
excluye el relleno. QC/MODLAND, reliability y otras banderas requieren revisión
según el uso. fecha_inicio es la de referencia del compuesto. El compuesto
iniciado en diciembre de 2000 queda fuera de la selección 2001–2025.
"""

import calendar
import csv
import tempfile
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path


RAIZ = Path(__file__).resolve().parents[1]
ORIGINALES = RAIZ / "recursos" / "archivos"
APPEEARS = ORIGINALES / "appeears-monterrey-2001-2025"
SALIDA = RAIZ / "datos" / "series"
ANIOS_NASA = range(2002, 2025)
ANIOS_MODIS = range(2001, 2026)
PUNTO = ("monterrey", "25.6708", "-100.3092")
ESTACION = ("19052", "25.73361111", "-100.3047222")
MESES = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split()


def dias(anios, paso=1):
    for anio in anios:
        for intervalo in range(0, 365 + calendar.isleap(anio), paso):
            yield date(anio, 1, 1) + timedelta(days=intervalo)


def meses(anios):
    for anio in anios:
        for mes in range(1, 13):
            yield date(anio, mes, 1)


def csv_power(nombre):
    with (ORIGINALES / nombre).open(encoding="utf-8") as archivo:
        for linea in archivo:
            if linea.strip() == "-END HEADER-":
                yield from csv.DictReader(archivo)
                return
    raise ValueError(f"Falta la cabecera de POWER en {nombre}")


def insertar(tabla, clave, valores):
    if clave in tabla:
        raise ValueError(f"Registro duplicado: {clave}")
    tabla[clave] = valores


def valor(texto, minimo=None, maximo=None):
    if texto in ("", "NULO", "-999", "-999.0"):
        return ""
    numero = Decimal(texto)
    if not numero.is_finite():
        raise ValueError(f"Valor no finito: {texto}")
    if (minimo is not None and numero < minimo) or (maximo is not None and numero > maximo):
        return ""
    return numero


def leer_power():
    lluvia, humedad = {}, {}
    for fila in csv_power("monterrey-lluvia-nasa-power.csv"):
        anio, ordinal = int(fila["YEAR"]), int(fila["DOY"])
        if anio not in ANIOS_NASA or not 1 <= ordinal <= 365 + calendar.isleap(anio):
            raise ValueError(f"Año o día de IMERG fuera del periodo: {anio} {ordinal}")
        dia = date(anio, 1, 1) + timedelta(days=ordinal - 1)
        insertar(lluvia, dia, (valor(fila["IMERG_PRECTOT"], minimo=0),))
    for fila in csv_power("monterrey-humedad-nasa-power.csv"):
        anio = int(fila["YEAR"])
        if fila["PARAMETER"] != "GWETROOT" or anio not in ANIOS_NASA:
            raise ValueError(f"Campo o año inesperado: {fila}")
        for mes, columna in enumerate(MESES, 1):
            insertar(humedad, date(anio, mes, 1), (valor(fila[columna], 0, 1),))
    return lluvia, humedad


def leer_smn():
    lluvia, temperatura = {}, {}
    with (ORIGINALES / "smn-monterrey-19052.txt").open(encoding="utf-8") as archivo:
        for linea in archivo:
            if not linea[:4].isdigit():
                continue
            fecha, precip, _, tmax, tmin = linea.split()
            dia = date.fromisoformat(fecha)
            if dia.year in ANIOS_NASA:
                insertar(lluvia, dia, (valor(precip, minimo=0),))
                insertar(temperatura, dia, (valor(tmax), valor(tmin)))
    return lluvia, temperatura


def campos_lst(fila):
    prefijo = "MOD11A2_061_"
    valores = []
    for turno in ("Day", "Night"):
        kelvin = valor(fila[f"{prefijo}LST_{turno}_1km"], minimo=Decimal("150"))
        valores.append(kelvin - Decimal("273.15") if kelvin != "" else "")
    for turno in ("Day", "Night"):
        codigo = valor(fila[f"{prefijo}QC_{turno}"], 0, 255)
        valores.append(int(codigo) if codigo != "" else "")
    return tuple(valores)


def campos_ndvi(fila):
    prefijo = "MOD13A3_061__1_km_monthly_"
    indice = valor(fila[prefijo + "NDVI"], Decimal("-0.2"), 1)
    calidad = valor(fila[prefijo + "VI_Quality"], 0, 65534)
    fiabilidad = valor(fila[prefijo + "pixel_reliability"], 0, 3)
    return (indice, int(calidad) if calidad != "" else "", int(fiabilidad) if fiabilidad != "" else "")


def leer_modis(producto, calendario, extraer_campos):
    ruta, = APPEEARS.glob(f"*-{producto}-061-results.csv")
    sitios = {}
    with ruta.open(encoding="utf-8-sig") as archivo:
        for fila in csv.DictReader(archivo):
            fecha = date.fromisoformat(fila["Date"])
            if fecha.year not in ANIOS_MODIS:
                continue
            if fecha not in calendario:
                raise ValueError(f"Fecha inesperada para {producto}: {fecha}")
            sitio = (fila["ID"], fila["Latitude"], fila["Longitude"])
            insertar(sitios.setdefault(sitio, {}), fecha, extraer_campos(fila))
    return [(producto + ".061", sitio, tabla) for sitio, tabla in sorted(sitios.items())]


def escribir(carpeta, nombre, fecha_col, columnas, fechas, series):
    with (carpeta / nombre).open("w", encoding="utf-8", newline="") as archivo:
        salida = csv.writer(archivo, lineterminator="\n")
        salida.writerow([fecha_col, "fuente", "sitio", "latitud", "longitud", "fila_en_origen", *columnas])
        for fecha in fechas:
            for fuente, sitio, tabla in series:
                salida.writerow([fecha, fuente, *sitio, int(fecha in tabla), *tabla.get(fecha, ("",) * len(columnas))])


def main():
    imerg, humedad = leer_power()
    smn, aire = leer_smn()
    fechas_lst = tuple(dias(ANIOS_MODIS, 8))
    fechas_ndvi = tuple(meses(ANIOS_MODIS))
    lst = leer_modis("MOD11A2", set(fechas_lst), campos_lst)
    ndvi = leer_modis("MOD13A3", set(fechas_ndvi), campos_ndvi)
    if len(lst) != 5 or {s for _, s, _ in lst} != {s for _, s, _ in ndvi}:
        raise ValueError("Los sitios MODIS no corresponden a las cinco ubicaciones comunes")
    SALIDA.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=SALIDA) as ruta:
        temp = Path(ruta)
        escribir(temp, "lluvia_diaria.csv", "fecha", ["lluvia_mm"], dias(ANIOS_NASA),
                 [("IMERG", PUNTO, imerg), ("SMN", ESTACION, smn)])
        escribir(temp, "temperatura_aire_diaria.csv", "fecha", ["maxima_c", "minima_c"],
                 dias(ANIOS_NASA), [("SMN", ESTACION, aire)])
        escribir(temp, "humedad_raices_mensual.csv", "fecha_inicio", ["saturacion_relativa_0_1"],
                 meses(ANIOS_NASA), [("MERRA-2", PUNTO, humedad)])
        escribir(temp, "temperatura_superficial_8dias.csv", "fecha_inicio",
                 ["superficie_dia_c", "superficie_noche_c", "qc_dia", "qc_noche"], fechas_lst, lst)
        escribir(temp, "vegetacion_ndvi_mensual.csv", "fecha_inicio",
                 ["ndvi", "vi_quality", "pixel_reliability"], fechas_ndvi, ndvi)
        for archivo in temp.iterdir():
            archivo.replace(SALIDA / archivo.name)


if __name__ == "__main__":
    main()
