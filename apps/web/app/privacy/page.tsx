export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">
        LeadLah stores listing, reminder, and billing data securely. Media uploads are routed to Cloudflare R2; payments are processed by HitPay.
      </p>
    </div>
  );
}
