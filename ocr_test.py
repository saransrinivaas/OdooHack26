import os
import re
import glob
import requests
from datetime import date
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
load_dotenv()
API_KEY = os.getenv("OCR_SPACE_API_KEY")
if API_KEY:
    API_KEY = API_KEY.strip().strip('"').strip("'")

OCR_SPACE_URL = "https://api.ocr.space/parse/image"
SHOW_RAW = False       # set True to also print the raw OCR dump (debugging)
MASKED = "🔒 Masked"   # shown when a field is masked or unavailable

# Words that must appear for us to treat the document as a driving licence
DL_MARKERS = ("driving licence", "driving license", "driving lic", "dl no",
              "transport authority", "licence to drive")

# Labels that must NOT be mistaken for a name (used when the Name field is masked)
NAME_STOP_LABELS = ("date of birth", "dob", "son", "daughter", "wife", "father",
                    "blood", "address", "validity", "issue", "holder", "organ",
                    "emergency", "licensing", "class")

# Indian DL vehicle-class codes -> what the holder is permitted to drive
VEHICLE_CLASSES = {
    "MCWG": "Motorcycle with gear",
    "MCWOG": "Motorcycle without gear (scooter / moped)",
    "LMV": "Light Motor Vehicle (car / jeep)",
    "LMV-NT": "Light Motor Vehicle – Non-Transport",
    "LMV-TR": "Light Motor Vehicle – Transport",
    "HMV": "Heavy Motor Vehicle",
    "HGMV": "Heavy Goods Motor Vehicle",
    "HPMV": "Heavy Passenger Motor Vehicle",
    "HTV": "Heavy Transport Vehicle",
    "3W-NT": "Three-Wheeler (Non-Transport)",
    "3W-TR": "Three-Wheeler (Transport)",
    "TRANS": "Transport Vehicle",
    "TRACTOR": "Tractor",
    "INVCRG": "Invalid Carriage",
}

# Common OCR misreads seen on real licences -> canonical code above
OCR_ALIASES = {
    "MOWG": "MCWG",   # O misread for C
    "LIV": "LMV",     # M misread for I
    "LMY": "LMV",
    "HGV": "HGMV",
}

# Classes that require the holder to be at least 20 (transport / heavy vehicles)
TRANSPORT_CLASSES = {"HMV", "HGMV", "HPMV", "HTV", "LMV-TR", "TRANS", "3W-TR"}

# Valid Indian state / UT vehicle-registration (RTO) codes
VALID_STATE_CODES = {
    "AP", "AR", "AS", "BR", "CG", "GA", "GJ", "HR", "HP", "JH", "JK", "KA",
    "KL", "LA", "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "OR", "PB", "RJ",
    "SK", "TN", "TS", "TG", "TR", "UP", "UK", "UA", "WB",       # states
    "AN", "CH", "DN", "DD", "DL", "LD", "PY",                    # union territories
}


# ---------------------------------------------------------------------------
# OCR call
# ---------------------------------------------------------------------------
def run_ocr_space(image_path):
    """Return the raw extracted text, or None if the OCR call failed."""
    if not os.path.exists(image_path):
        print(f"❌ Error: File '{image_path}' not found in this folder.")
        return None
    if not API_KEY:
        print("❌ Error: OCR_SPACE_API_KEY value is missing in your .env file.")
        return None

    payload = {
        'apikey': API_KEY,
        'language': 'eng',
        'isOverlayRequired': False,
        'OCREngine': '2',  # Engine 2 handles IDs / dense text better
    }

    print(f"🚀 Submitting '{image_path}' to the OCR.space API...")
    try:
        with open(image_path, 'rb') as image_file:
            files_payload = {'file': (os.path.basename(image_path), image_file, 'image/jpeg')}
            response = requests.post(OCR_SPACE_URL, files=files_payload, data=payload, timeout=30)

        if response.status_code != 200:
            print(f"❌ Server Connection Error. HTTP Status Code: {response.status_code}")
            print(f"Raw Response Body: {response.text[:500]}")
            return None

        result_json = response.json()
        if result_json.get("OCRExitCode") != 1:
            print("\n❌ API Rejection Message:")
            print(result_json.get("ErrorMessage"))
            return None

        parsed_results = result_json.get("ParsedResults", [])
        if not parsed_results:
            return ""
        return parsed_results[0].get("ParsedText") or ""

    except requests.exceptions.JSONDecodeError:
        print("\n❌ Format Error: Received invalid non-JSON output.")
        print(f"Raw Output Snippet: {response.text[:300]}")
        return None
    except requests.exceptions.RequestException as net_err:
        print(f"\n❌ Network Layer Failure: {net_err}")
        return None


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------
def is_driver_license(text):
    low = text.lower()
    return any(marker in low for marker in DL_MARKERS)


