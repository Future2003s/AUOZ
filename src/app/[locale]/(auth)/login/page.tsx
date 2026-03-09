"use client";
import LoginForm from "./login-form";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const reason = searchParams.get("reason");
    const hasEmail = !!searchParams.get("email");
    const hasPassword = !!searchParams.get("password");

    // Chỉ hiển thị toast yêu cầu đăng nhập nếu chưa đăng nhập
    // và KHÔNG ở chế độ auto-login (có sẵn email + password trên URL)
    if (
      !isLoading &&
      !isAuthenticated &&
      reason === "login_required" &&
      !(hasEmail && hasPassword)
    ) {
      toast.error("Vui lòng đăng nhập để tiếp tục");
    }
  }, [searchParams, isAuthenticated, isLoading]);

  return (
    <section className="container mx-auto">
      <LoginForm />
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
