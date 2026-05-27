"""
Extrae body y cañón del tanque desde imagen combinada 1536×1024.
1. Encuentra el gap vacío real entre los dos sprites (no divide a la mitad)
2. Corta exactamente al bounding box de contenido
3. Escala manteniendo proporción y centra en el canvas objetivo
"""
from PIL import Image
import numpy as np
import sys

SRC        = r"c:\VIINZO\Juego-AI\docs\08-assets\review\tank-default-group-draft.png"
OUT_BODY   = r"c:\VIINZO\Juego-AI\frontend\public\assets\tanks\tank-default-body.png"
OUT_CANNON = r"c:\VIINZO\Juego-AI\frontend\public\assets\tanks\tank-default-cannon.png"
OUT_BODY_PREVIEW   = r"c:\VIINZO\Juego-AI\docs\08-assets\review\tank-default-body-draft.png"
OUT_CANNON_PREVIEW = r"c:\VIINZO\Juego-AI\docs\08-assets\review\tank-default-cannon-draft.png"

BODY_SIZE   = (128, 128)
CANNON_SIZE = (64, 64)

# Un píxel es "contenido" si se aleja del blanco más de este umbral en cualquier canal
WHITE_THRESHOLD = 40


def content_mask(arr_rgba):
    """Retorna bool mask 2D: True donde hay contenido (no blanco, no transparente)."""
    r, g, b, a = arr_rgba[:,:,0], arr_rgba[:,:,1], arr_rgba[:,:,2], arr_rgba[:,:,3]
    not_white = (
        (255 - r.astype(int) > WHITE_THRESHOLD) |
        (255 - g.astype(int) > WHITE_THRESHOLD) |
        (255 - b.astype(int) > WHITE_THRESHOLD)
    )
    visible = a > 50
    return not_white & visible


def tight_bbox(mask):
    """Bounding box del contenido True en la máscara."""
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    top    = int(np.argmax(rows))
    bottom = int(len(rows) - np.argmax(rows[::-1]))
    left   = int(np.argmax(cols))
    right  = int(len(cols) - np.argmax(cols[::-1]))
    return left, top, right, bottom


def find_gap_column(mask):
    """
    Encuentra la columna central del gap vacío entre los dos sprites.
    Busca la franja de columnas consecutivas sin contenido, toma su centro.
    """
    col_has_content = np.any(mask, axis=0)   # True si esa columna tiene contenido
    W = len(col_has_content)

    # Buscar el segmento vacío más largo en la zona central (25%-75%)
    mid_start = W // 4
    mid_end   = 3 * W // 4

    best_start = None
    best_len   = 0
    cur_start  = None

    for x in range(mid_start, mid_end):
        if not col_has_content[x]:
            if cur_start is None:
                cur_start = x
        else:
            if cur_start is not None:
                length = x - cur_start
                if length > best_len:
                    best_len   = length
                    best_start = cur_start
                cur_start = None

    if cur_start is not None:
        length = mid_end - cur_start
        if length > best_len:
            best_len   = length
            best_start = cur_start

    if best_start is None:
        print("  AVISO: no se encontró gap vacío, usando mitad exacta")
        return W // 2

    split_col = best_start + best_len // 2
    print(f"  Gap vacío: columnas {best_start}–{best_start+best_len}  →  split en columna {split_col}")
    return split_col


def crop_and_scale(img_rgba_arr, bbox, target_size):
    """
    Recorta exacto al bbox, escala proporcionalmente para rellenar el target
    al máximo sin distorsionar, centra en canvas transparente del target.
    """
    l, t, r, b = bbox
    cropped = Image.fromarray(img_rgba_arr[t:b, l:r])
    cw, ch  = cropped.size

    # Escala para encajar en target manteniendo proporción
    tw, th = target_size
    scale  = min(tw / cw, th / ch)
    new_w  = int(round(cw * scale))
    new_h  = int(round(ch * scale))
    scaled = cropped.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
    ox = (tw - new_w) // 2
    oy = (th - new_h) // 2
    canvas.paste(scaled, (ox, oy))
    return canvas


def main():
    img  = Image.open(SRC).convert("RGBA")
    arr  = np.array(img)
    H, W = arr.shape[:2]
    print(f"Imagen fuente: {W}×{H}")

    mask = content_mask(arr)

    # 1. Encontrar el split real entre body y cannon
    split = find_gap_column(mask)

    # 2. Body — mitad izquierda hasta el split
    mask_body = mask[:, :split]
    bbox_body = tight_bbox(mask_body)
    print(f"\nBody  → bbox en su zona: {bbox_body}  tamaño: {bbox_body[2]-bbox_body[0]}×{bbox_body[3]-bbox_body[1]}")
    body_img = crop_and_scale(arr[:, :split], bbox_body, BODY_SIZE)
    body_img.save(OUT_BODY, "PNG")
    body_img.save(OUT_BODY_PREVIEW, "PNG")
    print(f"  Guardado: {OUT_BODY}")

    # 3. Cannon — mitad derecha desde el split
    mask_cannon = mask[:, split:]
    bbox_cannon = tight_bbox(mask_cannon)
    print(f"\nCañón → bbox en su zona: {bbox_cannon}  tamaño: {bbox_cannon[2]-bbox_cannon[0]}×{bbox_cannon[3]-bbox_cannon[1]}")
    cannon_img = crop_and_scale(arr[:, split:], bbox_cannon, CANNON_SIZE)
    cannon_img.save(OUT_CANNON, "PNG")
    cannon_img.save(OUT_CANNON_PREVIEW, "PNG")
    print(f"  Guardado: {OUT_CANNON}")

    print("\nListo.")


if __name__ == "__main__":
    main()
