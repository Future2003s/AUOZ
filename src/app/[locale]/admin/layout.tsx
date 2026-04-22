import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminNavItem } from "@/layouts/admin-shell";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { getServerUser } from "@/lib/server-auth";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Globe,
  Tags,
  Award,
  Home,
  Megaphone,
  Calendar,
  FileWarning,
  FileText,
  Ticket,
  Briefcase,
  Newspaper,
  Image as ImageIcon
} from "lucide-react";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentPath = `/${locale}/admin`;

  // Direct cookie-based auth check — no self-fetch
  const { user: me } = await getServerUser();

  if (!me) {
    redirect(
      `/${locale}/login?reason=login_required&redirect=${encodeURIComponent(
        currentPath
      )}`
    );
  }

  if (!me.role) {
    redirect(
      `/${locale}/login?reason=no_role&redirect=${encodeURIComponent(
        currentPath
      )}`
    );
  }

  if (!me.email) {
    redirect(
      `/${locale}/login?reason=no_email&redirect=${encodeURIComponent(
        currentPath
      )}`
    );
  }

  const role = (me?.role || "").toUpperCase();
  // Only ADMIN and STAFF can access admin routes, EMPLOYEE cannot
  const allowed = role === "ADMIN" || role === "STAFF";

  if (!allowed) {
    redirect(`/${locale}/me?unauthorized=1&role=${encodeURIComponent(role)}`);
  }

  const navItems: AdminNavItem[] = [
    {
      id: "dashboard",
      label: "Tổng Quan",
      href: `/${locale}/admin/dashboard`,
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: "orders",
      label: "Đơn Hàng",
      href: `/${locale}/admin/orders`,
      icon: <ShoppingCart size={18} />,
    },
    {
      id: "tasks",
      label: "Công Việc",
      href: `/${locale}/admin/tasks`,
      icon: <Briefcase size={18} />,
    },
    {
      id: "products",
      label: "Sản Phẩm",
      href: `/${locale}/admin/admin-products`,
      icon: <Package size={18} />,
    },
    {
      id: "inventory",
      label: "Kho Mật Ong",
      href: `/${locale}/admin/inventory`,
      icon: <Package size={18} />,
    },
    {
      id: "categories",
      label: "Danh Mục",
      href: `/${locale}/admin/categories`,
      icon: <Tags size={18} />,
    },
    {
      id: "brands",
      label: "Thương Hiệu",
      href: `/${locale}/admin/brands`,
      icon: <Award size={18} />,
    },
    {
      id: "vouchers",
      label: "Voucher",
      href: `/${locale}/admin/vouchers`,
      icon: <Ticket size={18} />,
    },
    {
      id: "accounts",
      label: "Tài Khoản",
      href: `/${locale}/admin/accounts`,
      icon: <Users size={18} />,
    },
    {
      id: "analytics",
      label: "Thống Kê",
      href: `/${locale}/admin/analytics`,
      icon: <BarChart3 size={18} />,
    },
    {
      id: "translations",
      label: "Đa Ngôn Ngữ",
      href: `/${locale}/admin/translations`,
      icon: <Globe size={18} />,
    },
    {
      id: "homepage",
      label: "Trang Chủ",
      href: `/${locale}/admin/homepage`,
      icon: <Home size={18} />,
    },
    {
      id: "story",
      label: "Câu Chuyện",
      href: `/${locale}/admin/story`,
      icon: <FileText size={18} />,
    },
    {
      id: "news",
      label: "Tin Tức",
      href: `/${locale}/admin/news`,
      icon: <Newspaper size={18} />,
    },
    {
      id: "pastoral",
      label: "Đồng Quê",
      href: `/${locale}/admin/pastoral`,
      icon: <ImageIcon size={18} />,
    },
    {
      id: "cms",
      label: "Quản lý CMS",
      href: `/${locale}/admin/cms/posts`,
      icon: <FileText size={18} />,
    },
    {
      id: "advertisements",
      label: "Quảng Cáo",
      href: `/${locale}/admin/advertisements`,
      icon: <Megaphone size={18} />,
    },
    {
      id: "promos",
      label: "Banner Sản Phẩm",
      href: `/${locale}/admin/promos`,
      icon: <ImageIcon size={18} />,
    },
    {
      id: "pastoral",
      label: "Hoạt Động",
      href: `/${locale}/admin/pastoral`,
      icon: <Calendar size={18} />,
    },
    {
      id: "complaints",
      label: "Khiếu Nại",
      href: `/${locale}/admin/complaints`,
      icon: <FileWarning size={18} />,
    },
    {
      id: "settings",
      label: "Cài Đặt",
      href: `/${locale}/admin/settings`,
      icon: <Settings size={18} />,
    },
  ];

  return (
    <AdminDashboardClient
      userName={me?.fullName || me?.firstName || me?.name || "Admin"}
      locale={locale}
    >
      {children}
    </AdminDashboardClient>
  );
}
