import { headers } from "next/headers";
import { ComplaintsPageClient } from "@/components/pages/complaints-client";
import {
  ComplaintSettings,
  defaultComplaintSettings,
} from "@/types/complaints";

async function fetchComplaintSettings(baseUrl: string): Promise<ComplaintSettings> {
  try {
    const res = await fetch(`${baseUrl}/api/complaints`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch complaints settings");
    const data = await res.json();
    return data?.data || defaultComplaintSettings;
  } catch (error) {
    console.error("Failed to load complaints settings:", error);
    return defaultComplaintSettings;
  }
}

export default async function ComplaintPage() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol =
    process.env.VERCEL_ENV || process.env.NODE_ENV === "production"
      ? "https"
      : "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_URL || `${protocol}://${host.replace(/\/$/, "")}`;

  const settings = await fetchComplaintSettings(baseUrl);
  return <ComplaintsPageClient settings={settings} />;
}

