"use client";
import AdminDashboard from "./AdminDashboard";

interface AdminDashboardClientProps {
  userName?: string;
  locale?: string;
  children: React.ReactNode;
}

export default function AdminDashboardClient({
  userName,
  locale,
  children,
}: AdminDashboardClientProps) {
  return (
    <AdminDashboard userName={userName} locale={locale}>
      {children}
    </AdminDashboard>
  );
}

