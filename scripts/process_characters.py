import os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC_DIR = "assets/characters"
OUT_DIR = "client/public/assets/characters"
os.makedirs(OUT_DIR, exist_ok=True)

# (source filename, target character id)
CHARACTERS = [
    ("buns.jpeg", "char-1"),
    ("wavy.jpeg", "char-2"),
    ("curls.jpeg", "char-3"),
    ("specs.jpeg", "char-4"),
    ("scholar.jpeg", "char-5"),
    ("bookworm.jpeg", "char-6"),
]

# Each sheet is 5 poses left-to-right: idle-front, back-walk, front-walk, left-profile, right-profile
POSES = ["still", "up", "down", "left", "right"]
THRESHOLD = 235
PAD = 6

STRUCT = np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]])


def remove_background(arr: np.ndarray) -> np.ndarray:
    bg_like = np.all(arr >= THRESHOLD, axis=2)
    labeled, _ = ndimage.label(bg_like, structure=STRUCT)
    border_labels = set(labeled[0, :].tolist()) | set(labeled[-1, :].tolist())
    border_labels |= set(labeled[:, 0].tolist()) | set(labeled[:, -1].tolist())
    border_labels.discard(0)
    bg = np.isin(labeled, list(border_labels))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    return np.dstack([arr, alpha])


def main():
    for filename, char_id in CHARACTERS:
        path = os.path.join(SRC_DIR, filename)
        im = Image.open(path).convert("RGB")
        arr = np.array(im)
        h, w, _ = arr.shape
        rgba = remove_background(arr)
        full = Image.fromarray(rgba, "RGBA")

        col_w = w // 5
        for i, pose in enumerate(POSES):
            x0 = i * col_w
            x1 = w if i == 4 else (i + 1) * col_w
            col = full.crop((x0, 0, x1, h))
            col_alpha = np.array(col)[:, :, 3]
            ys, xs = np.where(col_alpha > 0)
            if len(xs) == 0:
                print(f"WARNING: {char_id} {pose} has no visible content")
                continue
            bx0 = max(int(xs.min()) - PAD, 0)
            bx1 = min(int(xs.max()) + PAD + 1, col.width)
            by0 = max(int(ys.min()) - PAD, 0)
            by1 = min(int(ys.max()) + PAD + 1, col.height)
            cropped = col.crop((bx0, by0, bx1, by1))
            out_path = os.path.join(OUT_DIR, f"{char_id}-{pose}.png")
            cropped.save(out_path)
            print(out_path, cropped.size)


if __name__ == "__main__":
    main()
