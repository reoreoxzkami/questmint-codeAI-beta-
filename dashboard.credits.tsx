import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { GlassCard } from "@/components/brand/GlassCard"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight, Coins, Gift, Loader2 } from "lucide-react"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/credits")({
  head: () => ({ meta: [{ title: "Credits — QuestMint" }] }),
  component: CreditsPage,
})

type Tx = {
  id: string
  amount: number
  kind: string
  description: string | null
  model: string | null
  created_at: string
}

function CreditsPage() {
  const [balance, setBalance] = useState<{ balance: number; total_earned: number; total_spent: number } | null>(null)
  const [txs, setTxs] = useState<Tx[] | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const [{ data: c }, { data: t, error: te }] = await Promise.all([
      supabase.from("credits").select("balance,total_earned,total_spent").maybeSingle(),
      supabase.from("credit_transactions").select("id,amount,kind,description,model,created_at").order("created_at", { ascending: false }).limit(100),
    ])
    if (te) toast.error(te.message)
    setBalance(c ?? { balance: 0, total_earned: 0, total_spent: 0 })
    setTxs(t ?? [])
  }

  return (
    <>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Current balance" value={balance?.balance ?? "—"} icon={<Coins className="size-5 text-primary" />} tone="primary" />
            <Stat label="Total earned" value={balance?.total_earned ?? "—"} icon={<Gift className="size-5 text-accent" />} tone="accent" />
            <Stat label="Total spent" value={balance?.total_spent ?? "—"} icon={<ArrowDownRight className="size-5 text-destructive" />} tone="danger" />
          </div>

          <GlassCard hoverable={false} className="p-0">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-lg font-semibold">Credit activity</h2>
              <p className="text-sm text-muted-foreground">A record of credits earned and spent.</p>
            </div>
            {txs === null ? (
              <div className="grid place-items-center p-12"><Loader2 className="size-5 animate-spin text-primary" /></div>
            ) : txs.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No credit activity yet.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {txs.map((t) => {
                  const positive = t.amount > 0
                  return (
                    <li key={t.id} className="flex items-center gap-3 p-4">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${positive ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"}`}>
                        {positive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{t.description || t.kind}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="uppercase">{t.kind}</Badge>
                          {t.model && <span>{t.model}</span>}
                          <span>{new Date(t.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className={`text-base font-bold tabular-nums ${positive ? "text-accent" : "text-destructive"}`}>
                        {positive ? "+" : ""}{t.amount}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </GlassCard>
    </>
  )
}

function Stat({ label, value, icon, tone }: { label: string; value: number | string; icon: React.ReactNode; tone: "primary" | "accent" | "danger" }) {
  return (
    <GlassCard className={`p-5 ${tone === "primary" ? "bg-primary/10" : tone === "accent" ? "bg-accent/10" : "bg-destructive/10"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
        </div>
        {icon}
      </div>
    </GlassCard>
  )
}