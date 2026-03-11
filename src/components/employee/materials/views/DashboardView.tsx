import React from 'react';
import { Card } from '../shared/Card';
import { useMaterialInventory } from '@/hooks/useMaterialInventory';
import { Package, Tag, ArrowUpRight, CopyCheck, AlertTriangle } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/materials-utils';

export const DashboardView: React.FC<{ inventory: ReturnType<typeof useMaterialInventory> }> = ({ inventory }) => {
    const { state, getHopTon, getHopGia, getNTon, getNGia } = inventory;
    const isAll = state.gKho === 'all';
    const showKho = isAll ? state.kho : state.kho.filter(k => k.id === state.gKho);

    // Tính thống kê Hộp
    let tsHop = 0; let gtHop = 0;
    showKho.forEach(k => {
        Object.keys(state.linhKien).forEach(lk => {
            const sl = getHopTon(k.id, lk);
            const m = getHopGia(k.id, lk);
            tsHop += sl;
            gtHop += sl * m;
        });
    });

    // Tính thống kê Nhãn
    let tsNhan = 0; let gtNhan = 0;
    showKho.forEach(k => {
        Object.keys(state.nLoai).forEach(loai => {
            const sl = getNTon(k.id, loai);
            const m = getNGia(k.id, loai);
            tsNhan += sl;
            gtNhan += sl * m;
        });
    });

    // Nhan To Ton (Tờ Nhãn)
    let tsTo = 0;
    Object.keys(state.nTo).forEach(tId => tsTo += (state.nToTon[tId] || 0));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <LayoutDashboardIcon className="w-8 h-8 text-indigo-500" />
                    Tổng Quan Kho
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Đang xem: <span className="font-bold text-amber-600">{isAll ? 'Tất cả Kho' : inventory.khoName(state.gKho)}</span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Hộp Card */}
                <Card
                    className="border-amber-200/50 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 to-white/0 dark:from-amber-900/10 dark:to-slate-900/10"
                    title={<span className="text-amber-700 dark:text-amber-500 flex items-center gap-2"><Package className="w-5 h-5" /> Linh Kiện Hộp</span>}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">Tổng Số Lượng</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{formatNumber(tsHop)} <span className="text-sm font-medium text-slate-400">cái</span></div>
                        </div>
                        <div>
                            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">Tạm Tính Giá Trị</div>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{formatCurrency(gtHop)}</div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">Chi tiết tồn kho</div>
                        {Object.entries(state.linhKien).map(([id, lk]) => {
                            let sl = 0;
                            showKho.forEach(k => { sl += getHopTon(k.id, id); });
                            const ratio = Math.min((sl / 5000) * 100, 100); // 5000 as arbitrary max for bar
                            return (
                                <div key={id}>
                                    <div className="flex justify-between text-sm mb-1.5 font-medium">
                                        <span className="text-slate-700 dark:text-slate-300">{lk.ten}</span>
                                        <span className={sl < 100 ? 'text-rose-600 font-bold' : 'text-slate-900 dark:text-white'}>{formatNumber(sl)}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div className={`h-2 rounded-full ${sl < 100 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${ratio}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Nhãn Card */}
                <Card
                    className="border-orange-200/50 dark:border-orange-900/50 bg-gradient-to-br from-orange-50/50 to-white/0 dark:from-orange-900/10 dark:to-slate-900/10"
                    title={<span className="text-orange-700 dark:text-orange-500 flex items-center gap-2"><Tag className="w-5 h-5" /> Nhãn Dán & Tờ In</span>}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">Tổng Số Nhãn (Cái)</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{formatNumber(tsNhan)}</div>
                        </div>
                        <div>
                            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">Tờ In Chưa Cắt</div>
                            <div className="text-3xl font-black text-orange-600 dark:text-orange-500">{formatNumber(tsTo)} <span className="text-sm font-medium text-orange-500/70">tờ</span></div>
                        </div>
                    </div>

                    <div className="mt-7">
                        <div className="text-left text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 border-b border-orange-200/50 dark:border-orange-900/50 pb-2 flex items-center justify-between">
                            <span>Cảnh báo nhãn sắp hết</span>
                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="space-y-3">
                            {Object.entries(state.nLoai).map(([id, nl]) => {
                                let sl = 0;
                                showKho.forEach(k => { sl += getNTon(k.id, id); });
                                if (sl >= nl.min) return null; // Only show if below min

                                return (
                                    <div key={id} className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg border border-rose-100 dark:border-rose-900/50">
                                        <div>
                                            <div className="text-sm font-bold text-rose-800 dark:text-rose-300">{nl.ten}</div>
                                            <div className="text-xs text-rose-600/80 dark:text-rose-400/80">Mức tối thiểu: {formatNumber(nl.min)}</div>
                                        </div>
                                        <div className="text-lg font-black text-rose-600 dark:text-rose-400">{formatNumber(sl)}</div>
                                    </div>
                                );
                            })}
                            {/* Show generic message if everyone is above min */}
                            {Object.entries(state.nLoai).every(([id, nl]) => {
                                let sl = 0;
                                showKho.forEach(k => { sl += getNTon(k.id, id); });
                                return sl >= nl.min;
                            }) && (
                                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 py-2">
                                        <CopyCheck className="w-4 h-4 text-emerald-500" /> Số lượng nhãn đều ở mức an toàn.
                                    </div>
                                )}
                        </div>
                    </div>
                </Card>
            </div>

        </div>
    );
};

// Extracted from Lucide since it is used locally in this file
const LayoutDashboardIcon = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
);
