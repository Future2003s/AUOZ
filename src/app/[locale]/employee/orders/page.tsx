"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Mock data - Replace with real API calls
const mockOrders = [
  {
    id: "ORD-001",
    customer: "Nguyễn Văn A",
    items: 3,
    total: 1250000,
    status: "pending",
    date: "2024-01-15",
  },
  {
    id: "ORD-002",
    customer: "Trần Thị B",
    items: 2,
    total: 850000,
    status: "processing",
    date: "2024-01-15",
  },
  {
    id: "ORD-003",
    customer: "Lê Văn C",
    items: 5,
    total: 2100000,
    status: "shipped",
    date: "2024-01-14",
  },
  {
    id: "ORD-004",
    customer: "Phạm Thị D",
    items: 1,
    total: 450000,
    status: "delivered",
    date: "2024-01-13",
  },
];

const getStatusBadge = (status: string) => {
  const statusMap: Record<
    string,
    { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    pending: {
      label: "Chờ xử lý",
      color: "bg-amber-50 text-amber-600 border-amber-200",
      icon: Clock,
    },
    processing: {
      label: "Đang xử lý",
      color: "bg-blue-50 text-blue-600 border-blue-200",
      icon: Package,
    },
    shipped: {
      label: "Đang giao",
      color: "bg-purple-50 text-purple-600 border-purple-200",
      icon: Truck,
    },
    delivered: {
      label: "Đã giao",
      color: "bg-green-50 text-green-600 border-green-200",
      icon: CheckCircle2,
    },
    cancelled: {
      label: "Đã hủy",
      color: "bg-red-50 text-red-600 border-red-200",
      icon: XCircle,
    },
  };

  const statusInfo = statusMap[status] || statusMap.pending;
  const Icon = statusInfo.icon;

  return (
    <Badge className={`flex items-center gap-1.5 ${statusInfo.color}`}>
      <Icon className="w-3 h-3" />
      {statusInfo.label}
    </Badge>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function EmployeeOrdersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Quản Lý Đơn Hàng
          </h1>
          <p className="text-slate-600">
            Xử lý và theo dõi tất cả đơn hàng
          </p>
        </div>
        <Button className="bg-indigo-500 hover:bg-indigo-600">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Tạo đơn mới
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm đơn hàng, khách hàng..."
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

      {/* Orders List */}
      <div className="grid gap-4">
        {mockOrders.map((order) => (
          <Card
            key={order.id}
            className="border-0 shadow-md hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">
                        {order.id}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {order.customer} • {order.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-14">
                    <div>
                      <p className="text-sm text-slate-600">Sản phẩm</p>
                      <p className="font-semibold">{order.items} món</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Tổng tiền</p>
                      <p className="font-semibold text-indigo-600">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Xem
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Sửa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

