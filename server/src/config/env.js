// Validates application, database, storage, and email settings at startup.
import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('listing-photos'),
  EMAIL_VERIFICATION_ORIGIN: z.string().url().optional(),
  SMTP_HOST: z.string().trim().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
}).superRefine((data, context) => {
  if (Boolean(data.SMTP_USER) !== Boolean(data.SMTP_PASSWORD)) {
    context.addIssue({
      code: 'custom',
      path: ['SMTP_USER'],
      message: 'SMTP_USER and SMTP_PASSWORD must be configured together',
    })
  }

  if (data.NODE_ENV === 'production') {
    for (const key of ['EMAIL_VERIFICATION_ORIGIN', 'SMTP_HOST', 'SMTP_FROM']) {
      if (!data[key]) {
        context.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required in production`,
        })
      }
    }
  }
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`).join('; ')
  throw new Error(`Invalid environment configuration: ${issues}`)
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_SECRET.includes('replace-this')) {
  throw new Error('Invalid environment configuration: JWT_SECRET must be replaced in production')
}

export const env = parsed.data
export const clientOrigins = env.CLIENT_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (env.EMAIL_VERIFICATION_ORIGIN && !clientOrigins.includes(env.EMAIL_VERIFICATION_ORIGIN)) {
  throw new Error('Invalid environment configuration: EMAIL_VERIFICATION_ORIGIN must be listed in CLIENT_ORIGIN')
}
