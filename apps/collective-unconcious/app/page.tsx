"use client";

import { useState, useEffect, useRef } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

interface DayCount { date: string; count: number; }

interface InterpretResult {
  interpretation: string;
  themes: string[];
  themeCounts: Record<string, number>;
  themeHistory: Record<string, DayCount[]>;
  symbols: string[];
  symbolCounts: Record<string, number>;
  symbolHistory: Record<string, DayCount[]>;
}

interface CollectiveItem { label: string; count: number; }
interface CollectiveData { themes: CollectiveItem[]; symbols: CollectiveItem[]; }

const STARS = [
  { top: "4%",  left: "8%",  size: 2, opacity: 0.6, dur: 4.2, delay: 0    },
  { top: "7%",  left: "73%", size: 1, opacity: 0.4, dur: 3.1, delay: 0.5  },
  { top: "12%", left: "44%", size: 2, opacity: 0.7, dur: 5.3, delay: 1    },
  { top: "18%", left: "91%", size: 1, opacity: 0.3, dur: 4.0, delay: 1.5  },
  { top: "23%", left: "18%", size: 2, opacity: 0.5, dur: 6.1, delay: 0.8  },
  { top: "29%", left: "62%", size: 1, opacity: 0.6, dur: 3.4, delay: 2.0  },
  { top: "35%", left: "33%", size: 2, opacity: 0.4, dur: 4.8, delay: 0.3  },
  { top: "41%", left: "79%", size: 1, opacity: 0.7, dur: 3.9, delay: 1.2  },
  { top: "48%", left: "11%", size: 2, opacity: 0.3, dur: 5.5, delay: 2.5  },
  { top: "54%", left: "55%", size: 1, opacity: 0.5, dur: 4.3, delay: 0.7  },
  { top: "61%", left: "88%", size: 2, opacity: 0.6, dur: 3.7, delay: 1.8  },
  { top: "67%", left: "26%", size: 1, opacity: 0.4, dur: 5.1, delay: 0.1  },
  { top: "73%", left: "67%", size: 2, opacity: 0.5, dur: 4.6, delay: 2.2  },
  { top: "79%", left: "42%", size: 1, opacity: 0.3, dur: 3.3, delay: 0.9  },
  { top: "85%", left: "15%", size: 2, opacity: 0.6, dur: 5.8, delay: 1.4  },
  { top: "91%", left: "83%", size: 1, opacity: 0.4, dur: 4.1, delay: 0.4  },
  { top: "3%",  left: "37%", size: 1, opacity: 0.5, dur: 3.6, delay: 1.7  },
  { top: "16%", left: "58%", size: 2, opacity: 0.3, dur: 4.9, delay: 2.8  },
  { top: "32%", left: "5%",  size: 1, opacity: 0.7, dur: 3.2, delay: 0.6  },
  { top: "58%", left: "96%", size: 2, opacity: 0.4, dur: 5.0, delay: 1.1  },
  { top: "76%", left: "50%", size: 1, opacity: 0.6, dur: 4.4, delay: 2.4  },
  { top: "94%", left: "30%", size: 2, opacity: 0.3, dur: 3.8, delay: 0.2  },
  { top: "9%",  left: "22%", size: 1, opacity: 0.5, dur: 5.6, delay: 1.9  },
  { top: "45%", left: "70%", size: 2, opacity: 0.4, dur: 4.7, delay: 3.0  },
  { top: "88%", left: "60%", size: 1, opacity: 0.6, dur: 3.5, delay: 0.5  },
];

