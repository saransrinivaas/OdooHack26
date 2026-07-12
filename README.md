# Driver's Licence OCR

Reads an Indian driving licence from an image, pulls out the key details, checks if it's still
valid, runs some basic forgery checks, and flags masked fields.

## Setup

```bash
pip install requests python-dotenv
```

Create a `.env` file with your free [OCR.space](https://ocr.space/ocrapi) key:

```
OCR_SPACE_API_KEY=your_key_here
```

Put your licence images in this folder named `sample1.jpg`, `sample2.jpg`, `sample3.jpg`, …

## Run

```bash
python3 ocr_test.py
```

Pick a document when asked. You'll get:

```
✅ Valid Driver's License Detected

  Name              : S MOHAMED AHSAN
  License Number    : TN02 20240006663
  Issue Date        : 23-09-2024
  Validity          : 02-02-2046
  Status            : ✅ Active (valid until 02-02-2046)
  Eligible To Drive :
      • MCWG — Motorcycle with gear
      • LMV — Light Motor Vehicle (car / jeep)

  Verdict: ✅ VERIFIED — Passes all internal consistency checks
```

## What the results mean

- **Status** — Active or Expired, based on today's date.
- **Verdict:**
  - ✅ **VERIFIED** — all checks pass.
  - ⚠️ **NEEDS REVIEW** — something is masked or unreadable; check by hand.
  - ❌ **SUSPECT** — a rule failed (bad state code, dates don't add up, underage); likely fake.
- **🔒 Masked** — that field is hidden/redacted; the tool asks for an unmasked copy.
- If the image isn't a licence: **`Not Found -- Please Upload Valid Driver's License`**.

## Note

These checks confirm the licence is *consistent*, not that it's *genuine*. Real verification
needs a government check (Parivahan / DigiLocker) — a possible next step.
