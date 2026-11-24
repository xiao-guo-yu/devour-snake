from pathlib import Path

from PIL import Image


SOURCE_DIR = Path(r"C:\Users\17928\DSH生成文件夹")
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "assets"

ASSETS = [
    ("狼爪特效.png", "wolf-claw-vfx.png", (768, 768)),
    ("冰雾团.png", "frost-mist-vfx.png", (512, 512)),
    ("agnes-20261124-092507-1.png", "thin-ice.png", (384, 576)),
]


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for source_name, target_name, size in ASSETS:
        source = Image.open(SOURCE_DIR / source_name).convert("RGB")
        resized = source.resize(size, Image.Resampling.LANCZOS)
        resized.save(OUTPUT_DIR / target_name, optimize=True)
        print(f"{target_name}: {resized.size[0]}x{resized.size[1]}")


if __name__ == "__main__":
    main()
