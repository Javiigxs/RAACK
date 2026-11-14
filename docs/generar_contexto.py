"""Genera docs/CONTEXTO.json, docs/CONTEXTO.svg y docs/CONTEXTO.md de RAACK desde un único conjunto de datos.

Uso, desde la raíz del repo: python3 docs/generar_contexto.py docs
Para cambiar el grafo, edita las listas FUENTES, ARCHIVOS, ACCESOS, SOLICITUDES, DECISIONES y DESTINOS.
"""
import json
import sys
from pathlib import Path
from xml.sax.saxutils import escape

RETO = "https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/"
FECHA = "2026-11-14"

FUENTES = [
    # id, num, etiqueta, grupo, estado, punto de parada, revisó, ficha, url
    ("giovanni", "—", "Giovanni", "NASA", "no-abierto", "No se abrió: decisión pendiente", None, None,
     "https://giovanni.gsfc.nasa.gov/giovanni/"),
    ("hydrology", "01", "Hydrology Time Series", "NASA", "revisado", "Tabla de variables de GLDAS V2.1", "Codex",
     "01-hydrology.md", "https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series"),
    ("appeears", "02", "AppEEARS", "NASA", "requiere-acceso", "Ayuda: descarga de muestras de puntos", "Codex",
     "02-appeears.md", "https://appeears.earthdatacloud.nasa.gov/"),
    ("cdo", "03", "Climate Data Online · NOAA", "NASA", "revisado", "Documentación de /data del API v2", "Codex",
     "03-cdo.md", "https://www.ncei.noaa.gov/cdo-web/"),
    ("seawifs", "04", "Artículo SeaWiFS", "NASA", "revisado", "Metodología del PDF", "Codex",
     "04-seawifs.md", "https://ntrs.nasa.gov/citations/20090042747"),
    ("knmi", "05", "KNMI Climate Explorer", "Socios", "bloqueado", "Verificación humana en la ayuda", "Codex",
     "05-knmi.md", "https://climexp.knmi.nl/"),
    ("medium", "06", "Métodos estadísticos · Medium", "Socios", "revisado", "References y documentación de ADF", "Codex",
     "06-metodos-estadisticos.md",
     "https://medium.com/@snp.kriss/statistical-test-methods-to-detect-trends-in-time-series-data-b361a0ec530b"),
    ("statsig", "07", "Significación · Statsig", "Socios", "revisado", "Recomendaciones e intervalos", "Codex",
     "07-significancia.md", "https://www.statsig.com/perspectives/a-comprehensive-guide-to-statistical-significance"),
    ("rcm", "08", "RCM · Data", "CSA", "requiere-acceso", "Escena rcm-ard del STAC de EODMS", "Claude",
     "08-rcm.md", "https://donnees-data.asc-csa.gc.ca/en/dataset/rcm"),
    ("geo", "09", "GEO.ca", "CSA", "revisado", "Colecciones del STAC del Datacube", "Claude",
     "09-geo.md", "http://geo.ca/"),
    ("swot", "10", "SWOT · Information", "CSA", "requiere-acceso", "Hydrocron y tutorial de la CSA", "Claude",
     "10-swot.md", "https://www.asc-csa.gc.ca/eng/satellites/swot/"),
    ("ecosistemas", "11", "Ecosistemas desde el espacio", "CSA", "revisado", "Página de BioSpace", "Claude",
     "11-ecosistemas.md",
     "https://www.asc-csa.gc.ca/eng/satellites/everyday-lives/monitoring-and-protecting-our-ecosystems-from-space.asp"),
    ("sar", "12", "Tutorial SAR · Python y QGIS", "CSA", "revisado", "Lectura de notebook, guía y licencia", "Codex",
     "12-sar.md", "https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial"),
]
GRUPOS = {
    "NASA": "NASA · datos y recursos",
    "Socios": "Socios · KNMI y estadística",
    "CSA": "CSA · Agencia Espacial Canadiense",
}
ARCHIVOS = [
    ("f_gldas", "CSV GLDAS · una semana", "gldas-evapotranspiracion-muestra-2016-05.csv", "hydrology"),
    ("f_gsom", "PDF GSOM · NOAA", "noaa-gsom-documentacion.pdf", "cdo"),
    ("f_seawifs", "PDF SeaWiFS · 27 páginas", "nasa-seawifs-series-temporales-20090042747.pdf", "seawifs"),
    ("f_knmi", "Manual KNMI · 15 páginas", "knmi-manual-acceso-descarga.pdf", "knmi"),
    ("f_sar_nb", "Notebook SAR", "csa-sar-bc-wildfire.ipynb", "sar"),
    ("f_sar_qgis", "Guía QGIS SAR", "csa-sar-tutorial-qgis.md", "sar"),
    ("f_sar_lic", "Licencia SAR", "csa-sar-LICENSE.txt", "sar"),
]
ACCESOS = [
    # id, etiqueta, fuentes que lo piden, estado
    ("a_earthdata", "Cuenta NASA Earthdata · creada", [("appeears", "cuenta y extracción"), ("swot", "descargar granulos")],
     "conseguido"),
    ("a_noaa", "Token del API de NOAA", [("cdo", "solo para el API")], "sin pedir"),
    ("a_knmi", "Verificación humana KNMI", [("knmi", "bloquea las herramientas")], "sin pedir"),
    ("a_eodms", "Registro EODMS y licencia", [("rcm", "para descargar")], "sin pedir"),
]
SOLICITUDES = [
    # id, etiqueta, fuente, nota
    ("s_appeears", "Prueba AppEEARS Monterrey · en cola", "appeears", "docs/SOLICITUD_APPEEARS_MONTERREY.md"),
]
DECISIONES = [
    ("d_giovanni", "¿Usamos Giovanni?",
     [("giovanni", "pendiente"), ("hydrology", "su API enlaza Giovanni"), ("seawifs", "lo usa como antecedente")]),
    ("d_canada", "¿La región está en Canadá?", [("rcm", "acceso público solo en Canadá"), ("geo", "datos de Canadá")]),
]
CASO = ("d_caso", "Elegir variable, región y periodo")
DESTINOS = [
    ("github", "GitHub · Javiigxs/RAACK", "Fichas, cobertura, solicitudes, grafo, índice y archivos",
     "https://github.com/Javiigxs/RAACK"),
    ("obsidian", "Obsidian · bóveda RAACK", "Clon local del repo; se empieza por INDICE.md", None),
]


