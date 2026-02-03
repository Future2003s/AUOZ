'use client';

import React, { useState, useMemo, useEffect, useCallback, useDeferredValue } from 'react';
import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { 
  Package, Search, Plus, X,
  // Filter, Menu, // unused
  Trash2, Edit2, Save, AlertCircle, CheckCircle, 
  ArrowRightLeft, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Scale,
  History, Calendar, User, Loader2, RefreshCw, ChevronDown, ChevronUp
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
  InventoryFilters,
  CreateInventoryData,
  UpdateInventoryData,
  StockAdjustmentData,
} from '@/apiRequests/inventory';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Link from 'next/link';
import { InventoryHeader } from '@/features/inventory/components/InventoryHeader';
import { InventorySidebar } from '@/features/inventory/components/InventorySidebar';

export default function HoneyInventoryManager() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // --- UI STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeView, setActiveView] = useState('all'); // 'all', 'low', 'premium', 'history'
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Use React's built-in deferral to keep typing smooth without extra state/effects
  const deferredSearchTerm = useDeferredValue(searchTerm);
  
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
    const filters: InventoryFilters = {
      search: deferredSearchTerm || undefined,
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
  }, [deferredSearchTerm, activeView]);

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
  const { data: statsData, error: statsError } = useQuery({
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
    queryKey: ['inventoryHistory', { search: deferredSearchTerm }],
    queryFn: async () => {
      try {
        const response = await getInventoryHistory({
          search: deferredSearchTerm || undefined,
          page: 1,
          limit: 1000,
          sort: 'createdAt',
          order: 'desc',
        });
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
  const rawInventory = useMemo<InventoryItem[]>(
    () => (Array.isArray(inventoryData?.data) ? (inventoryData?.data ?? []) : []),
    [inventoryData]
  );

  const premiumCount = useMemo(
    () => rawInventory.filter((i) => ['Cao cấp', 'Premium'].includes(i.category)).length,
    [rawInventory]
  );

  const history = useMemo<InventoryHistoryItem[]>(
    () => (Array.isArray(historyData?.data) ? (historyData?.data ?? []) : []),
    [historyData]
  );
  
  const stats: InventoryStats = statsData?.data || {
    totalJars: 0,
    totalValue: 0,
    totalWeightKg: '0',
    lowStock: 0,
  };

  // Sort inventory based on sortConfig
  const inventory = useMemo(() => {
    if (!sortConfig) return rawInventory;
    
    const sorted = [...rawInventory].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof InventoryItem] as unknown;
      const bValue = b[sortConfig.key as keyof InventoryItem] as unknown;
      
      // Normalize for comparison
      const aNorm =
        typeof aValue === 'string' ? aValue.toLowerCase() : (aValue as number | null);
      const bNorm =
        typeof bValue === 'string' ? bValue.toLowerCase() : (bValue as number | null);

      if (aNorm === null || aNorm === undefined) return 1;
      if (bNorm === null || bNorm === undefined) return -1;

      if (aNorm < bNorm) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aNorm > bNorm) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
      }
    );
    
    return sorted;
  }, [rawInventory, sortConfig]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Debug: Log inventory data structure
  useEffect(() => {
    if (inventoryData) {
      // Keep debug lightweight to avoid spamming console in production
      console.debug('Inventory loaded:', {
        length: Array.isArray(inventoryData.data) ? inventoryData.data.length : 0,
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
  // Update all inventories caches (all filters) so UI updates instantly after mutations
  const updateInventoriesCache = useCallback(
    (updater: (prev: InventoryItem[]) => InventoryItem[]) => {
      queryClient.setQueriesData({ queryKey: ['inventories'] }, (old: unknown) => {
        if (!old) return old;
        if (typeof old !== 'object') return old;
        const maybe = old as { data?: unknown };
        if (!Array.isArray(maybe.data)) return old;
        return { ...(old as object), data: updater(maybe.data as InventoryItem[]) };
      });
    },
    [queryClient]
  );

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (!err) return fallback;
    if (err instanceof Error) return err.message || fallback;
    if (typeof err === 'object') {
      const anyErr = err as { payload?: { message?: string }; message?: string };
      return anyErr?.payload?.message || anyErr?.message || fallback;
    }
    return fallback;
  };
  
  const createMutation = useMutation({
    mutationFn: createInventory,
    onSuccess: async (data) => {
      console.log('Create success:', data);
      setIsModalOpen(false);
      const created: InventoryItem | undefined = data?.data;
      if (created) {
        updateInventoriesCache((prev) => {
          // Avoid duplicates if backend returns already-present item
          const without = prev.filter((x) => x.id !== created.id);
          return [created, ...without];
        });
      }
      // Invalidate in background (don't refetch immediately to avoid stale backend response overriding optimistic UI)
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      // Background refetch with a small delay (gives backend time to commit)
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['inventories'] });
        queryClient.refetchQueries({ queryKey: ['inventoryStats'] });
      }, 500);
      toast.success('Tạo sản phẩm thành công!', {
        description: 'Sản phẩm mới đã được thêm vào kho.',
        duration: 3000,
      });
    },
    onError: (error: unknown) => {
      console.error('Create error:', error);
      const message = getErrorMessage(error, 'Có lỗi xảy ra khi tạo sản phẩm');
      toast.error('Lỗi khi tạo sản phẩm', {
        description: message,
        duration: 4000,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryData }) => updateInventory(id, data),
    onSuccess: async (data) => {
      console.log('Update success:', data);
      setIsModalOpen(false);
      const updated: InventoryItem | undefined = data?.data;
      if (updated) {
        updateInventoriesCache((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
      }
      // Invalidate in background (avoid immediate refetch overriding optimistic UI)
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['inventories'] });
        queryClient.refetchQueries({ queryKey: ['inventoryStats'] });
      }, 500);
      toast.success('Cập nhật sản phẩm thành công!', {
        description: 'Thông tin sản phẩm đã được cập nhật.',
        duration: 3000,
      });
    },
    onError: (error: unknown) => {
      console.error('Update error:', error);
      const message = getErrorMessage(error, 'Có lỗi xảy ra khi cập nhật sản phẩm');
      toast.error('Lỗi khi cập nhật sản phẩm', {
        description: message,
        duration: 4000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventory,
    onSuccess: async (data, id) => {
      console.log('Delete success:', data);
      updateInventoriesCache((prev) => prev.filter((x) => x.id !== id));
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryHistory'] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['inventories'] });
        queryClient.refetchQueries({ queryKey: ['inventoryStats'] });
        queryClient.refetchQueries({ queryKey: ['inventoryHistory'] });
      }, 500);
      setSelectedItems([]);
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      toast.success('Xóa sản phẩm thành công!', {
        description: 'Sản phẩm đã được xóa khỏi kho.',
        duration: 3000,
      });
    },
    onError: (error: unknown) => {
      console.error('Delete error:', error);
      const anyErr = error as { statusCode?: number; payload?: { message?: string } };
      // Kiểm tra nếu lỗi là do không có quyền (403 Forbidden)
      const msgLower = anyErr?.payload?.message?.toLowerCase?.() || '';
      if (
        anyErr?.statusCode === 403 ||
        msgLower.includes('forbidden') ||
        msgLower.includes('không có quyền') ||
        msgLower.includes('access denied')
      ) {
        const message =
          anyErr?.payload?.message ||
          'Bạn không có quyền thực hiện thao tác này. Chỉ quản trị viên mới có thể xóa sản phẩm.';
        setPermissionErrorMessage(message);
        setIsPermissionErrorModalOpen(true);
        setIsDeleteModalOpen(false);
      } else {
        const message = getErrorMessage(error, 'Có lỗi xảy ra khi xóa sản phẩm');
        toast.error('Lỗi khi xóa sản phẩm', {
          description: message,
          duration: 4000,
        });
      }
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StockAdjustmentData }) => adjustStock(id, data),
    onMutate: async (variables) => {
      const { id, data } = variables;

      // Cancel outgoing fetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['inventories'] });
      await queryClient.cancelQueries({ queryKey: ['inventoryStats'] });

      const previousInventories = queryClient.getQueriesData({ queryKey: ['inventories'] });
      const previousStats = queryClient.getQueryData(['inventoryStats']);

      const delta = data.type === 'import' ? data.amount : -data.amount;

      // Optimistically update inventory quantity (all inventories caches across filters)
      updateInventoriesCache((prev) =>
        prev.map((x) => (x.id === id ? { ...x, quantity: Number(x.quantity) + delta } : x))
      );

      // Optimistically update stats (Tổng số lọ) so header changes immediately too
      queryClient.setQueryData(['inventoryStats'], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const maybe = old as { data?: unknown };
        if (!maybe.data || typeof maybe.data !== 'object') return old;
        const statsData = maybe.data as InventoryStats;
        return {
          ...(old as object),
          data: {
            ...statsData,
            totalJars: Number(statsData.totalJars || 0) + delta,
          },
        };
      });

      return { previousInventories: previousInventories as Array<[QueryKey, unknown]>, previousStats };
    },
    onSuccess: async (data) => {
      console.log('Adjust stock success:', data);
      setIsStockModalOpen(false);

      // Support multiple backend response shapes to ensure cache always updates
      const anyData = data as unknown as {
        data?: {
          inventory?: InventoryItem;
        } & Partial<InventoryItem>;
        inventory?: InventoryItem;
      };

      const updatedInventory: InventoryItem | undefined =
        anyData?.data?.inventory ||
        anyData?.inventory ||
        // Some backends may return inventory directly in data
        (anyData?.data && 'id' in anyData.data ? (anyData.data as unknown as InventoryItem) : undefined);

      if (updatedInventory) {
        updateInventoriesCache((prev) =>
          prev.map((x) => (x.id === updatedInventory.id ? { ...x, ...updatedInventory } : x))
        );
      }
      // Invalidate in background (avoid immediate refetch overriding optimistic UI)
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryHistory'] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['inventories'] });
        queryClient.refetchQueries({ queryKey: ['inventoryStats'] });
        queryClient.refetchQueries({ queryKey: ['inventoryHistory'] });
      }, 800);
      toast.success('Điều chỉnh kho thành công!', {
        description: `Đã ${stockAction.type === 'import' ? 'nhập' : 'xuất'} ${stockAction.amount} ${stockAction.unit} thành công.`,
        duration: 3000,
      });
    },
    onError: (error: unknown, _variables, context) => {
      console.error('Adjust stock error:', error);

      // Roll back optimistic updates
      if (context?.previousInventories) {
        for (const [queryKey, value] of context.previousInventories) {
          queryClient.setQueryData<unknown>(queryKey, value);
        }
      }
      if (context?.previousStats !== undefined) {
        queryClient.setQueryData<unknown>(['inventoryStats'], context.previousStats);
      }

      const message = getErrorMessage(error, 'Có lỗi xảy ra khi điều chỉnh kho');
      toast.error('Lỗi khi điều chỉnh kho', {
        description: message,
        duration: 4000,
      });
    },
    onSettled: () => {
      // Ensure server is source of truth after optimistic update
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryHistory'] });
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
      const data: CreateInventoryData = {
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
      toast.error('Số lượng không hợp lệ', {
        description: 'Vui lòng nhập số lượng lớn hơn 0.',
        duration: 3000,
      });
      return;
    }
    
    if (stockAction.type === 'export' && adjustAmount > stockAction.currentQty) {
      toast.error('Số lượng xuất vượt quá tồn kho', {
        description: `Hiện tại chỉ có ${stockAction.currentQty} ${stockAction.unit} trong kho.`,
        duration: 4000,
      });
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
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans overflow-hidden">
      
      {/* Header */}
      <InventoryHeader
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        searchTerm={searchTerm}
        onChangeSearchTerm={setSearchTerm}
        isSearchPending={searchTerm !== deferredSearchTerm}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay - phải đặt trước sidebar */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
            onClick={() => setShowSidebar(false)}
            aria-hidden="true"
          />
        )}
        
        {/* Sidebar */}
        <InventorySidebar
          showSidebar={showSidebar}
          activeView={activeView as 'all' | 'low' | 'premium' | 'history'}
          onChangeView={(view) => {
            setActiveView(view);
            if (typeof window !== 'undefined' && window.innerWidth < 1024) setShowSidebar(false);
          }}
          onCloseMobile={() => setShowSidebar(false)}
          rawInventory={rawInventory}
          premiumCount={premiumCount}
          stats={stats}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <div className="mb-4 sm:mb-6 md:hidden sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm pb-2">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-opacity ${searchTerm !== deferredSearchTerm ? 'opacity-50' : ''}`} />
              {searchTerm !== deferredSearchTerm && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
              )}
              <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-11 pr-11 py-3 w-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                aria-label="Tìm kiếm sản phẩm"
              />
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
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Loại giao dịch</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Số lượng</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Đối tác / Nơi nhận</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
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
                    <div className="bg-white dark:bg-slate-900 border border-red-200/70 dark:border-red-700 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
                      <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Lỗi khi tải lịch sử</h3>
                      <p className="text-slate-600 dark:text-slate-300 mb-6">
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
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-12 text-center">
                    <History className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Chưa có lịch sử giao dịch</h3>
                    <p className="text-slate-600 dark:text-slate-300">Chưa có giao dịch nhập/xuất kho nào được ghi nhận.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Loại giao dịch</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Số lượng</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Đối tác / Nơi nhận</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {formattedHistory.length > 0 ? (
                                    formattedHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                <div className="flex items-center text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-50">
                                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-slate-400 dark:text-slate-500 shrink-0" />
                                                    <span className="break-words">{item.date}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                <span className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                    item.type === 'import' 
                                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800' 
                                                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800'
                                                }`}>
                                                    {item.type === 'import' ? <ArrowDownCircle className="w-3 h-3 mr-1 shrink-0" /> : <ArrowUpCircle className="w-3 h-3 mr-1 shrink-0" />}
                                                    <span className="hidden sm:inline">{item.type === 'import' ? 'Nhập kho' : 'Xuất kho'}</span>
                                                    <span className="sm:hidden">{item.type === 'import' ? 'Nhập' : 'Xuất'}</span>
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                                              <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-50 break-words">{item.itemName}</div>
                                              <div className="sm:hidden text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <User className="w-3 h-3 inline mr-1 text-slate-400 dark:text-slate-500" />
                                                {item.partner}
                                              </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-50">
                                                {item.amount.toLocaleString('vi-VN')} {item.unit}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                    <User className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500 shrink-0" />
                                                    <span className="break-words">{item.partner}</span>
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
                  </div>
                )}
            </div>
          ) : (
            // --- INVENTORY VIEW ---
            inventoryLoading ? (
              // Skeleton UI
              <div className="animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
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
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {[...Array(5)].map((_, idx) => (
                          <tr key={idx} className="animate-pulse">
                            <td className="px-6 py-4">
                              <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg mr-4"></div>
                                <div>
                                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
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
                <div className="bg-white dark:bg-slate-900 border border-red-200/70 dark:border-red-700 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Lỗi khi tải dữ liệu</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
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
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
                  <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Chưa có sản phẩm nào</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div className="flex items-center space-x-3 min-h-10">
                    {selectedItems.length > 0 ? (
                        <div className="animate-fade-in flex items-center space-x-2 sm:space-x-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-800 px-4 sm:px-5 py-2.5 rounded-2xl shadow-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{selectedItems.length} đã chọn</span>
                        <div className="h-4 w-px bg-blue-200 dark:bg-blue-800"></div>
                        <button 
                          onClick={confirmDeleteMultiple} 
                          className="flex items-center space-x-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold transition-colors hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded-lg"
                          aria-label={`Xóa ${selectedItems.length} sản phẩm đã chọn`}
                        >
                            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Xóa</span>
                        </button>
                        <button 
                          onClick={() => setSelectedItems([])} 
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          aria-label="Bỏ chọn tất cả"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                        </div>
                    ) : (
                        <div className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                          Hiển thị <span className="font-bold text-slate-900 dark:text-slate-50 bg-white/70 dark:bg-slate-900/70 px-2 py-1 rounded-lg">{inventory.length}</span> kết quả
                          {deferredSearchTerm && (
                            <span className="ml-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                              &ldquo;{deferredSearchTerm}&rdquo;
                            </span>
                          )}
                        </div>
                    )}
                    </div>
                    <button 
                      onClick={handleAddNew} 
                      className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-5 sm:px-6 py-3 rounded-2xl shadow-md shadow-amber-500/30 transition-transform hover:-translate-y-0.5 active:translate-y-0 font-semibold text-sm sm:text-base"
                      aria-label="Thêm sản phẩm mới"
                    >
                      <Plus className="w-5 h-5" /> 
                      <span>Thêm Lọ Mới</span>
                    </button>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/80 rounded-3xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/80">
                        <tr>
                            <th className="px-4 sm:px-6 py-4 text-left w-4">
                            <input 
                              type="checkbox" 
                              checked={selectedItems.length === inventory.length && inventory.length > 0} 
                              onChange={toggleSelectAll} 
                              className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer" 
                              aria-label="Chọn tất cả"
                            />
                            </th>
                            <th 
                              className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase cursor-pointer hover:bg-amber-50/40 dark:hover:bg-amber-900/20 transition-colors select-none"
                              onClick={() => handleSort('name')}
                            >
                              <div className="flex items-center space-x-1.5">
                                <span>Sản phẩm</span>
                                {sortConfig?.key === 'name' && (
                                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-600" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
                                )}
                              </div>
                            </th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Loại Lọ</th>
                            <th 
                              className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase cursor-pointer hover:bg-amber-50/40 dark:hover:bg-amber-900/20 transition-colors select-none"
                              onClick={() => handleSort('quantity')}
                            >
                              <div className="flex items-center space-x-1.5">
                                <span>Tồn kho / Min</span>
                                {sortConfig?.key === 'quantity' && (
                                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-600" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase cursor-pointer hover:bg-amber-50/40 dark:hover:bg-amber-900/20 transition-colors select-none"
                              onClick={() => handleSort('price')}
                            >
                              <div className="flex items-center space-x-1.5">
                                <span>Giá (Lọ)</span>
                                {sortConfig?.key === 'price' && (
                                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-600" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
                                )}
                              </div>
                            </th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase hidden sm:table-cell">Vị trí</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                        {inventory.length > 0 ? (
                            inventory.map((item) => {
                            const status = getStockStatus(item.quantity, item.minStock);
                            const StatusIcon = status.icon;
                            const isLarge = item.netWeight >= 435;
                            
                            return (
                                <tr key={item.id} className={`group transition-all border-b border-slate-100/50 dark:border-slate-800/60 ${selectedItems.includes(item.id) ? 'bg-blue-50/60 dark:bg-blue-900/30' : 'bg-white/40 dark:bg-slate-900/40 hover:bg-amber-50/40 dark:hover:bg-amber-900/20'}`}>
                                <td className="px-4 sm:px-6 py-4">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedItems.includes(item.id)} 
                                      onChange={() => toggleSelectItem(item.id)} 
                                      className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer" 
                                      aria-label={`Chọn ${item.name}`}
                                    />
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="flex items-center min-w-0">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md mr-3 sm:mr-4 shrink-0 ${isLarge ? 'bg-amber-600' : 'bg-amber-500'}`}>
                                        {(item.name || "?").charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50 truncate">{item.name}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.category}</div>
                                    </div>
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-sm ${
                                    isLarge 
                                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                                      : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                    }`}>
                                    <Scale className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                    {item.netWeight}g
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="text-base font-bold text-slate-900 dark:text-slate-50">{item.quantity.toLocaleString('vi-VN')} <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">lọ</span></div>
                                    <div className="flex items-center space-x-2 mt-1.5 flex-wrap">
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Min: {item.minStock}</span>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm ${status.color} ${status.bg} border`}>
                                            <StatusIcon className="w-3 h-3 mr-1" />
                                            {status.label}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                  <div className="text-base font-bold text-slate-900 dark:text-slate-50">{Number(item.price).toLocaleString('vi-VN')} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">₫</span></div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">{item.location}</span>
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-1.5 opacity-100 sm:opacity-70 sm:group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => openStockModal(item)} 
                                      className="p-2 text-slate-600 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-sm" 
                                      title="Nhập/Xuất kho"
                                      aria-label={`Nhập/Xuất kho cho ${item.name}`}
                                    >
                                        <ArrowRightLeft className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleEdit(item)} 
                                      className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-sm" 
                                      title="Chỉnh sửa"
                                      aria-label={`Chỉnh sửa ${item.name}`}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => confirmDeleteSingle(item.id)} 
                                      className="p-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-sm" 
                                      title="Xóa" 
                                      disabled={deleteMutation.isPending}
                                      aria-label={`Xóa ${item.name}`}
                                    >
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {inventory.length > 0 ? (
                    inventory.map((item) => {
                      const status = getStockStatus(item.quantity, item.minStock);
                      const StatusIcon = status.icon;
                      const isLarge = item.netWeight >= 435;
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border rounded-2xl p-4 shadow-md transition-all ${
                            selectedItems.includes(item.id) 
                              ? 'border-blue-400 bg-blue-50/60 dark:bg-blue-900/30' 
                              : 'border-slate-200/60 dark:border-slate-700/80 hover:border-amber-400 hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <input 
                                type="checkbox" 
                                checked={selectedItems.includes(item.id)} 
                                onChange={() => toggleSelectItem(item.id)} 
                                className="w-5 h-5 text-amber-600 rounded border-slate-300 dark:border-slate-600 focus:ring-amber-500 cursor-pointer shrink-0 mt-1" 
                                aria-label={`Chọn ${item.name}`}
                              />
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 ${isLarge ? 'bg-amber-600' : 'bg-amber-500'}`}>
                                {(item.name || "?").charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 truncate">{item.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.category}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/80">
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Loại Lọ</div>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                isLarge 
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                                  : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                              }`}>
                                <Scale className="w-3 h-3 mr-1" />
                                {item.netWeight}g
                              </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/80">
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Vị trí</div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{item.location}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200/60 dark:border-amber-800/60">
                              <div className="text-xs text-slate-500 dark:text-slate-300 mb-1">Tồn kho</div>
                              <div className="text-lg font-bold text-slate-900 dark:text-slate-50">{item.quantity.toLocaleString('vi-VN')} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">lọ</span></div>
                              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Min: {item.minStock}</div>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-green-200/60 dark:border-emerald-800/60">
                              <div className="text-xs text-slate-500 dark:text-slate-300 mb-1">Giá bán</div>
                              <div className="text-lg font-bold text-slate-900 dark:text-slate-50">{Number(item.price).toLocaleString('vi-VN')} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">₫</span></div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-700/80">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${status.color} ${status.bg} border`}>
                              <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                              {status.label}
                            </span>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => openStockModal(item)} 
                                className="p-2.5 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl transition-transform active:scale-95 shadow-sm" 
                                title="Nhập/Xuất kho"
                                aria-label={`Nhập/Xuất kho cho ${item.name}`}
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEdit(item)} 
                                className="p-2.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl transition-transform active:scale-95 shadow-sm" 
                                title="Chỉnh sửa"
                                aria-label={`Chỉnh sửa ${item.name}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => confirmDeleteSingle(item.id)} 
                                className="p-2.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl transition-transform active:scale-95 shadow-sm" 
                                title="Xóa" 
                                disabled={deleteMutation.isPending}
                                aria-label={`Xóa ${item.name}`}
                              >
                                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/80 rounded-2xl p-8 text-center">
                      <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-300">Không tìm thấy sản phẩm nào</p>
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </main>
      </div>

      {/* --- MODAL ADD/EDIT --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg my-auto overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-5 sm:px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-amber-50/60 dark:bg-amber-900/20 backdrop-blur-sm sticky top-0">
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {isEditMode ? 'Cập nhật thông tin' : 'Thêm sản phẩm mới'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-transform hover:scale-110 active:scale-95"
                aria-label="Đóng"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-5 sm:p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto bg-white dark:bg-slate-950">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tên mật ong <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    value={currentItem.name} 
                    onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})} 
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 outline-none transition-all text-sm bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm" 
                    placeholder="VD: Mật ong hoa nhãn"
                    aria-label="Tên mật ong"
                  />
                </div>

                {/* --- PHẦN CHỌN LOẠI LỌ --- */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Loại Lọ (Trọng lượng)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                        type="button" 
                        onClick={() => setCurrentItem({...currentItem, netWeight: 165})}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            Number(currentItem.netWeight) === 165 
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-200' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                            ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-400 dark:text-purple-200' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                                ? 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300' 
                                : 'border-green-500 text-green-700 dark:text-green-300 dark:border-green-400 ring-1 ring-green-500/60 bg-green-50 dark:bg-green-900/20'
                            }`}
                            placeholder="Khác" 
                         />
                         <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 dark:text-slate-500 pointer-events-none">Tự nhập (g)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Số lượng (Lọ) <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    value={currentItem.quantity} 
                    onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})} 
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 outline-none transition-all text-sm bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm" 
                    aria-label="Số lượng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Min Stock <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    value={currentItem.minStock} 
                    onChange={(e) => setCurrentItem({...currentItem, minStock: e.target.value})} 
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 outline-none transition-all text-sm bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm" 
                    aria-label="Tồn kho tối thiểu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Giá bán (₫/Lọ) <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    value={currentItem.price} 
                    onChange={(e) => setCurrentItem({...currentItem, price: e.target.value})} 
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 outline-none transition-all text-sm bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm" 
                    aria-label="Giá bán"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Danh mục</label>
                  <select 
                    value={currentItem.category} 
                    onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})} 
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 outline-none bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm transition-all text-sm shadow-sm"
                    aria-label="Danh mục"
                  >
                    <option value="Thường">Thường</option>
                    <option value="Cao cấp">Cao cấp</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vị trí kho</label>
                  <div className="flex space-x-4">
                    {['Kho A', 'Kho B', 'Kho C'].map(loc => (
                      <label key={loc} className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="location" checked={currentItem.location === loc} onChange={() => setCurrentItem({...currentItem, location: loc})} className="text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{loc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white/95 dark:bg-slate-950/95 pb-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                  aria-label="Hủy"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-2xl flex items-center space-x-2 shadow-md shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:-translate-y-0.5 active:translate-y-0" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  aria-label={isEditMode ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )} 
                  <span>Lưu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL STOCK --- */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md my-auto overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className={`px-5 sm:px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center backdrop-blur-sm ${
              stockAction.type === 'import' 
                ? 'bg-green-50/60 dark:bg-green-900/20' 
                : 'bg-rose-50/60 dark:bg-rose-900/20'
            }`}>
              <h3 className={`text-lg sm:text-xl font-bold ${
                stockAction.type === 'import' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent'
              }`}>
                Điều chỉnh kho
              </h3>
              <button 
                onClick={() => setIsStockModalOpen(false)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-transform hover:scale-110 active:scale-95"
                aria-label="Đóng"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSaveStock} className="p-5 sm:p-6 bg-white dark:bg-slate-950">
              <div className="mb-6 text-center">
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Sản phẩm</div>
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 break-words mb-3">{stockAction.itemName}</div>
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/80">
                  <Package className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Hiện có: <span className="font-bold text-slate-900 dark:text-slate-50">{stockAction.currentQty.toLocaleString('vi-VN')} {stockAction.unit}</span></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/80">
                <button 
                  type="button" 
                  onClick={() => setStockAction({ ...stockAction, type: 'import' })} 
                  className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                    stockAction.type === 'import' 
                      ? 'bg-green-500 text-white shadow-md shadow-green-500/30' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <ArrowDownCircle className="w-5 h-5" /> <span>Nhập thêm</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setStockAction({ ...stockAction, type: 'export' })} 
                  className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                    stockAction.type === 'export' 
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <ArrowUpCircle className="w-5 h-5" /> <span>Xuất đi</span>
                </button>
              </div>

              <div className="space-y-5 mb-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Số lượng (Lọ) <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      max={stockAction.type === 'export' ? stockAction.currentQty : undefined} 
                      value={stockAction.amount} 
                      onChange={(e) => setStockAction({...stockAction, amount: e.target.value})} 
                      className={`w-full px-4 py-4 border-2 rounded-2xl text-center text-3xl font-bold outline-none ring-2 transition-all shadow-md ${
                        stockAction.type === 'import' 
                          ? 'border-green-300 ring-green-100 text-green-700 bg-green-50/40 dark:border-green-500 dark:ring-green-900/40 dark:text-green-300 dark:bg-green-900/20' 
                          : 'border-red-300 ring-red-100 text-red-700 bg-red-50/40 dark:border-red-500 dark:ring-red-900/40 dark:text-red-300 dark:bg-red-900/20'
                      }`} 
                      placeholder="0" 
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {stockAction.type === 'import' ? 'Nguồn nhập (Tùy chọn)' : 'Khách hàng / Nơi nhận (Tùy chọn)'}
                    </label>
                    <input 
                        type="text" 
                        value={stockAction.partner} 
                        onChange={(e) => setStockAction({...stockAction, partner: e.target.value})} 
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 outline-none text-sm bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm transition-all" 
                        placeholder={stockAction.type === 'import' ? 'VD: Trại ong Ba Vì...' : 'VD: Chị Lan - Hà Nội...'} 
                    />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsStockModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                  aria-label="Hủy"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className={`px-5 py-2.5 text-sm font-semibold text-white rounded-2xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-transform flex items-center space-x-2 hover:-translate-y-0.5 active:translate-y-0 ${
                    stockAction.type === 'import' 
                      ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30' 
                      : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                  }`} 
                  disabled={adjustStockMutation.isPending}
                  aria-label={`Xác nhận ${stockAction.type === 'import' ? 'nhập' : 'xuất'} kho`}
                >
                  {adjustStockMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Xác nhận</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CONFIRM DELETE --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Xác nhận xóa?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-300 mb-6">
              {deleteTarget?.type === 'single' 
                ? 'Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.' 
                : `Bạn có chắc chắn muốn xóa ${selectedItems.length} sản phẩm đã chọn không?`}
            </p>
            <div className="flex justify-center space-x-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                Không, giữ lại
              </button>
              <button onClick={executeDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-md shadow-red-500/30 disabled:opacity-50" disabled={deleteMutation.isPending}>
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
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">Không có quyền thực hiện</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {permissionErrorMessage || 'Bạn không có quyền thực hiện thao tác này. Chỉ quản trị viên mới có thể xóa sản phẩm trong kho.'}
            </p>
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  setIsPermissionErrorModalOpen(false);
                  setPermissionErrorMessage('');
                }} 
                className="px-6 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 shadow-md shadow-orange-500/30 transition-colors"
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
