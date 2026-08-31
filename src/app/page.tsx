import { AppShell } from "@/components/app-shell";
import { EXERCISE_CATALOG } from "@/lib/catalog";

export default function HomePage() {
  return <AppShell catalog={EXERCISE_CATALOG} source="catalog" />;
}
