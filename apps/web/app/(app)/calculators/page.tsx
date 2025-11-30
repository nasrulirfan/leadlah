import CalculatorsClient from "./client";
import { requireSession } from "@/lib/session";

type AgentMetadata = {
  renNumber?: string;
  agencyLogoUrl?: string;
  defaultCustomerName?: string;
};

export default async function CalculatorsPage() {
  const session = await requireSession();
  const metadata = (session.user?.metadata ?? {}) as AgentMetadata;

  return (
    <CalculatorsClient
      agent={{
        name: session.user?.name ?? "LeadLah Agent",
        renNumber: metadata.renNumber ?? "REN 00000",
        agencyLogoUrl: metadata.agencyLogoUrl ?? session.user?.image ?? undefined
      }}
      defaultCustomerName={metadata.defaultCustomerName}
    />
  );
}
