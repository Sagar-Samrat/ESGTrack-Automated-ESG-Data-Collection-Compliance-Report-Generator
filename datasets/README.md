# Synthetic ESG Testing Datasets Pack

> **Notice**: All records in these files are synthetic mock data generated for testing and demonstrating the ESGTrack platform. They do **not** represent real proprietary disclosures of any actual corporation. Emission factors are cited from verifiable public sources (US EPA, UK DEFRA, GHG Protocol) for test accuracy.

---

## Files Overview

### 1. `environmental_data.xlsx`
- **Department**: Environmental / Facilities
- **Scope**: Monthly energy, water, waste, and fuel consumption across 3 reporting years (2022, 2023, 2024).
- **Columns**:
  - `date`: Ingestion timestamp (YYYY-MM-DD format, 1st of each month).
  - `electricity_kwh`: Total facility electricity consumption (kWh).
  - `water_consumption_m3`: Municipal and well water usage (cubic meters, $m^3$).
  - `waste_generated_kg`: Total solid and operational waste (kg).
  - `renewable_energy_kwh`: Portion of electricity supplied by solar/wind PPAs (kWh).
  - `fuel_consumption_liters`: Diesel fuel used for backup generators and operational fleet (liters).
- **Embedded Test Anomalies**:
  - Duplicate record: Row 37 duplicates Row 5 for duplicate detection testing.
  - Missing value: Month 11 contains null for `water_consumption_m3`.
  - Negative value: Row 16 contains negative electricity (-420.50 kWh) to test non-negative constraints.
  - Outlier: Row 23 contains an extreme 10x spike in `waste_generated_kg` (48,500 kg) to test IQR/Z-score outlier detection.

### 2. `employee_data.xlsx`
- **Department**: Human Resources
- **Scope**: Multi-year workforce census containing 200+ employee records.
- **Columns**:
  - `employee_id`: Unique identifier (e.g., `EMP-1001`).
  - `department`: Business unit (Operations, Finance, HR, Engineering, Marketing, Sustainability).
  - `gender`: Gender identification (Female, Male, Non-Binary, Prefer Not to Say).
  - `employment_type`: Full-Time, Part-Time, Contract.
  - `joining_date`: Date joined.
  - `exit_date`: Exit date (or null if currently active) for employee turnover calculation.
  - `reporting_year`: Fiscal period (2022, 2023, 2024).
- **Embedded Test Anomalies**:
  - Duplicate identifier: duplicate employee row to test unique primary key validation.
  - Missing department: null value in row 13.
  - Invalid gender category: unrecognized code for validation warnings.

### 3. `safety_data.xlsx`
- **Department**: Health & Safety / Operations
- **Scope**: Monthly workplace safety metrics by department.
- **Columns**:
  - `date`: Month start.
  - `department`: Operating department.
  - `total_work_hours`: Sum of productive labor hours.
  - `workplace_accidents`: Number of reportable incidents (OSHA/HSE definition).
  - `lost_work_days`: Number of lost workdays due to injuries.
  - `safety_training_hours`: Cumulative safety training hours logged.
- **Embedded Test Anomalies**:
  - Negative lost work days: invalid negative entry (-3).
  - Missing training hours: null value.

### 4. `governance_data.xlsx`
- **Department**: Corporate Governance / Legal
- **Scope**: Annual board composition, ethics training, and anti-corruption policies across fiscal years.
- **Columns**:
  - `reporting_year`: Annual period.
  - `total_board_members`: Total board seats.
  - `independent_board_members`: Independent non-executive directors.
  - `ethics_training_eligible`: Total eligible personnel.
  - `ethics_training_completed`: Personnel completing mandatory compliance modules.
  - `anti_corruption_policy`: Formal whistleblowing and anti-bribery policy adoption ("Yes"/"No").
  - `board_meeting_count`: Board meetings convened during the fiscal period.

### 5. `emission_factors.xlsx`
- **Purpose**: Reference dataset for GHG Scope 1, Scope 2, and Scope 3 activity-based emissions calculation.
- **Columns**:
  - `activity_type`: Activity code (`electricity_grid`, `fuel_diesel`, `fuel_petrol`, `water_supply_and_treatment`, `waste_landfill`, etc.).
  - `emission_factor`: Carbon intensity multiplier ($tCO_2e$ per unit).
  - `unit`: Denominator unit (e.g. `tCO2e/kWh`, `tCO2e/liter`, `tCO2e/kg`).
  - `geography`: Spatial validity (US EPA eGRID, UK DEFRA, Global).
  - `source`: Regulatory or academic standard publication.
  - `reference_year`: Publication/effective year.

