# ESGTrack System Architecture Documentation

ESGTrack is an Automated ESG Data Collection & Compliance Report Generator designed for mid-size companies. It standardizes corporate ESG workflows from multi-departmental data intake to automated validation, calculation, AI reporting, and regulatory audit compliance.

---

## 1. System Topology Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                Frontend (React + Vite + Tailwind)           │
 │  - Dashboard (KPIs & Visuals)     - AI Report Generator     │
 │  - Data Upload & Column Mapping   - Compliance Center       │
 │  - Cleaning & Quality Review      - Reports History         │
 └──────────────────────────────┬──────────────────────────────┘
                                │ HTTPS / REST / JSON & Form-Data
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                 Backend (FastAPI Modular Core)              │
 │  ┌────────────────────────────────────────────────────────┐ │
 │  │ API Routers: Auth | Uploads | Cleaning | Metrics | AI  │ │
 │  └───────────────────────────┬────────────────────────────┘ │
 │                              │                              │
 │  ┌───────────────────────────┴────────────────────────────┐ │
 │  │ Services Layer:                                        │ │
 │  │  • UploadService      - Excel/CSV parsing & previews   │ │
 │  │  • CleaningService    - IQR/Z-score outliers & fixes   │ │
 │  │  • CalculationService - Scope 1/2/3, DEI, Governance   │ │
 │  │  • AIService          - Gemini API narrative generator │ │
 │  │  • PDFService         - ReportLab corporate publisher  │ │
 │  │  • ComplianceService  - GRI & IFRS S1/S2 gap tracker   │ │
 │  └───────────────────────────┬────────────────────────────┘ │
 └──────────────────────────────┼──────────────────────────────┘
                                │
        ┌───────────────────────┼────────────────────────┐
        ▼                       ▼                        ▼
 ┌───────────────┐      ┌───────────────┐      ┌──────────────────┐
 │  MongoDB /    │      │ Google Gemini │      │ Encrypted Local/ │
 │  MongoMock    │      │ API (2.0/1.5) │      │ S3 File Storage  │
 │ (Data Engine) │      │ (AI Reports)  │      │ (Raw/Clean Data) │
 └───────────────┘      └───────────────┘      └──────────────────┘
```

---

## 2. Component Breakdown & Data Flows

### A. Frontend Layer
- **Tech Stack**: React 18, Vite, Tailwind CSS, Lucide React icons, Recharts for responsive SVG visualization, Axios with request/response interceptors.
- **State & Context**:
  - `AuthContext`: Manages JWT storage (session/local), user profile, active company ID, and role-based permissions.
  - `ReportingYearContext`: Synchronizes the active reporting period across all dashboard charts, upload validations, and compliance checklists.
- **Error Handling**: Graceful loading skeletons, empty state prompts when no records exist, and actionable validation notifications.

### B. Backend API Layer
- **Framework**: FastAPI (Asynchronous Python 3.10+).
- **Authentication & Security**:
  - Password hashing with Bcrypt.
  - Stateless JSON Web Tokens (JWT) using HS256 algorithm.
  - Multi-tenancy isolation: Every database query filters by `company_id` extracted from verified JWT claims. Cross-company access is blocked at the dependency layer.
- **Modularity**:
  - `app/routes/`: Thin HTTP adapters validating inputs against Pydantic models.
  - `app/services/`: Isolated domain logic (Data ingestion, Statistical validation, Formulaic emission calculations, LLM prompts).
  - `app/models/` & `app/schemas/`: Typed request/response contracts ensuring API documentation in Swagger/OpenAPI.

### C. File Ingestion & Processing Pipeline
1. **Intake**: Multi-part upload handling `.xlsx`, `.xls`, and `.csv` files with a 50MB safety ceiling.
2. **Parsing**: Streaming Pandas ingestion into preview buffers without exhausting system memory.
3. **Column Mapping**: Fuzzy/heuristic suggestion engine that matches raw column headers (e.g. `electricity_consumption`) to normalized ESG ontology fields (e.g. `electricity_kwh`).
4. **Validation Engine**:
   - Detects nulls, duplicates, and non-numeric characters.
   - Restricts non-permitted negative values.
   - Outlier detection using Interquartile Range ($IQR = Q_3 - Q_1$) and $Z\text{-score} = \frac{x - \mu}{\sigma}$.
   - Flags anomalies for human auditor review instead of destructive auto-removal.
5. **Quality Scoring**: A transparent score ($0-100\%$) derived from completeness, duplicate penalties, and validation failure rates.

### D. Calculation Engine
- **Methodology**: Aligned with GHG Protocol Corporate Standard, Global Reporting Initiative (GRI 300, 400, 200), and IFRS S1/S2 General Sustainability Requirements.
- **Environmental**:
  - $\text{Scope 1} = \text{Fuel Consumed (L)} \times \text{EF}_{\text{diesel/petrol}}$
  - $\text{Scope 2} = \text{Grid Electricity (kWh)} \times \text{EF}_{\text{location grid}}$
  - $\text{Scope 3} = \sum (\text{Activity Data} \times \text{Supply Chain EF})$
  - $\text{Renewable \%} = \frac{\text{Renewable Energy (kWh)}}{\text{Total Energy (kWh)}} \times 100$
- **Social**:
  - $\text{Gender Diversity \%} = \frac{\text{Female Employees}}{\text{Total Employees}} \times 100$
  - $\text{Turnover Rate \%} = \frac{\text{Exits in Period}}{\text{Average Headcount}} \times 100$
  - $\text{Accident Frequency Rate} = \frac{\text{Accidents} \times 1,000,000}{\text{Total Hours Worked}}$
- **Governance**:
  - $\text{Board Independence \%} = \frac{\text{Independent Directors}}{\text{Total Directors}} \times 100$
  - $\text{Ethics Training Completion \%} = \frac{\text{Staff Trained}}{\text{Eligible Staff}} \times 100$

### E. AI Narrative Engine
- **Provider**: Google Gemini API via official SDK (`google-genai`).
- **Safety & Zero-Hallucination Guardrails**:
  - Prompt templates feed strictly verified quantitative calculations and metadata.
  - Explicit system prompt instructions forbid fabricating metrics, dates, or certifications.
  - Unmeasured data is flagged explicitly as "Undisclosed / Data Limitation".
  - Offline Mock Mode: Deterministic synthetic generation if no API key is configured.

### F. Document Generation
- **ReportLab PDF Engine**: High-fidelity corporate report formatting with cover page, KPI summary tiles, structured tabular disclosures, and audit sign-off lines.
- **Excel Exporter**: Multi-tab raw and calculated metric workbook for financial auditors.

