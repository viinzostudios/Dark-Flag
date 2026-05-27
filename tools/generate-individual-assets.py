"""
Genera y extrae los 11 assets individuales:
  - 5 pickups (ammo3, ammo5, ammo10, wall2, wall5)
  - 3 UI icons (bullet, wall-charge, coin)
  - 3 muros (hp3, hp2, hp1)

Cada uno: generate 1024×1024 → tight-bbox crop → scale to final size.
Uso: python generate-individual-assets.py [job_id|all]
"""
import sys, os, json, base64, urllib.request, urllib.error
import numpy as np
from PIL import Image

KEY_PATH    = r"C:\Users\fredy\.claude\openai_key"
REVIEW      = r"c:\VIINZO\Juego-AI\docs\08-assets\review"
ASSETS      = r"c:\VIINZO\Juego-AI\frontend\public\assets"
PROMPT_BASE = r"c:\VIINZO\Juego-AI\docs\08-assets\prompts"
WHITE_TH    = 40

JOBS = [
    # --- PICKUPS ---
    {
        "id":          "pickup-ammo3",
        "prompt_file": rf"{PROMPT_BASE}\pickups\pickup-ammo3.json",
        "draft":       rf"{REVIEW}\pickup-ammo3-draft.png",
        "out":         rf"{ASSETS}\pickups\pickup-ammo3.png",
        "size":        (48, 48),
        "api_size":    "1024x1024",
        "crop_mode":   "fit",
    },
    {
        "id":          "pickup-ammo5",
        "prompt_file": rf"{PROMPT_BASE}\pickups\pickup-ammo5.json",
        "draft":       rf"{REVIEW}\pickup-ammo5-draft.png",
        "out":         rf"{ASSETS}\pickups\pickup-ammo5.png",
        "size":        (48, 48),
        "api_size":    "1024x1024",
        "crop_mode":   "fit",
    },
    {
        "id":          "pickup-ammo10",
        "prompt_file": rf"{PROMPT_BASE}\pickups\pickup-ammo10.json",
        "draft":       rf"{REVIEW}\pickup-ammo10-draft.png",
        "out":         rf"{ASSETS}\pickups\pickup-ammo10.png",
        "size":        (64, 64),
        "api_size":    "1024x1024",
        "crop_mode":   "fit",
    },
    {
        "id":          "pickup-wall2",
        "prompt_file": rf"{PROMPT_BASE}\pickups\pickup-wall2.json",
        "draft":       rf"{REVIEW}\pickup-wall2-draft.png",
        "out":         rf"{ASSETS}\pickups\pickup-wall2.png",
        "size":        (48, 48),
        "api_size":    "1024x1024",
        "crop_mode":   "fit",
    },
    {
        "id":          "pickup-wall5",
        "prompt_file": rf"{PROMPT_BASE}\pickups\pickup-wall5.json",
        "draft":       rf"{REVIEW}\pickup-wall5-draft.png",
        "out":         rf"{ASSETS}\pickups\pickup-wall5.png",
        "size":        (64, 64),
        "api_size":    "1024x1024",
        "crop_mode":   "fit",
    },
    # --- UI ICONS ---
    {
        "id":          "ui-bullet-icon",
        "prompt_file": rf"{PROMPT_BASE}\ui\ui-bullet-icon.json",
        "draft":       rf"{REVIEW}\ui-bullet-icon-draft.png",
        "out":         rf"{ASSETS}\ui\ui-bullet-icon.png",
        "size":        (24, 24),
        "api_size":    "1024x1024",
        "crop_mode":   "fit",
    },
    {
        "id":          "ui-wall-charge-icon",
        "prompt_file": rf"{PROMPT_BASE}\ui\ui-wall-charge-icon.json",
        "draft":       rf"{REVIEW}\ui-wall-charge-icon-draft.png",
        "out":         rf"{ASSETS}\ui\ui-wall-charge-icon.png",
        "size":        (24, 24),
        "api_size":    "1024x1024",
        "crop_mode":   "fit",
    },
    {
        "id":          "ui-coin-icon",
        "prompt_file": rf"{PROMPT_BASE}\ui\ui-coin-icon.json",
        "draft":       rf"{REVIEW}\ui-coin-icon-draft.png",
        "out":         rf"{ASSETS}\ui\ui-coin-icon.png",
        "size":        (24, 24),
        "api_size":    "1024x1024",
        "crop_mode":   "fit",
    },
    # --- MUROS — fill_width: escala al ancho completo, recorta altura sobrante ---
    {
        "id":          "wall-h-hp3",
        "prompt_file": rf"{PROMPT_BASE}\environment\wall-h-hp3.json",
        "draft":       rf"{REVIEW}\wall-h-hp3-draft.png",
        "out":         rf"{ASSETS}\walls\wall-h-hp3.png",
        "size":        (128, 32),
        "api_size":    "1024x1024",
        "crop_mode":   "fill_width",
    },
    {
        "id":          "wall-h-hp2",
        "prompt_file": rf"{PROMPT_BASE}\environment\wall-h-hp2.json",
        "draft":       rf"{REVIEW}\wall-h-hp2-draft.png",
        "out":         rf"{ASSETS}\walls\wall-h-hp2.png",
        "size":        (128, 32),
        "api_size":    "1024x1024",
        "crop_mode":   "fill_width",
    },
    {
        "id":          "wall-h-hp1",
        "prompt_file": rf"{PROMPT_BASE}\environment\wall-h-hp1.json",
        "draft":       rf"{REVIEW}\wall-h-hp1-draft.png",
        "out":         rf"{ASSETS}\walls\wall-h-hp1.png",
        "size":        (128, 32),
        "api_size":    "1024x1024",
        "crop_mode":   "fill_width",
    },
]

