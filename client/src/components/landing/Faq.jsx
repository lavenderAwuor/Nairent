import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { faqItems } from '../../data/landingContent.js'

function FaqItem({ question, answer, open, onToggle }) {
  return (
    <div className="w-full border-b border-border py-5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-5 text-left"
      >
        <p className="flex-1 text-base font-semibold text-ink">{question}</p>
        {open ? (
          <Minus size={16} className="mt-0.5 shrink-0 text-ink" />
        ) : (
          <Plus size={16} className="mt-0.5 shrink-0 text-ink" />
        )}
      </button>
      {open && <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">{answer}</p>}
    </div>
  )
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="flex w-full flex-col gap-10 px-5 py-12 md:flex-row md:gap-22 md:px-14 md:py-16">
      <div className="flex w-full flex-col gap-4 md:w-[360px] md:shrink-0">
        <p className="text-[11px] font-semibold text-brand">GOOD QUESTIONS TO ASK</p>
        <h2 className="text-[26px] font-semibold leading-[1.15] text-ink md:text-[34px]">
          A little clarity goes a long way.
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-muted">
          A few things to know before you find a home or list one.
        </p>
        <a href="#top" className="text-sm font-semibold text-brand">
          Help &amp; support →
        </a>
      </div>

      <div className="flex flex-1 flex-col">
        {faqItems.map((item, index) => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            open={openIndex === index}
            onToggle={() => setOpenIndex((current) => (current === index ? -1 : index))}
          />
        ))}
      </div>
    </section>
  )
}
