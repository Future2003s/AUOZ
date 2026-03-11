"use client";

import React from 'react';
import { Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import type { InventoryXNTItem } from './types';

interface SummaryCardsProps {
    items: InventoryXNTItem[];
}

interface CardConfig {
    label: string;
    value: number | string;
    sub?: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    borderColor: string;
    valueCls?: string;
}

export function SummaryCards({ items }: SummaryCardsProps) {
    const totalItems = items.length;
    const totalImport = items.reduce((s, i) => s + i.totalImport, 0);
    const totalExport = items.reduce((s, i) => s + i.totalExport, 0);
    const warningCount = items.filter((i) => i.status !== 'on_dinh').length;

    const cards: CardConfig[] = [
        {
            label: 'Tổng số mặt hàng',
            value: totalItems,
            sub: 'Sản phẩm đang quản lý',
            icon: Package,
            iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            borderColor: 'border-l-indigo-500',
        },
        {
            label: 'Tổng nhập tháng này',
            value: totalImport.toLocaleString('vi-VN'),
            sub: 'Lượng hàng đã nhập kho',
            icon: ArrowDownCircle,
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            borderColor: 'border-l-emerald-500',
            valueCls: 'text-emerald-700 dark:text-emerald-300',
        },
        {
            label: 'Tổng xuất tháng này',
            value: totalExport.toLocaleString('vi-VN'),
            sub: 'Lượng hàng đã xuất kho',
            icon: ArrowUpCircle,
            iconBg: 'bg-blue-100 dark:bg-blue-900/40',
            iconColor: 'text-blue-600 dark:text-blue-400',
            borderColor: 'border-l-blue-500',
            valueCls: 'text-blue-700 dark:text-blue-300',
        },
        {
            label: 'Cảnh báo tồn kho',
            value: warningCount,
            sub: 'Mặt hàng cần chú ý',
            icon: AlertTriangle,
            iconBg: 'bg-red-100 dark:bg-red-900/40',
            iconColor: 'text-red-600 dark:text-red-400',
            borderColor: 'border-l-red-500',
            valueCls: warningCount > 0 ? 'text-red-600 dark:text-red-400' : undefined,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.label}
                        className={`relative bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 border-l-4 ${card.borderColor} shadow-sm hover:shadow-md transition-all duration-200 p-5 flex items-center gap-4`}
                    >
                        {/* Icon */}
                        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                            <Icon className={`w-6 h-6 ${card.iconColor}`} />
                        </div>
                        {/* Text */}
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                                {card.label}
                            </p>
                            <p className={`text-2xl font-bold mt-0.5 ${card.valueCls ?? 'text-slate-900 dark:text-white'}`}>
                                {card.value}
                            </p>
                            {card.sub && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{card.sub}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
