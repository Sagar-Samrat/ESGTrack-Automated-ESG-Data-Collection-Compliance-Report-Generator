from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from app.database import get_compliance_collection, get_evidence_collection, get_audit_logs_collection
from app.schemas.compliance import DisclosureItem, ComplianceGapReportResponse, UpdateDisclosureRequest, EvidenceAttachRequest

DEFAULT_DISCLOSURES = [
    # GRI Standards
    {
        "framework": "GRI Standards",
        "code": "GRI 302-1",
        "category": "Environmental",
        "title": "Energy consumption within the organization",
        "description": "Total electricity, fuel, and renewable energy consumption in joules or kWh.",
        "required_evidence": "Utility bills, meter logs, fuel delivery receipts, renewable energy certificates (RECs).",
        "data_availability": "Available",
        "evidence_status": "Approved",
        "approval_status": "Approved",
        "reviewer_notes": "Metered utility invoices verified by Facilities team."
    },
    {
        "framework": "GRI Standards",
        "code": "GRI 305-1",
        "category": "Environmental",
        "title": "Direct (Scope 1) GHG emissions",
        "description": "Gross direct GHG emissions in metric tons of CO2 equivalent from company combustion sources.",
        "required_evidence": "Stationary fuel logs, fleet mileage and fuel purchase records.",
        "data_availability": "Available",
        "evidence_status": "Approved",
        "approval_status": "Approved",
        "reviewer_notes": "Calculation methodology verified against GHG Protocol Stationary Combustion Tool."
    },
    {
        "framework": "GRI Standards",
        "code": "GRI 305-2",
        "category": "Environmental",
        "title": "Energy indirect (Scope 2) GHG emissions",
        "description": "Location-based and market-based indirect GHG emissions from purchased electricity.",
        "required_evidence": "Grid supplier emission factor certification and billing schedules.",
        "data_availability": "Available",
        "evidence_status": "Approved",
        "approval_status": "Approved",
        "reviewer_notes": "Location-based eGRID emission factor applied."
    },
    {
        "framework": "GRI Standards",
        "code": "GRI 303-5",
        "category": "Environmental",
        "title": "Water consumption",
        "description": "Total water consumption from all areas in megaliters or cubic meters.",
        "required_evidence": "Municipal water utility statements and borehole meter logs.",
        "data_availability": "Available",
        "evidence_status": "Under Review",
        "approval_status": "Pending",
        "reviewer_notes": "Awaiting final Q4 municipal water reconciliation."
    },
    {
        "framework": "GRI Standards",
        "code": "GRI 306-3",
        "category": "Environmental",
        "title": "Waste generated",
        "description": "Total weight of hazardous and non-hazardous waste generated with disposal breakdown.",
        "required_evidence": "Waste contractor manifest tickets and recycling receipts.",
        "data_availability": "Available",
        "evidence_status": "Evidence Pending",
        "approval_status": "Pending",
        "reviewer_notes": "Recycling manifest awaiting contractor upload."
    },
    {
        "framework": "GRI Standards",
        "code": "GRI 405-1",
        "category": "Social",
        "title": "Diversity of governance bodies and employees",
        "description": "Percentage of individuals by gender, age group, and vulnerable groups.",
        "required_evidence": "HRIS headcount census export and board roster disclosures.",
        "data_availability": "Available",
        "evidence_status": "Approved",
        "approval_status": "Approved",
        "reviewer_notes": "HRIS report reconciled with annual payroll census."
    },
    {
        "framework": "GRI Standards",
        "code": "GRI 403-9",
        "category": "Social",
        "title": "Work-related injuries",
        "description": "Rate of recordable work-related injuries, fatalities, and lost-time frequency.",
        "required_evidence": "OSHA 300 log or internal HSE incident register.",
        "data_availability": "Available",
        "evidence_status": "Approved",
        "approval_status": "Approved",
        "reviewer_notes": "HSE incident log verified with zero fatalities recorded."
    },
    {
        "framework": "GRI Standards",
        "code": "GRI 205-2",
        "category": "Governance",
        "title": "Communication and training on anti-corruption policies",
        "description": "Total number and percentage of governance body members and employees trained.",
        "required_evidence": "LMS training completion logs and employee acknowledgement records.",
        "data_availability": "Available",
        "evidence_status": "Approved",
        "approval_status": "Approved",
        "reviewer_notes": "96% completion verified via compliance LMS platform."
    },

    # IFRS S1 General Requirements
    {
        "framework": "IFRS S1",
        "code": "IFRS-S1-GOV-1",
        "category": "Governance",
        "title": "Governance body oversight of sustainability risks",
        "description": "Identity of governance body responsible for oversight of sustainability risks and opportunities.",
        "required_evidence": "Board committee charter, minutes of quarterly ESG review committee.",
        "data_availability": "Available",
        "evidence_status": "Approved",
        "approval_status": "Approved",
        "reviewer_notes": "Board Sustainability Committee Charter attached."
    },
    {
        "framework": "IFRS S1",
        "code": "IFRS-S1-STRAT-1",
        "category": "Governance",
        "title": "Sustainability risk and opportunity resilience",
        "description": "Resilience of strategy and business model to sustainability-related risks over time horizons.",
        "required_evidence": "Enterprise Risk Management (ERM) risk register and scenario analysis draft.",
        "data_availability": "Partial",
        "evidence_status": "Evidence Pending",
        "approval_status": "Pending",
        "reviewer_notes": "Formal scenario analysis report currently under draft."
    },

    # IFRS S2 Climate Disclosures
    {
        "framework": "IFRS S2",
        "code": "IFRS-S2-CLIM-1",
        "category": "Environmental",
        "title": "Scope 1 and Scope 2 GHG emissions disclosure",
        "description": "Absolute gross Scope 1 and Scope 2 GHG emissions expressed in metric tonnes of CO2 equivalent.",
        "required_evidence": "Validated GHG accounting ledger and primary activity emission factor calculation sheets.",
        "data_availability": "Available",
        "evidence_status": "Approved",
        "approval_status": "Approved",
        "reviewer_notes": "GHG inventory verified by internal audit."
    },
    {
        "framework": "IFRS S2",
        "code": "IFRS-S2-CLIM-2",
        "category": "Environmental",
        "title": "Scope 3 value chain emissions screening",
        "description": "Categories of Scope 3 emissions deemed material to the entity.",
        "required_evidence": "Screening analysis of 15 Scope 3 categories or supply chain spend data.",
        "data_availability": "Partial",
        "evidence_status": "Under Review",
        "approval_status": "Pending",
        "reviewer_notes": "Upstream transportation screening in progress."
    }
]

