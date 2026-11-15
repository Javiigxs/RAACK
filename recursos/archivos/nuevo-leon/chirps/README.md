# CHIRPS v2 monthly rainfall for the Nuevo León bounding box

Data obtained on 14 November 2026. Scientific values come from CHIRPS v2 (UCSB Climate Hazards Center), distributed through NOAA ERDDAP and the current UCSB repository. Codex (AI) prepared the retrieval, validation and exact pixel extraction; it did not generate rainfall values.

- `nuevo-leon-chirps-mensual-1998-2025-02-paso5.csv` is the unchanged NOAA ERDDAP CSV, January 1998–February 2025. The link supplied in the requirements fails because December 2025 exceeds this server's available time axis.
- `nuevo-leon-chirps-mensual-2025-03-12-paso5-complemento.csv` adds March–December 2025 from the producer's monthly Cloud Optimized GeoTIFFs.
- `nuevo-leon-chirps-mensual-1998-2025-paso5-combinado.csv` combines these sources into 336 months, with 228 cells per month (76,608 records). Values use the original units, mm/month. No missing values were filled.
- The ten `*.nuevo-leon-ventana.tif` files are lossless native raster windows from the monthly producer COGs. No interpolation, reprojection, averaging or change in pixel values was applied. Their geometry and HTTP-range provenance are in `procedencia-complemento-chirps-2025.json`.

The native grid is 0.05°. The requirements use stride 5: one of every five cells is selected along each axis, giving 0.25° sample spacing, **not an average over five cells**. The 19 latitude values run from 23.125 to 27.625°N, and the 12 longitude values from -101.175 to -98.425°E. These are the same cell centers chosen by NOAA ERDDAP for the requested bounds and stride.

This rectangular sample includes locations outside Nuevo León and is not a state boundary mask or a state mean. The point values should not be interpreted as a regional aggregate.

February 2025 was independently extracted from the UCSB producer COG and compared against all 228 corresponding NOAA values. The maximum difference was below 0.000001 mm, consistent with decimal serialization of the same float32 values. The full original COGs were not downloaded; only the header and compressed native tiles required for the window were read using HTTP byte ranges. The provenance file records source URLs, source ETags, source sizes and SHA-256 for each retrieved range; it does not claim complete-file hashes for the remote COGs.

To reproduce the complement and combined CSV from this directory, install the packages in `requirements.txt` in an isolated environment and run `python extraer_complemento_chirps.py`. The original NOAA CSV must remain alongside the script. The script fetches official producer byte ranges and recreates the local native windows.

Producer: https://www.chc.ucsb.edu/data/chirps
Current producer files: https://data.chc.ucsb.edu/products/CHIRPS/v2.0/global_monthly/cogs/
NOAA metadata: https://coastwatch.pfeg.noaa.gov/erddap/griddap/chirps20GlobalMonthlyP05.html
