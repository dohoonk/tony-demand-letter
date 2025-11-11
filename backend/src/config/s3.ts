import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

const s3Client = new S3Client({
  region: process.env.S3_BUCKET_REGION || process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'demand-letters-pdfs-local'

export interface UploadOptions {
  key: string
  body: Buffer | Readable
  contentType?: string
}

export async function uploadToS3(options: UploadOptions): Promise<string> {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType || 'application/octet-stream',
      ServerSideEncryption: 'AES256', // Encryption at rest
    },
  })

  await upload.done()
  return options.key
}

export async function getFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const response = await s3Client.send(command)
  
  if (!response.Body) {
    throw new Error('No body in S3 response')
  }

  // Convert stream to buffer
  const chunks: Buffer[] = []
  for await (const chunk of response.Body as any) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}

export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

export function generateS3Key(documentId: string, filename: string): string {
  const timestamp = Date.now()
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `documents/${documentId}/${timestamp}-${sanitized}`
}

export default s3Client

