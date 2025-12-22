import CalculatorsClient from "./client";
import { requireSession } from "@/lib/session";
import { fetchProfile } from "@/data/profile";

type AgentMetadata = {
  renNumber?: string;
  agencyLogoUrl?: string;
  defaultCustomerName?: string;
};

export default async function CalculatorsPage() {
  const session = await requireSession();
  const metadata = ((session.user as unknown as { metadata?: AgentMetadata })?.metadata ?? {}) as AgentMetadata;
  const profile = await fetchProfile(session.user.id, {
    name: session.user.name ?? undefined,
    email: session.user.email ?? undefined
  });

  return (
    <CalculatorsClient
      agent={{
        name: session.user?.name ?? "LeadLah Agent",
        renNumber: metadata.renNumber ?? "REN 00000",
        agencyLogoUrl: metadata.agencyLogoUrl ?? session.user?.image ?? undefined,
        avatarUrl: profile.avatarUrl ?? session.user?.image ?? undefined
      }}
      defaultCustomerName={metadata.defaultCustomerName}
    />
  );
}
