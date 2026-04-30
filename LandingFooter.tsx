import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Github, Send, Twitter } from "lucide-react"

function LandingFooter() {
  return (
    <footer className="relative border-t bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Newsletter */}
          <div className="relative">
            <h2 className="mb-4 text-2xl font-bold tracking-tight">
              Quest<span className="text-primary">Mint</span>
            </h2>
            <p className="mb-6 text-muted-foreground">
              Turn prompts into production-ready code. Play mini-games, earn credits, and ship faster.
            </p>
            <form className="relative" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="pr-12 backdrop-blur-sm"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Product</h3>
            <nav className="space-y-2 text-sm">
              <a href="/landing" className="block transition-colors hover:text-primary">
                Home
              </a>
              <a href="/pricing" className="block transition-colors hover:text-primary">
                Pricing
              </a>
              <a href="/dashboard" className="block transition-colors hover:text-primary">
                Dashboard
              </a>
              <a href="/games" className="block transition-colors hover:text-primary">
                Mini Games
              </a>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Resources</h3>
            <nav className="space-y-2 text-sm">
              <a href="/docs" className="block transition-colors hover:text-primary">
                Documentation
              </a>
              <a href="/blog" className="block transition-colors hover:text-primary">
                Blog
              </a>
              <a href="/changelog" className="block transition-colors hover:text-primary">
                Changelog
              </a>
              <a href="/support" className="block transition-colors hover:text-primary">
                Support
              </a>
            </nav>
          </div>

          {/* Social */}
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold">Follow Us</h3>
            <div className="mb-6 flex space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Twitter className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow us on Twitter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Github className="h-4 w-4" />
                      <span className="sr-only">GitHub</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow us on GitHub</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for developers, by developers.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} QuestMint. All rights reserved.
          </p>
          <nav className="flex gap-4 text-sm">
            <a href="/privacy" className="transition-colors hover:text-primary">
              Privacy Policy
            </a>
            <a href="/terms" className="transition-colors hover:text-primary">
              Terms of Service
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { LandingFooter }
