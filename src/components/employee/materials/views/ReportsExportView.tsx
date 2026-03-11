import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { useMaterialInventory } from '@/hooks/useMaterialInventory';
import { FileSpreadsheet, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { loadXLSX, formatCurrency } from '@/lib/materials-utils';

export const ReportsExportView: React.FC<{ inventory: ReturnType<typeof useMaterialInventory> }> = ({ inventory }) => {
    const { state, getHopTon, getHopGia, getNTon, getNGia, khoName } = inventory;
    const [isExporting, setIsExporting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            setErrorMsg('');
            const XLSX = await loadXLSX();
            if (!XLSX) throw new Error("Không thể tải thư viện XLSX. Vui lòng kiểm tra kết nối mạng.");

            const wb = XLSX.utils.book_new();

            // --- SHEET 1: Hộp Hoa ---
            const dataHop: any[] = [];
            state.kho.forEach(k => {
                Object.entries(state.linhKien).forEach(([id, lk]) => {
                    const sl = getHopTon(k.id, id);
                    if (sl > 0) {
                        dataHop.push({
                            "Kho": k.ten,
                            "Loại Linh Kiện": lk.ten,
                            "Số lượng Tồn": sl,
                            "Giá TB/Cái": formatCurrency(getHopGia(k.id, id)),
                            "Tổng Giá Trị": sl * getHopGia(k.id, id)
                        });
                    }
                });
            });
            const wsHop = XLSX.utils.json_to_sheet(dataHop.length ? dataHop : [{ "Thông báo": "Không có dữ liệu tồn" }]);
            XLSX.utils.book_append_sheet(wb, wsHop, "Tồn Hộp");

            // --- SHEET 2: Nhãn ---
            const dataNhan: any[] = [];
            state.kho.forEach(k => {
                Object.entries(state.nLoai).forEach(([id, nl]) => {
                    const sl = getNTon(k.id, id);
                    if (sl > 0) {
                        dataNhan.push({
                            "Kho": k.ten,
                            "Loại Nhãn": nl.ten,
                            "Kích thước": nl.kt,
                            "Tồn Kho (Cái)": sl,
                            "Cảnh báo": sl < nl.min ? "SẮP HẾT" : "OK",
                            "Giá TB/Cái": formatCurrency(getNGia(k.id, id))
                        });
                    }
                });
            });
            const wsNhan = XLSX.utils.json_to_sheet(dataNhan.length ? dataNhan : [{ "Thông báo": "Không có dữ liệu tồn" }]);
            XLSX.utils.book_append_sheet(wb, wsNhan, "Tồn Nhãn");

            // --- SHEET 3: Lịch Sử Giao Dịch ---
            const dataLS = state.ls.map((log: any) => {
                let det = '';
                if (log.mod === 'hop' && log.type === 'nhap') det = `Nhập ${log.sl} cái [${log.lkTen}] giá ${log.gia}`;
                if (log.mod === 'hop' && log.type === 'xuat') det = `Xuất ${log.soNap} nắp (${log.bong} bông) làm [${log.spTen}]`;
                if (log.mod === 'nhan' && log.type === 'nhap-to') det = `Nhập ${log.soTo} tờ [${log.toTen}]. ${log.detail}`;

                return {
                    "Thời gian": log.time,
                    "Phân hệ": log.mod === 'hop' ? 'Hộp' : 'Nhãn',
                    "Hành động": log.type.toUpperCase(),
                    "Kho": khoName(log.kho),
                    "Chi tiết": det,
                    "Ghi chú": log.gc || ''
                }
            });

            const wsLS = XLSX.utils.json_to_sheet(dataLS.length ? dataLS : [{ "Thông báo": "Không có giao dịch" }]);
            XLSX.utils.book_append_sheet(wb, wsLS, "Lịch Sử");

            // Write File
            XLSX.writeFile(wb, `BaoCao_VatTu_${new Date().toISOString().slice(0, 10)}.xlsx`);

        } catch (e: any) {
            setErrorMsg(e.message || "Lỗi khi xuất file Excel.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                    Báo Cáo & Dữ Liệu
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Xuất thống kê tồn kho Hộp Hoa và Nhãn Dán ra file Excel (XLSX).</p>
            </div>

            {errorMsg && (
                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-400 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 flex items-center gap-3 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{errorMsg}</p>
                </div>
            )}

            <Card>
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-2">
                        <Download className="w-8 h-8 text-emerald-500" />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Báo Cáo Tồn Kho Hiện Tại</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-sm mx-auto">
                            File Excel chứa 3 sheet: Tồn Hộp, Tồn Nhãn và toàn bộ 100% Lịch Sử Giao Dịch từ trước đến nay.
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button
                            variant="green"
                            size="lg"
                            onClick={handleExportExcel}
                            isLoading={isExporting}
                            className="font-bold tracking-wide shadow-emerald-500/20 shadow-lg"
                        >
                            {isExporting ? 'Đang Tạo File Excel...' : 'Tải File Excel (.xlsx)'}
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="text-center text-xs text-slate-400 dark:text-slate-500">
                Tính năng này yêu cầu trình duyệt có kết nối internet để tải thư viện (SheetJS). Dữ liệu được tính toán 100% offline tại máy.
            </div>
        </div>
    );
};
