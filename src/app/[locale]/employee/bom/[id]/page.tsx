"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { GitBranch, List, ArrowLeft, ToggleLeft, Tags } from "lucide-react";
import { getBom, getBomTree } from "@/apiRequests/bom";
import { BOMTreeViewer } from "@/components/erp/BOMTreeViewer";
import { BomHeader, BomNode } from "@/types/erp";

export default function BomDetailPage() {
    const { id } = useParams<{ id: string }>();

    const { data: bomData, isLoading: bomLoading } = useQuery({
        queryKey: ["bom", id],
        queryFn: () => getBom(id!),
        enabled: !!id,
    });

    const { data: treeData, isLoading: treeLoading } = useQuery({
        queryKey: ["bom-tree", id],
        queryFn: () => getBomTree(id!),
        enabled: !!id,
    });

    const bom = bomData?.data as BomHeader | undefined;
    const product = typeof bom?.productId === "object" ? bom.productId : null;
    const nodes = (treeData?.data ?? []) as BomNode[];
    const totalCost = nodes.reduce((s, n) => s + n.totalCostCents, 0);

    if (bomLoading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-48 animate-pulse" />
                <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            </div>
        );
    }

    if (!bom) {
        return (
            <div className="p-6 text-slate-500 dark:text-slate-400 text-sm">BOM không tìm thấy.</div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Link href="../bom" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Danh sách BOM
                </Link>
                <span>/</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{bom.bomNo}</span>
            </div>

            {/* Header card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-blue-200 text-xs font-medium mb-1 font-mono">{bom.bomNo} · v{bom.version}</p>
                        <h1 className="text-xl font-bold">{product?.name ?? "—"}</h1>
                        {product?.sku && <p className="text-blue-200 text-sm mt-0.5">{product.sku}</p>}
                        {bom.description && <p className="text-blue-100 text-sm mt-2 max-w-lg">{bom.description}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
                            {bom.status}
                        </span>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-500/50 grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-blue-200 text-xs">SL đầu ra</p>
                        <p className="text-white font-semibold">{bom.outputQty} {typeof bom.outputUomId === "object" ? bom.outputUomId?.code : ""}</p>
                    </div>
                    <div>
                        <p className="text-blue-200 text-xs">Chi phí NVL</p>
                        <p className="text-white font-semibold">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalCost / 100)}</p>
                    </div>
                    <div>
                        <p className="text-blue-200 text-xs">Ngày tạo</p>
                        <p className="text-white font-semibold">{new Date(bom.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-3 flex-wrap">
                <Link
                    href={`../bom/${id}/explosion`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm font-medium transition-colors"
                >
                    <List className="w-4 h-4" /> Nổ chi tiết (Flat)
                </Link>
                <Link
                    href={`../bom/${id}?tab=changelog`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                    <ToggleLeft className="w-4 h-4" /> Lịch sử thay đổi
                </Link>
                <Link
                    href={`/employee/inventory?whereUsed=${product?._id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                    <Tags className="w-4 h-4" /> Where-used
                </Link>
            </div>

            {/* BOM Tree */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
                    <GitBranch className="w-4 h-4 text-blue-500" />
                    Cấu trúc BOM
                </h2>
                <BOMTreeViewer
                    bomId={id!}
                    nodes={nodes}
                    isLoading={treeLoading}
                />
            </div>
        </div>
    );
}