def _looks_masked(s):
    """True if the string is empty or dominated by masking characters (XXXX, ****)."""
    if not s or not s.strip():
        return True
    return bool(re.search(r"[X✕*#•]{3,}", s, re.I)) or bool(re.fullmatch(r"[X\s*#•_.-]+", s, re.I))


def _clean_name(raw):
    val = re.sub(r"[^A-Za-z .']", " ", raw or "")
    val = re.sub(r"\s+", " ", val).strip()
    if not val or _looks_masked(val):
        return None
    return val


def _extract_name(text):
    """Read the name near 'Name:'. Returns the name, or None if masked/blank.

    Handles two layouts: value on the same line ("Name: JOHN"), or on the line
    below ("Name:\\nJOHN"). If the line below is another field label (e.g.
    "Date of Birth") the name has been masked, so we return None.
    """
    # [ \t]* (not \s*) so the same-line read never crosses the newline
    m = re.search(r"name[ \t]*[:\-][ \t]*([^\r\n]*)", text, re.I)
    if not m:
        return None
    same_line = _clean_name(m.group(1))
    if same_line:
        return same_line
    # Same line was blank -> peek at following lines, stopping at any label
    for line in text[m.end():].splitlines():
        s = line.strip()
        if not s:
            continue
        if any(s.lower().startswith(lbl) for lbl in NAME_STOP_LABELS):
            return None          # next real content is a label => masked
        return _clean_name(s)    # first plausible line (None if it's junk/masked)
    return None


def _to_date(raw):
    """Parse a 'DD-MM-YYYY' / 'DD/MM/YYYY' string into a date, or None."""
    parts = re.split(r'[-/]', raw)
    if len(parts) != 3:
        return None
    try:
        dd, mm, yy = (int(p) for p in parts)
        return date(yy, mm, dd)
    except ValueError:
        return None


def _find_dates(text):
    dates = []
    for m in re.finditer(r'\b\d{2}[-/]\d{2}[-/]\d{4}\b', text):
        d = _to_date(m.group(0))
        if d:
            dates.append(d)
    return dates


def _years_between(start, end):
    """Whole years from start date to end date."""
    return end.year - start.year - ((end.month, end.day) < (start.month, start.day))


def parse_license(text):
    data = {"name": None, "license_no": None, "issue_date": None,
            "validity": None, "dob": None, "classes": []}

    # Name (same-line only, so a masked/blank name is not confused with the next label)
    data["name"] = _extract_name(text)

    # Licence number  (e.g. "DL No : TN02 20240006663")
    m = re.search(r"DL\s*No\.?\s*:?\s*([A-Z]{2}[-\s]?\d{2}[-\s]?\d{4,})", text, re.I)
    if not m:
        m = re.search(r"\b([A-Z]{2}[-\s]?\d{2}[-\s]?\d{7,11})\b", text)
    if m:
        data["license_no"] = re.sub(r"\s+", " ", m.group(1)).strip()

    # Date of birth (kept for the age check)
    mdob = re.search(r"(?:date of birth|dob)\s*:?\s*(\d{2}[-/]\d{2}[-/]\d{4})", text, re.I)
    if mdob:
        data["dob"] = _to_date(mdob.group(1))

    # Dates: exclude DOB, then issue = earliest, validity = latest
    dates = sorted({d for d in _find_dates(text) if d != data["dob"]})
    if dates:
        data["issue_date"] = dates[0]
        data["validity"] = dates[-1]

    # Vehicle classes (canonical codes + known OCR misreads), min length 3
    upper = text.upper()
    lookup = {c: c for c in VEHICLE_CLASSES}
    lookup.update(OCR_ALIASES)
    seen = []
    for token, canon in lookup.items():
        if len(token) >= 3 and re.search(r"\b" + re.escape(token) + r"\b", upper):
            if canon not in seen:
                seen.append(canon)
    data["classes"] = seen
    return data


