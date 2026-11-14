import Link from 'next/link';
import Image from 'next/image';
import RiskBadge from '@/components/results/RiskBadge';
import Disclaimer from '@/components/ui/Disclaimer';

// Brand icon mark — inline SVG paths from icon.svg for animation support
function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      aria-hidden="true"
    >
      <g
        transform="translate(256,226)"
        fill="none"
        stroke="#3F8D8A"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M -28 74 C -36 42, -28 16, -6 -4" />
        <path d="M 28 74 C 36 42, 28 16, 6 -4" />
        <path d="M -6 -4 C -26 -40, -58 -66, -92 -106 C -70 -108, -32 -96, 0 -56" />
        <path d="M 6 -4 C 26 -40, 58 -66, 92 -106 C 70 -108, 32 -96, 0 -56" />
        <path d="M -28 74 C -8 96, 8 96, 28 74" />
        <path d="M -6 -4 C -1 -12, 1 -12, 6 -4" />
        <path
          d="M 0 -134 L 8 -118 L 24 -110 L 8 -102 L 0 -86 L -8 -102 L -24 -110 L -8 -118 Z"
          fill="#3F8D8A"
          stroke="none"
        />
      </g>
    </svg>
  );
}

const trustItems = [
  { icon: '⬡', label: 'Browser-only session', detail: 'Nothing stored or transmitted' },
  { icon: '◎', label: 'Educational, not diagnostic', detail: 'Not a substitute for clinical care' },
  { icon: '◈', label: 'Grounded in public guidance', detail: 'FPA, BASHH, PHE standards' },
  { icon: '◇', label: 'Calm, non-judgmental', detail: 'Designed without shame' },
];

const howItWorksSteps = [
  {
    num: '01',
    title: 'Answer a few questions',
    body: 'We ask a small number of relevant questions about timing, symptoms, exposure, and context. Takes about two minutes.',
  },
  {
    num: '02',
    title: 'Get a clear risk summary',
    body: 'You receive a structured summary with plain-language guidance and prioritised next steps for each relevant area.',
  },
  {
    num: '03',
    title: 'Explore your edge cases',
    body: 'Chat with Sylvan to understand uncertainty, clarify what the guidance means for you, and decide what to do next.',
  },
];

const sampleRisks = [
  {
    category: 'HIV',
    level: 'low' as const,
    headline: 'Your reported practices carry a low transmission risk for HIV.',
    explanation: 'Consistent condom use and no recent high-risk incidents keep your risk low. Regular testing every 3–6 months is still recommended given your reported partner count.',
  },
  {
    category: 'Chlamydia',
    level: 'medium' as const,
    headline: 'Chlamydia risk is moderate given the time since your last test.',
    explanation: 'Chlamydia is common and often asymptomatic. Testing is the only way to know. A routine sexual health screen is recommended.',
  },
];

