import { Link } from "@tanstack/react-router"
import { Sparkles, Calendar } from "lucide-react"

const navItems = [
  { name: "Pricing", href: "#pricing" },
  { name: "Blog", href: "#blog" },
  { name: "Docs", href: "#docs" },
  { name: "Browser Agents", href: "#agents", badge: "QM LABS" },
]

export function LandingNavbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]">
            <Sparkles className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            quest<span className="text-white/60">mint</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white"
            >
              {item.name}
              {item.badge && (
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white/80">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <a
            href="#book"
            className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm text-white/80 backdrop-blur transition hover:bg-white/[0.08] sm:inline-flex"
          >
            <Calendar className="size-3.5" />
            Book Consultation
          </a>
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-sm text-white transition hover:bg-white/[0.12]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  )
}
