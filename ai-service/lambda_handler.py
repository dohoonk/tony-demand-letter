"""
AI Service Lambda Handler
Handles PDF text extraction and AI-powered demand letter generation
"""

import json
import os
import sys
from typing import Dict, Any
from dotenv import load_dotenv

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.services.pdf_extractor import extract_text_from_pdf
from src.services.s3_service import download_from_s3
from src.services.database_service import update_pdf_extracted_text

# Load environment variables
load_dotenv()

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    """
    Main Lambda handler for AI operations
    
    Supports the following operations:
    - extract_text: Extract text from PDF
    - extract_facts: Extract structured facts from text
    - generate_draft: Generate demand letter draft
    """
    
    try:
        # Parse request
        operation = event.get('operation')
        payload = event.get('payload', {})
        
        if operation == 'extract_text':
            return handle_extract_text(payload)
        elif operation == 'extract_facts':
            return handle_extract_facts(payload)
        elif operation == 'generate_draft':
            return handle_generate_draft(payload)
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': f'Unknown operation: {operation}'
                })
            }
            
    except Exception as e:
        print(f'Error in lambda_handler: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }


def handle_extract_text(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Extract text from PDF"""
    try:
        pdf_id = payload.get('pdfId')
        s3_key = payload.get('s3Key')
        
        if not pdf_id or not s3_key:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing pdfId or s3Key'
                })
            }
        
        # Download PDF from S3
        print(f'Downloading PDF from S3: {s3_key}')
        pdf_bytes = download_from_s3(s3_key)
        
        if not pdf_bytes:
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': 'Failed to download PDF from S3'
                })
            }
        
        # Extract text
        print(f'Extracting text from PDF')
        result = extract_text_from_pdf(pdf_bytes)
        
        if not result['success']:
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': result['error']
                })
            }
        
        # Update database
        print(f'Updating database with extracted text')
        update_pdf_extracted_text(pdf_id, result['text'], result['page_count'])
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'text': result['text'],
                'page_count': result['page_count'],
            })
        }
        
    except Exception as e:
        print(f'Error extracting text: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }


def handle_extract_facts(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Extract structured facts from text using AI"""
    try:
        from src.services.anthropic_service import extract_facts_from_text
        
        document_id = payload.get('documentId')
        pdf_text = payload.get('pdfText')
        pdf_filename = payload.get('pdfFilename', 'document.pdf')
        
        if not pdf_text:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing pdfText'
                })
            }
        
        # Extract facts using AI
        print(f'Extracting facts from {pdf_filename}')
        facts = extract_facts_from_text(pdf_text, pdf_filename)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'facts': facts
            })
        }
    
    except Exception as e:
        print(f'Error extracting facts: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }


def handle_generate_draft(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Generate demand letter draft using AI"""
    try:
        from src.services.anthropic_service import generate_demand_letter
        
        facts = payload.get('facts', [])
        template_structure = payload.get('templateStructure', {})
        template_content = payload.get('templateContent', '')
        
        if not facts:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing facts'
                })
            }
        
        # Generate draft using AI
        print(f'Generating draft with {len(facts)} facts')
        draft = generate_demand_letter(facts, template_structure, template_content)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'draft': draft
            })
        }
    
    except Exception as e:
        print(f'Error generating draft: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }


# FastAPI app for local development
from fastapi import FastAPI, Body

app = FastAPI(title='Demand Letter AI Service')

@app.get('/health')
def health_check():
    return {
        'status': 'ok',
        'service': 'ai-service',
    }

@app.post('/invoke')
def invoke(event: Dict[str, Any] = Body(...)):
    return lambda_handler(event)

# Local development server
if __name__ == '__main__':
    import uvicorn
    port = int(os.getenv('PORT', 8000))
    print(f'🤖 AI Service running on http://localhost:{port}')
    uvicorn.run(app, host='0.0.0.0', port=port)

