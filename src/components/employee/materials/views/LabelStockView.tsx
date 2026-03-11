import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { useMaterialInventory } from '@/hooks/useMaterialInventory';
import { ClipboardList, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/materials-utils';

export const LabelStockView: React.FC<{ inventory: ReturnType<typeof useMaterialInventory> }> = ({ inventory }) => {
    const { state, getNTon, getNGia } = inventory;
    const isAll = state.gKho === 'all';
    const showKho = isAll ? state.kho : state.kho.filter(k => k.id === state.gKho);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <ClipboardList className="w-7 h-7 text-orange-500" />
                    Tồn Kho Nhãn Dán lẻ
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý số lượng nhãn cái sau khi đã bóc xuất từ tờ/cuộn in.</p>
            </div>

            <Card>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Loại Nhãn & Kích Thước</th>
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-center w-24">Trạng Thái</th>
                                {showKho.map(k => (
                                    <th key={k.id} className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-right">
                                        Tồn {k.ten}
                                    </th>
                                ))}
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-right bg-orange-50 dark:bg-orange-900/10 text-orange-800 dark:text-orange-500">
                                    Tổng Cái
                                </th>
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-right">Giá TB</th>
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-right">Thành Tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {Object.entries(state.nLoai).map(([loaiId, nl]) => {
                                let totalSL = 0;
                                let totalPrice = 0;

                                // Compute totals
                                showKho.forEach(k => {
                                    const sl = getNTon(k.id, loaiId);
                                    const pr = getNGia(k.id, loaiId);
                                    totalSL += sl;
                                    totalPrice += sl * pr;
                                });

                                const isLow = totalSL < nl.min;

                                return (
                                    <tr key={loaiId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isLow ? 'bg-rose-50/30 dark:bg-rose-900/5' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-800 dark:text-slate-200">{nl.ten}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">{nl.kt}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">Màu: <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: nl.mau.includes('Vàng') ? '#fbbf24' : (nl.mau.includes('Nâu') ? '#92400e' : '#e2e8f0'), border: '1px solid #cbd5e1' }} /> {nl.mau}</span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            {isLow ? (
                                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800/50">
                                                    <AlertTriangle className="w-3.5 h-3.5" /> Sắp hết
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/50">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> Ổn định
                                                </div>
                                            )}
                                        </td>

                                        {showKho.map(k => {
                                            const sl = getNTon(k.id, loaiId);
                                            return (
                                                <td key={k.id} className={`px-4 py-3 text-right font-medium ${sl < nl.min / showKho.length ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {formatNumber(sl)}
                                                </td>
                                            );
                                        })}

                                        <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white bg-orange-50/50 dark:bg-orange-900/10">
                                            {formatNumber(totalSL)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                                            {totalSL > 0 ? formatCurrency(totalPrice / totalSL) : '0₫'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-500">
                                            {formatCurrency(totalPrice)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Cảnh báo "Sắp hết"</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                        Hệ thống sẽ tự động bật cảnh báo thiếu nhãn nếu tổng tồn kho của loại nhãn đó giảm xuống dưới ngưỡng tối thiểu thiết lập trong kế hoạch sản xuất.
                    </p>
                </div>
            </div>
        </div>
    );
};
