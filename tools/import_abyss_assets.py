"""Prepare the supplied Chapter 6 abyss-rift artwork for the game."""

from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\17928\DSH生成文件夹")
ASSETS = ROOT / "assets"


def trim_alpha(image: Image.Image, threshold: int = 8) -> Image.Image:
    rgba = image.convert("RGBA")
    mask = rgba.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    bbox = mask.getbbox()
    return rgba.crop(bbox) if bbox else rgba


def fit_square(image: Image.Image, size: int, padding: float = 0.04) -> Image.Image:
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
    image = Image.open(SOURCE / "深渊_地图.png").convert("RGB")
    # The supplied presentation includes the prior HUD. Keep the arena and
    # surrounding violet cloud field for campaign backgrounds.
    crop = image.crop((120, 520, 1340, 1740))
    crop = crop.resize((1000, 1000), Image.Resampling.LANCZOS)
    crop.save(ASSETS / "abyss-rift-map.jpg", quality=88, optimize=True)
    print("abyss-rift-map.jpg: 1000x1000")


def gif_frames(source_name: str) -> list[np.ndarray]:
    animation = Image.open(SOURCE / source_name)
    frames = []
    for index in range(animation.n_frames):
        animation.seek(index)
        frames.append(np.asarray(animation.convert("RGB"), dtype=np.int16))
    return frames


def extract_gif(source_name: str, prefix: str) -> None:
    source_frames = gif_frames(source_name)
    background = np.median(np.stack(source_frames, axis=0), axis=0)
    prepared = []
    for frame in source_frames:
        difference = np.max(np.abs(frame - background), axis=2)
        # The GIF is an opaque presentation render. Median differencing isolates
        # the moving boss, purple ring, and smoke without hard-clipping its dark body.
        alpha = np.clip((difference - 1.5) * 16.0, 0.0, 255.0)
        prepared.append(np.dstack([frame.astype(np.uint8), alpha.astype(np.uint8)]))

    union = np.zeros(prepared[0].shape[:2], dtype=bool)
    for frame in prepared:
        union |= frame[:, :, 3] > 6
    ys, xs = np.where(union)
    if len(xs) == 0 or len(ys) == 0:
        raise RuntimeError(f"No visible animation pixels in {source_name}")
    pad = 22
    left = max(0, int(xs.min()) - pad)
    top = max(0, int(ys.min()) - pad)
    right = min(prepared[0].shape[1], int(xs.max()) + pad + 1)
    bottom = min(prepared[0].shape[0], int(ys.max()) + pad + 1)
    side = min(640, max(right - left, bottom - top))

    for index, frame in enumerate(prepared):
        image = Image.fromarray(frame, "RGBA").crop((left, top, right, bottom))
        output = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        output.alpha_composite(image, ((side - image.width) // 2, (side - image.height) // 2))
        output = output.resize((512, 512), Image.Resampling.LANCZOS)
        output.save(ASSETS / f"{prefix}-{index + 1:02d}.png", optimize=True)
    print(f"{prefix}: {len(prepared)} frames")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    save_map()
    save_sprite("深渊1_暗影触须怪_透明底.png", "abyss-tentacle.png", 448)
    save_sprite("深渊2_蚀魂幽影_透明底.png", "abyss-wraith.png", 448)
    save_sprite("深渊3_虚空蜱虫_透明底.png", "abyss-tick.png", 448)
    save_sprite("深渊Boss_影主_透明底.png", "abyss-lord.png", 640)
    save_sprite("深渊_礁石_2x2_透明底.png", "abyss-rock.png", 512)

    hole = Image.open(SOURCE / "小黑洞_512.png").convert("RGBA")
    hole.resize((320, 320), Image.Resampling.LANCZOS).save(
        ASSETS / "abyss-black-hole.png",
        optimize=True,
    )
    print("abyss-black-hole.png: 320x320")

    extract_gif("影主_潜入黑洞.gif", "abyss-lord-enter")
    extract_gif("影主_钻出黑洞.gif", "abyss-lord-exit")


if __name__ == "__main__":
    main()
