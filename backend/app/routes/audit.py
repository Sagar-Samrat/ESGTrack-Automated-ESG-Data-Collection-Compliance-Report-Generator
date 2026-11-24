from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.services.auth_service import get_current_company_id
from app.database import get_audit_logs_collection

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])

@router.get("")
def get_company_audit_logs(company_id: str = Depends(get_current_company_id)):
    col = get_audit_logs_collection()
    cursor = col.find({"company_id": company_id}).sort("timestamp", -1).limit(50)
    results = []
    for doc in cursor:
        results.append({
            "log_id": doc.get("log_id"),
            "action": doc.get("action"),
            "user_id": doc.get("user_id"),
            "details": doc.get("details", {}),
            "timestamp": doc.get("timestamp")
        })
    return results

