"use client";
import React, { useMemo, useState } from "react";
import {
  Calendar,
  Edit,
  History,
  PieChart,
  Plus,
  Scissors,
  Search,
  Trash2,
  User,
  X,
  Filter,
} from "lucide-react";

export type FlowerLogItem = {
  type: string;
  category?: string; // ví dụ: "Hoa", "Nơ"
  quantity: number;
};

export type FlowerLog = {
  id: string | number;
  cutter: string;
  date: string; // YYYY-MM-DD
  items: FlowerLogItem[];
  history: string[];
};

const formatQuantity = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN");

export const FlowerLogTab: React.FC<{
  logs: FlowerLog[];
  onAdd: () => void;
  onEdit: (log: FlowerLog) => void;
  onDelete: (id: string | number) => void;
  loading?: boolean;
}> = ({ logs, onAdd, onEdit, onDelete, loading = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Lọc dữ liệu
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const itemsMatch = log.items.some((item) =>
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesSearch =
        itemsMatch ||
        log.cutter.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDateFrom = dateRange.from
        ? log.date >= dateRange.from
        : true;
      const matchesDateTo = dateRange.to ? log.date <= dateRange.to : true;

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [logs, searchTerm, dateRange]);

  // Thống kê
  const flowerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      log.items.forEach((item) => {
        stats[item.type] = (stats[item.type] || 0) + item.quantity;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filteredLogs]);

  const totalItems = useMemo(() => {
    return filteredLogs.reduce(
      (sum, log) =>
        sum + log.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
  }, [filteredLogs]);

  const hasActiveFilters = searchTerm || dateRange.from || dateRange.to;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Action Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm người cắt, loại hoa..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${
              showFilters || hasActiveFilters
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter size={18} />
            <span className="font-medium">Lọc</span>
            {hasActiveFilters && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                {
                  [searchTerm, dateRange.from, dateRange.to].filter(Boolean)
                    .length
                }
              </span>
            )}
          </button>

          {/* Create Button */}
          <button
            onClick={onAdd}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
          >
            <Plus size={20} />
            <span>Tạo Phiếu Mới</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 animate-in slide-in-from-top">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Calendar size={18} className="text-slate-400" />
                <input
                  type="date"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={dateRange.from}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, from: e.target.value })
                  }
                  placeholder="Từ ngày"
                />
              </div>
              <span className="text-slate-400 self-center">-</span>
              <div className="flex items-center gap-2 flex-1">
                <Calendar size={18} className="text-slate-400" />
                <input
                  type="date"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={dateRange.to}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, to: e.target.value })
                  }
                  placeholder="Đến ngày"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDateRange({ from: "", to: "" });
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Panel */}
      {flowerStats.length > 0 && (
        <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-lg border border-slate-200/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <PieChart size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Tổng Hợp Số Liệu
                </h3>
                <p className="text-sm text-slate-500">
                  {filteredLogs.length} phiếu • Tổng {formatQuantity(totalItems)} sản phẩm
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {flowerStats.map(([type, total]) => (
              <div
                key={type}
                className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-100 text-center hover:bg-white hover:shadow-md transition-all cursor-default group"
              >
                <div
                  className="text-xs text-slate-600 truncate mb-2 font-medium"
                  title={type}
                >
                  {type}
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {formatQuantity(total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Thông Tin Phiếu
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Chi Tiết Cắt
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, index) => (
                <tr
                  key={log.id}
                  className="hover:bg-indigo-50/30 transition-colors group"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                        <User size={18} className="text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-800 font-bold mb-1 truncate">
                          {log.cutter}
                        </div>
                        <div className="flex items-center text-slate-500 text-sm mb-2">
                          <Calendar
                            size={14}
                            className="mr-1.5 text-slate-400"
                          />
                          <span>{log.date}</span>
                        </div>
                        {log.history && log.history.length > 0 && (
                          <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md inline-flex items-center gap-1">
                            <History size={10} />
                            <span className="truncate max-w-[200px]">
                              {log.history[log.history.length - 1]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {log.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-gradient-to-r from-slate-50 to-indigo-50/30 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-base flex-shrink-0">
                              {item.category === "Nơ" ? "🎀" : "🌸"}
                            </span>
                            <span className="text-sm text-slate-700 font-medium truncate">
                              {item.type}
                            </span>
                          </div>
                          <span className="font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-md shadow-sm border border-indigo-100 text-sm ml-2 flex-shrink-0">
                            {formatQuantity(item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(log)}
                        disabled={loading}
                        className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(log.id)}
                        disabled={loading}
                        className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-4 bg-slate-100 rounded-full mb-4">
                        <Scissors size={48} className="text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium text-lg mb-1">
                        {logs.length === 0
                          ? "Chưa có phiếu cắt nào"
                          : "Không tìm thấy phiếu cắt nào"}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {logs.length === 0
                          ? "Hãy tạo phiếu đầu tiên để bắt đầu"
                          : "Thử thay đổi bộ lọc để tìm kiếm"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FlowerLogTab;
