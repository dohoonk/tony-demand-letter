"""
S3 Service for downloading files
"""

import boto3
import os
from typing import Optional

s3_client = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION', 'us-east-1'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
)

BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'demand-letters-pdfs-local')


def download_from_s3(s3_key: str) -> Optional[bytes]:
    """
    Download file from S3
    
    Args:
        s3_key: S3 object key
        
    Returns:
        File content as bytes or None if error
    """
    try:
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        return response['Body'].read()
    except Exception as e:
        print(f"Error downloading from S3: {str(e)}")
        return None

