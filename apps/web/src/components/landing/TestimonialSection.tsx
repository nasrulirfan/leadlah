"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FadeIn } from "@/components/animations/FadeIn";
import { ScaleIn } from "@/components/animations/ScaleIn";

const faqs = [
  {
    question: "Is this really shadcn UI?",
    answer: "Yes. Every button, card, tab and accordion is composed from the shadcn/ui primitives with Radix under the hood, themed for the LeadLah brand."
  },
  {
    question: "Do I need to code to edit sections?",
    answer: "No. Marketing blocks live inside the Next.js layout. Update the copy inside the components and the shadcn components do the rest."
  },
  {
    question: "Can owners access without logging in?",
    answer: "Owner links are generated with secure tokens from @leadlah/core. They only expose the fishbone timeline and calculators you enable."
  },
  {
    question: "What animation libraries are used?",
    answer: "We use Framer Motion for smooth, performant animations that create a premium feel without sacrificing load times."
  }
];

export function TestimonialSection() {
  return (
    <section className="py-20" id="faq">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left - FAQ */}
          <FadeIn>
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary">FAQ</Badge>
                <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                  All powered by{" "}
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    shadcn/ui
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  This repo keeps marketing + app surfaces consistent. Update copy, not CSS.
                </p>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AccordionItem 
                      value={faq.question} 
                      className="rounded-lg border bg-card px-6 hover:bg-card/80 transition-colors"
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </div>
          </FadeIn>

          {/* Right - Testimonial */}
          <ScaleIn delay={0.2}>
            <Card className="relative overflow-hidden border-2 p-10 h-full">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
              
              {/* Quote icon */}
              <motion.div
                className="absolute -top-4 -right-4 opacity-10"
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Quote className="h-32 w-32 text-primary" />
              </motion.div>

              <div className="relative space-y-6">
                <Badge variant="secondary">Beta Tester</Badge>
                
                <blockquote className="space-y-4">
                  <p className="text-2xl font-semibold leading-relaxed text-foreground">
                    "LeadLah's shadcn components made our marketing site feel as polished as the dashboard—no extra CSS work."
                  </p>
                  
                  <footer className="flex items-center gap-4 pt-4">
                    <motion.div
                      className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-blue-600"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <div>
                      <p className="font-semibold text-foreground">Afiq Rahman</p>
                      <p className="text-sm text-muted-foreground">Team Lead @ IQI</p>
                    </div>
                  </footer>
                </blockquote>

                {/* Decorative elements */}
                <div className="flex gap-2 pt-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}
