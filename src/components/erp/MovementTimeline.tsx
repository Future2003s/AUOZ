"use client";

import React, { useRef, useCallback } from "react";
import { ArrowDown, ArrowUp, RotateCcw, RotateCw, Settings, Package, AlertCircle } from "lucide-react";
import { StockLedgerEntry, MovementType } from "@/types/erp";

interface MovementTimelineProps {
    entries: StockLedgerEntry[];
    isLoading?: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
}

const movementConfig: Record<MovementType, { label: string; icon: React.ElementType; color: string }> = {
    RECEIPT: { label: "Nhập kho", icon: ArrowDown, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" },
    ISSUE: { label: "Xuất kho", icon: ArrowUp, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" },
    TRANSFER_IN: { label: "Chuyển đến", icon: ArrowDown, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" },
    TRANSFER_OUT: { label: "Chuyển đi", icon: ArrowUp, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" },
    ADJUSTMENT_IN: { label: "Điều chỉnh+", icon: Settings, color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20" },
    ADJUSTMENT_OUT: { label: "Điều chỉnh-", icon: Settings, color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20" },
    RETURN_IN: { label: "Trả về", icon: RotateCcw, color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20" },
    RETURN_OUT: { label: "Trả đi", icon: RotateCw, color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20" },
    OPENING: { label: "Tồn đầu", icon: Package, color: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800" },
    SCRAP: { label: "Hủy", icon: AlertCircle, color: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20" },
};

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
}

function formatCurrency(cents: number): string {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cents / 100);
}

function getLocation(entry: StockLedgerEntry): string {
    if (typeof entry.locationId === "object" && entry.locationId !== null) {
        return `${entry.locationId.code} – ${entry.locationId.name}`;
    }
    return entry.locationId as string;
}

function getCreatedBy(entry: StockLedgerEntry): string {
    if (typeof entry.createdBy === "object" && entry.createdBy !== null) {
        return entry.createdBy.name;
    }
    return entry.createdBy as string;
}

export function MovementTimeline({ entries, isLoading = false, onLoadMore, hasMore = false }: MovementTimelineProps) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const lastRowRef = useCallback(
        (node: HTMLTableRowElement | null) => {
            if (!onLoadMore) return;
            if (observerRef.current) observerRef.current.disconnect();
            observerRef.current = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting && hasMore) onLoadMore();
            });
            if (node) observerRef.current.observe(node);
        },
        [hasMore, onLoadMore]
    );

    if (isLoading && entries.length === 0) {
        return (
            <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500 text-sm">
                Không có lịch sử xuất nhập kho
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm min-w-[720px]">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Thời gian</th>
                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Loại</th>
                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Vị trí</th>
                        <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Số lượng</th>
                        <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tồn sau</th>
                        <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Đơn giá</th>
                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ghi chú</th>
                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Người thực hiện</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {entries.map((entry, idx) => {
                        const isLast = idx === entries.length - 1;
                        const cfg = movementConfig[entry.movementType] ?? movementConfig.RECEIPT;
                        const Icon = cfg.icon;
                        const isIn = entry.qty > 0;

                        return (
                            <tr
                                key={entry._id}
                                ref={isLast ? lastRowRef : undefined}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <td className="py-2.5 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(entry.createdAt)}</td>
                                <td className="py-2.5 px-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                                        <Icon className="w-3 h-3" />
                                        {cfg.label}
                                    </span>
                                </td>
                                <td className="py-2.5 px-3 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{getLocation(entry)}</td>
                                <td className={`py-2.5 px-3 text-right font-semibold ${isIn ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                    {isIn ? "+" : ""}{entry.qty.toLocaleString("vi-VN")}
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                                    {entry.qtyBalance.toLocaleString("vi-VN")}
                                </td>
                                <td className="py-2.5 px-3 text-right text-xs text-slate-500 dark:text-slate-400">{formatCurrency(entry.unitCostCents)}</td>
                                <td className="py-2.5 px-3 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{entry.note ?? "—"}</td>
                                <td className="py-2.5 px-3 text-xs text-slate-500 dark:text-slate-400">{getCreatedBy(entry)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {isLoading && entries.length > 0 && (
                <div className="flex justify-center py-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
