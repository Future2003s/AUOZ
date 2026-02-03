"use client";
import LoginForm from "./login-form";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const LoginPage = () => {
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
};

export default LoginPage;
