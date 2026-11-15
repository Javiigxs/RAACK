"""Extract exact CHIRPS v2 native pixels from official COG HTTP byte ranges.

Prepared by Codex (AI) for RAACK. No interpolation, averaging, reprojection,
unit conversion, or gap filling. Each fifth native cell follows the NOAA
ERDDAP subset in the supplied requirements. Only 2025 missing months are added.
"""
from pathlib import Path
from urllib.request import Request,urlopen
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor
import csv,json,hashlib,math
import numpy as np
import rasterio,tifffile

ROOT=Path(__file__).resolve().parents[4]
OUT=ROOT/'recursos/archivos/nuevo-leon/chirps'
ORIGINAL=OUT/'nuevo-leon-chirps-mensual-1998-2025-02-paso5.csv'
with ORIGINAL.open() as f:
    reader=csv.reader(f); HEADER=next(reader); UNITS=next(reader); ROWS=list(reader)
LATS=sorted({float(r[1]) for r in ROWS})
LONS=sorted({float(r[2]) for r in ROWS})
assert len(LATS)==19 and len(LONS)==12


def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def get_range(url,a,b):
    for attempt in range(3):
        try:
            with urlopen(Request(url,headers={'Range':f'bytes={a}-{b}'}),timeout=40) as r:
                data=r.read(); headers=dict(r.headers)
                assert r.status==206 and len(data)==b-a+1,(r.status,len(data),a,b)
                return data,headers
        except Exception:
            if attempt==2:raise


def extract(month):
    url=f'https://data.chc.ucsb.edu/products/CHIRPS/v2.0/global_monthly/cogs/chirps-v2.0.2025.{month:02d}.cog'
    header,headers=get_range(url,0,65535)
    total=int(headers['Content-Range'].split('/')[-1])
    with tifffile.TiffFile(BytesIO(header)) as f:
        page=f.pages[0]
        assert page.shape==(2000,7200) and page.dtype==np.dtype('float32')
        tags=page.geotiff_tags
        sx,sy,_=tags['ModelPixelScale']; tie=tags['ModelTiepoint']
        x0,y0=tie[3:5]
        cols=[round((v-x0)/sx-.5) for v in LONS]
        rows=[round((y0-v)/sy-.5) for v in LATS]
        assert max(abs((x0+(c+.5)*sx)-v) for c,v in zip(cols,LONS))<1e-4
        assert max(abs((y0-(r+.5)*sy)-v) for r,v in zip(rows,LATS))<1e-4
        ncols=(page.imagewidth+page.tilewidth-1)//page.tilewidth
        indices=sorted({(r//page.tilelength)*ncols+c//page.tilewidth for r in rows for c in cols})
        ranges=[(page.dataoffsets[i],page.databytecounts[i]) for i in indices]
    buffer=bytearray(total);buffer[:len(header)]=header
    evidence=[{'inicio':0,'fin':65535,'sha256':hashlib.sha256(header).hexdigest()}]
    for offset,count in ranges:
        fragment,_=get_range(url,offset,offset+count-1)
        buffer[offset:offset+count]=fragment
        evidence.append({'inicio':offset,'fin':offset+count-1,'sha256':hashlib.sha256(fragment).hexdigest()})
    with rasterio.MemoryFile(bytes(buffer)) as mem:
        with mem.open() as ds:
            rmin,rmax=min(rows),max(rows);cmin,cmax=min(cols),max(cols)
            window=rasterio.windows.Window(cmin,rmin,cmax-cmin+1,rmax-rmin+1)
            values=ds.read(1,window=window)
            transform=ds.window_transform(window)
            profile=ds.profile
            profile.update(driver='GTiff',width=values.shape[1],height=values.shape[0],transform=transform,compress='deflate',tiled=False)
            profile.pop('blockxsize',None);profile.pop('blockysize',None);profile.pop('interleave',None)
            clipped=OUT/f'chirps-v2.0.2025.{month:02d}.nuevo-leon-ventana.tif'
            if month>=3:
                with rasterio.open(clipped,'w',**profile) as out:
                    out.write(values,1)
                    out.update_tags(source_url=url,processing='Exact native grid window; no resampling. Prepared with Codex AI assistance.')
    csvrows=[]
    for lat,row in zip(LATS,rows):
        for lon,col in zip(LONS,cols):
            value=float(values[row-rmin,col-cmin])
            assert math.isfinite(value) and value>=0,(month,lat,lon,value)
            csvrows.append([f'2025-{month:02d}-01T00:00:00Z',str(lat),str(lon),format(value,'.9g')])
    metadata={'mes':f'2025-{month:02d}','fuente':url,'etag':headers.get('ETag'),'bytes_original_remoto':total,'sha256_original_completo':None,'nota_hash':'El COG completo no se descargó; los rangos recuperados tienen sus propias sumas.','rangos_http':evidence,'filas_nativas':[rmin,rmax],'columnas_nativas':[cmin,cmax],'paso_muestra':5,'resolucion_nativa_grados':0.05,'interpolacion':False}
    if month>=3:metadata.update(archivo=str(clipped.relative_to(ROOT)),bytes=clipped.stat().st_size,sha256=digest(clipped),transformacion='Ventana nativa rectangular, sin interpolación, reproyección ni cambios de valores; GeoTIFF local comprimido sin pérdida.')
    return month,csvrows,metadata

# Validate overlap against a month present in NOAA before adding producer data.
_,overlap,meta=extract(2)
previous={(r[1],r[2]):float(r[3]) for r in ROWS if r[0].startswith('2025-02')}
max_error=max(abs(previous[(r[1],r[2])]-float(r[3])) for r in overlap)
assert max_error<1e-4,max_error
print('Overlap February2025 max rounding difference:',max_error,flush=True)
results=list(ThreadPoolExecutor(max_workers=3).map(extract,range(3,13)))
results.sort()
supplement=[r for _,rows,_ in results for r in rows]
for filename,rows in [('nuevo-leon-chirps-mensual-2025-03-12-paso5-complemento.csv',supplement),('nuevo-leon-chirps-mensual-1998-2025-paso5-combinado.csv',ROWS+supplement)]:
    p=OUT/filename
    with p.open('w',newline='') as f:
        writer=csv.writer(f,lineterminator='\n');writer.writerow(HEADER);writer.writerow(UNITS);writer.writerows(rows)
    print(filename,len(rows),p.stat().st_size,digest(p),flush=True)
evidence={'producto':'CHIRPS v2.0 monthly','fuente_primaria':'https://data.chc.ucsb.edu/products/CHIRPS/v2.0/global_monthly/cogs/','metodo':'Lectura HTTPS Range de cabecera y mosaicos nativos necesarios. Recorte exacto GeoTIFF sin interpolación. Selección de los mismos19x12centros de celda del ERDDAP de NOAA, paso5 (0.25° de espaciado) de una malla nativa0.05°. Unión temporal de NOAA enero1998–febrero2025 y UCSB marzo–diciembre2025; no se rellenan huecos ni se agregan celdas.','solapamiento_validado':{'mes':'2025-02','celdas':228,'diferencia_maxima_redondeo_mm':max_error,'rangos':meta},'archivos_cog_derivados':[m for _,_,m in results],'uso_ia':'Código y organización asistidos por Codex; valores científicos originales del productor CHIRPS.','limite_espacial':'Recuadro; incluye partes fuera de Nuevo León. No es promedio ni máscara del estado.'}
(OUT/'procedencia-complemento-chirps-2025.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
