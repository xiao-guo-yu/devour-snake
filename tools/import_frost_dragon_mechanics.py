from pathlib import Path

import numpy as np
from PIL import Image


SOURCE_DIR = Path(r"C:\Users\17928\DSH生成文件夹")
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "assets"


def resize_rgba(source, target_name, size):
    image = Image.open(source).convert("RGBA")
    image = image.resize(size, Image.Resampling.LANCZOS)
    image.save(OUTPUT_DIR / target_name, optimize=True)
    print(f"{target_name}: {image.size[0]}x{image.size[1]}")


def extract_slam_frames():
    animation = Image.open(SOURCE_DIR / "冰龙Boss_拍地.gif")
    for index in range(animation.n_frames):
        animation.seek(index)
        frame = animation.convert("RGB")
        rgba = np.asarray(frame).astype(np.float32)
        brightness = rgba.max(axis=2)
        alpha = np.clip((brightness - 4.0) * 4.0, 0.0, 255.0)
        output = np.dstack([rgba, alpha]).astype(np.uint8)
        image = Image.fromarray(output, "RGBA").resize((384, 384), Image.Resampling.LANCZOS)
        name = f"frost-dragon-slam-{index + 1}.png"
        image.save(OUTPUT_DIR / name, optimize=True)
        print(f"{name}: {image.size[0]}x{image.size[1]}")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    resize_rgba(SOURCE_DIR / "冰面_1x1_厚霜.png", "frost-scar.png", (256, 256))
    resize_rgba(SOURCE_DIR / "冰激光_透明底.png", "frost-laser.png", (1024, 216))
    resize_rgba(SOURCE_DIR / "龙息_细长射线_透明底.png", "dragon-breath-ray.png", (1024, 245))
    resize_rgba(SOURCE_DIR / "冰柱_1x2_透明底.png", "mirror-pillar.png", (384, 934))
    resize_rgba(SOURCE_DIR / "冰刺攻击_透明底.png", "frost-spikes.png", (640, 665))
    extract_slam_frames()


if __name__ == "__main__":
    main()
