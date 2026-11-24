# ESGTrack — Automated ESG Data Collection & Compliance Report Generator

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat&logo=python)](https://python.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-PyMongo-47A248.svg?style=flat&logo=mongodb)](https://www.mongodb.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4.svg?style=flat&logo=google)](https://ai.google.dev)
[![Tests](https://img.shields.io/badge/Pytest-10_Passed-success.svg?style=flat&logo=pytest)](https://pytest.org)

ESGTrack is an enterprise-grade web application designed for mid-size corporations to automate corporate ESG (Environmental, Social, and Governance) data collection, statistical cleaning, GHG Protocol calculation, multi-year variance analytics, AI-powered disclosure drafting, and regulatory compliance reporting (GRI Standards, IFRS S1, IFRS S2).

---

## 🌟 Key Capabilities

1. **Multi-Departmental Data Intake**: Ingestion of Excel (`.xlsx`, `.xls`) and CSV files across Facilities, Human Resources, Operations, Finance, and Corporate Governance.
2. **Interactive Column Mapping**: Fuzzy heuristic mapping interface binding disparate raw column headers (e.g. `power_consumption`) to standardized ESG metrics.
3. **Statistical Cleaning & Quality Scoring**: Real-time detection of missing cells, duplicates, non-permitted negative values, and extreme outliers via Interquartile Range ($IQR$) and $Z$-score. Calculates an auditable Data Quality Score ($0-100\%$).
4. **Core GHG & Metrics Calculation Engine**: Scope 1 (direct fuels), Scope 2 (purchased electricity using location-based grid factors), Scope 3 (water & solid waste), renewable energy %, workforce DEI ratios, turnover, accident frequency rates, and board independence.
5. **Year-over-Year (YoY) Variance Analysis**: Compares current reporting periods against prior baselines, computing absolute and percentage changes with favorable/unfavorable tracking.
6. **Gemini AI Report Publisher**: Prompts Google Gemini with strictly verified quantitative metrics to synthesize a comprehensive 11-section corporate disclosure narrative with zero hallucinations and offline deterministic fallback mode.
7. **Institutional PDF Publisher**: Generates high-fidelity corporate ESG reports using Python ReportLab, complete with branded cover pages, KPI scorecards, and methodology notices.
8. **Compliance Gap Center**: Framework-based disclosure checklists for GRI Standards, IFRS S1, and IFRS S2 with evidence tracking and auditor sign-offs.

---

## 🏗 System Architecture

```
ESGTrack/
├── frontend/                     # React + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/           # Sidebar, Navbar, StatCards, Charts, Modals, Dropzones
│   │   ├── context/              # AuthContext & ReportingYearContext
│   │   ├── pages/                # 11 SaaS dashboard and module pages
│   │   └── services/             # Axios API client & domain services
│   ├── package.json
│   └── vite.config.js
├── backend/                      # FastAPI Modular Application
│   ├── app/
│   │   ├── config.py             # Pydantic BaseSettings environment manager
│   │   ├── database.py           # PyMongo connection with MongoMock fallback
│   │   ├── routes/               # Modular API endpoints (Auth, Uploads, Metrics, Reports...)
│   │   ├── services/             # Domain logic (Cleaning, Ingestion, Calc, AI, PDF)
│   │   ├── schemas/              # Pydantic request/response validation schemas
│   │   └── utils/                # Security, BCrypt, JWT, Emission Factors, Logger
│   ├── tests/                    # Pytest test suite (10 automated tests)
│   ├── requirements.txt
│   └── .env.example
├── datasets/                     # Synthetic ESG testing data pack (.xlsx files)
│   ├── environmental_data.xlsx   # 3 years monthly energy, water, waste, fuel
│   ├── employee_data.xlsx        # 200+ employee census, diversity, turnover
│   ├── safety_data.xlsx          # Productive hours, accidents, lost days, training
│   ├── governance_data.xlsx      # Board seats, independent members, ethics training
│   ├── emission_factors.xlsx     # EPA eGRID, DEFRA, GHG Protocol multipliers
│   └── README.md
├── docs/                         # Comprehensive architecture and compliance documentation
│   ├── architecture.md
│   ├── api_reference.md
│   ├── compliance_methodology.md
│   └── deployment_guide.md
├── Dockerfile                    # Containerization specification
├── render.yaml                   # Backend Render deployment blueprint
└── README.md
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Python**: 3.10 or newer (tested on Python 3.14)
- **Node.js**: v18 or newer (tested on Node v24)
- **MongoDB**: (Optional — if local MongoDB is not running, ESGTrack automatically falls back to an in-memory MongoMock database for zero-friction setup!)

---

### 2. Backend Setup & Startup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env configuration
cp .env.example .env

# Run FastAPI backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API will be running at: **`http://localhost:8000`**
Interactive Swagger Documentation: **`http://localhost:8000/docs`**

---

### 3. Frontend Setup & Startup

```bash
# Open a new terminal tab and navigate to frontend directory
cd frontend

# Install node packages
npm install

# Start Vite development server
npm run dev
```
Frontend Web Dashboard will be running at: **`http://localhost:5173`**

---

## 🧪 Running Automated Backend Tests

The backend includes a comprehensive Pytest test suite covering authentication, file ingestion, statistical cleaning, IQR outlier detection, calculation accuracy, multi-tenancy isolation, AI reporting, and PDF rendering:

```bash
# From the project root or backend directory:
PYTHONPATH=backend backend/venv/bin/pytest backend/tests -v
```

### Verified Test Results:
```text
backend/tests/test_auth.py::test_register_and_login PASSED               [ 10%]
backend/tests/test_auth.py::test_login_invalid_password PASSED           [ 20%]
backend/tests/test_calculations.py::test_metrics_endpoints PASSED        [ 30%]
backend/tests/test_cleaning.py::test_validation_and_cleaning_flow PASSED [ 40%]
backend/tests/test_isolation.py::test_multi_tenancy_isolation PASSED     [ 50%]
backend/tests/test_reports.py::test_report_generation_and_pdf PASSED     [ 60%]
backend/tests/test_reports.py::test_compliance_checklist_and_gap_report PASSED [ 70%]
backend/tests/test_uploads.py::test_upload_excel_dataset PASSED          [ 80%]
backend/tests/test_uploads.py::test_upload_csv_dataset PASSED            [ 90%]
backend/tests/test_uploads.py::test_unsupported_file_extension PASSED    [100%]

======================= 10 passed in 2.65s =======================
```

---

## 📂 Pre-Loaded Synthetic ESG Datasets

Inside the `datasets/` directory are 5 synthetic Excel (`.xlsx`) files created for testing:
1. `environmental_data.xlsx` (36 monthly records with embedded duplicate, missing value, negative value, and a 10x IQR outlier for validation testing).
2. `employee_data.xlsx` (200+ workforce records with diversity, hire dates, and termination dates).
3. `safety_data.xlsx` (monthly labor hours, workplace accidents, and safety training hours).
4. `governance_data.xlsx` (board compositions, ethics training completion, and anti-corruption policies).
5. `emission_factors.xlsx` (official EPA, DEFRA, and GHG Protocol factors).

---

## 🔒 Security & Data Isolation
- **Password Hashing**: Bcrypt with 12 salt rounds. Plaintext passwords are never stored.
- **Stateless Tokens**: HS256 JSON Web Tokens (JWT) with configurable expiration.
- **Multi-Tenancy Isolation**: Every database query is strictly scoped to the authenticated user's `company_id`. Cross-tenant data leakage is structurally impossible and covered by unit tests.
- **Input Validation**: Pydantic v2 schemas enforce typed contracts on every endpoint.
- **Upload Safety**: Strict file extension white-listing (`.xlsx`, `.xls`, `.csv`) and 50MB size enforcement.
- **AI Safety**: Zero-hallucination guardrails enforce that only verified quantitative records are supplied to the Google Gemini model.

---

## ☁️ Deployment

- **Frontend**: One-click deployment to **Vercel** with `frontend/vercel.json` rewrites.
- **Backend**: Blueprint configured for **Render** via `render.yaml` or containerized via `Dockerfile`.
- **Database**: Production connection strings supported via MongoDB Atlas.
See [docs/deployment_guide.md](file:///Users/sagarsamrat/Desktop/ESGtrack/docs/deployment_guide.md) for full deployment instructions.

---

## 📄 License
MIT License. Built for enterprise ESG disclosure compliance and automated sustainability assurance.

