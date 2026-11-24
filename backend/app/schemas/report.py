from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class GenerateReportRequest(BaseModel):
    reporting_year: int = 2024
    framework: str = "GRI Standards"  # GRI Standards, IFRS S1, IFRS S2
    esg_categories: List[str] = ["Environmental", "Social", "Governance"]
    custom_notes: Optional[str] = None

class UpdateReportContentRequest(BaseModel):
    executive_summary: Optional[str] = None
    environmental_narrative: Optional[str] = None
    social_narrative: Optional[str] = None
    governance_narrative: Optional[str] = None
    recommendations: Optional[str] = None
    limitations: Optional[str] = None
    status: Optional[str] = None

class ReportResponse(BaseModel):
    report_id: str
    company_id: str
    company_name: str
    reporting_year: int
    framework: str
    report_status: str  # draft, approved, finalized
    content: Dict[str, Any]
    metrics_summary: Dict[str, Any]
    generated_at: datetime

