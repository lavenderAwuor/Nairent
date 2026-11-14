// Helps visitors resolve common questions and submit a support request.
import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Mail, MessageCircle, Search } from 'lucide-react'
import brandMark from '../assets/landing/brand-mark.svg'
import { createSupportRequest } from '../lib/api.js'

const helpTopics = [
  {
    title: 'Finding a home',
    description: 'Search by neighborhood, monthly rent, bedrooms, and availability. Open a listing to view its details and map location.',
    link: '#browse',
    label: 'Browse rentals',
  },
  {
    title: 'Viewing and reservation requests',
    description: 'A request is not a confirmed booking or payment. The lister contacts you to confirm availability and next steps.',
    link: '#browse',
    label: 'Find a property',
  },
  {
    title: 'Listing a property',
    description: 'Create a lister account, add your property details and photos, then submit it for admin review.',
    link: '#list-a-property',
    label: 'List a property',
  },
  {
    title: 'Account access',
    description: 'Confirm your email address before signing in. If you are still stuck, send us a support request below.',
    link: '#sign-in',
    label: 'Sign in',
  },
]

const initialForm = { fullName: '', email: '', topic: 'account', message: '' }

export default function SupportPage() {
  const [form, setForm] = useState(initialForm)
  const [state, setState] = useState({ saving: false, error: '', ticketId: '' })

  async function submitRequest(event) {
    event.preventDefault()
    setState({ saving: true, error: '', ticketId: '' })
    try {
      const result = await createSupportRequest(form)
      setState({ saving: false, error: '', ticketId: result.supportRequest.id })
      setForm(initialForm)
    } catch (error) {
      setState({ saving: false, error: error.message, ticketId: '' })
    }
  }

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <a href="#top" aria-label="Nairent home" className="flex items-center gap-2.5">
            <img src={brandMark} alt="" className="size-8" />
            <span className="text-xl font-bold text-brand">nairent<span className="text-brand-muted">.</span></span>
          </a>
          <a href="#top" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand">
            <ArrowLeft size={16} /> Back to home
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <section className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-brand">NAIRENT HELP DESK</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">How can we help?</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">Find quick answers or send a message to the Nairent team. Your support request will receive a reference number for follow-up.</p>
        </section>

        <div className="mt-9 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section aria-labelledby="help-topics-heading">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <CircleHelp size={18} className="text-brand" />
              <h2 id="help-topics-heading" className="font-semibold">Popular help topics</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {helpTopics.map((topic) => (
                <article key={topic.title} className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="font-semibold">{topic.title}</h3>
                  <p className="mt-2 min-h-16 text-sm leading-relaxed text-ink-muted">{topic.description}</p>
                  <a href={topic.link} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
                    {topic.label}<ArrowRight size={14} />
                  </a>
                </article>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-brand-tint p-4">
              <Search size={17} className="mt-0.5 shrink-0 text-brand" />
              <p className="text-sm leading-relaxed text-ink-muted">Viewing fees are set by each lister and shown on the property page. Confirm the fee and payment details directly with the lister before sending money.</p>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6" aria-labelledby="support-form-heading">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-brand" />
              <h2 id="support-form-heading" className="font-semibold">Contact support</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">Tell us what happened and leave an email address where we can reach you.</p>

            {state.ticketId ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4" role="status">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 size={17} /> Request received</div>
                <p className="mt-2 text-xs leading-relaxed text-emerald-900">Your reference number is <span className="font-mono font-semibold">{state.ticketId}</span>. Keep it for follow-up.</p>
                <button type="button" onClick={() => setState({ saving: false, error: '', ticketId: '' })} className="mt-3 text-xs font-semibold text-emerald-800 underline">Send another request</button>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="mt-5 grid gap-3">
                {state.error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">{state.error}</p>}
                <label className="grid gap-1.5 text-xs font-semibold">
                  Your name
                  <input required minLength="2" maxLength="120" autoComplete="name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} className="h-10 rounded-lg border border-border px-3 text-sm font-normal" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold">
                  Email address
                  <input required type="email" maxLength="254" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="h-10 rounded-lg border border-border px-3 text-sm font-normal" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold">
                  What do you need help with?
                  <select value={form.topic} onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-normal">
                    <option value="account">Account access</option>
                    <option value="listing">A property listing</option>
                    <option value="viewing">Viewing or reservation</option>
                    <option value="technical">Website or technical issue</option>
                    <option value="other">Something else</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold">
                  Message
                  <textarea required minLength="20" maxLength="3000" rows="5" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} placeholder="Describe what happened and what you need help with." className="resize-y rounded-lg border border-border p-3 text-sm font-normal" />
                  <span className="text-[11px] font-normal text-ink-muted">20 to 3,000 characters</span>
                </label>
                <button disabled={state.saving} className="mt-1 flex h-11 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white hover:bg-[#123a2d] disabled:opacity-60">
                  <Mail size={16} />{state.saving ? 'Sending request…' : 'Send support request'}
                </button>
                <p className="text-[11px] leading-relaxed text-ink-muted">Please do not include passwords, payment card details, or verification codes.</p>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
