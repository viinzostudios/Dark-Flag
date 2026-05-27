"""
Genera assets con gpt-image-1 usando los prompts JSON del proyecto.
Uso: python generate-assets.py <job_name>
"""
import sys, os, json, base64, urllib.request, urllib.error

KEY_PATH  = r"C:\Users\fredy\.claude\openai_key"
REVIEW    = r"c:\VIINZO\Juego-AI\docs\08-assets\review"
PROMPT_BASE = r"c:\VIINZO\Juego-AI\docs\08-assets\prompts"

JOBS = {
    "pickups": {
        "prompt_file": rf"{PROMPT_BASE}\pickups\pickup-ammo3.json",
        "out":         rf"{REVIEW}\pickups-grid-draft.png",
        "size":        "1024x1024",
    },
    "ui-icons": {
        "prompt_file": rf"{PROMPT_BASE}\ui\ui-bullet-icon.json",
        "out":         rf"{REVIEW}\ui-icons-grid-draft.png",
        "size":        "1024x1024",
    },
    "walls": {
        "prompt_file": rf"{PROMPT_BASE}\environment\wall-h-hp3.json",
        "out":         rf"{REVIEW}\wall-h-states-draft.png",
        "size":        "1536x1024",
    },
}


def generate(job_name):
    job  = JOBS[job_name]
    key  = open(KEY_PATH).read().strip()

    with open(job["prompt_file"]) as f:
        data = json.load(f)

    prompt = data["frames"][0]["prompt"]
    neg    = data["frames"][0].get("negative_prompt", "")
    full_prompt = prompt
    if neg:
        full_prompt += f"\n\nNEGATIVE: {neg}"

    print(f"Generando '{job_name}' ({job['size']}) …")
    print(f"  Output: {job['out']}")

    payload = json.dumps({
        "model":           "gpt-image-1",
        "prompt":          full_prompt,
        "size":            job["size"],
        "quality":         "low",
        "output_format":   "png",
        "n":               1,
    }).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data    = payload,
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type":  "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ERROR HTTP {e.code}: {body}")
        sys.exit(1)

    # gpt-image-1 devuelve b64_json o url
    item = result["data"][0]
    if "b64_json" in item:
        img_bytes = base64.b64decode(item["b64_json"])
    elif "url" in item:
        with urllib.request.urlopen(item["url"]) as r:
            img_bytes = r.read()
    else:
        print("  ERROR: respuesta sin imagen")
        sys.exit(1)

    os.makedirs(os.path.dirname(job["out"]), exist_ok=True)
    with open(job["out"], "wb") as f:
        f.write(img_bytes)
    print(f"  Guardado ({len(img_bytes)//1024} KB)")


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in JOBS:
        print(f"Uso: python generate-assets.py <{'|'.join(JOBS)}>")
        sys.exit(1)
    generate(sys.argv[1])
