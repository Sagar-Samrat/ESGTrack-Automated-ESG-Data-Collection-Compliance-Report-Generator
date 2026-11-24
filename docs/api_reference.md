# ESGTrack API Reference Documentation

ESGTrack provides a RESTful API compliant with OpenAPI 3.0 standards. Interactive Swagger documentation is accessible at `http://localhost:8000/docs` and Redoc at `http://localhost:8000/redoc`.

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new tenant company and administrative user account.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@company.com",
    "password": "SecurePassword123!",
    "company_name": "Apex Industries"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user_id": "usr_94b1c8a412de",
    "email": "jane@company.com",
    "name": "Jane Doe",
    "role": "admin",
    "company_id": "comp_a8e32c91b5ff",
    "company_name": "Apex Industries"
  }
  ```

### `POST /api/auth/login`
Authenticates user with email and password, returning an access JWT.

### `GET /api/auth/me`
Fetches current user profile and multi-tenant company association.

---

## 2. Ingestion & File Uploads (`/api/uploads`)

### `POST /api/uploads`
Multi-part upload handling `.xlsx`, `.xls`, and `.csv` files with validation.
- **Headers**: `Authorization: Bearer <token>`
- **Form Data**:
  - `file`: binary spreadsheet
  - `department`: `Environmental` | `Human Resources` | `Operations` | `Finance` | `Governance`
  - `reporting_year`: `2024`

### `GET /api/uploads`
Lists all uploaded datasets for the authenticated company.

### `POST /api/uploads/{upload_id}/preview`
Returns first 10 rows, column headers, data types, missing counts, and heuristic mapping suggestions.

### `DELETE /api/uploads/{upload_id}`
Deletes uploaded file and associated staged records.

---

## 3. Data Cleaning & Normalization (`/api/cleaning`)

### `POST /api/cleaning/validate/{upload_id}`
Executes statistical anomaly screening:
- Detects duplicate rows.
- Computes missing cells per column.
- Flags non-permitted negative values.
- Computes Interquartile Range ($IQR$) and $Z$-score outliers.
- Derives Data Quality Score ($0-100\%$).

### `POST /api/cleaning/apply-fixes/{upload_id}`
Applies user-approved corrections (deduplication, median imputation, non-negative clamping) and standardizes records into `esg_records`.

---

## 4. ESG Metrics Engine (`/api/metrics`)

### `GET /api/metrics`
Aggregates overall dashboard summary, combining Environmental, Social, and Governance pillars with YoY comparison.

### `GET /api/metrics/environmental`
Returns Scope 1, Scope 2, Scope 3 greenhouse gas emissions, electricity consumption, water usage, and renewable energy percentage.

### `GET /api/metrics/social`
Returns employee headcount, gender diversity ratio, turnover rate, and workplace accident frequency.

### `GET /api/metrics/governance`
Returns board independence ratio, ethics training completion rate, and anti-corruption status.

### `GET /api/metrics/yoy`
Returns year-over-year comparative variance analysis with absolute change and percentage change.

---

## 5. AI Report Generation (`/api/reports`)

### `POST /api/reports/generate`
Prompts Google Gemini with verified metrics to produce a structured narrative report. Includes offline deterministic fallback mode.

### `GET /api/reports/{report_id}/pdf`
Streams a high-fidelity ReportLab corporate sustainability PDF report.

### `GET /api/reports/export/excel`
Generates a multi-tab Microsoft Excel (.xlsx) workbook of all verified activity metrics.

---

## 6. Compliance Center (`/api/compliance`)

### `GET /api/compliance/checklists`
Lists disclosure requirements for GRI Standards, IFRS S1, or IFRS S2.

### `GET /api/compliance/gap-report`
Evaluates compliance readiness percentage and missing disclosures.

### `PUT /api/compliance/disclosures/{disclosure_id}/status`
Updates reviewer approval status and audit notes.

### `POST /api/compliance/evidence`
Links supporting audit documents to a disclosure item.

