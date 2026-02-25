"""
PO PDF generation service using ReportLab.
Generates professional purchase order PDF documents.
"""
import io
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


def generate_po_pdf(
    po_number: str,
    supplier_name: str,
    supplier_email: str = "",
    supplier_address: str = "",
    total_amount: float = 0.0,
    expected_delivery: str = "",
    notes: str = "",
    created_at: str = "",
    line_items: List[Dict[str, Any]] = None,
    company_name: str = "ProcureAI",
) -> bytes:
    """
    Generate a professional PO PDF document.
    Returns PDF bytes.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "POTitle", parent=styles["Title"],
        fontSize=24, textColor=colors.HexColor("#7c3aed"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "POSubtitle", parent=styles["Normal"],
        fontSize=12, textColor=colors.HexColor("#6b7280"),
        spaceAfter=12,
    )
    heading_style = ParagraphStyle(
        "POHeading", parent=styles["Heading2"],
        fontSize=14, textColor=colors.HexColor("#1f2937"),
        spaceBefore=16, spaceAfter=8,
    )
    normal_style = ParagraphStyle(
        "PONormal", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#374151"),
        spaceAfter=4,
    )
    bold_style = ParagraphStyle(
        "POBold", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#1f2937"),
        fontName="Helvetica-Bold",
    )

    elements = []

    # ─── Header ────────────────────────────────────────────
    elements.append(Paragraph(f"🏢 {company_name}", title_style))
    elements.append(Paragraph("Purchase Order", subtitle_style))
    elements.append(HRFlowable(width="100%", color=colors.HexColor("#7c3aed"), thickness=2))
    elements.append(Spacer(1, 10*mm))

    # ─── PO Info Table ─────────────────────────────────────
    date_str = created_at if created_at else datetime.utcnow().strftime("%B %d, %Y")
    delivery_str = expected_delivery if expected_delivery else "To be confirmed"

    info_data = [
        [Paragraph("<b>PO Number:</b>", bold_style), Paragraph(po_number, normal_style),
         Paragraph("<b>Date:</b>", bold_style), Paragraph(date_str, normal_style)],
        [Paragraph("<b>Delivery By:</b>", bold_style), Paragraph(delivery_str, normal_style),
         Paragraph("<b>Status:</b>", bold_style), Paragraph("ISSUED", normal_style)],
    ]
    info_table = Table(info_data, colWidths=[80, 150, 80, 150])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f9fafb")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#1f2937")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 8*mm))

    # ─── Supplier Info ─────────────────────────────────────
    elements.append(Paragraph("Supplier", heading_style))
    elements.append(Paragraph(f"<b>{supplier_name}</b>", bold_style))
    if supplier_email:
        elements.append(Paragraph(f"Email: {supplier_email}", normal_style))
    if supplier_address:
        elements.append(Paragraph(f"Address: {supplier_address}", normal_style))
    elements.append(Spacer(1, 8*mm))

    # ─── Line Items Table ──────────────────────────────────
    elements.append(Paragraph("Order Items", heading_style))

    if line_items:
        header = [
            Paragraph("<b>#</b>", bold_style),
            Paragraph("<b>Product</b>", bold_style),
            Paragraph("<b>Qty</b>", bold_style),
            Paragraph("<b>Unit Price</b>", bold_style),
            Paragraph("<b>Total</b>", bold_style),
        ]
        rows = [header]
        for i, item in enumerate(line_items, 1):
            product_name = item.get("product_name", item.get("name", "N/A"))
            qty = item.get("quantity", 0)
            unit_price = item.get("unit_price", 0)
            total_price = item.get("total_price", qty * unit_price)
            rows.append([
                Paragraph(str(i), normal_style),
                Paragraph(product_name, normal_style),
                Paragraph(str(qty), normal_style),
                Paragraph(f"${unit_price:,.2f}", normal_style),
                Paragraph(f"${total_price:,.2f}", normal_style),
            ])

        items_table = Table(rows, colWidths=[30, 200, 60, 80, 90])
        items_table.setStyle(TableStyle([
            # Header
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#7c3aed")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            # Body
            ("BACKGROUND", (0, 1), (-1, -1), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
            # Borders
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            # Alignment
            ("ALIGN", (2, 0), (4, -1), "RIGHT"),
        ]))
        elements.append(items_table)
    else:
        elements.append(Paragraph("No items specified.", normal_style))

    elements.append(Spacer(1, 5*mm))

    # ─── Totals ────────────────────────────────────────────
    total_data = [
        [Paragraph("<b>Total Amount:</b>", bold_style), Paragraph(f"<b>${total_amount:,.2f}</b>", bold_style)],
    ]
    total_table = Table(total_data, colWidths=[360, 100])
    total_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f3f4f6")),
        ("PADDING", (0, 0), (-1, -1), 10),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#7c3aed")),
    ]))
    elements.append(total_table)

    # ─── Notes ─────────────────────────────────────────────
    if notes:
        elements.append(Spacer(1, 8*mm))
        elements.append(Paragraph("Notes", heading_style))
        elements.append(Paragraph(notes, normal_style))

    # ─── Footer ────────────────────────────────────────────
    elements.append(Spacer(1, 15*mm))
    elements.append(HRFlowable(width="100%", color=colors.HexColor("#e5e7eb"), thickness=1))
    elements.append(Spacer(1, 3*mm))
    footer_style = ParagraphStyle(
        "POFooter", parent=styles["Normal"],
        fontSize=8, textColor=colors.HexColor("#9ca3af"),
        alignment=TA_CENTER,
    )
    elements.append(Paragraph(
        f"Generated by {company_name} • {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}",
        footer_style,
    ))

    doc.build(elements)
    return buffer.getvalue()
