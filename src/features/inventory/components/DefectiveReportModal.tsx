'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle, Camera, Loader2 } from 'lucide-react';
import { proxyReportDefective as reportDefective } from '@/apiRequests/inventoryProxy';
import type { InventoryItem, DefectiveSeverity } from '@/apiRequests/inventory';
import { toast } from 'sonner';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
};

const SEVERITY_OPTIONS: { value: DefectiveSeverity; label: string; color: string }[] = [
    { value: 'low', label: 'Thấp', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'medium', label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'high', label: 'Cao', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'critical', label: 'Nghiêm trọng', color: 'bg-red-100 text-red-700 border-red-200' },
];

export function DefectiveReportModal({ isOpen, onClose, item }: Props) {
    const queryClient = useQueryClient();
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [severity, setSeverity] = useState<DefectiveSeverity>('medium');

    const mutation = useMutation({
        mutationFn: (data: { id: string; quantity: number; reason: string; severity: DefectiveSeverity }) =>
            reportDefective(data.id, { quantity: data.quantity, reason: data.reason, severity: data.severity }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventories'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryHistory'] });
            queryClient.invalidateQueries({ queryKey: ['defectiveReports'] });
            toast.success('Báo hàng lỗi thành công!', {
                description: `Đã chuyển ${quantity} ${item?.unit || 'lọ'} sang trạng thái chờ kiểm tra.`,
                duration: 3000,
            });
            handleClose();
        },
        onError: (error: unknown) => {
            const anyErr = error as { payload?: { message?: string }; message?: string };
            const message = anyErr?.payload?.message || anyErr?.message || 'Có lỗi xảy ra';
            toast.error('Lỗi khi báo hàng lỗi', { description: message, duration: 4000 });
        },
    });

    const handleClose = () => {
        setQuantity('');
        setReason('');
        setSeverity('medium');
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;

        const qty = Number(quantity);
        if (!qty || qty <= 0) {
            toast.error('Số lượng không hợp lệ');
            return;
        }
        if (qty > item.quantity) {
            toast.error('Số lượng vượt quá tồn kho hàng tốt', {
                description: `Hiện tại chỉ có ${item.quantity} ${item.unit} hàng tốt.`,
            });
            return;
        }
        if (!reason.trim()) {
            toast.error('Vui lòng nhập lý do');
            return;
        }

        mutation.mutate({ id: item.id, quantity: qty, reason: reason.trim(), severity });
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-6 h-6" />
                        <div>
                            <h3 className="text-lg font-bold">Báo hàng lỗi</h3>
                            <p className="text-sm text-white/80">{item.name}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Info bar */}
                <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200/50 dark:border-amber-800/50">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-700 dark:text-amber-300">Tồn kho hàng tốt hiện tại:</span>
                        <span className="font-bold text-amber-800 dark:text-amber-200">{item.quantity} {item.unit}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Số lượng hàng lỗi *
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Nhập số lượng..."
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all text-sm"
                            required
                        />
                    </div>

                    {/* Severity */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Mức độ nghiêm trọng
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {SEVERITY_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setSeverity(opt.value)}
                                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${severity === opt.value
                                            ? `${opt.color} ring-2 ring-offset-1 ring-current shadow-sm`
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Lý do *
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Mô tả chi tiết lỗi: nắp vỡ, tem mờ, chất lượng không đạt..."
                            rows={3}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all text-sm resize-none"
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-red-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <AlertTriangle className="w-4 h-4" />
                            )}
                            <span>{mutation.isPending ? 'Đang xử lý...' : 'Báo hàng lỗi'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
