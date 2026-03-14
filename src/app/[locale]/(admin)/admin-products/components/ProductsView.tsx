"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const ProductModal = dynamic(() => import("./ProductModal"), {
  ssr: false,
});
const ProductViewModal = dynamic(
  () => import("./ProductViewModal"),
  { ssr: false }
);

interface ProductsViewProps {
  products: any[];
  filteredProducts: any[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  statusFilter: string;
  setStatusFilter: (stat: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  productsPerPage: number;
  categories: any[];
  loadingCategories: boolean;
  brands: any[];
  statuses: string[];
  error: string | null;
  totalCount: number;
  totalPages: number;
  deletingId: string | null;
  handleCreate: (data: any) => Promise<boolean>;
  handleUpdate: (id: string, data: any, original: any) => Promise<boolean>;
  handleDelete: (id: string) => Promise<boolean>;
  handleToggleFeatured: (id: string, current: boolean, original: any) => Promise<void>;
  createNewCategory: (name: string) => Promise<string | null>;
}

export function ProductsView(props: ProductsViewProps) {
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const {
    filteredProducts,
    loading,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    productsPerPage,
    categories,
    loadingCategories,
    brands,
    statuses,
    error,
    totalCount,
    totalPages,
    deletingId,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleFeatured,
    createNewCategory,
  } = props;

  const handleView = (productId: string) => {
    const p = filteredProducts.find((x) => x.id === productId);
    if (p) setViewing(p);
    else toast.error("Không tìm thấy sản phẩm");
  };

  const handleEdit = (productId: string) => {
    const p = filteredProducts.find((x) => x.id === productId);
    if (p) setEditing(p);
    else toast.error("Không tìm thấy sản phẩm");
  };

  const onDelete = async (productId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    const success = await handleDelete(productId);
    if (success) {
      if (viewing?.id === productId) setViewing(null);
      if (editing?.id === productId) setEditing(null);
    }
  };

  if (loading && filteredProducts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader isLoading={true} message="Đang tải danh sách sản phẩm..." size="lg" overlay={false} />
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default";
      case "INACTIVE": return "secondary";
      case "OUT_OF_STOCK": return "destructive";
      default: return "outline";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "INACTIVE": return "bg-red-100 text-red-800";
      case "OUT_OF_STOCK": return "bg-yellow-100 text-yellow-800";
      case "DISCONTINUED": return "bg-gray-100 text-gray-800";
      case "DRAFT": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return "destructive";
    if (stock < 10) return "secondary";
    return "default";
  };

  const getStockBadgeColor = (stock: number) => {
    if (stock === 0) return "bg-red-100 text-red-800";
    if (stock < 10) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-600 mt-1">Quản lý danh mục sản phẩm và kho hàng</p>
        </div>
        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Thêm sản phẩm mới
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder={loadingCategories ? "Đang tải..." : "Danh mục"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {loadingCategories ? (
                    <SelectItem value="loading" disabled>Đang tải danh mục...</SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center gap-2 border-gray-300 hover:bg-gray-50">
                <Filter className="h-4 w-4" /> Lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Package className="h-5 w-5 text-blue-600" /> Danh sách sản phẩm ({totalCount > 0 ? totalCount : filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white">
                <div className="relative aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  )}
                  {product.isFeatured && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1.5 shadow-lg">
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{product.brand}</span>
                    <Badge variant="outline" className="text-xs">{product.category}</Badge>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</div>
                  <div className="flex items-center justify-between">
                    <Badge variant={getStockBadgeVariant(product.stock) as any} className={`text-xs ${getStockBadgeColor(product.stock)}`}>
                      {product.stock === 0 ? "Hết hàng" : `${product.stock} cái`}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(product.status) as any} className={`text-xs ${getStatusBadgeColor(product.status)}`}>
                      {product.status}
                    </Badge>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant={product.isFeatured ? "default" : "outline"}
                      size="sm"
                      className={`w-full ${
                        product.isFeatured ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-300"
                      } transition-all`}
                      onClick={() => handleToggleFeatured(product.id, product.isFeatured || false, product)}
                    >
                      <Star className={`h-4 w-4 mr-2 ${product.isFeatured ? "fill-current" : ""}`} />
                      {product.isFeatured ? "Đã nổi bật" : "Đánh dấu nổi bật"}
                    </Button>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all" onClick={() => handleView(product.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all" onClick={() => handleEdit(product.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all"
                      onClick={() => onDelete(product.id)}
                      disabled={deletingId === product.id}
                    >
                      {deletingId === product.id ? <Loader isLoading={true} size="sm" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {error ? "Không thể tải danh sách sản phẩm" : "Không tìm thấy sản phẩm nào"}
            </div>
          )}
        </CardContent>
      </Card>

      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Hiển thị {(currentPage - 1) * productsPerPage + 1} đến{" "}
            {Math.min(currentPage * productsPerPage, totalCount)} trong tổng số {totalCount} sản phẩm
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              Trước
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
              Sau
            </Button>
          </div>
        </div>
      )}

      {creating && (
        <ProductModal
          isOpen={creating}
          onClose={() => setCreating(false)}
          mode="create"
          onSave={async (data: any) => {
            const success = await handleCreate(data);
            if (success) setCreating(false);
          }}
          categories={categories}
          brands={brands}
          onCreateCategory={createNewCategory}
        />
      )}
      {editing && (
        <ProductModal
          isOpen={!!editing}
          onClose={() => setEditing(null)}
          product={editing}
          mode="edit"
          onSave={async (data: any) => {
            const success = await handleUpdate(editing.id, data, editing);
            if (success) setEditing(null);
          }}
          categories={categories}
          brands={brands}
          onCreateCategory={createNewCategory}
        />
      )}
      {viewing && (
        <ProductViewModal
          isOpen={!!viewing}
          onClose={() => setViewing(null)}
          product={viewing}
          onEdit={() => {
            setViewing(null);
            handleEdit(viewing.id);
          }}
          onDelete={() => {
            setViewing(null);
            onDelete(viewing.id);
          }}
        />
      )}
    </div>
  );
}
