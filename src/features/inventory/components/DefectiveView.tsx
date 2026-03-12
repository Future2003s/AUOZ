'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle, CheckCircle, Wrench, Trash2, RotateCcw,
    Loader2, RefreshCw, Calendar, User, ChevronDown
} from 'lucide-react';
import {
    proxyGetDefectiveReports as getDefectiveReports,
    proxyResolveDefective as resolveDefective,
} from '@/apiRequests/inventoryProxy';
import type {
    DefectiveReportItem,
    DefectiveReportFilters,
    DefectiveResolution,
} from '@/apiRequests/inventory';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle },
    inspecting: { label: 'Đang kiểm tra', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Wrench },
    resolved: { label: 'Đã xử lý', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    destroyed: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200', icon: Trash2 },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
    low: { label: 'Thấp', color: 'bg-blue-50 text-blue-600' },
    medium: { label: 'TB', color: 'bg-yellow-50 text-yellow-600' },
    high: { label: 'Cao', color: 'bg-orange-50 text-orange-600' },
    critical: { label: 'Nghiêm trọng', color: 'bg-red-50 text-red-600' },
};

const RESOLUTION_OPTIONS: { value: DefectiveResolution; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'repaired', label: 'Sửa được → Về hàng tốt', icon: CheckCircle, color: 'text-green-600 hover:bg-green-50' },
    { value: 'destroyed', label: 'Hủy → Hàng hư hỏng', icon: Trash2, color: 'text-red-600 hover:bg-red-50' },
    { value: 'returned_to_supplier', label: 'Trả nhà cung cấp', icon: RotateCcw, color: 'text-blue-600 hover:bg-blue-50' },
];

export function DefectiveView() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('');
    const [resolveModalFor, setResolveModalFor] = useState<DefectiveReportItem | null>(null);
    const [resolveData, setResolveData] = useState<{ resolution: DefectiveResolution; qty: string; note: string }>({
        resolution: 'repaired', qty: '', note: '',
    });

    const filters: DefectiveReportFilters = {
        status: statusFilter || undefined,
        page: 1,
        limit: 100,
        sort: 'createdAt',
        order: 'desc',
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['defectiveReports', filters],
        queryFn: () => getDefectiveReports(filters),
    });

    const resolveMutation = useMutation({
        mutationFn: ({ reportId, data }: { reportId: string; data: { resolution: DefectiveResolution; resolvedQuantity: number; resolutionNote?: string } }) =>
            resolveDefective(reportId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['defectiveReports'] });
            queryClient.invalidateQueries({ queryKey: ['inventories'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryHistory'] });
            toast.success('Xử lý báo cáo thành công!');
            setResolveModalFor(null);
        },
        onError: (error: unknown) => {
            const anyErr = error as { payload?: { message?: string }; message?: string };
            toast.error(anyErr?.payload?.message || anyErr?.message || 'Lỗi khi xử lý');
        },
    });

    const reports: DefectiveReportItem[] = Array.isArray(data?.data) ? data!.data : [];

    const handleResolve = (e: React.FormEvent) => {
        e.preventDefault();
        if (!resolveModalFor) return;
        const qty = Number(resolveData.qty);
        if (!qty || qty <= 0 || qty > resolveModalFor.quantity) {
            toast.error('Số lượng không hợp lệ');
            return;
        }
        resolveMutation.mutate({
            reportId: resolveModalFor.id,
            data: {
                resolution: resolveData.resolution,
                resolvedQuantity: qty,
                resolutionNote: resolveData.note || undefined,
            },
        });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const getInventoryName = (inv: string | { id: string; name: string; location: string }) =>
        typeof inv === 'object' ? inv.name : 'N/A';

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <AlertTriangle className="w-6 h-6 mr-2 text-red-500" />
                    Quản lý hàng lỗi
                </h2>
                <div className="flex items-center space-x-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="inspecting">Đang kiểm tra</option>
                        <option value="resolved">Đã xử lý</option>
                        <option value="destroyed">Đã hủy</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-700 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Lỗi khi tải dữ liệu</h3>
                        <button
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['defectiveReports'] })}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                            <RefreshCw className="w-5 h-5" />
                            <span>Thử lại</span>
                        </button>
                    </div>
                </div>
            ) : reports.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Không có báo cáo hàng lỗi</h3>
                    <p className="text-slate-500">Tất cả sản phẩm đang trong tình trạng tốt.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reports.map((report) => {
                        const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
                        const severityCfg = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.medium;
                        const StatusIcon = statusCfg.icon;
                        const canResolve = report.status === 'pending' || report.status === 'inspecting';

                        return (
                            <div
                                key={report.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                <div className="p-4 sm:p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        {/* Left side */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${statusCfg.color}`}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {statusCfg.label}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${severityCfg.color}`}>
                                                    {severityCfg.label}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-1">
                                                {getInventoryName(report.inventoryId)}
                                            </h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{report.reason}</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {formatDate(report.createdAt)}
                                                </span>
                                                {report.reportedBy && (
                                                    <span className="flex items-center">
                                                        <User className="w-3 h-3 mr-1" />
                                                        {report.reportedBy.firstName} {report.reportedBy.lastName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right side */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{report.quantity}</div>
                                                <div className="text-xs text-slate-500">sản phẩm</div>
                                            </div>
                                            {canResolve && (
                                                <button
                                                    onClick={() => {
                                                        setResolveData({ resolution: 'repaired', qty: String(report.quantity), note: '' });
                                                        setResolveModalFor(report);
                                                    }}
                                                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                                                >
                                                    Xử lý
                                                </button>
                                            )}
                                            {report.resolution && (
                                                <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                    {report.resolution === 'repaired' ? '✅ Đã sửa' :
                                                        report.resolution === 'destroyed' ? '🗑️ Đã hủy' :
                                                            '↩️ Đã trả NCC'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Resolve Modal */}
            {resolveModalFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setResolveModalFor(null)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                            <h3 className="text-lg font-bold">Xử lý hàng lỗi</h3>
                            <p className="text-sm text-white/80">{getInventoryName(resolveModalFor.inventoryId)} — {resolveModalFor.quantity} SP</p>
                        </div>

                        <form onSubmit={handleResolve} className="p-6 space-y-4">
                            {/* Resolution type */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quyết định xử lý</label>
                                <div className="space-y-2">
                                    {RESOLUTION_OPTIONS.map((opt) => {
                                        const Icon = opt.icon;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setResolveData((p) => ({ ...p, resolution: opt.value }))}
                                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all text-sm ${resolveData.resolution === opt.value
                                                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-400/30'
                                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 ${opt.color.split(' ')[0]}`} />
                                                <span className="font-medium">{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Số lượng xử lý (tối đa: {resolveModalFor.quantity})
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={resolveModalFor.quantity}
                                    value={resolveData.qty}
                                    onChange={(e) => setResolveData((p) => ({ ...p, qty: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/30 text-sm"
                                    required
                                />
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ghi chú</label>
                                <textarea
                                    value={resolveData.note}
                                    onChange={(e) => setResolveData((p) => ({ ...p, note: e.target.value }))}
                                    placeholder="Ghi chú về quá trình xử lý..."
                                    rows={2}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/30 text-sm resize-none"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={() => setResolveModalFor(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={resolveMutation.isPending}
                                    className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-green-500/30 hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {resolveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    <span>{resolveMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
