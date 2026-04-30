import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { GlassCard } from "@/components/brand/GlassCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Coins, Loader2, Trash2, Code2 } from "lucide-react"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/history")({
  head: () => ({ meta: [{ title: "Generation History — QuestMint" }] }),
  component: HistoryPage,
})

type Gen = {
  id: string
  title: string | null
  prompt: string
  model: string
  tier: string
  credits_spent: number
  status: string
  created_at: string
}

function HistoryPage() {
  const [items, setItems] = useState<Gen[] | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data, error } = await supabase
      .from("generations")
      .select("id,title,prompt,model,tier,credits_spent,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) toast.error(error.message)
    setItems(data ?? [])
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from("generations").delete().eq("id", id)
    if (error) toast.error(error.message)
    else { toast.success("Deleted"); load() }
  }

  return (
    <GlassCard hoverable={false} className="p-0">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-lg font-semibold">Generation history</h2>
              <p className="text-sm text-muted-foreground">Your previously generated AI projects.</p>
            </div>

            {items === null ? (
              <div className="grid place-items-center p-12"><Loader2 className="size-5 animate-spin text-primary" /></div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                <Code2 className="mx-auto mb-3 size-8 opacity-50" />
                No generations yet. <Link to="/dashboard" className="text-primary underline">Create your first one</Link>.
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {items.map((g) => (
                  <li key={g.id} className="flex items-start gap-3 p-4 hover:bg-white/[0.03]">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{g.title || g.prompt.slice(0, 80)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="uppercase">{g.tier}</Badge>
                        <span>{g.model}</span>
                        <span className="inline-flex items-center gap-1"><Coins className="size-3" />{g.credits_spent}</span>
                        <Badge variant={g.status === "completed" ? "secondary" : g.status === "failed" ? "destructive" : "outline"}>
                          {g.status}
                        </Badge>
                        <span>{new Date(g.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(g.id)} title="Delete">
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
    </GlassCard>
  )
}