"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import type { InventoryXNTItem } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransactionRow {
    inventoryId: string;
    inventoryName: string;
    quantity: string;
}

export interface BatchTransactionFormState {
    type: 'import' | 'export';
    rows: TransactionRow[];
    partner: string;
    note: string;
}

export const EMPTY_ROW: TransactionRow = {
    inventoryId: '',
    inventoryName: '',
    quantity: '',
};

export const EMPTY_BATCH_FORM: BatchTransactionFormState = {
    type: 'import',
    rows: [{ ...EMPTY_ROW }],
    partner: '',
    note: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    form: BatchTransactionFormState;
    onChange: (patch: Partial<BatchTransactionFormState>) => void;
    onSubmit: (e: React.FormEvent) => void;
    isSaving: boolean;
    items: InventoryXNTItem[];
}

export function TransactionModal({
    isOpen, onClose, form, onChange, onSubmit, isSaving, items,
}: TransactionModalProps) {
    const firstSelectRef = useRef<HTMLSelectElement>(null);
    const [sharedQty, setSharedQty] = React.useState('');

    useEffect(() => {
        if (isOpen) {
            setSharedQty('');
            setTimeout(() => firstSelectRef.current?.focus(), 80);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const updateRow = useCallback((idx: number, patch: Partial<TransactionRow>) => {
        const rows = form.rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
        onChange({ rows });
    }, [form.rows, onChange]);

    const addRow = useCallback(() => {
        onChange({ rows: [...form.rows, { ...EMPTY_ROW, quantity: sharedQty }] });
    }, [form.rows, onChange, sharedQty]);

    const applySharedQty = useCallback((qty: string) => {
        setSharedQty(qty);
        onChange({ rows: form.rows.map(r => ({ ...r, quantity: qty })) });
    }, [form.rows, onChange]);

    const removeRow = useCallback((idx: number) => {
        if (form.rows.length <= 1) return;
        onChange({ rows: form.rows.filter((_, i) => i !== idx) });
    }, [form.rows, onChange]);

    const isValid = form.rows.every(r => r.inventoryId && Number(r.quantity) > 0);
    const isImport = form.type === 'import';

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label="Thêm giao dịch Nhập / Xuất kho"
        >
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thêm giao dịch mới</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Nhập hoặc Xuất nhiều sản phẩm cùng lúc
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Form */}
                <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                        {/* Type toggle */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Loại giao dịch</label>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { value: 'import', label: 'Nhập kho', icon: ArrowDownCircle, activeClass: 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' },
                                    { value: 'export', label: 'Xuất kho', icon: ArrowUpCircle, activeClass: 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' },
                                ] as const).map(({ value, label, icon: Icon, activeClass }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => onChange({ type: value })}
                                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-150 ${form.type === value
                                            ? activeClass
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product rows */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Danh sách sản phẩm <span className="text-red-500">*</span>
                                </label>
                                <span className="text-xs text-slate-400">{form.rows.length} sản phẩm</span>
                            </div>

                            {/* ── Shared quantity shortcut ── */}
                            <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Số lượng chung:</span>
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    placeholder="Nhập để áp dụng cho tất cả..."
                                    value={sharedQty}
                                    onChange={(e) => applySharedQty(e.target.value)}
                                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                />
                                {sharedQty && (
                                    <span className="text-xs text-indigo-500 font-medium whitespace-nowrap">✓ Đã áp dụng</span>
                                )}
                            </div>

                            <div className="space-y-2">
                                {/* Column headers */}
                                <div className="grid grid-cols-[1fr_120px_36px] gap-2 px-1">
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sản phẩm</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Số lượng</span>
                                    <span></span>
                                </div>

                                {form.rows.map((row, idx) => {
                                    const selectedItem = items.find(i => i.id === row.inventoryId);
                                    return (
                                        <div key={idx} className="grid grid-cols-[1fr_120px_36px] gap-2 items-center">
                                            {/* Product select */}
                                            <select
                                                ref={idx === 0 ? firstSelectRef : undefined}
                                                value={row.inventoryId}
                                                onChange={(e) => {
                                                    const item = items.find(i => i.id === e.target.value);
                                                    updateRow(idx, { inventoryId: e.target.value, inventoryName: item?.name ?? '' });
                                                }}
                                                required
                                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                            >
                                                <option value="">-- Chọn sản phẩm --</option>
                                                {items.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        [{item.sku}] {item.name} (Tồn: {item.closingStock} {item.unit})
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Quantity */}
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    step={1}
                                                    placeholder="SL..."
                                                    value={row.quantity}
                                                    onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                                                    required
                                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                                />
                                                {selectedItem && (
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                                                        {selectedItem.unit}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Remove row */}
                                            <button
                                                type="button"
                                                onClick={() => removeRow(idx)}
                                                disabled={form.rows.length <= 1}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                aria-label="Xóa dòng"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add row button */}
                            <button
                                type="button"
                                onClick={addRow}
                                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm sản phẩm
                            </button>
                        </div>

                        {/* Partner */}
                        <div>
                            <label htmlFor="xnt-partner" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                {isImport ? 'Nhà cung cấp' : 'Đối tác / Nơi nhận'}
                            </label>
                            <input
                                id="xnt-partner"
                                type="text"
                                placeholder={isImport ? 'VD: Trại ong Bến Tre...' : 'VD: Siêu thị BigC...'}
                                value={form.partner}
                                onChange={(e) => onChange({ partner: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        {/* Note */}
                        <div>
                            <label htmlFor="xnt-note" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ghi chú</label>
                            <textarea
                                id="xnt-note"
                                rows={2}
                                placeholder="Ghi chú thêm (không bắt buộc)..."
                                value={form.note}
                                onChange={(e) => onChange({ note: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !isValid}
                            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isImport
                                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
                                : 'bg-blue-500 hover:bg-blue-600 shadow-md shadow-blue-500/20'
                                }`}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isImport ? (
                                <ArrowDownCircle className="w-4 h-4" />
                            ) : (
                                <ArrowUpCircle className="w-4 h-4" />
                            )}
                            {isSaving
                                ? `Đang lưu... (0/${form.rows.length})`
                                : isImport
                                    ? `Xác nhận Nhập kho (${form.rows.length} sản phẩm)`
                                    : `Xác nhận Xuất kho (${form.rows.length} sản phẩm)`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
