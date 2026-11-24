ESGTrack Synthetic Test Dataset Pack
====================================

All records in these files are SYNTHETIC and created only for software testing.
They are not real company disclosures and must not be used as factual ESG reporting.

Files
-----
1. environmental_data.xlsx
   Monthly environmental records for 2024-2026.
   Includes a missing water value, a negative waste value, and one duplicate row.

2. employee_data.xlsx
   Synthetic employee-level records with department, gender, employment type,
   joining date, exit date and reporting year. Includes a duplicate employee ID.

3. safety_data.xlsx
   Monthly safety and training records for 2024-2026.
   Includes one missing accident count.

4. governance_data.xlsx
   Annual governance records for 2024-2026.
   Includes an intentionally invalid test row (zero board members, completed
   training greater than eligible, unknown policy value, negative meetings).

5. emission_factors.xlsx
   Illustrative placeholder factors for testing calculations only.
   These are NOT official factors. Replace them with verified, geography- and
   year-appropriate factors before producing real reports.

Suggested test sequence
-----------------------
1. Upload environmental_data.xlsx as Environmental.
2. Upload employee_data.xlsx as Human Resources.
3. Upload safety_data.xlsx as Operations / Safety.
4. Upload governance_data.xlsx as Governance.
5. Upload emission_factors.xlsx as Emission Factors / Reference Data.
6. Check previews, column mapping, missing values, duplicates, invalid values,
   and validation warnings.
7. Test calculations only after reviewing and correcting flagged records.

Units
-----
electricity_kwh: kWh
water_consumption_m3: cubic metres
waste_generated_kg: kg
renewable_energy_kwh: kWh
fuel_consumption_liters: litres
total_work_hours: hours
safety_training_hours: hours

Important
---------
Do not treat missing values as zero. Do not silently remove duplicate or invalid
records. Keep raw uploads separate from corrected/approved records.
