"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Filter,
  CreditCard,
  FileText,
  Truck,
  Hash,
  Clock,
  CheckCircle,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface OrderItem {
  id: string;
  buyer: string;
  amount: number;
  date: string;
  isDebt: boolean;
  isInvoice: boolean;
  isShipped: boolean;
  isInvoiceSent?: boolean;
  orderCode?: string;
  orderNumber?: string;
}

interface DashboardNotificationsProps {
  data: OrderItem[];
}

const formatCurrency = (value: number | string) => {
  if (!value) return "0 ₫";
  const number = typeof value === "string" ? parseInt(value.replace(/\D/g, ""), 10) : value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(number);
};

export const DashboardNotifications: React.FC<DashboardNotificationsProps> = ({ data }) => {
  const [filter, setFilter] = useState<"debt" | "invoice" | "shipped">("debt");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Logic lọc dữ liệu
  const filteredList = useMemo(() => {
    return data.filter((item) => {
      // 1. Lọc theo Tab
      let typeMatch = false;
      if (filter === "debt") typeMatch = item.isDebt === true;
      else if (filter === "invoice") typeMatch = item.isInvoice === true;
      else if (filter === "shipped") typeMatch = item.isShipped === true;

      // 2. Lọc theo Tháng
      const itemMonth = item.date.slice(0, 7);
      const monthMatch = itemMonth === selectedMonth;

      return typeMatch && monthMatch;
    });
  }, [data, filter, selectedMonth]);

  // Hàm đếm số lượng cho Badge (theo tháng đang chọn)
  const countBadge = (type: "isDebt" | "isInvoice" | "isShipped") => {
    return data.filter((i) => i[type] && i.date.startsWith(selectedMonth)).length;
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex flex-col h-full overflow-hidden">
      {/* Header Date Filter */}
      <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Filter size={16} className="text-blue-500" />
            Lọc theo tháng:
          </span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none font-medium"
          />
        </div>
      </div>

      {/* Filter Tabs - Responsive Grid */}
      <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 shadow-sm grid grid-cols-3 gap-2 sm:gap-3">
        {/* Tab Công nợ */}
        <button
          onClick={() => setFilter("debt")}
          className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg transition-all border ${
            filter === "debt"
              ? "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <div className="relative">
            <CreditCard size={18} className="sm:w-5 sm:h-5 mb-1" />
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
              {countBadge("isDebt")}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold uppercase">Công nợ</span>
        </button>

        {/* Tab Xuất hoá đơn */}
        <button
          onClick={() => setFilter("invoice")}
          className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg transition-all border ${
            filter === "invoice"
              ? "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <div className="relative">
            <FileText size={18} className="sm:w-5 sm:h-5 mb-1" />
            <span className="absolute -top-1 -right-2 bg-purple-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
              {countBadge("isInvoice")}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold uppercase">Xuất HĐ</span>
        </button>

        {/* Tab Đã gửi */}
        <button
          onClick={() => setFilter("shipped")}
          className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg transition-all border ${
            filter === "shipped"
              ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <div className="relative">
            <Truck size={18} className="sm:w-5 sm:h-5 mb-1" />
            <span className="absolute -top-1 -right-2 bg-green-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
              {countBadge("isShipped")}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold uppercase">Đã gửi</span>
        </button>
      </div>

      {/* Danh sách - Responsive */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 pb-20 sm:pb-24">
        <h3 className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
          Tháng {selectedMonth.split("-")[1]}/{selectedMonth.split("-")[0]} -{" "}
          {filter === "debt"
            ? "Chờ thanh toán"
            : filter === "invoice"
            ? "Cần xuất hoá đơn"
            : "Đơn đã gửi"}
        </h3>

        {filteredList.map((order) => (
          <div
            key={order.id}
            className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2 sm:gap-3"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-sm sm:text-base truncate">
                    {order.buyer}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit">
                  <Hash size={10} />
                  <span className="truncate">{order.orderCode || order.orderNumber || order.id}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="block font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                  {formatCurrency(order.amount)}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {format(new Date(order.date), "dd/MM/yyyy", { locale: vi })}
                </span>
              </div>
            </div>

            <div className="pt-2 sm:pt-3 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between gap-2">
              {filter === "debt" && (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded">
                    <Clock size={12} /> Chưa thanh toán
                  </div>
                  <button className="text-xs font-bold text-white bg-blue-600 dark:bg-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all whitespace-nowrap">
                    Xác nhận thu
                  </button>
                </>
              )}
              {filter === "invoice" && (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                    {order.isInvoiceSent ? (
                      <>
                        <CheckCircle size={12} /> Đã xuất
                      </>
                    ) : (
                      <>
                        <Clock size={12} /> Chờ xuất HĐ
                      </>
                    )}
                  </div>
                  {!order.isInvoiceSent && (
                    <button className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 active:scale-95 transition-all whitespace-nowrap">
                      Đánh dấu
                    </button>
                  )}
                </>
              )}
              {filter === "shipped" && (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                    <Truck size={12} /> Đang giao hàng
                  </div>
                  <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <Calendar size={40} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">
              Không có đơn hàng nào trong tháng {selectedMonth.split("-")[1]}/{selectedMonth.split("-")[0]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

