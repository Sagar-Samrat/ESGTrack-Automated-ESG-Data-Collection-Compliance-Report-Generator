import os
import uuid
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
from fastapi import HTTPException, status
from app.config import settings
from app.database import get_uploads_collection, get_audit_logs_collection, get_esg_records_collection
from app.schemas.cleaning import ValidationReportResponse, ValidationIssue, ApplyFixesRequest
from app.services.upload_service import guess_column_mapping
from app.utils.logger import logger

NON_NEGATIVE_COLUMNS = {
    "electricity_kwh", "water_consumption_m3", "waste_generated_kg",
    "renewable_energy_kwh", "fuel_consumption_liters", "total_work_hours",
    "workplace_accidents", "lost_work_days", "safety_training_hours",
    "total_board_members", "independent_board_members", "ethics_training_eligible",
    "ethics_training_completed", "board_meeting_count", "emission_factor"
}

def _sanitize_record_value(v: Any) -> Any:
    if v is None:
        return None
    try:
        if pd.isna(v):
            return None
    except Exception:
        pass
    if isinstance(v, (pd.Timestamp, datetime)):
        return v.isoformat()
    if isinstance(v, (np.integer, np.floating, np.bool_)):
        return v.item()
    return v

def _safe_scalar_float(val: Any) -> Optional[float]:
    if val is None or isinstance(val, bool):
        return None
    try:
        if pd.isna(val):
            return None
    except Exception:
        pass
    try:
        return float(val)
    except (ValueError, TypeError):
        return None

def _load_upload_dataframe(upload_doc: Dict[str, Any], prefer_cleaned: bool = False) -> Tuple[pd.DataFrame, str, Optional[str]]:
    candidates = []
    if prefer_cleaned and upload_doc.get("cleaned_file_path"):
        candidates.append(upload_doc["cleaned_file_path"])
    if upload_doc.get("file_path"):
        candidates.append(upload_doc["file_path"])
    if not prefer_cleaned and upload_doc.get("cleaned_file_path"):
        candidates.append(upload_doc["cleaned_file_path"])

    for path in candidates:
        if path and os.path.exists(path):
            ext = os.path.splitext(path)[1].lower()
            if ext == ".csv":
                return pd.read_csv(path), ext, path
            else:
                return pd.read_excel(path, engine="openpyxl"), ext, path

    records = list(get_esg_records_collection().find({"source_upload_id": upload_doc["upload_id"]}))
    if records:
        return pd.DataFrame([r.get("data", {}) for r in records]), ".xlsx", None

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Source dataset file could not be found for validation or cleaning."
    )

