import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import fs from 'fs/promises'
import path from 'path'

// Check if we're in local development (no AWS credentials)
const isLocalDev = !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY

const s3Client = isLocalDev 
  ? null 
  : new S3Client({
      region: process.env.S3_BUCKET_REGION || process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'parent-onboarding-insurance-cards-tony'
const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'uploads')

// Ensure local storage directory exists
if (isLocalDev) {
  fs.mkdir(LOCAL_STORAGE_PATH, { recursive: true }).catch(() => {})
}

export interface UploadOptions {
  key: string
  body: Buffer | Readable
  contentType?: string
}

export async function uploadToS3(options: UploadOptions): Promise<string> {
  if (isLocalDev) {
    // Local development: save to filesystem
    const filePath = path.join(LOCAL_STORAGE_PATH, options.key)
    const dir = path.dirname(filePath)
    
    await fs.mkdir(dir, { recursive: true })
    
    const buffer = Buffer.isBuffer(options.body) 
      ? options.body 
      : await streamToBuffer(options.body as Readable)
    
    await fs.writeFile(filePath, buffer)
    console.log(`[LOCAL DEV] Saved file to ${filePath}`)
    
    return options.key
  }

  // Production: use S3
  const upload = new Upload({
    client: s3Client!,
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

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function getFromS3(key: string): Promise<Buffer> {
  if (isLocalDev) {
    // Local development: read from filesystem
    const filePath = path.join(LOCAL_STORAGE_PATH, key)
    console.log(`[LOCAL DEV] Reading file from ${filePath}`)
    return await fs.readFile(filePath)
  }

  // Production: use S3
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const response = await s3Client!.send(command)
  
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
  if (isLocalDev) {
    // Local development: delete from filesystem
    const filePath = path.join(LOCAL_STORAGE_PATH, key)
    console.log(`[LOCAL DEV] Deleting file from ${filePath}`)
    await fs.unlink(filePath).catch(() => {})
    return
  }

  // Production: use S3
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client!.send(command)
}

export function generateS3Key(documentId: string, filename: string): string {
  const timestamp = Date.now()
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `documents/${documentId}/${timestamp}-${sanitized}`
}

export default s3Client

