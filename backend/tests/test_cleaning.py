import os

def test_validation_and_cleaning_flow(client, registered_user):
    dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../datasets/environmental_data.xlsx"))
    with open(dataset_path, "rb") as f:
        file_bytes = f.read()

    # Upload
    up_resp = client.post(
        "/api/uploads",
        headers=registered_user["headers"],
        files={"file": ("environmental_data.xlsx", file_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        data={"department": "Environmental", "reporting_year": 2024}
    )
    upload_id = up_resp.json()["upload_id"]

    # 1. Validate dataset (should detect embedded anomalies: duplicate, negative, outlier, missing)
    val_resp = client.post(f"/api/cleaning/validate/{upload_id}", headers=registered_user["headers"])
    assert val_resp.status_code == 200
    val_data = val_resp.json()

    assert val_data["duplicates_count"] >= 1
    assert val_data["missing_cells_count"] >= 1
    assert val_data["negative_values_count"] >= 1
    assert val_data["outliers_count"] >= 1
    assert val_data["quality_score"] < 100.0

    # 2. Apply cleaning fixes
    fix_resp = client.post(
        f"/api/cleaning/apply-fixes/{upload_id}",
        headers=registered_user["headers"],
        json={
            "remove_duplicates": True,
            "fix_negative_values": True,
            "impute_missing_median": True,
            "drop_missing_rows": False
        }
    )
    assert fix_resp.status_code == 200
    fix_data = fix_resp.json()
    assert fix_data["status"] == "cleaned"
    assert fix_data["cleaned_rows"] <= fix_data["original_rows"]
    assert fix_data["records_ingested"] > 0

