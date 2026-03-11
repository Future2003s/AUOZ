"use client";

import React from "react";
import { TrendingDown, TrendingUp, Minus, Warehouse, AlertTriangle } from "lucide-react";
import { StockSummary } from "@/types/erp";

interface StockCardProps {
    stock: StockSummary | null;
    isLoading?: boolean;
    minStock?: number;
}

function formatQty(qty: number): string {
    return qty % 1 === 0 ? qty.toLocaleString("vi-VN") : qty.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

function formatCurrency(cents: number): string {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cents / 100);
}

export function StockCard({ stock, isLoading = false, minStock }: StockCardProps) {
    if (isLoading) {
        return (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-3" />
                <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!stock) {
        return (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm">
                <Warehouse className="w-4 h-4" />
                Không có dữ liệu tồn kho
            </div>
        );
    }

    const isLow = minStock !== undefined && stock.totalAvailable < minStock;
    const isOut = stock.totalAvailable <= 0;

    return (
        <div className={`rounded-xl border p-4 bg-white dark:bg-slate-900 space-y-4 ${isOut ? "border-red-300 dark:border-red-800" : isLow ? "border-amber-300 dark:border-amber-800" : "border-slate-200 dark:border-slate-700"}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-slate-400" />
                    Tồn kho hiện tại
                </h3>
                {isOut ? (
                    <span className="text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Hết hàng
                    </span>
                ) : isLow ? (
                    <span className="text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Sắp hết
                    </span>
                ) : null}
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tồn kho</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatQty(stock.totalOnHand)}</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Đặt trước</p>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatQty(stock.totalReserved)}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${isOut ? "bg-red-50 dark:bg-red-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}`}>
                    <p className={`text-xs mb-1 ${isOut ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>Khả dụng</p>
                    <p className={`text-lg font-bold ${isOut ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                        {formatQty(stock.totalAvailable)}
                    </p>
                </div>
            </div>

            {/* Valuation */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Giá vốn trung bình: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(stock.avgCostCents)}</span></span>
                <span>Tổng giá trị: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(stock.totalValueCents)}</span></span>
            </div>

            {/* By location */}
            {stock.byLocation.length > 1 && (
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Theo vị trí:</p>
                    {stock.byLocation.map((loc, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-300 truncate">{loc.locationId}</span>
                            <div className="flex gap-3 shrink-0">
                                <span className="flex items-center gap-1 text-slate-500">
                                    <TrendingUp className="w-3 h-3 text-emerald-500" /> {formatQty(loc.onHand)}
                                </span>
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                    <Minus className="w-3 h-3" /> {formatQty(loc.reserved)}
                                </span>
                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                    <TrendingDown className="w-3 h-3" /> {formatQty(loc.available)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
