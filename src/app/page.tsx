import { redirect } from "next/navigation";

/**
 * Root page ("/") — always redirect to the default locale.
 * The middleware handles this first (308 permanent redirect), but this
 * server-component redirect acts as a fallback for edge cases such as
 * static-export mode or misconfigured reverse proxies.
 */
export default function RootPage() {
  redirect("/vi");
}