def analyze_and_validate_dataframe(df: pd.DataFrame, department: str) -> Tuple[List[ValidationIssue], Dict[str, Any]]:
    issues: List[ValidationIssue] = []
    total_cells = df.size if df.size > 0 else 1
    total_rows = len(df)

    # 1. Duplicate Rows Check
    duplicates_mask = df.duplicated()
    dup_count = int(duplicates_mask.sum())
    if dup_count > 0:
        for idx in df[duplicates_mask].index[:10]:  # Cap first 10 for detailed view
            issues.append(ValidationIssue(
                issue_type="duplicate_row",
                row_index=int(idx),
                suggested_action="Deduplicate row during cleaning step",
                severity="warning"
            ))

    # 2. Missing Values Check (exclude intentionally nullable fields like exit_date for active HR staff)
    optional_cols = {"exit_date"} if department == "Human Resources" else set()
    missing_cells = 0
    evaluated_cells = 0
    for col in df.columns:
        if str(col).lower().strip() in optional_cols:
            continue
        evaluated_cells += total_rows
        col_missing = int(df[col].isna().sum())
        missing_cells += col_missing
        if col_missing > 0:
            for idx in df[df[col].isna()].index[:10]:
                issues.append(ValidationIssue(
                    issue_type="missing_value",
                    column=col,
                    row_index=int(idx),
                    suggested_action=f"Review missing value in '{col}' (impute with median or retain)",
                    severity="warning"
                ))

    # 3. Negative Value Check on designated non-negative columns
    neg_count = 0
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        col_clean = col.lower().strip()
        if col_clean in NON_NEGATIVE_COLUMNS:
            neg_mask = df[col] < 0
            count_neg = int(neg_mask.sum())
            neg_count += count_neg
            if count_neg > 0:
                for idx in df[neg_mask].index[:10]:
                    val = float(df.loc[idx, col])
                    issues.append(ValidationIssue(
                        issue_type="negative_value",
                        column=col,
                        row_index=int(idx),
                        current_value=val,
                        suggested_action=f"Value {val} is negative. Non-negative constraint violated.",
                        severity="error"
                    ))

    # 4. Outlier Detection via IQR and Z-Score
    outlier_count = 0
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) >= 6:  # Statistical requirement for meaningful distribution
            q25 = series.quantile(0.25)
            q75 = series.quantile(0.75)
            iqr = q75 - q25
            lower_bound = q25 - 2.5 * iqr
            upper_bound = q75 + 2.5 * iqr

            outliers_mask = (df[col] < lower_bound) | (df[col] > upper_bound)
            count_out = int(outliers_mask.sum())
            outlier_count += count_out
            if count_out > 0:
                for idx in df[outliers_mask].index[:5]:
                    val = float(df.loc[idx, col])
                    issues.append(ValidationIssue(
                        issue_type="outlier",
                        column=col,
                        row_index=int(idx),
                        current_value=val,
                        suggested_action=f"Outlier ({val}) detected outside expected IQR range [{round(lower_bound, 2)}, {round(upper_bound, 2)}]",
                        severity="info"
                    ))

    # 5. Domain-specific checks (HR duplicate employee_id, Governance logic constraints)
    if department == "Human Resources" and "employee_id" in df.columns:
        non_null_ids = df["employee_id"].dropna()
        id_dups = df.loc[non_null_ids.index][non_null_ids.duplicated() & ~duplicates_mask.loc[non_null_ids.index]]
        for idx in id_dups.index[:10]:
            dup_count += 1
            issues.append(ValidationIssue(
                issue_type="duplicate_row",
                column="employee_id",
                row_index=int(idx),
                current_value=str(df.loc[idx, "employee_id"]),
                suggested_action="Duplicate employee_id detected. Deduplicate worker records.",
                severity="warning"
            ))

    domain_errors = 0
    if department == "Governance":
        for idx, row in df.iterrows():
            total_b = _safe_scalar_float(row.get("total_board_members"))
            indep_b = _safe_scalar_float(row.get("independent_board_members"))
            elig = _safe_scalar_float(row.get("ethics_training_eligible"))
            comp = _safe_scalar_float(row.get("ethics_training_completed"))
            raw_policy = row.get("anti_corruption_policy")
            policy = str(raw_policy).strip().lower() if raw_policy is not None and pd.notnull(raw_policy) else ""

            if total_b is not None and total_b <= 0:
                domain_errors += 1
                issues.append(ValidationIssue(
                    issue_type="invalid_type",
                    column="total_board_members",
                    row_index=int(idx),
                    current_value=float(total_b),
                    suggested_action="Total board members must be greater than zero; excluded from calculations.",
                    severity="error"
                ))
            elif total_b is not None and indep_b is not None and indep_b > total_b:
                domain_errors += 1
                issues.append(ValidationIssue(
                    issue_type="invalid_type",
                    column="independent_board_members",
                    row_index=int(idx),
                    current_value=float(indep_b),
                    suggested_action="Independent board members cannot exceed total board members.",
                    severity="error"
                ))

            if elig is not None and comp is not None and comp > elig:
                domain_errors += 1
                issues.append(ValidationIssue(
                    issue_type="invalid_type",
                    column="ethics_training_completed",
                    row_index=int(idx),
                    current_value=float(comp),
                    suggested_action="Ethics training completed exceeds eligible staff count.",
                    severity="warning"
                ))

            if policy and policy not in {"yes", "no", "true", "false", "active", "inactive", "1", "0", "nan", "none"}:
                domain_errors += 1
                issues.append(ValidationIssue(
                    issue_type="invalid_type",
                    column="anti_corruption_policy",
                    row_index=int(idx),
                    current_value=str(raw_policy),
                    suggested_action="Unrecognized policy adoption value (expected Yes/No).",
                    severity="warning"
                ))

    # Data Quality Score Calculation
    # Max 100, penalties for errors, missing cells, duplicates, outliers
    denom_cells = evaluated_cells if evaluated_cells > 0 else total_cells
    missing_ratio = missing_cells / denom_cells if denom_cells > 0 else 0
    dup_ratio = dup_count / total_rows if total_rows > 0 else 0
    neg_ratio = neg_count / total_rows if total_rows > 0 else 0
    outlier_ratio = outlier_count / total_rows if total_rows > 0 else 0
    domain_ratio = domain_errors / total_rows if total_rows > 0 else 0

    score = 100.0 - (missing_ratio * 40.0) - (dup_ratio * 25.0) - (neg_ratio * 30.0) - (outlier_ratio * 15.0) - (domain_ratio * 20.0)
    score = max(0.0, min(100.0, round(score, 1)))

    completeness_pct = round((1.0 - missing_ratio) * 100.0, 1)

    summary = {
        "quality_score": score,
        "completeness_percentage": completeness_pct,
        "duplicates_count": dup_count,
        "missing_cells_count": missing_cells,
        "negative_values_count": neg_count,
        "outliers_count": outlier_count,
        "domain_errors_count": domain_errors
    }

    return issues, summary

