import { StickyHeader } from "@/components/nav/StickyHeader";
import { CheckEmailClient } from "@/components/auth/CheckEmailClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

export default async function CheckEmailPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const type = first(searchParams.type);
  const email = first(searchParams.email);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StickyHeader variant="marketing" />
      <main className="container py-16">
        <CheckEmailClient type={type} email={email} />
      </main>
    </div>
  );
}
