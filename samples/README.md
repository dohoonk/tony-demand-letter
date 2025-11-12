# Samples for Manual Testing

This directory contains utilities for generating realistic PDFs that you can upload while manually testing the Demand Letter Generator.

## Available Sample PDFs

Run the generator script to create three curated PDFs under `samples/pdfs/`:

1. **`accident_intake_packet.pdf`** – mock intake questionnaire with client, incident, and insurance data.
2. **`medical_summary.pdf`** – treatment timeline highlighting injuries, procedures, and outstanding bills.
3. **`demand_letter_reference.pdf`** – narrative summary with liability description and damages table.

These cover the main scenarios the AI service expects (evidence intake, medical records, and prior narrative drafts).

## Generating the PDFs

```bash
cd "/Users/dohoonkim/GauntletAI/Demand Letter"
python samples/generate_sample_pdfs.py
```

> **Note:** The script uses [`reportlab`](https://pypi.org/project/reportlab/). Install it once with:
>
> ```bash
> pip install reportlab
> ```

The PDFs will be written to `samples/pdfs/`. These files are ignored by git so you can regenerate them at any time without polluting the repository.

## Usage During Demos

- For the **Upload Evidence PDF** step in `demo.md`, use `accident_intake_packet.pdf`.
- If you need additional uploads, use the other PDFs to simulate multi-document cases.
- Feel free to modify the generated PDFs locally to tailor edge cases (e.g., missing pages, long narratives).


