from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ValidationIssue(BaseModel):
    issue_type: str  # missing_value, duplicate_row, negative_value, outlier, invalid_type
    column: Optional[str] = None
    row_index: Optional[int] = None
    current_value: Any = None
    suggested_action: str
    severity: str = "warning"  # error, warning, info

class ValidationReportResponse(BaseModel):
    upload_id: str
    quality_score: float
    completeness_percentage: float
    total_rows: int
    total_columns: int
    duplicates_count: int
    missing_cells_count: int
    negative_values_count: int
    outliers_count: int
    issues: List[ValidationIssue]
    status: str

class ApplyFixesRequest(BaseModel):
    remove_duplicates: bool = True
    impute_missing_median: bool = False
    drop_missing_rows: bool = False
    clamp_outliers: bool = False
    fix_negative_values: bool = True  # set negative to 0 or positive absolute
    column_mappings: Optional[Dict[str, str]] = None

