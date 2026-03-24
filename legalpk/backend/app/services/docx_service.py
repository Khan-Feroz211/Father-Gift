import os
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt, RGBColor


def generate_docx(title: str, content: str, file_path: str) -> str:
    """
    Generate a court-ready A4 Word document.

    - Times New Roman 11pt
    - Justified alignment
    - 1.25 inch margins
    - Cause title in bold centred
    - Numbered paragraphs for body text
    """
    doc = Document()

    # Page setup: A4, 1.25" margins
    section = doc.sections[0]
    section.page_height = Cm(29.7)
    section.page_width = Cm(21.0)
    margin = Inches(1.25)
    section.top_margin = margin
    section.bottom_margin = margin
    section.left_margin = margin
    section.right_margin = margin

    # Default font
    style = doc.styles["Normal"]
    font = style.font
    font.name = "Times New Roman"
    font.size = Pt(11)

    # Court header
    header_para = doc.add_paragraph()
    header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    header_run = header_para.add_run("IN THE COURT OF COMPETENT JURISDICTION")
    header_run.bold = True
    header_run.font.name = "Times New Roman"
    header_run.font.size = Pt(12)

    doc.add_paragraph()  # Spacer

    # Document title
    title_para = doc.add_paragraph()
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_para.add_run(title.upper())
    title_run.bold = True
    title_run.font.name = "Times New Roman"
    title_run.font.size = Pt(13)
    title_run.underline = True

    doc.add_paragraph()  # Spacer

    # Body content — split by double newline or numbered paragraphs
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
    para_count = 0

    for block in paragraphs:
        # Skip already-numbered blocks to avoid double numbering
        lines = block.split("\n")
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # Detect if line is a heading-like (all caps or starts with numbers/headings)
            is_heading = (
                stripped.isupper()
                or stripped.startswith("IN THE")
                or stripped.startswith("WHEREAS")
                or stripped.startswith("PRAYER")
                or stripped.startswith("VERIFICATION")
                or stripped.startswith("SIGNATURE")
            )

            if is_heading:
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = p.add_run(stripped)
                run.bold = True
                run.font.name = "Times New Roman"
                run.font.size = Pt(11)
            else:
                para_count += 1
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                p.paragraph_format.first_line_indent = Inches(0.5)
                run = p.add_run(f"{para_count}. {stripped}")
                run.font.name = "Times New Roman"
                run.font.size = Pt(11)

    # Signature block
    doc.add_paragraph()
    sig_para = doc.add_paragraph()
    sig_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    sig_run = sig_para.add_run("_______________________________\nAdvocate for the Applicant/Petitioner")
    sig_run.font.name = "Times New Roman"
    sig_run.font.size = Pt(11)

    Path(file_path).parent.mkdir(parents=True, exist_ok=True)
    doc.save(file_path)
    return file_path
