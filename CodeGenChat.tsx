import { type ReactNode, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Bot, Code2, Eye, Loader2, MessagesSquare, Sparkles, User, Zap, Copy, Check, Coins, Monitor, Smartphone, Expand,
  ThumbsUp, ThumbsDown, Settings2, X,
} from "lucide-react"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { supabase } from "@/integrations/supabase/client"
import { GlassCard } from "@/components/brand/GlassCard"
import { extractCodeBlocks, buildPreviewHtml, type CodeBlock } from "@/lib/code-extract"
import { cn } from "@/lib/utils"

type Msg = { role: "user" | "assistant"; content: string }
type Tier = "fast" | "deep" | "ultra"

const TIER_META: Record<Tier, { label: string; cost: number; desc: string; tone: string }> = {
  fast:  { label: "Fast",  cost: 1,  desc: "Quick draft", tone: "tier-fast" },
  deep:  { label: "Deep",  cost: 5,  desc: "Deeper planning", tone: "tier-deep" },
  ultra: { label: "Ultra", cost: 20, desc: "Plan → build → review", tone: "tier-ultra" },
}

type PreviewSize = "responsive" | "desktop" | "mobile"

const EXTRA_INSTRUCTIONS_KEY = "qm:extra-instructions"

function extractAiText(j: any): string {
  const choice = j?.choices?.[0]
  const delta = choice?.delta
  const message = choice?.message
  return delta?.content ?? delta?.text ?? message?.content ?? choice?.text ?? ""
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`

export function CodeGenChat({ onCreditsChanged }: { onCreditsChanged?: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [tier, setTier] = useState<Tier>("fast")
  const [status, setStatus] = useState<string>("")
  const [tab, setTab] = useState<"chat" | "code" | "preview">("chat")
  const [previewSize, setPreviewSize] = useState<PreviewSize>("responsive")
  const [extraInstructions, setExtraInstructions] = useState("")
  const [showExtra, setShowExtra] = useState(false)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "good" | "bad">>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(EXTRA_INSTRUCTIONS_KEY)
    if (saved) setExtraInstructions(saved)
  }, [])

  useEffect(() => {
    const value = extraInstructions.trim()
    if (value) localStorage.setItem(EXTRA_INSTRUCTIONS_KEY, value)
    else localStorage.removeItem(EXTRA_INSTRUCTIONS_KEY)
  }, [extraInstructions])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, status])

  // Auto-load prompt seeded from the landing page hero
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("qm:initial-prompt")
      if (!raw) return
      sessionStorage.removeItem("qm:initial-prompt")
      const parsed = JSON.parse(raw) as { text?: string; tier?: Tier }
      if (parsed?.text) setInput(parsed.text)
      if (parsed?.tier && (TIER_META as any)[parsed.tier]) setTier(parsed.tier)
    } catch {
      // ignore
    }
  }, [])

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? ""
  const blocks: CodeBlock[] = lastAssistant ? extractCodeBlocks(lastAssistant) : []
  const previewHtml = blocks.length ? buildPreviewHtml(blocks) : null

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Msg = { role: "user", content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput("")
    setLoading(true)
    setStatus(tier === "ultra" ? "Starting Ultra mode..." : "Thinking...")

    try {
      const { data: sess } = await supabase.auth.getSession()
      const token = sess.session?.access_token
      if (!token) {
        toast.error("Please log in to continue")
        setLoading(false)
        return
      }
      const instructionText = extraInstructions.trim()
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next, tier, extraInstructions: instructionText || undefined }),
      })

      if (resp.status === 402) {
        const j = await resp.json().catch(() => ({}))
        toast.error(j.error || "Not enough credits")
        setLoading(false); setStatus("")
        return
      }
      if (resp.status === 429) {
        toast.error("Rate limit reached. Please try again in a moment.")
        setLoading(false); setStatus("")
        return
      }
      if (resp.status === 401) {
        toast.error("Authentication failed. Please log in again.")
        setLoading(false); setStatus("")
        return
      }
      if (!resp.ok || !resp.body) {
        const text = await resp.text().catch(() => "")
        console.error("chat http error", resp.status, text)
        let msg = `AI request failed (${resp.status})`
        try {
          const j = JSON.parse(text)
          if (j?.error) msg = j.error
        } catch { /* ignore */ }
        toast.error(msg)
        setLoading(false); setStatus("")
        return
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf = ""
      let assistantText = ""
      let done = false
      setMessages((p) => [...p, { role: "assistant", content: "" }])

      while (!done) {
        const { done: d, value } = await reader.read()
        if (d) break
        buf += decoder.decode(value, { stream: true })
        let idx: number
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx)
          buf = buf.slice(idx + 1)
          if (line.endsWith("\r")) line = line.slice(0, -1)
          if (!line.startsWith("data: ")) continue
          const payload = line.slice(6).trim()
          if (payload === "[DONE]") { done = true; break }
          try {
            const j = JSON.parse(payload)
            if (j.status) { setStatus(j.status); continue }
            if (j.error) { toast.error(j.error); setStatus("Generation failed"); continue }
            if (j.generationId) { setGenerationId(j.generationId); continue }
            const c = extractAiText(j)
            if (c) {
              assistantText += c
              setMessages((prev) => {
                const arr = [...prev]
                arr[arr.length - 1] = { role: "assistant", content: assistantText }
                return arr
              })
            }
          } catch {
            buf = line + "\n" + buf
            break
          }
        }
      }
      setStatus("")
      onCreditsChanged?.()
      // Auto-switch to preview if any runnable code
      const finalBlocks = extractCodeBlocks(assistantText)
      if (buildPreviewHtml(finalBlocks)) setTab("preview")
      else if (finalBlocks.length) setTab("code")
    } catch (e) {
      console.error(e)
      toast.error("Unexpected error occurred")
    } finally {
      setLoading(false)
      setStatus("")
    }
  }

  const sendFeedback = async (rating: "good" | "bad", comment?: string) => {
    if (!generationId) {
      toast.error("No generation to rate yet")
      return
    }
    if (feedbackGiven[generationId]) {
      toast.info("You already rated this generation")
      return
    }
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? ""
    const { data: u } = await supabase.auth.getUser()
    const uid = u.user?.id
    if (!uid) { toast.error("Not authenticated"); return }
    const { error } = await supabase.from("generation_feedback").insert({
      user_id: uid,
      generation_id: generationId,
      rating,
      comment: comment?.trim() || null,
      prompt: lastUser.slice(0, 2000),
      tier,
      model: tier,
    })
    if (error) { toast.error("Failed to save feedback"); return }
    setFeedbackGiven((p) => ({ ...p, [generationId]: rating }))
    toast.success(rating === "good" ? "Thanks! Glad it helped." : "Thanks — future generations will avoid this.")
  }

  return (
    <GlassCard hoverable={false} className="flex h-[calc(100vh-5.75rem)] min-h-[680px] flex-col rounded-[1.25rem] bg-card/90">
      <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
        <div className="flex size-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow-purple">
          <Sparkles className="size-4" />
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-foreground">QuestMint Studio</p>
          <p className="text-xs text-muted-foreground">Describe your idea and generate production-ready code with live preview.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowExtra((v) => !v)}
          className={cn("h-10 gap-2 rounded-xl border border-border/70 bg-secondary/60 px-3 text-xs font-medium", showExtra && "border-primary/50 text-primary")}
        >
          <Settings2 className="size-3.5" />
          {extraInstructions ? "Instructions ✓" : "Add instructions"}
        </Button>
        <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
          <SelectTrigger className="h-11 w-[210px] rounded-xl border-border bg-secondary/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TIER_META) as Tier[]).map((k) => (
              <SelectItem key={k} value={k}>
                <div className="flex items-center gap-2">
                  <span className={cn("inline-block size-2 rounded-full", TIER_META[k].tone)} />
                  <span className="font-medium">{TIER_META[k].label}</span>
                  <Badge variant="outline" className="ml-1 gap-1 px-1.5 py-0 text-[10px]">
                    <Coins className="size-2.5" />{TIER_META[k].cost}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showExtra && (
        <div className="border-b border-border/70 bg-secondary/30 px-5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Additional instructions</p>
              <p className="text-[10px] text-muted-foreground">Saved automatically and sent with every prompt.</p>
            </div>
            <div className="flex items-center gap-2">
              {extraInstructions.trim() && <Badge variant="outline" className="h-6 text-[10px]">Saved</Badge>}
              <button type="button" onClick={() => setShowExtra(false)} className="text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>
            </div>
          </div>
          <Textarea
            value={extraInstructions}
            onChange={(e) => setExtraInstructions(e.target.value)}
            placeholder="e.g. Use a dark futuristic palette. Always include a sticky nav. Avoid stock-photo people."
            className="min-h-[60px] resize-none rounded-lg border-border/70 bg-background/60 text-xs"
          />
          <div className="mt-2 flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 rounded-lg px-3 text-xs"
              onClick={() => { setShowExtra(false); toast.success("Instructions will be used on the next generation") }}
            >
              Apply instructions
            </Button>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 grid w-fit grid-cols-3 rounded-xl bg-secondary/70 p-1">
          <TabsTrigger value="chat" className="gap-1.5 rounded-lg"><MessagesSquare className="size-3.5" />Chat</TabsTrigger>
          <TabsTrigger value="code" className="gap-1.5 rounded-lg" disabled={!blocks.length}>
            <Code2 className="size-3.5" />Code{blocks.length ? ` (${blocks.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5 rounded-lg" disabled={!previewHtml}>
            <Eye className="size-3.5" />Live
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="m-0 flex-1 overflow-hidden">
          <div ref={scrollRef} className="h-full space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl gradient-primary shadow-glow-purple">
                  <Sparkles className="size-8 text-primary-foreground" />
                </div>
                <p className="text-lg font-semibold text-foreground">What do you want to build?</p>
                <p className="mt-1 max-w-md text-sm">
                  Try: <span className="text-primary">Build a polished SaaS landing page in HTML</span> /
                  <span className="text-accent"> Create a task manager with filters</span>
                </p>
                <div className="mt-6 grid max-w-2xl grid-cols-1 gap-2 text-left text-xs sm:grid-cols-3">
                  {(Object.keys(TIER_META) as Tier[]).map((k) => (
                    <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={cn("inline-block size-2 rounded-full", TIER_META[k].tone)} />
                        <span className="font-semibold text-foreground">{TIER_META[k].label}</span>
                        <Badge variant="outline" className="ml-auto gap-1 px-1.5 py-0 text-[10px]">
                          <Coins className="size-2.5" />{TIER_META[k].cost}
                        </Badge>
                      </div>
                      <p>{TIER_META[k].desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <MsgBubble
                key={i}
                msg={m}
                loading={loading && i === messages.length - 1 && !m.content}
                showFeedback={
                  m.role === "assistant" && !!m.content && !loading &&
                  i === messages.length - 1 && !!generationId
                }
                feedback={generationId ? feedbackGiven[generationId] : undefined}
                onFeedback={sendFeedback}
              />
            ))}
            {status && (
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin text-primary" />
                <span>{status}</span>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="code" className="m-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {blocks.map((b, i) => <CodeFile key={i} block={b} />)}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="m-0 flex-1 overflow-hidden p-4">
          {previewHtml ? (
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-background">
                <div className="flex h-11 shrink-0 items-center justify-between border-b border-border/70 px-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-2.5 rounded-full bg-destructive" />
                  <span className="size-2.5 rounded-full bg-primary" />
                  <span className="size-2.5 rounded-full bg-accent" />
                  <span className="ml-2">Live Preview</span>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-secondary/70 p-1">
                  <PreviewButton active={previewSize === "responsive"} onClick={() => setPreviewSize("responsive")} label="Responsive"><Expand className="size-3.5" /></PreviewButton>
                  <PreviewButton active={previewSize === "desktop"} onClick={() => setPreviewSize("desktop")} label="Desktop"><Monitor className="size-3.5" /></PreviewButton>
                  <PreviewButton active={previewSize === "mobile"} onClick={() => setPreviewSize("mobile")} label="Mobile"><Smartphone className="size-3.5" /></PreviewButton>
                </div>
              </div>
              <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-background p-0">
                <iframe
                  title="Live preview"
                  sandbox="allow-scripts allow-forms allow-popups allow-modals"
                  className={cn(
                    "h-full min-h-[560px] border-0 bg-white transition-all",
                    previewSize === "responsive" && "w-full",
                    previewSize === "desktop" && "w-[1200px] max-w-full",
                    previewSize === "mobile" && "my-4 h-[720px] w-[390px] max-w-[calc(100vw-2rem)] rounded-[1.5rem] border border-white/15",
                  )}
                  srcDoc={previewHtml}
                />
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Runnable HTML/CSS/JS will appear here automatically.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="border-t border-border/70 p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
            }}
            placeholder={`Describe what you want to build... (${TIER_META[tier].label}: ${TIER_META[tier].cost} credits)`}
            className="min-h-[70px] resize-none rounded-xl border-border bg-secondary/80 px-4 py-3 text-base"
            disabled={loading}
          />
          <Button
            onClick={send}
            disabled={loading || !input.trim()}
            size="icon"
            className="size-[64px] shrink-0 rounded-xl gradient-primary text-primary-foreground hover:opacity-90"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
          </Button>
        </div>
      </div>
    </GlassCard>
  )
}

function MsgBubble({
  msg, loading, showFeedback, feedback, onFeedback,
}: {
  msg: Msg; loading: boolean;
  showFeedback?: boolean;
  feedback?: "good" | "bad";
  onFeedback?: (rating: "good" | "bad", comment?: string) => void;
}) {
  const isUser = msg.role === "user"
  const [showBadForm, setShowBadForm] = useState(false)
  const [badComment, setBadComment] = useState("")
  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full gradient-primary text-primary-foreground">
          <Bot className="size-4" />
        </div>
      )}
      <div className="flex max-w-[85%] flex-col gap-2">
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "gradient-primary text-primary-foreground"
            : "border border-white/10 bg-white/[0.04] text-foreground",
        )}
      >
        {loading ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-current" />
          </div>
        ) : isUser ? (
          <span className="whitespace-pre-wrap">{msg.content}</span>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-pre:border prose-pre:border-white/10 prose-pre:bg-background/80 prose-code:text-accent">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
      {showFeedback && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Was this useful?</span>
            <button
              type="button"
              disabled={!!feedback}
              onClick={() => onFeedback?.("good")}
              className={cn(
                "flex size-7 items-center justify-center rounded-md border border-border/60 bg-secondary/40 transition-colors hover:bg-primary/20",
                feedback === "good" && "border-primary/60 bg-primary/20 text-primary",
              )}
              title="Good"
            >
              <ThumbsUp className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={!!feedback}
              onClick={() => setShowBadForm((v) => !v)}
              className={cn(
                "flex size-7 items-center justify-center rounded-md border border-border/60 bg-secondary/40 transition-colors hover:bg-destructive/20",
                feedback === "bad" && "border-destructive/60 bg-destructive/20 text-destructive",
              )}
              title="Needs improvement"
            >
              <ThumbsDown className="size-3.5" />
            </button>
            {feedback && <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">recorded</span>}
          </div>
          {showBadForm && !feedback && (
            <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2">
              <Textarea
                value={badComment}
                onChange={(e) => setBadComment(e.target.value)}
                placeholder="What was wrong? (e.g. layout broke, ugly colors, missed requirement)"
                className="min-h-[50px] resize-none rounded-md border-border/60 bg-background/60 text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowBadForm(false)}>Cancel</Button>
                <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => { onFeedback?.("bad", badComment); setShowBadForm(false) }}>
                  <ThumbsDown className="size-3" /> Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10">
          <User className="size-4" />
        </div>
      )}
    </div>
  )
}

function PreviewButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn("size-7 rounded-md text-muted-foreground", active && "bg-background text-foreground")}
    >
      {children}
    </Button>
  )
}

function CodeFile({ block }: { block: CodeBlock }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(block.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <Code2 className="size-3.5 text-accent" />
          <span className="font-mono font-medium text-foreground">{block.filename || `snippet.${block.language}`}</span>
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] uppercase">{block.language}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={copy} className="h-7 gap-1.5 text-xs">
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className="text-foreground">{block.code}</code>
      </pre>
    </div>
  )
}