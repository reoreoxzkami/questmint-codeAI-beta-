import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const DAILY_CAP = 50 // credits per user per UTC day
const MAX_PER_RUN = 10

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  try {
    const auth = req.headers.get("Authorization") || ""
    const token = auth.replace("Bearer ", "")
    if (!token) return json({ error: "Unauthorized" }, 401)

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )
    const { data: userRes, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userRes.user) return json({ error: "Unauthorized" }, 401)
    const userId = userRes.user.id

    const { game, score, durationMs } = await req.json() as { game?: string; score?: number; durationMs?: number }
    const safeGame = (game || "memory").toString().slice(0, 32)
    const safeScore = Math.max(0, Math.floor(Number(score) || 0))
    const safeDuration = Math.max(0, Math.floor(Number(durationMs) || 0))

    // Anti-abuse: ignore impossibly fast runs
    if (safeDuration < 3000) return json({ error: "Run too short" }, 400)
    if (safeScore <= 0) return json({ error: "No score" }, 400)

    // Compute reward
    const reward = Math.min(MAX_PER_RUN, Math.max(1, Math.floor(safeScore / 5)))

    // Check daily cap from credit_transactions (kind='game')
    const sinceIso = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString()
    const { data: todayTx } = await supabase
      .from("credit_transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("kind", "game")
      .gte("created_at", sinceIso)
    const earnedToday = (todayTx || []).reduce((a, t) => a + (t.amount || 0), 0)
    const remaining = Math.max(0, DAILY_CAP - earnedToday)
    if (remaining <= 0) return json({ error: "Daily reward cap reached. Come back tomorrow!", earnedToday, cap: DAILY_CAP }, 429)
    const grant = Math.min(reward, remaining)

    // Ensure credits row exists
    let { data: c } = await supabase.from("credits").select("balance,total_earned").eq("user_id", userId).maybeSingle()
    if (!c) {
      const { data: created } = await supabase
        .from("credits")
        .insert({ user_id: userId, balance: 100, total_earned: 100, total_spent: 0 })
        .select("balance,total_earned")
        .single()
      c = created!
    }

    await supabase.from("credits").update({
      balance: c.balance + grant,
      total_earned: c.total_earned + grant,
    }).eq("user_id", userId)

    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: grant,
      kind: "game",
      description: `Mini-game reward (${safeGame}, score ${safeScore})`,
    })

    return json({ ok: true, granted: grant, score: safeScore, earnedToday: earnedToday + grant, cap: DAILY_CAP })
  } catch (e) {
    console.error("award-game-credits error", e)
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500)
  }
})