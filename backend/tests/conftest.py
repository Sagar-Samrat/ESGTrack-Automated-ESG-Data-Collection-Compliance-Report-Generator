import pytest
import os
import sys

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import db_manager
import mongomock

@pytest.fixture(scope="session", autouse=True)
def force_mock_db():
    db_manager.client = mongomock.MongoClient()
    db_manager.db = db_manager.client["test_esgtrack_db"]
    db_manager.is_mock = True
    db_manager.seed_demo_data()

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def registered_user(client):
    unique_email = f"lead.auditor.{os.urandom(4).hex()}@greenscale.io"
    payload = {
        "name": "Jane Sustainability Officer",
        "email": unique_email,
        "password": "SecurePassword123!",
        "company_name": "GreenScale Tech Corp"
    }
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    return {
        "token": data["access_token"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
        "user_id": data["user_id"],
        "company_id": data["company_id"],
        "company_name": data["company_name"]
    }