const chatSample = [
  {
    role: 'user' as const,
    content: 'The condom broke two days ago. Should I be worried about HIV?',
  },
  {
    role: 'assistant' as const,
    content: "Two days puts you within the 72-hour PEP window — that's the key thing here. PEP (post-exposure prophylaxis) is a 28-day course of antiretrovirals that can significantly reduce HIV transmission risk if started promptly. You should contact a sexual health clinic, A&E, or GP today to discuss whether it's appropriate for you. The risk level depends on your partner's status — if that's unknown, a clinician can help you weigh it up. This isn't something to wait on.",
  },
  {
    role: 'user' as const,
    content: 'What if I can\'t get to a clinic today?',
  },
  {
    role: 'assistant' as const,
    content: "If you can't get to a clinic, 111 can advise and direct you — they can arrange a prescription at a pharmacy or A&E if needed. Some sexual health services also offer same-day telephone consultations. The window closes at 72 hours, so reaching out in the next few hours matters.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-ink-900">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16">
        <div className="animate-elf-bob mb-8">
          <BrandMark className="w-28 h-28" />
        </div>

        <div className="mb-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-teal-500 font-heading">
            Sexual Elf
          </span>
        </div>

        <h1 className="font-heading font-700 text-4xl md:text-5xl text-ink-900 leading-tight max-w-xl mb-5">
          Understand your risk.<br />Decide what to do next.
        </h1>

        <p className="text-ink-500 text-lg leading-relaxed max-w-lg mb-10">
          Sexual Elf helps people assess sexual health risk through a private,
          browser-based flow grounded in public clinical guidance. Calm, clear,
          and non-judgmental.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/wizard"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold font-heading text-base px-8 py-4 rounded-xl shadow-sm transition-colors"
          >
            Begin assessment
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-transparent hover:bg-mist-100 text-teal-500 font-semibold font-heading text-base px-8 py-4 rounded-xl border border-teal-300 transition-colors"
          >
            Chat with Sylvan
          </Link>
        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────── */}
      <section className="bg-mist-100 border-y border-sage-200 px-6 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustItems.map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <span className="text-teal-400 text-lg" aria-hidden="true">{item.icon}</span>
              <p className="font-heading font-semibold text-ink-900 text-sm leading-snug">
                {item.label}
              </p>
              <p className="text-ink-400 text-xs leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading font-700 text-2xl text-ink-900 mb-10">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step) => (
              <div key={step.num} className="flex flex-col gap-3">
                <span className="font-mono text-xs font-semibold tracking-widest text-teal-400">
                  {step.num}
                </span>
                <h3 className="font-heading font-semibold text-ink-900 text-base leading-snug">
                  {step.title}
                </h3>
                <p className="text-ink-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample output ─────────────────────────────────── */}
      <section className="bg-mist-100 border-y border-sage-200 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading font-700 text-2xl text-ink-900 mb-2">
            What you get
          </h2>
          <p className="text-ink-500 text-sm mb-8">
            A structured risk summary for each relevant area, with plain-language explanations and prioritised next steps.
          </p>

          <div className="flex flex-col gap-4">
            {sampleRisks.map((risk) => (
              <div
                key={risk.category}
                className="bg-stone-50 border border-stone-200 rounded-xl p-5 flex flex-col gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-heading font-semibold text-ink-900 text-sm">
                    {risk.category}
                  </span>
                  <RiskBadge level={risk.level} size="sm" />
                </div>
                <p className="text-ink-700 text-sm font-medium leading-snug">
                  {risk.headline}
                </p>
                <p className="text-ink-500 text-sm leading-relaxed">
                  {risk.explanation}
                </p>
              </div>
            ))}
          </div>

          <p className="text-ink-400 text-xs mt-5 italic">
            Sample output — not real clinical guidance. Actual results are tailored to your answers.
          </p>
        </div>
      </section>

      {/* ── Chat preview ──────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading font-700 text-2xl text-ink-900 mb-2">
            Then ask Sylvan anything
          </h2>
          <p className="text-ink-500 text-sm mb-8">
            After your assessment, chat with Sylvan to explore nuance, edge cases, and what to do next.
          </p>

          <div className="flex flex-col gap-4 mb-8">
            {chatSample.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <BrandMark className="w-5 h-5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-500 text-white rounded-tr-sm'
                      : 'bg-stone-100 text-ink-800 rounded-tl-sm border border-stone-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/wizard"
              className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold font-heading text-sm px-6 py-3 rounded-xl shadow-sm transition-colors"
            >
              Begin assessment
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-mist-100 text-teal-500 font-semibold font-heading text-sm px-6 py-3 rounded-xl border border-teal-300 transition-colors"
            >
              Start with chat
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer / legal ────────────────────────────────── */}
      <footer className="bg-ink-900 text-stone-200 px-6 py-12 mt-auto">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <BrandMark className="w-8 h-8 opacity-70" />
            <span className="font-heading font-semibold text-stone-200 text-sm tracking-wide">
              Sexual Elf
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs text-stone-400 leading-relaxed">
            <p>
              Sexual Elf provides educational information only and does not replace
              professional medical advice, testing, diagnosis, or treatment. If you
              have symptoms or concerns, please contact a qualified clinician or
              sexual health service.
            </p>
            <p>
              All guidance is grounded in public clinical standards (FPA, BASHH, PHE).
              Nothing you enter is stored, transmitted, or logged. Your session exists
              only in this browser tab.
            </p>
          </div>

          <p className="text-xs text-stone-500 border-t border-ink-700 pt-4">
            Educational use only. Not a medical service.
          </p>
        </div>
      </footer>
    </div>
  );
}
