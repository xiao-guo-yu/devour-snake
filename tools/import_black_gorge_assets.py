"""Prepare the supplied Chapter 7 Black Gorge artwork for the game."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / "DSH生成文件夹"
ASSETS = ROOT / "assets"


def trim_alpha(image: Image.Image, threshold: int = 6) -> Image.Image:
    rgba = image.convert("RGBA")
    mask = rgba.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    bbox = mask.getbbox()
    return rgba.crop(bbox) if bbox else rgba


def fit_square(image: Image.Image, size: int, padding: float = 0.035) -> Image.Image:
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


def save_map() -> None:
    image = Image.open(SOURCE / "黑谷_地图.png").convert("RGB")
    # Remove the supplied HUD and control pads while retaining the arena's
    # surrounding void so it still reads as a campaign background.
    crop = image.crop((120, 600, 1350, 1830))
    crop = crop.resize((1000, 1000), Image.Resampling.LANCZOS)
    crop.save(ASSETS / "black-gorge-map.jpg", quality=88, optimize=True)
    print("black-gorge-map.jpg: 1000x1000")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    save_map()
    obstacle = SOURCE / "黑谷_障碍_2x2_透明底.png"
    if obstacle.exists():
        fit_square(Image.open(obstacle), 512).save(
            ASSETS / "black-rune-block.png",
            optimize=True,
        )
        print("black-rune-block.png: 512x512")
    else:
        save_sprite("黑谷_障碍_2x2_原图.png", "black-rune-block.png", 512)

    save_sprite("黑谷1_黑咒侍从_透明底.png", "black-curse-attendant.png", 640)
    save_sprite("黑谷2_畸变血奴_透明底.png", "blood-slave.png", 640)
    save_sprite("黑谷3_黑雾魔侍_透明底.png", "black-mist-servant.png", 640)
    save_sprite("黑谷Boss_黑巫师_透明底.png", "black-wizard.png", 640)


if __name__ == "__main__":
    main()
