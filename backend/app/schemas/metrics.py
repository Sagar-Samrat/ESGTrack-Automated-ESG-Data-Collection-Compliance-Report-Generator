from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class MonthlyDataPoint(BaseModel):
    month: str
    electricity_kwh: float = 0.0
    water_m3: float = 0.0
    waste_kg: float = 0.0
    emissions_tco2e: float = 0.0

class EnvironmentalMetricsResponse(BaseModel):
    reporting_year: int
    scope_1_tco2e: float
    scope_2_tco2e: float
    scope_3_tco2e: float
    total_ghg_tco2e: float
    electricity_kwh: float
    water_m3: float
    waste_kg: float
    renewable_energy_kwh: float
    renewable_percentage: float
    fuel_consumption_liters: float
    monthly_breakdown: List[MonthlyDataPoint] = []
    emission_factors_used: Dict[str, Any] = {}

class SocialMetricsResponse(BaseModel):
    reporting_year: int
    total_employees: int
    female_employees: int
    male_employees: int
    other_employees: int
    gender_diversity_pct: float
    turnover_rate_pct: float
    workplace_accidents: int
    lost_work_days: int
    safety_training_hours: float
    accident_frequency_rate: float
    department_distribution: Dict[str, int] = {}

class GovernanceMetricsResponse(BaseModel):
    reporting_year: int
    total_board_members: int
    independent_board_members: int
    board_independence_pct: float
    ethics_training_eligible: int
    ethics_training_completed: int
    ethics_training_completion_pct: float
    anti_corruption_policy: str
    board_meeting_count: int

class MetricChange(BaseModel):
    metric_name: str
    current_value: float
    previous_value: float
    unit: str
    absolute_change: float
    percentage_change: float
    trend: str  # "increase", "decrease", "stable"
    favorable: bool

class YoYComparisonResponse(BaseModel):
    current_year: int
    previous_year: int
    metrics: List[MetricChange] = []

class QualityAlertItem(BaseModel):
    upload_id: Optional[str] = None
    severity: str = "info"  # error, warning, info, success
    title: str
    description: str

class DashboardMetricsResponse(BaseModel):
    company_name: str
    reporting_year: int
    environmental: EnvironmentalMetricsResponse
    social: SocialMetricsResponse
    governance: GovernanceMetricsResponse
    yoy_comparison: Optional[YoYComparisonResponse] = None
    data_completeness_pct: float
    quality_alerts_count: int
    recent_uploads_count: int
    quality_alerts: List[QualityAlertItem] = []

