from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CompanyCreateRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=150)
    industry: Optional[str] = "Manufacturing & Technology"
    country: Optional[str] = "United States"
    reporting_year: Optional[int] = 2024

class CompanyUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    reporting_year: Optional[int] = None

class CompanyResponse(BaseModel):
    company_id: str
    company_name: str
    industry: str
    country: str
    reporting_year: int
    created_at: datetime

