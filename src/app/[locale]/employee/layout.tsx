import { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import EmployeeLayoutClient from "./EmployeeLayoutClient";

async function fetchMeServer() {
  try {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") || "http";
    const url = `${proto}://${host}/api/auth/me`;
    const cookieHeader = h.get("cookie") || "";

    const res = await fetch(url, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return { success: false, user: null };
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return { success: data?.success ?? false, user: data?.user || null };
  } catch (error) {
    console.error("fetchMeServer error:", error);
    return { success: false, user: null };
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


