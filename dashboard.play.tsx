import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/brand/GlassCard"
import { supabase } from "@/integrations/supabase/client"
import { Coins, Gamepad2, RotateCcw, Sparkles, Timer, Trophy } from "lucide-react"
import { toast } from "sonner"
import { refreshCredits } from "@/components/dashboard/CreditsBadge"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/dashboard/play")({
  head: () => ({ meta: [{ title: "Play & Earn — QuestMint" }] }),
  component: PlayPage,
})

const EMOJIS = ["🚀", "⚡", "🪐", "🌟", "🔮", "💎", "🎯", "🛰️"]

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(): Card[] {
  const pairs = shuffle(EMOJIS).slice(0, 8)
  const deck = shuffle([...pairs, ...pairs]).map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }))
  return deck
}

function PlayPage() {
  const [deck, setDeck] = useState<Card[]>(buildDeck())
  const [selected, setSelected] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matched, setMatched] = useState(0)
  const [startedAt, setStartedAt] = useState<number>(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [lastReward, setLastReward] = useState<{ granted: number; earnedToday: number; cap: number } | null>(null)
  const finishedRef = useRef(false)

  // ticking timer
  useEffect(() => {
    if (matched === 8) return
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 250)
    return () => clearInterval(id)
  }, [startedAt, matched])

  const reset = () => {
    setDeck(buildDeck())
    setSelected([])
    setMoves(0)
    setMatched(0)
    setStartedAt(Date.now())
    setElapsed(0)
    setLastReward(null)
    finishedRef.current = false
  }

  const flip = (id: number) => {
    if (submitting) return
    if (selected.length >= 2) return
    setDeck((d) => d.map((c) => (c.id === id && !c.matched && !c.flipped ? { ...c, flipped: true } : c)))
    setSelected((s) => (s.includes(id) ? s : [...s, id]))
  }

  // resolve match attempts
  useEffect(() => {
    if (selected.length !== 2) return
    const [a, b] = selected
    const ca = deck.find((c) => c.id === a)
    const cb = deck.find((c) => c.id === b)
    setMoves((m) => m + 1)
    if (ca && cb && ca.emoji === cb.emoji) {
      setTimeout(() => {
        setDeck((d) => d.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c)))
        setMatched((m) => m + 1)
        setSelected([])
      }, 280)
    } else {
      setTimeout(() => {
        setDeck((d) => d.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c)))
        setSelected([])
      }, 700)
    }
  }, [selected, deck])

  // submit reward when game complete
  useEffect(() => {
    if (matched !== 8 || finishedRef.current) return
    finishedRef.current = true
    const durationMs = Date.now() - startedAt
    const score = computeScore(moves, durationMs)
    submitReward(score, durationMs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched])

  const submitReward = async (score: number, durationMs: number) => {
    setSubmitting(true)
    try {
      const { data: sess } = await supabase.auth.getSession()
      const token = sess.session?.access_token
      if (!token) {
        toast.error("Please log in to claim your reward")
        return
      }
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-game-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game: "memory", score, durationMs }),
      })
      const j = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        toast.error(j.error || "Failed to claim reward")
        return
      }
      setLastReward({ granted: j.granted, earnedToday: j.earnedToday, cap: j.cap })
      toast.success(`+${j.granted} credits earned!`)
      refreshCredits()
    } catch (e) {
      console.error(e)
      toast.error("Could not contact server")
    } finally {
      setSubmitting(false)
    }
  }

  const seconds = Math.floor(elapsed / 1000)
  const score = useMemo(() => computeScore(moves, elapsed || 1), [moves, elapsed])

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <GlassCard hoverable={false} className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow-purple">
              <Gamepad2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Cosmic Memory</h2>
              <p className="text-xs text-muted-foreground">Match all pairs. Fewer moves & faster time = more credits.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Stat icon={<Timer className="size-3.5" />} label={`${seconds}s`} />
            <Stat icon={<Sparkles className="size-3.5" />} label={`${moves} moves`} />
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {deck.map((c) => (
            <button
              key={c.id}
              onClick={() => flip(c.id)}
              disabled={c.matched || c.flipped || submitting}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-xl border border-white/10 text-3xl transition-all",
                "[transform-style:preserve-3d]",
                c.flipped || c.matched
                  ? "bg-card"
                  : "bg-white/[0.03] hover:border-primary/40 hover:bg-white/[0.06]",
                c.matched && "ring-2 ring-accent/60",
              )}
            >
              <span className={cn("flex h-full w-full items-center justify-center", !(c.flipped || c.matched) && "opacity-0")}>
                {c.emoji}
              </span>
              {!(c.flipped || c.matched) && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-mono text-muted-foreground/60">
                  ?
                </span>
              )}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-4">
        <GlassCard hoverable={false} className="p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Trophy className="size-3.5 text-primary" /> CURRENT RUN
          </div>
          <p className="mt-2 text-4xl font-bold tabular-nums">{score}</p>
          <p className="text-xs text-muted-foreground">Estimated score</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <Tile label="Moves" value={moves} />
            <Tile label="Time" value={`${seconds}s`} />
          </div>
        </GlassCard>

        {lastReward && (
          <GlassCard hoverable={false} className="p-5 bg-accent/10">
            <div className="flex items-center gap-2 text-xs text-accent">
              <Coins className="size-3.5" /> REWARD EARNED
            </div>
            <p className="mt-2 text-4xl font-bold tabular-nums text-accent">+{lastReward.granted}</p>
            <p className="text-xs text-muted-foreground">credits added to your balance</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Today: {lastReward.earnedToday} / {lastReward.cap}</span>
              <Badge variant="outline" className="text-[10px]">Daily cap</Badge>
            </div>
            <Button onClick={reset} className="mt-4 w-full gradient-primary text-primary-foreground">
              Play again
            </Button>
          </GlassCard>
        )}

        <GlassCard hoverable={false} className="p-5">
          <p className="text-sm font-medium">How rewards work</p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <li>• Score = max(50 − moves, 5) × speed bonus</li>
            <li>• Each completed game grants up to 10 credits</li>
            <li>• Daily cap: 50 credits per account</li>
            <li>• Runs under 3s are not rewarded</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  )
}

function computeScore(moves: number, durationMs: number) {
  const base = Math.max(50 - moves, 5)
  const seconds = Math.max(durationMs / 1000, 5)
  const speed = Math.max(0.4, Math.min(2, 30 / seconds))
  return Math.round(base * speed)
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-muted-foreground">
      {icon}
      {label}
    </span>
  )
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  )
}