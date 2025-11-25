import { ReactNode } from "react";
import { headers } from "next/headers";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import HydrateClient from "@/providers/hydrate-client";
import { meQueryKey } from "./query";

async function fetchMeServer() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const url = `${proto}://${host}/api/auth/me`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { cookie: h.get("cookie") || "" },
  });

  if (!res.ok) {
    return null;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return data;
}

export default async function MeLayout({ children }: { children: ReactNode }) {
  const qc = new QueryClient();
  await qc.prefetchQuery({ queryKey: meQueryKey, queryFn: fetchMeServer });
  const dehydratedState = dehydrate(qc);
  return <HydrateClient state={dehydratedState}>{children}</HydrateClient>;
}
