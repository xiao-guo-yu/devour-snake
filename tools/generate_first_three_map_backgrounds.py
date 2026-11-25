"""Create painted campaign-map backgrounds for Chapters 1-3.

The project owner supplied the later map backgrounds. These deterministic
variants reuse their stone-map composition and repaint it with each chapter's
environment details, avoiding an external image-generation dependency.
"""

from __future__ import annotations

import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SIZE = 1000


def repaint(base: Image.Image, black: str, mid: str, white: str) -> Image.Image:
    gray = ImageOps.grayscale(base)
    gray = ImageOps.autocontrast(gray, cutoff=1)
    color = ImageOps.colorize(gray, black=black, mid=mid, white=white, midpoint=105)
    return color.convert("RGB")


def apply_vignette(image: Image.Image, strength: float = 0.42) -> Image.Image:
    pixels = np.asarray(image, dtype=np.float32)
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    distance = np.sqrt((xx - SIZE / 2) ** 2 + (yy - SIZE / 2) ** 2)
    edge = np.clip((distance - 180) / 520, 0, 1)
    shade = 1.0 - edge**1.65 * strength
    center = np.clip(1.0 - distance / 520, 0, 1)
    shade *= 1.0 + center * 0.08
    pixels *= shade[..., None]
    return Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8), "RGB")


def add_grain(image: Image.Image, amount: int = 9) -> Image.Image:
    rng = np.random.default_rng(731)
    pixels = np.asarray(image, dtype=np.int16)
    noise = rng.integers(-amount, amount + 1, (SIZE, SIZE, 1), dtype=np.int16)
    return Image.fromarray(np.clip(pixels + noise, 0, 255).astype(np.uint8), "RGB")


def soft_blob(draw: ImageDraw.ImageDraw, x: float, y: float, radius: float, fill: tuple[int, ...]) -> None:
    for _ in range(7):
        dx = random.uniform(-radius * 0.45, radius * 0.45)
        dy = random.uniform(-radius * 0.45, radius * 0.45)
        rr = random.uniform(radius * 0.35, radius * 0.8)
        draw.ellipse((x + dx - rr, y + dy - rr, x + dx + rr, y + dy + rr), fill=fill)


def draw_vine(draw: ImageDraw.ImageDraw, start: tuple[float, float], end: tuple[float, float], bend: float) -> None:
    points = []
    for index in range(28):
        t = index / 27
        x = start[0] + (end[0] - start[0]) * t
        y = start[1] + (end[1] - start[1]) * t
        x += math.sin(t * math.pi) * bend
        y += math.sin(t * math.pi * 2.2) * 18
        points.append((x, y))
    draw.line(points, fill=(6, 20, 12, 220), width=17, joint="curve")
    draw.line(points, fill=(56, 104, 49, 205), width=8, joint="curve")
    for point in points[4::4]:
        angle = random.uniform(-0.7, 0.7)
        leaf_w = random.uniform(15, 27)
        leaf_h = leaf_w * 0.48
        lx = point[0] + math.cos(angle) * leaf_w * 0.7
        ly = point[1] + math.sin(angle) * leaf_w * 0.7
        draw.ellipse((lx - leaf_w, ly - leaf_h, lx + leaf_w, ly + leaf_h), fill=(45, 94, 42, 180))


