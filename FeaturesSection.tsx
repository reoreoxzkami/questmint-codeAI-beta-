import * as React from "react"
import { motion } from "framer-motion"
import {
  Zap,
  Gamepad2,
  Code2,
  Layers,
  ArrowRight,
  Sparkles,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Feature {
  icon: React.ElementType
  title: string
  description: string
  href: string
  cta: string
}

const features: Feature[] = [
  {
    icon: Code2,
    title: "AI Code Generation",
    description:
      "Turn natural language prompts into production-ready code. Describe your app idea and watch QuestMint generate complete projects with architecture plans.",
    href: "/generate",
    cta: "Start Generating",
  },
  {
    icon: Gamepad2,
    title: "Mini Games for Credits",
    description:
      "Earn credits by solving puzzles, quizzes, and coding challenges. The more you play, the more you can generate. Free credits refresh daily.",
    href: "/games",
    cta: "Play & Earn",
  },
  {
    icon: Layers,
    title: "Architecture Plans",
    description:
      "Every generation includes a detailed architecture diagram and system design document. Understand the structure before you build.",
    href: "/generate",
    cta: "See Examples",
  },
  {
    icon: Zap,
    title: "Real-time Preview",
    description:
      "Watch your code come to life with live previews as the AI streams results. Iterate faster with instant visual feedback.",
    href: "/generate",
    cta: "Try Preview",
  },
  {
    icon: Wallet,
    title: "Credit Wallet",
    description:
      "Track your credits, view earning history, and manage your balance. Free users get daily credits; paid users keep credits forever.",
    href: "/wallet",
    cta: "View Wallet",
  },
  {
    icon: Sparkles,
    title: "Free & Paid Tiers",
    description:
      "Start free with daily credits and standard models. Upgrade for unlimited credits, faster generation, and premium AI models.",
    href: "/pricing",
    cta: "Compare Plans",
  },
]

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: any = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export interface FeaturesSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

export function FeaturesSection({
  title = "Everything you need to build faster",
  subtitle = "QuestMint combines AI-powered code generation with a gamified credit system. Play mini games, earn credits, and turn ideas into working software.",
  className,
  ...props
}: FeaturesSectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-background py-24 md:py-32",
        className
      )}
      {...props}
    >
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

      <div className="container relative mx-auto px-4 md:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-2xl text-center md:mb-20"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {title}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon

  return (
    <Card className="group relative h-full overflow-hidden border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="pb-2">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight text-card-foreground">
          {feature.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          {feature.description}
        </CardDescription>
        <Button
          variant="ghost"
          size="sm"
          className="w-fit p-0 text-primary hover:bg-transparent hover:text-primary/80"
          asChild
        >
          <a
            href={feature.href}
            className="inline-flex items-center gap-1 text-sm font-medium"
          >
            {feature.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
