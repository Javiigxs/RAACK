# IMERG monthly rainfall for the Nuevo León bounding box

Downloaded on 14 November 2026 from the USF IMaRS ERDDAP distributor of NASA GPM IMERG monthly accumulated precipitation. The CSV preserves the response bytes, with units and coordinates in the first two rows. The accompanying DAS preserves the provider metadata.

The file contains January 1998–September 2025: 333 months × 48 latitude values × 28 longitude values = 447,552 records. No missing precipitation values were found in this extraction. Units are mm accumulated per month; native grid spacing is 0.1°. Cell-center bounds returned by the service are 23.15–27.849998°N and -101.15–-98.45°E.

**This is a partial fulfillment of the requested 1998–2025 period:** October–December 2025 are not provided by this server. The original December 2025 URL returns HTTP 404 with an explicit time-axis limit. No other rainfall product or interpolated months were substituted.

The rectangular window includes areas outside Nuevo León. It is not a state boundary mask or a state-mean time series.

Scientific values are from NASA GPM IMERG, processed by the USF IMaRS distributor. Codex (AI) assisted with downloading, integrity checks, inventory and this documentation; it did not generate scientific values.

Metadata: https://erddap.marine.usf.edu/erddap/griddap/IMERG_monthly_global_precip.html

## Update checked on 14 November 2026

NASA ended the IMERG Final V07 record in September 2025 while preparing V08 of the algorithm and its input products. The [NASA notice of 28 April 2026](https://gpm.nasa.gov/data/news/imerg-v08-transition-schedule) explains the risk of discontinuities from continuing V07 with V08 inputs. Its [update of 6 August 2026](https://gpm.nasa.gov/data/news/update-imerg-v08-transition-schedule-aug-2026) postponed the expected Final V08 release to fall 2026; that was a projection, not confirmation of release.

The CMR collection search performed on 14 November 2026 returned one monthly collection, `C2723754851-GES_DISC`, version `07`, ending on 30 September 2025. The October–December 2025 granule query returned zero results. Thus the three requested months cannot currently be supplied as the same Final V07 product. Early and Late Runs are different products; combining them or appending V08 would need a separate documented scientific choice.

The original responses are preserved as [collection metadata](imerg-v07-colecciones-cmr-2026-11-14.json), [the empty granule query](imerg-v07-oct-dic2025-granulos-cmr.json), [the April NASA notice](nasa-imerg-v08-transition-schedule-2026-04-28.html), and [the August NASA update](nasa-imerg-v08-transition-update-2026-08-06.html). Exact query URLs, byte sizes, hashes and the local check time are recorded in [verification provenance](procedencia-verificacion-imerg-2026-11-14.json).

The existing CSV was checked again: 333 months, 1,344 records per month, 48 latitudes, 28 longitudes and no missing precipitation values. Its bytes were preserved. Codex (AI) performed these checks and prepared this update; no scientific values were generated or filled.
