"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Image as ImageIcon,
} from "lucide-react";

// Mở rộng Mock data để test phân trang và tìm kiếm
const initialMockProducts = Array.from({ length: 45 }).map((_, i) => {
  const categories = ["Hoa tươi", "Chậu cây", "Phụ kiện", "Giỏ quà"];
  const statuses = ["active", "active", "active", "low_stock", "out_of_stock"];
  const names = ["Hoa hồng đỏ", "Hoa cúc trắng", "Hoa ly vàng", "Cây kim tiền", "Giỏ phong lan", "Phân bón lá", "Chậu gốm sứ"];
  
  return {
    id: `PROD-${String(i + 1).padStart(3, "0")}`,
    name: `${names[i % names.length]} - Mẫu ${i + 1}`,
    category: categories[i % categories.length],
    price: 50000 + Math.floor(Math.random() * 50) * 10000,
    stock: i % 7 === 0 ? 0 : i % 5 === 0 ? Math.floor(Math.random() * 10) + 1 : Math.floor(Math.random() * 100) + 20,
    status: statuses[i % statuses.length],
  };
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function EmployeeProductsPage() {
  const [products, setProducts] = useState(initialMockProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleSelectAll = () => {
    if (selectedIds.size === currentItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentItems.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getDerivedStatus = (stock: number, status: string) => {
    if (stock === 0 || status === "out_of_stock") return "out_of_stock";
    if (stock < 10 || status === "low_stock") return "low_stock";
    return "active";
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                          p.id.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      const derivedStatus = getDerivedStatus(p.stock, p.status);
      const matchStatus = statusFilter === "all" || derivedStatus === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, debouncedSearch, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleDeleteSelected = () => {
    if(confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.size} sản phẩm đã chọn?`)) {
      setProducts(products.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    }
  };

  const renderStatusBadge = (stock: number, status: string) => {
    if (stock === 0 || status === "out_of_stock") {
      return <Badge variant="destructive" className="font-medium">Hết hàng</Badge>;
    }
    if (stock < 10 || status === "low_stock") {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium">Sắp hết ({stock})</Badge>;
    }
    return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-medium text-white hover:text-white border-0">Còn hàng</Badge>;
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Quản Lý Sản Phẩm
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi, cập nhật thông tin và quản lý hàng hóa trong kho.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex border-slate-200">Xuất Excel</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border-0">
            <Plus className="w-4 h-4 mr-2" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm tên hoặc mã SP..."
                className="pl-9 bg-white dark:bg-slate-950 border-slate-200 hover:border-indigo-300 transition-colors focus-visible:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-44 bg-white dark:bg-slate-950 border-slate-200 shadow-sm focus:ring-indigo-500">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                <SelectItem value="Hoa tươi">Hoa tươi</SelectItem>
                <SelectItem value="Chậu cây">Chậu cây</SelectItem>
                <SelectItem value="Phụ kiện">Phụ kiện</SelectItem>
                <SelectItem value="Giỏ quà">Giỏ quà</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-44 bg-white dark:bg-slate-950 border-slate-200 shadow-sm focus:ring-indigo-500">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Còn hàng</SelectItem>
                <SelectItem value="low_stock">Sắp hết hàng</SelectItem>
                <SelectItem value="out_of_stock">Hết hàng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto p-2 sm:p-0 bg-indigo-50 dark:bg-indigo-900/30 sm:bg-transparent rounded-md animate-in fade-in zoom-in-95 duration-200">
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400 mr-2">
                Đã chọn {selectedIds.size} 
              </span>
              <Button size="sm" variant="destructive" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa mục đã chọn
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-50/80">
              <TableRow className="border-slate-200">
                <TableHead className="w-[50px] pl-4">
                  <Checkbox 
                    checked={currentItems.length > 0 && selectedIds.size === currentItems.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[80px]">Hình ảnh</TableHead>
                <TableHead className="min-w-[250px]">Mã & Tên sản phẩm</TableHead>
                <TableHead className="w-[150px]">Danh mục</TableHead>
                <TableHead className="text-right w-[150px]">Giá bán</TableHead>
                <TableHead className="text-center w-[120px]">Tồn kho</TableHead>
                <TableHead className="text-center w-[150px]">Trạng thái</TableHead>
                <TableHead className="text-right pr-6 w-[100px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(product.id) ? "bg-indigo-50/40 dark:bg-indigo-900/20" : ""}`}
                    data-state={selectedIds.has(product.id) ? "selected" : undefined}
                  >
                    <TableCell className="pl-4">
                      <Checkbox 
                        checked={selectedIds.has(product.id)}
                        onCheckedChange={() => toggleSelect(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </TableCell>
                    <TableCell>
                       <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shadow-sm">
                          <ImageIcon className="w-5 h-5 opacity-40" />
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {product.name}
                        </span>
                        <span className="text-xs text-slate-500 mt-1 font-mono">{product.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-indigo-700 dark:text-indigo-400">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-center">
                       <span className={`font-semibold ${product.stock <= 10 ? (product.stock === 0 ? "text-red-500" : "text-amber-500") : "text-slate-700 dark:text-slate-300"}`}>
                         {product.stock}
                       </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {renderStatusBadge(product.stock, product.status)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-800 focus-visible:ring-indigo-500">
                            <span className="sr-only">Mở menu</span>
                            <MoreHorizontal className="h-4 w-4 text-slate-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] shadow-lg border-slate-200">
                          <DropdownMenuLabel className="text-xs font-normal text-slate-500 uppercase tracking-wider">Hành động</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer font-medium py-2">
                            <Eye className="mr-2 h-4 w-4 text-slate-500" />
                            <span>Xem chi tiết</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-medium text-indigo-600 py-2 focus:bg-indigo-50 dark:focus:bg-indigo-900/30 focus:text-indigo-700">
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Chỉnh sửa</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-red-600 font-medium py-2 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30" onClick={() => {
                             if(confirm(`Bạn có chắc muốn xóa SP: ${product.name}?`)){
                               setProducts(products.filter(p => p.id !== product.id));
                             }
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Xóa sản phẩm</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-[400px] text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                       <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                         <Search className="h-8 w-8 text-slate-400" />
                       </div>
                       <div className="space-y-1">
                         <p className="font-medium text-slate-900 dark:text-slate-100">Không tìm thấy sản phẩm nào</p>
                         <p className="text-sm">Hãy thử thay đổi từ khóa hoặc bộ lọc kết quả.</p>
                       </div>
                       {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
                         <Button variant="outline" className="mt-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => { setSearchQuery(""); setCategoryFilter("all"); setStatusFilter("all"); }}>
                           Xóa bộ lọc
                         </Button>
                       )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-950 gap-4">
            <div className="text-sm text-slate-500 order-2 sm:order-1">
              Hiển thị <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.min(filteredProducts.length, currentPage * itemsPerPage)}</span> trong số <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredProducts.length}</span> sản phẩm
            </div>
            
            <div className="order-1 sm:order-2">
              <Pagination className="w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-slate-500"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <PaginationPrevious className="h-4 w-4 bg-transparent hover:bg-transparent" />
                    </Button>
                  </PaginationItem>
                  
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1;
                      if (totalPages > 5) {
                        if (page !== 1 && page !== totalPages && Math.abs(currentPage - page) > 1) {
                          if (page === 2 || page === totalPages - 1) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis className="h-4 w-4 text-slate-400" />
                              </PaginationItem>
                            );
                          }
                          return null;
                        }
                      }
                      
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => setCurrentPage(page)}
                            className={`cursor-pointer h-8 w-8 text-sm font-medium ${currentPage === page ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:text-white" : "text-slate-600 hover:bg-slate-100"}`}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                  </div>

                  <PaginationItem>
                    <Button
                       variant="outline"
                       size="icon"
                       className="h-8 w-8 text-slate-500"
                       onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                       disabled={currentPage === totalPages}
                    >
                       <PaginationNext className="h-4 w-4 bg-transparent hover:bg-transparent" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

