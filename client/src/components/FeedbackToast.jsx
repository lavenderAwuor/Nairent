// Displays dismissible success and error messages.
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export default function FeedbackToast({ feedback, onDismiss }) {
  if (!feedback) return null

  const isError = feedback.type === 'error'
  const Icon = isError ? AlertCircle : CheckCircle2

  return (
    <div
      key={feedback.id}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`fixed right-4 top-4 z-[70] flex w-[min(440px,calc(100vw-2rem))] items-start gap-3 rounded-xl border p-4 shadow-lg ${
        isError ? 'border-red-200 bg-white text-red-800' : 'border-emerald-200 bg-white text-emerald-800'
      }`}
    >
      <Icon size={19} className="mt-0.5 shrink-0" />
      <p className="min-w-0 flex-1 text-sm leading-relaxed">{feedback.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 rounded p-1 opacity-70 hover:bg-black/5 hover:opacity-100" aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  )
}
