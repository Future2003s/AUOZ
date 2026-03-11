"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  Calendar,
  Edit,
  History,
  PieChart,
  Plus,
  Box,
  Search,
  Trash2,
  User,
  X,
  Filter,
  Save,
  Loader2,
  Scissors,
  MinusCircle
} from "lucide-react";
import { formatDateDDMMYYYY } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

export type FlowerImportLogItem = {
  type: string;
  category?: string;
  quantity: number;
};

export type FlowerImportLog = {
  id: string | number;
  importer: string;
  date: string; // YYYY-MM-DD
  items: FlowerImportLogItem[];
  history: string[];
};

const formatQuantity = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN");

const parseQuantityInput = (value: string) => {
    const numericStr = value.replace(/[^0-9.]/g, '');
    const parts = numericStr.split('.');
    if (parts.length > 2) return Number(parts[0] + '.' + parts.slice(1).join(''));
    return Number(numericStr) || 0;
};

export const FlowerImportTab: React.FC<{
  categories: Record<string, string[]>;
}> = ({ categories }) => {
  const [logs, setLogs] = useState<FlowerImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingLog, setEditingLog] = useState<FlowerImportLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formImporter, setFormImporter] = useState('');
  const [formItems, setFormItems] = useState<FlowerImportLogItem[]>([
    { category: Object.keys(categories)[0] || 'Nơ', type: categories[Object.keys(categories)[0] || 'Nơ']?.[0] || '', quantity: 0 }
  ]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/belllc/flower-imports", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (data?.success && Array.isArray(data.data)) {
        setLogs(data.data);
      }
    } catch (e) {
      console.error("Error fetching flower imports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Lọc dữ liệu
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const itemsMatch = log.items.some((item) =>
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesSearch =
        itemsMatch ||
        log.importer.toLowerCase().includes(searchTerm.toLowerCase());

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

  // --- Modal Functions ---
  const openModal = (log?: FlowerImportLog) => {
    if (log) {
      setModalType('edit');
      setEditingLog(log);
      setFormDate(log.date);
      setFormImporter(log.importer);
      setFormItems([...log.items]);
      setShowHistory(false);
    } else {
      setModalType('add');
      setEditingLog(null);
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormImporter('');
      const firstCat = Object.keys(categories)[0] || '';
      const firstType = categories[firstCat]?.[0] || '';
      setFormItems([{ category: firstCat, type: firstType, quantity: 0 }]);
      setShowHistory(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);
  };

  const updateItem = (index: number, field: keyof FlowerImportLogItem, value: any) => {
    const next = [...formItems];
    next[index] = { ...next[index], [field]: value };
    // if category changes, auto reset type
    if (field === 'category') {
      next[index].type = categories[value as string]?.[0] || '';
    }
    setFormItems(next);
  };

  const addItem = () => {
    // copy values of last item, except quantity=0
    const last = formItems[formItems.length - 1];
    setFormItems([...formItems, { 
      category: last?.category || Object.keys(categories)[0] || '', 
      type: last?.type || categories[Object.keys(categories)[0] || '']?.[0] || '', 
      quantity: 0 
    }]);
  };

  const removeItem = (idx: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const deleteItem = async (id: string | number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phiếu nhập kho này?")) return;
    try {
      const res = await fetch(`/api/belllc/flower-imports/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setLogs(logs.filter((log) => log.id !== id));
      } else {
        alert(data?.message || "Không thể xóa");
      }
    } catch (error) {
       console.error(error);
       alert("Lỗi khi xóa phiếu nhập kho");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formImporter.trim() || formItems.length === 0) {
      alert("Vui lòng nhập ngày, người nhập và ít nhất 1 loại hàng.");
      return;
    }
    
    // validate all rows have quantity > 0
    const invalidItem = formItems.find(i => i.quantity <= 0);
    if (invalidItem) {
      alert("Tất cả các dòng phải có số lượng > 0");
      return;
    }

    setIsSubmitting(true);
    const body = {
      importer: formImporter.trim(),
      date: formDate,
      items: formItems,
    };

    try {
      const url = modalType === 'add' 
        ? "/api/belllc/flower-imports" 
        : `/api/belllc/flower-imports/${editingLog?.id}`;
      const method = modalType === 'add' ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await res.json().catch(() => null);
      if (data?.success) {
        if (modalType === 'add') {
            setLogs([data.data, ...logs]);
        } else {
            setLogs(logs.map(log => log.id === data.data.id ? data.data : log));
        }
        closeModal();
      } else {
        alert(data?.message || "Không thể lưu phiếu nhập kho");
      }
    } catch (error) {
        console.error("Error saving import log:", error);
        alert("Có lỗi xảy ra khi lưu");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm theo người nhập hoặc loại hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 rounded-xl transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex bg-slate-50 dark:bg-slate-800 rounded-xl p-1.5 flex-1 lg:flex-none">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="bg-transparent border-none text-sm px-2 focus:ring-0 w-full lg:w-36 dark:text-slate-200"
                placeholder="Từ ngày"
              />
              <div className="w-px bg-slate-300 dark:bg-slate-600 my-2 mx-1"></div>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="bg-transparent border-none text-sm px-2 focus:ring-0 w-full lg:w-36 dark:text-slate-200"
                placeholder="Đến ngày"
              />
            </div>
            <button
              onClick={() => openModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:shadow-green-500/30"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Thêm Nhập Kho</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <History size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tổng số phiếu</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{filteredLogs.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-xl">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tổng số lượng</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatQuantity(totalItems)}</p>
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-3">Top Nhập Nhiều Nhất</p>
          <div className="flex flex-wrap gap-2">
            {flowerStats.slice(0, 5).map(([type, qty], i) => (
              <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm border border-slate-200 dark:border-slate-700">
                {type}: <strong className="text-slate-900 dark:text-white">{formatQuantity(qty)}</strong>
              </span>
            ))}
            {flowerStats.length === 0 && (
              <span className="text-sm text-slate-400 dark:text-slate-500 italic">Chưa có dữ liệu thống kê</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800 overflow-hidden">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                <p className="text-slate-500">Đang tải dữ liệu...</p>
            </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Box className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Chưa có dữ liệu</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
              Không tìm thấy phiếu nhập kho nào. Vui lòng thêm phiếu mới hoặc thay đổi bộ lọc tìm kiếm.
            </p>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:shadow-blue-500/30"
            >
              <Plus size={18} /> Add Import Log
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6 w-32">Ngày tạo</th>
                  <th className="p-4 w-48">Người nhập</th>
                  <th className="p-4 min-w-[300px]">Chi tiết hàng hóa</th>
                  <th className="p-4 text-center w-32">Tổng C.Lượng</th>
                  <th className="p-4 pr-6 text-right w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredLogs.map((log) => {
                  const total = log.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                      onClick={() => openModal(log)}
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                          <Calendar size={16} className="text-slate-400" />
                          {formatDateDDMMYYYY(log.date)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 w-fit px-3 py-1.5 rounded-lg">
                          <User size={16} />
                          {log.importer}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {log.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 shadow-sm"
                            >
                              <span className="font-semibold">{item.type}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-blue-600 dark:text-blue-400 font-bold">
                                {formatQuantity(item.quantity)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800/50 min-w-[3rem]">
                          {formatQuantity(total)}
                        </span>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(log);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Chỉnh sửa / Xem chi tiết"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(log.id);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Xóa phiếu nhập"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Nhập kho */}
      {isModalOpen && (
          <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[95vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-xl">
                  <Box className="w-5 h-5 text-green-700 dark:text-green-400" />
                </div>
                <h3 className="text-lg sm:text-lg font-bold text-slate-900 dark:text-white">
                  {modalType === 'add' ? 'Tạo Phiếu Nhập Mới' : 'Chỉnh Sửa Phiếu Nhập'}
                </h3>
              </div>
              <div className="flex gap-2">
                {modalType === 'edit' && editingLog && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory((prev) => !prev)}
                    className="px-3 py-2 flex items-center gap-1.5 rounded-full"
                  >
                    <History className="w-4 h-4" />
                    <span>{showHistory ? 'Ẩn lịch sử' : 'Lịch sử'}</span>
                  </Button>
                )}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={closeModal}
                    className="rounded-full flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto p-4 sm:p-6 flex-1">
              <form id="importForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* History Panel (edit mode) */}
                {showHistory && editingLog && editingLog.history?.length > 0 && (
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <History className="w-4 h-4 text-slate-700 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">Lịch sử chỉnh sửa</p>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto text-sm text-slate-700 px-2 py-1 bg-slate-50 rounded-lg">
                        {editingLog.history.map((entry, idx) => (
                          <div key={idx} className="flex items-start gap-2 py-1">
                            <span className="text-slate-400">{idx + 1}.</span>
                            <span>{entry}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Basic Info */}
                <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <DatePicker
                          value={formDate}
                          onChange={(value) => setFormDate(value)}
                          label="Ngày Nhập"
                          required
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Người Nhập <span className="text-rose-500">*</span>
                        </label>
                        <Input 
                          type="text" 
                          required 
                          placeholder="Nhập tên người nhập..." 
                          className="w-full" 
                          value={formImporter} 
                          onChange={e => setFormImporter(e.target.value)} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Items List */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white">
                      Chi Tiết Các Loại Đã Nhập
                    </label>
                    <Button 
                      type="button" 
                      onClick={addItem} 
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-center gap-1.5 font-medium border-slate-200 dark:border-slate-700 rounded-full"
                    >
                      <Plus className="w-3.5 h-3.5" /> <span>Thêm Dòng</span>
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formItems.map((item, index) => (
                      <Card key={index} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <CardContent className="p-4 text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div className="sm:col-span-3">
                              <label className="block text-xs font-medium text-slate-600 mb-1">Nhóm</label>
                              <select 
                                className="w-full px-3 py-2 border-slate-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-800 border" 
                                value={item.category || ''} 
                                onChange={(e) => updateItem(index, 'category', e.target.value)}
                              >
                                {Object.keys(categories).map(cat => (
                                  <option key={cat} value={cat}>
                                    {cat === 'Nơ' ? '🎀' : cat === 'Hoa' ? '🌸' : '📦'} {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-6">
                              <label className="block text-xs font-medium text-slate-600 mb-1">Loại Chi Tiết</label>
                              <select 
                                className="w-full px-3 py-2 border-slate-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-800 border" 
                                value={item.type || ''} 
                                onChange={(e) => updateItem(index, 'type', e.target.value)}
                                disabled={!categories[item.category || ''] || categories[item.category || ''].length === 0}
                              >
                                {(categories[item.category || ''] || []).map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-slate-600 mb-1">Số Lượng</label>
                              <Input 
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                required 
                                className="w-full text-center font-bold" 
                                value={formatQuantity(item.quantity)} 
                                onChange={(e) => updateItem(index, 'quantity', parseQuantityInput(e.target.value))} 
                              />
                            </div>
                            <div className="sm:col-span-1 flex justify-end">
                              <Button 
                                type="button" 
                                onClick={() => removeItem(index)} 
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 text-slate-400 hover:text-rose-600" 
                                disabled={formItems.length === 1}
                              >
                                <MinusCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                Hủy bỏ
              </Button>
              <Button type="submit" form="importForm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Lưu Lại
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
