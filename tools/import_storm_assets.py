"""Prepare the supplied Chapter 5 storm-airspace artwork for the game."""

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\17928\DSH生成文件夹")
ASSETS = ROOT / "assets"


def remove_edge_black_background(image: Image.Image) -> Image.Image:
    """Remove the connected near-black backdrop used by the rock source."""
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    background = bytearray(width * height)
    queue = deque()

    def is_background(x: int, y: int) -> bool:
        r, g, b = pixels[x, y]
        return max(r, g, b) <= 38 and max(r, g, b) - min(r, g, b) <= 14

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
        row = y * width
        for x in range(width):
            if background[row + x]:
                alpha_pixels[x, y] = 0
    rgba.putalpha(alpha)
    bbox = rgba.getchannel("A").point(lambda value: 255 if value > 8 else 0).getbbox()
    return rgba.crop(bbox) if bbox else rgba


def trim_alpha(image: Image.Image, threshold: int = 8) -> Image.Image:
    rgba = image.convert("RGBA")
    mask = rgba.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    bbox = mask.getbbox()
    return rgba.crop(bbox) if bbox else rgba


def fit_square(image: Image.Image, size: int, padding: float = 0.04) -> Image.Image:
    """Keep the subject's aspect ratio and center it on a transparent square."""
    content = trim_alpha(image)
    inner = max(1, round(size * (1 - padding * 2)))
    scale = min(inner / content.width, inner / content.height)
    resized = content.resize(
        (max(1, round(content.width * scale)), max(1, round(content.height * scale))),
        Image.Resampling.LANCZOS,
    )
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.alpha_composite(
        resized,
        ((size - resized.width) // 2, (size - resized.height) // 2),
    )
    return output


def save_sprite(source_name: str, output_name: str, size: int) -> None:
    image = Image.open(SOURCE / source_name)
    fit_square(image, size).save(ASSETS / output_name, optimize=True)
    print(f"{output_name}: {size}x{size}")


def save_rock() -> None:
    image = remove_edge_black_background(Image.open(SOURCE / "风暴_障碍_岩石.png"))
    canvas = fit_square(image, 512, 0.05)
    canvas.save(ASSETS / "storm-rock.png", optimize=True)
    print("storm-rock.png: 512x512")


def save_effect(source_name: str, output_name: str, size: tuple[int, int], alpha_floor: int = 0) -> None:
    image = Image.open(SOURCE / source_name).convert("RGBA")
    if alpha_floor > 0:
        alpha = image.getchannel("A")
        alpha = alpha.point(lambda value: 0 if value <= alpha_floor else value)
        image.putalpha(alpha)
    image = trim_alpha(image, max(8, alpha_floor))
    image.thumbnail(size, Image.Resampling.LANCZOS)
    image.save(ASSETS / output_name, optimize=True)
    print(f"{output_name}: {image.width}x{image.height}")


def save_map() -> None:
    image = Image.open(SOURCE / "风暴_地图.png").convert("RGB")
    # The generated presentation includes the old HUD and controls. Keep only
    # the arena and its surrounding cloud sea for campaign backgrounds.
    crop = image.crop((120, 520, 1340, 1740))
    crop = crop.resize((1000, 1000), Image.Resampling.LANCZOS)
    crop.save(ASSETS / "storm-airspace-map.jpg", quality=88, optimize=True)
    print("storm-airspace-map.jpg: 1000x1000")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    save_map()
    save_rock()
    save_sprite("风暴1_掠风萤_透明底.png", "storm-skimmer.png", 384)
    save_sprite("风暴2_雷羽飞虫_透明底.png", "storm-moth.png", 384)
    save_sprite("风暴3_雷云隼_透明底.png", "storm-falcon.png", 448)
    save_sprite("风暴Boss_巨鹰_扑击_透明底.png", "storm-eagle.png", 640)
    save_effect("落雷_透明底.png", "storm-lightning.png", (360, 800))
    save_effect("龙卷风_透明底.png", "storm-tornado.png", (512, 912), alpha_floor=32)


if __name__ == "__main__":
    main()
