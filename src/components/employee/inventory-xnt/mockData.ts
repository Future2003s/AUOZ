// ============================================================
// mockData.ts — Quản lý Xuất Nhập Tồn
// Dữ liệu mẫu thực tế bằng tiếng Việt (Tháng 3/2026)
// ============================================================

import type { InventoryXNTItem, TransactionRecord } from './types';
import { computeStatus } from './types';

const make = (
    id: string,
    sku: string,
    name: string,
    unit: string,
    openingStock: number,
    totalImport: number,
    totalExport: number,
    minStock: number,
    category: string,
    lastUpdated: string,
): InventoryXNTItem => {
    const closingStock = openingStock + totalImport - totalExport;
    return {
        id,
        sku,
        name,
        unit,
        openingStock,
        totalImport,
        totalExport,
        closingStock,
        minStock,
        status: computeStatus(closingStock, minStock),
        category,
        lastUpdated,
    };
};

export const mockInventory: InventoryXNTItem[] = [
    make('1', 'MAT-165-TN', 'Mật Ong Hoa Rừng 165g', 'Lọ', 320, 150, 390, 80, 'Mật ong thường', '2026-03-10T09:15:00'),
    make('2', 'MAT-500-HC', 'Mật Ong Hoa Cà Phê 500g', 'Lọ', 180, 200, 260, 100, 'Mật ong cao cấp', '2026-03-10T10:30:00'),
    make('3', 'MAT-250-NK', 'Mật Ong Nhãn 250g', 'Lọ', 95, 50, 130, 60, 'Mật ong thường', '2026-03-09T16:00:00'),
    make('4', 'HOP-NH-M', 'Hộp Làm Hoa Nhỏ (10 cái)', 'Hộp', 500, 300, 750, 200, 'Vật tư hộp', '2026-03-10T08:45:00'),
    make('5', 'HOP-NH-L', 'Hộp Làm Hoa Lớn (5 cái)', 'Hộp', 220, 100, 290, 150, 'Vật tư hộp', '2026-03-10T08:45:00'),
    make('6', 'NHAN-165-TN', 'Tem Nhãn Mật Ong Rừng 165g', 'Cuộn', 50, 200, 240, 80, 'Nhãn dán', '2026-03-08T14:20:00'),
    make('7', 'MAT-1000-VN', 'Mật Ong Nguyên Chất 1kg', 'Lọ', 60, 40, 80, 30, 'Mật ong cao cấp', '2026-03-10T11:00:00'),
];

export const mockTransactions: TransactionRecord[] = [
    { id: 't1', inventoryId: '1', type: 'import', quantity: 150, unit: 'Lọ', partner: 'Trại ong Bến Tre', note: 'Nhập lô mới tháng 3', createdAt: '2026-03-05T08:00:00', createdBy: 'Nguyễn Thị An' },
    { id: 't2', inventoryId: '2', type: 'export', quantity: 80, unit: 'Lọ', partner: 'Siêu thị Big C HCM', note: 'Xuất theo hợp đồng Q1', createdAt: '2026-03-06T10:30:00', createdBy: 'Trần Văn Bình' },
    { id: 't3', inventoryId: '3', type: 'export', quantity: 30, unit: 'Lọ', partner: 'Khách lẻ', note: '', createdAt: '2026-03-07T14:00:00', createdBy: 'Lê Thị Cúc' },
    { id: 't4', inventoryId: '4', type: 'import', quantity: 300, unit: 'Hộp', partner: 'Xưởng giấy Bình Dương', note: 'Hộp tháng 3 đặt sản xuất', createdAt: '2026-03-02T09:00:00', createdBy: 'Nguyễn Thị An' },
    { id: 't5', inventoryId: '4', type: 'export', quantity: 750, unit: 'Hộp', partner: 'Kho chính', note: 'Chuyển kho', createdAt: '2026-03-09T11:00:00', createdBy: 'Trần Văn Bình' },
    { id: 't6', inventoryId: '6', type: 'import', quantity: 200, unit: 'Cuộn', partner: 'Công ty In Ấn Tốt', note: 'Tem nhãn mới thiết kế 2026', createdAt: '2026-03-01T08:30:00', createdBy: 'Lê Thị Cúc' },
    { id: 't7', inventoryId: '7', type: 'export', quantity: 40, unit: 'Lọ', partner: 'Đại lý Hà Nội', note: 'Đơn hàng #HN-2026-031', createdAt: '2026-03-10T11:00:00', createdBy: 'Nguyễn Thị An' },
];
