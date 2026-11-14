// Uploads listing photos to the configured Supabase storage bucket.
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { env } from '../config/env.js'

function storageHeaders() {
  return {
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

let bucketReady = false
let bucketSetup

async function createBucketIfMissing() {
  const response = await fetch(`${env.SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...storageHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: env.SUPABASE_STORAGE_BUCKET,
      name: env.SUPABASE_STORAGE_BUCKET,
      public: true,
    }),
  })

  if (response.ok) return

  const details = await response.text()
  let errorBody = {}
  try {
    errorBody = JSON.parse(details)
  } catch {
    // Keep the original response text for the error below.
  }
  if (!errorBody || typeof errorBody !== 'object') errorBody = {}

  const bucketAlreadyExists = response.status === 409
    || errorBody.code === 'BucketAlreadyExists'
    || Number(errorBody.statusCode) === 409
  if (bucketAlreadyExists) return

  const error = new Error(`Could not prepare photo storage bucket (${response.status}): ${details}`)
  error.statusCode = 503
  throw error
}

async function ensureBucket() {
  if (bucketReady) return
  if (!bucketSetup) {
    bucketSetup = createBucketIfMissing()
      .then(() => { bucketReady = true })
      .finally(() => { bucketSetup = null })
  }
  await bucketSetup
}

// Checks image file signatures so a renamed or spoofed upload is not trusted by MIME type alone.
function detectImageType(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mimeType: 'image/png', extension: 'png' }
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' }
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { mimeType: 'image/webp', extension: 'webp' }
  }
  return null
}

// Validates and stores image files under a non-guessable owner-scoped path.
export async function uploadListingPhotos(files, ownerId) {
  await ensureBucket()
  const urls = []

  for (const file of files) {
    const imageType = detectImageType(file.buffer)
    if (!imageType || imageType.mimeType !== file.mimetype) {
      const error = new Error('One or more uploads are not valid JPEG, PNG, or WebP images')
      error.statusCode = 400
      throw error
    }
    const { extension, mimeType } = imageType
    const path = `${ownerId}/${randomUUID()}.${extension}`
    const response = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${env.SUPABASE_STORAGE_BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        ...storageHeaders(),
        'Content-Type': mimeType,
        'x-upsert': 'false',
      },
      body: file.buffer,
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(`Photo upload failed (${response.status}): ${details}`)
    }

    urls.push(`${env.SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/${path}`)
  }

  return urls
}
