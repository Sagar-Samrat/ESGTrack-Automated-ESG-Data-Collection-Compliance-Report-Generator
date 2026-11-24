import os
import uuid
import re
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import UploadFile, HTTPException, status
from app.config import settings
from app.database import get_uploads_collection, get_audit_logs_collection, get_esg_records_collection
from app.schemas.upload import UploadResponse, PreviewResponse
from app.utils.logger import logger

ALLOWED_EXTENSIONS = {".xlsx", ".xls", ".csv"}
ALLOWED_DEPARTMENTS = {"Environmental", "Human Resources", "Operations", "Finance", "Governance", "Emission Factors"}

# Heuristic mapping dictionary: Standard Field -> List of regex or raw patterns
STANDARD_ESG_MAPPINGS = {
    "Environmental": {
        "date": [r"^date$", r"^month$", r"^period$", r"^timestamp$"],
        "electricity_kwh": [r"electr.*kwh", r"electr.*consump", r"power.*consump", r"^electricity$", r"^kwh$"],
        "water_consumption_m3": [r"water.*m3", r"water.*consump", r"water.*usage", r"^water$"],
        "waste_generated_kg": [r"waste.*kg", r"waste.*gen", r"total.*waste", r"^waste$"],
        "renewable_energy_kwh": [r"renew.*kwh", r"renew.*energy", r"solar.*kwh", r"green.*power"],
        "fuel_consumption_liters": [r"fuel.*liter", r"diesel.*liter", r"fleet.*fuel", r"^fuel$"]
    },
    "Human Resources": {
        "employee_id": [r"^emp.*id$", r"^employee_id$", r"^staff.*id$", r"^id$"],
        "department": [r"^dept$", r"^department$", r"^business.*unit$"],
        "gender": [r"^gender$", r"^sex$"],
        "employment_type": [r"^employment.*type$", r"^contract.*type$", r"^type$"],
        "joining_date": [r"^joining.*date$", r"^hire.*date$", r"^start.*date$"],
        "exit_date": [r"^exit.*date$", r"^termination.*date$", r"^end.*date$"],
        "reporting_year": [r"^reporting.*year$", r"^year$"]
    },
    "Operations": {
        "date": [r"^date$", r"^month$", r"^period$"],
        "department": [r"^dept$", r"^department$"],
        "total_work_hours": [r"work.*hour", r"labor.*hour", r"total.*hour"],
        "workplace_accidents": [r"accident", r"incident", r"injur"],
        "lost_work_days": [r"lost.*day", r"lost.*time"],
        "safety_training_hours": [r"safety.*train.*hour", r"hse.*hour", r"training.*hour"]
    },
    "Governance": {
        "reporting_year": [r"^reporting.*year$", r"^year$"],
        "total_board_members": [r"total.*board", r"board.*member.*count", r"total.*directors", r"^board.*size$"],
        "independent_board_members": [r"indep.*board", r"independent.*directors"],
        "ethics_training_eligible": [r"ethics.*eligible", r"eligible.*staff"],
        "ethics_training_completed": [r"ethics.*complete", r"ethics.*trained"],
        "anti_corruption_policy": [r"anti.*corrupt", r"whistleblower.*policy"],
        "board_meeting_count": [r"board.*meeting", r"meetings.*held"]
    },
    "Emission Factors": {
        "activity_type": [r"activity.*type", r"^activity$", r"^stream$"],
        "emission_factor": [r"emission.*factor", r"^factor$"],
        "unit": [r"^unit$", r"^units$"],
        "geography": [r"geog", r"^region$", r"^country$"],
        "source": [r"^source$", r"^reference$"],
        "reference_year": [r"ref.*year", r"^year$"]
    }
}

