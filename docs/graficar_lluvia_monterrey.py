"""Draw the Monterrey IMERG case from the original daily POWER CSV."""
import argparse
import calendar
import csv
from collections import defaultdict
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import PercentFormatter


def annual_rainfall(source):
    with source.open(encoding="utf-8-sig") as stream:
        for line in stream:
            if line.strip() == "-END HEADER-":
                break
        daily = defaultdict(dict)
        for row in csv.DictReader(stream):
            year, day = int(row["YEAR"]), int(row["DOY"])
            precip = float(row["IMERG_PRECTOT"])
            if precip < 0 or day in daily[year]:
                raise ValueError(f"Invalid or duplicate observation: {year}/{day}")
            daily[year][day] = precip
    years = list(range(2002, 2025))
    for year in years:
        if set(daily[year]) != set(range(1, 366 + int(calendar.isleap(year)))):
            raise ValueError(f"Incomplete year: {year}")
    annual = {year: sum(daily[year].values()) for year in years}
    wettest = {year: sum(sorted(daily[year].values(), reverse=True)[:5]) for year in years}
    return years, annual, wettest


def draw(source, output):
    years, totals, wettest = annual_rainfall(source)
    shares = {year: 100 * wettest[year] / totals[year] for year in years}
    ink, muted = "#1b343c", "#435a60"
    accent, light, grid, bg = "#087268", "#c1dfdb", "#d5dedb", "#fafbf8"
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11, "text.color": ink,
                         "axes.labelcolor": ink, "xtick.color": muted, "ytick.color": muted,
                         "axes.spines.top": False, "axes.spines.right": False})
    fig = plt.figure(figsize=(12.6, 6.5), facecolor=bg)
    fig.text(.07, .935, "How much of Monterrey’s rain falls in just five days?",
             fontsize=23, weight="bold")
    fig.text(.07, .875, "One satellite grid cell near Monterrey, Mexico  •  Daily precipitation estimates, 2002–2024",
             color=muted, fontsize=12)
    left = fig.add_axes([.075, .25, .49, .47], facecolor=bg)
    right = fig.add_axes([.66, .30, .265, .37], facecolor=bg)
    fig.text(.075, .773, "Share of annual rain in the five wettest days", fontsize=13, weight="bold")
    fig.text(.66, .773, "Two years with similar totals", fontsize=13, weight="bold")
    for ax in (left, right):
        ax.spines["left"].set_visible(False)
        ax.spines["bottom"].set_color(grid)
        ax.tick_params(length=0, pad=7)
        ax.set_axisbelow(True)
    left.grid(axis="y", color=grid, lw=1)
    left.set_xlim(2001.6, 2024.4)
    left.set_xticks([2002, 2006, 2010, 2014, 2018, 2022, 2024])
    left.tick_params(axis="x", labelsize=9)
    left.set_ylim(0, 62)
    left.set_yticks([0, 10, 20, 30, 40, 50, 60])
    left.yaxis.set_major_formatter(PercentFormatter(100, decimals=0))
    left.plot(years, [shares[y] for y in years], color=accent, lw=2, marker="o", ms=3)
    for y, offset, align in [(2016, (13,-38),"center"), (2020, (0,10),"center")]:
        left.scatter(y, shares[y], s=58, color=accent, zorder=3, edgecolor=bg, lw=1.4)
        left.annotate(f"{y}: {shares[y]:.1f}%", (y, shares[y]), xytext=offset,
                      textcoords="offset points", ha=align, color=ink, fontsize=10, weight="bold")
    right.set_xlim(0, 900)
    right.set_ylim(-.6, 1.5)
    right.set_yticks([1,0], ["2016", "2020"], fontsize=12, weight="bold")
    right.set_xticks([0, 200, 400, 600, 800], [0, 200, 400, 600, 800], fontsize=9)
    right.set_xlabel("Annual precipitation (mm)", fontsize=10, labelpad=8)
    for pos, year in [(1, 2016), (0, 2020)]:
        right.barh(pos, totals[year], height=.31, color=light)
        right.barh(pos, wettest[year], height=.31, color=accent)
        right.text(wettest[year]/2, pos, f"{shares[year]:.1f}%", va="center", ha="center",
                   color="white", fontsize=10, weight="bold")
        right.text(totals[year], pos+.23, f"{totals[year]:,.0f} mm", ha="right",
                   fontsize=10, color=ink)
    fig.text(.66, .73, "Dark segment = five wettest days", color=muted, fontsize=10)
    fig.text(.075, .118, "Five days are ranked separately within each calendar year and may be nonconsecutive.",
             color=muted, fontsize=10)
    fig.text(.075, .071, "Source: NASA IMERG via POWER • 0.1° grid • 25.6708° N, 100.3092° W • 8,401 daily UTC values.",
             color=muted, fontsize=10)
    fig.text(.925, .071, "Analysis and chart by Codex (AI)", color=muted, fontsize=9, ha="right")
    fig.savefig(output, dpi=160, facecolor=bg)
    plt.close(fig)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Original CSV returned by the NASA POWER daily point API")
    parser.add_argument("output", type=Path, help="Destination PNG")
    args = parser.parse_args()
    draw(args.source, args.output)
