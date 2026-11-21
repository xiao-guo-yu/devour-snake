"""Prepare the supplied Chapter 4 artwork for the browser game."""

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\17928\DSH生成文件夹")
ASSETS = ROOT / "assets"


def remove_edge_black_background(image: Image.Image) -> Image.Image:
    """Make the connected near-black backdrop transparent, preserving dark details."""
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    background = bytearray(width * height)
    queue = deque()

    def is_background(x: int, y: int) -> bool:
        r, g, b = pixels[x, y]
        # The generated PNGs use a very dark, subtly textured backdrop rather than
        # a literal (0, 0, 0) fill. Flood-fill only that edge-connected backdrop so
        # dark outlines inside each character remain intact.
        return max(r, g, b) <= 44 and max(r, g, b) - min(r, g, b) <= 12

    def mark(x: int, y: int) -> None:
        index = y * width + x
        if background[index] or not is_background(x, y):
            return
        background[index] = 1
        queue.append((x, y))

    for x in range(width):
        mark(x, 0)
        mark(x, height - 1)
    for y in range(height):
        mark(0, y)
        mark(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x > 0:
            mark(x - 1, y)
        if x + 1 < width:
            mark(x + 1, y)
        if y > 0:
            mark(x, y - 1)
        if y + 1 < height:
            mark(x, y + 1)

    rgba = rgb.convert("RGBA")
    alpha = rgba.getchannel("A")
    alpha_pixels = alpha.load()
    for y in range(height):
        offset = y * width
        for x in range(width):
            if background[offset + x]:
                alpha_pixels[x, y] = 0
    rgba.putalpha(alpha)
    bbox = rgba.getbbox()
    return rgba.crop(bbox) if bbox else rgba


def save_character(source_name: str, output_name: str, max_size: int = 640) -> None:
    image = Image.open(SOURCE / source_name)
    prepared = remove_edge_black_background(image)
    prepared.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    prepared.save(ASSETS / output_name, optimize=True)


def save_effect() -> None:
    image = Image.open(SOURCE / "龙息_锥形喷射_透明底.png").convert("RGBA")
    image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    image.save(ASSETS / "dragon-breath.png", optimize=True)


def save_map() -> None:
    image = Image.open(SOURCE / "agnes-20261121-232700-1.png").convert("RGB")
    image.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
    image.save(ASSETS / "frozen-wastes-map.jpg", quality=86, optimize=True)


save_character("agnes-20261121-232730-1.png", "ice-slug.png")
save_character("agnes-20261121-232756-1.png", "frost-wolf.png")
save_character("agnes-20261121-232821-1.png", "frost-wisp.png")
save_character("agnes-20261121-232929-1.png", "frost-dragon-idle.png")
save_character("agnes-20261121-232957-1.png", "frost-dragon-attack.png")
save_character("agnes-20261121-233025-1.png", "ice-block.png")
save_effect()
save_map()
