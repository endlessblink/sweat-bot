#!/usr/bin/env python3
"""
Generate PWA icons in multiple sizes from SVG source
Requires: pip install cairosvg pillow
"""

import os
from pathlib import Path

try:
    import cairosvg
    from PIL import Image
    import io
except ImportError:
    print("❌ Missing dependencies. Install with:")
    print("   pip install cairosvg pillow")
    exit(1)

# Icon sizes needed for PWA
ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
SVG_SOURCE = PROJECT_ROOT / "personal-ui-vite" / "public" / "icons" / "icon-192.svg"
ICONS_DIR = PROJECT_ROOT / "personal-ui-vite" / "public" / "icons"

def generate_png_from_svg(svg_path: Path, output_path: Path, size: int):
    """Convert SVG to PNG at specified size"""
    try:
        # Convert SVG to PNG bytes
        png_data = cairosvg.svg2png(
            url=str(svg_path),
            output_width=size,
            output_height=size
        )

        # Open with PIL to ensure proper format
        img = Image.open(io.BytesIO(png_data))

        # Save as PNG
        img.save(output_path, "PNG", optimize=True)

        return True
    except Exception as e:
        print(f"❌ Failed to generate {size}x{size}: {e}")
        return False

def main():
    print("🎨 Generating PWA icons...")
    print(f"📁 Source: {SVG_SOURCE}")
    print(f"📁 Output: {ICONS_DIR}")
    print()

    if not SVG_SOURCE.exists():
        print(f"❌ SVG source not found: {SVG_SOURCE}")
        exit(1)

    # Ensure icons directory exists
    ICONS_DIR.mkdir(parents=True, exist_ok=True)

    success_count = 0

    for size in ICON_SIZES:
        output_file = ICONS_DIR / f"icon-{size}.png"
        print(f"⚙️  Generating icon-{size}.png... ", end="", flush=True)

        if generate_png_from_svg(SVG_SOURCE, output_file, size):
            file_size = output_file.stat().st_size / 1024  # KB
            print(f"✅ ({file_size:.1f} KB)")
            success_count += 1
        else:
            print(f"❌ FAILED")

    print()
    print(f"✅ Generated {success_count}/{len(ICON_SIZES)} icons successfully!")

    if success_count == len(ICON_SIZES):
        print("🎉 All PWA icons ready!")
    else:
        print(f"⚠️  {len(ICON_SIZES) - success_count} icons failed to generate")

if __name__ == "__main__":
    main()
