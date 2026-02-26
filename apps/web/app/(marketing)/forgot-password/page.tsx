import { StickyHeader } from "@/components/nav/StickyHeader";
import { ForgotPasswordClient } from "@/components/auth/ForgotPasswordClient";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <StickyHeader variant="marketing" />
      <main className="container py-16">
        <ForgotPasswordClient />
      </main>
    </div>
  );
}

