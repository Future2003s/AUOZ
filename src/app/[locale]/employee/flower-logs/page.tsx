'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  X,
  Save,
  Scissors,
  History,
  Calendar,
  User,
  PieChart,
  MinusCircle,
  Loader2,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// ==========================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU
// ==========================================
interface FlowerLogItem {
  category: string;
  type: string;
  quantity: number;
}

interface FlowerLog {
  id: string;
  date: string;
  cutter: string;
  items: FlowerLogItem[];
  history: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Default categories và types (fallback nếu API chưa có dữ liệu)
const DEFAULT_FLOWER_CATEGORIES: Record<string, string[]> = {
  "Nơ": ["Nơ Đại Đỏ", "Nơ Đại Đen", "Nơ Trung Đỏ", "Nơ Trung Đen", "Nơ Nhỏ Đỏ", "Nơ Nhỏ Đen"],
  "Hoa": ["Hoa Đại Đỏ", "Hoa Đại Trắng", "Hoa Trung Đỏ", "Hoa Trung Trắng", "Hoa Nhỏ Đỏ", "Hoa Nhỏ Trắng","Hoa Satin"]
};

// Chuẩn hóa item để tránh quantity dạng string từ backend
const normalizeItems = (items: FlowerLogItem[]): FlowerLogItem[] =>
  (items || []).map((item) => ({
    ...item,
    // Giữ số không âm, backend đã validate min=0
    quantity: Math.max(0, Number(item.quantity) || 0),
  }));

// Helpers để format / parse số lượng hiển thị có dấu chấm
const formatQuantity = (value: number) => {
  if (!value) return "";
  return Number(value).toLocaleString("vi-VN");
};

const parseQuantityInput = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return 0;
  const parsed = parseInt(digitsOnly, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Tạo chuỗi lịch sử: nêu rõ thay đổi từ bao nhiêu -> bao nhiêu
const buildHistoryEntry = (oldLog: FlowerLog | null, newItems: FlowerLogItem[], editorName?: string) => {
  const timeString = getCurrentDateTimeString();
  const actor = editorName ? ` (${editorName})` : "";
  if (!oldLog) return `Tạo mới: ${timeString}${actor}`;

  const formatItemKey = (item: FlowerLogItem) => `${item.category || ''}::${item.type}`;
  const oldMap = new Map<string, number>();
  const newMap = new Map<string, number>();

  (oldLog.items || []).forEach((i) => oldMap.set(formatItemKey(i), Number(i.quantity) || 0));
  (newItems || []).forEach((i) => newMap.set(formatItemKey(i), Number(i.quantity) || 0));

  const allKeys = new Set([...oldMap.keys(), ...newMap.keys()]);
  const changes: string[] = [];

  allKeys.forEach((key) => {
    const [category, type] = key.split("::");
    const oldQty = oldMap.get(key) ?? 0;
    const newQty = newMap.get(key) ?? 0;
    if (oldQty !== newQty) {
      const prefix = category ? `${category} - ${type}` : type;
      changes.push(`${prefix}: ${oldQty} -> ${newQty}`);
    }
  });

  if (changes.length === 0) return `Sửa: ${timeString}${actor}`;
  return `Sửa: ${timeString}${actor} | ${changes.join("; ")}`;
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const getCurrentDateTimeString = () => {
  const now = new Date();
  return `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

// ==========================================
// FLOWER LOG DETAILS MODAL
// ==========================================
const FlowerLogDetailsModal = ({
  log,
  onClose,
  onEdit,
  onDelete,
}: {
  log: FlowerLog | null;
  onClose: () => void;
  onEdit: (log: FlowerLog) => void;
  onDelete: (id: string) => void;
}) => {
  if (!log) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0">
                <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                  Chi tiết phiếu
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                  {log.cutter} • {formatDate(log.date)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(log)}
              className="hidden sm:flex rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <Edit className="w-4 h-4 mr-2" />
              Sửa
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDelete(log.id)}
              className="hidden sm:flex rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Đóng"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto p-3 sm:p-4 md:p-6 flex-1 space-y-4">
          <Card className="bg-sky-50/70 dark:bg-slate-900 border border-sky-100 dark:border-sky-900/40 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-700 dark:text-sky-300" />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Người cắt</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{log.cutter}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-700 dark:text-sky-300" />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Ngày</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{formatDate(log.date)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Chi tiết cắt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {log.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/30 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">
                      {item.category === "Nơ" ? "🎀" : item.category === "Hoa" ? "🌸" : "📦"}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.type}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.category}</div>
                    </div>
                  </div>
                  <Badge className="bg-blue-600 dark:bg-blue-500 text-white font-bold px-2.5 py-0.5 rounded-full text-xs">
                    {formatQuantity(item.quantity)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {log.history?.length > 0 && (
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  Lịch sử
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {log.history.map((entry, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/30 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">{idx + 1}.</span>
                    {entry}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="sm:hidden px-3 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 shrink-0 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onEdit(log)}
            className="flex-1 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <Edit className="w-4 h-4 mr-2" />
            Sửa
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onDelete(log.id)}
            className="flex-1 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// EDITABLE TYPE ITEM COMPONENT
// ==========================================
const EditableTypeItem = ({ 
  typeName, 
  onUpdate, 
  onRemove,
  canRemove 
}: { 
  typeName: string;
  onUpdate: (oldName: string, newName: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) => {
  const [editingValue, setEditingValue] = useState(typeName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditingValue(typeName);
  }, [typeName]);

  const handleBlur = () => {
    if (editingValue.trim() && editingValue.trim() !== typeName) {
      onUpdate(typeName, editingValue.trim());
    } else {
      setEditingValue(typeName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      setEditingValue(typeName);
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
      <Input
        ref={inputRef}
        type="text"
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="flex-1 text-xs sm:text-sm bg-white dark:bg-slate-800"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
        disabled={!canRemove}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

// ==========================================
// FLOWER LOG CARD COMPONENT (Mobile View)
// ==========================================
const FlowerLogCard = ({ 
  log, 
  onView,
  onEdit, 
  onDelete 
}: { 
  log: FlowerLog;
  onView: (log: FlowerLog) => void;
  onEdit: (log: FlowerLog) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <Card
      className="bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-sky-900/50 shadow-sm hover:shadow-md transition-shadow duration-200 group rounded-2xl cursor-pointer"
      onClick={() => onView(log)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onView(log);
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-sky-50 dark:bg-slate-800 rounded-xl">
                <User className="w-4 h-4 text-sky-700 dark:text-sky-300" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{log.cutter}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {formatDate(log.date)}
                </div>
              </div>
            </div>
            {log.history && log.history.length > 0 && (
              <div className="inline-flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-slate-950 px-2 py-1 rounded-full border border-sky-200/70 dark:border-sky-900/60">
                <History className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{log.history[log.history.length - 1]}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(log);
              }}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(log.id);
              }}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {log.items.map((item, idx) => (
            <div 
              key={idx} 
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 group-hover:border-sky-300/80 dark:group-hover:border-sky-700/80"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg flex-shrink-0">
                  {item.category === 'Nơ' ? '🎀' : item.category === 'Hoa' ? '🌸' : '📦'}
                </span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.type}</span>
              </div>
              <Badge className="ml-2 bg-blue-600 dark:bg-blue-500 text-white font-bold px-2.5 py-0.5 rounded-full text-xs flex-shrink-0">
                {formatQuantity(item.quantity)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ==========================================
// FLOWER LOG TAB COMPONENT
// ==========================================
const FlowerLogTab = ({ 
  logs, 
  onAdd, 
  onView,
  onEdit, 
  onDelete,
  loading,
  onRefresh
}: { 
  logs: FlowerLog[], 
  onAdd: () => void, 
  onView: (log: FlowerLog) => void,
  onEdit: (log: FlowerLog) => void, 
  onDelete: (id: string) => void,
  loading: boolean,
  onRefresh: () => void
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const getStatColorClasses = (key: string) => {
    // Deterministic pastel palette based on key
    const palette = [
      "bg-sky-50 border-sky-200/80 text-sky-900 dark:bg-sky-950/25 dark:border-sky-900/60 dark:text-sky-100",
      "bg-emerald-50 border-emerald-200/80 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-100",
      "bg-amber-50 border-amber-200/80 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-100",
      "bg-rose-50 border-rose-200/80 text-rose-900 dark:bg-rose-950/20 dark:border-rose-900/60 dark:text-rose-100",
      "bg-violet-50 border-violet-200/80 text-violet-900 dark:bg-violet-950/20 dark:border-violet-900/60 dark:text-violet-100",
      "bg-cyan-50 border-cyan-200/80 text-cyan-900 dark:bg-cyan-950/20 dark:border-cyan-900/60 dark:text-cyan-100",
    ];
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const itemsMatch = log.items.some(item => 
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesSearch = itemsMatch || log.cutter.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDateFrom = dateRange.from ? log.date >= dateRange.from : true;
      const matchesDateTo = dateRange.to ? log.date <= dateRange.to : true;
      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [logs, searchTerm, dateRange]);

  const flowerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredLogs.forEach(log => {
      log.items.forEach(item => {
        stats[item.type] = (stats[item.type] || 0) + item.quantity;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filteredLogs]);

  // Auto-detect view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setViewMode('table');
      } else {
        setViewMode('grid');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 z-10" size={18} />
          <Input 
            type="text" 
            placeholder="Tìm kiếm (người cắt, loại, nhóm)…" 
            className="w-full pl-11 pr-4 py-2.5 text-sm sm:text-base bg-slate-100 dark:bg-slate-900 border border-transparent rounded-full focus:bg-white dark:focus:bg-slate-900 focus:border-slate-200 dark:focus:border-slate-700 focus:ring-2 focus:ring-blue-500/30 transition-all"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 text-xs sm:text-sm rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            size="sm"
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Lọc</span>
          </Button>
          <Button
            variant="outline"
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 text-xs sm:text-sm rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            size="sm"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
          <Button 
            onClick={onAdd} 
            className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white items-center gap-2 px-4 text-xs sm:text-sm rounded-full shadow-sm hover:shadow-md transition-all whitespace-nowrap"
            size="sm"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Tạo phiếu</span>
          </Button>
        </div>
      </div>

      {/* Mobile FAB */}
      <Button
        onClick={onAdd}
        className="sm:hidden fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        size="icon"
        aria-label="Tạo phiếu"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-in slide-in-from-top-2 duration-200 rounded-2xl">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Khoảng thời gian</label>
              <div className="w-full">
                <DateRangePicker
                  value={{
                    from: dateRange.from || undefined,
                    to: dateRange.to || undefined
                  }}
                  onChange={(value) => setDateRange({
                    from: value.from || '',
                    to: value.to || ''
                  })}
                  placeholder="Chọn khoảng ngày"
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Panel */}
      {flowerStats.length > 0 && (
        <Card className="bg-sky-50/80 dark:bg-slate-900 border border-sky-100 dark:border-sky-900/40 shadow-sm rounded-2xl">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
              <div className="p-2 bg-white/80 dark:bg-slate-900 rounded-xl border border-sky-100/70 dark:border-sky-900/60">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-sky-700 dark:text-sky-300" />
              </div>
              <span>Tổng Hợp Số Liệu</span>
              <Badge variant="outline" className="text-xs rounded-full border-sky-200 text-sky-800 bg-white/80">
                {filteredLogs.length} phiếu
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {flowerStats.map(([type, total]) => (
                <div 
                  key={type} 
                  className={cn(
                    "p-2.5 sm:p-3 md:p-4 rounded-2xl border text-center hover:shadow-sm transition-all duration-200 cursor-default group",
                    getStatColorClasses(type)
                  )}
                >
                  <div className="text-[10px] xs:text-xs font-medium truncate mb-1 sm:mb-2 px-1 opacity-80" title={type}>
                    {type}
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold group-hover:scale-105 transition-transform">
                {formatQuantity(total)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400 px-1">
        <span className="truncate">
          Tìm thấy <strong className="text-slate-900 dark:text-white">{filteredLogs.length}</strong> phiếu
          {searchTerm && (
            <span className="hidden xs:inline">
              {` cho "${searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}"`}
            </span>
          )}
        </span>
      </div>

      {/* Data Display - Grid View (Mobile) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredLogs.map((log) => (
            <FlowerLogCard 
              key={log.id}
              log={log}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {filteredLogs.length === 0 && (
            <div className="col-span-full">
              <Card className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700">
                <CardContent className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full">
                      <Scissors className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        Không tìm thấy phiếu nào
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {searchTerm || dateRange.from || dateRange.to 
                          ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                          : 'Bắt đầu bằng cách tạo phiếu cắt hoa mới'}
                      </p>
                    </div>
                    {!searchTerm && !dateRange.from && !dateRange.to && (
                      <Button onClick={onAdd} className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo Phiếu Đầu Tiên
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Data Display - Table View (Desktop) */}
      {viewMode === 'table' && (
        <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-200">
                  <tr>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] xs:text-xs font-bold uppercase tracking-wider">Thông Tin Phiếu</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] xs:text-xs font-bold uppercase tracking-wider">Chi Tiết Cắt</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-[10px] xs:text-xs font-bold uppercase tracking-wider">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-colors group cursor-pointer"
                      onClick={() => onView(log)}
                    >
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 align-top min-w-[180px]">
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0">
                              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-200" />
                            </div>
                            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">{log.cutter}</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                            <span>{formatDate(log.date)}</span>
                          </div>
                          {log.history && log.history.length > 0 && (
                            <div className="inline-flex items-center gap-1 text-[10px] xs:text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30 px-2 py-1 rounded-full max-w-full border border-slate-200/70 dark:border-slate-800">
                              <History className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                              <span className="truncate max-w-[150px] sm:max-w-[200px]">{log.history[log.history.length - 1]}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 align-top min-w-[200px]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                          {log.items.map((item, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/30 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
                            >
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                <span className="text-sm sm:text-base flex-shrink-0">
                                  {item.category === 'Nơ' ? '🎀' : item.category === 'Hoa' ? '🌸' : '📦'}
                                </span>
                                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.type}</span>
                              </div>
                              <Badge className="ml-1.5 sm:ml-2 bg-blue-600 dark:bg-blue-500 text-white font-bold px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] xs:text-xs flex-shrink-0">
                                {formatQuantity(item.quantity)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right align-top">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(log);
                            }} 
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all" 
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(log.id);
                            }} 
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all" 
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 sm:px-6 py-12 sm:py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                        <div className="p-3 sm:p-4 bg-slate-100 dark:bg-slate-700 rounded-full">
                          <Scissors className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div className="px-4">
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1">
                            Không tìm thấy phiếu nào
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {searchTerm || dateRange.from || dateRange.to 
                              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                              : 'Bắt đầu bằng cách tạo phiếu cắt hoa mới'}
                          </p>
                        </div>
                        {!searchTerm && !dateRange.from && !dateRange.to && (
                          <Button onClick={onAdd} size="sm" className="mt-2 sm:mt-4 text-xs sm:text-sm">
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            Tạo Phiếu Đầu Tiên
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function FlowerLogsPage() {
  const { user } = useAuth();
  const [flowerLogs, setFlowerLogs] = useState<FlowerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailsLog, setDetailsLog] = useState<FlowerLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingFlowerLog, setEditingFlowerLog] = useState<FlowerLog | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  
  // Dynamic categories state
  const [flowerCategories, setFlowerCategories] = useState<Record<string, string[]>>(DEFAULT_FLOWER_CATEGORIES);
  const [catalogLoading, setCatalogLoading] = useState(false);
  
  // Form State
  const [flowerFormDate, setFlowerFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [flowerFormCutter, setFlowerFormCutter] = useState('');
  const [flowerFormItems, setFlowerFormItems] = useState<FlowerLogItem[]>([
    { category: Object.keys(flowerCategories)[0] || 'Nơ', type: flowerCategories[Object.keys(flowerCategories)[0] || 'Nơ']?.[0] || '', quantity: 0 }
  ]);
  
  const fetchFlowerCatalog = async () => {
    try {
      setCatalogLoading(true);
      const res = await fetch("/api/belllc/flower-logs/catalog", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      const categories = data?.data?.categories;
      if (categories && typeof categories === "object") {
        setFlowerCategories(categories);
        return categories as Record<string, string[]>;
      }
    } catch (e) {
      console.error("Error fetching flower catalog:", e);
    } finally {
      setCatalogLoading(false);
    }
    setFlowerCategories(DEFAULT_FLOWER_CATEGORIES);
    return DEFAULT_FLOWER_CATEGORIES;
  };

  const saveFlowerCatalog = async (categories: Record<string, string[]>) => {
    const res = await fetch("/api/belllc/flower-logs/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ categories }),
    });
    const data = await res.json().catch(() => null);
    if (!data?.success) {
      throw new Error(data?.message || "Không thể lưu danh sách nhóm/loại");
    }
    const updated = data?.data?.categories;
    if (updated && typeof updated === "object") {
      setFlowerCategories(updated);
      return updated as Record<string, string[]>;
    }
    setFlowerCategories(categories);
    return categories;
  };

  // Load categories on mount
  useEffect(() => {
    fetchFlowerCatalog();
  }, []);

  // Fetch flower logs from backend via Next.js API route
  const fetchFlowerLogs = async () => {
    try {
      setLoading(true);
      
      // Use Next.js API route instead of direct backend call to avoid CORS/cookie issues
      const response = await fetch(`/api/belllc/flower-logs?page=1&size=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies for authentication
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        const logs = Array.isArray(data.data) ? data.data : [];
        // Đảm bảo quantity là number để tránh hiển thị 0 đầu
        const normalizedLogs = logs.map((log: FlowerLog) => ({
          ...log,
          items: normalizeItems(log.items),
        }));
        setFlowerLogs(normalizedLogs);
      } else {
        console.error('Failed to fetch flower logs:', data.message);
        setFlowerLogs([]);
      }
    } catch (error) {
      console.error('Error fetching flower logs:', error);
      setFlowerLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlowerLogs();
  }, []);

