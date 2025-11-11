"""
Database service for updating PDF records
"""

import os
import psycopg2
from typing import Optional


def get_db_connection():
    """Get database connection"""
    database_url = os.getenv('DATABASE_URL', 'postgresql://dev:devpass@localhost:5432/demand_letters')
    return psycopg2.connect(database_url)


def update_pdf_extracted_text(pdf_id: str, extracted_text: str, page_count: int) -> bool:
    """
    Update PDF record with extracted text
    
    Args:
        pdf_id: UUID of PDF record
        extracted_text: Extracted text content
        page_count: Number of pages in PDF
        
    Returns:
        True if successful, False otherwise
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            UPDATE pdfs
            SET extracted_text = %s, page_count = %s
            WHERE id = %s
            """,
            (extracted_text, page_count, pdf_id)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return True
    
    except Exception as e:
        print(f"Error updating PDF in database: {str(e)}")
        return False