def green_details(image: Image.Image) -> Image.Image:
    random.seed(17)
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for _ in range(90):
        x = random.uniform(30, 970)
        y = random.uniform(30, 970)
        if math.hypot(x - 500, y - 500) < 220:
            continue
        soft_blob(draw, x, y, random.uniform(12, 48), (30, 83, 42, random.randint(18, 55)))
    vines = [
        ((20, 170), (255, 35), 35),
        ((80, 985), (350, 770), -38),
        ((985, 150), (750, 350), 42),
        ((920, 930), (690, 760), -35),
        ((20, 610), (205, 735), 28),
    ]
    for vine in vines:
        draw_vine(draw, *vine)
    water = Image.new("RGBA", image.size, (0, 0, 0, 0))
    water_draw = ImageDraw.Draw(water)
    for _ in range(12):
        x = random.choice([120, 180, 790, 850]) + random.uniform(-35, 35)
        y = random.uniform(180, 840)
        w = random.uniform(35, 105)
        h = random.uniform(8, 20)
        water_draw.ellipse((x - w, y - h, x + w, y + h), fill=(36, 94, 79, 55))
    water = water.filter(ImageFilter.GaussianBlur(5))
    overlay = Image.alpha_composite(overlay, water)
    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def temple_details(image: Image.Image) -> Image.Image:
    random.seed(23)
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for x in (28, 900):
        draw.rounded_rectangle((x, 70, x + 72, 890), radius=24, fill=(8, 5, 2, 90), outline=(116, 78, 35, 115), width=3)
        for y in range(112, 870, 86):
            draw.line((x + 8, y, x + 64, y), fill=(190, 137, 65, 72), width=4)
    for _ in range(130):
        x = random.uniform(20, 980)
        y = random.uniform(20, 980)
        if math.hypot(x - 500, y - 500) < 210:
            continue
        radius = random.uniform(1, 3.5)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(239, 197, 111, random.randint(35, 100)))
    glyph_color = (218, 158, 75, 120)
    for cx, cy in ((135, 145), (866, 145), (135, 850), (866, 850)):
        draw.polygon([(cx, cy - 28), (cx + 28, cy), (cx, cy + 28), (cx - 28, cy)], outline=glyph_color, width=4)
        draw.line((cx - 12, cy, cx + 12, cy), fill=glyph_color, width=4)
        draw.line((cx, cy - 12, cx, cy + 12), fill=glyph_color, width=4)
    haze = Image.new("RGBA", image.size, (0, 0, 0, 0))
    haze_draw = ImageDraw.Draw(haze)
    for _ in range(16):
        x = random.uniform(0, 1000)
        y = random.uniform(0, 1000)
        soft_blob(haze_draw, x, y, random.uniform(65, 160), (154, 110, 54, 14))
    haze = haze.filter(ImageFilter.GaussianBlur(18))
    overlay = Image.alpha_composite(overlay, haze)
    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def lava_branch(draw: ImageDraw.ImageDraw, start: tuple[float, float], angle: float, length: float, depth: int) -> None:
    if depth <= 0:
        return
    end = (start[0] + math.cos(angle) * length, start[1] + math.sin(angle) * length)
    draw.line((start, end), fill=(57, 8, 3, 210), width=max(3, depth * 2 + 3), joint="curve")
    draw.line((start, end), fill=(255, 66, 11, 190), width=max(1, depth + 1), joint="curve")
    if random.random() < 0.8:
        lava_branch(draw, end, angle + random.uniform(-0.42, 0.42), length * random.uniform(0.55, 0.78), depth - 1)


def volcano_details(image: Image.Image) -> Image.Image:
    random.seed(41)
    cracks = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(cracks)
    starts = [
        ((0, 230), (0.14, 0.57)),
        ((1000, 315), (math.pi - 0.14, 0.57)),
        ((0, 755), (0.23, 0.55)),
        ((1000, 700), (math.pi - 0.23, 0.55)),
    ]
    for start, (angle, _) in starts:
        lava_branch(draw, start, angle, 108, 5)
    glow = cracks.filter(ImageFilter.GaussianBlur(8))
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for _ in range(70):
        x = random.uniform(20, 980)
        y = random.uniform(20, 980)
        radius = random.uniform(1, 4)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(255, 112, 33, random.randint(80, 190)))
    smoke = Image.new("RGBA", image.size, (0, 0, 0, 0))
    smoke_draw = ImageDraw.Draw(smoke)
    for _ in range(16):
        x = random.uniform(0, 1000)
        y = random.uniform(0, 1000)
        soft_blob(smoke_draw, x, y, random.uniform(70, 170), (24, 12, 10, 28))
    smoke = smoke.filter(ImageFilter.GaussianBlur(20))
    overlay = Image.alpha_composite(smoke, overlay)
    overlay = Image.alpha_composite(glow, overlay)
    overlay = Image.alpha_composite(overlay, cracks)
    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def save(image: Image.Image, name: str) -> None:
    image = image.filter(ImageFilter.GaussianBlur(0.35))
    image = ImageEnhance.Contrast(image).enhance(1.06)
    image = add_grain(image)
    image.save(ASSETS / name, quality=90, optimize=True)
    print(f"{name}: 1000x1000")


def main() -> None:
    base = Image.open(ASSETS / "frozen-wastes-map.jpg").convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    green = apply_vignette(repaint(base, "#020a05", "#173c25", "#6a8066"))
    save(green_details(green), "verdant-ruins-map.jpg")

    temple = apply_vignette(repaint(base, "#0c0803", "#4d3419", "#c0a16b"), 0.38)
    save(temple_details(temple), "sunken-temple-map.jpg")

    volcano = apply_vignette(repaint(base, "#050302", "#28110e", "#765146"), 0.5)
    save(volcano_details(volcano), "molten-vein-map.jpg")


if __name__ == "__main__":
    main()
