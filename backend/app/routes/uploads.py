from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import List, Dict, Any, Optional
import os
from app.database import get_uploads_collection, get_esg_records_collection
from app.services.auth_service import get_current_company_id, get_current_user
from app.services.upload_service import save_uploaded_file, get_file_preview
from app.services.cleaning_service import generate_validation_report, clean_and_normalize_upload
from app.schemas.cleaning import ApplyFixesRequest
from app.schemas.upload import UploadResponse, PreviewResponse, ColumnMappingRequest
from app.utils.logger import logger

router = APIRouter(prefix="/api/uploads", tags=["Data Uploads"])

def auto_validate_and_ingest(doc: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Automatically validate, map columns, and ingest uploaded dataset so all ESG metrics
    and dashboard calculations update immediately upon upload.
    """
    try:
        # 1. Inspect headers to determine automatic column mappings
        preview = get_file_preview(doc)
        suggested_mappings = preview.suggested_mappings or None

        # 2. Validation Report & Data Quality Score
        val_rep = generate_validation_report(doc)
        doc["data_quality_score"] = val_rep.quality_score

        # 3. Clean & Ingest records into esg_records collection
        clean_res = clean_and_normalize_upload(
            upload_doc=doc,
            column_mappings=suggested_mappings,
            fixes=ApplyFixesRequest(
                remove_duplicates=True,
                fix_negative_values=True,
                impute_missing_median=True,
                drop_missing_rows=False
            ),
            user_id=user_id
        )
        doc["status"] = "cleaned"
        doc["total_rows"] = clean_res.get("records_ingested", doc.get("total_rows", 0))
        doc["data_quality_score"] = clean_res.get("quality_score", doc["data_quality_score"])
        doc["ingested_years"] = clean_res.get("ingested_years", [])
        logger.info(f"Auto-ingested {clean_res.get('records_ingested', 0)} records for upload {doc.get('upload_id')}")
    except Exception as ex:
        logger.error(f"Auto-ingestion error for {doc.get('upload_id')}: {ex}")
    return doc

def _detect_department_from_filename(filename: str, fallback: str = "Environmental") -> str:
    fname = (filename or "").lower()
    if any(k in fname for k in ["emission_factor", "emission-factor", "factor"]):
        return "Emission Factors"
    if any(k in fname for k in ["employee", "workforce", "hr", "census", "headcount"]):
        return "Human Resources"
    if any(k in fname for k in ["safety", "accident", "incident", "labor", "osha", "ops"]):
        return "Operations"
    if any(k in fname for k in ["gov", "board", "ethics", "director"]):
        return "Governance"
    if any(k in fname for k in ["finance", "spend", "accounting"]):
        return "Finance"
    if any(k in fname for k in ["env", "energy", "emission", "water", "waste", "carbon", "power"]):
        return "Environmental"
    return fallback

@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
def upload_dataset(
    file: UploadFile = File(...),
    department: str = Form("Environmental"),
    reporting_year: int = Form(2024),
    auto_process: bool = Form(False),
    company_id: str = Depends(get_current_company_id),
    user: Dict[str, Any] = Depends(get_current_user)
):
    doc = save_uploaded_file(file, company_id, department, reporting_year)
    if auto_process:
        doc = auto_validate_and_ingest(doc, user["user_id"])
    return UploadResponse(**doc)

@router.post("/batch", response_model=List[UploadResponse], status_code=status.HTTP_201_CREATED)
def upload_multiple_datasets(
    files: List[UploadFile] = File(...),
    departments: Optional[List[str]] = Form(None),
    reporting_years: Optional[List[int]] = Form(None),
    default_department: str = Form("Environmental"),
    default_reporting_year: int = Form(2024),
    auto_process: bool = Form(True),
    company_id: str = Depends(get_current_company_id),
    user: Dict[str, Any] = Depends(get_current_user)
):
    results = []
    for idx, file in enumerate(files):
        if departments and idx < len(departments) and departments[idx]:
            dept = departments[idx]
        else:
            dept = _detect_department_from_filename(file.filename or "", default_department)

        if reporting_years and idx < len(reporting_years) and reporting_years[idx]:
            yr = int(reporting_years[idx])
        else:
            yr = default_reporting_year

        doc = save_uploaded_file(file, company_id, dept, yr)
        if auto_process:
            doc = auto_validate_and_ingest(doc, user["user_id"])
        results.append(UploadResponse(**doc))
    return results

@router.get("", response_model=List[UploadResponse])
def list_uploads(
    department: Optional[str] = None,
    reporting_year: Optional[int] = None,
    include_superseded: bool = False,
    company_id: str = Depends(get_current_company_id)
):
    col = get_uploads_collection()
    query: Dict[str, Any] = {"company_id": company_id}
    if not include_superseded:
        query["status"] = {"$ne": "superseded"}
    if department and department.lower() != "all":
        query["department"] = department
    if reporting_year:
        query["reporting_year"] = reporting_year

    cursor = col.find(query).sort("uploaded_at", -1)
    results = []
    for doc in cursor:
        results.append(UploadResponse(
            upload_id=doc["upload_id"],
            company_id=doc["company_id"],
            filename=doc["filename"],
            department=doc["department"],
            reporting_year=doc["reporting_year"],
            status=doc.get("status", "uploaded"),
            total_rows=doc.get("total_rows", 0),
            total_columns=doc.get("total_columns", 0),
            data_quality_score=doc.get("data_quality_score", 100.0),
            uploaded_at=doc["uploaded_at"],
            ingested_years=doc.get("ingested_years")
        ))
    return results

@router.get("/{upload_id}", response_model=UploadResponse)
def get_upload_by_id(upload_id: str, company_id: str = Depends(get_current_company_id)):
    col = get_uploads_collection()
    doc = col.find_one({"upload_id": upload_id, "company_id": company_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found or access denied")
    return UploadResponse(
        upload_id=doc["upload_id"],
        company_id=doc["company_id"],
        filename=doc["filename"],
        department=doc["department"],
        reporting_year=doc["reporting_year"],
        status=doc.get("status", "uploaded"),
        total_rows=doc.get("total_rows", 0),
        total_columns=doc.get("total_columns", 0),
        data_quality_score=doc.get("data_quality_score", 100.0),
        uploaded_at=doc["uploaded_at"],
        ingested_years=doc.get("ingested_years")
    )

@router.post("/{upload_id}/preview", response_model=PreviewResponse)
def preview_uploaded_file(upload_id: str, company_id: str = Depends(get_current_company_id)):
    col = get_uploads_collection()
    doc = col.find_one({"upload_id": upload_id, "company_id": company_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found or access denied")
    return get_file_preview(doc)

@router.delete("/{upload_id}")
def delete_upload(upload_id: str, company_id: str = Depends(get_current_company_id)):
    col = get_uploads_collection()
    doc = col.find_one({"upload_id": upload_id, "company_id": company_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")

    # Remove files if exist
    for p in [doc.get("file_path"), doc.get("cleaned_file_path")]:
        if p and os.path.exists(p):
            try:
                os.remove(p)
            except Exception:
                pass

    # Remove records
    get_esg_records_collection().delete_many({"source_upload_id": upload_id})
    col.delete_one({"upload_id": upload_id})

    return {"status": "deleted", "upload_id": upload_id}

