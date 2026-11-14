// Handles renter and lister signup, login, and confirmation prompts.
import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import brandMark from '../assets/landing/brand-mark.svg'
import propertyPhotograph from '../assets/landing/property-photograph-1.png'
import { login, register, resendEmailVerification, saveToken } from '../lib/api.js'

const modes = {
  login: {
    eyebrow: 'WELCOME BACK',
    title: 'Welcome back',
    description: 'Sign in to access your properties, viewing requests, and saved searches.',
    submit: 'Sign in',
    switchPrompt: 'New to Nairent?',
    switchLabel: 'Create an account',
  },
  signup: {
    eyebrow: 'JOIN NAIRENT',
    title: 'Create an account',
    description: 'Join Nairent to search homes, see viewing fees upfront, or list rental properties. Confirm your email to set a password.',
    submit: 'Create account',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Sign in',
  },
}

// Replaces loopback hosts in development links so another device can open the same test app.
function getDevelopmentVerificationUrl(url) {
  if (!url) return ''
  try {
    const verificationUrl = new URL(url, window.location.origin)
    if (['localhost', '127.0.0.1', '::1'].includes(verificationUrl.hostname)) {
      verificationUrl.protocol = window.location.protocol
      verificationUrl.host = window.location.host
    }
    return verificationUrl.toString()
  } catch {
    return ''
  }
}

function Field({ label, name, type = 'text', value, onChange, icon: Icon, error, placeholder, children }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-ink">
      {label}
      <span className="relative">
        <Icon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className={`h-11 w-full rounded-lg border bg-white pl-11 pr-11 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/10 ${
            error ? 'border-red-400' : 'border-border'
          }`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          placeholder={placeholder || (name === 'email' ? 'you@example.com' : 'Enter your password')}
        />
        {children}
      </span>
      {error && (
        <span id={`${name}-error`} className="text-xs font-normal text-red-600">
          {error}
        </span>
      )}
    </label>
  )
}

