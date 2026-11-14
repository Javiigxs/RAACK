---
id: rcm
revision: 2026-11-14
estado: catalogo-carpeta-publica-y-stac-revisados-sin-descargas
---
# 08 · RADARSAT Constellation Mission (RCM) · Data · CSA

[Catálogo](../README.md) · [Cobertura de las 13 páginas](../COBERTURA.md) · [Fuente principal](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm)

**Revisión:** 14 de noviembre de 2026 en Chrome. **Alcance alcanzado:** ficha del portal de datos abiertos de la CSA y su registro JSON, carpeta pública de muestras (solo listados), CSV de adquisiciones leído en el navegador, tutorial EO de la CSA, portada de EODMS y su catálogo STAC hasta los metadatos de una escena RCM ARD. No se descargó ninguna imagen, no se abrió una cuenta y no se leyó la licencia de usuario.

## Información que ofrece

RCM son tres satélites de radar de apertura sintética (SAR) en banda C que observan de día y de noche y con cualquier tiempo. Según la ficha, la configuración permite revisitar Canadá a diario, acceder cada día al 90 % de la superficie terrestre y al Ártico hasta cuatro veces al día. Sus tres áreas de uso son vigilancia marítima, gestión de desastres y seguimiento de ecosistemas: agricultura, humedales, bosques y costas. [Ficha RCM](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm).

La ficha advierte que solo **algunos** productos RCM son libres para usuarios fuera del Gobierno de Canadá, con excepciones de seguridad y privacidad. El acceso es por **EODMS**, el sistema de Recursos Naturales de Canadá. Cada producto tiene su propia licencia de usuario y descargarlo implica aceptarla. La licencia *Open Government Licence – Canada* que figura en el registro corresponde a la ficha del catálogo, no sustituye la licencia de cada imagen.

