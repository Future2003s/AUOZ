import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { useMaterialInventory } from '@/hooks/useMaterialInventory';
import { History, Search, Box, Tag, ArrowRightLeft, DatabaseZap, Clock } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/materials-utils';

export const TransactionHistoryView: React.FC<{ inventory: ReturnType<typeof useMaterialInventory> }> = ({ inventory }) => {
    const { state } = inventory;
    const [filterType, setFilterType] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = [...state.ls].reverse().filter(log => {
        // Lọc theo kho hiện tại
        if (state.gKho !== 'all' && log.kho !== state.gKho) return false;

        // Lọc loại
        if (filterType !== 'all' && log.mod !== filterType) return false;

        // Tìm kiếm
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            const content = JSON.stringify(log).toLowerCase();
            if (!content.includes(s)) return false;
        }

        return true;
    });

    const getLogIcon = (mod: string) => {
        switch (mod) {
            case 'hop': return <Box className="w-4 h-4 text-amber-500" />;
            case 'nhan': return <Tag className="w-4 h-4 text-orange-500" />;
            default: return <DatabaseZap className="w-4 h-4 text-slate-500" />;
        }
    };

    const getBadgeType = (type: string) => {
        switch (type) {
            case 'nhap':
            case 'nhap-to':
                return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
            case 'xuat':
                return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
            case 'chuyen':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
        }
    };

    const formatLogAction = (type: string) => {
        switch (type) {
            case 'nhap': return 'Nhập kho';
            case 'nhap-to': return 'Nhập tờ/cuộn';
            case 'xuat': return 'Xuất kho';
            case 'chuyen': return 'Luân chuyển';
            default: return type;
        }
    };

    const renderLogDetails = (log: any) => {
        if (log.mod === 'hop' && log.type === 'nhap') {
            return (
                <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.lkTen}</span>
                    {' • '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{formatNumber(log.sl)}</span> cái
                    <div className="text-xs text-slate-500 mt-0.5">Giá: {formatCurrency(log.gia)}/cái (Tổng: {formatCurrency(log.tt)})</div>
                </div>
            );
        }
        if (log.mod === 'hop' && log.type === 'xuat') {
            return (
                <div>
                    Xuất làm SP: <span className="font-bold text-slate-800 dark:text-slate-200">{log.spTen}</span>
                    {' • '}
                    Thành <span className="text-rose-600 dark:text-rose-400 font-bold">{formatNumber(log.soNap)}</span> nắp ({formatNumber(log.bong)} bông)
                </div>
            );
        }
        if (log.mod === 'nhan' && log.type === 'nhap-to') {
            return (
                <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.toTen}</span>
                    {' • '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{formatNumber(log.soTo)}</span> tờ/cuộn
                    <div className="text-xs text-slate-500 mt-1 pb-1 pt-1 mb-1 border-t border-b border-dashed border-slate-200 dark:border-slate-700">{log.detail}</div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">Tổng: {formatCurrency(log.tt)}</div>
                </div>
            );
        }
        return <div className="text-sm italic">Chi tiết không xác định</div>;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <History className="w-7 h-7 text-indigo-500" />
                        Lịch Sử Giao Dịch
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Ghi chú tất cả hoạt động nhập/xuất trong kho.</p>
                </div>
            </div>

            <Card>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="🔍 Tìm theo sản phẩm, kho, ghi chú..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant={filterType === 'all' ? 'gold' : 'ghost'} size="sm" onClick={() => setFilterType('all')}>Tất Cả</Button>
                        <Button variant={filterType === 'hop' ? 'gold' : 'ghost'} size="sm" onClick={() => setFilterType('hop')} className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5" />Hộp</Button>
                        <Button variant={filterType === 'nhan' ? 'gold' : 'ghost'} size="sm" onClick={() => setFilterType('nhan')} className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Nhãn</Button>
                    </div>
                </div>

                {filteredLogs.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <ArrowRightLeft className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4 stroke-1" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">Không thấy giao dịch nào.</h3>
                        <p className="text-slate-500 dark:text-slate-400">Hãy thử xóa bộ lọc hoặc tìm cụm từ khác.</p>
                    </div>
                ) : (
                    <div className="relative pl-6 sm:pl-8 py-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-8">
                        {filteredLogs.map((log, i) => (
                            <div key={i} className="relative group">
                                <div className="absolute -left-[35px] sm:-left-[43px] top-1 p-1.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-full shadow-sm group-hover:border-amber-400 group-hover:scale-110 transition-all">
                                    {getLogIcon(log.mod)}
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
                                        <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                                            <span className={`px-2 py-0.5 rounded-full ${getBadgeType(log.type)}`}>
                                                {formatLogAction(log.type)}
                                            </span>
                                            <span className="text-slate-400 flex items-center gap-1"><DatabaseZap className="w-3 h-3" /> Kho: {inventory.khoName(log.kho)}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-slate-400 font-medium font-mono whitespace-nowrap">
                                            <Clock className="w-3 h-3 mr-1.5" />
                                            {log.time}
                                        </div>
                                    </div>

                                    <div className="text-sm">
                                        {renderLogDetails(log)}
                                    </div>

                                    {log.gc && (
                                        <div className="mt-3 text-xs bg-amber-50/50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-500 px-3 py-2 rounded-lg italic border border-amber-100/50 dark:border-amber-900/30">
                                            Ghi chú: {log.gc}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="absolute left-[-5px] bottom-0 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    </div>
                )}
            </Card>
        </div>
    );
};