def generate_validation_report(upload_doc: Dict[str, Any]) -> ValidationReportResponse:
    df, _, _ = _load_upload_dataframe(upload_doc, prefer_cleaned=False)

    issues, summary = analyze_and_validate_dataframe(df, upload_doc.get("department", "Environmental"))

    existing_status = upload_doc.get("status", "uploaded")
    new_status = "cleaned" if existing_status == "cleaned" else "validated"

    # Update upload doc with quality score and validation summary
    update_fields = {
        "validation_summary": summary,
        "status": new_status
    }
    if existing_status != "cleaned":
        update_fields["data_quality_score"] = summary["quality_score"]

    get_uploads_collection().update_one(
        {"upload_id": upload_doc["upload_id"]},
        {"$set": update_fields}
    )

    return ValidationReportResponse(
        upload_id=upload_doc["upload_id"],
        quality_score=summary["quality_score"],
        completeness_percentage=summary["completeness_percentage"],
        total_rows=len(df),
        total_columns=len(df.columns),
        duplicates_count=summary["duplicates_count"],
        missing_cells_count=summary["missing_cells_count"],
        negative_values_count=summary["negative_values_count"],
        outliers_count=summary["outliers_count"],
        issues=issues,
        status=new_status
    )

def clean_and_normalize_upload(
    upload_doc: Dict[str, Any],
    column_mappings: Optional[Dict[str, str]],
    fixes: ApplyFixesRequest,
    user_id: str
) -> Dict[str, Any]:
    df, ext, resolved_path = _load_upload_dataframe(upload_doc, prefer_cleaned=False)

    original_rows = len(df)
    department = upload_doc.get("department", "Environmental")

    # Determine effective column mappings (explicit > saved > auto-suggested)
    effective_mappings = column_mappings or upload_doc.get("column_mappings")
    if not effective_mappings:
        effective_mappings = guess_column_mapping([str(c) for c in df.columns], department)

    # 1. Apply column rename/mappings without introducing duplicate column labels
    existing_cols = set(str(c) for c in df.columns)
    claimed_targets = set()
    rename_map: Dict[str, str] = {}
    for k, v in effective_mappings.items():
        if k in df.columns and v and k != v:
            # Skip if target name already exists unmapped or was already claimed
            if (v in existing_cols and effective_mappings.get(v, v) == v) or (v in claimed_targets):
                continue
            rename_map[k] = v
            claimed_targets.add(v)

    if rename_map:
        df = df.rename(columns=rename_map)
    if df.columns.duplicated().any():
        df = df.loc[:, ~df.columns.duplicated()]

    # Coerce standard numeric columns if they were mapped or stringified
    for col in df.columns:
        if str(col).lower().strip() in NON_NEGATIVE_COLUMNS and not pd.api.types.is_numeric_dtype(df[col]):
            series_col = df[col]
            if isinstance(series_col, pd.Series):
                converted = pd.to_numeric(series_col, errors="coerce")
                if converted.notna().any():
                    df[col] = converted

    # 2. Deduplicate if approved
    if fixes.remove_duplicates:
        df = df.drop_duplicates()
        if department == "Human Resources" and "employee_id" in df.columns:
            has_id = df["employee_id"].notna()
            df = pd.concat([
                df[has_id].drop_duplicates(subset=["employee_id"], keep="first"),
                df[~has_id]
            ]).sort_index()

    # 3. Fix negative values in non-negative columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if fixes.fix_negative_values:
        for col in numeric_cols:
            if col.lower().strip() in NON_NEGATIVE_COLUMNS:
                df[col] = df[col].apply(lambda v: abs(v) if pd.notnull(v) and v < 0 else v)

    # 4. Clamp statistical outliers if requested
    if fixes.clamp_outliers:
        for col in numeric_cols:
            series = df[col].dropna()
            if len(series) >= 6:
                q25 = series.quantile(0.25)
                q75 = series.quantile(0.75)
                iqr = q75 - q25
                if iqr > 0:
                    lower_bound = max(0.0, q25 - 2.5 * iqr) if col.lower().strip() in NON_NEGATIVE_COLUMNS else (q25 - 2.5 * iqr)
                    upper_bound = q75 + 2.5 * iqr
                    df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)

    # 5. Handle missing values
    if fixes.drop_missing_rows:
        df = df.dropna()
    elif fixes.impute_missing_median:
        for col in numeric_cols:
            median_val = df[col].median()
            fill_val = 0.0 if pd.isna(median_val) else median_val
            df[col] = df[col].fillna(fill_val)

    # Save cleaned file
    stored_name = upload_doc.get("stored_filename") or f"{upload_doc['upload_id']}_{upload_doc.get('filename', 'dataset.xlsx')}"
    cleaned_filename = f"cleaned_{stored_name}"
    company_id = upload_doc["company_id"]
    target_dir = os.path.dirname(resolved_path) if resolved_path else os.path.join(settings.upload_dir, company_id)
    os.makedirs(target_dir, exist_ok=True)
    cleaned_path = os.path.join(target_dir, cleaned_filename)

    if ext == ".csv":
        df.to_csv(cleaned_path, index=False)
    else:
        df.to_excel(cleaned_path, index=False, engine="openpyxl")

    # Compute post-cleaning quality summary
    post_issues, post_summary = analyze_and_validate_dataframe(df, department)

    # Ingest standardized records into esg_records collection
    reporting_year = upload_doc["reporting_year"]
    upload_id = upload_doc["upload_id"]
    now = datetime.now(timezone.utc)

    uploads_col = get_uploads_collection()
    records_col = get_esg_records_collection()

    # Prevent double-counting: supersede any earlier uploads of the exact same filename + department for this company
    prior_same_files = list(uploads_col.find({
        "company_id": company_id,
        "department": department,
        "filename": upload_doc["filename"],
        "upload_id": {"$ne": upload_id}
    }))
    if prior_same_files:
        prior_ids = [p["upload_id"] for p in prior_same_files]
        records_col.delete_many({"company_id": company_id, "source_upload_id": {"$in": prior_ids}})
        uploads_col.update_many(
            {"company_id": company_id, "upload_id": {"$in": prior_ids}},
            {"$set": {"status": "superseded"}}
        )

    # Remove older records for this upload if re-cleaning
    records_col.delete_many({"source_upload_id": upload_id})

    # Prepare document rows
    records_to_insert = []
    for idx, row in df.iterrows():
        # Dynamically infer record year from row data if available
        row_year = reporting_year
        if "reporting_year" in row and pd.notnull(row["reporting_year"]):
            try:
                row_year = int(row["reporting_year"])
            except (ValueError, TypeError):
                row_year = reporting_year
        elif "date" in row and pd.notnull(row["date"]):
            try:
                parsed_dt = pd.to_datetime(row["date"])
                if pd.notnull(parsed_dt):
                    row_year = int(parsed_dt.year)
            except Exception:
                row_year = reporting_year
        elif "reference_year" in row and pd.notnull(row["reference_year"]):
            try:
                row_year = int(row["reference_year"])
            except (ValueError, TypeError):
                row_year = reporting_year

        rec = {
            "record_id": f"rec_{uuid.uuid4().hex[:12]}",
            "company_id": company_id,
            "department": department,
            "reporting_year": row_year,
            "source_upload_id": upload_id,
            "validation_status": "cleaned",
            "data": {str(k): _sanitize_record_value(v) for k, v in row.items()},
            "created_at": now
        }
        records_to_insert.append(rec)

    if records_to_insert:
        records_col.insert_many(records_to_insert)

    ingested_years = sorted({int(r["reporting_year"]) for r in records_to_insert if r.get("reporting_year")})

    # Update upload metadata
    uploads_col.update_one(
        {"upload_id": upload_id},
        {"$set": {
            "status": "cleaned",
            "cleaned_file_path": cleaned_path,
            "column_mappings": effective_mappings,
            "total_rows": int(len(df)),
            "data_quality_score": post_summary["quality_score"],
            "validation_summary": post_summary,
            "ingested_years": ingested_years
        }}
    )

    # Audit log
    get_audit_logs_collection().insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "company_id": company_id,
        "user_id": user_id,
        "action": f"DATA_CLEANED_AND_NORMALIZED: {upload_doc['filename']}",
        "details": {
            "original_rows": original_rows,
            "cleaned_rows": int(len(df)),
            "quality_score": post_summary["quality_score"],
            "fixes_applied": fixes.model_dump()
        },
        "timestamp": now
    })

    post_report = ValidationReportResponse(
        upload_id=upload_id,
        quality_score=post_summary["quality_score"],
        completeness_percentage=post_summary["completeness_percentage"],
        total_rows=int(len(df)),
        total_columns=int(len(df.columns)),
        duplicates_count=post_summary["duplicates_count"],
        missing_cells_count=post_summary["missing_cells_count"],
        negative_values_count=post_summary["negative_values_count"],
        outliers_count=post_summary["outliers_count"],
        issues=post_issues,
        status="cleaned"
    )

    return {
        "upload_id": upload_id,
        "original_rows": original_rows,
        "cleaned_rows": int(len(df)),
        "status": "cleaned",
        "records_ingested": len(records_to_insert),
        "ingested_years": ingested_years,
        "quality_score": post_summary["quality_score"],
        "completeness_percentage": post_summary["completeness_percentage"],
        "validation_report": post_report.model_dump()
    }

