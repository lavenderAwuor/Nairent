// Handles renter and lister signup and login.
import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import brandMark from '../assets/landing/brand-mark.svg'
import propertyPhotograph from '../assets/landing/property-photograph-1.png'
import { login, register, saveToken } from '../lib/api.js'

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
    description: 'Join Nairent to search homes, see viewing fees upfront, or list rental properties.',
    submit: 'Create account',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Sign in',
  },
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
  const [submitting, setSubmitting] = useState(false)
  const copy = modes[mode]

  function switchMode(nextMode) {
    setMode(nextMode)
    setErrors({})
    setSubmitted(false)
    setRequestError('')
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSubmitted(false)
    setRequestError('')
  }

  function openWorkspace(userRole) {
    if (userRole === 'admin') {
      window.location.hash = '#admin'
    } else if (userRole === 'lister') {
      window.location.hash = '#dashboard'
    } else {
      window.location.hash = '#account'
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}

    if (mode === 'signup' && !form.name.trim()) nextErrors.name = 'Enter your full name.'
    if (mode === 'signup' && !form.phone.trim()) nextErrors.phone = 'Enter a valid phone number.'
    if (!form.email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (!form.password) nextErrors.password = 'Enter your password.'
    else if (form.password.length < 8 || form.password.length > 72) nextErrors.password = 'Use a password between 8 and 72 characters.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setRequestError('')
    try {
      const result = mode === 'signup'
        ? await register({ fullName: form.name, email: form.email, phone: form.phone, password: form.password, role })
        : await login({ email: form.email, password: form.password })
      saveToken(result.token)
      setSubmitted(true)
      openWorkspace(result.user?.role)
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setSubmitting(false)
    }
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
              <Field
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                icon={LockKeyhole}
                error={errors.password}
                placeholder={mode === 'signup' ? 'Create a password (8–72 characters)' : 'Enter your password'}
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

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex h-11 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-[#123a2d] focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
              >
                {submitting ? 'Please wait…' : copy.submit}
              </button>
              {requestError && <p className="text-center text-xs text-red-600" role="alert">{requestError}</p>}
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