def masked_fields(data):
    """Return the human labels of any required field that is masked/unavailable."""
    labels = []
    if not data.get("name"):
        labels.append("Name")
    if not data.get("license_no"):
        labels.append("License Number")
    if not data.get("issue_date"):
        labels.append("Issue Date")
    if not data.get("validity"):
        labels.append("Validity")
    if not data.get("classes"):
        labels.append("Eligible Vehicle Classes")
    return labels


# ---------------------------------------------------------------------------
# Tier-2 authenticity / consistency validation
# ---------------------------------------------------------------------------
def validate_license(data, masked):
    """Pure-logic plausibility checks. Returns {'verdict':..., 'checks':[...]}.

    NOTE: proves *consistency*, not authenticity. Only a check against the
    issuing authority (Parivahan / DigiLocker) is real proof. See README.
    """
    checks = []          # (label, status, detail) with status in pass/fail/warn
    hard_fail = False
    soft_flag = False

    def add(label, status, detail):
        nonlocal hard_fail, soft_flag
        checks.append((label, status, detail))
        if status == "fail":
            hard_fail = True
        elif status == "warn":
            soft_flag = True

    # --- 0. Masking / completeness -----------------------------------------
    if masked:
        add("Document completeness", "warn", "masked / unavailable: " + ", ".join(masked))

    # --- 1. DL-number format + state code + embedded year ------------------
    lic = re.sub(r"[\s-]", "", (data.get("license_no") or "")).upper()
    dl_year = None
    if len(lic) >= 12 and lic[:2].isalpha() and lic[2:4].isdigit() and lic[4:8].isdigit():
        state, rto, year_seg = lic[:2], lic[2:4], lic[4:8]
        if state in VALID_STATE_CODES:
            add("State / RTO code", "pass", f"{state} is a valid state (RTO {rto})")
        else:
            add("State / RTO code", "fail", f"'{state}' is not a valid Indian state code")
        if 1980 <= int(year_seg) <= date.today().year:
            dl_year = int(year_seg)
            add("DL-number year", "pass", f"embedded year {dl_year} is plausible")
        else:
            add("DL-number year", "fail", f"embedded year '{year_seg}' is implausible")
    elif data.get("license_no"):
        add("DL-number format", "warn",
            f"'{data['license_no']}' doesn't fit SS RR YYYY NNNNNNN (possible OCR error)")

    # --- 2. issue < validity, and a sane span ------------------------------
    iss, val = data.get("issue_date"), data.get("validity")
    if iss and val:
        if iss < val:
            add("Issue < Validity", "pass", f"{iss:%d-%m-%Y} is before {val:%d-%m-%Y}")
        else:
            add("Issue < Validity", "fail", f"issue {iss:%d-%m-%Y} is not before validity {val:%d-%m-%Y}")
        span = _years_between(iss, val)
        if span < 0 or span > 30:
            add("Validity span", "fail", f"{span} yrs between issue and validity is implausible")
        else:
            add("Validity span", "pass", f"{span} yrs (within the normal range)")

    # --- 3. DL-number year vs issue year -----------------------------------
    if dl_year and iss:
        if dl_year == iss.year:
            add("Year cross-check", "pass", f"DL-number year matches issue year {iss.year}")
        else:
            add("Year cross-check", "warn", f"DL-number year {dl_year} != issue year {iss.year}")

    # --- 4. Age vs class of vehicle ----------------------------------------
    dob = data.get("dob")
    needs_transport = any(c in TRANSPORT_CLASSES for c in data.get("classes", []))
    min_age = 20 if needs_transport else 18
    if dob:
        ref = iss or date.today()
        age = _years_between(dob, ref)
        if age >= min_age:
            add("Age vs class", "pass", f"age {age} at issue ≥ {min_age} required")
        else:
            add("Age vs class", "fail", f"age {age} at issue is below the {min_age} required for these classes")
    else:
        add("Age vs class", "warn", "date of birth not detected — cannot verify age")

    # --- Verdict -----------------------------------------------------------
    if hard_fail:
        verdict = ("SUSPECT", "❌", "Fails one or more consistency rules — likely invalid / forged")
    elif soft_flag:
        verdict = ("NEEDS REVIEW", "⚠️", "Some fields could not be verified — manual review advised")
    else:
        verdict = ("VERIFIED", "✅", "Passes all internal consistency checks")
    return {"verdict": verdict, "checks": checks}


