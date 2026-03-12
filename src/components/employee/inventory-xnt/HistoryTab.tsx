"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Search, ArrowDownCircle, ArrowUpCircle, RefreshCw,
    AlertTriangle, RotateCcw, Loader2, Clock,
} from 'lucide-react';
import { proxyGetInventoryHistory as getInventoryHistory } from '@/apiRequests/inventoryProxy';
import type { InventoryHistoryItem, InventoryTransactionType } from '@/apiRequests/inventory';
import type { InventoryXNTItem } from './types';

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<InventoryTransactionType, { label: string; color: string; icon: React.ReactNode }> = {
    import: {
        label: 'Nhập kho',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        icon: <ArrowDownCircle className="w-3.5 h-3.5" />,
    },
    export: {
        label: 'Xuất kho',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        icon: <ArrowUpCircle className="w-3.5 h-3.5" />,
    },
    defective: {
        label: 'Hàng lỗi',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    return: {
        label: 'Trả hàng',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        icon: <RotateCcw className="w-3.5 h-3.5" />,
    },
    adjust: {
        label: 'Điều chỉnh',
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        icon: <RefreshCw className="w-3.5 h-3.5" />,
    },
    damaged: {
        label: 'Hư hỏng',
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    status_change: {
        label: 'Đổi trạng thái',
        color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
        icon: <RefreshCw className="w-3.5 h-3.5" />,
    },
    destroy: {
        label: 'Tiêu hủy',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
};

function formatDate(iso: string) {
    try {
        const d = new Date(iso);
        return d.toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface HistoryTabProps {
    items: InventoryXNTItem[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function HistoryTab({ items }: HistoryTabProps) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [productFilter, setProductFilter] = useState('');
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['inventory-history', search, typeFilter, productFilter, page],
        queryFn: () => getInventoryHistory({
            search: search || undefined,
            type: typeFilter || undefined,
            inventoryId: productFilter || undefined,
            page,
            limit,
            sort: 'createdAt',
            order: 'desc',
        }),
        staleTime: 60_000,
    });

    const history: InventoryHistoryItem[] = data?.data ?? [];
    const totalPages = (data?.pagination as any)?.totalPages || 1;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    return (
        <div className="space-y-4">
            {/* ── Filters ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Tìm theo sản phẩm, đối tác, lý do..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    />
                </div>

                {/* Type filter */}
                <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                >
                    <option value="">Tất cả loại GD</option>
                    {(Object.keys(TYPE_LABELS) as InventoryTransactionType[]).map(t => (
                        <option key={t} value={t}>{TYPE_LABELS[t].label}</option>
                    ))}
                </select>

                {/* Product filter */}
                <select
                    value={productFilter}
                    onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                >
                    <option value="">Tất cả sản phẩm</option>
                    {items.map(i => (
                        <option key={i.id} value={i.id}>[{i.sku}] {i.name}</option>
                    ))}
                </select>

                {/* Refresh */}
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* ── Table ── */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Đang tải lịch sử...</span>
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                        <AlertTriangle className="w-7 h-7 text-red-400" />
                        <p className="text-sm">Lỗi tải lịch sử</p>
                        <button onClick={() => refetch()} className="text-xs text-indigo-500 underline">Thử lại</button>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                        <Clock className="w-8 h-8 opacity-40" />
                        <p className="text-sm">Chưa có lịch sử giao dịch</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Thời gian</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Loại GD</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sản phẩm</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SL</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tồn trước</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tồn sau</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Đối tác</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {history.map((h) => {
                                    const td = TYPE_LABELS[h.type] ?? { label: h.type, color: 'bg-slate-100 text-slate-600', icon: null };
                                    return (
                                        <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {formatDate(h.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${td.color}`}>
                                                    {td.icon}
                                                    {td.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                                                {h.itemName}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                                                {h.amount.toLocaleString('vi-VN')}
                                                <span className="ml-1 text-xs text-slate-400 font-normal">{h.unit}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                                                {h.balanceBefore !== undefined ? h.balanceBefore.toLocaleString('vi-VN') : '–'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200 font-medium">
                                                {h.balanceAfter !== undefined ? h.balanceAfter.toLocaleString('vi-VN') : '–'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                                                {h.partner || '–'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[160px] truncate">
                                                {h.reason || '–'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                    >
                        ← Trước
                    </button>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        Trang {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                    >
                        Tiếp →
                    </button>
                </div>
            )}
        </div>
    );
}
