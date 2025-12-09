'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  AlertTriangle, 
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
  Download,
  RefreshCw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { envConfig } from "@/config";
import { useAuth } from "@/hooks/useAuth";

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

const FLOWER_CATEGORIES: Record<string, string[]> = {
  "Nơ": ["Nơ Đại Đỏ", "Nơ Đại Đen", "Nơ Trung Đỏ", "Nơ Trung Đen", "Nơ Nhỏ Đỏ", "Nơ Nhỏ Đen"],
  "Hoa": ["Hoa Đại Đỏ", "Hoa Đại Trắng", "Hoa Trung Đỏ", "Hoa Trung Trắng", "Hoa Nhỏ Đỏ", "Hoa Nhỏ Trắng"]
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
// FLOWER LOG CARD COMPONENT (Mobile View)
// ==========================================
const FlowerLogCard = ({ 
  log, 
  onEdit, 
  onDelete 
}: { 
  log: FlowerLog;
  onEdit: (log: FlowerLog) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
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
              <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md inline-flex">
                <History className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{log.history[log.history.length - 1]}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              onClick={() => onEdit(log)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => onDelete(log.id)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30"
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
              className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-900/10 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg flex-shrink-0">{item.category === 'Nơ' ? '🎀' : '🌸'}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.type}</span>
              </div>
              <Badge className="ml-2 bg-indigo-600 dark:bg-indigo-500 text-white font-bold px-2.5 py-0.5 rounded-full text-xs flex-shrink-0">
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
  onEdit, 
  onDelete,
  loading,
  onRefresh
}: { 
  logs: FlowerLog[], 
  onAdd: () => void, 
  onEdit: (log: FlowerLog) => void, 
  onDelete: (id: string) => void,
  loading: boolean,
  onRefresh: () => void
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 z-10" size={18} />
          <Input 
            type="text" 
            placeholder="Tìm kiếm người cắt, loại hoa/nơ..." 
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
            size="sm"
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:hidden">Lọc</span>
            <span className="hidden sm:inline">Lọc</span>
          </Button>
          <Button
            variant="outline"
            onClick={onRefresh}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
            size="sm"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:hidden">Mới</span>
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
          <Button 
            onClick={onAdd} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm shadow-md hover:shadow-lg transition-all whitespace-nowrap"
            size="sm"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:hidden">Mới</span>
            <span className="hidden sm:inline">Tạo Phiếu</span>
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800 animate-in slide-in-from-top-2 duration-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Khoảng thời gian:</label>
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
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
              <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span>Tổng Hợp Số Liệu</span>
              <Badge variant="outline" className="text-xs">
                {filteredLogs.length} phiếu
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {flowerStats.map(([type, total]) => (
                <div 
                  key={type} 
                  className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-indigo-200 dark:border-indigo-800 text-center hover:shadow-md transition-all duration-200 cursor-default group"
                >
                  <div className="text-[10px] xs:text-xs text-slate-600 dark:text-slate-400 font-medium truncate mb-1 sm:mb-2 px-1" title={type}>
                    {type}
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-700 dark:text-indigo-300 group-hover:scale-110 transition-transform">
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
        <Card className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 text-indigo-900 dark:text-indigo-200">
                  <tr>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] xs:text-xs font-bold uppercase tracking-wider">Thông Tin Phiếu</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] xs:text-xs font-bold uppercase tracking-wider">Chi Tiết Cắt</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-[10px] xs:text-xs font-bold uppercase tracking-wider">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group"
                    >
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 align-top min-w-[180px]">
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="p-1 sm:p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex-shrink-0">
                              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">{log.cutter}</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                            <span>{formatDate(log.date)}</span>
                          </div>
                          {log.history && log.history.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] xs:text-xs text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md inline-flex max-w-full">
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
                              className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-900/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-700 group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-colors"
                            >
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                <span className="text-sm sm:text-base flex-shrink-0">{item.category === 'Nơ' ? '🎀' : '🌸'}</span>
                                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.type}</span>
                              </div>
                              <Badge className="ml-1.5 sm:ml-2 bg-indigo-600 dark:bg-indigo-500 text-white font-bold px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] xs:text-xs flex-shrink-0">
                                {formatQuantity(item.quantity)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right align-top">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button 
                            onClick={() => onEdit(log)} 
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-9 sm:w-9 p-0 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-all hover:scale-110" 
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Button 
                            onClick={() => onDelete(log.id)} 
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-9 sm:w-9 p-0 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-all hover:scale-110" 
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingFlowerLog, setEditingFlowerLog] = useState<FlowerLog | null>(null);
  
  // Form State
  const [flowerFormDate, setFlowerFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [flowerFormCutter, setFlowerFormCutter] = useState('');
  const [flowerFormItems, setFlowerFormItems] = useState<FlowerLogItem[]>([
    { category: 'Nơ', type: FLOWER_CATEGORIES['Nơ'][0], quantity: 0 }
  ]);

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

    const timeString = getCurrentDateTimeString();
    const historyEntry = editingFlowerLog 
      ? [...editingFlowerLog.history, `Sửa: ${timeString}`]
      : [`Tạo mới: ${timeString}`];

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
        setFlowerFormDate(new Date().toISOString().split('T')[0]);
        setFlowerFormCutter('');
        setFlowerFormItems([{ category: 'Nơ', type: FLOWER_CATEGORIES['Nơ'][0], quantity: 0 }]);
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

  const openFlowerModal = (log?: FlowerLog) => {
    if (log) {
      setModalType('edit');
      setEditingFlowerLog(log);
      setFlowerFormDate(log.date);
      setFlowerFormCutter(log.cutter);
      setFlowerFormItems(normalizeItems(log.items.map(i => ({...i}))));
    } else {
      setModalType('add');
      setEditingFlowerLog(null);
      setFlowerFormDate(new Date().toISOString().split('T')[0]);
      setFlowerFormCutter(user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '');
      setFlowerFormItems([{ category: 'Nơ', type: FLOWER_CATEGORIES['Nơ'][0], quantity: 1 }]);
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

  // Form helpers
  const addFlowerItem = () => {
    setFlowerFormItems([...flowerFormItems, { category: 'Nơ', type: FLOWER_CATEGORIES['Nơ'][0], quantity: 0 }]);
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
  const updateFlowerItem = (idx: number, field: keyof FlowerLogItem, value: any) => {
    const newItems = [...flowerFormItems];
    const item = { ...newItems[idx], [field]: value };
    if (field === 'category') item.type = FLOWER_CATEGORIES[value as string][0];
    newItems[idx] = item;
    setFlowerFormItems(newItems);
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 pb-4 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
            <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg sm:rounded-xl flex-shrink-0">
              <Scissors className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">
                Sổ Cắt Hoa
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                Quản lý và theo dõi phiếu cắt hoa, nơ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flower Log Tab */}
      <FlowerLogTab 
        logs={flowerLogs} 
        onAdd={() => openFlowerModal()} 
        onEdit={openFlowerModal} 
        onDelete={deleteItem}
        loading={loading}
        onRefresh={fetchFlowerLogs}
      />

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
            {/* Modal Header */}
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex-shrink-0">
                  <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate">
                  {modalType === 'add' ? 'Tạo Phiếu Cắt Hoa Mới' : 'Chỉnh Sửa Phiếu Cắt Hoa'}
                </h3>
              </div>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)} 
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto p-3 sm:p-4 md:p-6 flex-1">
              <form id="mainForm" onSubmit={handleFlowerSubmit} className="space-y-4 sm:space-y-6">
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
                          className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all" 
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
                      className="text-[10px] xs:text-xs flex items-center gap-1 sm:gap-1.5 font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800 px-2 sm:px-3"
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
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 transition-all" 
                                value={item.category} 
                                onChange={(e) => updateFlowerItem(index, 'category', e.target.value)}
                              >
                                <option value="Nơ">🎀 Nơ</option>
                                <option value="Hoa">🌸 Hoa</option>
                              </select>
                            </div>
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] xs:text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5">Loại Chi Tiết</label>
                              <select 
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 transition-all" 
                                value={item.type} 
                                onChange={(e) => updateFlowerItem(index, 'type', e.target.value)}
                              >
                                {FLOWER_CATEGORIES[item.category].map(t => (
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
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-center border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800" 
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
                        className="text-xs sm:text-sm flex items-center gap-2 font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800 px-4 py-2"
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
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
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
