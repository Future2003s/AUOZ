"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { getBomExplosion } from "@/apiRequests/bom";
import { MaterialExplosion } from "@/components/erp/MaterialExplosion";
import { MaterialRequirement } from "@/types/erp";

export default function BomExplosionPage() {
    const { id } = useParams<{ id: string }>();
    const [qty, setQty] = useState(1);
    const [inputQty, setInputQty] = useState("1");

    const { data, isLoading } = useQuery({
        queryKey: ["bom-explosion", id, qty],
        queryFn: () => getBomExplosion(id!, qty),
        enabled: !!id,
    });

    const requirements = (data?.data ?? []) as MaterialRequirement[];
    const meta = data?.meta as { totalCostCents?: number; hasShortage?: boolean } | null;

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Link href={`../bom/${id}`} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Chi tiết BOM
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-blue-500" /> Nổ chi tiết
                    </span>
                </div>

                {/* Qty selector */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 dark:text-slate-300">SL sản xuất:</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={inputQty}
                        onChange={(e) => setInputQty(e.target.value)}
                        className="w-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={() => {
                            const v = parseFloat(inputQty);
                            if (!isNaN(v) && v > 0) setQty(v);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    >
                        Tính
                    </button>
                </div>
            </div>

            {/* Explosion table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                <MaterialExplosion
                    requirements={requirements}
                    isLoading={isLoading}
                    totalCostCents={meta?.totalCostCents ?? 0}
                    hasShortage={meta?.hasShortage ?? false}
                />
            </div>
        </div>
    );
}
