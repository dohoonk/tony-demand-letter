#!/usr/bin/env python3
"""
Generate PDF fixtures for manual testing.

Usage:
    python samples/generate_sample_pdfs.py

Requires:
    pip install reportlab
"""

from __future__ import annotations

from pathlib import Path

try:
    from reportlab.lib.pagesizes import LETTER
    from reportlab.pdfgen import canvas
except ImportError as exc:  # pragma: no cover - manual utility
    raise SystemExit(
        "reportlab is required. Install it with `pip install reportlab` and rerun the script."
    ) from exc


ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = ROOT / "pdfs"
MARGIN_X = 72  # 1 inch
MARGIN_Y = 72
LINE_HEIGHT = 18


def _write_paragraph(c: canvas.Canvas, text: str, width: float, height: float) -> None:
    """Write multi-line text, handling pagination when reaching the bottom margin."""
    y = getattr(c, "_current_y", height - MARGIN_Y)
    for line in text.splitlines():
        if not line.strip():
            y -= LINE_HEIGHT  # blank line spacing
        else:
            c.drawString(MARGIN_X, y, line)
            y -= LINE_HEIGHT

        if y < MARGIN_Y:
            c.showPage()
            y = height - MARGIN_Y
            c.setFont("Helvetica", 12)

    c._current_y = y  # type: ignore[attr-defined]


def build_samples() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    samples = {
        "accident_intake_packet.pdf": """
ACME LAW GROUP – CLIENT INTAKE
================================

Client:   Taylor Johnson
Incident: Rear-end collision on May 12, 2024 at 5:35 PM
Location: 7th & Broadway, San Francisco, CA

OVERVIEW
--------
- Vehicle struck from behind while stopped at a red light.
- Immediately experienced neck and shoulder pain; later diagnosed as whiplash.

MEDICAL TREATMENT
-----------------
Provider:    Bayview Urgent Care
Date:        May 12, 2024
Findings:    Loss of range of motion, cervical strain, prescribed muscle relaxants.

Provider:    Dr. Angela Rivera (Chiropractic)
Dates:       May 15 – August 2, 2024 (18 visits)
Notes:       Ongoing soft tissue injuries, positive Spurling's test, continuing pain at 5/10.

INSURANCE
---------
Client Insurer:  Golden State Mutual
Policy:          #GS-447821
At-Fault Driver: Alex Martinez
Carrier:         HarborPoint Casualty – Claim #HP-99341

DOCUMENTS PROVIDED
------------------
1. Police report 24-0512-0097
2. Scene photographs (4)
3. Vehicle repair estimate – $6,870
4. Medical bills to date – $3,420

CLIENT GOALS
------------
- Recover all medical expenses and wage loss ($4,600 to date).
- Compensation for ongoing pain impacting ability to work 10-hour shifts.

Prepared by: Intake Specialist Jamie Chen
""",
        "medical_summary.pdf": """
PATIENT MEDICAL SUMMARY
=======================
Patient: Taylor Johnson
DOB:     09/17/1994
MRN:     128774

TIMELINE
--------
May 12, 2024 – Emergency Intake
  - Complaints: Severe headache, upper back tension, dizziness.
  - Imaging: CT negative for fracture, mild disc bulge at C5-C6.

May 29, 2024 – Physical Therapy Evaluation
  - Findings: Reduced cervical flexion by 35%, muscle guarding.
  - Plan: PT twice weekly for six weeks, focus on manual therapy and stabilization.

Jun 21, 2024 – MRI Review
  - Noted annular tear, prescribed epidural steroid injection (pending authorization).

Aug 15, 2024 – Specialist Consultation
  - Dr. Patel recommends continuing PT and reassessing in 6 weeks.
  - Pain levels persist at 4/10, aggravated by lifting >15 lbs.

OUTSTANDING BILLS
-----------------
- Emergency Room:         $1,280
- Diagnostic Imaging:     $920
- Physical Therapy (to date): $980
- Pending procedure authorization estimate: $1,600

FUNCTIONAL IMPACT
-----------------
- Currently limited to 25-hour work weeks (previously 40+).
- Sleep disruption due to pain flare-ups.
- Needs ergonomic accommodations for desk work.
""",
        "demand_letter_reference.pdf": """
DEMAND LETTER REFERENCE – DRAFT EXCERPT
=======================================

Liability Narrative
-------------------
On May 12, 2024, our client Taylor Johnson was lawfully stopped at a red light when your insured, Alex Martinez, failed to maintain a safe following distance and collided with the rear of Ms. Johnson’s vehicle. The police report and witness statements confirm Mr. Martinez admitted being distracted by his mobile phone moments before impact.

Injuries & Treatment
--------------------
Ms. Johnson immediately sought emergency care and has since undergone extensive chiropractic and physical therapy. Advanced imaging revealed a disc injury at the cervical level, and pain management specialists anticipate additional procedures. Medical specials already exceed $3,000 with future treatment projected.

Economic Damages
----------------
- Medical expenses incurred to date:       $3,420
- Estimated future medical costs:          $5,000
- Property damage (vehicle repairs):       $6,870
- Wage loss (12 weeks @ $380/week):        $4,560

Non-Economic Damages
--------------------
Beyond the financial impact, Ms. Johnson continues to endure daily pain that disrupts her ability to work full shifts, exercise, or sleep soundly. Her quality of life has been significantly diminished, and she faces uncertainty about long-term recovery.

Settlement Demand
-----------------
In light of the clear liability and the substantial damages, we demand $45,000 to resolve this matter without litigation. We encourage prompt review and response within 15 days.

Prepared by: Attorney Morgan Ellis
Law Firm: ACME Law Group
Contact: 555-0123 | mellis@acmelaw.com
""",
    }

    width, height = LETTER

    for filename, content in samples.items():
        output_path = OUTPUT_DIR / filename
        c = canvas.Canvas(str(output_path), pagesize=LETTER)
        c.setTitle(filename.replace("_", " ").title())
        c.setAuthor("Demand Letter Generator – Sample Data")
        c.setFont("Helvetica", 12)
        _write_paragraph(c, content.strip(), width, height)
        c.save()
        try:
            relative = output_path.relative_to(Path.cwd())
        except ValueError:
            relative = output_path
        print(f"Created {relative}")


if __name__ == "__main__":
    build_samples()

