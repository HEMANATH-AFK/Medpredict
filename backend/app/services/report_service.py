"""
Report Service — ReportLab PDF generation.
Produces a professional A4 medical report per prediction.
"""

from __future__ import annotations
from io import BytesIO
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# ── Colour palette ────────────────────────────────────────────────────────────
BRAND_BLUE    = colors.HexColor("#1E40AF")
BRAND_LIGHT   = colors.HexColor("#EFF6FF")
SEVERITY_COLS = {
    "Low":      colors.HexColor("#16A34A"),
    "Medium":   colors.HexColor("#CA8A04"),
    "High":     colors.HexColor("#EA580C"),
    "Critical": colors.HexColor("#DC2626"),
}
SHAP_RED   = colors.HexColor("#DC2626")
SHAP_BLUE  = colors.HexColor("#2563EB")
GRAY       = colors.HexColor("#6B7280")
LIGHT_GRAY = colors.HexColor("#F3F4F6")


def _styles() -> dict:
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "title", fontSize=22, fontName="Helvetica-Bold",
            textColor=BRAND_BLUE, alignment=TA_CENTER, spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "subtitle", fontSize=11, fontName="Helvetica",
            textColor=GRAY, alignment=TA_CENTER, spaceAfter=12,
        ),
        "section": ParagraphStyle(
            "section", fontSize=13, fontName="Helvetica-Bold",
            textColor=BRAND_BLUE, spaceBefore=14, spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body", fontSize=9, fontName="Helvetica",
            textColor=colors.black, leading=14, spaceAfter=4,
        ),
        "bullet": ParagraphStyle(
            "bullet", fontSize=9, fontName="Helvetica",
            textColor=colors.black, leading=13,
            leftIndent=12, spaceAfter=2,
        ),
        "disclaimer": ParagraphStyle(
            "disclaimer", fontSize=7, fontName="Helvetica-Oblique",
            textColor=GRAY, alignment=TA_CENTER,
        ),
    }
    return styles


