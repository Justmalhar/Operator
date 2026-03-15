#!/usr/bin/env python3
"""
Fixes the app icon:
1. Shrinks the icon content to 70% of canvas (reduces by 0.3)
2. Transparent outer padding (no black borders in dock)
3. Proper RGBA output at 1024x1024 for tauri icon generation
"""

from PIL import Image, ImageDraw
import math

SOURCE = "src-tauri/icons/icon.png"
OUTPUT = "src-tauri/icons/icon.png"
CANVAS_SIZE = 1024
SCALE = 0.70  # reduce by 0.3

img = Image.open(SOURCE).convert("RGBA")

# Scale the existing icon (which already has rounded black bg + star) to 70%
new_size = int(CANVAS_SIZE * SCALE)
resized = img.resize((new_size, new_size), Image.LANCZOS)

# Paste onto transparent canvas, centered
canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
offset = (CANVAS_SIZE - new_size) // 2
canvas.paste(resized, (offset, offset), resized)

canvas.save(OUTPUT, "PNG")
print(f"Saved {OUTPUT} ({CANVAS_SIZE}x{CANVAS_SIZE}, content at {SCALE*100:.0f}% scale)")
