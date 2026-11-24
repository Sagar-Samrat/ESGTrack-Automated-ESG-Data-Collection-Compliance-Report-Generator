"""
Configurable emission factors library with verified regulatory and standard sources:
- US EPA eGRID 2023
- UK DEFRA/DESNZ 2023 GHG Conversion Factors
- GHG Protocol Mobile and Stationary Combustion Tools
- US EPA WARM (Waste Reduction Model)
"""

DEFAULT_EMISSION_FACTORS = {
    # Electricity Grid (tCO2e per kWh)
    "electricity_grid_us": {
        "activity_type": "electricity_grid",
        "factor": 0.000416,
        "unit": "tCO2e/kWh",
        "geography": "US National Average",
        "source": "US EPA eGRID 2023",
        "year": 2023
    },
    "electricity_grid_uk": {
        "activity_type": "electricity_grid",
        "factor": 0.000207,
        "unit": "tCO2e/kWh",
        "geography": "UK National Grid",
        "source": "UK DEFRA 2023",
        "year": 2023
    },
    # Scope 1 Fuels (tCO2e per liter)
    "fuel_diesel": {
        "activity_type": "fuel_diesel",
        "factor": 0.00268,
        "unit": "tCO2e/liter",
        "geography": "Global Standard",
        "source": "GHG Protocol Stationary Combustion",
        "year": 2023
    },
    "fuel_petrol": {
        "activity_type": "fuel_petrol",
        "factor": 0.00231,
        "unit": "tCO2e/liter",
        "geography": "Global Standard",
        "source": "UK DEFRA 2023",
        "year": 2023
    },
    "natural_gas_kwh": {
        "activity_type": "natural_gas",
        "factor": 0.000183,
        "unit": "tCO2e/kWh",
        "geography": "Global Average",
        "source": "UK DEFRA 2023",
        "year": 2023
    },
    # Scope 3: Water (tCO2e per m3)
    "water_supply_treatment": {
        "activity_type": "water_consumption",
        "factor": 0.000344,
        "unit": "tCO2e/m3",
        "geography": "Global Average",
        "source": "UK DEFRA Water Supply and Wastewater",
        "year": 2023
    },
    # Scope 3: Waste (tCO2e per kg)
    "waste_landfill": {
        "activity_type": "waste_generation",
        "factor": 0.000586,
        "unit": "tCO2e/kg",
        "geography": "Global Average",
        "source": "US EPA WARM 2023",
        "year": 2023
    }
}

def get_emission_factor(activity_key: str) -> dict:
    return DEFAULT_EMISSION_FACTORS.get(activity_key, DEFAULT_EMISSION_FACTORS["electricity_grid_us"])

