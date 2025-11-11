"""
PDF Text Extraction Service
"""

import io
from typing import Dict, Any
import pypdf


def extract_text_from_pdf(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Extract text from PDF bytes
    
    Args:
        pdf_bytes: PDF file content as bytes
        
    Returns:
        Dictionary with extracted text and metadata
    """
    try:
        # Create a PDF reader from bytes
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_reader = pypdf.PdfReader(pdf_file)
        
        # Get page count
        page_count = len(pdf_reader.pages)
        
        # Extract text from all pages
        extracted_text = []
        for page_num, page in enumerate(pdf_reader.pages, start=1):
            text = page.extract_text()
            if text.strip():
                extracted_text.append({
                    'page': page_num,
                    'text': text.strip(),
                })
        
        # Combine all text
        full_text = '\n\n'.join([page['text'] for page in extracted_text])
        
        return {
            'success': True,
            'text': full_text,
            'page_count': page_count,
            'pages': extracted_text,
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'text': '',
            'page_count': 0,
            'pages': [],
        }


def extract_text_from_file_path(file_path: str) -> Dict[str, Any]:
    """
    Extract text from PDF file path
    
    Args:
        file_path: Path to PDF file
        
    Returns:
        Dictionary with extracted text and metadata
    """
    try:
        with open(file_path, 'rb') as file:
            pdf_bytes = file.read()
            return extract_text_from_pdf(pdf_bytes)
    
    except FileNotFoundError:
        return {
            'success': False,
            'error': 'File not found',
            'text': '',
            'page_count': 0,
            'pages': [],
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'text': '',
            'page_count': 0,
            'pages': [],
        }

