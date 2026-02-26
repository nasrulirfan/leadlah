import { StickyHeader } from "@/components/nav/StickyHeader";
import { VerifyEmailClient } from "@/components/auth/VerifyEmailClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

export default function VerifyEmailPage(props: { searchParams: SearchParams }) {
  const token = first(props.searchParams.token);
  const callbackURL = first(props.searchParams.callbackURL);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StickyHeader variant="marketing" />
      <main className="container py-16">
        <VerifyEmailClient token={token} callbackURL={callbackURL} />
      </main>
    </div>
  );
}

