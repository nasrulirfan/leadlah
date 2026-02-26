import { StickyHeader } from "@/components/nav/StickyHeader";
import { CheckEmailClient } from "@/components/auth/CheckEmailClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

export default function CheckEmailPage(props: { searchParams: SearchParams }) {
  const type = first(props.searchParams.type);
  const email = first(props.searchParams.email);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StickyHeader variant="marketing" />
      <main className="container py-16">
        <CheckEmailClient type={type} email={email} />
      </main>
    </div>
  );
}

