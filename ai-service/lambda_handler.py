"""
AI Service Lambda Handler
Handles PDF text extraction and AI-powered demand letter generation
"""

import json
import os
from typing import Dict, Any
from dotenv import load_dotenv

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
    # TODO: Implement PDF text extraction
    return {
        'statusCode': 200,
        'body': json.dumps({
            'text': 'Extracted text will go here',
            'page_count': 1,
        })
    }


def handle_extract_facts(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Extract structured facts from text using AI"""
    # TODO: Implement fact extraction with Anthropic API
    return {
        'statusCode': 200,
        'body': json.dumps({
            'facts': [
                {
                    'text': 'Sample extracted fact',
                    'citation': 'document.pdf, page 1',
                    'page_number': 1,
                }
            ]
        })
    }


def handle_generate_draft(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Generate demand letter draft using AI"""
    # TODO: Implement draft generation with Anthropic API
    return {
        'statusCode': 200,
        'body': json.dumps({
            'draft': 'Generated draft will go here',
        })
    }


# Local development server
if __name__ == '__main__':
    from fastapi import FastAPI
    import uvicorn
    
    app = FastAPI(title='Demand Letter AI Service')
    
    @app.get('/health')
    def health_check():
        return {
            'status': 'ok',
            'service': 'ai-service',
        }
    
    @app.post('/invoke')
    def invoke(event: Dict[str, Any]):
        return lambda_handler(event)
    
    port = int(os.getenv('PORT', 8000))
    print(f'🤖 AI Service running on http://localhost:{port}')
    uvicorn.run(app, host='0.0.0.0', port=port)

