import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"

let bumpFn: (() => void) | null = null
/** Call this from anywhere to refresh the badge after a credit change. */
export function refreshCredits() { bumpFn?.() }

export function CreditsBadge({ className }: { className?: string }) {
  const [balance, setBalance] = useState<number | null>(null)

  const load = async () => {
    const { data } = await supabase.from("credits").select("balance").maybeSingle()
    setBalance(data?.balance ?? 0)
  }

  useEffect(() => {
    load()
    bumpFn = load
    const ch = supabase
      .channel("credits-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "credits" }, () => load())
      .subscribe()
    return () => { bumpFn = null; supabase.removeChannel(ch) }
  }, [])

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-semibold",
        "shadow-[0_0_15px_rgba(139,92,246,0.2)]",
        className,
      )}
    >
      <Coins className="size-4 text-primary" />
      <span className="tabular-nums">{balance ?? "—"}</span>
      <span className="text-xs font-normal text-muted-foreground">credits</span>
    </div>
  )
}