def datos():
    nodos = [
        {"id": "reto", "tipo": "reto", "etiqueta": "Be An Earth System Trend Detective!", "enlace": RETO},
        {"id": "pagina", "tipo": "pagina", "etiqueta": "Página oficial de recursos · 13", "enlace": RETO + "?tab=resources"},
    ]
    aristas = [{"de": "reto", "a": "pagina", "relacion": "ofrece"}]
    for fid, num, etq, grupo, estado, parada, quien, ficha, url in FUENTES:
        nodos.append({"id": fid, "tipo": "fuente", "numero": num, "etiqueta": etq, "grupo": GRUPOS[grupo],
                      "estado": estado, "punto_de_parada": parada, "revisado_por": quien,
                      "ficha": f"recursos/paginas/{ficha}" if ficha else None, "enlace": url})
        aristas.append({"de": "pagina", "a": fid, "relacion": "lista"})
    for aid, etq, archivo, fuente in ARCHIVOS:
        nodos.append({"id": aid, "tipo": "archivo", "etiqueta": etq, "ruta": f"recursos/archivos/{archivo}"})
        aristas.append({"de": fuente, "a": aid, "relacion": "se descargó"})
        aristas.append({"de": aid, "a": "github", "relacion": "publicado"})
        aristas.append({"de": aid, "a": "obsidian", "relacion": "copiado"})
    for aid, etq, desde, estado in ACCESOS:
        nodos.append({"id": aid, "tipo": "acceso", "etiqueta": etq, "estado": estado})
        for fuente, rel in desde:
            aristas.append({"de": fuente, "a": aid, "relacion": "requiere: " + rel})
        if estado != "conseguido":
            aristas.append({"de": aid, "a": CASO[0], "relacion": "se pide después de decidir"})
    for sid, etq, fuente, nota in SOLICITUDES:
        nodos.append({"id": sid, "tipo": "solicitud", "etiqueta": etq, "estado": "en cola", "nota": nota})
        aristas.append({"de": fuente, "a": sid, "relacion": "solicitud de prueba"})
        aristas.append({"de": "a_earthdata", "a": sid, "relacion": "enviada con la cuenta"})
        aristas.append({"de": sid, "a": CASO[0], "relacion": "ayuda a decidir"})
    for did, etq, desde in DECISIONES:
        nodos.append({"id": did, "tipo": "decision", "etiqueta": etq, "estado": "pendiente"})
        for fuente, rel in desde:
            aristas.append({"de": fuente, "a": did, "relacion": rel})
    nodos.append({"id": CASO[0], "tipo": "decision", "etiqueta": CASO[1], "estado": "pendiente"})
    aristas.append({"de": "d_canada", "a": CASO[0], "relacion": "forma parte de"})
    for did, etq, detalle, url in DESTINOS:
        nodos.append({"id": did, "tipo": "destino", "etiqueta": etq, "detalle": detalle, "enlace": url})
    aristas.append({"de": "github", "a": "obsidian", "relacion": "clon local"})
    for fid, _num, _etq, _grupo, _estado, _parada, _quien, ficha, _url in FUENTES:
        if ficha:
            aristas.append({"de": fid, "a": "github", "relacion": "ficha publicada"})
    return {
        "proyecto": "RAACK",
        "reto": RETO,
        "fecha": FECHA,
        "descripcion": ("Contexto de la preparación de recursos: del reto a la página oficial, sus 13 recursos, "
                        "lo que se obtuvo de cada uno, los accesos, las solicitudes enviadas y las decisiones pendientes."),
        "agentes": {
            "Codex": "Preparación inicial, 7 descargas, fichas 01–07 y 12, primera publicación.",
            "Claude": ("Relevo: fichas 08–11, cobertura, solicitudes de datos, este grafo, la solicitud de prueba "
                       "de AppEEARS y el índice para IAs."),
        },
        "nodos": nodos,
        "aristas": aristas,
    }


