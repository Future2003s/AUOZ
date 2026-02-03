'use client';

import React from 'react';
import { Package, Search, Filter, Menu, Loader2 } from 'lucide-react';

type Props = {
  showSidebar: boolean;
  onToggleSidebar: () => void;
  searchTerm: string;
  onChangeSearchTerm: (value: string) => void;
  isSearchPending: boolean;
};

export function InventoryHeader({
  showSidebar,
  onToggleSidebar,
  searchTerm,
  onChangeSearchTerm,
  isSearchPending,
}: Props) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-amber-50 rounded-xl transition-all lg:hidden active:scale-95"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              HoneyTrack
            </h1>
            <p className="text-xs text-gray-500 font-medium hidden sm:block">Quản lý kho mật ong</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 shrink-0">
        <div className="relative hidden md:block group">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-amber-500 transition-colors pointer-events-none ${
              isSearchPending ? 'opacity-50' : ''
            }`}
          />
          {isSearchPending && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
          )}
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => onChangeSearchTerm(e.target.value)}
            className="pl-11 pr-11 py-2.5 w-64 lg:w-80 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all text-sm placeholder:text-gray-400 shadow-sm hover:shadow-md"
            aria-label="Tìm kiếm sản phẩm"
          />
        </div>
        <button
          className="p-2.5 bg-white/60 backdrop-blur-sm hover:bg-amber-50 border border-gray-200/60 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95"
          aria-label="Bộ lọc"
          title="Bộ lọc"
        >
          <Filter className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
}

