#!/usr/bin/env python3
"""Generate a 1024x1024 placeholder app icon for Tamga.

Brand colors (from AppColors):
  Primary:     #C07A32  (warm amber)
  On-primary:  #FBF5EC  (near-white)
  Secondary:   #D4B896  (earth tan)
"""

import os
from PIL import Image, ImageDraw, ImageFont

SIZE = 1024
OUTPUT = os.path.join(os.path.dirname(__file__), "icon.png")

# Brand colors
BG_COLOR = (0xC0, 0x7A, 0x32)  # #C07A32 warm amber
FG_COLOR = (0xFB, 0xF5, 0xEC)  # #FBF5EC near-white
ACCENT = (0xD4, 0xB8, 0x96)  # #D4B896 earth tan

img = Image.new("RGB", (SIZE, SIZE), BG_COLOR)
draw = ImageDraw.Draw(img)

# Draw a subtle circular border
margin = 60
draw.ellipse(
    [margin, margin, SIZE - margin, SIZE - margin],
    outline=ACCENT,
    width=16,
)

# Draw the letter "T"
# Try to find a good font, fall back to default
font_size = 520
font = None
font_paths = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/SFNS.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
]
for fp in font_paths:
    if os.path.exists(fp):
        try:
            font = ImageFont.truetype(fp, font_size)
            break
        except Exception:
            continue

if font is None:
    font = ImageFont.load_default()

# Center the "T"
bbox = draw.textbbox((0, 0), "T", font=font)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
x = (SIZE - tw) / 2 - bbox[0]
y = (SIZE - th) / 2 - bbox[1] - 20  # slight upward nudge

draw.text((x, y), "T", fill=FG_COLOR, font=font)

img.save(OUTPUT, "PNG")
print(f"Icon saved to {OUTPUT} ({SIZE}x{SIZE})")