# ---------- SVG ----------

ESTILO = {
    "revisado": ("#e7f5ec", "#2e7d4f", ""),
    "requiere-acceso": ("#fff4e5", "#d9822b", ""),
    "bloqueado": ("#fdecea", "#c0392b", ""),
    "no-abierto": ("#f2f2f2", "#8a8a8a", "5 4"),
    "archivo": ("#e8f1fb", "#2f6fb5", ""),
    "acceso": ("#fff4e5", "#d9822b", ""),
    "decision": ("#f6e8f7", "#8e44ad", ""),
    "destino": ("#eef0f2", "#3d4650", ""),
    "solicitud": ("#e6f4f8", "#1b7f99", ""),
}
COLOR_ARISTA = {"lista": "#9aa5b1", "archivo": "#2f6fb5", "acceso": "#d9822b", "decision": "#8e44ad", "destino": "#3d4650",
                "solicitud": "#1b7f99"}
FUENTE = "Inter, 'Segoe UI', Helvetica, Arial, sans-serif"


def caja(x, y, w, h, estilo, lineas, extra=""):
    fill, stroke, dash = ESTILO[estilo]
    s = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{fill}" stroke="{stroke}" stroke-width="1.4"'
         + (f' stroke-dasharray="{dash}"' if dash else "") + "/>"]
    if len(lineas) == 1:
        s.append(f'<text x="{x + 10}" y="{y + h / 2 + 4.5}" font-size="12.5" fill="#1d2430">{escape(lineas[0])}</text>')
    else:
        s.append(f'<text x="{x + 10}" y="{y + 17}" font-size="12.5" font-weight="600" fill="#1d2430">{escape(lineas[0])}</text>')
        s.append(f'<text x="{x + 10}" y="{y + 32}" font-size="10.5" fill="#4a5563">{escape(lineas[1])}</text>')
    return "\n".join(s) + extra


