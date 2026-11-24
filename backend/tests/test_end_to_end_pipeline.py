import os
from fastapi.testclient import TestClient


def test_user_pack_batch_ingest_metrics_and_reports(client: TestClient, registered_user):
    headers = registered_user["headers"]
    user_pack_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../user_test_data"))
    if not os.path.exists(user_pack_dir):
        user_pack_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../datasets"))

    file_names = [
        "environmental_data.xlsx",
        "employee_data.xlsx",
        "safety_data.xlsx",
        "governance_data.xlsx",
        "emission_factors.xlsx",
    ]

    multipart_files = []
    for fname in file_names:
        fpath = os.path.join(user_pack_dir, fname)
        assert os.path.exists(fpath), f"Expected test dataset {fpath}"
        with open(fpath, "rb") as f:
            multipart_files.append(
                (
                    "files",
                    (
                        fname,
                        f.read(),
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ),
                )
            )

    batch_resp = client.post(
        "/api/uploads/batch",
        headers=headers,
        files=multipart_files,
        data={"default_reporting_year": "2024", "auto_process": "true"},
    )
    assert batch_resp.status_code == 201
    uploaded = batch_resp.json()
    assert len(uploaded) == 5

    by_name = {u["filename"]: u for u in uploaded}
    assert by_name["environmental_data.xlsx"]["department"] == "Environmental"
    assert by_name["employee_data.xlsx"]["department"] == "Human Resources"
    assert by_name["safety_data.xlsx"]["department"] == "Operations"
    assert by_name["governance_data.xlsx"]["department"] == "Governance"
    assert by_name["emission_factors.xlsx"]["department"] == "Emission Factors"

    for u in uploaded:
        assert u["status"] == "cleaned"
        assert u["total_rows"] > 0

    # Check 2026 metrics reflect newly ingested multi-year data
    metrics_2026 = client.get("/api/metrics?reporting_year=2026", headers=headers)
    assert metrics_2026.status_code == 200
    m26 = metrics_2026.json()
    assert m26["recent_uploads_count"] == 5
    assert m26["data_completeness_pct"] > 90.0
    assert m26["environmental"]["electricity_kwh"] > 0
    assert m26["social"]["total_employees"] == 120
    # Governance must ignore invalid total_board_members=0 row for 2026
    assert m26["governance"]["total_board_members"] == 9
    assert m26["governance"]["independent_board_members"] == 5
    assert len(m26["quality_alerts"]) > 0

    # Re-upload environmental_data.xlsx and ensure no double counting
    env_before = m26["environmental"]["electricity_kwh"]
    with open(os.path.join(user_pack_dir, "environmental_data.xlsx"), "rb") as f:
        reup = client.post(
            "/api/uploads",
            headers=headers,
            files={
                "file": (
                    "environmental_data.xlsx",
                    f.read(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
            data={"department": "Environmental", "reporting_year": "2024", "auto_process": "true"},
        )
    assert reup.status_code == 201
    m26_after = client.get("/api/metrics?reporting_year=2026", headers=headers).json()
    assert m26_after["environmental"]["electricity_kwh"] == env_before

    # Generate report for 2026 and check listing + PDF
    gen_resp = client.post(
        "/api/reports/generate",
        headers=headers,
        json={
            "reporting_year": 2026,
            "framework": "GRI Standards",
            "esg_categories": ["Environmental", "Social", "Governance"],
        },
    )
    assert gen_resp.status_code == 201
    rep = gen_resp.json()
    assert rep["metrics_summary"]["social"]["total_employees"] == 120

    list_rep = client.get("/api/reports", headers=headers)
    assert list_rep.status_code == 200
    assert any(r["report_id"] == rep["report_id"] for r in list_rep.json())

    pdf_resp = client.get(f"/api/reports/{rep['report_id']}/pdf", headers=headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"


def test_quick_ingest_non_canonical_columns_and_custom_mapping(client: TestClient, registered_user):
    headers = registered_user["headers"]
    csv_content = (
        b"date,electricity_consumption,water_consumption,total_waste,renewable_energy,fuel_liters\n"
        b"2025-01-01,10000,500,300,2000,100\n"
        b"2025-02-01,12000,,350,2500,150\n"
    )
    up_resp = client.post(
        "/api/uploads",
        headers=headers,
        files={"file": ("quick_test_2025.csv", csv_content, "text/csv")},
        data={"department": "Environmental", "reporting_year": "2025", "auto_process": "true"},
    )
    assert up_resp.status_code == 201
    upload_id = up_resp.json()["upload_id"]

    env_2025 = client.get("/api/metrics/environmental?reporting_year=2025", headers=headers).json()
    assert env_2025["electricity_kwh"] == 22000.0
    assert env_2025["water_m3"] == 1000.0  # 500 + imputed median 500

    # Apply explicit custom column mapping via apply-fixes
    fix_resp = client.post(
        f"/api/cleaning/apply-fixes/{upload_id}",
        headers=headers,
        json={
            "remove_duplicates": True,
            "fix_negative_values": True,
            "impute_missing_median": False,
            "drop_missing_rows": True,
            "column_mappings": {
                "date": "date",
                "electricity_consumption": "electricity_kwh",
                "water_consumption": "water_consumption_m3",
                "total_waste": "waste_generated_kg",
                "renewable_energy": "renewable_energy_kwh",
                "fuel_liters": "fuel_consumption_liters",
            },
        },
    )
    assert fix_resp.status_code == 200
    assert fix_resp.json()["cleaned_rows"] == 1
    env_2025_after = client.get("/api/metrics/environmental?reporting_year=2025", headers=headers).json()
    assert env_2025_after["electricity_kwh"] == 10000.0


def test_seeded_demo_uploads_validate_and_preview_without_keyerror(client: TestClient):
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "lead.auditor@greenscale.io", "password": "SecurePassword123!"},
    )
    assert login_resp.status_code == 200
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    uploads = client.get("/api/uploads", headers=headers).json()
    assert len(uploads) > 0
    for up in uploads:
        val_resp = client.post(f"/api/cleaning/validate/{up['upload_id']}", headers=headers)
        assert val_resp.status_code == 200
        prev_resp = client.post(f"/api/uploads/{up['upload_id']}/preview", headers=headers)
        assert prev_resp.status_code == 200

