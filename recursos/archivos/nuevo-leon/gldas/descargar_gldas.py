#!/usr/bin/env python3
"""Download the seven requested GLDAS 3H variables and aggregate UTC months.

Written by Codex on 2026-11-14. Scientific values come from NASA, not AI.
Uses only the public anonymous service documented by the Hydrology viewer's
@nasa-terra/components 0.0.205 code. Stops on HTTP errors, including quota 429.
Existing valid files are reused, so reruns do not spend quota unnecessarily.
"""
import calendar
import csv
import hashlib
import io
import json
import math
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
import subprocess
from urllib.parse import urlencode

HERE = Path(__file__).resolve().parent
START = "2001-03-01T00:00:00"
END = "2026-07-31T21:00:00"
VARIABLES = ["Rainf_tavg", "Evap_tavg", "PotEvap_tavg", "RootMoist_inst",
             "Qs_acc", "Qsb_acc", "Tair_f_inst"]
POINTS = {"monterrey": (25.67, -100.31), "galeana": (24.83, -100.08)}
UNITS = {"Rainf_tavg": "kg m-2 s-1", "Evap_tavg": "kg m-2 s-1",
         "PotEvap_tavg": "W m-2", "RootMoist_inst": "kg m-2",
         "Qs_acc": "kg m-2", "Qsb_acc": "kg m-2", "Tair_f_inst": "K"}
LINK_PROXY = "https://lpo4uv7f0h.execute-api.us-east-1.amazonaws.com/default/harmony-link-proxy"


def fetch(url, dest):
    tmp = dest.with_suffix(dest.suffix + ".part")
    result = subprocess.run(["curl", "--silent", "--show-error", "--max-time", "600",
                             "--output", str(tmp), "--write-out", "%{http_code}", url],
                            check=True, capture_output=True, text=True)
    if result.stdout != "200":
        body = tmp.read_text(errors="replace")[:600]
        tmp.unlink(missing_ok=True)
        raise RuntimeError(f"HTTP {result.stdout}; stopped without retry: {body}")
    if not tmp.read_text().startswith("prod_name,"):
        body = tmp.read_text()[:600]
        tmp.unlink(missing_ok=True)
        raise RuntimeError(f"Service did not return GLDAS CSV: {body}")
    tmp.replace(dest)


def parse(path):
    lines = path.read_text().splitlines()
    split = lines.index("Timestamp (UTC),Data")
    metadata = {}
    for row in csv.reader(lines[:split]):
        if len(row) >= 2:
            metadata[row[0]] = ",".join(row[1:])
    data = list(csv.DictReader(lines[split:]))
    return metadata, data


