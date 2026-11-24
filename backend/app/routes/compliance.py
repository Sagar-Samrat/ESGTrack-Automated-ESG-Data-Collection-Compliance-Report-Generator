from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Dict, Any, Optional
from app.services.auth_service import get_current_company_id, get_current_user
from app.services.compliance_service import (
    get_framework_disclosures,
    update_disclosure_status,
    attach_evidence_document,
    generate_compliance_gap_report
)
from app.schemas.compliance import (
    DisclosureItem,
    ComplianceGapReportResponse,
    UpdateDisclosureRequest,
    EvidenceAttachRequest
)

router = APIRouter(prefix="/api/compliance", tags=["Compliance Center"])

@router.get("/checklists", response_model=List[DisclosureItem])
def get_compliance_checklists(
    framework: Optional[str] = Query(None),
    company_id: str = Depends(get_current_company_id)
):
    return get_framework_disclosures(company_id, framework)

@router.get("/gap-report", response_model=ComplianceGapReportResponse)
def get_gap_report(
    framework: str = Query("GRI Standards"),
    company_id: str = Depends(get_current_company_id)
):
    return generate_compliance_gap_report(company_id, framework)

@router.put("/disclosures/{disclosure_id}/status")
def update_disclosure(
    disclosure_id: str,
    req: UpdateDisclosureRequest,
    company_id: str = Depends(get_current_company_id),
    user: Dict[str, Any] = Depends(get_current_user)
):
    result = update_disclosure_status(company_id, disclosure_id, req, user["user_id"])
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    return result

@router.post("/evidence")
def attach_evidence(
    disclosure_id: str = Query(...),
    req: EvidenceAttachRequest = ...,
    company_id: str = Depends(get_current_company_id),
    user: Dict[str, Any] = Depends(get_current_user)
):
    return attach_evidence_document(company_id, disclosure_id, req, user["user_id"])

