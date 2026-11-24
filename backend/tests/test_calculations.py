def test_metrics_endpoints(client, registered_user):
    # Test environmental metrics
    env_resp = client.get("/api/metrics/environmental?reporting_year=2024", headers=registered_user["headers"])
    assert env_resp.status_code == 200
    env_data = env_resp.json()
    assert env_data["total_ghg_tco2e"] > 0
    assert env_data["scope_1_tco2e"] >= 0
    assert env_data["scope_2_tco2e"] >= 0
    assert env_data["renewable_percentage"] >= 0

    # Test social metrics
    soc_resp = client.get("/api/metrics/social?reporting_year=2024", headers=registered_user["headers"])
    assert soc_resp.status_code == 200
    soc_data = soc_resp.json()
    assert soc_data["total_employees"] > 0
    assert 0 <= soc_data["gender_diversity_pct"] <= 100

    # Test governance metrics
    gov_resp = client.get("/api/metrics/governance?reporting_year=2024", headers=registered_user["headers"])
    assert gov_resp.status_code == 200
    gov_data = gov_resp.json()
    assert gov_data["total_board_members"] > 0
    assert gov_data["board_independence_pct"] > 0

    # Test YoY comparison
    yoy_resp = client.get("/api/metrics/yoy?reporting_year=2024", headers=registered_user["headers"])
    assert yoy_resp.status_code == 200
    yoy_data = yoy_resp.json()
    assert len(yoy_data["metrics"]) > 0

