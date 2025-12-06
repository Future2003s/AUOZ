import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { envConfig } from "@/config";

async function fetchMeServer() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sessionToken")?.value;
    
    if (!token) {
      return { success: true, user: null };
    }

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const res = await fetch(`${baseUrl}/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "application/json";
    const text = await res.text();
    const data =
      contentType.includes("application/json") && text ? JSON.parse(text) : {};

    if (!res.ok || !data?.success) {
      return { success: true, user: null };
    }

    return { success: true, user: data.data };
  } catch (error) {
    console.error("fetchMeServer error:", error);
    return { success: true, user: null };
  }
}

interface EmployeeLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function EmployeeLayout({ children, params }: EmployeeLayoutProps) {
  const { locale } = await params;
  const responseData = await fetchMeServer();

  // Get user data from response
  const me = responseData?.user || null;

  // Check if user is authenticated (user data exists)
  if (!me || !me.role) {
    redirect(`/${locale}/login`);
  }

  // Check if user is ADMIN or EMPLOYEE (ADMIN and EMPLOYEE can access employee routes)
  const role = (me.role || "").toUpperCase();
  const isAllowed = role === "ADMIN" || role === "EMPLOYEE";

  if (!isAllowed) {
    redirect(`/${locale}/me?unauthorized=1&role=${encodeURIComponent(role)}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}

