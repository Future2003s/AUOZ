"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, GitBranch, ChevronRight, Layers } from "lucide-react";
import Link from "next/link";
import { getBoms } from "@/apiRequests/bom";
import { BomHeader, BomStatus } from "@/types/erp";

const statusColors: Record<BomStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    OBSOLETE: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
};

const statusLabels: Record<BomStatus, string> = {
    DRAFT: "Nháp",
    ACTIVE: "Đang dùng",
    OBSOLETE: "Lỗi thời",
};

export default function BomListPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<BomStatus | "">("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["boms", statusFilter, page],
        queryFn: () => getBoms({ page, limit: 20, status: statusFilter || undefined }),
    });

    const boms = (data?.data ?? []) as BomHeader[];
    const total = (data?.meta as { total?: number })?.total ?? 0;

    const filtered = boms.filter((b) => {
        const product = typeof b.productId === "object" ? b.productId : null;
        return !search || (product?.name ?? "").toLowerCase().includes(search.toLowerCase()) || b.bomNo.includes(search);
    });

    return (
        <div className="p-6 space-y-5">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-500" />
                        Định mức vật tư (BOM)
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{total} BOM</p>
                </div>
                <Link
                    href="./bom/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Tạo BOM mới
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm BOM..."
                        className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                    />
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                    {(["", "DRAFT", "ACTIVE", "OBSOLETE"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                        >
                            {s === "" ? "Tất cả" : statusLabels[s as BomStatus]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mã BOM</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sản phẩm</th>
                            <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ver.</th>
                            <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Trạng thái</th>
                            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Chi phí NVL</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ngày tạo</th>
                            <th className="py-3 px-4" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: 7 }).map((__, j) => (
                                        <td key={j} className="py-3 px-4">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                            : filtered.map((bom) => {
                                const product = typeof bom.productId === "object" ? bom.productId : null;
                                return (
                                    <tr key={bom._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">{bom.bomNo}</td>
                                        <td className="py-3 px-4">
                                            <span className="font-medium text-slate-800 dark:text-slate-100">{product?.name ?? "—"}</span>
                                            {product?.sku && <span className="ml-2 text-xs text-slate-400">{product.sku}</span>}
                                        </td>
                                        <td className="py-3 px-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">v{bom.version}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[bom.status]}`}>
                                                {statusLabels[bom.status]}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(bom.totalMaterialCostCents / 100)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(bom.createdAt).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Link
                                                href={`./bom/${bom._id}`}
                                                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <GitBranch className="w-3.5 h-3.5" /> Xem chi tiết <ChevronRight className="w-3 h-3" />
                                            </Link>
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