def guess_column_mapping(columns: List[str], department: str) -> Dict[str, str]:
    dept_mappings = STANDARD_ESG_MAPPINGS.get(department, {})
    suggested: Dict[str, str] = {}
    used_targets = set()

    # Pass 1: Exact matches take priority so broad regexes cannot hijack canonical headers
    for col in columns:
        cleaned_col = col.lower().strip().replace(" ", "_")
        if cleaned_col in dept_mappings and cleaned_col not in used_targets:
            suggested[col] = cleaned_col
            used_targets.add(cleaned_col)

    # Pass 2: Heuristic regex matching for non-canonical column names without collapsing onto an already used target
    for col in columns:
        if col in suggested:
            continue
        cleaned_col = col.lower().strip().replace(" ", "_")
        matched_standard = None
        for std_field, patterns in dept_mappings.items():
            if std_field in used_targets:
                continue
            for pat in patterns:
                if re.search(pat, cleaned_col):
                    matched_standard = std_field
                    break
            if matched_standard:
                break
        if matched_standard:
            suggested[col] = matched_standard
            used_targets.add(matched_standard)
        else:
            suggested[col] = col
    return suggested

def _json_safe_value(val: Any) -> Any:
    if val is None:
        return None
    try:
        if pd.isna(val):
            return None
    except Exception:
        pass
    if isinstance(val, (pd.Timestamp, datetime)):
        return val.isoformat()
    if isinstance(val, (np.integer, np.floating, np.bool_)):
        return val.item()
    return val

def save_uploaded_file(file: UploadFile, company_id: str, department: str, reporting_year: int) -> Dict[str, Any]:
    raw_filename = os.path.basename(file.filename or "dataset.csv")
    ext = os.path.splitext(raw_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: .xlsx, .xls, .csv"
        )

    company_upload_dir = os.path.join(settings.upload_dir, company_id)
    os.makedirs(company_upload_dir, exist_ok=True)

    upload_id = f"upl_{uuid.uuid4().hex[:12]}"
    stored_filename = f"{upload_id}_{raw_filename}"
    file_path = os.path.join(company_upload_dir, stored_filename)

    file_bytes = file.file.read()
    if len(file_bytes) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.max_upload_size_mb} MB"
        )

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Read dataframe to verify readability and gather dimensions
    try:
        if ext == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path, engine="openpyxl")
    except Exception as ex:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse file: {str(ex)}"
        )

    now = datetime.now(timezone.utc)
    upload_doc = {
        "upload_id": upload_id,
        "company_id": company_id,
        "filename": raw_filename,
        "stored_filename": stored_filename,
        "file_path": file_path,
        "department": department,
        "reporting_year": reporting_year,
        "status": "uploaded",
        "total_rows": int(len(df)),
        "total_columns": int(len(df.columns)),
        "data_quality_score": 100.0,
        "uploaded_at": now
    }

    get_uploads_collection().insert_one(upload_doc)
    return upload_doc

def get_file_preview(upload_doc: Dict[str, Any]) -> PreviewResponse:
    file_path = upload_doc.get("file_path") or upload_doc.get("cleaned_file_path")
    df = None

    if file_path and os.path.exists(file_path):
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path, engine="openpyxl")
    else:
        records = list(get_esg_records_collection().find({"source_upload_id": upload_doc["upload_id"]}))
        if records:
            df = pd.DataFrame([r.get("data", {}) for r in records])

    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset source file is unavailable for preview."
        )

    total_rows = len(df)
    total_cols = len(df.columns)
    columns = [str(c) for c in df.columns]

    # Clean NaN and numpy/timestamp scalars for preview JSON serialization
    sample_df = df.head(10).replace({np.nan: None})
    sample_rows = [
        {str(k): _json_safe_value(v) for k, v in row.items()}
        for row in sample_df.to_dict(orient="records")
    ]

    dtypes = {str(col): str(dtype) for col, dtype in df.dtypes.items()}
    missing_counts = {str(col): int(df[col].isna().sum()) for col in df.columns}
    saved_mappings = upload_doc.get("column_mappings")
    suggested_mappings = saved_mappings if saved_mappings else guess_column_mapping(columns, upload_doc.get("department", "Environmental"))

    return PreviewResponse(
        upload_id=upload_doc["upload_id"],
        filename=upload_doc["filename"],
        department=upload_doc["department"],
        reporting_year=upload_doc["reporting_year"],
        total_rows=total_rows,
        total_columns=total_cols,
        columns=columns,
        dtypes=dtypes,
        missing_counts=missing_counts,
        sample_rows=sample_rows,
        suggested_mappings=suggested_mappings
    )

