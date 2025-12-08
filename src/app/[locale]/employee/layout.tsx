import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { envConfig } from "@/config";
import EmployeeLayoutClient from "./EmployeeLayoutClient";

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
    const currentPath = `/${locale}/employee`;
    redirect(
      `/${locale}/login?reason=login_required&redirect=${encodeURIComponent(
        currentPath
      )}`
    );
  }

  // Check if user is ADMIN or EMPLOYEE (ADMIN and EMPLOYEE can access employee routes)
  const role = (me.role || "").toUpperCase();
  const isAllowed = role === "ADMIN" || role === "EMPLOYEE";

  if (!isAllowed) {
    redirect(`/${locale}/me?unauthorized=1&role=${encodeURIComponent(role)}`);
  }

  return (
    <EmployeeLayoutClient>
      {children}
    </EmployeeLayoutClient>
  );
}