# -----------------------------------------------------------------------
def api_generate(prompt, api_size, out_path):
    key = open(KEY_PATH).read().strip()
    payload = json.dumps({
        "model":         "gpt-image-1",
        "prompt":        prompt,
        "size":          api_size,
        "quality":       "low",
        "output_format": "png",
        "n":             1,
    }).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=payload,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP ERROR {e.code}: {e.read().decode()}")
        return False

    item = result["data"][0]
    img_bytes = base64.b64decode(item["b64_json"]) if "b64_json" in item else \
                urllib.request.urlopen(item["url"]).read()

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(img_bytes)
    print(f"  Draft guardado ({len(img_bytes)//1024} KB): {out_path}")
    return True


def content_mask(arr):
    r, g, b, a = (arr[:,:,i].astype(int) for i in range(4))
    not_white = (255-r > WHITE_TH) | (255-g > WHITE_TH) | (255-b > WHITE_TH)
    return not_white & (a > 50)


def tight_bbox(mask):
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not rows.any():
        return None
    t = int(np.argmax(rows));         b = int(len(rows) - np.argmax(rows[::-1]))
    l = int(np.argmax(cols));         r = int(len(cols) - np.argmax(cols[::-1]))
    return l, t, r, b


def extract(draft_path, out_path, target_size, crop_mode="fit"):
    """
    crop_mode:
      "fit"        — escala para caber dentro del canvas, centra con padding
      "fill_width" — escala para llenar el ancho completo, recorta altura sobrante
                     (correcto para muros 128×32 con ratio 4:1)
    """
    img  = Image.open(draft_path).convert("RGBA")
    arr  = np.array(img)
    mask = content_mask(arr)
    bbox = tight_bbox(mask)
    if bbox is None:
        print(f"  AVISO: sin contenido en {draft_path}")
        return
    l, t, r, b = bbox
    cropped = Image.fromarray(arr[t:b, l:r])
    cw, ch  = cropped.size
    tw, th  = target_size

    if crop_mode == "fill_width":
        # Escalar para que el ancho sea exactamente tw
        scale = tw / cw
        nw    = tw
        nh    = max(1, int(round(ch * scale)))
        scaled = cropped.resize((nw, nh), Image.LANCZOS)
        # Recortar al centro si la altura excede th; pad si es menor
        canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
        if nh >= th:
            # Recortar: tomar th píxeles del centro vertical
            y0 = (nh - th) // 2
            region = scaled.crop((0, y0, nw, y0 + th))
            canvas.paste(region, (0, 0))
        else:
            # Pad vertical
            canvas.paste(scaled, (0, (th - nh) // 2))
    else:  # "fit"
        scale  = min(tw / cw, th / ch)
        nw, nh = max(1, int(round(cw * scale))), max(1, int(round(ch * scale)))
        scaled = cropped.resize((nw, nh), Image.LANCZOS)
        canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
        canvas.paste(scaled, ((tw - nw) // 2, (th - nh) // 2))

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    canvas.save(out_path, "PNG")
    print(f"  Asset final [{crop_mode}]: {out_path}  ({tw}×{th})")


def run(job):
    print(f"\n[{job['id']}]")
    with open(job["prompt_file"]) as f:
        data = json.load(f)
    frame  = data["frames"][0]
    prompt = frame["prompt"]
    neg    = frame.get("negative_prompt", "")
    if neg:
        prompt += f"\n\nNEGATIVE: {neg}"

    if api_generate(prompt, job["api_size"], job["draft"]):
        extract(job["draft"], job["out"], job["size"], job.get("crop_mode", "fit"))


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else "all"
    jobs_to_run = JOBS if arg == "all" else [j for j in JOBS if j["id"] == arg]
    if not jobs_to_run:
        print(f"Job '{arg}' no encontrado. IDs: {[j['id'] for j in JOBS]}")
        sys.exit(1)
    for job in jobs_to_run:
        run(job)
    print("\n=== Listo ===")
