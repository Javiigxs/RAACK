#!/usr/bin/env python3
"""Prepares the three textures of the opening Earth (app/public/earth/).

Usage, from the root of the repository:

    python3 app/scripts/build-earth.py <folder with day.jpg, night.jpg and specularClouds.jpg>

- day.jpg and night.jpg are copied byte for byte (equirectangular, 4096 x 2048).
- specularClouds.jpg (red = how much the sea shines, green = clouds) is copied byte for byte as
  clouds.jpg, for wide screens, and halved to 2048 x 1024 as clouds-2k.jpg (without chroma
  subsampling, so the two masks do not bleed into each other) for phones and for the 2D fallback:
  1.7 MB against 0.8 MB.

It prints the size and SHA-256 of every input and output, for the provenance note in app/README.md.
Needs Pillow (pip install pillow). Code written with AI assistance (Claude) for team RAACK.
"""
import hashlib
import shutil
import sys
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "public" / "earth"


def describe(path: Path) -> str:
    data = path.read_bytes()
    return f"{path.name}: {len(data)} bytes, sha256 {hashlib.sha256(data).hexdigest()}"


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    names = ["day.jpg", "night.jpg", "specularClouds.jpg"]
    missing = [n for n in names if not (src / n).is_file()]
    if missing:
        sys.exit(f"Missing in {src}: {', '.join(missing)}")
    OUT.mkdir(parents=True, exist_ok=True)

    print("inputs")
    for n in names:
        print("  " + describe(src / n))

    for n in ("day.jpg", "night.jpg"):
        with Image.open(src / n) as im:
            if im.size[0] != 2 * im.size[1]:
                sys.exit(f"{n} is not a 2:1 equirectangular map: {im.size}")
        shutil.copyfile(src / n, OUT / n)

    with Image.open(src / "specularClouds.jpg") as im:
        red, green, _ = im.convert("RGB").split()
        size = (2048, 1024)
        packed = Image.merge(
            "RGB",
            (red.resize(size, Image.LANCZOS), green.resize(size, Image.LANCZOS), Image.new("L", size, 0)),
        )
        packed.save(OUT / "clouds-2k.jpg", "JPEG", quality=80, subsampling=0, optimize=True, progressive=True)
    shutil.copyfile(src / "specularClouds.jpg", OUT / "clouds.jpg")

    print("outputs")
    for n in ("day.jpg", "night.jpg", "clouds.jpg", "clouds-2k.jpg"):
        print("  " + describe(OUT / n))


if __name__ == "__main__":
    main()
