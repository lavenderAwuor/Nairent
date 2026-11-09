import { randomUUID } from 'node:crypto'
import { env } from '../config/env.js'

function storageHeaders() {
  return {
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

async function ensureBucket() {
  const response = await fetch(`${env.SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...storageHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: env.SUPABASE_STORAGE_BUCKET,
      name: env.SUPABASE_STORAGE_BUCKET,
      public: true,
    }),
  })

  if (!response.ok && response.status !== 409) {
    const details = await response.text()
    const error = new Error(`Could not prepare photo storage bucket (${response.status}): ${details}`)
    error.statusCode = 503
    throw error
  }
}

export async function uploadListingPhotos(files, ownerId) {
  await ensureBucket()
  const urls = []

  for (const file of files) {
    const extension = file.mimetype.split('/')[1]
    const path = `${ownerId}/${randomUUID()}.${extension}`
    const response = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${env.SUPABASE_STORAGE_BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        ...storageHeaders(),
        'Content-Type': file.mimetype,
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
