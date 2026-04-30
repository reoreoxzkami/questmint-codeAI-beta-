import { useState } from "react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "@tanstack/react-router"
import { ArrowRight, Brain, Github, Plus, Sparkles, Users } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

const TRENDING = [
  "AI Watchdog",
  "Agent Guard",
  "Hire Fair",
  "Open Scholar",
  "Sats Wallet",
  "Bio Shield",
  "Tech Pulse",
]

const PLACEHOLDERS = [
  "A real-time AI governance and transparency tracker that monitors major AI companies' legal battles, policy changes, and ...",
  "A SaaS dashboard that helps small SaaS founders track MRR, churn, and runway in one screen.",
  "A mobile-first language exchange app that pairs learners by native + target language and skill level.",
  "An AI study buddy that turns lecture PDFs into spaced-repetition flashcards automatically.",
]

export function HeroSection() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState("")
  const [tier, setTier] = useState<"fast" | "deep" | "ultra">("deep")
  const [submitting, setSubmitting] = useState(false)
  const placeholder = PLACEHOLDERS[0]

  const start = async () => {
    const text = prompt.trim()
    if (!text) return
    setSubmitting(true)
    const { data } = await supabase.auth.getSession()
    sessionStorage.setItem("qm:initial-prompt", JSON.stringify({ text, tier }))
    if (data.session) navigate({ to: "/dashboard" })
    else navigate({ to: "/signup" })
  }

  return (
    <section className="relative isolate flex min-h-[92vh] flex-col items-center justify-center px-4 pt-28 pb-16 text-center">
      {/* Founders chip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/70 backdrop-blur"
      >
        <Users className="size-3.5 text-white/60" />
        <span>Join 10,000+ founders</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-5xl bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-5xl font-semibold leading-[1.05] tracking-tight text-transparent md:text-7xl"
        style={{ fontFamily: "ui-sans-serif, -apple-system, 'Inter', sans-serif" }}
      >
        Your self-driving<br />AI product team
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="mx-auto mt-6 max-w-2xl text-base text-white/55 md:text-lg"
      >
        Plan and build end-to-end code in any stack within your browser, no setup or tech experience required.
      </motion.p>

      {/* Prompt box */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mx-auto mt-10 w-full max-w-3xl"
      >
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(139,92,246,0.35)]">
          {/* glow accent on top */}
          <div className="pointer-events-none absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                start()
              }
            }}
            placeholder={placeholder}
            rows={5}
            className="block w-full resize-none bg-transparent px-6 py-5 text-[15px] leading-relaxed text-white placeholder:text-white/35 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-3 py-3">
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08]"
              aria-label="Add"
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/[0.08]"
            >
              <Github className="size-3.5" />
              Import
            </button>
            <button
              type="button"
              onClick={() => setTier(tier === "ultra" ? "deep" : "ultra")}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition " +
                (tier === "ultra"
                  ? "border-purple-400/40 bg-purple-500/15 text-purple-100"
                  : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]")
              }
              title="Deep planning spec"
            >
              <Sparkles className="size-3.5" />
              Deep Spec
            </button>
            <button
              type="button"
              onClick={() => setTier(tier === "fast" ? "deep" : "fast")}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition " +
                (tier === "fast"
                  ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                  : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]")
              }
            >
              <Brain className="size-3.5" />
              {tier === "fast" ? "Fast" : tier === "ultra" ? "Ultra" : "Pro"}
            </button>
            <div className="ml-auto">
              <button
                type="button"
                onClick={start}
                disabled={submitting || !prompt.trim()}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white px-4 py-1.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start building
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Trending */}
        <div className="mt-10 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
            Trending Ideas · Updated 1h ago
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {TRENDING.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPrompt((p) => (p ? p : `${t}: `))}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/[0.08]"
              >
                <span className="size-1.5 rounded-full bg-white/40" />
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4 text-xs text-white/40">
          <Link to="/login" className="underline-offset-4 hover:text-white/70 hover:underline">
            Already have an account? Log in
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
