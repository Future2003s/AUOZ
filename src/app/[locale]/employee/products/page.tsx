"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

// Mock data - Replace with real API calls
const mockProducts = [
  {
    id: "PROD-001",
    name: "Hoa hồng đỏ",
    category: "Hoa tươi",
    price: 150000,
    stock: 50,
    status: "active",
  },
  {
    id: "PROD-002",
    name: "Hoa cúc trắng",
    category: "Hoa tươi",
    price: 120000,
    stock: 30,
    status: "active",
  },
  {
    id: "PROD-003",
    name: "Hoa ly vàng",
    category: "Hoa tươi",
    price: 200000,
    stock: 0,
    status: "out_of_stock",
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function EmployeeProductsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Quản Lý Sản Phẩm
          </h1>
          <p className="text-slate-600">
            Thêm, sửa, xóa và quản lý sản phẩm
          </p>
        </div>
        <Button className="bg-indigo-500 hover:bg-indigo-600">
          <Plus className="w-4 h-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProducts.map((product) => (
          <Card
            key={product.id}
            className="border-0 shadow-md hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Package className="w-6 h-6 text-indigo-600" />
                </div>
                <Badge
                  variant={
                    product.status === "active"
                      ? "default"
                      : "destructive"
                  }
                >
                  {product.status === "active" ? "Còn hàng" : "Hết hàng"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Danh mục:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Giá:</span>
                  <span className="font-semibold text-indigo-600">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tồn kho:</span>
                  <span
                    className={`font-medium ${
                      product.stock > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {product.stock}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  Xem
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Sửa
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

