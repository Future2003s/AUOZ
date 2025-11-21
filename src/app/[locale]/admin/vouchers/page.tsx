"use client";
import dynamic from "next/dynamic";

const VoucherPageClient = dynamic(() => import("./VoucherPageClient"), {
  ssr: false,
});

export default function AdminVouchersPage() {
  return <VoucherPageClient />;
}

