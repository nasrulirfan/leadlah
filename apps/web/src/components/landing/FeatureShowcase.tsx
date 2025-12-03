"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FadeIn } from "@/components/animations/FadeIn";
import { StaggerContainer, staggerItem } from "@/components/animations/StaggerContainer";

const features = {
  agents: [
    {
      title: "Fishbone Tracker",
      description: "Visual workflow from appointment to handover with accountability on every stage.",
      icon: ClipboardList,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Listing Intelligence",
      description: "Portal health, ad expiry, and owner reminders appear in a single stream.",
      icon: BarChart3,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Owner Transparency",
      description: "Secure share links with live progress, media status, and cost receipts.",
      icon: ShieldCheck,
      color: "from-orange-500 to-red-500"
    }
  ],
  owners: [
    {
      title: "Smart Reminders",
      description: "Expiry, tenancy, and exclusive contract alerts sent automatically to REN & owners.",
      icon: CalendarClock,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "One-tap Updates",
      description: "Broadcast progress to multiple owners with templates and CTA tracking.",
      icon: Sparkles,
      color: "from-yellow-500 to-orange-500"
    },
    {
      title: "Branded PDFs",
      description: "Generate receipt-quality PDFs for DSR, legal fees, ROI, tenancy and land feasibility.",
      icon: CheckCircle2,
      color: "from-indigo-500 to-purple-500"
    }
  ],
  calculators: [
    {
      title: "Reverse DSR",
      description: "Bank-lender style breakdowns with max loan amount, price bands, and shareable receipts.",
      icon: Zap,
      color: "from-cyan-500 to-blue-500"
    },
    {
      title: "Legal & Stamp Duty",
      description: "SPA/MOT, loan agreement, tenancy stamp and land feasibility calculators tuned for Malaysia.",
      icon: ShieldCheck,
      color: "from-pink-500 to-rose-500"
    },
    {
      title: "ROI & Sellability",
      description: "Pro worksheet to defend pricing, forecast rent, and present market positioning.",
      icon: BarChart3,
      color: "from-violet-500 to-purple-500"
    }
  ]
};

export function FeatureShowcase() {
  return (
    <section className="py-20" id="features">
      <div className="container">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
            <Badge variant="secondary" className="mb-2">Feature Stack</Badge>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              One design system.{" "}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Infinite possibilities.
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Swap hero copy, add calculator cards, and the Tailwind tokens keep everything consistent.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Tabs defaultValue="agents" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-12">
              <TabsTrigger value="agents">REN Teams</TabsTrigger>
              <TabsTrigger value="owners">Owners</TabsTrigger>
              <TabsTrigger value="calculators">Calculators</TabsTrigger>
            </TabsList>

            {Object.entries(features).map(([key, items]) => (
              <TabsContent key={key} value={key}>
                <StaggerContainer className="grid gap-6 md:grid-cols-3">
                  {items.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      variants={staggerItem}
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="group relative overflow-hidden border-2 p-8 h-full hover:border-primary/50 hover:shadow-xl transition-all">
                        {/* Gradient background on hover */}
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                        />
                        
                        <div className="relative space-y-4">
                          <motion.div
                            className={`inline-flex rounded-2xl bg-gradient-to-br ${feature.color} p-3`}
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                          >
                            <feature.icon className="h-6 w-6 text-white" />
                          </motion.div>
                          
                          <h3 className="text-xl font-bold">{feature.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </StaggerContainer>
              </TabsContent>
            ))}
          </Tabs>
        </FadeIn>
      </div>
    </section>
  );
}
