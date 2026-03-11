"use client";

import React, { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, Package, AlertTriangle, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { BomNode } from "@/types/erp";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cents / 100);
}

function formatQty(qty: number): string {
    return qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(3);
}

// ─── Stock Status Badge ───────────────────────────────────────────────────────

const stockStatusConfig = {
    OK: {
        label: "Đủ hàng",
        icon: CheckCircle,
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        rowBg: "",
    },
    LOW: {
        label: "Sắp hết",
        icon: AlertTriangle,
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        rowBg: "bg-amber-50/50 dark:bg-amber-900/10",
    },
    OUT: {
        label: "Hết hàng",
        icon: XCircle,
        className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
        rowBg: "bg-red-50/50 dark:bg-red-900/10",
    },
};

// ─── Individual BOM Row ───────────────────────────────────────────────────────

interface BomRowProps {
    node: BomNode;
    depth: number;
    onItemClick?: (itemId: string) => void;
    isExpanded: boolean;
    onToggle: (id: string) => void;
    expandedIds: Set<string>;
}

function BomRow({ node, depth, onItemClick, isExpanded, onToggle, expandedIds }: BomRowProps) {
    const hasChildren = node.children.length > 0;
    const config = stockStatusConfig[node.stockStatus];
    const StatusIcon = config.icon;
    const scrapPctDisplay = node.scrapPct > 0 ? `+${(node.scrapPct * 100).toFixed(1)}%` : null;

    return (
        <>
            <tr
                className={`border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${config.rowBg}`}
            >
                {/* Indent + expand/collapse */}
                <td className="py-2 px-3 text-sm">
                    <div
                        className="flex items-center gap-1"
                        style={{ paddingLeft: `${depth * 20}px` }}
                    >
                        {hasChildren ? (
                            <button
                                onClick={() => onToggle(node.id)}
                                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>
                        ) : (
                            <span className="w-5 h-5 flex items-center justify-center">
                                <Package className="w-3.5 h-3.5 text-slate-400" />
                            </span>
                        )}
                        <button
                            onClick={() => onItemClick?.(node.itemId)}
                            className="text-left font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
                        >
                            {node.itemName}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </button>
                    </div>
                </td>

                <td className="py-2 px-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {node.sku ?? "—"}
                </td>
                <td className="py-2 px-3 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                    L{node.level}
                </td>
                <td className="py-2 px-3 text-right text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{formatQty(node.qty)}</span>
                    {scrapPctDisplay && (
                        <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
                            ({scrapPctDisplay})
                        </span>
                    )}
                </td>
                <td className="py-2 px-3 text-center text-xs text-slate-500 dark:text-slate-400">{node.uomCode}</td>
                <td className="py-2 px-3 text-right text-sm text-slate-700 dark:text-slate-300">
                    {formatQty(node.effectiveQty)}
                </td>
                <td className="py-2 px-3 text-right text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{formatCurrency(node.unitCostCents)}</span>
                </td>
                <td className="py-2 px-3 text-right text-sm font-semibold">
                    <span className="text-slate-800 dark:text-slate-100">{formatCurrency(node.totalCostCents)}</span>
                </td>
                <td className="py-2 px-3 text-right text-sm text-slate-600 dark:text-slate-300">
                    {formatQty(node.stockAvailable)}
                </td>
                <td className="py-2 px-3">
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
                    >
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                    </span>
                </td>
            </tr>
            {/* Render children recursively if expanded */}
            {hasChildren && isExpanded &&
                node.children.map((child) => (
                    <BomRow
                        key={child.id}
                        node={child}
                        depth={depth + 1}
                        onItemClick={onItemClick}
                        isExpanded={expandedIds.has(child.id)}
                        onToggle={onToggle}
                        expandedIds={expandedIds}
                    />
                ))}
        </>
    );
}

// ─── BOM Tree Viewer ─────────────────────────────────────────────────────────

interface BOMTreeViewerProps {
    bomId: string;
    nodes: BomNode[];
    isLoading?: boolean;
    onItemClick?: (itemId: string) => void;
}

export function BOMTreeViewer({ bomId, nodes, isLoading = false, onItemClick }: BOMTreeViewerProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        // Auto-expand first level on mount
        const ids = new Set<string>();
        nodes.forEach((n) => ids.add(n.id));
        return ids;
    });

    const toggleNode = useCallback((id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        const allIds = new Set<string>();
        const collect = (nodeList: BomNode[]) => {
            nodeList.forEach((n) => {
                allIds.add(n.id);
                if (n.children.length > 0) collect(n.children);
            });
        };
        collect(nodes);
        setExpandedIds(allIds);
    }, [nodes]);

    const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

    const exportCSV = useCallback(() => {
        const rows: string[][] = [
            ["Level", "Item Name", "SKU", "Qty", "UOM", "Effective Qty", "Unit Cost (VND)", "Total Cost (VND)", "Stock Available", "Status"],
        ];
        const flatten = (nodeList: BomNode[]) => {
            nodeList.forEach((n) => {
                rows.push([
                    String(n.level),
                    n.itemName,
                    n.sku ?? "",
                    formatQty(n.qty),
                    n.uomCode,
                    formatQty(n.effectiveQty),
                    String(n.unitCostCents / 100),
                    String(n.totalCostCents / 100),
                    formatQty(n.stockAvailable),
                    n.stockStatus,
                ]);
                if (n.children.length > 0) flatten(n.children);
            });
        };
        flatten(nodes);
        const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BOM-${bomId}-tree.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [nodes, bomId]);

    const totalCost = nodes.reduce((s, n) => s + n.totalCostCents, 0);
    const hasShortage = nodes.some((n) => n.stockStatus !== "OK");

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500">
                <Package className="w-12 h-12 mb-2" />
                <p className="text-sm">BOM chưa có thành phần</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    {hasShortage && (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-sm font-medium">
                            <AlertTriangle className="w-4 h-4" />
                            Thiếu vật tư
                        </div>
                    )}
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Tổng chi phí vật tư:{" "}
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(totalCost)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={expandAll}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        Mở rộng tất cả
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        Thu gọn
                    </button>
                    <button
                        onClick={exportCSV}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-colors"
                    >
                        Xuất CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm min-w-[900px]">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                            <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Thành phần
                            </th>
                            <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Mã SKU
                            </th>
                            <th className="py-2.5 px-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Cấp
                            </th>
                            <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                SL
                            </th>
                            <th className="py-2.5 px-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                ĐVT
                            </th>
                            <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                SL Hiệu dụng
                            </th>
                            <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Đơn giá
                            </th>
                            <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Thành tiền
                            </th>
                            <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Tồn kho
                            </th>
                            <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Tình trạng
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-transparent">
                        {nodes.map((node) => (
                            <BomRow
                                key={node.id}
                                node={node}
                                depth={0}
                                onItemClick={onItemClick}
                                isExpanded={expandedIds.has(node.id)}
                                onToggle={toggleNode}
                                expandedIds={expandedIds}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                {(Object.entries(stockStatusConfig) as [keyof typeof stockStatusConfig, typeof stockStatusConfig[keyof typeof stockStatusConfig]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                        <span key={key} className="flex items-center gap-1">
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                        </span>
                    );
                })}
                <span className="ml-auto italic">Hệ số hao hụt (%) được hiển thị sau số lượng</span>
            </div>
        </div>
    );
}
