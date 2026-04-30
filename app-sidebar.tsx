import { Home, LogOut, Code2, Wallet, History, Gamepad2 } from "lucide-react"
import { Link, useNavigate } from "@tanstack/react-router"
import { supabase } from "@/integrations/supabase/client"
import { cn } from "@/lib/utils"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems: { title: string; icon: any; href: "/dashboard" | "/dashboard/history" | "/dashboard/credits" | "/dashboard/play" }[] = [
  { title: "Generate", icon: Code2, href: "/dashboard" },
  { title: "History", icon: History, href: "/dashboard/history" },
  { title: "Credits", icon: Wallet, href: "/dashboard/credits" },
  { title: "Play & earn", icon: Gamepad2, href: "/dashboard/play" },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate({ to: "/login" })
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Home className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">QuestMint</span>
                  <span className="truncate text-xs text-muted-foreground">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link to={item.href} activeOptions={{ exact: true }}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "h-10 rounded-lg text-sidebar-foreground/80",
                          isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                      >
                        <span>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </span>
                      </SidebarMenuButton>
                    )}
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="size-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
