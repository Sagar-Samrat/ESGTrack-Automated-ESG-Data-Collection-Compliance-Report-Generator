from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from app.database import get_uploads_collection
from app.services.auth_service import get_current_company_id, get_current_user
from app.services.cleaning_service import generate_validation_report, clean_and_normalize_upload
from app.schemas.cleaning import ValidationReportResponse, ApplyFixesRequest

router = APIRouter(prefix="/api/cleaning", tags=["Data Cleaning & Validation"])

@router.post("/validate/{upload_id}", response_model=ValidationReportResponse)
def validate_upload(upload_id: str, company_id: str = Depends(get_current_company_id)):
    col = get_uploads_collection()
    doc = col.find_one({"upload_id": upload_id, "company_id": company_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")
    return generate_validation_report(doc)

@router.get("/quality-report/{upload_id}", response_model=ValidationReportResponse)
def get_quality_report(upload_id: str, company_id: str = Depends(get_current_company_id)):
    col = get_uploads_collection()
    doc = col.find_one({"upload_id": upload_id, "company_id": company_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")
    return generate_validation_report(doc)

@router.post("/apply-fixes/{upload_id}")
def apply_data_fixes(
    upload_id: str,
    fixes: ApplyFixesRequest,
    company_id: str = Depends(get_current_company_id),
    user: Dict[str, Any] = Depends(get_current_user)
):
    col = get_uploads_collection()
    doc = col.find_one({"upload_id": upload_id, "company_id": company_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")

    result = clean_and_normalize_upload(
        upload_doc=doc,
        column_mappings=fixes.column_mappings,
        fixes=fixes,
        user_id=user["user_id"]
    )
    return result