def curva(x1, y1, x2, y2, color, dash=False, ancho=1.3):
    dx = max(40, (x2 - x1) / 2)
    d = f"M{x1:.1f},{y1:.1f} C{x1 + dx:.1f},{y1:.1f} {x2 - dx:.1f},{y2:.1f} {x2:.1f},{y2:.1f}"
    return (f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{ancho}" opacity="0.85"'
            + (' stroke-dasharray="5 4"' if dash else "") + f' marker-end="url(#f-{color[1:]})"/>')


def svg():
    W = 1400
    xa, wa = 24, 210
    xb, wb = 290, 340
    xc, wc = 720, 250
    xd, wd = 1060, 316
    top = 92
    s_cajas, s_aristas, s_marcos = [], [], []
    pos = {}

    # Columna B: fuentes por grupo
    y = top
    for clave, titulo in GRUPOS.items():
        fuentes = [f for f in FUENTES if f[3] == clave]
        alto = 26 + len(fuentes) * 48
        s_marcos.append(f'<rect x="{xb - 10}" y="{y - 6}" width="{wb + 20}" height="{alto + 4}" rx="10" fill="#f7f8fa" stroke="#d5dbe2"/>')
        s_marcos.append(f'<text x="{xb}" y="{y + 12}" font-size="11.5" font-weight="700" fill="#3d4650" letter-spacing="0.4">{escape(titulo.upper())}</text>')
        y += 26
        for fid, num, etq, _g, estado, parada, quien, _ficha, _url in fuentes:
            titulo_caja = f"{num} · {etq}" if num != "—" else etq
            etiqueta = ""
            if quien:
                tw = 46 if quien == "Codex" else 48
                tfill, tcol = ("#e2e8f0", "#334155") if quien == "Codex" else ("#efe7fb", "#5b21b6")
                etiqueta = (f'\n<rect x="{xb + wb - tw - 8}" y="{y + 7}" width="{tw}" height="16" rx="8" fill="{tfill}"/>'
                            f'<text x="{xb + wb - tw / 2 - 8}" y="{y + 19}" font-size="10" text-anchor="middle" fill="{tcol}">{quien}</text>')
            s_cajas.append(caja(xb, y, wb, 40, estado, [titulo_caja, "Hasta: " + parada], etiqueta))
            pos[fid] = (xb, y, wb, 40)
            y += 48
        y += 18
    fin_b = y

    # Columna A: reto y página
    centro = (top + fin_b) / 2
    pos["reto"] = (xa, centro - 70, wa, 44)
    pos["pagina"] = (xa, centro + 10, wa, 44)
    s_cajas.append(f'<rect x="{xa}" y="{centro - 70}" width="{wa}" height="44" rx="8" fill="#1f2a44"/>'
                   f'<text x="{xa + 10}" y="{centro - 52}" font-size="10.5" fill="#c9d3e6">RETO · NASA SPACE APPS 2026</text>'
                   f'<text x="{xa + 10}" y="{centro - 36}" font-size="12" font-weight="600" fill="#ffffff">Earth System Trend Detective</text>')
    s_cajas.append(f'<rect x="{xa}" y="{centro + 10}" width="{wa}" height="44" rx="8" fill="#33415c"/>'
                   f'<text x="{xa + 10}" y="{centro + 28}" font-size="10.5" fill="#c9d3e6">PÁGINA OFICIAL ?tab=resources</text>'
                   f'<text x="{xa + 10}" y="{centro + 44}" font-size="12" font-weight="600" fill="#ffffff">13 recursos · 12 fichas</text>')
    s_aristas.append(f'<path d="M{xa + wa / 2},{centro - 26} L{xa + wa / 2},{centro + 8}" stroke="#3d4650" '
                     f'stroke-width="1.4" marker-end="url(#f-3d4650)"/>')

    def salida(i):
        x, y0, w, h = pos[i]
        return x + w, y0 + h / 2

    def entrada(i):
        x, y0, w, h = pos[i]
        return x, y0 + h / 2

    for f in FUENTES:
        x1, y1 = salida("pagina")
        x2, y2 = entrada(f[0])
        s_aristas.append(curva(x1, y1, x2 - 2, y2, COLOR_ARISTA["lista"], ancho=1.0))

    # Columna C: archivos, accesos y decisiones
    y = top
    bloques = [
        ("ARCHIVOS DESCARGADOS · 7", [(a[0], a[1], "archivo") for a in ARCHIVOS]),
        (f"ACCESOS · {sum(a[3] == 'conseguido' for a in ACCESOS)} DE {len(ACCESOS)} CONSEGUIDO",
         [(a[0], a[1], "revisado" if a[3] == "conseguido" else "acceso") for a in ACCESOS]),
        (f"SOLICITUDES ENVIADAS · {len(SOLICITUDES)}", [(sl[0], sl[1], "solicitud") for sl in SOLICITUDES]),
        ("DECISIONES PENDIENTES", [(d[0], d[1], "decision") for d in DECISIONES]),
    ]
    marco_c = {}
    for titulo, items in bloques:
        alto = 26 + len(items) * 38
        s_marcos.append(f'<rect x="{xc - 10}" y="{y - 6}" width="{wc + 20}" height="{alto + 4}" rx="10" fill="#f7f8fa" stroke="#d5dbe2"/>')
        s_marcos.append(f'<text x="{xc}" y="{y + 12}" font-size="11.5" font-weight="700" fill="#3d4650" letter-spacing="0.4">{escape(titulo)}</text>')
        marco_c[titulo.split(" ")[0]] = (xc - 10, y - 6, wc + 20, alto + 4)
        y += 26
        for iid, etq, estilo in items:
            s_cajas.append(caja(xc, y, wc, 30, estilo, [etq]))
            pos[iid] = (xc, y, wc, 30)
            y += 38
        y += 22
    fin_c = y

    for aid, _etq, _arch, fuente in ARCHIVOS:
        x1, y1 = salida(fuente)
        x2, y2 = entrada(aid)
        s_aristas.append(curva(x1, y1, x2 - 2, y2, COLOR_ARISTA["archivo"]))
    for aid, _etq, desde, _estado in ACCESOS:
        for fuente, _rel in desde:
            x1, y1 = salida(fuente)
            x2, y2 = entrada(aid)
            s_aristas.append(curva(x1, y1, x2 - 2, y2, COLOR_ARISTA["acceso"]))
    for sid, _etq, fuente, _nota in SOLICITUDES:
        x1, y1 = salida(fuente)
        x2, y2 = entrada(sid)
        s_aristas.append(curva(x1, y1, x2 - 2, y2, COLOR_ARISTA["solicitud"], ancho=1.6))
    for did, _etq, desde in DECISIONES:
        for fuente, _rel in desde:
            x1, y1 = salida(fuente)
            x2, y2 = entrada(did)
            s_aristas.append(curva(x1, y1, x2 - 2, y2, COLOR_ARISTA["decision"], dash=True))

    # Columna D: destinos y siguiente paso
    ax, ay, aw, ah = marco_c["ARCHIVOS"]
    pos["github"] = (xd, ay + ah / 2 - 58, wd, 44)
    pos["obsidian"] = (xd, ay + ah / 2 + 10, wd, 44)
    for did, etq, detalle, _url in DESTINOS:
        x, y0, w, h = pos[did]
        s_cajas.append(caja(x, y0, w, h, "destino", [etq, detalle]))
        s_aristas.append(curva(ax + aw, ay + ah / 2, x - 2, y0 + h / 2, COLOR_ARISTA["destino"], ancho=1.6))
    cx, cy, cw, ch = marco_c["ACCESOS"]
    dx_, dy_, dw_, dh_ = marco_c["DECISIONES"]
    medio = (cy + dy_ + dh_) / 2
    pos[CASO[0]] = (xd, medio - 22, wd, 44)
    s_cajas.append(caja(xd, medio - 22, wd, 44, "decision", [CASO[1], "Primero esto; después se piden los accesos"]))
    s_aristas.append(curva(cx + cw, cy + ch / 2, xd - 2, medio, COLOR_ARISTA["decision"], dash=True, ancho=1.6))
    x1, y1 = salida("d_canada")
    s_aristas.append(curva(x1, y1, xd - 2, medio + 8, COLOR_ARISTA["decision"], dash=True))

    # Leyenda
    H = max(fin_b, fin_c) + 84
    ly = H - 62
    leyenda = []
    lx = 24
    for estilo, texto in [("revisado", "Revisado o conseguido"), ("requiere-acceso", "Revisado; requiere pedir acceso"),
                          ("bloqueado", "Bloqueado por verificación"), ("no-abierto", "No abierto (decisión pendiente)"),
                          ("archivo", "Archivo descargado"), ("solicitud", "Solicitud enviada"),
                          ("decision", "Decisión pendiente")]:
        fill, stroke, dash = ESTILO[estilo]
        leyenda.append(f'<rect x="{lx}" y="{ly}" width="18" height="12" rx="3" fill="{fill}" stroke="{stroke}"'
                       + (f' stroke-dasharray="{dash}"' if dash else "") + "/>")
        leyenda.append(f'<text x="{lx + 24}" y="{ly + 10.5}" font-size="11" fill="#3d4650">{escape(texto)}</text>')
        lx += 34 + len(texto) * 6.4
    lx, ly2 = 24, ly + 24
    leyenda.append(f'<rect x="{lx}" y="{ly2}" width="40" height="16" rx="8" fill="#e2e8f0"/><text x="{lx + 20}" y="{ly2 + 12}" font-size="10" text-anchor="middle" fill="#334155">Codex</text>')
    leyenda.append(f'<rect x="{lx + 46}" y="{ly2}" width="44" height="16" rx="8" fill="#efe7fb"/><text x="{lx + 68}" y="{ly2 + 12}" font-size="10" text-anchor="middle" fill="#5b21b6">Claude</text>')
    leyenda.append(f'<text x="{lx + 98}" y="{ly2 + 12}" font-size="11" fill="#3d4650">quién revisó la página</text>')
    leyenda.append(f'<text x="300" y="{ly2 + 12}" font-size="10.5" fill="#6b7480">Cada fuente revisada tiene su ficha en recursos/paginas/. Datos completos en CONTEXTO.json; vista con etiquetas en CONTEXTO.md; mapa de notas en INDICE.md.</text>')

    colores = sorted(set(COLOR_ARISTA.values()))
    marcas = "".join(
        f'<marker id="f-{c[1:]}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>' for c in colores)
    cabecera = (f'<text x="24" y="36" font-size="19" font-weight="700" fill="#1d2430">RAACK · contexto de la preparación de recursos</text>'
                f'<text x="24" y="60" font-size="12" fill="#4a5563">14 de noviembre de 2026 · del reto a sus 13 recursos: qué se revisó, hasta dónde, qué se descargó y qué falta pedir o decidir</text>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H:.0f}" viewBox="0 0 {W} {H:.0f}" font-family="{FUENTE}">\n'
            f'<title>RAACK · grafo de contexto</title>\n<defs>{marcas}</defs>\n'
            f'<rect width="{W}" height="{H:.0f}" fill="#ffffff"/>\n' + cabecera + "\n"
            + "\n".join(s_marcos) + "\n" + "\n".join(s_aristas) + "\n" + "\n".join(s_cajas) + "\n" + "\n".join(leyenda) + "\n</svg>\n")


