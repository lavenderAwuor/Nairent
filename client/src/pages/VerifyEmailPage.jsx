// Confirms an email address and lets the new user set a password.
import { useState } from 'react'
import { CheckCircle2, MailCheck } from 'lucide-react'
import brandMark from '../assets/landing/brand-mark.svg'
import { verifyEmail } from '../lib/api.js'

export default function VerifyEmailPage({ token }) {
  const [state, setState] = useState({ loading: false, complete: false, error: '' })
  const [form, setForm] = useState({ password: '', confirmPassword: '' })

  async function confirmEmail(event) {
    event.preventDefault()
    if (form.password.length < 8 || form.password.length > 72) {
      setState({ loading: false, complete: false, error: 'Use a password between 8 and 72 characters.' })
      return
    }
    if (form.password !== form.confirmPassword) {
      setState({ loading: false, complete: false, error: 'The passwords do not match.' })
      return
    }

    setState({ loading: true, complete: false, error: '' })
    try {
      await verifyEmail(token, form.password)
      setState({ loading: false, complete: true, error: '' })
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#verify-email`)
    } catch (error) {
      setState({ loading: false, complete: false, error: error.message })
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-5 py-10">
      <section className="w-full max-w-[480px] rounded-2xl border border-border bg-surface p-8 text-center shadow-sm sm:p-10">
        <a href="#top" aria-label="Nairent home" className="mx-auto mb-6 inline-flex items-center gap-2.5">
          <img src={brandMark} alt="" className="size-8" />
          <span className="text-xl font-bold text-brand">nairent<span className="text-brand-muted">.</span></span>
        </a>
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-tint text-brand">
          {state.complete ? <CheckCircle2 size={26} /> : <MailCheck size={26} />}
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-ink">
          {state.complete ? 'Email confirmed' : 'Confirm your email address'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {state.complete
            ? 'Your Nairent account is ready. Sign in to continue.'
            : 'Confirm that you own this email address, then choose a password to activate your Nairent account.'}
        </p>
        {state.error && <p className="mt-4 text-sm text-red-600" role="alert">{state.error}</p>}
        {state.complete ? (
          <a href="#sign-in" className="mt-6 flex h-11 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white hover:bg-[#123a2d]">
            Continue to sign in
          </a>
        ) : token ? (
          <form onSubmit={confirmEmail} className="mt-6 flex flex-col gap-3 text-left">
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Create password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="h-11 rounded-lg border border-border px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                className="h-11 rounded-lg border border-border px-3 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={state.loading}
              className="mt-2 h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white hover:bg-[#123a2d] disabled:opacity-60"
            >
              {state.loading ? 'Confirming…' : 'Confirm email and set password'}
            </button>
          </form>
        ) : (
          <a href="#sign-in" className="mt-6 flex h-11 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white hover:bg-[#123a2d]">
            Return to sign in
          </a>
        )}
        {state.error && <a href="#sign-up" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">Create or access another account</a>}
      </section>
    </main>
  )
}
