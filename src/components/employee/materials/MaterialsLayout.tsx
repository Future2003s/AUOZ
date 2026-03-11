"use client";

import React, { useState } from 'react';
import { useMaterialInventory } from '@/hooks/useMaterialInventory';
import { Loader2, Menu, X, Package, Box, Tag, ClipboardList, BarChart3, LayoutDashboard } from 'lucide-react';

// Views (To be implemented)
import { DashboardView } from './views/DashboardView';
import { BoxImportView } from './views/BoxImportView';
import { BoxExportView } from './views/BoxExportView';
import { BoxStockView } from './views/BoxStockView';
import { LabelImportView } from './views/LabelImportView';
import { LabelStockView } from './views/LabelStockView';
import { TransactionHistoryView } from './views/TransactionHistoryView';
import { ReportsExportView } from './views/ReportsExportView';

export type ActiveTab =
    | 'dashboard'
    | 'hop-nhap'
    | 'hop-xuat'
    | 'hop-ton'
    | 'nhan-nhap'
    | 'nhan-ton'
    | 'lichsu'
    | 'baocao';

export const MaterialsLayout = () => {
    const inventory = useMaterialInventory();
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (!inventory.isLoaded) {
        return (
            <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    <p className="text-sm font-medium animate-pulse">Đang tải dữ liệu vật tư...</p>
                </div>
            </div>
        );
    }

    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };

    const navItems = [
        { id: 'dashboard' as ActiveTab, icon: LayoutDashboard, label: 'Dashboard Chung', mod: 'chung' },

        // Hộp Hoa
        { id: 'hop-nhap' as ActiveTab, icon: Box, label: 'Nhập Kho Hộp', mod: 'hop', color: 'amber' },
        { id: 'hop-xuat' as ActiveTab, icon: Package, label: 'Xuất Kho Hộp', mod: 'hop', color: 'amber' },
        { id: 'hop-ton' as ActiveTab, icon: ClipboardList, label: 'Tồn Kho Hộp', mod: 'hop', color: 'amber' },

        // Nhãn
        { id: 'nhan-nhap' as ActiveTab, icon: Tag, label: 'Nhập Kho Nhãn', mod: 'nhan', color: 'orange' },
        { id: 'nhan-ton' as ActiveTab, icon: ClipboardList, label: 'Tồn Kho Nhãn', mod: 'nhan', color: 'orange' },

        // Hệ thống
        { id: 'lichsu' as ActiveTab, icon: ClipboardList, label: 'Lịch Sử Giao Dịch', mod: 'chung', color: 'blue' },
        { id: 'baocao' as ActiveTab, icon: BarChart3, label: 'Báo Cáo & Excel', mod: 'chung', color: 'emerald' },
    ];

    const renderActiveView = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardView inventory={inventory} />;
            case 'hop-nhap': return <BoxImportView inventory={inventory} />;
            case 'hop-xuat': return <BoxExportView inventory={inventory} />;
            case 'hop-ton': return <BoxStockView inventory={inventory} />;
            case 'nhan-nhap': return <LabelImportView inventory={inventory} />;
            case 'nhan-ton': return <LabelStockView inventory={inventory} />;
            case 'lichsu': return <TransactionHistoryView inventory={inventory} />;
            case 'baocao': return <ReportsExportView inventory={inventory} />;
            default: return <DashboardView inventory={inventory} />;
        }
    };

    const getActiveGradient = (mod: string, color?: string) => {
        if (mod === 'hop' || color === 'amber') return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30';
        if (mod === 'nhan' || color === 'orange') return 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30';
        if (color === 'emerald') return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30';
        if (color === 'blue') return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30';
        return 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg shadow-slate-500/30';
    };

    return (
        <div className="flex h-full min-h-[calc(100vh-120px)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/40 dark:border-slate-800/50 shadow-2xl relative">

            {/* Mobile Menu Toggle */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden absolute top-4 left-4 z-50 p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar Overlay (Mobile) */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`
        absolute lg:static inset-y-0 left-0 z-40 w-[280px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-lg border-r border-white/30 dark:border-slate-800/50 flex flex-col transition-transform duration-300 ease-in-out shadow-[10px_0_30px_-15px_rgba(0,0,0,0.1)]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="p-6">
                    <div className="font-black text-xl tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            Vật Tư Hộp
                        </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 tracking-widest uppercase font-bold pl-10">
                        Quản Lý Xuất Nhập Tồn
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 scrollbar-hide">

                    {/* Chung */}
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">
                            Tổng Quan
                        </div>
                        {navItems.filter(i => i.mod === 'chung' && i.id === 'dashboard').map(i => {
                            const Icon = i.icon;
                            const isActive = activeTab === i.id;
                            return (
                                <button
                                    key={i.id}
                                    onClick={() => handleTabChange(i.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all group active:scale-95 mb-1.5 ${isActive
                                        ? getActiveGradient('dashboard')
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-md bg-white/40 dark:bg-slate-800/40 font-medium'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-amber-500'}`} />
                                    <span className="text-sm">{i.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Hộp Hoa */}
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-3">
                            Hộp Làm Hoa
                        </div>
                        {navItems.filter(i => i.mod === 'hop').map(i => {
                            const Icon = i.icon;
                            const isActive = activeTab === i.id;
                            return (
                                <button
                                    key={i.id}
                                    onClick={() => handleTabChange(i.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all group active:scale-95 mb-1.5 ${isActive
                                        ? getActiveGradient('hop')
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-md bg-white/40 dark:bg-slate-800/40 font-medium'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-amber-500 opacity-70 group-hover:opacity-100'}`} />
                                    <span className="text-sm">{i.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Nhãn */}
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-3">
                            Nhãn Mật Ong
                        </div>
                        {navItems.filter(i => i.mod === 'nhan').map(i => {
                            const Icon = i.icon;
                            const isActive = activeTab === i.id;
                            return (
                                <button
                                    key={i.id}
                                    onClick={() => handleTabChange(i.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all group active:scale-95 mb-1.5 ${isActive
                                        ? getActiveGradient('nhan')
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-md bg-white/40 dark:bg-slate-800/40 font-medium'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-orange-500 opacity-70 group-hover:opacity-100'}`} />
                                    <span className="text-sm">{i.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Hệ Thống */}
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">
                            Hệ Thống
                        </div>
                        {navItems.filter(i => i.mod === 'chung' && i.id !== 'dashboard').map(i => {
                            const Icon = i.icon;
                            const isActive = activeTab === i.id;
                            return (
                                <button
                                    key={i.id}
                                    onClick={() => handleTabChange(i.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all group active:scale-95 mb-1.5 ${isActive
                                        ? getActiveGradient('chung', i.color)
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-md bg-white/40 dark:bg-slate-800/40 font-medium'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                                    <span className="text-sm">{i.label}</span>
                                </button>
                            );
                        })}
                    </div>

                </div>

                {/* Footer Settings */}
                <div className="p-5 border-t border-white/30 dark:border-slate-800/50 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-2 block px-1">
                        Kho Đang Xem
                    </div>
                    <select
                        className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-slate-100 px-4 py-3 text-sm font-medium outline-none transition-all focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                        value={inventory.state.gKho}
                        onChange={e => inventory.setGlobalKho(e.target.value)}
                    >
                        <option value="all">Tất cả kho (Chế độ xem chung)</option>
                        {inventory.state.kho.map(k => (
                            <option key={k.id} value={k.id}>Kho: {k.ten}</option>
                        ))}
                    </select>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent relative">
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-20 lg:pt-8 w-full max-w-6xl mx-auto scroll-smooth">
                    {renderActiveView()}
                </div>
            </main>

        </div>
    );
};