# ---------- Markdown con Mermaid ----------

def mermaid():
    q = lambda t: t.replace('"', "'")
    out = ["flowchart LR",
           '  reto["Reto · Be An Earth System Trend Detective!"] --> pagina["Página oficial de recursos · 13"]']
    for clave, titulo in GRUPOS.items():
        out.append(f'  subgraph {clave}["{titulo}"]')
        for fid, num, etq, g, estado, parada, quien, _f, _u in FUENTES:
            if g == clave:
                cab = f"{num} · {etq}" if num != "—" else etq
                out.append(f'    {fid}["{q(cab)}"]')
        out.append("  end")
    for clave in GRUPOS:
        ids = [f[0] for f in FUENTES if f[3] == clave]
        out.append(f"  pagina --> {' & '.join(ids)}")
    out.append('  subgraph ARCH["Archivos descargados · 7"]')
    for aid, etq, _a, _f in ARCHIVOS:
        out.append(f'    {aid}["{q(etq)}"]')
    out.append("  end")
    out.append('  subgraph ACC["Accesos"]')
    for aid, etq, _d, _e in ACCESOS:
        out.append(f'    {aid}["{q(etq)}"]')
    out.append("  end")
    out.append('  subgraph SOL["Solicitudes enviadas"]')
    for sid, etq, _f, _n in SOLICITUDES:
        out.append(f'    {sid}["{q(etq)}"]')
    out.append("  end")
    out.append('  subgraph DEC["Decisiones pendientes"]')
    for did, etq, _d in DECISIONES:
        out.append(f'    {did}{{"{q(etq)}"}}')
    out.append(f'    {CASO[0]}{{"{q(CASO[1])}"}}')
    out.append("  end")
    for aid, _etq, _a, fuente in ARCHIVOS:
        out.append(f"  {fuente} --> {aid}")
    for aid, _etq, desde, estado in ACCESOS:
        for fuente, rel in desde:
            out.append(f"  {fuente} -->|{q(rel)}| {aid}")
        if estado != "conseguido":
            out.append(f"  {aid} -.-> {CASO[0]}")
    for sid, _etq, fuente, _nota in SOLICITUDES:
        out.append(f"  {fuente} -->|prueba| {sid}")
        out.append(f"  a_earthdata --> {sid}")
        out.append(f"  {sid} -.->|ayuda a decidir| {CASO[0]}")
    for did, _etq, desde in DECISIONES:
        for fuente, rel in desde:
            out.append(f"  {fuente} -.->|{q(rel)}| {did}")
    out.append(f"  d_canada -.-> {CASO[0]}")
    out.append('  ARCH --> github["GitHub · Javiigxs/RAACK<br/>fichas, cobertura, solicitudes, grafo, índice y archivos"]')
    out.append('  github -->|clon local| obsidian["Obsidian · bóveda RAACK<br/>se empieza por INDICE.md"]')
    porestado = {}
    for f in FUENTES:
        porestado.setdefault(f[4], []).append(f[0])
    out += [
        "  classDef revisado fill:#e7f5ec,stroke:#2e7d4f,color:#1d2430",
        "  classDef requiere fill:#fff4e5,stroke:#d9822b,color:#1d2430",
        "  classDef bloqueado fill:#fdecea,stroke:#c0392b,color:#1d2430",
        "  classDef noabierto fill:#f2f2f2,stroke:#8a8a8a,stroke-dasharray:5 4,color:#1d2430",
        "  classDef archivo fill:#e8f1fb,stroke:#2f6fb5,color:#1d2430",
        "  classDef acceso fill:#fff4e5,stroke:#d9822b,color:#1d2430",
        "  classDef decision fill:#f6e8f7,stroke:#8e44ad,color:#1d2430",
        "  classDef destino fill:#eef0f2,stroke:#3d4650,color:#1d2430",
        "  classDef solicitud fill:#e6f4f8,stroke:#1b7f99,color:#1d2430",
        "  classDef inicio fill:#1f2a44,stroke:#1f2a44,color:#ffffff",
        f"  class {','.join(porestado.get('revisado', []))} revisado",
        f"  class {','.join(porestado.get('requiere-acceso', []))} requiere",
        f"  class {','.join(porestado.get('bloqueado', []))} bloqueado",
        f"  class {','.join(porestado.get('no-abierto', []))} noabierto",
        f"  class {','.join(a[0] for a in ARCHIVOS)} archivo",
        f"  class {','.join(a[0] for a in ACCESOS if a[3] != 'conseguido')} acceso",
        f"  class {','.join(a[0] for a in ACCESOS if a[3] == 'conseguido')} revisado",
        f"  class {','.join(sl[0] for sl in SOLICITUDES)} solicitud",
        f"  class {','.join([d[0] for d in DECISIONES] + [CASO[0]])} decision",
        "  class github,obsidian destino",
        "  class reto,pagina inicio",
    ]
    return "\n".join(out)


