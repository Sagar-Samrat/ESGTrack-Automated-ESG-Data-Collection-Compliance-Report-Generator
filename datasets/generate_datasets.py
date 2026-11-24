"""
Script to generate 5 synthetic ESG Excel datasets for ESGTrack testing.
Produces real .xlsx files with 3 years of data (2022, 2023, 2024),
including controlled anomalies (missing values, duplicates, negative numbers, outliers)
to thoroughly exercise the validation and cleaning engine.
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, date

DATASETS_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(DATASETS_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. environmental_data.xlsx
# Columns: date, electricity_kwh, water_consumption_m3, waste_generated_kg, renewable_energy_kwh, fuel_consumption_liters
# -------------------------------------------------------------
def generate_environmental_data():
    records = []
    # 3 years monthly: 2022-01 to 2024-12 = 36 months
    dates = pd.date_range(start="2022-01-01", end="2024-12-01", freq="MS")

    for dt in dates:
        year = dt.year
        month = dt.month

        # Seasonal variation: higher electricity in summer/winter (HVAC)
        base_kwh = 45000 + (year - 2022) * 2000
        season_kwh = 6000 * np.sin(month / 12 * 2 * np.pi)
        electricity = round(base_kwh + season_kwh + random.uniform(-1500, 1500), 2)

        # Renewable energy: increasing trend over years
        renewable_ratio = 0.15 + (year - 2022) * 0.08 + random.uniform(-0.02, 0.03)
        renewable_ratio = min(max(renewable_ratio, 0.1), 0.5)
        renewable = round(electricity * renewable_ratio, 2)

        # Water: ~1,200 to 1,800 m3
        water = round(1200 + (year - 2022) * 50 + random.uniform(-100, 200), 2)

        # Waste: ~3,500 to 5,000 kg
        waste = round(4200 - (year - 2022) * 150 + random.uniform(-250, 250), 2)

        # Fuel (Diesel for generators & fleet): ~2,000 to 3,500 liters
        fuel = round(2800 - (year - 2022) * 120 + random.uniform(-200, 200), 2)

        records.append({
            "date": dt.strftime("%Y-%m-%d"),
            "electricity_kwh": electricity,
            "water_consumption_m3": water,
            "waste_generated_kg": waste,
            "renewable_energy_kwh": renewable,
            "fuel_consumption_liters": fuel
        })

    # Intentional anomalies for testing validation engine:
    # 1. Duplicate row: duplicate record 4 at record 37
    dup_row = dict(records[4])
    records.append(dup_row)

    # 2. Missing value in water_consumption_m3
    records[10]["water_consumption_m3"] = np.nan

    # 3. Invalid negative consumption value (not permitted)
    records[15]["electricity_kwh"] = -420.50

    # 4. Statistical Outlier (Spike) in waste_generated_kg
    records[22]["waste_generated_kg"] = 48500.0  # 10x normal value for outlier detection

    # 5. Missing value in fuel
    records[28]["fuel_consumption_liters"] = None

    df = pd.DataFrame(records)
    output_path = os.path.join(DATASETS_DIR, "environmental_data.xlsx")
    df.to_excel(output_path, index=False, engine="openpyxl")
    print(f"Generated {output_path} with {len(df)} rows.")

# -------------------------------------------------------------
# 2. employee_data.xlsx
# Columns: employee_id, department, gender, employment_type, joining_date, exit_date, reporting_year
# -------------------------------------------------------------
def generate_employee_data():
    records = []
    departments = ["Operations", "Finance", "Human Resources", "Engineering", "Marketing", "Sustainability"]
    genders = ["Female", "Male", "Non-Binary", "Prefer Not to Say"]
    gender_weights = [0.45, 0.48, 0.05, 0.02]
    emp_types = ["Full-Time", "Full-Time", "Full-Time", "Part-Time", "Contract"]

    emp_id_counter = 1001

    # Base active employees from 2021
    for i in range(120):
        gender = random.choices(genders, weights=gender_weights)[0]
        dept = random.choice(departments)
        emp_type = random.choice(emp_types)
        j_year = random.randint(2018, 2021)
        j_month = random.randint(1, 12)
        j_day = random.randint(1, 28)
        joining_date = f"{j_year}-{j_month:02d}-{j_day:02d}"

        # 2022 status
        records.append({
            "employee_id": f"EMP-{emp_id_counter}",
            "department": dept,
            "gender": gender,
            "employment_type": emp_type,
            "joining_date": joining_date,
            "exit_date": None,
            "reporting_year": 2022
        })
        emp_id_counter += 1

    # New hires and exits across 2022, 2023, 2024
    for yr in [2022, 2023, 2024]:
        # Add some hires each year
        hires_count = random.randint(15, 25)
        for _ in range(hires_count):
            gender = random.choices(genders, weights=gender_weights)[0]
            dept = random.choice(departments)
            emp_type = random.choice(emp_types)
            m = random.randint(1, 12)
            d = random.randint(1, 28)
            records.append({
                "employee_id": f"EMP-{emp_id_counter}",
                "department": dept,
                "gender": gender,
                "employment_type": emp_type,
                "joining_date": f"{yr}-{m:02d}-{d:02d}",
                "exit_date": None,
                "reporting_year": yr
            })
            emp_id_counter += 1

        # Mark some exits for turnover calculation
        exits_count = random.randint(5, 12)
        for _ in range(exits_count):
            gender = random.choices(genders, weights=gender_weights)[0]
            dept = random.choice(departments)
            emp_type = "Full-Time"
            j_date = f"{yr - random.randint(1, 3)}-03-15"
            exit_m = random.randint(1, 12)
            records.append({
                "employee_id": f"EMP-{random.randint(1001, 1080)}",
                "department": dept,
                "gender": gender,
                "employment_type": emp_type,
                "joining_date": j_date,
                "exit_date": f"{yr}-{exit_m:02d}-20",
                "reporting_year": yr
            })

    # Controlled anomalies:
    # 1. Duplicate employee_id
    records.append(dict(records[3]))
    # 2. Missing department
    records[12]["department"] = None
    # 3. Invalid gender string for validation testing
    records[25]["gender"] = "Unknown_Code"

    df = pd.DataFrame(records)
    output_path = os.path.join(DATASETS_DIR, "employee_data.xlsx")
    df.to_excel(output_path, index=False, engine="openpyxl")
    print(f"Generated {output_path} with {len(df)} rows.")

# -------------------------------------------------------------
# 3. safety_data.xlsx
# Columns: date, department, total_work_hours, workplace_accidents, lost_work_days, safety_training_hours
# -------------------------------------------------------------
def generate_safety_data():
    records = []
    departments = ["Operations", "Engineering", "Facilities", "Logistics"]
    dates = pd.date_range(start="2022-01-01", end="2024-12-01", freq="MS")

    for dt in dates:
        for dept in departments:
            # 25 employees * ~160 hours = ~4000 hours
            work_hours = round(random.uniform(3600, 4400), 1)
            # Accidents are rare: 90% chance of 0, 8% chance of 1, 2% chance of 2
            accidents = random.choices([0, 1, 2], weights=[0.92, 0.07, 0.01])[0]
            lost_days = accidents * random.randint(1, 6)
            training_hours = round(random.uniform(40, 120), 1)

            records.append({
                "date": dt.strftime("%Y-%m-%d"),
                "department": dept,
                "total_work_hours": work_hours,
                "workplace_accidents": accidents,
                "lost_work_days": lost_days,
                "safety_training_hours": training_hours
            })

    # Anomalies:
    # 1. Duplicate entry
    records.append(dict(records[2]))
    # 2. Negative lost work days (invalid)
    records[18]["lost_work_days"] = -3
    # 3. Missing training hours
    records[35]["safety_training_hours"] = np.nan

    df = pd.DataFrame(records)
    output_path = os.path.join(DATASETS_DIR, "safety_data.xlsx")
    df.to_excel(output_path, index=False, engine="openpyxl")
    print(f"Generated {output_path} with {len(df)} rows.")

# -------------------------------------------------------------
# 4. governance_data.xlsx
# Columns: reporting_year, total_board_members, independent_board_members, ethics_training_eligible, ethics_training_completed, anti_corruption_policy, board_meeting_count
# -------------------------------------------------------------
def generate_governance_data():
    records = [
        {
            "reporting_year": 2022,
            "total_board_members": 9,
            "independent_board_members": 5,
            "ethics_training_eligible": 150,
            "ethics_training_completed": 138,
            "anti_corruption_policy": "Yes",
            "board_meeting_count": 8
        },
        {
            "reporting_year": 2023,
            "total_board_members": 10,
            "independent_board_members": 7,
            "ethics_training_eligible": 175,
            "ethics_training_completed": 168,
            "anti_corruption_policy": "Yes",
            "board_meeting_count": 10
        },
        {
            "reporting_year": 2024,
            "total_board_members": 11,
            "independent_board_members": 8,
            "ethics_training_eligible": 210,
            "ethics_training_completed": 205,
            "anti_corruption_policy": "Yes",
            "board_meeting_count": 12
        },
        # Synthetic testing records for edge-case checks:
        {
            "reporting_year": 2021,
            "total_board_members": 8,
            "independent_board_members": 4,
            "ethics_training_eligible": 130,
            "ethics_training_completed": 115,
            "anti_corruption_policy": "Yes",
            "board_meeting_count": 6
        }
    ]

    df = pd.DataFrame(records)
    output_path = os.path.join(DATASETS_DIR, "governance_data.xlsx")
    df.to_excel(output_path, index=False, engine="openpyxl")
    print(f"Generated {output_path} with {len(df)} rows.")

# -------------------------------------------------------------
# 5. emission_factors.xlsx
# Columns: activity_type, emission_factor, unit, geography, source, reference_year
# Verified sources: GHG Protocol, US EPA, UK DEFRA 2023/2024
# -------------------------------------------------------------
def generate_emission_factors():
    records = [
        {
            "activity_type": "electricity_grid",
            "emission_factor": 0.000416,
            "unit": "tCO2e/kWh",
            "geography": "US Average (eGRID 2023)",
            "source": "US EPA eGRID",
            "reference_year": 2023
        },
        {
            "activity_type": "electricity_grid",
            "emission_factor": 0.000207,
            "unit": "tCO2e/kWh",
            "geography": "UK National Grid (2023)",
            "source": "UK DEFRA / DESNZ",
            "reference_year": 2023
        },
        {
            "activity_type": "fuel_diesel",
            "emission_factor": 0.00268,
            "unit": "tCO2e/liter",
            "geography": "Global",
            "source": "GHG Protocol Mobile Combustion Tool",
            "reference_year": 2023
        },
        {
            "activity_type": "fuel_petrol",
            "emission_factor": 0.00231,
            "unit": "tCO2e/liter",
            "geography": "Global",
            "source": "UK DEFRA 2023",
            "reference_year": 2023
        },
        {
            "activity_type": "water_supply_and_treatment",
            "emission_factor": 0.000344,
            "unit": "tCO2e/m3",
            "geography": "Global Average",
            "source": "UK DEFRA Water Supply / Wastewater Treatment",
            "reference_year": 2023
        },
        {
            "activity_type": "waste_landfill",
            "emission_factor": 0.000586,
            "unit": "tCO2e/kg",
            "geography": "Global Average",
            "source": "US EPA Waste Reduction Model (WARM)",
            "reference_year": 2023
        },
        {
            "activity_type": "waste_recycled",
            "emission_factor": 0.000021,
            "unit": "tCO2e/kg",
            "geography": "Global Average",
            "source": "US EPA WARM",
            "reference_year": 2023
        },
        {
            "activity_type": "business_travel_flight",
            "emission_factor": 0.000155,
            "unit": "tCO2e/passenger-km",
            "geography": "Short-Haul Average",
            "source": "ICAO Carbon Emissions Calculator",
            "reference_year": 2023
        }
    ]

    df = pd.DataFrame(records)
    output_path = os.path.join(DATASETS_DIR, "emission_factors.xlsx")
    df.to_excel(output_path, index=False, engine="openpyxl")
    print(f"Generated {output_path} with {len(df)} rows.")

if __name__ == "__main__":
    random.seed(42)
    np.random.seed(42)
    generate_environmental_data()
    generate_employee_data()
    generate_safety_data()
    generate_governance_data()
    generate_emission_factors()
    print("All 5 synthetic ESG datasets successfully created.")

