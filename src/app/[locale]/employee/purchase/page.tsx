"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
    ShoppingCart, FileText, Package, TrendingUp,
    ChevronRight, Clock, CheckCircle, AlertTriangle
} from "lucide-react";
import { getPOs, getPRs } from "@/apiRequests/purchase";
import { PurchaseOrder, PurchaseRequisition, POStatus, PRStatus } from "@/types/erp";

function formatCurrency(cents: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cents / 100);
}

const prStatusCfg: Record<PRStatus, { label: string; color: string }> = {
    DRAFT: { label: "Nháp", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
    SUBMITTED: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    APPROVED: { label: "Đã duyệt", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" },
    CANCELLED: { label: "Đã hủy", color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
    CONVERTED: { label: "Đã tạo PO", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
};

const poStatusCfg: Record<POStatus, { label: string; color: string }> = {
    DRAFT: { label: "Nháp", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
    PENDING_APPROVAL: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    APPROVED: { label: "Đã duyệt", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    SENT: { label: "Đã gửi NCC", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
    PARTIAL: { label: "Nhận một phần", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
    RECEIVED: { label: "Đã nhận đủ", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    CANCELLED: { label: "Đã hủy", color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

export default function PurchaseDashboard() {
    const { data: prData } = useQuery({
        queryKey: ["purchase-prs-dashboard"],
        queryFn: () => getPRs({ limit: 5 }),
    });
    const { data: poData } = useQuery({
        queryKey: ["purchase-pos-dashboard"],
        queryFn: () => getPOs({ limit: 5 }),
    });

    const prs = (prData?.data ?? []) as PurchaseRequisition[];
    const pos = (poData?.data ?? []) as PurchaseOrder[];
    const prTotal = (prData?.meta as { total?: number })?.total ?? 0;
    const poTotal = (poData?.meta as { total?: number })?.total ?? 0;

    // Compute KPIs
    const pendingPRs = prs.filter((p) => p.status === "SUBMITTED").length;
    const pendingPOs = pos.filter((p) => p.status === "PENDING_APPROVAL").length;
    const openPOs = pos.filter((p) => ["APPROVED", "SENT", "PARTIAL"].includes(p.status)).length;
    const totalPoValue = pos.reduce((s, p) => s + p.totalAmountCents, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-500" />
                    Mua hàng & Thu mua
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Quản lý tổng thể PR · PO · GR</p>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "PR chờ duyệt", value: pendingPRs, icon: Clock, color: "from-amber-500 to-orange-500" },
                    { label: "PO chờ duyệt", value: pendingPOs, icon: AlertTriangle, color: "from-red-500 to-pink-500" },
                    { label: "PO đang mở", value: openPOs, icon: TrendingUp, color: "from-blue-500 to-indigo-500" },
                    { label: "Giá trị PO", value: formatCurrency(totalPoValue), icon: CheckCircle, color: "from-emerald-500 to-teal-500" },
                ].map(({ label, value, icon: Icon, color }, i) => (
                    <div key={i} className={`rounded-2xl bg-gradient-to-br ${color} p-4 text-white`}>
                        <Icon className="w-5 h-5 opacity-80 mb-2" />
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-white/80 text-xs mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { href: "./purchase/requisitions", icon: FileText, label: "Yêu cầu mua hàng (PR)", count: prTotal },
                    { href: "./purchase/orders", icon: ShoppingCart, label: "Đơn mua hàng (PO)", count: poTotal },
                    { href: "./purchase/receipts", icon: Package, label: "Phiếu nhận hàng (GR)", count: null },
                ].map(({ href, icon: Icon, label, count }) => (
                    <Link
                        key={href}
                        href={href}
                        className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <Icon className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                                {count != null && <p className="text-xs text-slate-400 dark:text-slate-500">{count} bản ghi</p>}
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </Link>
                ))}
            </div>

            {/* Recent PRs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-500" /> Yêu cầu mua hàng gần đây
                    </h2>
                    <Link href="./purchase/requisitions" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        Xem tất cả <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {prs.length === 0 ? (
                            <tr><td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">Không có dữ liệu</td></tr>
                        ) : prs.map((pr) => (
                            <tr key={pr._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">{pr.prNo}</td>
                                <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-xs">
                                    {typeof pr.requestedBy === "object" ? pr.requestedBy.name : pr.requestedBy}
                                </td>
                                <td className="py-3 px-4 text-right text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {formatCurrency(pr.totalEstimatedCents)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${prStatusCfg[pr.status]?.color ?? ""}`}>
                                        {prStatusCfg[pr.status]?.label ?? pr.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Recent POs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-blue-500" /> Đơn mua hàng gần đây
                    </h2>
                    <Link href="./purchase/orders" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        Xem tất cả <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {pos.length === 0 ? (
                            <tr><td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">Không có dữ liệu</td></tr>
                        ) : pos.map((po) => {
                            const vendor = typeof po.vendorId === "object" ? po.vendorId : null;
                            return (
                                <tr key={po._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">{po.poNo}</td>
                                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-xs">{vendor?.name ?? "—"}</td>
                                    <td className="py-3 px-4 text-right text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {formatCurrency(po.totalAmountCents)}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${poStatusCfg[po.status]?.color ?? ""}`}>
                                            {poStatusCfg[po.status]?.label ?? po.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
