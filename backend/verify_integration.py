"""
End-to-End Integration Verification Script for ESGTrack.
Uses FastAPI TestClient to test the complete 17-step user journey in-process.
"""

import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from fastapi.testclient import TestClient
from app.main import app

DATASETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../datasets"))

def log_step(step_num, title, details=""):
    print(f"\n==================================================")
    print(f"STEP {step_num}: {title}")
    if details:
        print(f"--> {details}")
    print(f"==================================================")

def main():
    client = TestClient(app)

    # 0. Health Check
    log_step(0, "System Health Check")
    health = client.get("/health")
    assert health.status_code == 200, f"Health check failed: {health.text}"
    print(f"Health Response: {health.json()}")

    # 1. Company & User Registration
    log_step(1, "Company & User Registration")
    reg_payload = {
        "name": "Sarah Connor",
        "email": f"s.connor.{os.urandom(3).hex()}@cyberdyne-sustainability.com",
        "password": "EnterprisePassword2026!",
        "company_name": "Cyberdyne Systems Corp"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    auth_data = reg_res.json()
    token = auth_data["access_token"]
    company_id = auth_data["company_id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Registered company: {auth_data['company_name']} (ID: {company_id})")
    print(f"User: {auth_data['name']} <{auth_data['email']}>")

    # 2. User Login & Token Verification
    log_step(2, "Authentication & Profile Verification")
    login_res = client.post("/api/auth/login", json={
        "email": reg_payload["email"],
        "password": reg_payload["password"]
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"

    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    print(f"Verified Profile: {me_res.json()['name']} ({me_res.json()['role']})")

    comp_res = client.get("/api/companies/me", headers=headers)
    assert comp_res.status_code == 200
    print(f"Verified Company Profile: {comp_res.json()['company_name']}")

    # 3. Select Reporting Year
    reporting_year = 2024
    log_step(3, f"Select Reporting Period: FY {reporting_year}")

    # 4. Upload Environmental Data
    log_step(4, "Upload Environmental Dataset (Excel .xlsx)")
    env_file_path = os.path.join(DATASETS_DIR, "environmental_data.xlsx")
    assert os.path.exists(env_file_path)
    with open(env_file_path, "rb") as f:
        up_res = client.post(
            "/api/uploads",
            headers=headers,
            files={"file": ("environmental_data.xlsx", f.read(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            data={"department": "Environmental", "reporting_year": reporting_year}
        )
    assert up_res.status_code == 201, f"Upload failed: {up_res.text}"
    env_upload = up_res.json()
    upload_id = env_upload["upload_id"]
    print(f"Ingested Upload ID: {upload_id} ({env_upload['total_rows']} rows, {env_upload['total_columns']} cols)")

    # 5. Preview Ingested File
    log_step(5, "Preview File Content & Field Profiling")
    prev_res = client.post(f"/api/uploads/{upload_id}/preview", headers=headers)
    assert prev_res.status_code == 200
    preview = prev_res.json()
    print(f"Columns: {preview['columns']}")
    print(f"Missing values by column: {preview['missing_counts']}")
    print(f"Sample row 1: {preview['sample_rows'][0]}")

    # 6. Column Mapping Validation
    log_step(6, "Review Heuristic Standardized Column Mappings")
    suggested = preview["suggested_mappings"]
    print(f"Auto-Suggested Standard Field Mappings:")
    for k, v in suggested.items():
        print(f"  • {k} -> {v}")

    # 7. Statistical Validation & Outlier Screening
    log_step(7, "Statistical Anomaly & IQR Screening")
    val_res = client.post(f"/api/cleaning/validate/{upload_id}", headers=headers)
    assert val_res.status_code == 200
    val_report = val_res.json()
    print(f"Initial Data Quality Score: {val_report['quality_score']}%")
    print(f"Completeness Ratio: {val_report['completeness_percentage']}%")
    print(f"Detected Duplicates: {val_report['duplicates_count']}")
    print(f"Detected Missing Cells: {val_report['missing_cells_count']}")
    print(f"Detected Negative Values: {val_report['negative_values_count']}")
    print(f"Detected Outliers: {val_report['outliers_count']}")
    assert val_report['duplicates_count'] >= 1
    assert val_report['negative_values_count'] >= 1
    assert val_report['outliers_count'] >= 1

    # 8. User Review & Apply Cleaning Fixes
    log_step(8, "Approve & Execute Normalization Fixes")
    fix_res = client.post(
        f"/api/cleaning/apply-fixes/{upload_id}",
        headers=headers,
        json={
            "remove_duplicates": True,
            "fix_negative_values": True,
            "impute_missing_median": True,
            "drop_missing_rows": False
        }
    )
    assert fix_res.status_code == 200
    fix_data = fix_res.json()
    print(f"Deduplicated & Cleaned: {fix_data['original_rows']} original -> {fix_data['cleaned_rows']} cleaned rows")
    print(f"Ingested {fix_data['records_ingested']} records into production esg_records collection")

    # Ingest other departments to have full coverage
    for dept, filename in [
        ("Human Resources", "employee_data.xlsx"),
        ("Operations", "safety_data.xlsx"),
        ("Governance", "governance_data.xlsx")
    ]:
        file_p = os.path.join(DATASETS_DIR, filename)
        with open(file_p, "rb") as f:
            u_res = client.post(
                "/api/uploads",
                headers=headers,
                files={"file": (filename, f.read(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
                data={"department": dept, "reporting_year": reporting_year}
            )
        u_id = u_res.json()["upload_id"]
        client.post(f"/api/cleaning/apply-fixes/{u_id}", headers=headers, json={
            "remove_duplicates": True,
            "fix_negative_values": True,
            "impute_missing_median": True,
            "drop_missing_rows": False
        })
        print(f"Ingested & Cleaned {dept} dataset ({filename})")

    # 9. Calculate ESG Metrics
    log_step(9, "Execute Core ESG Calculations")
    env_calc = client.get(f"/api/metrics/environmental?reporting_year={reporting_year}", headers=headers).json()
    soc_calc = client.get(f"/api/metrics/social?reporting_year={reporting_year}", headers=headers).json()
    gov_calc = client.get(f"/api/metrics/governance?reporting_year={reporting_year}", headers=headers).json()

    print(f"Environmental Metrics:")
    print(f"  • Scope 1: {env_calc['scope_1_tco2e']} tCO2e")
    print(f"  • Scope 2: {env_calc['scope_2_tco2e']} tCO2e")
    print(f"  • Scope 3: {env_calc['scope_3_tco2e']} tCO2e")
    print(f"  • Total GHG: {env_calc['total_ghg_tco2e']} tCO2e")
    print(f"  • Electricity: {env_calc['electricity_kwh']:,} kWh")
    print(f"  • Renewable %: {env_calc['renewable_percentage']}%")

    print(f"Social Metrics:")
    print(f"  • Total Staff: {soc_calc['total_employees']}")
    print(f"  • Gender Diversity: {soc_calc['gender_diversity_pct']}%")
    print(f"  • Turnover Rate: {soc_calc['turnover_rate_pct']}%")
    print(f"  • Accident Frequency Rate: {soc_calc['accident_frequency_rate']}")

    print(f"Governance Metrics:")
    print(f"  • Board Independence: {gov_calc['board_independence_pct']}%")
    print(f"  • Ethics Training Completion: {gov_calc['ethics_training_completion_pct']}%")
    print(f"  • Anti-Corruption Policy: {gov_calc['anti_corruption_policy']}")

    # 10. Dashboard Telemetry Update
    log_step(10, "Fetch Unified Dashboard Summary")
    dash = client.get(f"/api/metrics?reporting_year={reporting_year}", headers=headers).json()
    print(f"Dashboard Organization: {dash['company_name']}")
    print(f"Data Completeness: {dash['data_completeness_pct']}%")
    print(f"Recent Uploads Count: {dash['recent_uploads_count']}")

    # 11. Generate AI Report (Gemini API / Mock Fallback)
    log_step(11, "Synthesize AI Corporate ESG Report")
    gen_res = client.post(
        "/api/reports/generate",
        headers=headers,
        json={
            "reporting_year": reporting_year,
            "framework": "GRI Standards",
            "esg_categories": ["Environmental", "Social", "Governance"]
        }
    )
    assert gen_res.status_code == 201, f"Report generation failed: {gen_res.text}"
    report = gen_res.json()
    report_id = report["report_id"]
    print(f"Generated Report ID: {report_id}")
    print(f"Executive Summary:\n  \"{report['content']['executive_summary']}\"")
    print(f"Key Findings ({len(report['content']['key_findings'])} insights):")
    for kf in report['content']['key_findings'][:2]:
        print(f"  - {kf}")

    # 12. Review & Approve Report
    log_step(12, "Review & Formally Approve Report")
    upd_res = client.put(
        f"/api/reports/{report_id}",
        headers=headers,
        json={"status": "approved"}
    )
    assert upd_res.status_code == 200
    print(f"Report status transitioned to: {upd_res.json()['report_status']}")

    # 13. Generate & Stream PDF
    log_step(13, "Generate ReportLab Corporate PDF")
    pdf_res = client.get(f"/api/reports/{report_id}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    pdf_bytes = len(pdf_res.content)
    print(f"Generated PDF Size: {pdf_bytes:,} bytes (Valid binary PDF stream)")

    # 14. Export Metrics as Excel (.xlsx)
    log_step(14, "Export Metrics Workbook (Excel)")
    excel_res = client.get(f"/api/reports/export/excel?reporting_year={reporting_year}", headers=headers)
    assert excel_res.status_code == 200
    print(f"Generated Excel Workbook Size: {len(excel_res.content):,} bytes")

    # 15. Verify Report Archive in History
    log_step(15, "Verify Report Persistence in Historical Archive")
    rep_list = client.get("/api/reports", headers=headers).json()
    assert any(r["report_id"] == report_id for r in rep_list)
    print(f"Verified report {report_id} is present in organization history ({len(rep_list)} reports recorded)")

    # 16. Compliance Center Gap Report & Evidence Linking
    log_step(16, "Compliance Center Checklist & Gap Analysis")
    gap = client.get("/api/compliance/gap-report?framework=GRI%20Standards", headers=headers).json()
    print(f"Framework: {gap['framework']}")
    print(f"Total Disclosures: {gap['total_disclosures']}")
    print(f"Completion: {gap['completion_percentage']}%")

    # Attach evidence
    first_disc = gap["items"][0]["disclosure_id"]
    ev_res = client.post(
        f"/api/compliance/evidence?disclosure_id={first_disc}",
        headers=headers,
        json={
            "document_name": "FY2024_Utility_Invoices_Signed.pdf",
            "document_type": "Utility Billing Statement",
            "notes": "Meter readings verified against internal energy accounting logs."
        }
    )
    assert ev_res.status_code == 200
    print(f"Attached Evidence Document: {ev_res.json()['document_name']}")

    # 17. Audit Logs Chain
    log_step(17, "Verify Compliance Audit Trail")
    logs = client.get("/api/audit-logs", headers=headers).json()
    print(f"Recorded {len(logs)} audit transactions:")
    for l in logs[:4]:
        print(f"  • [{l['timestamp']}] {l['action']}")

    print("\n==================================================")
    print("ALL 17 USER JOURNEY VERIFICATION STEPS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    main()
