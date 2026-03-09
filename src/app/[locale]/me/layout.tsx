import { ReactNode } from "react";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import HydrateClient from "@/providers/hydrate-client";
import { meQueryKey } from "./query";
import { getServerUser } from "@/lib/server-auth";

export default async function MeLayout({ children }: { children: ReactNode }) {
  const qc = new QueryClient();

  // Direct cookie-based auth — no self-fetch to /api/auth/me
  const { user } = await getServerUser();

  // Prefetch React Query with the result so client doesn't re-fetch
  await qc.prefetchQuery({
    queryKey: meQueryKey,
    queryFn: async () => ({ success: true, user: user || null }),
  });

  const dehydratedState = dehydrate(qc);
  return <HydrateClient state={dehydratedState}>{children}</HydrateClient>;
}
