"""
Re-extrae assets desde drafts ya existentes sin llamar a la API.
Aplica el crop_mode correcto a cada uno.
"""
import os
import numpy as np
from PIL import Image

REVIEW  = r"c:\VIINZO\Juego-AI\docs\08-assets\review"
ASSETS  = r"c:\VIINZO\Juego-AI\frontend\public\assets"
WHITE_TH = 40

JOBS = [
    # Muros — fill_width: ancho completo 128px, altura recortada a 32px
    { "draft": rf"{REVIEW}\wall-h-hp3-draft.png", "out": rf"{ASSETS}\walls\wall-h-hp3.png", "size": (128,32), "mode": "fill_width" },
    { "draft": rf"{REVIEW}\wall-h-hp2-draft.png", "out": rf"{ASSETS}\walls\wall-h-hp2.png", "size": (128,32), "mode": "fill_width" },
    { "draft": rf"{REVIEW}\wall-h-hp1-draft.png", "out": rf"{ASSETS}\walls\wall-h-hp1.png", "size": (128,32), "mode": "fill_width" },
    # Pickups — fit: escala proporcional dentro del canvas
    { "draft": rf"{REVIEW}\pickup-ammo3-draft.png",  "out": rf"{ASSETS}\pickups\pickup-ammo3.png",  "size": (48,48), "mode": "fit" },
    { "draft": rf"{REVIEW}\pickup-ammo5-draft.png",  "out": rf"{ASSETS}\pickups\pickup-ammo5.png",  "size": (48,48), "mode": "fit" },
    { "draft": rf"{REVIEW}\pickup-ammo10-draft.png", "out": rf"{ASSETS}\pickups\pickup-ammo10.png", "size": (64,64), "mode": "fit" },
    { "draft": rf"{REVIEW}\pickup-wall2-draft.png",  "out": rf"{ASSETS}\pickups\pickup-wall2.png",  "size": (48,48), "mode": "fit" },
    { "draft": rf"{REVIEW}\pickup-wall5-draft.png",  "out": rf"{ASSETS}\pickups\pickup-wall5.png",  "size": (64,64), "mode": "fit" },
    # UI icons — fit
    { "draft": rf"{REVIEW}\ui-bullet-icon-draft.png",      "out": rf"{ASSETS}\ui\ui-bullet-icon.png",      "size": (24,24), "mode": "fit" },
    { "draft": rf"{REVIEW}\ui-wall-charge-icon-draft.png", "out": rf"{ASSETS}\ui\ui-wall-charge-icon.png", "size": (24,24), "mode": "fit" },
    { "draft": rf"{REVIEW}\ui-coin-icon-draft.png",        "out": rf"{ASSETS}\ui\ui-coin-icon.png",        "size": (24,24), "mode": "fit" },
]


def content_mask(arr):
    r, g, b, a = (arr[:,:,i].astype(int) for i in range(4))
    return ((255-r > WHITE_TH) | (255-g > WHITE_TH) | (255-b > WHITE_TH)) & (a > 50)


def tight_bbox(mask):
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not rows.any():
        return None
    t = int(np.argmax(rows));         b = int(len(rows) - np.argmax(rows[::-1]))
    l = int(np.argmax(cols));         r = int(len(cols) - np.argmax(cols[::-1]))
    return l, t, r, b


def extract(draft, out, size, mode):
    img  = Image.open(draft).convert("RGBA")
    arr  = np.array(img)
    bbox = tight_bbox(content_mask(arr))
    if bbox is None:
        print(f"  SKIP (sin contenido): {draft}")
        return
    l, t, r, b = bbox
    print(f"  bbox: ({l},{t},{r},{b})  content: {r-l}×{b-t}px")
    cropped = Image.fromarray(arr[t:b, l:r])
    cw, ch  = cropped.size
    tw, th  = size

    if mode == "fill_width":
        scale  = tw / cw
        nw, nh = tw, max(1, int(round(ch * scale)))
        scaled = cropped.resize((nw, nh), Image.LANCZOS)
        canvas = Image.new("RGBA", size, (0,0,0,0))
        if nh >= th:
            y0 = (nh - th) // 2
            canvas.paste(scaled.crop((0, y0, nw, y0 + th)), (0, 0))
        else:
            canvas.paste(scaled, (0, (th - nh) // 2))
    else:
        scale  = min(tw/cw, th/ch)
        nw, nh = max(1, int(round(cw*scale))), max(1, int(round(ch*scale)))
        scaled = cropped.resize((nw, nh), Image.LANCZOS)
        canvas = Image.new("RGBA", size, (0,0,0,0))
        canvas.paste(scaled, ((tw-nw)//2, (th-nh)//2))

    os.makedirs(os.path.dirname(out), exist_ok=True)
    canvas.save(out, "PNG")
    print(f"  → {out}  [{mode}] {tw}×{th}")


for job in JOBS:
    name = os.path.basename(job["draft"])
    print(f"\n[{name}]")
    extract(job["draft"], job["out"], job["size"], job["mode"])

print("\n=== Listo ===")
