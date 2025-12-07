"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

/**
 * Component to optimize navigation by prefetching routes on hover
 */
export default function NavigationOptimizer() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Prefetch common admin routes
    const commonRoutes = [
      "/admin/dashboard",
      "/admin/orders",
      "/admin/products",
      "/admin/accounts",
      "/admin/cms",
      "/admin/homepage",
      "/admin/advertisements",
    ];

    // Get locale from pathname
    const locale = pathname?.split("/")[1] || "vi";

    // Prefetch routes after a short delay
    const timer = setTimeout(() => {
      commonRoutes.forEach((route) => {
        router.prefetch(`/${locale}${route}`);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [pathname, router]);

  return null;
}

