import os
import io

def test_upload_excel_dataset(client, registered_user):
    dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../datasets/environmental_data.xlsx"))
    assert os.path.exists(dataset_path), "Sample environmental_data.xlsx must exist"

    with open(dataset_path, "rb") as f:
        file_bytes = f.read()

    resp = client.post(
        "/api/uploads",
        headers=registered_user["headers"],
        files={"file": ("environmental_data.xlsx", file_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        data={"department": "Environmental", "reporting_year": 2024}
    )
    assert resp.status_code == 201
    upload_data = resp.json()
    assert upload_data["status"] == "uploaded"
    assert upload_data["total_rows"] > 0
    upload_id = upload_data["upload_id"]

    # Preview
    preview_resp = client.post(f"/api/uploads/{upload_id}/preview", headers=registered_user["headers"])
    assert preview_resp.status_code == 200
    preview_json = preview_resp.json()
    assert len(preview_json["sample_rows"]) > 0
    assert "electricity_kwh" in preview_json["columns"]

def test_upload_csv_dataset(client, registered_user):
    csv_content = b"date,electricity_kwh,water_consumption_m3\n2024-01-01,42000,1200\n2024-02-01,41000,1180\n"
    resp = client.post(
        "/api/uploads",
        headers=registered_user["headers"],
        files={"file": ("monthly_energy.csv", csv_content, "text/csv")},
        data={"department": "Environmental", "reporting_year": 2024}
    )
    assert resp.status_code == 201
    assert resp.json()["total_rows"] == 2

def test_unsupported_file_extension(client, registered_user):
    fake_content = b"Some random plain text"
    resp = client.post(
        "/api/uploads",
        headers=registered_user["headers"],
        files={"file": ("malicious.exe", fake_content, "application/octet-stream")},
        data={"department": "Environmental", "reporting_year": 2024}
    )
    assert resp.status_code == 400

