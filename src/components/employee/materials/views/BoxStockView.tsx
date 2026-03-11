import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { useMaterialInventory } from '@/hooks/useMaterialInventory';
import { ClipboardList, DatabaseZap } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/materials-utils';

export const BoxStockView: React.FC<{ inventory: ReturnType<typeof useMaterialInventory> }> = ({ inventory }) => {
    const { state, getHopTon, getHopGia, khoName, calcMaxHop } = inventory;
    const isAll = state.gKho === 'all';
    const showKho = isAll ? state.kho : state.kho.filter(k => k.id === state.gKho);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <ClipboardList className="w-7 h-7 text-amber-500" />
                    Tồn Kho Linh Kiện Hộp
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Cập nhật theo thời gian thực số lượng linh kiện hộp hoa trong kho.</p>
            </div>

            <Card>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Tên Linh Kiện</th>
                                {showKho.map(k => (
                                    <th key={k.id} className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-right">
                                        Tồn {k.ten}
                                    </th>
                                ))}
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-right bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-500">
                                    Tổng Tồn
                                </th>
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-right">Giá TB</th>
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-right">Thành Tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {Object.entries(state.linhKien).map(([lkId, lk]) => {
                                let totalSL = 0;
                                let totalPrice = 0;

                                return (
                                    <tr key={lkId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{lk.ten}</td>

                                        {showKho.map(k => {
                                            const sl = getHopTon(k.id, lkId);
                                            const m = getHopGia(k.id, lkId);
                                            totalSL += sl;
                                            totalPrice += sl * m;
                                            return (
                                                <td key={k.id} className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                    {formatNumber(sl)}
                                                </td>
                                            );
                                        })}

                                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white bg-amber-50/50 dark:bg-amber-900/5 hover:bg-amber-100 dark:hover:bg-amber-900/20">
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

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4">Ước tính ghép Thành Phẩm</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {state.sanPham.map(sp => {
                    const max = calcMaxHop(sp, state.gKho);
                    return (
                        <Card key={sp.id} className="!mb-0 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-transparent dark:from-amber-900/20 rounded-bl-[100px] -z-10" />
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{sp.ten}</div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white my-2">
                                {formatNumber(max)} <span className="text-sm font-medium text-slate-400">hộp có thể ghép</span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                Thành phần: {sp.ct.map(c => `${c.sl} ${state.linhKien[c.lk]?.ten}`).join(', ')}
                            </div>
                        </Card>
                    );
                })}
            </div>

        </div>
    );
};
