def test_report_generation_and_pdf(client, registered_user):
    # 1. Generate Report
    gen_resp = client.post(
        "/api/reports/generate",
        headers=registered_user["headers"],
        json={
            "reporting_year": 2024,
            "framework": "GRI Standards",
            "esg_categories": ["Environmental", "Social", "Governance"]
        }
    )
    assert gen_resp.status_code == 201
    report_data = gen_resp.json()
    report_id = report_data["report_id"]
    assert "executive_summary" in report_data["content"]
    assert report_data["framework"] == "GRI Standards"

    # 2. Download PDF
    pdf_resp = client.get(f"/api/reports/{report_id}/pdf", headers=registered_user["headers"])
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 1000

    # 3. Export Excel Metrics
    excel_resp = client.get("/api/reports/export/excel?reporting_year=2024", headers=registered_user["headers"])
    assert excel_resp.status_code == 200
    assert "spreadsheetml" in excel_resp.headers["content-type"]

def test_compliance_checklist_and_gap_report(client, registered_user):
    # 1. Fetch Checklists
    chk_resp = client.get("/api/compliance/checklists", headers=registered_user["headers"])
    assert chk_resp.status_code == 200
    items = chk_resp.json()
    assert len(items) > 0
    disclosure_id = items[0]["disclosure_id"]

    # 2. Update status
    upd_resp = client.put(
        f"/api/compliance/disclosures/{disclosure_id}/status",
        headers=registered_user["headers"],
        json={"approval_status": "Approved", "evidence_status": "Approved", "reviewer_notes": "Audited"}
    )
    assert upd_resp.status_code == 200

    # 3. Gap Report
    gap_resp = client.get("/api/compliance/gap-report?framework=GRI%20Standards", headers=registered_user["headers"])
    assert gap_resp.status_code == 200
    gap_data = gap_resp.json()
    assert gap_data["total_disclosures"] > 0
    assert gap_data["completion_percentage"] >= 0

