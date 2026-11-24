def test_multi_tenancy_isolation(client):
    # Register Company A
    comp_a_resp = client.post("/api/auth/register", json={
        "name": "User Alpha",
        "email": "alpha@companya.com",
        "password": "Password123!",
        "company_name": "Company Alpha"
    })
    token_a = comp_a_resp.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register Company B
    comp_b_resp = client.post("/api/auth/register", json={
        "name": "User Beta",
        "email": "beta@companyb.com",
        "password": "Password123!",
        "company_name": "Company Beta"
    })
    token_b = comp_b_resp.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Company A uploads a file
    csv_content = b"date,electricity_kwh\n2024-01-01,1000\n"
    up_resp = client.post(
        "/api/uploads",
        headers=headers_a,
        files={"file": ("alpha_data.csv", csv_content, "text/csv")},
        data={"department": "Environmental", "reporting_year": 2024}
    )
    upload_id_a = up_resp.json()["upload_id"]

    # Company B tries to access Company A's upload directly
    forbidden_resp = client.get(f"/api/uploads/{upload_id_a}", headers=headers_b)
    assert forbidden_resp.status_code == 404, "Company B must NOT be able to view Company A's upload"

    # Company B lists uploads -> Company A's upload must NOT appear
    list_b = client.get("/api/uploads", headers=headers_b).json()
    assert not any(item["upload_id"] == upload_id_a for item in list_b)

