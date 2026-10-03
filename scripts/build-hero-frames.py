#!/usr/bin/env python3
"""Build optimized hero frames.

The live site loads one file per shot. Swap the opening frame by replacing
assets/hero/frame-1.webp (or rerun this script with a new first image).

The old aerial had a garbled doorway sign. Pass --blur-sign only for that
source. The current frame 1 (finance and technology lawn line) should stay sharp.

Usage:
  python3 scripts/build-hero-frames.py frame1.jpg frame2.jpg frame3.jpg frame4.jpg
  python3 scripts/build-hero-frames.py --blur-sign old-frame1.jpg frame2.jpg frame3.jpg frame4.jpg
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "hero"

# Doorway sign on frame 1 (1280x720): thin red lettering on the stone band
# above the entrance. A tight, heavy blur knocks the glyphs out without
# smearing the windows around them.
SIGN = (448, 301, 372, 34)  # x, y, w, h


def blur_sign(src: Path, dest: Path) -> None:
    im = Image.open(src).convert("RGB")
    x, y, w, h = SIGN
    pad = 28
    box = (x - pad, y - pad, x + w + pad, y + h + pad)
    crop = im.crop(box).filter(ImageFilter.GaussianBlur(radius=16))
    mask = Image.new("L", crop.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((pad, pad, pad + w, pad + h), radius=8, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=3))
    im.paste(crop, (box[0], box[1]), mask)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG")


def encode(src: Path, stem: str) -> None:
    avif = OUT / f"{stem}.avif"
    webp = OUT / f"{stem}.webp"
    jpg = OUT / f"{stem}.jpg"
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(src),
            "-c:v", "libaom-av1", "-still-picture", "1",
            "-crf", "22", "-b:v", "0", "-cpu-used", "4",
            "-pix_fmt", "yuv420p", str(avif),
        ],
        check=True, capture_output=True,
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(src),
            "-c:v", "libwebp", "-quality", "84", "-compression_level", "6",
            str(webp),
        ],
        check=True, capture_output=True,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-q:v", "3", str(jpg)],
        check=True, capture_output=True,
    )


def main() -> None:
    args = sys.argv[1:]
    blur = "--blur-sign" in args
    sources = [Path(p) for p in args if not p.startswith("--")]
    if len(sources) != 4:
        sys.exit("Need four source images, in walk-in order.")
    OUT.mkdir(parents=True, exist_ok=True)
    first = sources[0]
    if blur:
        master = OUT / "_frame-1-master.png"
        blur_sign(first, master)
        first = master
    encode(first, "frame-1")
    if blur:
        (OUT / "_frame-1-master.png").unlink(missing_ok=True)
    for i, src in enumerate(sources[1:], start=2):
        encode(src, f"frame-{i}")
    for path in sorted(OUT.iterdir()):
        print(f"{path.name:16} {path.stat().st_size:8d}")


if __name__ == "__main__":
    main()
