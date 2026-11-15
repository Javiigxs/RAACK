# JPL GRACE and GRACE-FO water storage data for Nuevo León

This package preserves the complete, unmodified JPL mascon source as six byte parts and provides an unaveraged rectangular extraction. Download and verification were completed on 14 November 2026. The source data were obtained through the team's human-authenticated Earthdata session.

## Source and integrity

- Product: `TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4`, JPL RL06.3Mv04, with the Coastline Resolution Improvement (CRI) filter.
- [Official product page](https://podaac.jpl.nasa.gov/dataset/TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4).
- [Exact source netCDF](https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4/GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc).
- Original filename: `GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc`.
- Size: **46,365,171 bytes**.
- SHA-256: `3522dd579cc10326339efdecece550ba01f41b9bee599d0ed915fc35f9eafb64`.
- MD5: `1567b9401ec2a704aab16598fcce5e70`, matching the [provider's saved checksum](GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.md5).

To keep browser uploads small, the original is split consecutively into [part 1](GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part001), [part 2](GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part002), [part 3](GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part003), [part 4](GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part004), [part 5](GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part005), [part 6](GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part006), without compression or alteration. Part sizes and hashes are recorded in [provenance](provenance.json). Each part is at most 8 MiB. The larger combined upload was rejected in this session; upload small batches, for example two parts per commit. These parts require reassembly; individual parts are not valid netCDF files.

From this directory, use Python's standard library to reconstruct and verify the complete source:

```bash
python3 reconstruir_grace.py
```

The default output is the original filename under the current user's `Downloads` directory, outside the repository. An explicit output path may be supplied as the sole argument. The [reassembly script](reconstruir_grace.py) checks every part and the final SHA-256 and MD5. It refuses to overwrite a different existing file; an existing matching source is verified and retained.

## Rectangular extraction

The [subset netCDF](nuevo-leon-grace-jpl-rl06.3-v04-2002-2026-09.nc) contains all 12 original variables and all time, latitude, and longitude bounds. It selects grid centers inside 23.1–27.8° N and −101.2 to −98.4° E: **10 latitudes × 5 longitudes × 261 original time steps**. Selected centers span 23.25–27.75° N and −100.75 to −98.75° E. It retains the source's 0–360° longitude convention and all stored scientific values, including fill values. The global spatial range attributes are updated to the selected centers; source provenance and transformation notes are added. There is no spatial averaging, interpolation, regridding, or application of `scale_factor`.

The [long CSV](nuevo-leon-grace-jpl-rl06.3-v04-2002-2026-09.csv) has **13,050 records**. It provides the original representative time in UTC, its exact numeric value in days since 1 January 2002, calendar month, latitude, longitude converted to −180–180°, `lwe_thickness_cm`, `uncertainty_cm`, the unapplied `scale_factor`, and `mascon_ID`. Missing scientific values, if present, are written as empty fields. It preserves the original timestamps rather than inventing first-of-month observations.

To reproduce both files in a new output directory, use the [extraction script](extraer_grace.py) with Python packages `netCDF4` and `numpy`:

```bash
python3 extraer_grace.py /path/to/GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc --output-dir /path/to/new-output
```

The script verifies the source SHA-256 and refuses to overwrite existing extraction outputs. Verification compared every subset variable with the corresponding source slice and every CSV scientific value with the source. Reassembly was also checked against the source SHA-256 and official MD5.

## Interpretation limits

The 261 solutions cover April 2002–September 2026. Months missing from the original product, including the interruption between missions, remain absent; no gaps are filled. The original `months_missing` attribute and time bounds are retained.

`lwe_thickness` is a liquid-water-equivalent thickness anomaly in **centimeters**, relative to the **2004–2009** mean. It represents changes in total water storage; it does not isolate groundwater or measure absolute reservoir volumes. The supplied `uncertainty` is a **one-sigma uncertainty for the approximately 3° mascon estimate**, not a separate uncertainty for each 0.5° display cell. The product is published on a **0.5° grid**, while its native resolution is approximately **3° equal-area mascons**. Neighboring grid cells are not independent observations. Scale factors are included for later scientific decisions and have not been applied. The rectangle includes territory outside Nuevo León and is not an administrative-state or basin average.

Consult the preserved [release notes](GRACE_GRACE-FO_ReleaseNotes_JPL_MASCON.txt), source metadata, and product references before analysis. No trend, significance, or causal conclusion is calculated here.

## Provenance and AI use

NASA/JPL supplied the scientific data. Codex assisted with packaging, verification, extraction code, and documentation. Scientific values were copied from the original netCDF and were not generated by AI. [Provenance](provenance.json) records the exact source, checksums, transformation, and output hashes. These files are acquisition artifacts and do not select the team's final project idea.
