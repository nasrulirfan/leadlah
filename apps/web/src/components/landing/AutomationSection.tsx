"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/animations/FadeIn";
import { StaggerContainer, staggerItem } from "@/components/animations/StaggerContainer";

const automations = [
  {
    title: "Portal Expiry Guard",
    badge: "Reminders",
    description: "Auto-create reminders whenever you log iProperty, PropertyGuru, EdgeProp, or FB Boost expiry.",
    gradient: "from-blue-600 to-cyan-600"
  },
  {
    title: "Owner Follow Ups",
    badge: "Messaging",
    description: "Send templated WhatsApp/email summaries with CTA tracking to prove weekly momentum.",
    gradient: "from-purple-600 to-pink-600"
  },
  {
    title: "Paperwork Vault",
    badge: "Docs",
    description: "Drop SPA, tenancy, receipts into one listing vault. Owners see the same clean record.",
    gradient: "from-orange-600 to-red-600"
  }
];

const logos = ["IQI", "ERA", "Reapfield", "Hartamas", "Tech Realtors", "Allied Group"];

export function AutomationSection() {
  return (
    <section className="py-20" id="automation">
      <div className="container">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 lg:p-16 shadow-2xl">
            {/* Animated grid background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                 linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }} />
            </div>

            {/* Floating orbs */}
            <motion.div
              className="absolute top-20 right-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 5, repeat: Infinity }}
            />

            <div className="relative space-y-12">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                    Automation
                  </p>
                  <h2 className="text-4xl font-bold text-white md:text-5xl">
                    Designed for Malaysian REN cadences.
                  </h2>
                  <p className="text-lg text-white/80 max-w-2xl">
                    Reminders and owner comms trigger automatically off the fishbone tracker.
                  </p>
                </div>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/listings">View Listings OS</Link>
                </Button>
              </div>

              {/* Automation cards */}
              <StaggerContainer className="grid gap-6 md:grid-cols-3">
                {automations.map((automation, index) => (
                  <motion.div
                    key={automation.title}
                    variants={staggerItem}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="group relative overflow-hidden border-white/10 bg-white/5 p-8 backdrop-blur-xl h-full hover:bg-white/10 transition-all">
                      {/* Gradient accent */}
                      <motion.div
                        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${automation.gradient}`}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                      />
                      
                      <div className="space-y-4">
                        <Badge 
                          variant="outline" 
                          className="border-white/30 bg-white/10 text-white"
                        >
                          {automation.badge}
                        </Badge>
                        
                        <h3 className="text-2xl font-bold text-white">
                          {automation.title}
                        </h3>
                        
                        <p className="text-white/80 leading-relaxed">
                          {automation.description}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </StaggerContainer>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Logos */}
              <FadeIn delay={0.4}>
                <div className="space-y-4">
                  <p className="text-center text-sm font-medium text-white/60">
                    Trusted by agents from leading agencies
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    {logos.map((logo, index) => (
                      <motion.div
                        key={logo}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <span className="inline-block rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur">
                          {logo}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
