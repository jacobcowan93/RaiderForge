#!/usr/bin/env python3
"""
Slice the Speranza / xlsx embedded blueprint grid (1200×2291) into per-item WEBP tiles.

Source PNG (default): ~/Desktop/RaiderForge_Archive/src/blueprints/Speranza-Blueprint-Tracker-2026-03-28.png
Fallback: repo src/blueprints/... if you copy sources back locally.
(or xl/media/image1.png from ARC Raiders Blueprints 74.xlsx — same dimensions)

Outputs:
  public/assets/blueprints/registry/<lookup-key>.webp
  src/lib/blueprints/data/blueprint-reference-artifacts.json

Lookup keys match blueprintLookupKey() in resolveBlueprintImage.ts (lowercase slug).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Install Pillow: pip install pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
_ARCHIVE = Path.home() / "Desktop/RaiderForge_Archive/src/blueprints/Speranza-Blueprint-Tracker-2026-03-28.png"
_REPO_SRC = ROOT / "src/blueprints/Speranza-Blueprint-Tracker-2026-03-28.png"
SRC_PNG = _ARCHIVE if _ARCHIVE.exists() else _REPO_SRC
OUT_DIR = ROOT / "public/assets/blueprints/registry"
MANIFEST_PATH = ROOT / "src/lib/blueprints/data/blueprint-reference-artifacts.json"

# Column interiors (x0, x1 inclusive) — from vertical projection gutters
COLS = [
    (41, 186),
    (203, 348),
    (365, 510),
    (527, 672),
    (690, 835),
    (852, 997),
    (1014, 1159),
]

# Row interiors (y0, y1 inclusive) — from horizontal dark-band gaps
ROWS = [
    (161, 328),
    (345, 512),
    (529, 696),
    (713, 880),
    (898, 1064),
    (1082, 1249),
    (1266, 1433),
    (1450, 1617),
    (1635, 1801),
    (1819, 1986),
    (2003, 2169),
]

# Row-major order, 7 cols × 10 full rows + 4 cells = 74 — matches Speranza tracker layout
SPERANZA_NAMES: list[str] = [
    "Angled Grip II",
    "Angled Grip III",
    "Anvil",
    "Aphelion Rifle",
    "Barricade Kit",
    "Bettina",
    "Blaze Grenade",
    "Blue Light Stick",
    "Bobcat",
    "Burletta",
    "Combat Mk. 3 (Aggressive)",
    "Combat Mk. 3 (Flanking)",
    "Compensator I",
    "Compensator II",
    "Complex Gun Parts",
    "Deadline",
    "Defibrillator",
    "Equalizer",
    "Explosive Mine",
    "Extended Barrel",
    "Extended Light Mag II",
    "Extended Light Mag III",
    "Extended Medium Mag II",
    "Extended Medium Mag III",
    "Extended Shotgun Mag II",
    "Extended Shotgun Mag III",
    "Fireworks Box",
    "Gas Mine",
    "Green Light Stick",
    "Heavy Gun Parts",
    "Hullcracker",
    "Il Toro",
    "Jolt Mine",
    "Jupiter",
    "Light Gun Parts",
    "Lightweight Stock",
    "Looting Mk. 3 (Safekeeper)",
    "Looting Mk. 3 (Survivor)",
    "Lure Grenade",
    "Medium Gun Parts",
    "Muzzle Brake II",
    "Muzzle Brake III",
    "Osprey",
    "Padded Stock",
    "Pulse Mine",
    "Red Light Stick",
    "Remote Raider Flare",
    "Seeker Grenade",
    "Shotgun Choke II",
    "Shotgun Choke III",
    "Shotgun Silencer",
    "Showstopper",
    "Silencer I",
    "Silencer II",
    "Smoke Grenade",
    "Snap Hook",
    "Stable Stock II",
    "Stable Stock III",
    "Tactical Mk. 3 (Defensive)",
    "Tactical Mk. 3 (Healing)",
    "Tactical Mk. 3 (Revival)",
    "Tagging Grenade",
    "Tempest",
    "Torrente",
    "Trailblazer Grenade",
    "Trigger Nade",
    "Venator",
    "Vertical Grip II",
    "Vertical Grip III",
    "Vita Shot",
    "Vita Spray",
    "Vulcano",
    "Wolfpack",
    "Yellow Light Stick",
]


def lookup_key(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")


def main() -> None:
    if not SRC_PNG.is_file():
        print(f"Missing source: {SRC_PNG}", file=sys.stderr)
        sys.exit(1)

    im = Image.open(SRC_PNG).convert("RGBA")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, str] = {}
    assert len(SPERANZA_NAMES) == 74

    for idx, name in enumerate(SPERANZA_NAMES):
        row, col = divmod(idx, 7)
        y0, y1 = ROWS[row]
        x0, x1 = COLS[col]
        tile = im.crop((x0, y0, x1 + 1, y1 + 1))
        key = lookup_key(name)
        rel_url = f"/assets/blueprints/registry/{key}.webp"
        out_path = OUT_DIR / f"{key}.webp"
        tile.save(out_path, "WEBP", quality=88, method=6)
        manifest[key] = rel_url

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(
            {
                "version": 1,
                "source": "Speranza-Blueprint-Tracker-2026-03-28.png grid (7×11, 74 cells)",
                "artifacts": manifest,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(manifest)} tiles to {OUT_DIR.relative_to(ROOT)}")
    print(f"Manifest -> {MANIFEST_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
