def test_register_and_login(client):
    email = "esg.officer@novacorp.com"
    password = "StrongPassword2025#"

    # 1. Register
    reg_resp = client.post("/api/auth/register", json={
        "name": "Alex Vance",
        "email": email,
        "password": password,
        "company_name": "Nova Enterprises"
    })
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "access_token" in data
    assert data["email"] == email
    assert data["company_name"] == "Nova Enterprises"

    # 2. Duplicate registration should fail
    dup_resp = client.post("/api/auth/register", json={
        "name": "Alex Vance Clone",
        "email": email,
        "password": password,
        "company_name": "Nova Enterprises"
    })
    assert dup_resp.status_code == 400

    # 3. Login
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data

    # 4. Auth Me
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {login_data['access_token']}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email

def test_login_invalid_password(client):
    resp = client.post("/api/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "wrongpassword"
    })
    assert resp.status_code == 401

