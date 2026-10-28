import io
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# Brand Colors: Gold and Charcoal
COLOR_CHARCOAL = colors.HexColor("#121214")
COLOR_GOLD = colors.HexColor("#D4AF37")
COLOR_GOLD_LIGHT = colors.HexColor("#F9F5EA")
COLOR_TEXT = colors.HexColor("#2B2D42")
COLOR_MUTED = colors.HexColor("#6C757D")
COLOR_PASS = colors.HexColor("#2E7D32")
COLOR_FAIL = colors.HexColor("#C62828")

def generate_run_pdf(
    run_data: Dict[str, Any],
    target_data: Dict[str, Any],
    calls_data: List[Dict[str, Any]]
) -> bytes:
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

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=COLOR_CHARCOAL
    )
    tagline_style = ParagraphStyle(
        "Tagline",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=11,
        leading=14,
        textColor=COLOR_GOLD
    )
    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=COLOR_CHARCOAL,
        spaceBefore=14,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=COLOR_TEXT
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=COLOR_MUTED
    )

    elements = []

    # Header / Branding
    elements.append(Paragraph("KASAUTI", title_style))
    elements.append(Paragraph("Test it like gold before you dial.", tagline_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_GOLD, spaceBefore=4, spaceAfter=14))

    # Run Metadata & Purity Score Box
    purity_score = run_data.get("purity_score", 0.0)
    score_text = f"<b>Purity Score: {purity_score}%</b>"

    meta_table_data = [
        [
            Paragraph(f"<b>Target Agent:</b> {target_data.get('name', 'N/A')}", body_style),
            Paragraph(score_text, ParagraphStyle("ScoreBig", parent=body_style, fontSize=13, textColor=COLOR_GOLD))
        ],
        [
            Paragraph(f"<b>Phone Number:</b> {target_data.get('phone_number', 'N/A')}", body_style),
            Paragraph(f"<b>Passed:</b> {run_data.get('passed_calls', 0)} / {run_data.get('total_calls', 0)}", body_style)
        ],
        [
            Paragraph(f"<b>Run ID:</b> {run_data.get('id', 'N/A')}", body_style),
            Paragraph(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}", body_style)
        ]
    ]

    meta_table = Table(meta_table_data, colWidths=[320, 210])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_GOLD_LIGHT),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_GOLD),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 14))

    # Legal Disclaimer
    disclaimer_text = (
        "<b>LEGAL DISCLAIMER:</b> Kasauti checks agent behavior against a TRAI-style rule pack. "
        "This report is for testing and simulation purposes only and does NOT constitute formal legal advice. "
        "All rules marked 'unverified' must be verified against official TRAI Gazette publications."
    )
    elements.append(Paragraph(disclaimer_text, disclaimer_style))
    elements.append(Spacer(1, 14))

    # Scenario Results Table
    elements.append(Paragraph("Scenario Test Results", h2_style))

    table_data = [
        [
            Paragraph("<b>Scenario</b>", body_style),
            Paragraph("<b>Language</b>", body_style),
            Paragraph("<b>Outcome</b>", body_style),
            Paragraph("<b>Checks & Evidence</b>", body_style)
        ]
    ]

    for call in calls_data:
        scenario = call.get("scenario", {})
        checks = call.get("checks", [])
        passed = all(c.get("passed", False) for c in checks) if checks else False

        outcome_style = ParagraphStyle(
            "Outcome",
            parent=body_style,
            fontName="Helvetica-Bold",
            textColor=COLOR_PASS if passed else COLOR_FAIL
        )
        outcome_label = "PASS [Purity 100%]" if passed else "FAIL"

        evidence_lines = []
        for c in checks:
            badge = "[UNVERIFIED RULE]" if c.get("kind") == "rule" else "[RUBRIC]"
            status_symbol = "✓" if c.get("passed") else "✗"
            rule_name = c.get("rule_id", "unknown")
            ev = c.get("evidence", "")[:90]
            evidence_lines.append(f"{status_symbol} {badge} <b>{rule_name}</b>: {ev}")

        evidence_para = Paragraph("<br/>".join(evidence_lines) if evidence_lines else "No checks recorded", body_style)

        table_data.append([
            Paragraph(f"<b>{scenario.get('title', call.get('scenario_id'))}</b>", body_style),
            Paragraph(scenario.get("language", "N/A"), body_style),
            Paragraph(outcome_label, outcome_style),
            evidence_para
        ])

    results_table = Table(table_data, colWidths=[130, 70, 90, 240])
    results_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_CHARCOAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    # Fix header text colors
    for col in range(4):
        table_data[0][col].style.textColor = colors.white

    elements.append(results_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
