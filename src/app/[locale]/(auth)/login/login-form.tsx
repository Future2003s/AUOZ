"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  authSchema,
  LoginBodyType,
  ExtendedLoginBodyType,
} from "@/shemaValidation/auth.schema";
import { envConfig } from "@/config";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { defaultLocale } from "@/i18n/config";
import { useAuth } from "@/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import useTranslations from "@/i18n/useTranslations";
import { Loader } from "@/components/ui/loader";
import Image from "next/image";

// Google "G" SVG icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

function LoginForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showSuccessLoader, setShowSuccessLoader] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params as any)?.locale || defaultLocale;
  const { login } = useAuth();
  const t = useTranslations();

  const redirectUrl = searchParams.get("redirect");
  const emailFromUrl = searchParams.get("email") || "";
  const passwordFromUrl = searchParams.get("password") || "";
  const [autoLoginTried, setAutoLoginTried] = useState(false);

  const {
    register,
    formState: { errors },
    handleSubmit,
    watch,
  } = useForm<LoginBodyType>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: emailFromUrl,
      password: passwordFromUrl,
    },
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");

  // Auto-login when URL has email & password
  useEffect(() => {
    if (!emailFromUrl || !passwordFromUrl || autoLoginTried) return;
    setAutoLoginTried(true);
    setIsSubmitting(true);
    setAuthError(null);
    (async () => {
      try {
        const result = await login(emailFromUrl, passwordFromUrl);
        if (result?.success) {
          setShowSuccessLoader(true);
          setTimeout(() => router.replace(redirectUrl || `/${locale}/me`), 500);
          return;
        }
        setIsSubmitting(false);
      } catch (error: any) {
        setAuthError(resolveError(error, t));
        setIsSubmitting(false);
      }
    })();
  }, [emailFromUrl, passwordFromUrl, autoLoginTried, login, redirectUrl, locale, router, t]);

  const onSubmit = async (data: LoginBodyType) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const result = await login(data.email, data.password, rememberMe);

      if (result?.success) {
        setShowSuccessLoader(true);
        setTimeout(() => router.replace(redirectUrl || `/${locale}/me`), 500);
        return;
      }
      setIsSubmitting(false);
    } catch (error: any) {
      setAuthError(resolveError(error, t));
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center bg-[#f8f9fa] dark:bg-gray-950 px-4 py-8 sm:px-6 lg:px-8 font-sans transition-colors duration-300 relative" suppressHydrationWarning>

        {/* Modern Minimal Background Accent (Optional soft glow) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex justify-center items-center">
          <div className="w-[800px] h-[800px] bg-white dark:bg-gray-900 rounded-full blur-[100px] opacity-70 dark:opacity-40"></div>
        </div>

        <div className="w-full max-w-[440px] bg-white dark:bg-[#111] rounded-[24px] sm:shadow-[0_2px_24px_rgba(0,0,0,0.06)] dark:shadow-none sm:border border-gray-100 dark:border-gray-800 p-8 sm:p-10 z-10 animate-in fade-in zoom-in-95 duration-500 relative">

          {/* Header & Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-white dark:bg-black rounded-[14px] flex items-center justify-center mb-5 border border-gray-100 dark:border-gray-800 shadow-sm">
              <Image
                src={envConfig.NEXT_PUBLIC_URL_LOGO}
                alt="LALA-LYCHEEE"
                width={32}
                height={32}
                className="object-contain rounded-full"
              />
            </div>
            <h1 className="text-[26px] font-[500] text-gray-900 dark:text-gray-50 tracking-tight text-center mb-2 leading-tight">
              Đăng nhập
            </h1>
            <p className="text-[15px] text-gray-500 dark:text-gray-400 text-center">
              {t("auth.login_subtitle") || "Tiếp tục đến tài khoản của bạn"}
            </p>
          </div>

          {/* Error Banner */}
          {authError && (
            <div
              className="flex items-start gap-3 rounded-[12px] bg-red-50 dark:bg-red-500/10 p-3.5 mb-6 animate-in fade-in zoom-in-95 duration-200"
              role="alert"
            >
              <AlertCircle className="h-[18px] w-[18px] text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-[14px] leading-tight text-red-700 dark:text-red-400 font-medium">
                {authError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[18px]" noValidate>

            {/* Standard "Floating" Material Input Strategy */}

            {/* Email Field */}
            <div>
              <div className="relative group">
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder=" "
                  disabled={isSubmitting}
                  className={`peer w-full h-[56px] bg-transparent border-[1.5px] rounded-[12px] text-gray-900 dark:text-gray-100 text-base px-4 pt-[18px] pb-2 outline-none transition-all duration-200 
                    ${errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-[3px] focus:ring-red-500/10"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-[#0b57d0] dark:focus:border-[#a8c7fa] focus:ring-[3px] focus:ring-[#0b57d0]/10 dark:focus:ring-[#a8c7fa]/20"
                    }`}
                />
                <label
                  htmlFor="email"
                  className={`absolute left-[15px] top-[16px] text-gray-500 dark:text-gray-400 text-base transition-all duration-200 transform -translate-y-0 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-[10px] peer-focus:scale-[0.80] peer-focus:text-[#0b57d0] dark:peer-focus:text-[#a8c7fa] origin-[0] cursor-text bg-white dark:bg-[#111] px-1 pointer-events-none
                    ${emailValue ? "-translate-y-[10px] scale-[0.80]" : ""}
                    ${errors.email ? "text-red-500 dark:text-red-400 peer-focus:text-red-500" : ""}
                  `}
                >
                  Email
                </label>
              </div>
              {errors.email && (
                <p className="mt-[6px] text-[13px] text-red-600 dark:text-red-400 flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-[14px] h-[14px] flex-shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="relative group">
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder=" "
                  disabled={isSubmitting}
                  className={`peer w-full h-[56px] bg-transparent border-[1.5px] rounded-[12px] text-gray-900 dark:text-gray-100 text-base pl-4 pr-12 pt-[18px] pb-2 outline-none transition-all duration-200 
                    ${errors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-[3px] focus:ring-red-500/10"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-[#0b57d0] dark:focus:border-[#a8c7fa] focus:ring-[3px] focus:ring-[#0b57d0]/10 dark:focus:ring-[#a8c7fa]/20"
                    }`}
                />
                <label
                  htmlFor="password"
                  className={`absolute left-[15px] top-[16px] text-gray-500 dark:text-gray-400 text-base transition-all duration-200 transform -translate-y-0 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-[10px] peer-focus:scale-[0.80] peer-focus:text-[#0b57d0] dark:peer-focus:text-[#a8c7fa] origin-[0] cursor-text bg-white dark:bg-[#111] px-1 pointer-events-none
                    ${passwordValue ? "-translate-y-[10px] scale-[0.80]" : ""}
                    ${errors.password ? "text-red-500 dark:text-red-400 peer-focus:text-red-500" : ""}
                  `}
                >
                  Mật khẩu
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute right-[10px] top-1/2 -translate-y-1/2 p-[6px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none rounded-full focus-visible:ring-2 focus-visible:ring-[#0b57d0] transition-colors"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-[20px] h-[20px]" /> : <Eye className="w-[20px] h-[20px]" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-[6px] text-[13px] text-red-600 dark:text-red-400 flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-[14px] h-[14px] flex-shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember & Forgot Password line */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v === true)}
                  className="w-[18px] h-[18px] border-[1.5px] border-gray-400 dark:border-gray-500 rounded-[4px] data-[state=checked]:bg-[#0b57d0] data-[state=checked]:border-[#0b57d0] dark:data-[state=checked]:bg-[#a8c7fa] dark:data-[state=checked]:border-[#a8c7fa] transition-all"
                />
                <Label htmlFor="remember" className="text-[14px] font-[400] text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                  {t("auth.remember_me") || "Ghi nhớ tôi trên thiết bị này"}
                </Label>
              </div>
            </div>

            {/* Submit & Links actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/forget-password"
                className="text-[14px] font-[500] text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#f0f4f9] dark:hover:bg-[#a8c7fa]/10 px-3 py-2 -ml-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
              >
                {t("auth.forgot_password") || "Quên mật khẩu?"}
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-[120px] h-[40px] px-6 inline-flex items-center justify-center rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa] text-white dark:text-[#041e49] font-[500] text-[14px] transition-all duration-200 
                hover:shadow-[0_1px_3px_1px_rgba(0,0,0,0.15),0_1px_2px_0_rgba(0,0,0,0.3)] hover:bg-[#0b57d0]/90 dark:hover:bg-[#a8c7fa]/90
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0b57d0] dark:focus:ring-offset-[#111] dark:focus:ring-[#a8c7fa]
                active:bg-[#0b57d0]/80
                disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <svg className="animate-spin w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <span>{t("auth.login_button") || "Tiếp theo"}</span>
                )}
              </button>
            </div>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
            </div>

            {/* Google Login Center Aligned like Google Workspace */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                className="w-full h-[40px] flex items-center justify-center gap-3 rounded-full bg-white dark:bg-transparent border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 font-[500] text-[14px] transition-all duration-200 
                hover:bg-[#f0f4f9] dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700
                disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GoogleIcon />
                <span>{t("auth.login_with_google") || "Tiếp tục với Google"}</span>
              </button>
            </div>

          </form>

          {/* Footer Signup Link */}
          <div className="mt-8">
            <p className="text-[14px] text-gray-600 dark:text-gray-400">
              {t("auth.no_account") || "Không có tài khoản?"}{" "}
              <Link
                href={`/${locale}/register`}
                className="font-[500] text-[#0b57d0] dark:text-[#a8c7fa] hover:underline transition-colors focus:outline-none rounded"
              >
                {t("auth.register_now") || "Tạo tài khoản"}
              </Link>
            </p>
          </div>
        </div>

        {/* Subtle footer */}
        <div className="mt-8 flex items-center justify-between w-full max-w-[440px] text-[12px] text-gray-500 dark:text-gray-400">
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-800 dark:hover:text-gray-300 transition-colors">Trợ giúp</a>
            <a href="#" className="hover:text-gray-800 dark:hover:text-gray-300 transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-gray-800 dark:hover:text-gray-300 transition-colors">Điều khoản</a>
          </div>
        </div>
      </div>

      <Loader isLoading={showSuccessLoader} message="" size="md" overlay={true} />
    </>
  );
}

// Helper to extract error message
function resolveError(error: any, t: (k: string) => string): string {
  const fallback = t("auth.login_failed") || "Đăng nhập thất bại";
  const invalid = t("auth.invalid_credentials") || "Email hoặc mật khẩu không đúng";
  const code = error?.statusCode ?? error?.payload?.statusCode;
  if (code === 401) return invalid;
  if (error?.payload?.error) return error.payload.error;
  if (error?.message && !/401/.test(error.message)) return error.message;
  return fallback;
}

export default LoginForm;
