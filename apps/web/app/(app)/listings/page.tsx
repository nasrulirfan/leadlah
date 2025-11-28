import ListingsClient from "./client";
import { requireSession } from "@/lib/session";

export default async function ListingsPage() {
  await requireSession();
  return <ListingsClient />;
}
