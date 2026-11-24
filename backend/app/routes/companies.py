from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from datetime import datetime, timezone
import uuid
from app.database import get_companies_collection
from app.services.auth_service import get_current_user, get_current_company_id
from app.schemas.company import CompanyCreateRequest, CompanyUpdateRequest, CompanyResponse

router = APIRouter(prefix="/api/companies", tags=["Companies"])

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(req: CompanyCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    col = get_companies_collection()
    company_id = f"comp_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    doc = {
        "company_id": company_id,
        "company_name": req.company_name,
        "industry": req.industry or "General Corporate",
        "country": req.country or "United States",
        "reporting_year": req.reporting_year or 2024,
        "created_at": now
    }
    col.insert_one(doc)
    return CompanyResponse(**doc)

@router.get("/me", response_model=CompanyResponse)
def get_my_company(company_id: str = Depends(get_current_company_id)):
    col = get_companies_collection()
    company = col.find_one({"company_id": company_id})
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return CompanyResponse(
        company_id=company["company_id"],
        company_name=company["company_name"],
        industry=company.get("industry", "General Corporate"),
        country=company.get("country", "United States"),
        reporting_year=company.get("reporting_year", 2024),
        created_at=company["created_at"]
    )

@router.put("/me", response_model=CompanyResponse)
def update_my_company(req: CompanyUpdateRequest, company_id: str = Depends(get_current_company_id)):
    col = get_companies_collection()
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    if update_data:
        col.update_one({"company_id": company_id}, {"$set": update_data})
    company = col.find_one({"company_id": company_id})
    return CompanyResponse(
        company_id=company["company_id"],
        company_name=company["company_name"],
        industry=company.get("industry", "General Corporate"),
        country=company.get("country", "United States"),
        reporting_year=company.get("reporting_year", 2024),
        created_at=company["created_at"]
    )

