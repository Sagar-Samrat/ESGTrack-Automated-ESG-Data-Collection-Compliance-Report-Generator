# ESGTrack Compliance & Calculation Methodology

This document outlines the accounting formulas, statistical validation rules, and regulatory framework cross-mappings implemented in ESGTrack.

---

## 1. Greenhouse Gas (GHG) Accounting

Aligned with the **GHG Protocol Corporate Accounting and Reporting Standard** and **ISO 14064-1**:

### Scope 1 (Direct Emissions)
Emissions resulting from stationary and mobile fuel combustion owned or controlled by the enterprise (e.g., backup diesel generators, vehicle fleet).
$$\text{Scope 1 } (tCO_2e) = \text{Fuel Consumed (L)} \times \text{EF}_{\text{diesel}} (0.00268 \text{ } tCO_2e/\text{L})$$

### Scope 2 (Indirect Emissions — Location-Based)
Emissions from the generation of purchased electricity consumed by the company's facilities.
$$\text{Scope 2 } (tCO_2e) = \text{Grid Electricity (kWh)} \times \text{EF}_{\text{grid}} (0.000416 \text{ } tCO_2e/\text{kWh})$$

### Scope 3 (Value Chain Indirect Emissions)
Operational water consumption and municipal solid waste disposal:
$$\text{Scope 3 } (tCO_2e) = \left[\text{Water } (m^3) \times 0.000344\right] + \left[\text{Waste } (kg) \times 0.000586\right]$$

### Renewable Energy Ratio
$$\text{Renewable \%} = \frac{\text{Renewable Electricity Sourced (kWh)}}{\text{Total Electricity Consumed (kWh)}} \times 100$$

---

## 2. Social & Human Capital Formulas

Aligned with **GRI 400 Series** and **OSHA / HSE**:

### Gender Diversity Ratio
$$\text{Gender Diversity \%} = \frac{\text{Female Employees}}{\text{Total Headcount}} \times 100$$

### Employee Turnover Rate
$$\text{Turnover Rate \%} = \frac{\text{Total Exits in Reporting Year}}{\text{Average Headcount in Year}} \times 100$$

### Lost-Time Accident Frequency Rate (AFR)
Normalized to 1,000,000 labor hours:
$$\text{AFR} = \frac{\text{Total Workplace Incidents} \times 1,000,000}{\text{Total Productive Work Hours}}$$

---

## 3. Governance Metrics

Aligned with **GRI 205 (Anti-Corruption)** and **GRI 2-9 (Governance Structure)**:

### Board Independence Percentage
$$\text{Independence \%} = \frac{\text{Independent Non-Executive Board Members}}{\text{Total Board Members}} \times 100$$

### Ethics & Anti-Bribery Training Completion Rate
$$\text{Completion \%} = \frac{\text{Personnel Completing Modules}}{\text{Total Eligible Personnel}} \times 100$$

---

## 4. Data Quality Scoring ($0-100\%$)

Let $N$ be total dataset cells, $R$ total rows.
$$\text{Score} = 100 - \left(40 \times \frac{\text{Missing Cells}}{N}\right) - \left(25 \times \frac{\text{Duplicate Rows}}{R}\right) - \left(30 \times \frac{\text{Negative Violations}}{R}\right) - \left(15 \times \frac{\text{IQR Outliers}}{R}\right)$$
The score is bounded between $0.0\%$ and $100.0\%$.

---

## 5. Regulatory Framework Cross-Reference

| Standard Code | Metric Title | Activity Ingestion Source |
| :--- | :--- | :--- |
| **GRI 302-1** | Energy consumption within organization | `environmental_data.xlsx` (`electricity_kwh`) |
| **GRI 305-1** | Scope 1 direct greenhouse gas emissions | `environmental_data.xlsx` (`fuel_consumption_liters`) |
| **GRI 305-2** | Scope 2 indirect purchased electricity | `environmental_data.xlsx` (`electricity_kwh`) |
| **GRI 303-5** | Water withdrawal and consumption | `environmental_data.xlsx` (`water_consumption_m3`) |
| **GRI 306-3** | Solid waste generation by pathway | `environmental_data.xlsx` (`waste_generated_kg`) |
| **GRI 405-1** | Diversity of governance and employees | `employee_data.xlsx` (`gender`) |
| **GRI 401-1** | New employee hires and turnover | `employee_data.xlsx` (`joining_date`, `exit_date`) |
| **GRI 403-9** | Work-related injuries & lost days | `safety_data.xlsx` (`workplace_accidents`, `lost_work_days`) |
| **GRI 205-2** | Anti-corruption training completion | `governance_data.xlsx` (`ethics_training_completed`) |
| **IFRS S2** | Climate risk & emissions disclosures | Aggregate Scope 1, Scope 2, Scope 3 |

