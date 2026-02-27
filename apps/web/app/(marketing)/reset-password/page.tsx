import { StickyHeader } from "@/components/nav/StickyHeader";
import { ResetPasswordClient } from "@/components/auth/ResetPasswordClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

export default async function ResetPasswordPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const token = first(searchParams.token);
  const error = first(searchParams.error);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StickyHeader variant="marketing" />
      <main className="container py-16">
        <ResetPasswordClient token={token} error={error} />
      </main>
    </div>
  );
}
