"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/FadeIn";
import { ScaleIn } from "@/components/animations/ScaleIn";

const heroMetrics = [
  { label: "REN seats activated", value: "320+" },
  { label: "Owner links shared", value: "940", suffix: "/mo" },
  { label: "Hours saved weekly", value: "9h" }
];

export function AnimatedHero() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(29,103,255,0.08) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(29,103,255,0.08) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(29,103,255,0.08) 0%, transparent 50%)"
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <FadeIn delay={0.1}>
              <Badge variant="secondary" className="gap-2">
                <Sparkles className="h-3 w-3" />
                Next.js + shadcn/ui
              </Badge>
            </FadeIn>

            <div className="space-y-6">
              <FadeIn delay={0.2}>
                <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl">
                  The professional{" "}
                  <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                    Operating System
                  </span>{" "}
                  for Malaysian property agents.
                </h1>
              </FadeIn>

              <FadeIn delay={0.3}>
                <p className="text-xl text-muted-foreground lg:text-2xl">
                  Stop running your agency on WhatsApp folders. LeadLah unifies listings, reminders, calculators,
                  and billing with a premium design system.
                </p>
              </FadeIn>
            </div>

            <FadeIn delay={0.4}>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="group" asChild>
                  <Link href="/sign-in">
                    Launch App
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/dashboard">Try for free</Link>
                </Button>
              </div>
            </FadeIn>

            {/* Metrics */}
            <FadeIn delay={0.5}>
              <div className="grid gap-6 pt-8 sm:grid-cols-3">
                {heroMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    className="group"
                  >
                    <div className="rounded-2xl border bg-card/50 p-6 backdrop-blur transition-all hover:bg-card/80 hover:shadow-lg">
                      <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">
                        {metric.value}
                        {metric.suffix && (
                          <span className="text-lg font-medium text-muted-foreground"> {metric.suffix}</span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Right Column - Visual */}
          <ScaleIn delay={0.3} duration={0.8}>
            <div className="relative">
              {/* Floating gradient orbs */}
              <motion.div
                className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.5, 0.3, 0.5]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              {/* Main card */}
              <motion.div
                className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card/95 to-card shadow-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10" />
                
                <div className="relative p-8 space-y-6">
                  {/* Mock dashboard preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-32 rounded-full bg-primary/20" />
                      <div className="h-8 w-8 rounded-full bg-primary/20" />
                    </div>
                    
                    <motion.div
                      className="h-48 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="rounded-xl bg-background/60 p-4 backdrop-blur"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                        >
                          <div className="h-2 w-20 rounded-full bg-muted" />
                          <div className="mt-2 h-3 w-16 rounded-full bg-muted/60" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}
