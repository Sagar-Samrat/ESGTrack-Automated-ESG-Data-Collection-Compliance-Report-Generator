from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UploadResponse(BaseModel):
    upload_id: str
    company_id: str
    filename: str
    department: str
    reporting_year: int
    status: str
    total_rows: int
    total_columns: int
    data_quality_score: Optional[float] = 100.0
    uploaded_at: datetime
    ingested_years: Optional[List[int]] = None

class ColumnMappingRequest(BaseModel):
    mappings: Dict[str, str]

class PreviewResponse(BaseModel):
    upload_id: str
    filename: str
    department: str
    reporting_year: int
    total_rows: int
    total_columns: int
    columns: List[str]
    dtypes: Dict[str, str]
    missing_counts: Dict[str, int]
    sample_rows: List[Dict[str, Any]]
    suggested_mappings: Dict[str, str]

