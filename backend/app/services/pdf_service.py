import os
import io
import pandas as pd
from datetime import datetime
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)
from app.config import settings

def generate_pdf_report(report_doc: Dict[str, Any]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Brand Colors: Forest Green (#064e3b), Emerald (#059669), Slate (#1e293b), Muted Gray (#64748b)
    primary_color = colors.HexColor("#064e3b")
    accent_color = colors.HexColor("#059669")
    neutral_dark = colors.HexColor("#0f172a")
    neutral_light = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")

    # Custom Typography Styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=accent_color,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=neutral_dark,
        spaceAfter=8
    )

    callout_style = ParagraphStyle(
        "CalloutBox",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        textColor=neutral_dark
    )

    elements = []

    # 1. Header Banner
    company_name = report_doc.get("company_name", "Corporate Enterprise")
    reporting_year = report_doc.get("reporting_year", 2024)
    framework = report_doc.get("framework", "GRI Standards")
    generated_at = report_doc.get("generated_at", datetime.now().strftime("%B %d, %Y"))

    elements.append(Paragraph(f"ESGTrack Corporate Sustainability Report", title_style))
    elements.append(Paragraph(f"{company_name} | Fiscal Year {reporting_year} | Framework: {framework}", subtitle_style))
    elements.append(Paragraph(f"Publication & Audit Date: {generated_at} | Status: {report_doc.get('report_status', 'Finalized').upper()}", callout_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=4, spaceAfter=14))

    # 2. Executive Summary
    content = report_doc.get("content", {})
    exec_summary = content.get("executive_summary", "Executive summary not provided.")
    elements.append(Paragraph("1. Executive Summary", h1_style))
    elements.append(Paragraph(exec_summary, body_style))
    elements.append(Spacer(1, 8))

    # 3. Verified Quantitative ESG Scorecards
    metrics = report_doc.get("metrics_summary", {})
    env = metrics.get("environmental", {})
    soc = metrics.get("social", {})
    gov = metrics.get("governance", {})

    elements.append(Paragraph("2. Key Quantitative Disclosures", h1_style))

    scorecard_data = [
        [Paragraph("ESG Category", table_header_style), Paragraph("Key Metric", table_header_style), Paragraph("Verified Value", table_header_style), Paragraph("Unit / Standard", table_header_style)],
        [Paragraph("Environmental", table_cell_style), Paragraph("Total GHG Emissions (Scope 1+2+3)", table_cell_style), Paragraph(f"{env.get('total_ghg_tco2e', 0):,.2f}", table_cell_style), Paragraph("tCO2e (GHG Protocol)", table_cell_style)],
        [Paragraph("Environmental", table_cell_style), Paragraph("Electricity Consumption", table_cell_style), Paragraph(f"{env.get('electricity_kwh', 0):,.1f}", table_cell_style), Paragraph("kWh", table_cell_style)],
        [Paragraph("Environmental", table_cell_style), Paragraph("Renewable Energy Share", table_cell_style), Paragraph(f"{env.get('renewable_percentage', 0):.1f}%", table_cell_style), Paragraph("% of Grid Demand", table_cell_style)],
        [Paragraph("Environmental", table_cell_style), Paragraph("Water Consumption", table_cell_style), Paragraph(f"{env.get('water_m3', 0):,.1f}", table_cell_style), Paragraph("m³", table_cell_style)],
        [Paragraph("Social", table_cell_style), Paragraph("Workforce Headcount", table_cell_style), Paragraph(f"{soc.get('total_employees', 0)}", table_cell_style), Paragraph("Active Headcount", table_cell_style)],
        [Paragraph("Social", table_cell_style), Paragraph("Gender Diversity Ratio", table_cell_style), Paragraph(f"{soc.get('gender_diversity_pct', 0):.1f}%", table_cell_style), Paragraph("Female / Underrepresented", table_cell_style)],
        [Paragraph("Social", table_cell_style), Paragraph("Workplace Incident Frequency", table_cell_style), Paragraph(f"{soc.get('accident_frequency_rate', 0):.2f}", table_cell_style), Paragraph("per 1,000,000 Hours", table_cell_style)],
        [Paragraph("Governance", table_cell_style), Paragraph("Board Independence Ratio", table_cell_style), Paragraph(f"{gov.get('board_independence_pct', 0):.1f}%", table_cell_style), Paragraph("% Non-Executive", table_cell_style)],
        [Paragraph("Governance", table_cell_style), Paragraph("Ethics & Anti-Bribery Training", table_cell_style), Paragraph(f"{gov.get('ethics_training_completion_pct', 0):.1f}%", table_cell_style), Paragraph("% Eligible Staff", table_cell_style)],
        [Paragraph("Governance", table_cell_style), Paragraph("Whistleblower & Anti-Corruption Policy", table_cell_style), Paragraph(f"{gov.get('anti_corruption_policy', 'Yes')}", table_cell_style), Paragraph("Adopted & Active", table_cell_style)]
    ]

    scorecard_table = Table(scorecard_data, colWidths=[1.3*inch, 2.7*inch, 1.4*inch, 1.8*inch])
    scorecard_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), primary_color),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, neutral_light]),
        ("GRID", (0, 0), (-1, -1), 0.5, border_color),
    ]))
    elements.append(scorecard_table)
    elements.append(Spacer(1, 14))

    # 4. Narratives & Methodological Disclosures
    elements.append(Paragraph("3. Environmental Performance Narrative", h1_style))
    elements.append(Paragraph(content.get("environmental_performance", "Environmental narrative details."), body_style))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("4. Social & Labor Performance Narrative", h1_style))
    elements.append(Paragraph(content.get("social_performance", "Social narrative details."), body_style))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("5. Corporate Governance & Ethics Narrative", h1_style))
    elements.append(Paragraph(content.get("governance_performance", "Governance narrative details."), body_style))
    elements.append(Spacer(1, 6))

    # 5. Strategic Recommendations & Limitations
    elements.append(Paragraph("6. Key Findings & Areas for Improvement", h1_style))
    for finding in content.get("key_findings", []):
        elements.append(Paragraph(f"• <b>Key Finding:</b> {finding}", body_style))
    for area in content.get("areas_for_improvement", []):
        elements.append(Paragraph(f"• <b>Strategic Priority:</b> {area}", body_style))
    elements.append(Spacer(1, 8))

    elements.append(Paragraph("7. Data Limitations & Assurance Notice", h1_style))
    limitations = content.get("missing_data_and_limitations", "No material data limitations noted.")
    elements.append(Paragraph(limitations, body_style))
    elements.append(Spacer(1, 8))

    # Regulatory Disclaimer
    elements.append(HRFlowable(width="100%", thickness=0.5, color=border_color, spaceBefore=8, spaceAfter=8))
    elements.append(Paragraph(
        "<b>Assurance Disclaimer:</b> This report is generated by ESGTrack software based on departmental activity data supplied by the reporting organization. "
        "Emission calculations utilize documented standards (GHG Protocol, US EPA eGRID, UK DEFRA). Framework mappings (GRI, IFRS S1/S2) should be reviewed against current regulatory updates. "
        "ESGTrack does not provide formal legal or certified accounting attestation.",
        callout_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_excel_metrics_export(company_id: str, reporting_year: int, env: dict, soc: dict, gov: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        # Sheet 1: Environmental
        env_summary = {
            "Metric": ["Scope 1 Direct GHG", "Scope 2 Location-Based GHG", "Scope 3 Value Chain GHG", "Total GHG", "Grid Electricity", "Renewable Energy", "Renewable Share", "Water Consumption", "Solid Waste"],
            "Value": [env.get("scope_1_tco2e", 0), env.get("scope_2_tco2e", 0), env.get("scope_3_tco2e", 0), env.get("total_ghg_tco2e", 0), env.get("electricity_kwh", 0), env.get("renewable_energy_kwh", 0), env.get("renewable_percentage", 0), env.get("water_m3", 0), env.get("waste_kg", 0)],
            "Unit": ["tCO2e", "tCO2e", "tCO2e", "tCO2e", "kWh", "kWh", "%", "m3", "kg"]
        }
        pd.DataFrame(env_summary).to_excel(writer, sheet_name="Environmental", index=False)

        # Sheet 2: Social
        soc_summary = {
            "Metric": ["Total Headcount", "Female Employees", "Male Employees", "Gender Diversity Ratio", "Turnover Rate", "Workplace Accidents", "Lost Work Days", "Safety Training Hours", "Accident Frequency Rate"],
            "Value": [soc.get("total_employees", 0), soc.get("female_employees", 0), soc.get("male_employees", 0), soc.get("gender_diversity_pct", 0), soc.get("turnover_rate_pct", 0), soc.get("workplace_accidents", 0), soc.get("lost_work_days", 0), soc.get("safety_training_hours", 0), soc.get("accident_frequency_rate", 0)],
            "Unit": ["Count", "Count", "Count", "%", "%", "Incidents", "Days", "Hours", "per Million Hours"]
        }
        pd.DataFrame(soc_summary).to_excel(writer, sheet_name="Social", index=False)

        # Sheet 3: Governance
        gov_summary = {
            "Metric": ["Total Board Members", "Independent Board Members", "Board Independence Ratio", "Ethics Training Eligible", "Ethics Training Completed", "Ethics Training Ratio", "Anti-Corruption Policy", "Board Meetings"],
            "Value": [gov.get("total_board_members", 0), gov.get("independent_board_members", 0), gov.get("board_independence_pct", 0), gov.get("ethics_training_eligible", 0), gov.get("ethics_training_completed", 0), gov.get("ethics_training_completion_pct", 0), gov.get("anti_corruption_policy", "Yes"), gov.get("board_meeting_count", 0)],
            "Unit": ["Count", "Count", "%", "Count", "Count", "%", "Binary", "Meetings"]
        }
        pd.DataFrame(gov_summary).to_excel(writer, sheet_name="Governance", index=False)

    buffer.seek(0)
    return buffer