def generate_report(prediction_data: dict) -> bytes:
    """
    Generate a PDF report for a prediction.
    prediction_data is the full prediction document from MongoDB/prediction service.
    """
    buf    = BytesIO()
    doc    = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=15*mm, bottomMargin=15*mm,
        leftMargin=18*mm, rightMargin=18*mm,
        title="MedPredict AI — Risk Assessment Report",
    )
    st     = _styles()
    story  = []

    risk   = prediction_data.get("risk", {})
    sev    = risk.get("severity", "Low")
    sev_color = SEVERITY_COLS.get(sev, SEVERITY_COLS["Low"])

    # ── Cover / Header ────────────────────────────────────────────────────────
    story += [
        Paragraph("🏥  MedPredict AI", st["title"]),
        Paragraph("Explainable Multi-Disease Risk Assessment Report", st["subtitle"]),
        HRFlowable(width="100%", thickness=2, color=BRAND_BLUE),
        Spacer(1, 6),
    ]

    # ── Patient + Assessment Info ─────────────────────────────────────────────
    pid         = str(prediction_data.get("prediction_id", "N/A"))[:16]
    created_at  = prediction_data.get("created_at", datetime.now(timezone.utc))
    if isinstance(created_at, str):
        try:    created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except: pass
    date_str    = created_at.strftime("%B %d, %Y  %H:%M UTC") if isinstance(created_at, datetime) else str(created_at)
    model_ver   = prediction_data.get("model_version", "v1.0.0")

    info_data = [
        ["Report ID",     pid,           "Date",           date_str],
        ["Model Version", model_ver,     "Type",           "Risk Assessment"],
    ]
    info_table = Table(info_data, colWidths=["22%", "28%", "22%", "28%"])
    info_table.setStyle(TableStyle([
        ("FONTNAME",  (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",  (0, 0), (-1, -1), 8),
        ("FONTNAME",  (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",  (2, 0), (2, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), BRAND_BLUE),
        ("TEXTCOLOR", (2, 0), (2, -1), BRAND_BLUE),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_GRAY, colors.white]),
        ("GRID",      (0, 0), (-1, -1), 0.3, GRAY),
        ("TOPPADDING",    (0,0),(-1,-1), 5),
        ("BOTTOMPADDING", (0,0),(-1,-1), 5),
        ("LEFTPADDING",   (0,0),(-1,-1), 6),
    ]))
    story += [info_table, Spacer(1, 10)]

    # ── Risk Summary ──────────────────────────────────────────────────────────
    story.append(Paragraph("Risk Summary", st["section"]))

    primary   = prediction_data.get("primary_class", "Unknown")
    probabilities = prediction_data.get("probabilities", {})
    rs        = risk.get("score", 0)

    risk_data = [
        ["Primary Diagnosis", primary],
        ["Risk Score",        f"{rs:.1f} / 100"],
        ["Severity Level",    sev],
    ]
    risk_table = Table(risk_data, colWidths=["35%", "65%"])
    risk_table.setStyle(TableStyle([
        ("FONTNAME",     (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",     (0, 0), (-1, -1), 10),
        ("FONTNAME",     (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR",    (0, 0), (0, -1), BRAND_BLUE),
        ("TEXTCOLOR",    (1, 2), (1, 2),  sev_color),
        ("FONTNAME",     (1, 2), (1, 2),  "Helvetica-Bold"),
        ("FONTSIZE",     (1, 2), (1, 2),  12),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [LIGHT_GRAY, colors.white, LIGHT_GRAY]),
        ("GRID",         (0, 0), (-1, -1), 0.3, GRAY),
        ("TOPPADDING",    (0,0),(-1,-1), 7),
        ("BOTTOMPADDING", (0,0),(-1,-1), 7),
        ("LEFTPADDING",   (0,0),(-1,-1), 8),
    ]))
    story += [risk_table, Spacer(1, 8)]

    # ── Disease Probability Table ─────────────────────────────────────────────
    story.append(Paragraph("Disease Probability Breakdown", st["section"]))
    prob_data = [["Disease", "Probability", "Risk Level"]] + [
        [d, f"{p*100:.1f}%", _prob_to_level(p)]
        for d, p in probabilities.items()
    ]
    prob_table = Table(prob_data, colWidths=["40%", "30%", "30%"])
    prob_table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0), BRAND_BLUE),
        ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, -1), 9),
        ("FONTNAME",     (0, 1), (-1, -1), "Helvetica"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ("GRID",         (0, 0), (-1, -1), 0.3, GRAY),
        ("TOPPADDING",    (0,0),(-1,-1), 6),
        ("BOTTOMPADDING", (0,0),(-1,-1), 6),
        ("LEFTPADDING",   (0,0),(-1,-1), 8),
    ]))
    story += [prob_table, Spacer(1, 8)]

    # ── Key Risk Factors (SHAP) ───────────────────────────────────────────────
    shap_data = prediction_data.get("shap", {})
    contributions = shap_data.get("contributions", [])
    if contributions:
        story.append(Paragraph("Key Risk Factors (AI Explanation)", st["section"]))
        shap_rows = [["Feature", "Value", "SHAP Impact", "Direction"]] + [
            [
                c.get("feature", ""),
                str(round(c.get("value", 0), 2)),
                f"{c.get('shap', 0):+.4f}",
                "↑ Increases Risk" if c.get("direction") == "risk" else "↓ Reduces Risk",
            ]
            for c in contributions
        ]
        shap_table = Table(shap_rows, colWidths=["30%", "18%", "22%", "30%"])
        shap_table.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0), BRAND_BLUE),
            ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
            ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",     (0, 0), (-1, -1), 9),
            ("FONTNAME",     (0, 1), (-1, -1), "Helvetica"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
            ("GRID",         (0, 0), (-1, -1), 0.3, GRAY),
            ("TOPPADDING",    (0,0),(-1,-1), 6),
            ("BOTTOMPADDING", (0,0),(-1,-1), 6),
            ("LEFTPADDING",   (0,0),(-1,-1), 8),
            # Colour direction column
            *[("TEXTCOLOR", (3, i+1), (3, i+1),
               SHAP_RED if c.get("direction") == "risk" else SHAP_BLUE)
              for i, c in enumerate(contributions)],
        ]))
        story += [shap_table, Spacer(1, 8)]

    # ── Clinical Recommendations ──────────────────────────────────────────────
    recs = prediction_data.get("recommendations", {})
    if recs:
        story.append(Paragraph("Clinical Recommendations", st["section"]))
        for category, items in [
            ("🥗 Diet",      recs.get("diet", [])),
            ("🏃 Exercise",  recs.get("exercise", [])),
            ("💡 Lifestyle", recs.get("lifestyle", [])),
            ("📋 Monitoring",recs.get("monitoring", [])),
        ]:
            if items:
                story.append(Paragraph(f"<b>{category}</b>", st["body"]))
                for item in items:
                    story.append(Paragraph(f"• {item}", st["bullet"]))
                story.append(Spacer(1, 4))

        followup = recs.get("followup", "")
        if followup:
            story.append(Paragraph(
                f"<b>📅 Follow-Up:</b>  {followup}",
                ParagraphStyle("fu", parent=st["body"],
                               textColor=sev_color, fontName="Helvetica-Bold"),
            ))

    # ── Disclaimer ────────────────────────────────────────────────────────────
    story += [
        Spacer(1, 16),
        HRFlowable(width="100%", thickness=0.5, color=GRAY),
        Spacer(1, 6),
        Paragraph(
            "<b>⚠️  Disclaimer:</b> This report is generated by an AI clinical decision-support tool "
            "and does not constitute a medical diagnosis. All findings must be reviewed by a "
            "qualified healthcare professional. MedPredict AI is not a substitute for clinical "
            "judgement or face-to-face medical consultation.",
            st["disclaimer"],
        ),
        Spacer(1, 4),
        Paragraph(
            f"Report ID: {pid}  •  Generated: {date_str}  •  Platform: MedPredict AI {model_ver}",
            st["disclaimer"],
        ),
    ]

    doc.build(story)
    return buf.getvalue()


def _prob_to_level(p: float) -> str:
    if p < 0.20: return "Low"
    if p < 0.45: return "Moderate"
    if p < 0.70: return "Elevated"
    return "High"
