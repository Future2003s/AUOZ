// ============================================================
// types.ts — Quản lý Xuất Nhập Tồn
// ============================================================

export type StatusType = 'on_dinh' | 'sap_het' | 'het_hang';

export interface InventoryXNTItem {
    id: string;
    /** Mã sản phẩm */
    sku: string;
    /** Tên sản phẩm */
    name: string;
    /** Đơn vị (Lọ, Hộp, Kg…) */
    unit: string;
    /** URL ảnh thumbnail — để trống sẽ dùng placeholder */
    thumbnail?: string;
    /** Tồn kho đầu kỳ */
    openingStock: number;
    /** Tổng nhập trong kỳ */
    totalImport: number;
    /** Tổng xuất trong kỳ */
    totalExport: number;
    /** Tồn kho cuối kỳ (= openingStock + totalImport - totalExport) */
    closingStock: number;
    /** Ngưỡng tồn kho tối thiểu để cảnh báo */
    minStock: number;
    /** Trạng thái tồn kho */
    status: StatusType;
    /** Thời gian cập nhật cuối */
    lastUpdated: string;
    /** Loại / danh mục */
    category?: string;
}

export interface TransactionRecord {
    id: string;
    inventoryId: string;
    type: 'import' | 'export';
    quantity: number;
    unit: string;
    partner?: string;
    note?: string;
    createdAt: string;
    createdBy?: string;
}

export interface FilterState {
    search: string;
    status: StatusType | 'all';
}

export interface TransactionFormState {
    inventoryId: string;
    inventoryName: string;
    type: 'import' | 'export';
    quantity: string;
    partner: string;
    note: string;
}

export const STATUS_LABELS: Record<StatusType, string> = {
    on_dinh: 'Ổn định',
    sap_het: 'Sắp hết',
    het_hang: 'Hết hàng',
};

export const STATUS_COLORS: Record<StatusType, { badge: string; dot: string }> = {
    on_dinh: {
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
    },
    sap_het: {
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
        dot: 'bg-red-500',
    },
    het_hang: {
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
    },
};

/** Tính toán trạng thái dựa trên tồn cuối kỳ và ngưỡng tối thiểu */
export function computeStatus(closingStock: number, minStock: number): StatusType {
    if (closingStock <= 0) return 'het_hang';
    if (closingStock < minStock) return 'sap_het';
    return 'on_dinh';
}
