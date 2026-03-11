"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, SlidersHorizontal, Plus, X, RefreshCw,
    Package, ArrowDownToLine, ArrowUpFromLine, Eye,
    AlertTriangle, PackagePlus, Loader2, WifiOff, RotateCcw, Clock,
} from 'lucide-react';

import { SummaryCards } from './SummaryCards';
import { InventoryTable } from './InventoryTable';
import { TransactionModal, EMPTY_BATCH_FORM } from './TransactionModal';
import type { BatchTransactionFormState } from './TransactionModal';
import { HistoryTab } from './HistoryTab';
import type {
    InventoryXNTItem, FilterState, StatusType,
} from './types';
import { STATUS_LABELS, computeStatus } from './types';
import {
    getInventories, createInventory, updateInventory, deleteInventory,
    adjustStock,
    type InventoryItem,
} from '@/apiRequests/inventory';

// ─── Mapper: Backend InventoryItem → UI InventoryXNTItem ──────────────────────
// The backend stores quantity (ongoing stock), minStock.
// The UI needs openingStock / totalImport / totalExport / closingStock.
// We derive these conservatively until the API adds XNT-specific fields.
function mapApiItem(item: InventoryItem): InventoryXNTItem {
    // Backend: quantity = current total stock (closingStock equivalent)
    // totalImport / totalExport not exposed by the simple Inventory model yet.
    // We map quantity → closingStock, and show 0 for period import/export
    // unless the API provides them.
    const closing = item.quantity ?? 0;
    const minSt = item.minStock ?? 0;
    const imported = item.importedQty ?? 0;
    const exported = item.soldQty ?? 0;

    // Approximation of opening balance before all historical transactions
    const opening = Math.max(0, closing - imported + exported);

    return {
        id: item.id,
        sku: (item as InventoryItem & { sku?: string }).sku ?? item.id.slice(-6).toUpperCase(),
        name: item.name,
        unit: item.unit ?? 'cái',
        openingStock: opening,
        totalImport: imported,
        totalExport: exported,
        closingStock: closing,
        minStock: minSt,
        status: computeStatus(closing, minSt),
        category: item.category,
        lastUpdated: item.updatedAt ?? new Date().toISOString(),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductModal — Thêm mới / Chỉnh sửa sản phẩm
// ─────────────────────────────────────────────────────────────────────────────
interface ProductFormState {
    id: string | null;
    sku: string;
    name: string;
    unit: string;
    openingStock: string;
    minStock: string;
    category: string;
}

const EMPTY_PRODUCT: ProductFormState = {
    id: null, sku: '', name: '', unit: 'Lọ', openingStock: '0', minStock: '10', category: '',
};

function ProductModal({
    isOpen, onClose, initial, onSave, isSaving,
}: {
    isOpen: boolean;
    onClose: () => void;
    initial: ProductFormState;
    onSave: (form: ProductFormState) => void;
    isSaving: boolean;
}) {
    const [form, setForm] = useState<ProductFormState>(initial);
    const firstRef = useRef<HTMLInputElement>(null);
    const isEdit = !!form.id;

    useEffect(() => { setForm(initial); }, [initial]);
    useEffect(() => { if (isOpen) setTimeout(() => firstRef.current?.focus(), 80); }, [isOpen]);
    useEffect(() => {
        if (!isOpen) return;
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const patch = (p: Partial<ProductFormState>) => setForm(f => ({ ...f, ...p }));
    const UNITS = ['Lọ', 'Hộp', 'Kg', 'Cuộn', 'Cái', 'Thùng', 'Túi'];
    const CATS = ['Mật ong thường', 'Mật ong cao cấp', 'Vật tư hộp', 'Nhãn dán', 'Khác'];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog" aria-modal="true"
        >
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {isEdit ? `Mã: ${form.sku}` : 'Điền thông tin sản phẩm bên dưới'}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Mã SP (SKU) <span className="text-red-500">*</span>
                            </label>
                            <input ref={firstRef} required value={form.sku}
                                onChange={e => patch({ sku: e.target.value.toUpperCase() })}
                                placeholder="VD: MAT-165-TN"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Đơn vị <span className="text-red-500">*</span>
                            </label>
                            <select value={form.unit} onChange={e => patch({ unit: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all">
                                {UNITS.map(u => <option key={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Tên sản phẩm <span className="text-red-500">*</span>
                        </label>
                        <input required value={form.name} onChange={e => patch({ name: e.target.value })}
                            placeholder="VD: Mật Ong Hoa Rừng 165g"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Số lượng ban đầu</label>
                            <input type="number" min={0} value={form.openingStock}
                                onChange={e => patch({ openingStock: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ngưỡng tối thiểu</label>
                            <input type="number" min={0} value={form.minStock}
                                onChange={e => patch({ minStock: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Danh mục</label>
                        <select value={form.category} onChange={e => patch({ category: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all">
                            <option value="">-- Chọn danh mục --</option>
                            {CATS.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} disabled={isSaving}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
                            Hủy bỏ
                        </button>
                        <button type="submit" disabled={isSaving || !form.sku || !form.name}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />}
                            {isSaving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Drawer
// ─────────────────────────────────────────────────────────────────────────────
function DetailDrawer({ item, onClose }: { item: InventoryXNTItem; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <p className="text-xs font-mono text-slate-400">{item.sku}</p>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.name}</h2>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3 p-6">
                    {[
                        { label: 'Tồn kho hiện tại', value: `${item.closingStock.toLocaleString('vi-VN')} ${item.unit}`, color: 'text-slate-800 dark:text-white' },
                        { label: 'Tổng nhập (kỳ)', value: `+${item.totalImport.toLocaleString('vi-VN')} ${item.unit}`, color: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Tổng xuất (kỳ)', value: `-${item.totalExport.toLocaleString('vi-VN')} ${item.unit}`, color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Ngưỡng tối thiểu', value: `${item.minStock} ${item.unit}`, color: 'text-amber-600 dark:text-amber-400' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
                            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                        </div>
                    ))}
                </div>
                <div className="px-6 pb-6 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {item.category && <p>Danh mục: <span className="font-medium text-slate-800 dark:text-slate-200">{item.category}</span></p>}
                    <p>Cập nhật: <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(item.lastUpdated).toLocaleString('vi-VN')}</span></p>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirm Dialog
// ─────────────────────────────────────────────────────────────────────────────
function DeleteConfirmDialog({
    item, onConfirm, onCancel, isDeleting,
}: { item: InventoryXNTItem; onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-center">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Xác nhận xóa?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Bạn có chắc muốn xóa <span className="font-semibold text-slate-700 dark:text-slate-200">{item.name}</span>? Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel} disabled={isDeleting}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
                        Hủy bỏ
                    </button>
                    <button onClick={onConfirm} disabled={isDeleting}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-md shadow-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isDeleting ? 'Đang xóa...' : 'Xóa'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_FILTER_OPTIONS: { value: FilterState['status']; label: string }[] = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'on_dinh', label: STATUS_LABELS.on_dinh },
    { value: 'sap_het', label: STATUS_LABELS.sap_het },
    { value: 'het_hang', label: STATUS_LABELS.het_hang },
];


export function InventoryXNTPage() {
    const queryClient = useQueryClient();

    // ── Fetch from backend ──────────────────────────────────────────────────
    const { data: apiData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['inventories'],
        queryFn: () => getInventories({ limit: 100 })
    });

    // Map API items → UI items
    const inventory: InventoryXNTItem[] = useMemo(
        () => (apiData?.data ?? []).map(mapApiItem),
        [apiData]
    );

    // ── Filters ─────────────────────────────────────────────────────────────
    const [filter, setFilter] = useState<FilterState>({ search: '', status: 'all' });
    const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

    // ── UI state ─────────────────────────────────────────────────────────────
    const [txModal, setTxModal] = useState<{ open: boolean; form: BatchTransactionFormState }>({
        open: false, form: EMPTY_BATCH_FORM,
    });
    const [viewItem, setViewItem] = useState<InventoryXNTItem | null>(null);
    const [deleteItem, setDeleteItem] = useState<InventoryXNTItem | null>(null);
    const [productModal, setProductModal] = useState<{ open: boolean; initial: ProductFormState }>({
        open: false, initial: EMPTY_PRODUCT,
    });

    // ── Mutations ────────────────────────────────────────────────────────────

    const createMutation = useMutation({
        mutationFn: (form: ProductFormState) => createInventory({
            sku: form.sku,
            name: form.name,
            quantity: Number(form.openingStock),
            unit: form.unit,
            minStock: Number(form.minStock),
            price: 0,
            category: form.category || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventories'] });
            setProductModal({ open: false, initial: EMPTY_PRODUCT });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, form }: { id: string; form: ProductFormState }) =>
            updateInventory(id, {
                name: form.name,
                unit: form.unit,
                minStock: Number(form.minStock),
                quantity: Number(form.openingStock),
                category: form.category || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventories'] });
            setProductModal({ open: false, initial: EMPTY_PRODUCT });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteInventory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventories'] });
            setDeleteItem(null);
        },
    });

    const adjustMutation = useMutation({
        mutationFn: (rows: Array<{ id: string; type: 'import' | 'export'; amount: number; partner?: string; note?: string }>) =>
            Promise.all(rows.map(row => adjustStock(row.id, { type: row.type, amount: row.amount, partner: row.partner, reason: row.note }))),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventories'] });
            setTxModal({ open: false, form: EMPTY_BATCH_FORM });
        },
    });

    // ── Handlers ────────────────────────────────────────────────────────────

    const openAddProduct = useCallback(() => {
        setProductModal({ open: true, initial: EMPTY_PRODUCT });
    }, []);

    const openEditProduct = useCallback((item: InventoryXNTItem) => {
        setProductModal({
            open: true,
            initial: {
                id: item.id,
                sku: item.sku,
                name: item.name,
                unit: item.unit,
                openingStock: String(item.closingStock),
                minStock: String(item.minStock),
                category: item.category ?? '',
            },
        });
    }, []);

    const handleProductSave = useCallback((form: ProductFormState) => {
        if (form.id) {
            updateMutation.mutate({ id: form.id, form });
        } else {
            createMutation.mutate(form);
        }
    }, [createMutation, updateMutation]);

    const openTxModal = useCallback((preselect?: InventoryXNTItem) => {
        setTxModal({
            open: true,
            form: preselect
                ? { ...EMPTY_BATCH_FORM, rows: [{ inventoryId: preselect.id, inventoryName: preselect.name, quantity: '' }] }
                : EMPTY_BATCH_FORM,
        });
    }, []);

    const handleTxSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            const { type, rows, partner, note } = txModal.form;
            const validRows = rows.filter(r => r.inventoryId && Number(r.quantity) > 0);
            if (validRows.length === 0) return;

            adjustMutation.mutate(
                validRows.map(row => ({
                    id: row.inventoryId,
                    type,
                    amount: Number(row.quantity),
                    partner: partner || undefined,
                    note: note || undefined,
                }))
            );
        },
        [txModal.form, adjustMutation]
    );

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteItem) return;
        deleteMutation.mutate(deleteItem.id);
    }, [deleteItem, deleteMutation]);

    const handleEdit = useCallback((item: InventoryXNTItem) => {
        openEditProduct(item);
    }, [openEditProduct]);

    // ── Filtered items ───────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = filter.search.trim().toLowerCase();
        return inventory.filter((item) => {
            const matchSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
            const matchStatus = filter.status === 'all' || item.status === filter.status;
            return matchSearch && matchStatus;
        });
    }, [inventory, filter]);

    const clearFilters = () => setFilter({ search: '', status: 'all' });
    const hasActiveFilters = filter.search || filter.status !== 'all';
    const warningItems = inventory.filter((i) => i.status !== 'on_dinh');

    const isSaving = adjustMutation.isPending;
    const isProductSaving = createMutation.isPending || updateMutation.isPending;
    const isDeleting = deleteMutation.isPending;

    // ── Error / Loading states ──────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <p className="text-sm font-medium">Đang tải dữ liệu tồn kho...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        // Distinguish 401 (session expired) from real network errors
        const httpErr = (error as any);
        const is401 = httpErr?.statusCode === 401 || httpErr?.message?.includes("401");

        if (is401) {
            return (
                <div className="min-h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-amber-500 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Phiên đăng nhập hết hạn</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Token xác thực đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.
                            </p>
                        </div>
                        <a
                            href={`/${typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'vi' : 'vi'}/login`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
                        >
                            Đi đến trang đăng nhập
                        </a>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
                        <WifiOff className="w-8 h-8 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Không thể kết nối backend</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Không lấy được dữ liệu từ máy chủ. Kiểm tra Backend đang chạy trên cổng 8081.
                        </p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full space-y-6">
            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className='mt-2'>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                            <Package className="w-4 h-4 text-white" strokeWidth={2.2} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Quản lý Xuất Nhập Tồn
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 ml-10">
                        {inventory.length} mặt hàng · Cập nhật theo thời gian thực
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => refetch()}
                        title="Tải lại dữ liệu"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={openAddProduct}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 active:scale-95"
                    >
                        <PackagePlus className="w-4 h-4 text-indigo-500" />
                        Thêm sản phẩm
                    </button>
                    <button
                        onClick={() => openTxModal()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm giao dịch
                    </button>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        activeTab === 'inventory'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    <Package className="w-4 h-4" />
                    Tồn kho
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        activeTab === 'history'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    Lịch sử giao dịch
                </button>
            </div>

            {/* ── SUMMARY CARDS (always visible) ── */}
            <SummaryCards items={inventory} />

            {/* ── WARNING BANNER ── */}
            {warningItems.length > 0 && (
                <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <span className="font-semibold text-amber-800 dark:text-amber-300">
                            {warningItems.length} mặt hàng cần chú ý:
                        </span>{' '}
                        <span className="text-amber-700 dark:text-amber-400">
                            {warningItems.map((i) => i.name).join(', ')}
                        </span>
                    </div>
                </div>
            )}

            {activeTab === 'inventory' && (
            <>

            {/* ── TOOLBAR ── */}
            <div className="flex flex-col sm:flex-row gap-3">

                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên sản phẩm hoặc mã SKU..."
                        value={filter.search}
                        onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                        aria-label="Tìm kiếm sản phẩm"
                    />
                    {filter.search && (
                        <button
                            onClick={() => setFilter((f) => ({ ...f, search: '' }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="relative">
                    <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value as StatusType | 'all' }))}
                        className="pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all appearance-none cursor-pointer min-w-[180px]"
                        aria-label="Lọc theo trạng thái"
                    >
                        {STATUS_FILTER_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        title="Xóa bộ lọc"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Đặt lại
                    </button>
                )}
            </div>

            {/* ── QUICK STATS ROW ── */}
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Eye className="w-3.5 h-3.5" />
                    Hiển thị <span className="font-semibold text-slate-700 dark:text-slate-300">{filtered.length}</span> / {inventory.length} mặt hàng
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    Tổng nhập: <span className="font-semibold">{inventory.reduce((s, i) => s + i.totalImport, 0).toLocaleString('vi-VN')}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                    <ArrowUpFromLine className="w-3.5 h-3.5" />
                    Tổng xuất: <span className="font-semibold">{inventory.reduce((s, i) => s + i.totalExport, 0).toLocaleString('vi-VN')}</span>
                </div>
            </div>

            {/* ── API ERROR INLINE (for mutations) ── */}
            {(adjustMutation.isError || createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Lỗi kết nối máy chủ. Vui lòng kiểm tra backend và thử lại.
                </div>
            )}

            {/* ── DATA TABLE ── */}
            <InventoryTable
                items={filtered}
                onEdit={handleEdit}
                onDelete={setDeleteItem}
                onView={setViewItem}
                onAddTransaction={openTxModal}
            />

            </>
            )}

            {activeTab === 'history' && (
                <HistoryTab items={inventory} />
            )}

            {/* ── TRANSACTION MODAL ── */}
            <TransactionModal
                isOpen={txModal.open}
                onClose={() => setTxModal({ open: false, form: EMPTY_BATCH_FORM })}
                form={txModal.form}
                onChange={(patch) => setTxModal((s) => ({ ...s, form: { ...s.form, ...patch } }))}
                onSubmit={handleTxSubmit}
                isSaving={isSaving}
                items={inventory}
            />

            {/* ── DETAIL DRAWER ── */}
            {viewItem && <DetailDrawer item={viewItem} onClose={() => setViewItem(null)} />}

            {/* ── DELETE CONFIRM ── */}
            {deleteItem && (
                <DeleteConfirmDialog
                    item={deleteItem}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteItem(null)}
                    isDeleting={isDeleting}
                />
            )}

            {/* ── PRODUCT MODAL ── */}
            <ProductModal
                isOpen={productModal.open}
                onClose={() => setProductModal({ open: false, initial: EMPTY_PRODUCT })}
                initial={productModal.initial}
                onSave={handleProductSave}
                isSaving={isProductSaving}
            />
        </div>
    );
}