def markdown():
    filas = []
    for fid, num, etq, g, estado, parada, quien, ficha, _u in FUENTES:
        enlace = f"[{etq}](../recursos/paginas/{ficha})" if ficha else etq
        filas.append(f"| {num} | {enlace} | {GRUPOS[g]} | {parada} | {quien or '—'} |")
    return f"""---
tags: [raack, contexto, grafo]
fecha: {FECHA}
---
# Grafo de contexto de la preparación

[Índice](../INDICE.md) · [Cobertura de los 13 recursos](../recursos/COBERTURA.md) · [Bases de datos que hay que pedir](SOLICITUDES_DE_DATOS.md) · [Datos del grafo en JSON](CONTEXTO.json)

El grafo resume el trabajo hecho para el reto. Parte de la página oficial y sus 13 recursos y muestra, para cada uno, hasta dónde se llegó, qué archivos se descargaron, qué acceso hay que pedir y qué decisiones siguen pendientes. Los colores indican el estado y la etiqueta, quién revisó cada página.

![Grafo de contexto de RAACK](CONTEXTO.svg)

## Versión con etiquetas

GitHub y Obsidian dibujan este diagrama Mermaid. Las flechas continuas van a lo que se obtuvo o hay que pedir; las punteadas, a decisiones pendientes. El punto de parada de cada recurso está en la tabla siguiente.

```mermaid
{mermaid()}
```

## Punto de parada por recurso

| # | Recurso | Bloque oficial | Hasta dónde se llegó | Revisó |
|---|---|---|---|---|
{chr(10).join(filas)}

## Cronología del 14 de noviembre de 2026

1. **Codex (GPT):**
   - Revisó los recursos en Chrome, descargó 7 archivos y creó la bóveda de Obsidian.
   - Dejó Giovanni excluido y pendiente de decisión del equipo.
2. **Codex:** publicó en RAACK los 7 archivos, las notas y el catálogo (commit `d24ff79`).
3. **Codex:** empezó una ficha por página. Escribió las fichas 01 a 07 y la 12, pero se quedó sin uso antes de publicarlas.
4. **Claude (cuenta 2):** tomó el relevo de esas tareas.
   - Comprobó la lista oficial: 13 recursos.
   - Revisó en Chrome RCM, GEO.ca, SWOT y la página de ecosistemas.
   - Escribió las fichas 08 a 11, la cobertura, la nota de solicitudes de datos y este grafo, y lo publicó todo.
5. **La persona** creó la cuenta NASA Earthdata del equipo. Con ella, **Claude** envió una [solicitud de prueba de AppEEARS en Monterrey](SOLICITUD_APPEEARS_MONTERREY.md): NDVI y temperatura superficial de 2001 a 2025. Está en cola.
6. **Claude** dejó el repo listo como bóveda de Obsidian tipo wiki:
   - Un [índice para personas e IAs](../INDICE.md).
   - Reglas para agentes en `AGENTS.md`.
   - Enlaces relativos que funcionan en GitHub y en Obsidian.

## Cómo actualizarlo

`CONTEXTO.json`, `CONTEXTO.svg` y esta nota se generan con [generar_contexto.py](generar_contexto.py) a partir de los mismos datos: tipo, estado, punto de parada, quién lo revisó y enlaces. Si cambia algo, por ejemplo al conseguir un acceso o enviar una solicitud, edita las listas del principio del script y ejecuta `python3 docs/generar_contexto.py docs` desde la raíz del repo.
"""


def main():
    destino = Path(sys.argv[1])
    (destino / "CONTEXTO.json").write_text(json.dumps(datos(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (destino / "CONTEXTO.svg").write_text(svg(), encoding="utf-8")
    (destino / "CONTEXTO.md").write_text(markdown(), encoding="utf-8")


if __name__ == "__main__":
    main()
