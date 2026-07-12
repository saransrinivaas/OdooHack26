"""Bridge to your existing driving-licence OCR (repo-root ocr_test.py).

We import your parser as-is so the platform's document verification uses the
exact same logic (parse_license, validate_license, Tier-2 checks) you already
built and tested — no duplication, no drift.
"""
import os
import sys
import tempfile

from ..config import REPO_ROOT

# Make the repo-root modules importable
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

# OCR.space free tier rejects files > 1 MB (HTTP 413). Keep a safety margin.
OCR_SIZE_LIMIT = 1_000_000
OCR_TARGET_BYTES = 950_000

try:
    from PIL import Image
    PIL_AVAILABLE = True
except Exception:  # pragma: no cover
    PIL_AVAILABLE = False


def _prepare_image(image_path: str):
    """Return (path_to_send, is_temp). If the image is over the OCR size limit,
    down-convert it to a compressed JPEG under the limit and return that temp
    path (caller deletes it). Small images are sent untouched."""
    try:
        size = os.path.getsize(image_path)
    except OSError:
        return image_path, False
    if size <= OCR_SIZE_LIMIT or not PIL_AVAILABLE:
        return image_path, False

    img = Image.open(image_path)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    w, h = img.size
    scale, quality = 1.0, 85
    last_tmp = None
    for _ in range(8):
        tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        tmp.close()
        resized = img if scale == 1.0 else img.resize(
            (max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
        resized.save(tmp.name, "JPEG", quality=quality, optimize=True)
        if last_tmp:
            os.unlink(last_tmp)
        last_tmp = tmp.name
        if os.path.getsize(tmp.name) <= OCR_TARGET_BYTES:
            return tmp.name, True
        scale *= 0.8                       # shrink dimensions
        if quality > 55:
            quality -= 10                  # and lower quality a touch
    return last_tmp, True                  # best effort — smallest we produced

try:
    import ocr_test  # your existing OCR script
    OCR_AVAILABLE = True
except Exception as exc:  # pragma: no cover
    ocr_test = None
    OCR_AVAILABLE = False
    _IMPORT_ERROR = str(exc)


def _iso(d):
    return d.isoformat() if d else None


def scan_licence(image_path: str) -> dict:
    """Run your OCR + Tier-2 validation on an image and return a JSON-safe dict.

    Shape:
      {
        "is_licence": bool,
        "fields": {name, license_no, issue_date, validity, dob, classes[]},
        "masked": [...],
        "verdict": {"name","icon","message"},
        "checks": [{"label","status","detail"}, ...],
        "error": <str or None>,
      }
    """
    if not OCR_AVAILABLE:
        return {"is_licence": False, "error": f"OCR module unavailable: {_IMPORT_ERROR}"}

    send_path, is_temp = _prepare_image(image_path)
    try:
        text = ocr_test.run_ocr_space(send_path)
    finally:
        if is_temp:
            try:
                os.unlink(send_path)
            except OSError:
                pass

    if text is None:
        hint = ""
        try:
            if os.path.getsize(image_path) > OCR_SIZE_LIMIT and not PIL_AVAILABLE:
                hint = " Image is over 1 MB and Pillow isn't installed to shrink it — install Pillow or upload a smaller image."
        except OSError:
            pass
        return {"is_licence": False,
                "error": "OCR request failed (check OCR_SPACE_API_KEY / network)." + hint}
    if not text or not ocr_test.is_driver_license(text):
        return {"is_licence": False,
                "error": "Not recognised as a driving licence."}

    parsed = ocr_test.parse_license(text)
    masked = ocr_test.masked_fields(parsed)
    validation = ocr_test.validate_license(parsed, masked)
    name, icon, message = validation["verdict"]

    fields = {
        "name": parsed.get("name"),
        "license_no": parsed.get("license_no"),
        "issue_date": _iso(parsed.get("issue_date")),
        "validity": _iso(parsed.get("validity")),
        "dob": _iso(parsed.get("dob")),
        "classes": parsed.get("classes", []),
    }
    checks = [{"label": l, "status": s, "detail": d}
              for (l, s, d) in validation["checks"]]

    return {
        "is_licence": True,
        "fields": fields,
        "masked": masked,
        "verdict": {"name": name, "icon": icon, "message": message},
        "checks": checks,
        "error": None,
    }
