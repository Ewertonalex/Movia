import { AppShell } from "@/components/app-shell";
import { loadCatalog } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { exercises, source } = await loadCatalog();
  return <AppShell catalog={exercises} source={source} />;
}
