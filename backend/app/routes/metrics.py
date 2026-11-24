from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from app.services.auth_service import get_current_company_id, get_current_user
from app.database import get_companies_collection, get_uploads_collection
from app.services.calculation_service import (
    calculate_environmental_metrics,
    calculate_social_metrics,
    calculate_governance_metrics,
    calculate_yoy_comparison
)
from app.schemas.metrics import (
    EnvironmentalMetricsResponse,
    SocialMetricsResponse,
    GovernanceMetricsResponse,
    DashboardMetricsResponse,
    YoYComparisonResponse,
    QualityAlertItem
)

router = APIRouter(prefix="/api/metrics", tags=["ESG Metrics & Analytics"])

@router.get("", response_model=DashboardMetricsResponse)
def get_dashboard_summary(
    reporting_year: int = Query(2024),
    company_id: str = Depends(get_current_company_id)
):
    companies_col = get_companies_collection()
    comp = companies_col.find_one({"company_id": company_id})
    company_name = comp["company_name"] if comp else "Corporate Enterprise"

    env = calculate_environmental_metrics(company_id, reporting_year)
    soc = calculate_social_metrics(company_id, reporting_year)
    gov = calculate_governance_metrics(company_id, reporting_year)
    yoy = calculate_yoy_comparison(company_id, reporting_year)

    active_uploads = list(
        get_uploads_collection()
        .find({"company_id": company_id, "status": {"$ne": "superseded"}})
        .sort("uploaded_at", -1)
    )
    uploads_count = len(active_uploads)

    if uploads_count > 0:
        data_completeness_pct = round(
            sum(float(u.get("data_quality_score", 100.0)) for u in active_uploads) / uploads_count,
            1
        )
    else:
        data_completeness_pct = 0.0

    quality_alerts: List[QualityAlertItem] = []
    alerts_count = 0

    for up in active_uploads:
        val_sum = up.get("validation_summary") or {}
        up_status = up.get("status", "uploaded")
        up_id = up.get("upload_id")
        fname = up.get("filename", "dataset")

        if up_status == "uploaded":
            alerts_count += 1
            quality_alerts.append(QualityAlertItem(
                upload_id=up_id,
                severity="warning",
                title=f"Pending Validation & Cleaning: {fname}",
                description=f"{up.get('department', 'ESG')} dataset uploaded for FY {up.get('reporting_year')} awaits normalization before KPI ingestion."
            ))
        else:
            outliers = int(val_sum.get("outliers_count", 0))
            negatives = int(val_sum.get("negative_values_count", 0))
            domain_errs = int(val_sum.get("domain_errors_count", 0))
            missing = int(val_sum.get("missing_cells_count", 0))

            if negatives > 0 or domain_errs > 0:
                alerts_count += 1
                quality_alerts.append(QualityAlertItem(
                    upload_id=up_id,
                    severity="warning",
                    title=f"Integrity Check Notice in {fname}",
                    description=f"Detected {domain_errs} constraint warnings and {negatives} negative entries during audit screening."
                ))
            elif outliers > 0 or missing > 0:
                alerts_count += 1
                quality_alerts.append(QualityAlertItem(
                    upload_id=up_id,
                    severity="info",
                    title=f"Statistical Outliers / Imputations in {fname}",
                    description=f"Flagged {outliers} IQR outlier values and {missing} missing cells across {up.get('total_rows', 0)} records."
                ))

    if not quality_alerts and uploads_count > 0:
        quality_alerts.append(QualityAlertItem(
            severity="success",
            title="All Uploaded Datasets Verified & Normalized",
            description=f"{uploads_count} departmental files passed schema validation with {data_completeness_pct}% average completeness."
        ))
    elif uploads_count == 0:
        quality_alerts.append(QualityAlertItem(
            severity="info",
            title="Awaiting Departmental Activity Uploads",
            description="Showing baseline reference telemetry. Upload Environmental, HR, Safety, or Governance files to compute live organization metrics."
        ))

    return DashboardMetricsResponse(
        company_name=company_name,
        reporting_year=reporting_year,
        environmental=env,
        social=soc,
        governance=gov,
        yoy_comparison=yoy,
        data_completeness_pct=data_completeness_pct,
        quality_alerts_count=alerts_count,
        recent_uploads_count=uploads_count,
        quality_alerts=quality_alerts[:5]
    )

@router.get("/environmental", response_model=EnvironmentalMetricsResponse)
def get_environmental_metrics(
    reporting_year: int = Query(2024),
    company_id: str = Depends(get_current_company_id)
):
    return calculate_environmental_metrics(company_id, reporting_year)

@router.get("/social", response_model=SocialMetricsResponse)
def get_social_metrics(
    reporting_year: int = Query(2024),
    company_id: str = Depends(get_current_company_id)
):
    return calculate_social_metrics(company_id, reporting_year)

@router.get("/governance", response_model=GovernanceMetricsResponse)
def get_governance_metrics(
    reporting_year: int = Query(2024),
    company_id: str = Depends(get_current_company_id)
):
    return calculate_governance_metrics(company_id, reporting_year)

@router.get("/yoy", response_model=YoYComparisonResponse)
def get_yoy_metrics(
    reporting_year: int = Query(2024),
    company_id: str = Depends(get_current_company_id)
):
    return calculate_yoy_comparison(company_id, reporting_year)

