"""
Extracción batch de sprites para Arena Siege Tanks.

Modos:
  - TANK_GROUP   : imagen con body (izq) + cañón (der) separados por gap horizontal
  - PARTICLES    : imagen con 3 sprites apilados verticalmente (smoke, dot, spark)
"""
from PIL import Image
import numpy as np
import os

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
REVIEW_DIR = r"c:\VIINZO\Juego-AI\docs\08-assets\review"
ASSETS     = r"c:\VIINZO\Juego-AI\frontend\public\assets"

WHITE_THRESHOLD = 40   # diferencia mínima de cualquier canal RGB vs 255

# ---------------------------------------------------------------------------
# Trabajos definidos
# ---------------------------------------------------------------------------
TANK_GROUPS = [
    {
        "src":    "tank-bot-group-draft.png",
        "body":   f"{ASSETS}/tanks/tank-bot-body.png",
        "cannon": f"{ASSETS}/tanks/tank-bot-cannon.png",
        "body_preview":   f"{REVIEW_DIR}/tank-bot-body-draft.png",
        "cannon_preview": f"{REVIEW_DIR}/tank-bot-cannon-draft.png",
    },
    {
        "src":    "tank-inferno-group-draft.png",
        "body":   f"{ASSETS}/tanks/skins/tank-inferno-body.png",
        "cannon": f"{ASSETS}/tanks/skins/tank-inferno-cannon.png",
        "body_preview":   f"{REVIEW_DIR}/tank-inferno-body-draft.png",
        "cannon_preview": f"{REVIEW_DIR}/tank-inferno-cannon-draft.png",
    },
    {
        "src":    "tank-aurora-group-draft.png",
        "body":   f"{ASSETS}/tanks/skins/tank-aurora-body.png",
        "cannon": f"{ASSETS}/tanks/skins/tank-aurora-cannon.png",
        "body_preview":   f"{REVIEW_DIR}/tank-aurora-body-draft.png",
        "cannon_preview": f"{REVIEW_DIR}/tank-aurora-cannon-draft.png",
    },
    {
        "src":    "tank-void-group-draft.png",
        "body":   f"{ASSETS}/tanks/skins/tank-void-body.png",
        "cannon": f"{ASSETS}/tanks/skins/tank-void-cannon.png",
        "body_preview":   f"{REVIEW_DIR}/tank-void-body-draft.png",
        "cannon_preview": f"{REVIEW_DIR}/tank-void-cannon-draft.png",
    },
    {
        "src":    "tank-chrome-group-draft.png",
        "body":   f"{ASSETS}/tanks/skins/tank-chrome-body.png",
        "cannon": f"{ASSETS}/tanks/skins/tank-chrome-cannon.png",
        "body_preview":   f"{REVIEW_DIR}/tank-chrome-body-draft.png",
        "cannon_preview": f"{REVIEW_DIR}/tank-chrome-cannon-draft.png",
    },
]

PARTICLES_JOB = {
    "src": "particles-group-draft.png",
    "sprites": [
        {"out": f"{ASSETS}/effects/particle-smoke.png",    "size": (32, 32)},
        {"out": f"{ASSETS}/effects/particle-dot.png",      "size": (12, 12)},
        {"out": f"{ASSETS}/effects/particle-spark.png",    "size": (8,  8)},
    ],
}

BODY_SIZE   = (128, 128)
CANNON_SIZE = (64,  64)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def content_mask(arr):
    """Bool mask 2D: True donde hay contenido (no blanco, no transparente)."""
    r = arr[:, :, 0].astype(int)
    g = arr[:, :, 1].astype(int)
    b = arr[:, :, 2].astype(int)
    a = arr[:, :, 3].astype(int)
    not_white = (255 - r > WHITE_THRESHOLD) | (255 - g > WHITE_THRESHOLD) | (255 - b > WHITE_THRESHOLD)
    return not_white & (a > 50)


def tight_bbox(mask):
    """Bounding box del contenido True en la máscara (left, top, right, bottom)."""
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not rows.any():
        return None
    top    = int(np.argmax(rows))
    bottom = int(len(rows)    - np.argmax(rows[::-1]))
    left   = int(np.argmax(cols))
    right  = int(len(cols)    - np.argmax(cols[::-1]))
    return left, top, right, bottom


def find_gap_axis(has_content, zone_start, zone_end):
    """
    Busca el segmento vacío más largo entre zone_start y zone_end
    en el array 1D `has_content` (True = tiene contenido).
    Devuelve el centro del gap o la mitad de la zona si no encuentra nada.
    """
    best_start, best_len, cur_start = None, 0, None
    for i in range(zone_start, zone_end):
        if not has_content[i]:
            if cur_start is None:
                cur_start = i
        else:
            if cur_start is not None:
                length = i - cur_start
                if length > best_len:
                    best_len   = length
                    best_start = cur_start
                cur_start = None
    if cur_start is not None:
        length = zone_end - cur_start
        if length > best_len:
            best_len, best_start = length, cur_start

    if best_start is None:
        return (zone_start + zone_end) // 2
    return best_start + best_len // 2