def init_company_compliance_checklist(company_id: str):
    col = get_compliance_collection()
    count = col.count_documents({"company_id": company_id})
    if count == 0:
        docs = []
        for d in DEFAULT_DISCLOSURES:
            item = dict(d)
            item["disclosure_id"] = f"disc_{uuid.uuid4().hex[:12]}"
            item["company_id"] = company_id
            item["evidence_files"] = []
            item["created_at"] = datetime.now(timezone.utc)
            docs.append(item)
        col.insert_many(docs)

def get_framework_disclosures(company_id: str, framework: Optional[str] = None) -> List[DisclosureItem]:
    init_company_compliance_checklist(company_id)
    col = get_compliance_collection()
    query = {"company_id": company_id}
    if framework and framework.lower() != "all":
        query["framework"] = framework

    items = []
    for doc in col.find(query):
        items.append(DisclosureItem(
            disclosure_id=doc["disclosure_id"],
            framework=doc["framework"],
            code=doc["code"],
            category=doc["category"],
            title=doc["title"],
            description=doc["description"],
            required_evidence=doc["required_evidence"],
            data_availability=doc.get("data_availability", "Available"),
            evidence_status=doc.get("evidence_status", "Not Started"),
            approval_status=doc.get("approval_status", "Pending"),
            reviewer_notes=doc.get("reviewer_notes", ""),
            evidence_files=doc.get("evidence_files", [])
        ))
    return items

def update_disclosure_status(company_id: str, disclosure_id: str, update_data: UpdateDisclosureRequest, user_id: str) -> Dict[str, Any]:
    col = get_compliance_collection()
    update_fields = {}
    if update_data.evidence_status is not None:
        update_fields["evidence_status"] = update_data.evidence_status
    if update_data.approval_status is not None:
        update_fields["approval_status"] = update_data.approval_status
    if update_data.reviewer_notes is not None:
        update_fields["reviewer_notes"] = update_data.reviewer_notes

    update_fields["updated_at"] = datetime.now(timezone.utc)

    res = col.update_one({"company_id": company_id, "disclosure_id": disclosure_id}, {"$set": update_fields})
    if res.matched_count == 0:
        return {"error": "Disclosure not found"}

    get_audit_logs_collection().insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "company_id": company_id,
        "user_id": user_id,
        "action": f"COMPLIANCE_DISCLOSURE_UPDATED: {disclosure_id}",
        "details": update_fields,
        "timestamp": datetime.now(timezone.utc)
    })

    return {"status": "success", "disclosure_id": disclosure_id}

def attach_evidence_document(company_id: str, disclosure_id: str, req: EvidenceAttachRequest, user_id: str) -> Dict[str, Any]:
    col = get_compliance_collection()
    doc_id = f"evd_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)

    ev_record = {
        "evidence_id": doc_id,
        "company_id": company_id,
        "disclosure_id": disclosure_id,
        "document_name": req.document_name,
        "document_type": req.document_type,
        "notes": req.notes or "",
        "uploaded_by": user_id,
        "created_at": now
    }
    get_evidence_collection().insert_one(ev_record)

    col.update_one(
        {"company_id": company_id, "disclosure_id": disclosure_id},
        {"$push": {"evidence_files": req.document_name}, "$set": {"evidence_status": "Under Review"}}
    )

    return {"status": "success", "evidence_id": doc_id, "document_name": req.document_name}

def generate_compliance_gap_report(company_id: str, framework: str) -> ComplianceGapReportResponse:
    disclosures = get_framework_disclosures(company_id, framework)
    total = len(disclosures)
    approved = sum(1 for d in disclosures if d.approval_status == "Approved")
    under_rev = sum(1 for d in disclosures if d.evidence_status == "Under Review")
    pending_ev = sum(1 for d in disclosures if d.evidence_status == "Evidence Pending")
    missing_data = sum(1 for d in disclosures if d.data_availability == "Missing")

    pct = round((approved / total * 100.0), 1) if total > 0 else 0.0

    return ComplianceGapReportResponse(
        framework=framework,
        total_disclosures=total,
        approved_count=approved,
        under_review_count=under_rev,
        pending_evidence_count=pending_ev,
        missing_data_count=missing_data,
        completion_percentage=pct,
        items=disclosures
    )

