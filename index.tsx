import { createFileRoute } from "@tanstack/react-router"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { CTASection } from "@/components/landing/CTASection"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { Starfield } from "@/components/brand/Starfield"

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuestMint — AI Code Generation & Mini Games" },
      {
        name: "description",
        content:
          "Turn ideas into working code with QuestMint. Play mini-games to earn credits, then generate production-ready code with AI.",
      },
      { property: "og:title", content: "QuestMint — AI Code Generation & Mini Games" },
      { property: "og:description", content: "Turn prompts into working code. Play mini-games, earn credits, ship faster." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="relative min-h-screen text-foreground">
      <Starfield />
      <LandingNavbar />
      <main>
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
