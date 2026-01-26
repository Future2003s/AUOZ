import { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNavItem } from "@/layouts/admin-shell";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
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
} from "lucide-react";

async function fetchMeServer() {
  try {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    const url = `${proto}://${host}/api/auth/me`;
    const cookieHeader = h.get("cookie") || "";

    const res = await fetch(url, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
      // Thêm timeout để tránh hang
      signal: AbortSignal.timeout(5000),
    });

    return res;
  } catch (error) {
    console.error("fetchMeServer error:", error);
    // Return a mock response với status 401 để trigger redirect
    return new Response(
      JSON.stringify({ success: false, error: "Network error" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  try {
    const { locale } = await params;
    const res = await fetchMeServer();
    const currentPath = `/${locale}/admin`;

    if (res.status === 401) {
      redirect(
        `/${locale}/login?reason=login_required&redirect=${encodeURIComponent(
          currentPath
        )}`
      );
    }

    if (res.status === 403) {
      redirect(
        `/${locale}/login?reason=forbidden&redirect=${encodeURIComponent(
          currentPath
        )}`
      );
    }

    if (!res.ok) {
      redirect(
        `/${locale}/login?reason=api_error&status=${
          res.status
        }&redirect=${encodeURIComponent(currentPath)}`
      );
    }

    let me: any = null;
    try {
      const text = await res.text();
      me = text ? JSON.parse(text) : null;
      me = me?.user || me?.data || me;
    } catch (parseError) {
      console.error("Failed to parse user data:", parseError);
      redirect(
        `/${locale}/login?reason=parse_error&redirect=${encodeURIComponent(
          currentPath
        )}`
      );
    }

    if (!me) {
      redirect(
        `/${locale}/login?reason=no_user&redirect=${encodeURIComponent(
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
        id: "advertisements",
        label: "Quảng Cáo",
        href: `/${locale}/admin/advertisements`,
        icon: <Megaphone size={18} />,
      },
      {
        id: "activities",
        label: "Hoạt Động",
        href: `/${locale}/admin/activities`,
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
  } catch (error) {
    console.error("Admin layout error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Không redirect nếu error là NEXT_REDIRECT (tránh redirect loop)
    if (errorMessage.includes("NEXT_REDIRECT")) {
      console.error(
        "NEXT_REDIRECT error detected, not redirecting to avoid loop"
      );
      // Return error page instead
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Lỗi xác thực
            </h1>
            <p className="text-gray-600">Vui lòng đăng nhập lại để tiếp tục.</p>
          </div>
        </div>
      );
    }

    // Use locale from params if available, otherwise default to 'vi'
    const fallbackLocale = params
      ? await params.then((p) => p.locale).catch(() => "vi")
      : "vi";
    redirect(
      `/${fallbackLocale}/login?reason=error&error=${encodeURIComponent(
        errorMessage
      )}`
    );
  }
}
