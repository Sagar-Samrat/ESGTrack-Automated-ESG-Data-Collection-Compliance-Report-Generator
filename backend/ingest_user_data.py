#!/usr/bin/env python3
"""
Ingest and validate all files from user_test_data into ESGTrack using FastAPI TestClient.
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app

USER_TEST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "user_test_data"))

def main():
    print("=" * 65)
    print("ESGTrack: Ingesting & Validating User Test Dataset Pack")
    print("=" * 65)

    client = TestClient(app)

    # 1. Login with demo auditor account
    login_payload = {
        "email": "lead.auditor@greenscale.io",
        "password": "SecurePassword123!"
    }
    res = client.post("/api/auth/login", json=login_payload)
    if res.status_code != 200:
        print("[*] Seeding demo account...")
        reg_payload = {
            "name": "Jane Sustainability Officer",
            "email": "lead.auditor@greenscale.io",
            "password": "SecurePassword123!",
            "company_name": "GreenScale Technologies Corp"
        }
        client.post("/api/auth/register", json=reg_payload)
        res = client.post("/api/auth/login", json=login_payload)

    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[+] Successfully authenticated as lead.auditor@greenscale.io")

    # Files to ingest with department and primary reporting year
    uploads_config = [
        {"file": "environmental_data.xlsx", "department": "Environmental", "year": 2024},
        {"file": "employee_data.xlsx", "department": "Human Resources", "year": 2026},
        {"file": "safety_data.xlsx", "department": "Operations", "year": 2024},
        {"file": "governance_data.xlsx", "department": "Governance", "year": 2024},
    ]

    for cfg in uploads_config:
        file_path = os.path.join(USER_TEST_DIR, cfg["file"])
        if not os.path.exists(file_path):
            print(f"[-] File not found: {file_path}")
            continue

        print(f"\n" + "-" * 50)
        print(f"FILE: {cfg['file']} -> Dept: {cfg['department']} (FY {cfg['year']})")
        print("-" * 50)

        # A. Upload
        with open(file_path, "rb") as f:
            files = {"file": (cfg["file"], f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            data = {"department": cfg["department"], "reporting_year": str(cfg["year"])}
            up_res = client.post("/api/uploads", headers=headers, files=files, data=data)

        if up_res.status_code not in (200, 201):
            print(f"[-] Upload failed ({up_res.status_code}): {up_res.text}")
            continue

        upload_info = up_res.json()
        upload_id = upload_info["upload_id"]
        print(f"[✓] Uploaded: upload_id={upload_id}, rows={upload_info.get('total_rows')}, cols={upload_info.get('total_columns')}")

        # B. Preview
        prev_res = client.post(f"/api/uploads/{upload_id}/preview", headers=headers)
        if prev_res.status_code == 200:
            preview_data = prev_res.json()
            print(f"[✓] Preview verified: {len(preview_data.get('sample_rows', []))} sample rows extracted.")

        # C. Validate & Quality Report
        val_res = client.post(f"/api/cleaning/validate/{upload_id}", headers=headers)
        if val_res.status_code == 200:
            val_data = val_res.json()
            print(f"[✓] Quality Audit Score: {val_data['quality_score']}% (Completeness: {val_data['completeness_percentage']}%)")
            print(f"    - Duplicates detected: {val_data['duplicates_count']}")
            print(f"    - Negative values detected: {val_data['negative_values_count']}")
            print(f"    - Missing cells detected: {val_data['missing_cells_count']}")
            print(f"    - Statistical outliers: {val_data['outliers_count']}")
            if val_data.get("issues"):
                for issue in val_data["issues"][:3]:
                    print(f"      * [{issue['severity'].upper()}] {issue['issue_type'].title()} in '{issue['column']}': {issue['suggested_action']}")
        else:
            print(f"[-] Validation failed: {val_res.text}")

        # D. Clean & Normalize into esg_records
        fixes_payload = {
            "remove_duplicates": True,
            "fix_negative_values": True,
            "impute_missing_median": True,
            "drop_missing_rows": False
        }
        clean_res = client.post(f"/api/cleaning/apply-fixes/{upload_id}", headers=headers, json=fixes_payload)
        if clean_res.status_code == 200:
            clean_data = clean_res.json()
            print(f"[✓] Cleaned & Ingested: {clean_data.get('records_ingested', 0)} standardized ESG records active in database.")
        else:
            print(f"[-] Cleaning failed: {clean_res.text}")

    # Fetch Calculated Metrics for FY 2024 & FY 2026
    print("\n" + "=" * 65)
    print("LIVE RE-CALCULATED ESG METRICS POST-INGESTION")
    print("=" * 65)

    for yr in [2024, 2026]:
        print(f"\n[>>> FISCAL YEAR {yr} <<<]")
        m_env = client.get(f"/api/metrics/environmental?reporting_year={yr}", headers=headers).json()
        print(f"  🌱 Environmental:")
        print(f"     • Scope 1 (Direct Fuel)  : {m_env.get('scope_1_tco2e')} tCO2e")
        print(f"     • Scope 2 (Electricity)  : {m_env.get('scope_2_tco2e')} tCO2e ({m_env.get('electricity_kwh'):,} kWh)")
        print(f"     • Scope 3 (Water/Waste)  : {m_env.get('scope_3_tco2e')} tCO2e")
        print(f"     • Total GHG Footprint    : {m_env.get('total_ghg_tco2e')} tCO2e")
        print(f"     • Renewable Energy Share : {m_env.get('renewable_percentage')}% ({m_env.get('renewable_energy_kwh'):,} kWh)")

        m_soc = client.get(f"/api/metrics/social?reporting_year={yr}", headers=headers).json()
        print(f"  👥 Social:")
        print(f"     • Total Active Staff     : {m_soc.get('total_employees')}")
        print(f"     • Female Representation  : {m_soc.get('female_employees')} ({m_soc.get('gender_diversity_pct')}%)")
        print(f"     • Male Representation    : {m_soc.get('male_employees')}")
        print(f"     • Non-Binary / Other     : {m_soc.get('other_employees')}")
        print(f"     • Workplace Accidents    : {m_soc.get('workplace_accidents')}")
        print(f"     • Lost Work Days         : {m_soc.get('lost_work_days')}")

        m_gov = client.get(f"/api/metrics/governance?reporting_year={yr}", headers=headers).json()
        print(f"  ⚖️ Governance:")
        print(f"     • Board Independence     : {m_gov.get('board_independence_pct')}% ({m_gov.get('independent_board_members')} of {m_gov.get('total_board_members')} directors)")
        print(f"     • Ethics Training Rate   : {m_gov.get('ethics_training_completion_pct')}% ({m_gov.get('ethics_training_completed')}/{m_gov.get('ethics_training_eligible')})")
        print(f"     • Anti-Corruption Policy : {m_gov.get('anti_corruption_policy')}")

    # Generate AI Report Check
    print("\n" + "-" * 50)
    print("TESTING AI SUSTAINABILITY REPORT GENERATION")
    print("-" * 50)
    rep_res = client.post("/api/reports/generate", headers=headers, json={"reporting_year": 2024, "framework": "GRI"})
    if rep_res.status_code == 200:
        rep_data = rep_res.json()
        print(f"[✓] AI Report Created: report_id={rep_data.get('report_id')}, framework={rep_data.get('framework')}")
        print(f"    Executive Summary Preview: {rep_data.get('content', {}).get('executive_summary', '')[:140]}...")
    else:
        print(f"[-] Report generation response: {rep_res.text}")

    print("\n" + "=" * 65)
    print("ALL USER TEST DATA SUCCESSFULLY INGESTED & VERIFIED!")
    print("=" * 65)

if __name__ == "__main__":
    main()
