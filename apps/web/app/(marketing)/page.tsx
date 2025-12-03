import Link from "next/link";
import { StickyHeader } from "@/components/nav/StickyHeader";
import { AnimatedHero } from "@/components/landing/AnimatedHero";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { AutomationSection } from "@/components/landing/AutomationSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { CTASection } from "@/components/landing/CTASection";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/80 to-background">
      <StickyHeader variant="marketing" />
      
      <main className="space-y-0">
        <AnimatedHero />
        <FeatureShowcase />
        <AutomationSection />
        <TestimonialSection />
        <CTASection />

        <footer className="border-t border-border bg-background/50 backdrop-blur">
          <div className="container py-12">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex gap-6">
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
                <Link href="mailto:support@leadlah.com" className="hover:text-foreground transition-colors">
                  Support
                </Link>
              </div>
              <span>© {new Date().getFullYear()} LeadLah. Crafted with Next.js + shadcn/ui.</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
