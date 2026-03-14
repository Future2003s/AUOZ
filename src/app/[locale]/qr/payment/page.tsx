"use client";
import React, { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { envConfig } from "@/config";
import { CheckCircle, Clock, QrCode, AlertCircle, Copy, Check, ArrowLeft } from "lucide-react";

const POLL_INTERVAL_MS = 5_000;     // poll every 5s
const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

interface BankInfo {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
  qrDataURL?: string;
}

function useCountdown(totalMs: number) {
  const [remaining, setRemaining] = useState(totalMs);
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(t);
  }, [remaining]);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return { remaining, minutes, seconds, expired: remaining === 0 };
}

function VietQRPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const amount = Number(searchParams.get("amount") || 0);
  const desc = searchParams.get("desc") || "";
  const orderNumber = searchParams.get("orderNumber") || searchParams.get("order") || "";

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "paid" | "failed">("pending");
  const [copied, setCopied] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { minutes, seconds, expired } = useCountdown(PAYMENT_TIMEOUT_MS);

  // Generate VietQR
  useEffect(() => {
    if (!amount || amount <= 0) {
      setError("Số tiền không hợp lệ");
      setLoading(false);
      return;
    }

    const generate = async () => {
      setLoading(true);
      try {
        // Try backend endpoint first
        const res = await fetch("/api/payment/vietqr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amount, description: desc || orderNumber }),
        });

        if (res.ok) {
          const data = await res.json();
          setBankInfo(data?.data || data);
          setQrUrl(data?.data?.qrDataURL || data?.qrDataURL || data?.data?.qrUrl || data?.qrUrl || null);
        } else {
          // Fallback: use VietQR public API directly
          const accountNo = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "0123456789";
          const bankId = process.env.NEXT_PUBLIC_BANK_ID || "VCB";
          const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "LALA LYCHEEE";
          const vietQrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(desc || orderNumber)}&accountName=${encodeURIComponent(accountName)}`;
          setQrUrl(vietQrUrl);
          setBankInfo({ bankId, accountNo, accountName, amount, description: desc || orderNumber });
        }
      } catch {
        // Final fallback: static VietQR
        const vietQrUrl = `https://img.vietqr.io/image/VCB-0123456789-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(desc || orderNumber)}`;
        setQrUrl(vietQrUrl);
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [amount, desc, orderNumber]);

  // Auto-poll payment status
  useEffect(() => {
    if (!orderNumber || status !== "pending") return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/track/${orderNumber}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const orderStatus = data?.data?.status || data?.status;
        const paymentStatus = data?.data?.paymentInfo?.status || data?.data?.paymentStatus;
        if (paymentStatus === "paid" || orderStatus === "delivered" || orderStatus === "processing") {
          setStatus("paid");
        }
      } catch { /* ignore polling errors */ }
    };

    // Start polling
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    // Expire after 15 min
    timeoutRef.current = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      setStatus("failed");
    }, PAYMENT_TIMEOUT_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [orderNumber, status]);

  // Redirect on success
  useEffect(() => {
    if (status === "paid") {
      if (pollRef.current) clearInterval(pollRef.current);
      const callbackUrl = `/${window.location.pathname.split("/")[1]}/payment-callback?status=success&orderNumber=${encodeURIComponent(orderNumber)}`;
      setTimeout(() => router.replace(callbackUrl), 1500);
    }
  }, [status, orderNumber, router]);

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Đang tạo mã QR thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center max-w-md w-full shadow-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Lỗi tạo QR</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{error}</p>
          <button onClick={() => router.back()} className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4 pt-28">
      <div className="max-w-md w-full space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-3">
            <QrCode className="h-4 w-4" /> Thanh toán qua VietQR
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quét mã để thanh toán</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sử dụng ứng dụng ngân hàng bất kỳ</p>
        </div>

        {/* QR Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Status bar */}
          {status === "paid" ? (
            <div className="bg-green-500 text-white px-6 py-3 flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Thanh toán thành công! Đang chuyển trang...</span>
            </div>
          ) : expired ? (
            <div className="bg-red-500 text-white px-6 py-3 flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Mã QR đã hết hạn</span>
            </div>
          ) : (
            <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Hết hạn sau
              </span>
              <span className={`font-bold text-lg tabular-nums ${minutes < 5 ? "text-red-300" : "text-white"}`}>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
          )}

          {/* QR Code */}
          <div className="p-6 text-center">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="VietQR Payment QR Code"
                className={`w-56 h-56 mx-auto rounded-2xl border-4 border-gray-100 dark:border-gray-700 object-cover transition-opacity ${status === "paid" ? "opacity-50" : ""}`}
              />
            ) : (
              <div className="w-56 h-56 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <QrCode className="h-16 w-16 text-gray-300" />
              </div>
            )}

            <div className="mt-4 space-y-1">
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(amount)}</p>
              {(desc || orderNumber) && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nội dung: <span className="font-medium text-gray-900 dark:text-white">{desc || orderNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Bank info */}
          {bankInfo && (
            <div className="px-6 pb-6 space-y-3">
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2.5">
                {[
                  { label: "Ngân hàng", value: bankInfo.bankId, key: "bank" },
                  { label: "Số tài khoản", value: bankInfo.accountNo, key: "accNo" },
                  { label: "Chủ tài khoản", value: bankInfo.accountName, key: "accName" },
                  { label: "Số tiền", value: formatCurrency(bankInfo.amount), key: "amount" },
                ].map(({ label, value, key }) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value}</span>
                      {(key === "accNo" || key === "amount") && (
                        <button onClick={() => handleCopy(value, key)} className="flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors">
                          {copied === key ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Polling indicator */}
        {status === "pending" && !expired && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Đang kiểm tra thanh toán tự động mỗi 5 giây...
          </div>
        )}

        <button onClick={() => router.back()} className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
      </div>
    </div>
  );
}

export default function VietQRPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" /></div>}>
      <VietQRPaymentContent />
    </Suspense>
  );
}
