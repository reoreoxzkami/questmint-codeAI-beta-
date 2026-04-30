import { useEffect, useRef } from "react"

/**
 * Subtle animated starfield + faint nebula glow, inspired by pre.dev hero.
 * Pure canvas — no deps. Respects prefers-reduced-motion.
 */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    let stars: { x: number; y: number; r: number; tw: number; o: number }[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(260, Math.floor((w * h) / 6500))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.2,
        tw: Math.random() * Math.PI * 2,
        o: Math.random() * 0.6 + 0.3,
      }))
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        const flick = reduced ? 1 : 0.7 + Math.sin(t / 800 + s.tw) * 0.3
        ctx.globalAlpha = s.o * flick
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }

    resize()
    raf = requestAnimationFrame(draw)
    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#06070b]">
      {/* radial nebula */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 35%, rgba(139,92,246,0.10), transparent 60%), radial-gradient(40% 35% at 80% 70%, rgba(6,182,212,0.07), transparent 60%)",
        }}
      />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      {/* vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  )
}