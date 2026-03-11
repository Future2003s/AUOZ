"use client";

import { useQuery } from "@tanstack/react-query";
import { getLowStock } from "@/apiRequests/stock";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingDown, Package, AlertTriangle, Activity } from "lucide-react";
import { LowStockAlert } from "@/types/erp";

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];

export default function ReportsPage() {
    const { data: lowStockData, isLoading } = useQuery({
        queryKey: ["low-stock-report"],
        queryFn: getLowStock,
    });

    const lowStock = (lowStockData?.data ?? []) as LowStockAlert[];
    const criticalOut = lowStock.filter((i) => i.qtyAvailable <= 0);
    const criticalLow = lowStock.filter((i) => i.qtyAvailable > 0 && i.qtyAvailable < i.minStock);

    const pieData = [
        { name: "Hết hàng", value: criticalOut.length },
        { name: "Sắp hết", value: criticalLow.length },
    ].filter((d) => d.value > 0);

    const barData = lowStock.slice(0, 10).map((item) => ({
        name: item.name.length > 18 ? item.name.substring(0, 16) + "…" : item.name,
        minStock: item.minStock,
        available: item.qtyAvailable,
    }));

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Báo cáo & Phân tích
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Tổng quan tồn kho và mua hàng</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Hàng hết kho", value: criticalOut.length, icon: Package, color: "from-red-500 to-red-600" },
                    { label: "Hàng sắp hết", value: criticalLow.length, icon: AlertTriangle, color: "from-amber-500 to-orange-500" },
                    { label: "Tổng cảnh báo", value: lowStock.length, icon: TrendingDown, color: "from-violet-500 to-purple-600" },
                ].map(({ label, value, icon: Icon, color }, i) => (
                    <div key={i} className={`rounded-2xl bg-gradient-to-br ${color} p-5 text-white`}>
                        <Icon className="w-5 h-5 opacity-80 mb-2" />
                        <p className="text-3xl font-bold">{value}</p>
                        <p className="text-white/80 text-xs mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Tồn kho vs Mức tối thiểu</h2>
                    {isLoading ? (
                        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ) : barData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Không có cảnh báo</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-30} textAnchor="end" />
                                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: 8, fontSize: 11 }} />
                                <Bar dataKey="minStock" name="Mức tối thiểu" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="available" name="Khả dụng" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Phân loại cảnh báo</h2>
                    {isLoading ? (
                        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ) : pieData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">✅ Tồn kho ổn định</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={75} fontSize={10}>
                                    {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                </Pie>
                                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: 8, fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Low stock table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Hàng cần nhập gấp
                    </h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                            {["Mặt hàng", "SKU", "Tối thiểu", "Khả dụng", "Cần nhập", "Tình trạng"].map((h) => (
                                <th key={h} className={`py-2.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase ${h === "Mặt hàng" || h === "SKU" ? "text-left" : h === "Tình trạng" ? "text-center" : "text-right"}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>{Array.from({ length: 6 }).map((__, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></td>)}</tr>
                            ))
                        ) : lowStock.length === 0 ? (
                            <tr><td colSpan={6} className="py-12 text-center text-slate-400">✅ Không có hàng cần cảnh báo</td></tr>
                        ) : lowStock.map((item) => {
                            const isOut = item.qtyAvailable <= 0;
                            return (
                                <tr key={item.itemId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isOut ? "bg-red-50/40 dark:bg-red-900/10" : ""}`}>
                                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-100">{item.name}</td>
                                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.sku ?? "—"}</td>
                                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">{item.minStock.toLocaleString("vi-VN")}</td>
                                    <td className={`py-3 px-4 text-right font-semibold ${isOut ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>{item.qtyAvailable.toLocaleString("vi-VN")}</td>
                                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-200 font-medium">{Math.max(0, item.minStock - item.qtyAvailable).toLocaleString("vi-VN")}</td>
                                    <td className="py-3 px-4 text-center">
                                        {isOut ? (
                                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded-full text-xs font-medium">
                                                <Package className="w-3 h-3" /> Hết hàng
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full text-xs font-medium">
                                                <AlertTriangle className="w-3 h-3" /> Sắp hết
                                            </span>
                                        )}
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
