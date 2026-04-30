import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router"
import { type CSSProperties, useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SiteHeader } from "@/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { CodeGenChat } from "@/components/dashboard/CodeGenChat"
import { refreshCredits } from "@/components/dashboard/CreditsBadge"

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — QuestMint" }] }),
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/login" })
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/login" })
      } else {
        setReady(true)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [navigate])

  if (!ready) return null
  const isGenerate = location.pathname === "/dashboard"

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" } as CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-sidebar p-2 pl-0">
        <div className="flex min-h-[calc(100svh-1rem)] flex-col overflow-hidden rounded-xl border border-border/70 bg-background shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <SiteHeader title={
          isGenerate
            ? "AI Code Generator"
            : location.pathname.includes("history")
              ? "History"
              : location.pathname.includes("play")
                ? "Play & Earn"
                : "Credits"
        } />
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:p-5">
          {isGenerate ? <CodeGenChat onCreditsChanged={refreshCredits} /> : <Outlet />}
        </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
