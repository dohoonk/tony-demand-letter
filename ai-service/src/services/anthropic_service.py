"""
Anthropic AI Service
"""

import os
from anthropic import Anthropic
from typing import List, Dict, Any

client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY', ''))


def extract_facts_from_text(text: str, document_filename: str) -> List[Dict[str, Any]]:
    """
    Extract structured facts from PDF text using Claude
    
    Args:
        text: Extracted text from PDF
        document_filename: Name of the source document
        
    Returns:
        List of extracted facts with citations
    """
    prompt = f"""You are a legal assistant helping extract key facts from case documents for a demand letter.

Extract the following types of facts from this document:
- Parties involved (plaintiff, defendant, witnesses)
- Dates and times of incidents
- Locations
- Injuries or damages
- Medical treatments
- Financial losses
- Liability-related facts
- Insurance information

For each fact:
1. State it clearly and concisely
2. Note which page/section it came from if possible

Document: {document_filename}

Text:
{text}

Return ONLY a JSON array of facts in this format:
[
  {{
    "fact_text": "Clear statement of the fact",
    "category": "incident|injury|treatment|financial|liability|other",
    "page_reference": "approximate page or section"
  }}
]

Extract 10-20 key facts. Be specific and accurate."""

    try:
        message = client.messages.create(
            model=os.getenv('ANTHROPIC_MODEL', 'claude-haiku-4-5-20251001'),
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse response
        response_text = message.content[0].text
        
        # Try to extract JSON from response
        import json
        import re
        
        # Find JSON array in response
        json_match = re.search(r'\[\s*\{.*\}\s*\]', response_text, re.DOTALL)
        if json_match:
            facts = json.loads(json_match.group())
            return facts
        else:
            # Fallback: try to parse entire response as JSON
            try:
                facts = json.loads(response_text)
                return facts
            except:
                print(f"Could not parse JSON from response: {response_text[:200]}")
                return []
    
    except Exception as e:
        print(f"Error extracting facts: {str(e)}")
        return []


def generate_demand_letter(facts: List[Dict], template_structure: Dict, template_content: str) -> str:
    """
    Generate demand letter draft using Claude
    
    Args:
        facts: List of approved facts
        template_structure: Template structure with placeholders
        template_content: Template paragraph content
        
    Returns:
        Generated demand letter text
    """
    facts_text = "\n".join([f"- {fact['factText']}" for fact in facts])
    
    prompt = f"""You are a legal assistant drafting a professional demand letter.

Using the following approved facts, draft a compelling demand letter:

FACTS:
{facts_text}

INSTRUCTIONS:
1. Use a professional, firm but respectful tone
2. Clearly establish liability
3. Detail all injuries and damages
4. Demand fair compensation
5. Include a reasonable deadline for response (typically 30 days)
6. Use proper legal letter format

Write a complete demand letter. Make it persuasive and professional."""

    try:
        message = client.messages.create(
            model=os.getenv('ANTHROPIC_MODEL', 'claude-haiku-4-5-20251001'),
            max_tokens=4000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return message.content[0].text
    
    except Exception as e:
        print(f"Error generating draft: {str(e)}")
        return f"Error generating draft: {str(e)}"

