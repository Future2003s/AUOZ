"use client";

import React from "react";
import { AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { MaterialRequirement } from "@/types/erp";

interface MaterialExplosionProps {
    requirements: MaterialRequirement[];
    isLoading?: boolean;
    totalCostCents?: number;
    hasShortage?: boolean;
}

function formatCurrency(cents: number): string {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cents / 100);
}

function formatQty(qty: number): string {
    return qty % 1 === 0 ? qty.toLocaleString("vi-VN") : qty.toFixed(3);
}

export function MaterialExplosion({
    requirements,
    isLoading = false,
    totalCostCents = 0,
    hasShortage = false,
}: MaterialExplosionProps) {
    if (isLoading) {
        return (
            <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (requirements.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500 text-sm">
                Không có dữ liệu vật tư
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header KPIs */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    {hasShortage ? (
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm font-semibold bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                            <AlertTriangle className="w-4 h-4" />
                            Thiếu vật tư
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                            Đủ vật tư
                        </div>
                    )}
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        {requirements.length} loại nguyên vật liệu
                    </span>
                </div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Tổng chi phí vật tư: {formatCurrency(totalCostCents)}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                            <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nguyên vật liệu</th>
                            <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mã SKU</th>
                            <th className="py-2.5 px-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">ĐVT</th>
                            <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SL cần</th>
                            <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tồn kho</th>
                            <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Thiếu</th>
                            <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Đơn giá</th>
                            <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Thành tiền</th>
                            <th className="py-2.5 px-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tình trạng</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {requirements.map((req) => {
                            const isShort = req.shortage > 0;
                            return (
                                <tr
                                    key={req.itemId}
                                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isShort ? "bg-red-50/40 dark:bg-red-900/10" : ""}`}
                                >
                                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{req.itemName}</td>
                                    <td className="py-2.5 px-3 text-xs font-mono text-slate-500 dark:text-slate-400">{req.sku ?? "—"}</td>
                                    <td className="py-2.5 px-3 text-center text-xs text-slate-500 dark:text-slate-400">{req.uomCode}</td>
                                    <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">{formatQty(req.totalQtyRequired)}</td>
                                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{formatQty(req.stockAvailable)}</td>
                                    <td className="py-2.5 px-3 text-right">
                                        {isShort ? (
                                            <span className="flex items-center justify-end gap-1 text-red-600 dark:text-red-400 font-semibold">
                                                <TrendingDown className="w-3.5 h-3.5" />
                                                {formatQty(req.shortage)}
                                            </span>
                                        ) : (
                                            <span className="text-emerald-600 dark:text-emerald-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(req.unitCostCents)}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(req.totalCostCents)}</td>
                                    <td className="py-2.5 px-3 text-center">
                                        {isShort ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                                <AlertTriangle className="w-3 h-3" /> Thiếu
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                <CheckCircle className="w-3 h-3" /> Đủ
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 font-semibold">
                            <td colSpan={7} className="py-2.5 px-3 text-sm text-right text-slate-600 dark:text-slate-300">Tổng cộng:</td>
                            <td className="py-2.5 px-3 text-right text-sm text-slate-800 dark:text-slate-100">
                                {formatCurrency(totalCostCents)}
                            </td>
                            <td />
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
