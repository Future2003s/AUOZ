'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, Search, Plus, Filter, Menu, X, 
  Trash2, Edit2, Save, AlertCircle, CheckCircle, 
  ArrowRightLeft, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Scale,
  History, Calendar, User, Loader2, RefreshCw
} from 'lucide-react';
import {
  getInventories,
  getInventoryHistory,
  getInventoryStats,
  createInventory,
  updateInventory,
  deleteInventory,
  adjustStock,
  InventoryItem,
  InventoryHistoryItem,
  InventoryStats,
} from '@/apiRequests/inventory';
import { useAuth } from '@/hooks/useAuth';

export default function HoneyInventoryManager() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // --- UI STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeView, setActiveView] = useState('all'); // 'all', 'low', 'premium', 'history'
  
  // Modal State: Sản phẩm
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // State form nhập liệu
  const [currentItem, setCurrentItem] = useState({
    id: null as string | null, name: '', quantity: '', unit: 'Lọ', netWeight: 165, minStock: '', price: '', location: 'Kho A', category: 'Thường'
  });

  // Modal State: Nhập/Xuất kho
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockAction, setStockAction] = useState({
    itemId: null as string | null, itemName: '', currentQty: 0, unit: '', type: 'import' as 'import' | 'export', amount: '', partner: ''
  });

  // Modal State: Xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'multiple'; id?: string } | null>(null);
  
  // Modal State: Thông báo lỗi quyền
  const [isPermissionErrorModalOpen, setIsPermissionErrorModalOpen] = useState(false);
  const [permissionErrorMessage, setPermissionErrorMessage] = useState('');

  // --- API QUERIES ---
  
  // Build filters based on activeView
  const inventoryFilters = useMemo(() => {
    const filters: any = {
      search: searchTerm || undefined,
      page: 1,
      limit: 1000,
      sort: 'lastUpdated',
      order: 'desc' as const,
    };
    
    if (activeView === 'low') {
      filters.lowStock = true;
    } else if (activeView === 'premium') {
      filters.premium = true;
    }
    
    return filters;
  }, [searchTerm, activeView]);

  // Fetch inventories
  const { data: inventoryData, isLoading: inventoryLoading, refetch: refetchInventory, error: inventoryError } = useQuery({
    queryKey: ['inventories', inventoryFilters],
    queryFn: async () => {
      try {
        const response = await getInventories(inventoryFilters);
        console.log('Inventories response:', response);
        // Response từ http.get đã là data rồi, không cần .data
        return response;
      } catch (error) {
        console.error('Error fetching inventories:', error);
        throw error;
      }
    },
    enabled: activeView !== 'history' && isAuthenticated && !authLoading,
  });

  // Fetch stats
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: async () => {
      try {
        const response = await getInventoryStats();
        console.log('Stats response:', response);
        return response;
      } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && !authLoading,
  });

  // Fetch history
  const { data: historyData, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['inventoryHistory', { search: searchTerm }],
    queryFn: async () => {
      try {
        const response = await getInventoryHistory({
          search: searchTerm || undefined,
          page: 1,
          limit: 1000,
          sort: 'createdAt',
          order: 'desc',
        });
        console.log('History response:', response);
        return response;
      } catch (error) {
        console.error('Error fetching history:', error);
        throw error;
      }
    },
    enabled: activeView === 'history' && isAuthenticated && !authLoading,
  });

  // Parse data - http.get trả về response trực tiếp
  // Response structure: { success: true, data: [...], pagination: {...} }
  const inventory: InventoryItem[] = Array.isArray(inventoryData?.data) ? inventoryData.data : [];
  const history: InventoryHistoryItem[] = Array.isArray(historyData?.data) ? historyData.data : [];
  const stats: InventoryStats = statsData?.data || {
    totalJars: 0,
    totalValue: 0,
    totalWeightKg: '0',
    lowStock: 0,
  };

  // Debug: Log inventory data structure
  useEffect(() => {
    if (inventoryData) {
      console.log('Inventory data structure:', {
        hasData: !!inventoryData.data,
        isArray: Array.isArray(inventoryData.data),
        length: Array.isArray(inventoryData.data) ? inventoryData.data.length : 'N/A',
        fullResponse: inventoryData
      });
    }
  }, [inventoryData]);

  // Debug: Log errors (removed alert, will show in UI instead)
  useEffect(() => {
    if (inventoryError) {
      console.error('Inventory fetch error:', inventoryError);
    }
    if (statsError) {
      console.error('Stats fetch error:', statsError);
    }
    if (historyError) {
      console.error('History fetch error:', historyError);
    }
  }, [inventoryError, statsError, historyError]);

  // --- LOGIC XỬ LÝ DỮ LIỆU ---

  // Format history for display
  const formattedHistory = useMemo(() => {
    return history.map(item => {
      const date = new Date(item.createdAt);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      return {
        ...item,
        date: formattedDate,
        partner: item.partner || (item.type === 'import' ? 'Nhập kho nội bộ' : 'Khách lẻ'),
      };
    });
  }, [history]);

  const getStockStatus = (quantity: number, minStock: number) => {
    const qty = Number(quantity);
    const min = Number(minStock);
    if (min === 0) return { color: 'text-green-600', bg: 'bg-green-50', label: 'Đầy đủ', icon: CheckCircle };
    const percentage = (qty / min) * 100;
    if (percentage < 100) return { color: 'text-red-600', bg: 'bg-red-50', label: 'Sắp hết', icon: AlertCircle };
    if (percentage < 150) return { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Cần nhập', icon: AlertCircle };
    return { color: 'text-green-600', bg: 'bg-green-50', label: 'Đầy đủ', icon: CheckCircle };
  };

  // --- MUTATIONS ---
  
  const createMutation = useMutation({
    mutationFn: createInventory,
    onSuccess: async (data) => {
      console.log('Create success:', data);
      setIsModalOpen(false);
      // Invalidate and refetch queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventories'] }),
        queryClient.invalidateQueries({ queryKey: ['inventoryStats'] }),
      ]);
      // Refetch immediately to show new data
      await refetchInventory();
      alert('Tạo sản phẩm thành công!');
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      const message = error?.payload?.message || error?.message || 'Có lỗi xảy ra khi tạo sản phẩm';
      alert(`Lỗi: ${message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateInventory(id, data),
    onSuccess: async (data) => {
      console.log('Update success:', data);
      setIsModalOpen(false);
      // Invalidate and refetch queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventories'] }),
        queryClient.invalidateQueries({ queryKey: ['inventoryStats'] }),
      ]);
      // Refetch immediately to show updated data
      await refetchInventory();
      alert('Cập nhật sản phẩm thành công!');
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      const message = error?.payload?.message || error?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm';
      alert(`Lỗi: ${message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventory,
    onSuccess: async (data) => {
      console.log('Delete success:', data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventories'] }),
        queryClient.invalidateQueries({ queryKey: ['inventoryStats'] }),
        queryClient.invalidateQueries({ queryKey: ['inventoryHistory'] }),
      ]);
      setSelectedItems([]);
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      alert('Xóa sản phẩm thành công!');
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      // Kiểm tra nếu lỗi là do không có quyền (403 Forbidden)
      if (error?.statusCode === 403 || error?.payload?.message?.toLowerCase().includes('forbidden') || 
          error?.payload?.message?.toLowerCase().includes('không có quyền') ||
          error?.payload?.message?.toLowerCase().includes('access denied')) {
        const message = error?.payload?.message || 'Bạn không có quyền thực hiện thao tác này. Chỉ quản trị viên mới có thể xóa sản phẩm.';
        setPermissionErrorMessage(message);
        setIsPermissionErrorModalOpen(true);
        setIsDeleteModalOpen(false);
      } else {
        const message = error?.payload?.message || error?.message || 'Có lỗi xảy ra khi xóa sản phẩm';
        alert(`Lỗi: ${message}`);
      }
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adjustStock(id, data),
    onSuccess: async (data) => {
      console.log('Adjust stock success:', data);
      setIsStockModalOpen(false);
      // Invalidate and refetch queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventories'] }),
        queryClient.invalidateQueries({ queryKey: ['inventoryStats'] }),
        queryClient.invalidateQueries({ queryKey: ['inventoryHistory'] }),
      ]);
      // Refetch immediately to show updated data
      await refetchInventory();
      alert('Điều chỉnh kho thành công!');
    },
    onError: (error: any) => {
      console.error('Adjust stock error:', error);
      const message = error?.payload?.message || error?.message || 'Có lỗi xảy ra khi điều chỉnh kho';
      alert(`Lỗi: ${message}`);
    },
  });

  // --- ACTIONS ---

  const handleAddNew = () => {
    setIsEditMode(false);
    setCurrentItem({
      id: null, name: '', quantity: '', unit: 'Lọ', netWeight: 165, minStock: '10', price: '', location: 'Kho A', category: 'Thường'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setIsEditMode(true);
    setCurrentItem({ 
      id: item.id,
      name: item.name,
      quantity: item.quantity.toString(),
      minStock: item.minStock.toString(),
      price: item.price.toString(),
      netWeight: item.netWeight || 165,
      unit: item.unit,
      location: item.location,
      category: item.category,
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        name: currentItem.name,
        quantity: Number(currentItem.quantity) || 0,
        unit: currentItem.unit,
        netWeight: Number(currentItem.netWeight),
        minStock: Number(currentItem.minStock) || 0,
        price: Number(currentItem.price),
        location: currentItem.location,
        category: currentItem.category,
      };

      console.log('Saving item:', { isEditMode, id: currentItem.id, data });

      if (isEditMode && currentItem.id) {
        await updateMutation.mutateAsync({ id: currentItem.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Save item error:', error);
    }
  };

  const confirmDeleteSingle = (id: string) => {
    setDeleteTarget({ type: 'single', id });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMultiple = () => {
    setDeleteTarget({ type: 'multiple' });
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (deleteTarget?.type === 'single' && deleteTarget.id) {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } else if (deleteTarget?.type === 'multiple') {
      await Promise.all(selectedItems.map(id => deleteMutation.mutateAsync(id)));
    }
  };

  const openStockModal = (item: InventoryItem) => {
    setStockAction({
      itemId: item.id,
      itemName: item.name,
      currentQty: item.quantity,
      unit: item.unit,
      type: 'import',
      amount: '',
      partner: ''
    });
    setIsStockModalOpen(true);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const adjustAmount = Number(stockAction.amount);
    if (!adjustAmount || adjustAmount <= 0 || !stockAction.itemId) {
      alert('Vui lòng nhập số lượng hợp lệ');
      return;
    }

    try {
      console.log('Adjusting stock:', { id: stockAction.itemId, type: stockAction.type, amount: adjustAmount });
      await adjustStockMutation.mutateAsync({
        id: stockAction.itemId,
        data: {
          type: stockAction.type,
          amount: adjustAmount,
          partner: stockAction.partner || undefined,
        },
      });
    } catch (error) {
      console.error('Adjust stock error:', error);
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedItems(prev => prev.length === inventory.length ? [] : inventory.map(i => i.id));
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    );
  }

  // Show error message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập để truy cập trang quản lý kho.</p>
          <a 
            href="/login" 
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-slate-800 font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">HoneyTrack</h1>
              <p className="text-xs text-gray-500 font-medium">Quản lý kho mật ong</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-80 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${showSidebar ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 flex flex-col`}>
          <div className="p-4 space-y-1 flex-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Bộ lọc</div>
            {[
              { id: 'all', label: 'Tất cả sản phẩm', count: inventory.length },
              { id: 'low', label: 'Cảnh báo tồn kho', count: stats.lowStock },
              { id: 'premium', label: 'Sản phẩm cao cấp', count: inventory.filter(i => ['Cao cấp', 'Premium'].includes(i.category)).length }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  activeView === item.id ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{item.label}</span>
                <span className={`text-xs px-2 py-1 rounded-md ${activeView === item.id ? 'bg-amber-100' : 'bg-gray-100'}`}>
                  {item.count}
                </span>
              </button>
            ))}

            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Nhật ký</div>
                <button
                    onClick={() => setActiveView('history')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    activeView === 'history' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <History className="w-5 h-5" />
                    <span>Lịch sử Xuất/Nhập</span>
                </button>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4">Tổng quan</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div><p className="text-xs text-gray-500 mb-1">Tổng số lọ</p><p className="text-xl font-bold text-gray-900">{stats.totalJars} lọ</p></div>
                <div className="h-1 w-12 bg-green-500 rounded-full mb-1.5"></div>
              </div>
              <div className="flex justify-between items-end">
                <div><p className="text-xs text-gray-500 mb-1">Tổng khối lượng (Quy đổi)</p><p className="text-xl font-bold text-gray-900">{stats.totalWeightKg} kg</p></div>
                <div className="h-1 w-12 bg-amber-500 rounded-full mb-1.5"></div>
              </div>
              <div className="flex justify-between items-end">
                <div><p className="text-xs text-gray-500 mb-1">Tổng giá trị</p><p className="text-xl font-bold text-gray-900">{(stats.totalValue / 1000000).toFixed(1)}M</p></div>
                <div className="h-1 w-12 bg-blue-500 rounded-full mb-1.5"></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="mb-6 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl" />
            </div>
          </div>

          {activeView === 'history' ? (
            // --- HISTORY VIEW ---
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <History className="w-6 h-6 mr-2 text-blue-600" />
                        Lịch sử giao dịch
                    </h2>
                    <div className="text-sm text-gray-500">Hiển thị {formattedHistory.length} giao dịch gần nhất</div>
                </div>
                
                {historyLoading ? (
                  // Skeleton UI for History
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50/50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Loại giao dịch</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Số lượng</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Đối tác / Nơi nhận</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {[...Array(5)].map((_, idx) => (
                          <tr key={idx} className="animate-pulse">
                            <td className="px-6 py-4">
                              <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-6 w-20 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-40 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : historyError ? (
                  // Error State for History
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
                      <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Lỗi khi tải lịch sử</h3>
                      <p className="text-gray-600 mb-6">
                        {historyError instanceof Error 
                          ? historyError.message 
                          : 'Đã xảy ra lỗi khi tải lịch sử giao dịch. Vui lòng thử lại.'}
                      </p>
                      <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['inventoryHistory'] })}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <RefreshCw className="w-5 h-5" />
                        <span>Thử lại</span>
                      </button>
                    </div>
                  </div>
                ) : formattedHistory.length === 0 ? (
                  // Empty State for History
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
                    <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có lịch sử giao dịch</h3>
                    <p className="text-gray-600">Chưa có giao dịch nhập/xuất kho nào được ghi nhận.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                      <table className="w-full">
                          <thead className="bg-gray-50/50 border-b border-gray-200">
                              <tr>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Loại giao dịch</th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Số lượng</th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Đối tác / Nơi nhận</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                              {formattedHistory.length > 0 ? (
                                  formattedHistory.map((item) => (
                                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-6 py-4">
                                              <div className="flex items-center text-sm text-gray-900 font-medium">
                                                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                  {item.date}
                                              </div>
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                  item.type === 'import' 
                                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                                  : 'bg-red-50 text-red-700 border-red-200'
                                              }`}>
                                                  {item.type === 'import' ? <ArrowDownCircle className="w-3 h-3 mr-1" /> : <ArrowUpCircle className="w-3 h-3 mr-1" />}
                                                  {item.type === 'import' ? 'Nhập kho' : 'Xuất kho'}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.itemName}</td>
                                          <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                              {item.amount} {item.unit}
                                          </td>
                                          <td className="px-6 py-4">
                                              <div className="flex items-center text-sm text-gray-600">
                                                  <User className="w-4 h-4 mr-2 text-gray-400" />
                                                  {item.partner}
                                              </div>
                                          </td>
                                      </tr>
                                  ))
                              ) : (
                                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Chưa có lịch sử giao dịch nào</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
                )}
            </div>
          ) : (
            // --- INVENTORY VIEW ---
            inventoryLoading ? (
              // Skeleton UI
              <div className="animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left w-4"></th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Loại Lọ</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tồn kho / Min</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Giá (Lọ)</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Vị trí</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {[...Array(5)].map((_, idx) => (
                          <tr key={idx} className="animate-pulse">
                            <td className="px-6 py-4">
                              <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg mr-4"></div>
                                <div>
                                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                                  <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-6 w-16 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                              <div className="h-3 w-24 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-6 w-16 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : inventoryError ? (
              // Error State
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Lỗi khi tải dữ liệu</h3>
                  <p className="text-gray-600 mb-6">
                    {inventoryError instanceof Error 
                      ? inventoryError.message 
                      : 'Đã xảy ra lỗi khi tải danh sách kho. Vui lòng thử lại.'}
                  </p>
                  <button
                    onClick={() => refetchInventory()}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Thử lại</span>
                  </button>
                </div>
              </div>
            ) : inventory.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có sản phẩm nào</h3>
                  <p className="text-gray-600 mb-6">
                    {activeView === 'low' 
                      ? 'Không có sản phẩm nào sắp hết hàng.'
                      : activeView === 'premium'
                      ? 'Không có sản phẩm cao cấp nào.'
                      : 'Bắt đầu bằng cách thêm sản phẩm mới vào kho.'}
                  </p>
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Thêm sản phẩm mới</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center space-x-3 h-10">
                    {selectedItems.length > 0 ? (
                        <div className="animate-fade-in flex items-center space-x-3 bg-white border border-blue-100 px-4 py-2 rounded-xl shadow-sm">
                        <span className="text-sm font-medium text-blue-700">{selectedItems.length} đã chọn</span>
                        <div className="h-4 w-px bg-gray-200"></div>
                        <button onClick={confirmDeleteMultiple} className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-medium">
                            <Trash2 className="w-4 h-4" /> <span>Xóa</span>
                        </button>
                        <button onClick={() => setSelectedItems([])} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-4 h-4 text-gray-400" /></button>
                        </div>
                    ) : (
                        <div className="text-gray-500 text-sm">Hiển thị <span className="font-semibold text-gray-900">{inventory.length}</span> kết quả</div>
                    )}
                    </div>
                    <button onClick={handleAddNew} className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                    <Plus className="w-5 h-5" /> <span className="font-medium">Thêm Lọ Mới</span>
                    </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left w-4">
                            <input type="checkbox" checked={selectedItems.length === inventory.length && inventory.length > 0} onChange={toggleSelectAll} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Loại Lọ</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tồn kho / Min</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Giá (Lọ)</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Vị trí</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {inventory.length > 0 ? (
                            inventory.map((item) => {
                            const status = getStockStatus(item.quantity, item.minStock);
                            const StatusIcon = status.icon;
                            const isLarge = item.netWeight >= 435;
                            
                            return (
                                <tr key={item.id} className={`group hover:bg-blue-50/30 transition-colors ${selectedItems.includes(item.id) ? 'bg-blue-50/50' : ''}`}>
                                <td className="px-6 py-4">
                                    <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleSelectItem(item.id)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm mr-4 shrink-0 bg-gradient-to-br ${isLarge ? 'from-amber-500 to-amber-700' : 'from-yellow-300 to-amber-400'}`}>
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-500">{item.category}</div>
                                    </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                                    isLarge ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                    <Scale className="w-3 h-3 mr-1" />
                                    {item.netWeight}g
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{item.quantity} <span className="text-gray-500 text-xs">lọ</span></div>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-xs text-gray-400">Min: {item.minStock}</span>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${status.color} ${status.bg}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{Number(item.price).toLocaleString('vi-VN')} ₫</td>
                                <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">{item.location}</span></td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openStockModal(item)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Nhập/Xuất kho">
                                        <ArrowRightLeft className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleEdit(item)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Chỉnh sửa">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => confirmDeleteSingle(item.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Xóa" disabled={deleteMutation.isPending}>
                                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                    </div>
                                </td>
                                </tr>
                            );
                            })
                        ) : (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Không tìm thấy sản phẩm nào</td></tr>
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
              </>
            )
          )}
        </main>
      </div>

      {/* --- MODAL ADD/EDIT --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">{isEditMode ? 'Cập nhật thông tin' : 'Thêm sản phẩm mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên mật ong</label>
                  <input required type="text" value={currentItem.name} onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: Mật ong hoa nhãn" />
                </div>

                {/* --- PHẦN CHỌN LOẠI LỌ --- */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại Lọ (Trọng lượng)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                        type="button" 
                        onClick={() => setCurrentItem({...currentItem, netWeight: 165})}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            Number(currentItem.netWeight) === 165 
                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <span className="text-sm font-bold">Lọ Nhỏ</span>
                        <span className="text-xs opacity-80">165g</span>
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setCurrentItem({...currentItem, netWeight: 435})}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            Number(currentItem.netWeight) === 435 
                            ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <span className="text-sm font-bold">Lọ To</span>
                        <span className="text-xs opacity-80">435g</span>
                    </button>
                    <div className="relative">
                         <input 
                            type="number" 
                            value={currentItem.netWeight} 
                            onChange={(e) => setCurrentItem({...currentItem, netWeight: Number(e.target.value)})}
                            className={`w-full h-full text-center px-1 rounded-xl border focus:outline-none focus:ring-2 ${
                                [165, 435].includes(Number(currentItem.netWeight)) 
                                ? 'border-gray-200 text-gray-500' 
                                : 'border-green-500 text-green-700 ring-1 ring-green-500 bg-green-50'
                            }`}
                            placeholder="Khác" 
                         />
                         <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 pointer-events-none">Tự nhập (g)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng (Lọ)</label>
                  <input required type="number" min="0" value={currentItem.quantity} onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <input required type="number" min="0" value={currentItem.minStock} onChange={(e) => setCurrentItem({...currentItem, minStock: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (đ/Lọ)</label>
                  <input required type="number" min="0" value={currentItem.price} onChange={(e) => setCurrentItem({...currentItem, price: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select value={currentItem.category} onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Thường">Thường</option>
                    <option value="Cao cấp">Cao cấp</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí kho</label>
                  <div className="flex space-x-4">
                    {['Kho A', 'Kho B', 'Kho C'].map(loc => (
                      <label key={loc} className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="location" checked={currentItem.location === loc} onChange={() => setCurrentItem({...currentItem, location: loc})} className="text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">{loc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shadow-lg shadow-blue-500/30 disabled:opacity-50" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} <span>Lưu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL STOCK --- */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Điều chỉnh kho</h3>
              <button onClick={() => setIsStockModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSaveStock} className="p-6">
              <div className="mb-4 text-center">
                <div className="text-sm text-gray-500">Sản phẩm</div>
                <div className="text-lg font-bold text-gray-900">{stockAction.itemName}</div>
                <div className="text-sm text-gray-500">Hiện có: <span className="font-medium text-gray-900">{stockAction.currentQty} Lọ</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
                <button type="button" onClick={() => setStockAction({ ...stockAction, type: 'import' })} className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-all ${stockAction.type === 'import' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>
                  <ArrowDownCircle className="w-4 h-4" /> <span>Nhập thêm</span>
                </button>
                <button type="button" onClick={() => setStockAction({ ...stockAction, type: 'export' })} className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-all ${stockAction.type === 'export' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500'}`}>
                  <ArrowUpCircle className="w-4 h-4" /> <span>Xuất đi</span>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng (Lọ)</label>
                    <input required type="number" min="1" max={stockAction.type === 'export' ? stockAction.currentQty : undefined} value={stockAction.amount} onChange={(e) => setStockAction({...stockAction, amount: e.target.value})} className={`w-full px-4 py-3 border rounded-xl text-center text-2xl font-bold outline-none ring-2 ${stockAction.type === 'import' ? 'border-green-200 ring-green-100 text-green-700' : 'border-red-200 ring-red-100 text-red-700'}`} placeholder="0" />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {stockAction.type === 'import' ? 'Nguồn nhập (Tùy chọn)' : 'Khách hàng / Nơi nhận (Tùy chọn)'}
                    </label>
                    <input 
                        type="text" 
                        value={stockAction.partner} 
                        onChange={(e) => setStockAction({...stockAction, partner: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                        placeholder={stockAction.type === 'import' ? 'VD: Trại ong Ba Vì...' : 'VD: Chị Lan - Hà Nội...'} 
                    />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-lg disabled:opacity-50 ${stockAction.type === 'import' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`} disabled={adjustStockMutation.isPending}>
                  {adjustStockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CONFIRM DELETE --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa?</h3>
            <p className="text-sm text-gray-500 mb-6">
              {deleteTarget?.type === 'single' 
                ? 'Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.' 
                : `Bạn có chắc chắn muốn xóa ${selectedItems.length} sản phẩm đã chọn không?`}
            </p>
            <div className="flex justify-center space-x-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Không, giữ lại
              </button>
              <button onClick={executeDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-lg shadow-red-500/30 disabled:opacity-50" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                Có, xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL PERMISSION ERROR --- */}
      {isPermissionErrorModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Không có quyền thực hiện</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {permissionErrorMessage || 'Bạn không có quyền thực hiện thao tác này. Chỉ quản trị viên mới có thể xóa sản phẩm trong kho.'}
            </p>
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  setIsPermissionErrorModalOpen(false);
                  setPermissionErrorMessage('');
                }} 
                className="px-6 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-500/30 transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
