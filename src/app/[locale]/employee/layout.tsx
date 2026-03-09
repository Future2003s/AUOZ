import { ReactNode } from "react";
import { redirect } from "next/navigation";
import EmployeeLayoutClient from "./EmployeeLayoutClient";
import { getServerUser } from "@/lib/server-auth";

interface EmployeeLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function EmployeeLayout({ children, params }: EmployeeLayoutProps) {
  const { locale } = await params;

  // Direct cookie-based auth check — no self-fetch
  const { user: me } = await getServerUser();

  // Check if user is authenticated
  if (!me || !me.role) {
    const currentPath = `/${locale}/employee`;
    redirect(
      `/${locale}/login?reason=login_required&redirect=${encodeURIComponent(
        currentPath
      )}`
    );
  }

  // Check if user is ADMIN or EMPLOYEE
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
