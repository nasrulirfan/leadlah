"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/FadeIn";

export function CTASection() {
  return (
    <section className="py-20">
      <div className="container">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-blue-500/5 to-primary/10 p-12 lg:p-20">
            {/* Animated background pattern */}
            <motion.div
              className="absolute inset-0 opacity-30"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"]
              }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(29,103,255,0.3) 0%, transparent 50%),
                                 radial-gradient(circle at 80% 80%, rgba(59,130,246,0.3) 0%, transparent 50%)`,
                backgroundSize: "200% 200%"
              }}
            />

            <div className="relative mx-auto max-w-3xl text-center space-y-8">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <div className="inline-flex rounded-full bg-primary/10 p-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </motion.div>

              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  Ready to transform your{" "}
                  <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                    property business?
                  </span>
                </h2>
                
                <p className="text-xl text-muted-foreground">
                  Join 320+ REN professionals who&apos;ve already made the switch to LeadLah.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="group text-lg px-8 py-6" asChild>
                    <Link href="/sign-in">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                    <Link href="/dashboard">View Demo</Link>
                  </Button>
                </motion.div>
              </div>

              <p className="text-sm text-muted-foreground">
                No credit card required • 7-day free trial • Cancel anytime
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
