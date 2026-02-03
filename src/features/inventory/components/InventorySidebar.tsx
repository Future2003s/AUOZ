'use client';

import React from 'react';
import { Package, AlertTriangle, CheckCircle, History, Scale, X } from 'lucide-react';
import type { InventoryItem, InventoryStats } from '@/apiRequests/inventory';

type ViewId = 'all' | 'low' | 'premium' | 'history';

type Props = {
  showSidebar: boolean;
  activeView: ViewId;
  onChangeView: (view: ViewId) => void;
  onCloseMobile: () => void;
  rawInventory: InventoryItem[];
  premiumCount: number;
  stats: InventoryStats;
};

export function InventorySidebar({
  showSidebar,
  activeView,
  onChangeView,
  onCloseMobile,
  rawInventory,
  premiumCount,
  stats,
}: Props) {
  const filterItems = [
    { id: 'all' as const, label: 'Tất cả sản phẩm', count: rawInventory.length, icon: Package },
    { id: 'low' as const, label: 'Cảnh báo tồn kho', count: stats.lowStock, icon: AlertTriangle },
    { id: 'premium' as const, label: 'Sản phẩm cao cấp', count: premiumCount, icon: CheckCircle },
  ];

  return (
    <aside
      className={`${showSidebar ? 'w-72 translate-x-0' : '-translate-x-full'} fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto bg-white/95 lg:bg-white/60 backdrop-blur-xl border-r border-gray-200/50 overflow-hidden transition-all duration-300 flex flex-col shadow-2xl lg:shadow-lg lg:translate-x-0 ${
        !showSidebar ? 'lg:w-0' : ''
      }`}
    >
      <div className="p-4 sm:p-5 space-y-2 flex-1 overflow-y-auto">
        {/* Close button for mobile */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <h2 className="text-lg font-bold text-gray-900">Menu</h2>
          <button
            onClick={onCloseMobile}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Bộ lọc</div>
        {filterItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group active:scale-95 ${
                activeView === item.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 font-medium'
                  : 'text-gray-700 hover:bg-white/80 hover:shadow-md bg-white/40'
              }`}
              aria-pressed={activeView === item.id}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    activeView === item.id ? 'text-white' : 'text-gray-500 group-hover:text-amber-500'
                  }`}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-lg font-bold shrink-0 ${
                  activeView === item.id
                    ? 'bg-white/20 text-white backdrop-blur-sm'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-amber-50 group-hover:text-amber-600'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}

        <div className="mt-6 pt-6 border-t border-gray-200/50">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Nhật ký</div>
          <button
            onClick={() => onChangeView('history')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all group active:scale-95 ${
              activeView === 'history'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 font-medium'
                : 'text-gray-700 hover:bg-white/80 hover:shadow-md bg-white/40'
            }`}
            aria-pressed={activeView === 'history'}
          >
            <History
              className={`w-5 h-5 shrink-0 ${
                activeView === 'history' ? 'text-white' : 'text-gray-500 group-hover:text-blue-500'
              }`}
            />
            <span className="text-sm font-medium">Lịch sử Xuất/Nhập</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 border-t border-gray-200/50 bg-gradient-to-br from-white/80 to-gray-50/50 backdrop-blur-sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 sm:mb-4 px-2">Tổng quan</h3>
        <div className="space-y-2.5 sm:space-y-3">
          <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-3 sm:p-4 shadow-md border border-green-100/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Tổng số lọ</p>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {stats.totalJars.toLocaleString('vi-VN')}{' '}
              <span className="text-xs sm:text-sm text-gray-500">lọ</span>
            </p>
            <div className="h-1.5 sm:h-2 w-full bg-green-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl p-3 sm:p-4 shadow-md border border-amber-100/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Tổng khối lượng</p>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {stats.totalWeightKg} <span className="text-xs sm:text-sm text-gray-500">kg</span>
            </p>
            <div className="h-1.5 sm:h-2 w-full bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-3 sm:p-4 shadow-md border border-blue-100/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Tổng giá trị</p>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {(stats.totalValue / 1000000).toFixed(1)}M <span className="text-xs sm:text-sm text-gray-500">₫</span>
            </p>
            <div className="h-1.5 sm:h-2 w-full bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-pulse"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

