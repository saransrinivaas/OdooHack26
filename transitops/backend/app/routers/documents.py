"""Vehicle / driver document management (bonus) with OCR-backed licence
verification powered by your existing ocr_test.py."""
import json
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..config import UPLOAD_DIR
from ..database import get_db
from ..models import Document, Vehicle, Driver, Role, User
from ..services import ocr_service

router = APIRouter(prefix="/api/documents", tags=["documents"])
manage = require_roles(Role.SAFETY_OFFICER, Role.FLEET_MANAGER)


def _serialize(d: Document) -> dict:
    return {
        "id": d.id,
        "vehicle_id": d.vehicle_id,
        "driver_id": d.driver_id,
        "doc_type": d.doc_type,
        "filename": d.filename,
        "ocr_verdict": d.ocr_verdict,
        "ocr_data": json.loads(d.ocr_data) if d.ocr_data else None,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


@router.get("")
def list_documents(vehicle_id: int | None = None, driver_id: int | None = None,
                   db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = db.query(Document)
    if vehicle_id:
        q = q.filter(Document.vehicle_id == vehicle_id)
    if driver_id:
        q = q.filter(Document.driver_id == driver_id)
    return [_serialize(d) for d in q.order_by(Document.id.desc()).all()]


@router.post("/scan-licence")
def scan_licence(file: UploadFile = File(...), _: User = Depends(get_current_user)):
    """One-shot OCR: upload a licence image, get back parsed fields + Tier-2
    verdict, WITHOUT persisting a document. Great for a quick verification."""
    dest = UPLOAD_DIR / f"scan_{uuid.uuid4().hex}_{file.filename}"
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)
    try:
        result = ocr_service.scan_licence(str(dest))
    finally:
        dest.unlink(missing_ok=True)
    return result


@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("Other"),
    vehicle_id: int | None = Form(None),
    driver_id: int | None = Form(None),
    db: Session = Depends(get_db),
    _: User = Depends(manage),
):
    """Store a document against a vehicle or driver. If it's a driving licence,
    run OCR and attach the parsed data + verdict."""
    if not vehicle_id and not driver_id:
        raise HTTPException(400, "Attach the document to a vehicle or a driver.")
    if vehicle_id and not db.query(Vehicle).get(vehicle_id):
        raise HTTPException(404, "Vehicle not found.")
    if driver_id and not db.query(Driver).get(driver_id):
        raise HTTPException(404, "Driver not found.")

    stored = UPLOAD_DIR / f"doc_{uuid.uuid4().hex}_{file.filename}"
    with stored.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    ocr_verdict, ocr_data = "", ""
    if doc_type.lower() in ("driving licence", "driving license", "licence", "license", "dl"):
        result = ocr_service.scan_licence(str(stored))
        ocr_data = json.dumps(result)
        if result.get("is_licence"):
            ocr_verdict = result["verdict"]["name"]
            # If linked to a driver, auto-fill licence fields we could read
            if driver_id:
                driver = db.query(Driver).get(driver_id)
                fields = result.get("fields", {})
                if fields.get("license_no") and not driver.license_number:
                    driver.license_number = fields["license_no"]
                if fields.get("classes") and not driver.license_category:
                    driver.license_category = ", ".join(fields["classes"])
        else:
            ocr_verdict = "NOT A LICENCE"

    doc = Document(
        vehicle_id=vehicle_id, driver_id=driver_id, doc_type=doc_type,
        filename=file.filename, stored_path=str(stored),
        ocr_verdict=ocr_verdict, ocr_data=ocr_data,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _serialize(doc)


@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db), _: User = Depends(manage)):
    d = db.query(Document).get(doc_id)
    if not d:
        raise HTTPException(404, "Document not found.")
    from pathlib import Path
    Path(d.stored_path).unlink(missing_ok=True)
    db.delete(d)
    db.commit()
    return {"detail": "Document deleted."}