| Recurso del registro | Destino | Qué es |
|---|---|---|
| DATA Archive (EODMS) | [eodms-sgdot.nrcan-rncan.gc.ca](https://www.eodms-sgdot.nrcan-rncan.gc.ca/index_en.jsp) | Buscador y descarga oficial |
| Data | [Carpeta pública RCM](https://donnees-data.asc-csa.gc.ca/users/OpenData_DonneesOuvertes/pub/RCM/) | Escenas de muestra y paquetes de la Carta Internacional |
| EO Visualization and Search Tutorial | [GitHub asc-csa](https://github.com/asc-csa/EO-Visualization-and-Search-Tutorial) | Notebook para buscar y ver imágenes RADARSAT-1 y RCM |
| SAR Data Tutorial | [GitHub asc-csa](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial) | El mismo tutorial de la [ficha 12](12-sar.md) |

## Qué hay en la carpeta pública

Cada subcarpeta guarda **una escena o pocas escenas de una fecha**, con modos de haz y polarizaciones distintos. Sirven para conocer el formato, no forman una serie temporal.

| Carpeta | Fecha de adquisición (según el nombre) | Producto | Polarización |
|---|---|---|---|
| Antarctica | 2020-01-24 | GRD, SLC y MLC | CH CV (compacta) |
| Canadian Arctic | 2019-11-05 y 2020-01-13 | GRD | HH HV |
| East of Newfoundland | 2020-02-20 | GRD | HH |
| Fort McMurray | 2020-04-28 | GRD | HH HV |
| Lake Superior | 2020-02-14 | GRD | HH HV |
| Montreal | 2019-10-24 y 2019-10-28 | SLC | HH HV |
| Nairobi | 2020-02-15 | GRD | CH CV |
| Quebec City | 2019-12-29 | SLC | HH VV HV VH |
| Vancouver | 2020-01-27 | GRD | HH HV |
| Winnipeg | 2020-02-19 | SLC, GCC, GRC y GCD | CH CV |

La carpeta `RCM/` contiene cinco carpetas de cuatro activaciones de la **Carta Internacional sobre el Espacio y los Grandes Desastres** (758, 763, 766 y 769), además de un CSV en inglés y otro en francés. El CSV lista 21 adquisiciones del 8 de julio al 17 de agosto de 2020: deslizamientos en Japón (4), deslizamientos e inundación en Indonesia (3 y 2), inundación en India (9) e inundación en Sudán (3). Los cuatro paquetes de la activación 758 son ZIP de unos 370 MB cada uno.

Ejemplo de estructura, escena de Lake Superior: `imagery/` con dos GeoTIFF de unos 659 MB (HH y HV), `metadata/product.xml` (1,3 MB) con calibración, `preview/` con vista previa PNG, TIFF y KML, `support/`, `manifest.safe` y `license.pdf` (112 kB).

## EODMS y su catálogo STAC

La portada de EODMS es un mapa con buscador. Su menú indica **«Register (Required to Download)»** e inicio de sesión. También enlaza RADARSAT Analysis Ready Data (CEOS), un espejo de Sentinel, un sitio nuevo que reemplazará al actual el 31 de marzo de 2027, la herramienta `eodms-cli`, cuadernos RADARSAT, RCM Vetted Access y documentación de SAR Toolbox.

El enlace de datos ARD abre un navegador STAC sobre el API oficial `https://eodms-sgdot.nrcan-rncan.gc.ca/search`, que publica su definición OpenAPI. Ese catálogo tenía 13 colecciones, entre ellas:

| Colección | Lo que declara | Licencia declarada |
|---|---|---|
| `rcm-ard` · RCM CEOS-ARD | Datos listos para análisis según el estándar CEOS; intervalo declarado desde 2019-06-12 | `proprietary` |
| `RCMImageProducts` | El acceso público se limita a productos **GRD y GCD sobre tierra canadiense con resolución de 16 m o más gruesa**; desde 2019-06-29 | `various` |
| `r1-ard` · RADARSAT-1 CEOS-ARD | Vista preprocesada de Canadá, 1995–2013 | — |

El primer ítem que devolvió `rcm-ard` (27 de febrero de 2025) trae capas COG de retrodispersión `rl`, `rr` y `rrrl`, máscara de datos, ángulo de incidencia local, área de contribución local, razón gamma/sigma, miniaturas, metadatos XML y un PDF `eula_license`. Los archivos están alojados en Amazon S3, región ca-central-1. GEO.ca describe esta colección como una cobertura de Canadá a 30 m en polarización compacta **cada 12 días**; ver [ficha 09](09-geo.md). No se comprobó si la descarga de esas capas exige registro.

## Tutorial de búsqueda EO

El [tutorial](https://github.com/asc-csa/EO-Visualization-and-Search-Tutorial) tiene un notebook en inglés y otro en francés. Usa el API REST de EODMS con `eodms_rapi`, widgets, `ipyleaflet` y `pandas` para filtrar RADARSAT-1 y RCM por zona y fechas, revisar metadatos y ver las huellas en un mapa. El notebook en inglés tiene 50 celdas, 24 de ellas de código. Pide Python 3.11 o posterior e indica que la cuenta EODMS es opcional para algunos datos. Licencia MIT modificada; último commit visible del 23 de enero de 2026. No se ejecutó.

## Utilidad posible para RAACK

Solo encaja si **la región de estudio está en Canadá** y la variable es radar: agua e inundación, humedales, cultivos o hielo, con la ventaja de ver a través de nubes. La vía razonable para una serie sería `rcm-ard`, con fechas repetidas cada 12 días desde 2019, siempre con el mismo modo, la misma polarización y un tratamiento del ángulo de incidencia y del moteado. Las muestras abiertas son de una sola fecha y no sirven para medir una tendencia. Con unos siete años de datos, una tendencia de largo plazo tendría poca potencia estadística.

## Recorrido comprobado de esta revisión

1. Ficha RCM del portal de datos abiertos de la CSA y su JSON del API CKAN: recursos, licencia del registro y fechas.
2. Carpeta `Data`: listados de las 11 subcarpetas, de la estructura de una escena y de los paquetes de la Carta. Solo listados.
3. CSV de adquisiciones de la Carta leído en el navegador para contar filas, fechas y activaciones. No se guardó.
4. README del tutorial EO, lista de archivos y estructura del notebook en inglés, leída como JSON sin ejecutarla.
5. Portada de EODMS y enlace RADARSAT Analysis Ready Data: navegador STAC, lista de colecciones y metadatos de `rcm-ard` y `RCMImageProducts`.

## Material guardado y límites

- **Descargas:** ninguna. Las escenas pesan cientos de MB y requieren aceptar su licencia.
- **No leído:** `license.pdf` de la carpeta pública, la EULA de ARD, las preguntas frecuentes, el wiki y RCM Vetted Access.
- **No realizado:** registro o inicio de sesión en EODMS, búsqueda sobre una región del equipo, ejecución de notebooks.

## Qué falta y por qué

1. Decidir si la región de RAACK está en Canadá. Si no lo está, RCM queda fuera del caso de demostración.
2. Si se usa, una persona del equipo debe registrarse en EODMS y revisar la licencia; ver [Solicitudes de datos](../../docs/SOLICITUDES_DE_DATOS.md).
3. Buscar en `rcm-ard` cuántas fechas comparables hay sobre la región y el periodo.
4. Definir el preprocesado: modo, polarización, ángulo de incidencia y moteado, antes de estimar una pendiente.

**Punto de parada exacto:** metadatos del primer ítem de `rcm-ard` en el catálogo STAC de EODMS. No se siguió hacia el registro, la licencia ni la descarga de capas.