def main():
    catalog_query = "(" + " OR ".join(f'dataFieldId:"GLDAS_NOAH025_3H_2_1_{v}"' for v in VARIABLES) + ") AND dataFieldActive:true"
    catalog_url = ("https://sjldutoe6c.execute-api.us-east-1.amazonaws.com/default/harmony-proxy/giovanni.gsfc.nasa.gov/giovanni/daac-bin/catalogServices.pl?" +
                   urlencode({"version": "2.2", "wt": "json", "rows": "7", "q": catalog_query}))
    provenance = {"retrieval_started_utc": datetime.now(timezone.utc).isoformat(),
                  "product": "GLDAS_NOAH025_3H_2.1", "doi": "10.5067/E7TYRXPJKWOQ",
                  "start_utc": START + "Z", "end_utc": END + "Z",
                  "requested_points": POINTS,
                  "point_selection": "Monterrey from team document; Galeana is a second exploratory extraction point in southern Nuevo Leon, not a regional mean or a chosen project solution.",
                  "access": "Public Hydrology Time Series anonymous harmony-link-proxy; restricted Giovanni use authorized by the team for these seven downloads.",
                  "endpoint_evidence": "https://cdn.jsdelivr.net/npm/@nasa-terra/components@0.0.205/cdn/chunks/chunk.AUWT3HKD.js",
                  "metadata_sources": {
                      "gldas-siete-variables-catalogo.json": catalog_url,
                      "gldas-capacidades-harmony.json": "https://sjldutoe6c.execute-api.us-east-1.amazonaws.com/default/harmony-proxy/capabilities?collectionId=C1342986035-GES_DISC&version=3"},
                  "files": []}
    monthly = []
    for name, (lat, lon) in POINTS.items():
        for variable in VARIABLES:
            target = HERE / f"{name}-{variable}-3h-2001-03-2026-07.csv"
            query = urlencode({"data": f"GLDAS_NOAH025_3H_2_1_{variable}",
                               "location": json.dumps([lat, lon], separators=(",", ":")),
                               "time": f"{START}/{END}"})
            data_url = "https://api.giovanni.earthdata.nasa.gov/timeseries?" + query
            url = LINK_PROXY + "?" + urlencode({"url": data_url})
            if not target.exists():
                print(f"Downloading {name} {variable}", flush=True)
                fetch(url, target)
            meta, data = parse(target)
            assert meta["param_short_name"] == variable
            assert meta["prod_name"] == "GLDAS_NOAH025_3H.2.1"
            undef = float(meta["undef"])
            buckets = defaultdict(list)
            times = []
            for row in data:
                stamp = datetime.strptime(row["Timestamp (UTC)"], "%Y-%m-%d %H:%M")
                times.append(stamp)
                value = float(row["Data"])
                # GLDAS README, section 3.3: tavg/acc describe the preceding
                # three hours. Midnight on day 1 closes the prior month's
                # final interval. Shift only for grouping; preserve raw times.
                grouping_stamp = stamp-timedelta(microseconds=1) if variable.endswith(("_tavg", "_acc")) else stamp
                if grouping_stamp >= datetime.fromisoformat(START):
                    buckets[grouping_stamp.strftime("%Y-%m")].append(value if value != undef and math.isfinite(value) else None)
            assert len(times) == len(set(times)), f"Duplicate timestamps: {target}"
            assert times == sorted(times), f"Unordered timestamps: {target}"
            assert all((b-a).total_seconds() == 10800 for a,b in zip(times,times[1:])), f"Time gaps: {target}"
            expected_total = int((datetime.fromisoformat(END)-datetime.fromisoformat(START)).total_seconds()/10800)+1
            assert len(times) == expected_total, (target, len(times), expected_total)
            assert len(buckets) == 305, (target, len(buckets))
            for month, values in sorted(buckets.items()):
                year, mn = map(int, month.split("-"))
                expected = calendar.monthrange(year,mn)[1] * 8
                valid = [v for v in values if v is not None]
                mean = math.fsum(valid)/len(valid) if valid else None
                complete = len(valid) == expected
                total = None
                total_unit = ""
                if variable in ("Rainf_tavg", "Evap_tavg"):
                    total = math.fsum(valid)*10800 if complete else None
                    total_unit = "mm"
                elif variable in ("Qs_acc", "Qsb_acc"):
                    total = math.fsum(valid) if complete else None
                    total_unit = "mm"
                monthly.append([name, lat, lon, meta["lat"], meta["lon"], month,
                                variable, UNITS[variable], expected, len(values), len(valid),
                                f"{len(valid)/expected:.8f}", "true" if complete else "false",
                                "preceding_3h_interval" if variable.endswith(("_tavg", "_acc")) else "instant_utc",
                                "" if mean is None else f"{mean:.12g}",
                                total_unit, "" if total is None else f"{total:.12g}"])
            provenance["files"].append({"file": target.name, "url": url,
                                        "underlying_data_url": data_url, "bytes": target.stat().st_size,
                                        "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
                                        "rows": len(data), "metadata": meta})
            print(f"Verified {target.name}: {len(data)} records, {len(buckets)} months", flush=True)
    derived = HERE / "gldas-dos-puntos-mensual-2001-03-2026-07.csv"
    with derived.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["point", "requested_latitude", "requested_longitude", "cell_latitude",
                         "cell_longitude", "month_utc", "variable", "mean_unit", "expected_3h_count",
                         "received_3h_count", "valid_3h_count", "valid_fraction", "complete_month", "time_basis",
                         "mean", "total_unit", "total"])
        writer.writerows(monthly)
    provenance["monthly_aggregation"] = {
        "file": derived.name, "records": len(monthly),
        "method": "GLDAS tavg/acc values describe the preceding 3-hour interval (README section 3.3). Assign them to the month containing timestamp minus one microsecond; drop the first interval, which belongs to February 2001. Instantaneous variables use their timestamp month. Arithmetic mean of uniformly spaced 3-hour values. Preserve missing values and report valid counts. Rainf/Evap integral is sum(value * 10800 seconds), Qs/Qsb monthly total is sum of 3-hour accumulations; totals emitted only for complete months. July 2026 tavg/acc lacks its final 3-hour interval (would require August 1 00:00 UTC), so no full-month total is emitted. 1 kg/m2 water = 1 mm. Potential evaporation remains W/m2.",
        "time_convention_source": "https://hydro1.gesdisc.eosdis.nasa.gov/data/GLDAS/README_GLDAS2.pdf",
        "bytes": derived.stat().st_size,
        "sha256": hashlib.sha256(derived.read_bytes()).hexdigest()}
    (HERE/"procedencia-gldas-dos-puntos.json").write_text(json.dumps(provenance, indent=2, ensure_ascii=False)+"\n")


if __name__ == "__main__":
    main()