export default function AuthPage({ initialMode = 'login', initialRole = 'lister' }) {
  const [mode, setMode] = useState(initialMode)
  const [role, setRole] = useState(initialRole)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  const [emailDeliveryConfigured, setEmailDeliveryConfigured] = useState(null)
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState('')
  const [developmentVerificationUrl, setDevelopmentVerificationUrl] = useState('')
  const [verificationRequired, setVerificationRequired] = useState(false)
  const [confirmationNotice, setConfirmationNotice] = useState('')
  const [resending, setResending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const copy = modes[mode]

  function switchMode(nextMode) {
    setMode(nextMode)
    setErrors({})
    setSubmitted(false)
    setRequestError('')
    setVerificationRequired(false)
    setConfirmationNotice('')
    setDevelopmentVerificationUrl('')
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSubmitted(false)
    setRequestError('')
    setVerificationRequired(false)
    setConfirmationNotice('')
    setDevelopmentVerificationUrl('')
  }

  async function resendConfirmation() {
    setResending(true)
    setConfirmationNotice('')
    setRequestError('')
    try {
      const result = await resendEmailVerification(form.email)
      setConfirmationNotice(result.message)
      setEmailDeliveryConfigured(result.emailDeliveryConfigured)
      setEmailDeliveryStatus(result.emailDeliveryStatus || '')
      setDevelopmentVerificationUrl(getDevelopmentVerificationUrl(result.developmentVerificationUrl))
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setResending(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}

    if (mode === 'signup' && !form.name.trim()) nextErrors.name = 'Enter your full name.'
    if (mode === 'signup' && !form.phone.trim()) nextErrors.phone = 'Enter a valid phone number.'
    if (!form.email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (mode === 'login' && !form.password) nextErrors.password = 'Enter your password.'
    else if (mode === 'login' && form.password.length < 8) nextErrors.password = 'Use at least 8 characters.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setRequestError('')
    try {
      if (mode === 'signup') {
        const result = await register({ fullName: form.name, email: form.email, phone: form.phone, role })
        setVerificationSent(true)
        setConfirmationNotice(result.message)
        setEmailDeliveryConfigured(result.emailDeliveryConfigured)
        setEmailDeliveryStatus(result.emailDeliveryStatus || '')
        setDevelopmentVerificationUrl(getDevelopmentVerificationUrl(result.developmentVerificationUrl))
        return
      }

      const result = await login({ email: form.email, password: form.password })

      saveToken(result.token)
      setSubmitted(true)
      const userRole = result.user?.role
      if (userRole === 'admin') {
        window.location.hash = '#admin'
      } else if (userRole === 'lister') {
        window.location.hash = '#dashboard'
      } else {
        window.location.hash = '#account'
      }
    } catch (error) {
      setRequestError(error.message)
      setVerificationRequired(error.code === 'EMAIL_NOT_VERIFIED')
    } finally {
      setSubmitting(false)
    }
  }

  if (verificationSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page px-5 py-10">
        <section className="w-full max-w-[480px] rounded-2xl border border-border bg-surface p-8 text-center shadow-sm sm:p-10">
          <a href="#top" aria-label="Nairent home" className="mx-auto mb-6 inline-flex items-center gap-2.5">
            <img src={brandMark} alt="" className="size-8" />
            <span className="text-xl font-bold text-brand">nairent<span className="text-brand-muted">.</span></span>
          </a>
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-tint text-brand"><Mail size={25} /></div>
          <h1 className="mt-5 text-2xl font-semibold text-ink">
            {emailDeliveryStatus === 'not_configured' || emailDeliveryStatus === 'unavailable'
              ? 'Email delivery needs attention'
              : 'Check your email'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            If this address needs confirmation, we’ll send a link to <span className="font-semibold text-ink">{form.email}</span>. Open it to confirm your email and set your password.
          </p>
          {confirmationNotice && <p className="mt-4 text-xs text-ink-muted" role="status">{confirmationNotice}</p>}
          {developmentVerificationUrl && (
            <div className="mt-4 rounded-lg border border-brand/20 bg-brand-tint p-4 text-left" role="status">
              <p className="text-xs font-semibold text-brand">Development test link</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">Email delivery is off, so open this one-time link to confirm the account and set its password.</p>
              <a href={developmentVerificationUrl} className="mt-3 inline-block text-sm font-semibold text-brand underline">Confirm email and set password</a>
            </div>
          )}
          {(emailDeliveryConfigured === false || emailDeliveryStatus === 'unavailable') && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-xs leading-relaxed text-amber-900" role="alert">
              {emailDeliveryStatus === 'unavailable'
                ? 'The email service is configured but could not connect or deliver this message. The administrator should check SMTP settings, then you can resend the confirmation link.'
                : 'This server cannot send email yet. Ask the site administrator to configure SMTP, then resend your confirmation link.'}
            </p>
          )}
          {requestError && <p className="mt-4 text-sm text-red-600" role="alert">{requestError}</p>}
          <button type="button" onClick={resendConfirmation} disabled={resending} className="mt-6 h-11 w-full rounded-lg border border-brand text-sm font-semibold text-brand disabled:opacity-60">
            {resending ? 'Sending…' : 'Resend confirmation email'}
          </button>
          <a href="#sign-in" className="mt-5 inline-block text-sm font-semibold text-brand hover:underline">Back to sign in</a>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-page px-3 py-4 sm:px-6 sm:py-6">
      <div className="grid w-full max-w-[920px] overflow-hidden rounded-[18px] border border-border bg-surface shadow-[0_18px_50px_rgba(24,75,58,0.08)] sm:min-h-[620px] sm:grid-cols-[0.86fr_1.14fr]">
        <section className="relative hidden min-h-[220px] flex-col justify-between overflow-hidden bg-brand p-8 text-white sm:flex lg:p-10">
          <img src={propertyPhotograph} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand/90 via-brand/60 to-brand" />
          <a href="#top" aria-label="Nairent home" className="relative flex items-center gap-2.5">
            <img src={brandMark} alt="" className="size-9 brightness-0 invert" />
            <p className="text-2xl font-bold">nairent<span className="text-brand-muted">.</span></p>
          </a>
          <div className="relative flex flex-col gap-5">
            <p className="text-[11px] font-semibold tracking-wide text-brand-muted">NAIROBI. YOUR NEXT CHAPTER.</p>
            <h1 className="text-[34px] font-semibold leading-[1.12] lg:text-[40px]">
              A clearer way
              <br />
              to find home.
            </h1>
            <p className="max-w-[320px] text-sm leading-relaxed text-white/80">
              Clear rent, viewing fees shown upfront, and alternative neighborhood recommendations across Nairobi.
            </p>
          </div>
          <p className="relative text-xs text-white/60">© 2026 Nairent · Nairobi, Kenya</p>
        </section>

        <section className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mx-auto flex w-full max-w-[420px] flex-col">
            <a href="#top" aria-label="Nairent home" className="mb-6 inline-flex items-center gap-2 sm:hidden">
              <img src={brandMark} alt="" className="size-8" />
              <span className="text-xl font-bold text-brand">nairent<span className="text-brand-muted">.</span></span>
            </a>
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-brand">{copy.eyebrow}</p>
            <h2 className="text-[26px] font-semibold leading-tight text-ink sm:text-[28px]">{copy.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted sm:text-sm">{copy.description}</p>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5" noValidate>
              {mode === 'signup' && (
                <div className="flex rounded-lg border border-border bg-page p-1">
                  <button
                    type="button"
                    onClick={() => setRole('tenant')}
                    className={`flex-1 rounded-md py-2 text-xs font-semibold transition ${
                      role === 'tenant' ? 'bg-surface text-brand shadow-sm' : 'text-ink-muted'
                    }`}
                  >
                    I am looking to rent
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('lister')}
                    className={`flex-1 rounded-md py-2 text-xs font-semibold transition ${
                      role === 'lister' ? 'bg-surface text-brand shadow-sm' : 'text-ink-muted'
                    }`}
                  >
                    I am a landlord / agent
                  </button>
                </div>
              )}

              {mode === 'signup' && (
                <Field
                  label="Full name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  icon={UserRound}
                  error={errors.name}
                  placeholder="e.g. Lavender Onyango"
                >
                  {null}
                </Field>
              )}
              {mode === 'signup' && (
                <Field
                  label="Phone number"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  icon={Phone}
                  error={errors.phone}
                  placeholder="+254 7XX XXX XXX"
                >
                  {null}
                </Field>
              )}
              <Field
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                icon={Mail}
                error={errors.email}
              >
                {null}
              </Field>
              {mode === 'login' && (
                <Field
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  icon={LockKeyhole}
                  error={errors.password}
                >
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-brand"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </Field>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex h-11 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-[#123a2d] focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
              >
                {submitting ? 'Please wait…' : copy.submit}
              </button>
              {requestError && <p className="text-center text-xs text-red-600" role="alert">{requestError}</p>}
              {mode === 'login' && (verificationRequired || requestError === 'Invalid email or password') && (
                <div className="rounded-lg bg-brand-tint p-3 text-center">
                  <p className="mb-2 text-xs text-ink-muted">Still waiting for an email confirmation?</p>
                  <button type="button" onClick={resendConfirmation} disabled={resending} className="text-xs font-semibold text-brand underline disabled:opacity-60">
                    {resending ? 'Sending confirmation…' : 'Resend confirmation email'}
                  </button>
                  {confirmationNotice && <p className="mt-2 text-xs text-ink-muted" role="status">{confirmationNotice}</p>}
                  {developmentVerificationUrl && <a href={developmentVerificationUrl} className="mt-2 inline-block text-xs font-semibold text-brand underline">Open development confirmation link</a>}
                </div>
              )}
              {submitted && (
                <p className="text-center text-xs text-brand" role="status">
                  Authenticated successfully. Opening your workspace…
                </p>
              )}
            </form>

            <p className="mt-6 text-center text-xs text-ink-muted sm:text-sm">
              {copy.switchPrompt}{' '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="font-semibold text-brand hover:underline"
              >
                {copy.switchLabel}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