function StarField() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {STARS.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white" style={{
          top: s.top, left: s.left, width: s.size, height: s.size,
          opacity: s.opacity, animation: `shimmer ${s.dur}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

// Sparkline: 7 bars representing the last 7 days
function Sparkline({ history, variant }: { history: DayCount[]; variant: "theme" | "symbol" }) {
  const max = Math.max(...history.map(d => d.count), 1);
  const color = variant === "symbol" ? "rgba(99,102,241,0.7)" : "rgba(139,92,246,0.7)";
  return (
    <div className="flex items-end gap-px" style={{ height: 20, width: 42 }}>
      {history.map((d, i) => (
        <div
          key={i}
          title={`${d.date}: ${d.count}`}
          style={{
            flex: 1,
            height: `${Math.max((d.count / max) * 100, d.count > 0 ? 15 : 8)}%`,
            background: d.count > 0 ? color : "rgba(255,255,255,0.08)",
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

function CollectiveTag({
  label, count, variant, history,
}: {
  label: string; count: number; variant: "theme" | "symbol"; history?: DayCount[];
}) {
  const isSymbol = variant === "symbol";
  return (
    <div
      className="flex flex-col gap-2 rounded-xl px-4 py-3"
      style={{
        background: isSymbol ? "rgba(79,70,229,0.08)" : "var(--bg-mid)",
        border: `1px solid ${isSymbol ? "rgba(79,70,229,0.3)" : "var(--border)"}`,
      }}
    >
      <span className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>
        {label}
      </span>
      <div className="flex items-end justify-between gap-2">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {count === 0 ? "only you today" : `${count} other ${count === 1 ? "dreamer" : "dreamers"} today`}
        </span>
        {history && history.some(d => d.count > 0) && (
          <Sparkline history={history} variant={variant} />
        )}
      </div>
    </div>
  );
}

function LoadingOrb() {
  return (
    <div className="flex flex-col items-center gap-5 py-16">
      <div className="w-20 h-20 rounded-full" style={{
        background: "radial-gradient(circle at 35% 35%, #a78bfa, #4c1d95)",
        boxShadow: "0 0 48px var(--accent-glow), 0 0 80px rgba(124,92,191,0.15)",
        animation: "pulse-orb 2.4s ease-in-out infinite",
      }} />
      <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Reading the symbols of your dream...</p>
    </div>
  );
}

function DreamStats({ today, total }: { today: number; total: number }) {
  const animatedToday = useCountUp(today, 1000);
  const animatedTotal = useCountUp(total, 1400);
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="flex flex-col items-center">
        <span style={{
          fontFamily: "var(--font-crimson), Georgia, serif",
          fontSize: "clamp(3rem, 12vw, 5rem)",
          lineHeight: 1, color: "var(--text-primary)", fontWeight: 400,
          textShadow: "0 0 40px var(--accent-glow)",
        }}>
          {animatedToday}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          {today === 1 ? "dream submitted today" : "dreams submitted today"}
        </span>
      </div>
      {total > 0 && (
        <span style={{ color: "var(--text-muted)", fontSize: 12, opacity: 0.6 }}>
          {animatedTotal} in total
        </span>
      )}
    </div>
  );
}

// Word cloud: items sized by relative frequency
function CollectiveCloud({ data }: { data: CollectiveData }) {
  const allThemes = data.themes;
  const allSymbols = data.symbols;
  const maxCount = Math.max(...[...allThemes, ...allSymbols].map(i => i.count), 1);

  if (allThemes.length === 0 && allSymbols.length === 0) return null;

  return (
    <div className="flex flex-col gap-4" style={{ animation: "fadeInUp 0.6s ease-out both" }}>
      <p style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", opacity: 0.7 }}>
        Themes & symbols moving through the collective this week
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {allThemes.map(({ label, count }) => {
          const scale = 0.75 + (count / maxCount) * 0.9;
          return (
            <span key={label} style={{
              fontSize: `${scale}rem`,
              color: `rgba(167,139,250,${0.4 + (count / maxCount) * 0.6})`,
              fontFamily: "var(--font-crimson), Georgia, serif",
              transition: "opacity 0.3s",
              cursor: "default",
            }}>
              {label}
            </span>
          );
        })}
        {allSymbols.map(({ label, count }) => {
          const scale = 0.7 + (count / maxCount) * 0.7;
          return (
            <span key={label} style={{
              fontSize: `${scale}rem`,
              color: `rgba(99,102,241,${0.35 + (count / maxCount) * 0.55})`,
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: `${scale * 0.85}rem`,
              transition: "opacity 0.3s",
              cursor: "default",
            } as React.CSSProperties}>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [dream, setDream] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<InterpretResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [stats, setStats] = useState<{ today: number; total: number } | null>(null);
  const [collective, setCollective] = useState<CollectiveData | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/stats`).then(r => r.json()).then(setStats).catch(() => {});
    fetch(`${BASE}/api/collective`).then(r => r.json()).then(setCollective).catch(() => {});
  }, []);

  async function handleSubmit() {
    const trimmed = dream.trim();
    if (!trimmed || status === "loading") return;
    setStatus("loading");
    setResult(null);
    setErrorMsg("");
    try {
      const res = await fetch(`${BASE}/api/interpret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult(data);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function handleReset() {
    setDream("");
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    // Refresh collective data
    fetch(`${BASE}/api/collective`).then(r => r.json()).then(setCollective).catch(() => {});
    fetch(`${BASE}/api/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }

  const showForm = status === "idle" || status === "error";

  return (
    <main className="relative min-h-screen flex flex-col items-center px-4 py-16">
      <StarField />

      <div className="relative z-10 w-full max-w-2xl flex flex-col gap-10">
        {/* Header */}
        <header className="text-center flex flex-col gap-2">
          <p style={{ color: "var(--text-muted)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" }}>The</p>
          <h1 style={{
            fontFamily: "var(--font-crimson), Georgia, serif",
            fontSize: "clamp(2.5rem, 8vw, 4rem)",
            color: "var(--text-primary)", lineHeight: 1.1, fontWeight: 400,
          }}>
            Collective Unconscious
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 15, marginTop: 4 }}>
            Describe your dream. Discover its meaning. See who else dreamed it.
          </p>
        </header>

        {/* Input form */}
        {showForm && (
          <div className="flex flex-col gap-4">
            <p style={{ color: "var(--text-muted)", fontSize: 12, opacity: 0.6, textAlign: "center" }}>
              Your dream text and interpretation are never stored — only themes and symbols.
            </p>
            <section
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <label htmlFor="dream-input" className="text-sm" style={{ color: "var(--text-muted)" }}>
                What did you dream about last night?
              </label>
              <textarea
                id="dream-input"
                value={dream}
                onChange={(e) => setDream(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleSubmit(); }}
                placeholder="I was standing at the edge of a dark ocean, and the moon was enormous above me..."
                rows={6}
                className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed focus:outline-none"
                style={{
                  background: "var(--bg-mid)", border: "1px solid var(--border)",
                  color: "var(--text-primary)", caretColor: "#a78bfa",
                }}
              />
              {status === "error" && (
                <p className="text-sm" style={{ color: "#f87171" }}>{errorMsg}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>⌘ + Enter to submit</span>
                <button
                  onClick={handleSubmit}
                  disabled={dream.trim().length < 10}
                  className="rounded-xl px-6 py-2.5 text-sm font-medium transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: "var(--accent-violet)", color: "#fff", boxShadow: "0 0 20px var(--accent-glow)" }}
                >
                  Interpret my dream
                </button>
              </div>
            </section>

            {/* Stats */}
            {stats !== null && <DreamStats today={stats.today} total={stats.total} />}

            {/* Word cloud */}
            {collective && (collective.themes.length > 0 || collective.symbols.length > 0) && (
              <CollectiveCloud data={collective} />
            )}
          </div>
        )}

        {/* Loading */}
        {status === "loading" && <LoadingOrb />}

        {/* Results */}
        {status === "done" && result && (
          <section
            className="rounded-2xl p-6 flex flex-col gap-8"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", animation: "fadeInUp 0.5s ease-out both" }}
          >
            {/* Interpretation */}
            <div className="flex flex-col gap-3">
              <h2 style={{ fontFamily: "var(--font-crimson), Georgia, serif", fontSize: "1.6rem", color: "var(--text-primary)", fontWeight: 400 }}>
                Your Dream
              </h2>
              <p className="leading-relaxed" style={{ color: "var(--text-primary)", fontSize: 15 }}>
                {result.interpretation}
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--border)" }} />

            {/* Themes */}
            <div className="flex flex-col gap-3">
              <div>
                <h2 style={{ fontFamily: "var(--font-crimson), Georgia, serif", fontSize: "1.3rem", color: "var(--text-muted)", fontWeight: 400 }}>
                  Themes
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Broad patterns shared across dreams</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {result.themes.map((theme) => (
                  <CollectiveTag
                    key={theme}
                    label={theme}
                    count={result.themeCounts[theme] ?? 0}
                    variant="theme"
                    history={result.themeHistory?.[theme]}
                  />
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)" }} />

            {/* Symbols */}
            <div className="flex flex-col gap-3">
              <div>
                <h2 style={{ fontFamily: "var(--font-crimson), Georgia, serif", fontSize: "1.3rem", color: "var(--text-muted)", fontWeight: 400 }}>
                  Symbols
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Specific elements that appeared in your dream</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {result.symbols.map((symbol) => (
                  <CollectiveTag
                    key={symbol}
                    label={symbol}
                    count={result.symbolCounts[symbol] ?? 0}
                    variant="symbol"
                    history={result.symbolHistory?.[symbol]}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleReset}
              className="self-center text-sm transition-opacity hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
            >
              ← Record another dream
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