# ---------------------------------------------------------------------------
# Display
# ---------------------------------------------------------------------------
def _fmt(d):
    return d.strftime("%d-%m-%Y") if d else MASKED


def display(data):
    print("\n✅ Valid Driver's License Detected\n")
    print(f"  {'Name':<18}: {data['name'] or MASKED}")
    print(f"  {'License Number':<18}: {data['license_no'] or MASKED}")
    print(f"  {'Issue Date':<18}: {_fmt(data['issue_date'])}")
    print(f"  {'Validity':<18}: {_fmt(data['validity'])}")

    if data["validity"]:
        if data["validity"] >= date.today():
            status = f"✅ Active (valid until {_fmt(data['validity'])})"
        else:
            status = f"❌ Expired (expired on {_fmt(data['validity'])})"
    else:
        status = f"{MASKED} (validity date not readable)"
    print(f"  {'Status':<18}: {status}")

    print(f"  {'Eligible To Drive':<18}:")
    if data["classes"]:
        for c in data["classes"]:
            print(f"      • {c} — {VEHICLE_CLASSES.get(c, 'Unknown category')}")
    else:
        print(f"      • {MASKED}")


def display_validation(result):
    print("\n  🔎 Authenticity — Tier-2 consistency checks")
    mark = {"pass": "✅", "fail": "❌", "warn": "⚠️"}
    for label, status, detail in result["checks"]:
        print(f"      {mark[status]} {label}: {detail}")
    name, icon, msg = result["verdict"]
    print(f"\n  Verdict: {icon} {name} — {msg}")


def display_masked_notice(masked):
    if masked:
        print(f"\n  ⚠️  This document is partially masked ({', '.join(masked)}).")
        print("      Kindly upload an unmasked version for complete verification.")
    print()


# ---------------------------------------------------------------------------
# Sample selection
# ---------------------------------------------------------------------------
def choose_sample():
    samples = sorted(glob.glob("sample*.jpg") + glob.glob("sample*.jpeg") + glob.glob("sample*.png"))
    if not samples:
        print("❌ No sample images found (expected sample1.jpg, sample2.jpg, ...).")
        return None

    print("\n📂 Available documents:")
    for i, s in enumerate(samples, 1):
        print(f"   {i}. {s}")

    while True:
        try:
            choice = input(f"\nSelect a document to scan (1-{len(samples)}): ").strip()
        except EOFError:
            print(f"(no input — defaulting to {samples[0]})")
            return samples[0]
        if choice.isdigit() and 1 <= int(choice) <= len(samples):
            return samples[int(choice) - 1]
        print("   Please enter a valid number.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    image = choose_sample()
    if image:
        text = run_ocr_space(image)
        if text is not None:
            if SHOW_RAW:
                print("\n--- RAW OCR ---\n" + text + "\n---------------\n")
            if text and is_driver_license(text):
                parsed = parse_license(text)
                masked = masked_fields(parsed)
                display(parsed)
                display_validation(validate_license(parsed, masked))
                display_masked_notice(masked)
            else:
                print("\n❌ Not Found -- Please Upload Valid Driver's License\n")
