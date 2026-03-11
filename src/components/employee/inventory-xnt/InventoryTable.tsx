"use client";

import React, { useState } from 'react';
import { Edit2, Trash2, Eye, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { InventoryXNTItem, StatusType } from './types';
import { STATUS_LABELS, STATUS_COLORS } from './types';

interface InventoryTableProps {
    items: InventoryXNTItem[];
    onEdit: (item: InventoryXNTItem) => void;
    onDelete: (item: InventoryXNTItem) => void;
    onView: (item: InventoryXNTItem) => void;
    onAddTransaction: (item: InventoryXNTItem) => void;
}

type SortKey = 'name' | 'openingStock' | 'totalImport' | 'totalExport' | 'closingStock';
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string; align?: string }[] = [
    { key: 'name', label: 'Tên Sản phẩm' },
    { key: 'openingStock', label: 'Tồn đầu kỳ', align: 'text-right' },
    { key: 'totalImport', label: 'Tổng nhập', align: 'text-right' },
    { key: 'totalExport', label: 'Tổng xuất', align: 'text-right' },
    { key: 'closingStock', label: 'Tồn cuối kỳ', align: 'text-right' },
];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />;
    return dir === 'asc'
        ? <ChevronUp className="w-3.5 h-3.5 text-indigo-500 ml-1 shrink-0" />
        : <ChevronDown className="w-3.5 h-3.5 text-indigo-500 ml-1 shrink-0" />;
}

function StatusBadge({ status }: { status: StatusType }) {
    const { badge, dot } = STATUS_COLORS[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {STATUS_LABELS[status]}
        </span>
    );
}

/** Ảnh thumbnail mock — SVG placeholder sinh màu từ sku */
function Thumbnail({ sku, name }: { sku: string; name: string }) {
    const colors = [
        ['#f59e0b', '#d97706'],
        ['#10b981', '#059669'],
        ['#6366f1', '#4f46e5'],
        ['#ef4444', '#dc2626'],
        ['#8b5cf6', '#7c3aed'],
        ['#0ea5e9', '#0284c7'],
        ['#f97316', '#ea580c'],
    ];
    // Pick color based on first char of SKU code
    const idx = sku.charCodeAt(0) % colors.length;
    const [from, to] = colors[idx];
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    return (
        <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
            title={name}
        >
            {initials}
        </div>
    );
}

export function InventoryTable({ items, onEdit, onDelete, onView, onAddTransaction }: InventoryTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sorted = [...items].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === 'string' && typeof bv === 'string') {
            return sortDir === 'asc' ? av.localeCompare(bv, 'vi') : bv.localeCompare(av, 'vi');
        }
        const an = av as number;
        const bn = bv as number;
        return sortDir === 'asc' ? an - bn : bn - an;
    });

    if (items.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Không tìm thấy sản phẩm</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Thử thay đổi từ khoá tìm kiếm hoặc bộ lọc.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    {/* THEAD */}
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12">
                                STT
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Mã SP
                            </th>
                            {COLUMNS.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className={`px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${col.align ?? 'text-left'}`}
                                >
                                    <span className="inline-flex items-center">
                                        {col.label}
                                        <SortIcon active={sortKey === col.key} dir={sortDir} />
                                    </span>
                                </th>
                            ))}
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                    </thead>

                    {/* TBODY */}
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {sorted.map((item, idx) => (
                            <tr
                                key={item.id}
                                className="group hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors duration-150"
                            >
                                {/* STT */}
                                <td className="px-4 py-3.5 text-sm text-slate-400 dark:text-slate-500 font-mono">
                                    {String(idx + 1).padStart(2, '0')}
                                </td>

                                {/* SKU */}
                                <td className="px-4 py-3.5">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                                        {item.sku}
                                    </span>
                                </td>

                                {/* Tên + Thumbnail */}
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <Thumbnail sku={item.sku} name={item.name} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                                                {item.name}
                                            </p>
                                            {item.category && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{item.category}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Tồn đầu kỳ */}
                                <td className="px-4 py-3.5 text-right">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {item.openingStock.toLocaleString('vi-VN')}
                                    </span>
                                    <span className="ml-1 text-xs text-slate-400">{item.unit}</span>
                                </td>

                                {/* Tổng nhập */}
                                <td className="px-4 py-3.5 text-right">
                                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        +{item.totalImport.toLocaleString('vi-VN')}
                                        <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                                    </span>
                                </td>

                                {/* Tổng xuất */}
                                <td className="px-4 py-3.5 text-right">
                                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                                        -{item.totalExport.toLocaleString('vi-VN')}
                                        <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                                    </span>
                                </td>

                                {/* Tồn cuối kỳ */}
                                <td className="px-4 py-3.5 text-right">
                                    <span
                                        className={`text-sm font-bold ${item.closingStock <= 0
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : item.status === 'sap_het'
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-slate-800 dark:text-slate-100'
                                            }`}
                                    >
                                        {item.closingStock.toLocaleString('vi-VN')}
                                    </span>
                                    <span className="ml-1 text-xs text-slate-400">{item.unit}</span>
                                </td>

                                {/* Trạng thái */}
                                <td className="px-4 py-3.5">
                                    <StatusBadge status={item.status} />
                                </td>

                                {/* Thao tác */}
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center justify-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                        {/* Nhập/Xuất */}
                                        <button
                                            onClick={() => onAddTransaction(item)}
                                            title="Thêm giao dịch nhập/xuất"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h14M13 6l4 4-4 4M7 14l-4-4 4-4" />
                                            </svg>
                                        </button>

                                        {/* Xem chi tiết */}
                                        <button
                                            onClick={() => onView(item)}
                                            title="Xem chi tiết"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        {/* Sửa */}
                                        <button
                                            onClick={() => onEdit(item)}
                                            title="Chỉnh sửa"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>

                                        {/* Xóa */}
                                        <button
                                            onClick={() => onDelete(item)}
                                            title="Xóa"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 text-xs text-slate-500 dark:text-slate-400">
                Hiển thị <span className="font-semibold text-slate-700 dark:text-slate-300">{items.length}</span> mặt hàng
            </div>
        </div>
    );
}