  // Handlers
  const handleFlowerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowerFormCutter || !flowerFormDate || flowerFormItems.length === 0) return;

    setIsSubmitting(true);

    const editorName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.lastName || user?.email || undefined;

    const historyEntry = editingFlowerLog 
      ? [...editingFlowerLog.history, buildHistoryEntry(editingFlowerLog, flowerFormItems, editorName)]
      : [buildHistoryEntry(null, flowerFormItems, editorName)];

    try {
      // Use Next.js API route instead of direct backend call
      const url = editingFlowerLog 
        ? `/api/belllc/flower-logs/${editingFlowerLog.id}`
        : `/api/belllc/flower-logs`;
      
      const method = editingFlowerLog ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies for authentication
        body: JSON.stringify({
          cutter: flowerFormCutter,
          date: flowerFormDate,
          items: flowerFormItems,
          history: historyEntry
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsModalOpen(false);
        fetchFlowerLogs();
        // Reset form
        const firstCategory = Object.keys(flowerCategories)[0] || "Nơ";
        const firstType = flowerCategories[firstCategory]?.[0] || "";
        setFlowerFormDate(new Date().toISOString().split('T')[0]);
        setFlowerFormCutter('');
        setFlowerFormItems([{ category: firstCategory, type: firstType, quantity: 0 }]);
        setEditingFlowerLog(null);
      } else {
        alert('Lỗi: ' + (data.message || 'Không thể lưu phiếu'));
      }
    } catch (error) {
      console.error('Error saving flower log:', error);
      alert('Lỗi khi lưu phiếu cắt hoa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFlowerModal = async (log?: FlowerLog) => {
    // Refresh catalog when opening modal so manager uses latest server data
    const categories = await fetchFlowerCatalog();
    
    if (log) {
      setModalType('edit');
      setEditingFlowerLog(log);
      setFlowerFormDate(log.date);
      setFlowerFormCutter(log.cutter);
      setFlowerFormItems(normalizeItems(log.items.map(i => ({...i}))));
      setShowHistory(false);
    } else {
      setModalType('add');
      setEditingFlowerLog(null);
      setFlowerFormDate(new Date().toISOString().split('T')[0]);
      setFlowerFormCutter(user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '');
      const firstCategory = Object.keys(categories)[0] || "Nơ";
      const firstType = categories[firstCategory]?.[0] || "";
      setFlowerFormItems([{ category: firstCategory, type: firstType, quantity: 0 }]);
      setShowHistory(false);
    }
    setIsModalOpen(true);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa phiếu này?')) return;

    try {
      // Use Next.js API route instead of direct backend call
      const response = await fetch(`/api/belllc/flower-logs/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies for authentication
      });

      const data = await response.json();
      
      if (data.success) {
        fetchFlowerLogs();
      } else {
        alert('Lỗi: ' + (data.message || 'Không thể xóa phiếu'));
      }
    } catch (error) {
      console.error('Error deleting flower log:', error);
      alert('Lỗi khi xóa phiếu cắt hoa');
    }
  };

  const openDetails = (log: FlowerLog) => {
    setDetailsLog(log);
  };

  const closeDetails = () => {
    setDetailsLog(null);
  };

  // Form helpers
  const addFlowerItem = () => {
    const firstCategory = Object.keys(flowerCategories)[0] || 'Nơ';
    const firstType = flowerCategories[firstCategory]?.[0] || '';
    setFlowerFormItems([...flowerFormItems, { category: firstCategory, type: firstType, quantity: 0 }]);
    // Tự động scroll đến dòng mới sau khi thêm
    setTimeout(() => {
      const lastCard = document.querySelector('[data-flower-item]:last-child');
      if (lastCard) {
        lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };
  const removeFlowerItem = (idx: number) => { 
    if(flowerFormItems.length > 1) setFlowerFormItems(flowerFormItems.filter((_, i) => i !== idx)); 
  };
  const updateFlowerItem = (idx: number, field: keyof FlowerLogItem, value: unknown) => {
    const newItems = [...flowerFormItems];
    const item = { ...newItems[idx], [field]: value };
    if (field === 'category') {
      const category = typeof value === "string" ? value : "";
      const firstType = flowerCategories[category]?.[0] || '';
      item.type = firstType;
    }
    if (field === "type") {
      item.type = typeof value === "string" ? value : "";
    }
    if (field === "quantity") {
      item.quantity = typeof value === "number" ? value : Number(value) || 0;
    }
    newItems[idx] = item;
    setFlowerFormItems(newItems);
  };
  
  // Category management handlers
  const handleAddCategory = async (categoryName: string) => {
    const name = categoryName.trim();
    if (!name) return;
    const next = { ...flowerCategories };
    if (!next[name]) next[name] = ["Mặc định"];
    setFlowerCategories(next);
    try {
      await saveFlowerCatalog(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không thể lưu nhóm mới");
      fetchFlowerCatalog();
    }
  };
  
  const handleRemoveCategory = async (categoryName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa nhóm "${categoryName}"? Tất cả các loại trong nhóm này cũng sẽ bị xóa.`)) return;
    const next = { ...flowerCategories };
    delete next[categoryName];
    // Must keep at least 1 category on server validation
    if (Object.keys(next).length === 0) {
      alert("Phải còn ít nhất 1 nhóm.");
      return;
    }
    setFlowerCategories(next);
    // Update form items if they use this category
    const newItems = flowerFormItems.filter(item => item.category !== categoryName);
    if (newItems.length === 0) {
      const firstCategory = Object.keys(next)[0] || '';
      const firstType = next[firstCategory]?.[0] || '';
      setFlowerFormItems([{ category: firstCategory, type: firstType, quantity: 0 }]);
    } else {
      setFlowerFormItems(newItems);
    }
    try {
      await saveFlowerCatalog(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không thể lưu thay đổi");
      fetchFlowerCatalog();
    }
  };
  
  const handleAddType = async (categoryName: string, typeName: string) => {
    const t = typeName.trim();
    if (!t) return;
    const next = { ...flowerCategories };
    const arr = Array.isArray(next[categoryName]) ? [...next[categoryName]] : [];
    if (!arr.includes(t)) arr.push(t);
    // server requires at least 1 type
    if (arr.length === 0) arr.push("Mặc định");
    next[categoryName] = arr;
    setFlowerCategories(next);
    try {
      await saveFlowerCatalog(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không thể lưu loại mới");
      fetchFlowerCatalog();
    }
  };
  
  const handleRemoveType = async (categoryName: string, typeName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa loại "${typeName}"?`)) return;
    const next = { ...flowerCategories };
    const arr = (next[categoryName] || []).filter((t) => t !== typeName);
    // keep at least 1 type to satisfy backend validation
    if (arr.length === 0) {
      alert("Mỗi nhóm phải còn ít nhất 1 loại.");
      return;
    }
    next[categoryName] = arr;
    setFlowerCategories(next);
    // Update form items if they use this type
    const newItems = flowerFormItems.map(item => {
      if (item.category === categoryName && item.type === typeName) {
        return { ...item, type: arr[0] || '' };
      }
      return item;
    });
    setFlowerFormItems(newItems);
    try {
      await saveFlowerCatalog(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không thể lưu thay đổi");
      fetchFlowerCatalog();
    }
  };
  
  const handleUpdateType = async (categoryName: string, oldTypeName: string, newTypeName: string) => {
    const nn = newTypeName.trim();
    if (!nn) return;
    const next = { ...flowerCategories };
    const arr = Array.isArray(next[categoryName]) ? [...next[categoryName]] : [];
    const idx = arr.indexOf(oldTypeName);
    if (idx !== -1) arr[idx] = nn;
    next[categoryName] = arr;
    setFlowerCategories(next);
    // Update form items if they use this type
    const newItems = flowerFormItems.map(item => {
      if (item.category === categoryName && item.type === oldTypeName) {
        return { ...item, type: nn };
      }
      return item;
    });
    setFlowerFormItems(newItems);
    try {
      await saveFlowerCatalog(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không thể lưu thay đổi");
      fetchFlowerCatalog();
    }
  };

  return (
    <div className="pt-3 sm:pt-5 pb-6 bg-gradient-to-b from-sky-50/70 via-slate-50 to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      {/* Flower Log Tab */}
      <FlowerLogTab 
        logs={flowerLogs} 
        onAdd={() => openFlowerModal()} 
        onView={openDetails}
        onEdit={openFlowerModal} 
        onDelete={deleteItem}
        loading={loading}
        onRefresh={fetchFlowerLogs}
      />

      <FlowerLogDetailsModal
        log={detailsLog}
        onClose={closeDetails}
        onEdit={(log) => {
          closeDetails();
          openFlowerModal(log);
        }}
        onDelete={(id) => {
          closeDetails();
          deleteItem(id);
        }}
      />

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
            {/* Modal Header */}
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0">
                  <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate">
                  {modalType === 'add' ? 'Tạo Phiếu Cắt Hoa Mới' : 'Chỉnh Sửa Phiếu Cắt Hoa'}
                </h3>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCategoryManager((prev) => !prev)}
                  className="px-3 py-2 text-xs sm:text-sm flex items-center gap-1.5 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showCategoryManager ? 'Đóng quản lý' : 'Quản lý loại'}</span>
                </Button>
                {modalType === 'edit' && editingFlowerLog && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory((prev) => !prev)}
                    className="px-3 py-2 text-xs sm:text-sm flex items-center gap-1.5 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <History className="w-4 h-4" />
                    <span>{showHistory ? 'Ẩn lịch sử' : 'Lịch sử'}</span>
                  </Button>
                )}
              </div>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)} 
                className="h-9 w-9 p-0 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto p-3 sm:p-4 md:p-6 flex-1">
              <form id="mainForm" onSubmit={handleFlowerSubmit} className="space-y-4 sm:space-y-6">
                {/* Category Manager Panel */}
                {showCategoryManager && (
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <div className="p-1.5 bg-green-600 dark:bg-green-500 rounded-lg">
                          <Plus className="w-4 h-4 text-white" />
                        </div>
                        <span>Quản Lý Nhóm & Loại</span>
                        {catalogLoading && (
                          <Badge variant="outline" className="text-xs">
                            Đang tải...
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Add New Category */}
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Thêm Nhóm Mới
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Tên nhóm mới (vd: Lá, Nhánh...)"
                            className="flex-1 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.currentTarget;
                                handleAddCategory(input.value);
                                input.value = '';
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              if (input) {
                                handleAddCategory(input.value);
                                input.value = '';
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Categories List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {Object.entries(flowerCategories).map(([categoryName, types]) => (
                          <Card key={categoryName} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                                  <span>{categoryName === 'Nơ' ? '🎀' : categoryName === 'Hoa' ? '🌸' : '📦'}</span>
                                  <span>{categoryName}</span>
                                </CardTitle>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveCategory(categoryName)}
                                  className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  disabled={Object.keys(flowerCategories).length === 1}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {/* Add Type to Category */}
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  placeholder={`Thêm loại vào ${categoryName}...`}
                                  className="flex-1 text-xs sm:text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const input = e.currentTarget;
                                      handleAddType(categoryName, input.value);
                                      input.value = '';
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                    if (input) {
                                      handleAddType(categoryName, input.value);
                                      input.value = '';
                                    }
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  size="sm"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>

                              {/* Types List */}
                              <div className="space-y-1.5">
                                {types.map((typeName, typeIdx) => (
                                  <EditableTypeItem
                                    key={`${categoryName}-${typeIdx}-${typeName}`}
                                    typeName={typeName}
                                    onUpdate={(oldName, newName) => handleUpdateType(categoryName, oldName, newName)}
                                    onRemove={() => handleRemoveType(categoryName, typeName)}
                                    canRemove={types.length > 1}
                                  />
                                ))}
                                {types.length === 0 && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center py-2">
                                    Chưa có loại nào. Thêm loại ở trên.
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* History Panel (edit mode, toggle) */}
                {showHistory && editingFlowerLog && editingFlowerLog.history?.length > 0 && (
                  <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <CardContent className="p-3 sm:p-4 md:p-5">
                      <div className="flex items-start gap-2 mb-2">
                        <History className="w-4 h-4 text-slate-700 dark:text-slate-200 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Lịch sử chỉnh sửa</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Hiển thị đầy đủ các mốc tạo/sửa của phiếu này
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {editingFlowerLog.history.map((entry, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 px-2.5 py-2 rounded-lg border border-slate-100 dark:border-slate-700"
                          >
                            <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{idx + 1}.</span>
                            <span className="leading-tight">{entry}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Basic Info */}
                <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-3 sm:p-4 md:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <DatePicker
                          value={flowerFormDate}
                          onChange={(value) => setFlowerFormDate(value)}
                          label="Ngày Cắt"
                          required
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Người Cắt <span className="text-rose-500">*</span>
                        </label>
                        <Input 
                          type="text" 
                          required 
                          placeholder="Nhập tên người cắt..." 
                          className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 transition-all" 
                          value={flowerFormCutter} 
                          onChange={e => setFlowerFormCutter(e.target.value)} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Items List */}
                <div>
                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-0 mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Chi Tiết Các Loại Đã Cắt
                    </label>
                    <Button 
                      type="button" 
                      onClick={addFlowerItem} 
                      variant="outline"
                      size="sm"
                      className="text-[10px] xs:text-xs flex items-center gap-1 sm:gap-1.5 font-medium text-blue-700 hover:text-blue-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 px-2 sm:px-3 rounded-full"
                    >
                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="whitespace-nowrap">Thêm Dòng</span>
                    </Button>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {flowerFormItems.map((item, index) => (
                      <Card 
                        key={index} 
                        data-flower-item
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 animate-in slide-in-from-left-2 duration-200"
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-end">
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] xs:text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5">Nhóm</label>
                              <select 
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-800 transition-all" 
                                value={item.category || ''} 
                                onChange={(e) => updateFlowerItem(index, 'category', e.target.value)}
                              >
                                {Object.keys(flowerCategories).map(cat => (
                                  <option key={cat} value={cat}>
                                    {cat === 'Nơ' ? '🎀' : cat === 'Hoa' ? '🌸' : '📦'} {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] xs:text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5">Loại Chi Tiết</label>
                              <select 
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-800 transition-all" 
                                value={item.type || ''} 
                                onChange={(e) => updateFlowerItem(index, 'type', e.target.value)}
                                disabled={!flowerCategories[item.category || ''] || flowerCategories[item.category || ''].length === 0}
                              >
                                {(flowerCategories[item.category || ''] || []).map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] xs:text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5">Số Lượng</label>
                              <Input 
                                type="text"
                                inputMode="numeric"
                                // Cho phép dấu chấm phân tách nghìn vì value được format
                                pattern="[0-9\\.]*"
                                required 
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-center border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-800" 
                                value={formatQuantity(item.quantity)} 
                                onChange={(e) => updateFlowerItem(index, 'quantity', parseQuantityInput(e.target.value))} 
                              />
                            </div>
                            <div className="sm:col-span-1 flex justify-end">
                              <Button 
                                type="button" 
                                onClick={() => removeFlowerItem(index)} 
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all" 
                                disabled={flowerFormItems.length === 1}
                                title="Xóa dòng"
                              >
                                <MinusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {/* Nút Thêm Dòng ở cuối danh sách */}
                    <div className="flex justify-center pt-2">
                      <Button 
                        type="button" 
                        onClick={addFlowerItem} 
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm flex items-center gap-2 font-medium text-blue-700 hover:text-blue-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full"
                      >
                        <Plus className="w-4 h-4" /> 
                        <span>Thêm Dòng</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsModalOpen(false)} 
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                form="mainForm" 
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all font-medium flex items-center justify-center gap-2 rounded-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Lưu Lại</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
