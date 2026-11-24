from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class DisclosureItem(BaseModel):
    disclosure_id: str
    framework: str  # GRI, IFRS S1, IFRS S2
    code: str
    category: str
    title: str
    description: str
    required_evidence: str
    data_availability: str  # Available, Missing, Partial
    evidence_status: str  # Not Started, Evidence Pending, Under Review, Approved
    approval_status: str  # Pending, Approved, Rejected
    reviewer_notes: Optional[str] = ""
    evidence_files: List[str] = []

class UpdateDisclosureRequest(BaseModel):
    evidence_status: Optional[str] = None
    approval_status: Optional[str] = None
    reviewer_notes: Optional[str] = None

class EvidenceAttachRequest(BaseModel):
    document_name: str
    document_type: str = "Policy/Certificate"
    notes: Optional[str] = None

class ComplianceGapReportResponse(BaseModel):
    framework: str
    total_disclosures: int
    approved_count: int
    under_review_count: int
    pending_evidence_count: int
    missing_data_count: int
    completion_percentage: float
    items: List[DisclosureItem]