def scale_into_canvas(arr_slice, bbox, target_size):
    """
    Recorta exacto al bbox, escala proporcionalmente al máximo,
    centra en canvas transparente del tamaño objetivo.
    """
    l, t, r, b = bbox
    cropped = Image.fromarray(arr_slice[t:b, l:r])
    cw, ch  = cropped.size
    tw, th  = target_size
    scale   = min(tw / cw, th / ch)
    nw, nh  = max(1, int(round(cw * scale))), max(1, int(round(ch * scale)))
    scaled  = cropped.resize((nw, nh), Image.LANCZOS)
    canvas  = Image.new("RGBA", target_size, (0, 0, 0, 0))
    canvas.paste(scaled, ((tw - nw) // 2, (th - nh) // 2))
    return canvas


def save(img, *paths):
    for p in paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        img.save(p, "PNG")
        print(f"    → {p}")


# ---------------------------------------------------------------------------
# Tank group (body izq / cañón der)
# ---------------------------------------------------------------------------
def process_tank_group(job):
    src_path = os.path.join(REVIEW_DIR, job["src"])
    print(f"\n[TANK] {job['src']}")

    img = Image.open(src_path).convert("RGBA")
    arr = np.array(img)
    H, W = arr.shape[:2]

    mask = content_mask(arr)
    col_has_content = np.any(mask, axis=0)

    split = find_gap_axis(col_has_content, W // 4, 3 * W // 4)
    print(f"  Split en columna {split} (imagen {W}×{H})")

    # Body
    mask_body = mask[:, :split]
    bbox_body = tight_bbox(mask_body)
    print(f"  Body bbox: {bbox_body}  ({bbox_body[2]-bbox_body[0]}×{bbox_body[3]-bbox_body[1]})")
    body_img = scale_into_canvas(arr[:, :split], bbox_body, BODY_SIZE)
    save(body_img, job["body"], job["body_preview"])

    # Cannon
    mask_cannon = mask[:, split:]
    bbox_cannon = tight_bbox(mask_cannon)
    print(f"  Cañón bbox: {bbox_cannon}  ({bbox_cannon[2]-bbox_cannon[0]}×{bbox_cannon[3]-bbox_cannon[1]})")
    cannon_img = scale_into_canvas(arr[:, split:], bbox_cannon, CANNON_SIZE)
    save(cannon_img, job["cannon"], job["cannon_preview"])


# ---------------------------------------------------------------------------
# Particles (3 sprites apilados verticalmente)
# ---------------------------------------------------------------------------
def process_particles(job):
    src_path = os.path.join(REVIEW_DIR, job["src"])
    print(f"\n[PARTICLES] {job['src']}")

    img = Image.open(src_path).convert("RGBA")
    arr = np.array(img)
    H, W = arr.shape[:2]

    mask = content_mask(arr)
    row_has_content = np.any(mask, axis=1)

    sprites  = job["sprites"]
    n        = len(sprites)
    segments = []   # (top, bottom) de cada sprite

    # Encontrar n-1 gaps horizontales que separan los n sprites
    search_start = 0
    for i in range(n - 1):
        # Zona de búsqueda: desde donde terminó el último segmento hasta el final proporcional
        zone_s = search_start
        zone_e = H * (i + 1) // n
        # Ampliar zona_e si no cubre suficiente
        zone_e = max(zone_e, search_start + (H - search_start) // (n - i))
        zone_e = min(zone_e, H)

        gap_center = find_gap_axis(row_has_content, zone_s, zone_e)
        segments.append(search_start)
        segments.append(gap_center)   # marca el corte
        search_start = gap_center
        print(f"  Gap {i+1}: fila {gap_center}")

    # Convertir a (top, bottom) por sprite
    cuts = [0]
    for i in range(n - 1):
        zone_s = cuts[-1] + (H - cuts[-1]) // (n - i) // 2
        zone_e = cuts[-1] + (H - cuts[-1]) * 3 // (n - i) // 2
        zone_e = min(zone_e, H)
        zone_s = max(zone_s, cuts[-1] + 1)
        g = find_gap_axis(row_has_content, zone_s, zone_e)
        cuts.append(g)
    cuts.append(H)

    print(f"  Cortes verticales: {cuts}")

    for i, spr in enumerate(sprites):
        t, b  = cuts[i], cuts[i + 1]
        slice_arr  = arr[t:b, :, :]
        slice_mask = mask[t:b, :]
        bbox = tight_bbox(slice_mask)
        if bbox is None:
            print(f"  AVISO: sprite {i} sin contenido detectado, saltando")
            continue
        print(f"  Sprite {i} ({os.path.basename(spr['out'])}): bbox {bbox}  ({bbox[2]-bbox[0]}×{bbox[3]-bbox[1]})")
        result = scale_into_canvas(slice_arr, bbox, spr["size"])
        save(result, spr["out"])


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    for job in TANK_GROUPS:
        process_tank_group(job)

    process_particles(PARTICLES_JOB)

    print("\n=== Listo ===")
