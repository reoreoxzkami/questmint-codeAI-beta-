import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
}

export function GlassCard({ children, className, hoverable = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white/[0.04] backdrop-blur-xl",
        "border border-white/10",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        hoverable &&
          "transition-all duration-300 hover:scale-[1.01] hover:border-purple-400/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.25)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}