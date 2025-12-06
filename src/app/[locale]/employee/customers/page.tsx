"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Filter, Mail, Phone, MapPin } from "lucide-react";

// Mock data - Replace with real API calls
const mockCustomers = [
  {
    id: "CUST-001",
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0901234567",
    orders: 12,
    totalSpent: 5000000,
    status: "active",
  },
  {
    id: "CUST-002",
    name: "Trần Thị B",
    email: "tranthib@example.com",
    phone: "0902345678",
    orders: 8,
    totalSpent: 3200000,
    status: "active",
  },
  {
    id: "CUST-003",
    name: "Lê Văn C",
    email: "levanc@example.com",
    phone: "0903456789",
    orders: 3,
    totalSpent: 1200000,
    status: "inactive",
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function EmployeeCustomersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Quản Lý Khách Hàng
          </h1>
          <p className="text-slate-600">
            Xem thông tin và lịch sử khách hàng
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm khách hàng..."
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

      {/* Customers List */}
      <div className="grid gap-4">
        {mockCustomers.map((customer) => (
          <Card
            key={customer.id}
            className="border-0 shadow-md hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-indigo-50 rounded-full">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-slate-500">{customer.id}</p>
                    </div>
                    <Badge
                      variant={
                        customer.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {customer.status === "active" ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-14">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {customer.orders} đơn hàng
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 ml-14">
                    <p className="text-sm text-slate-600">
                      Tổng chi tiêu:{" "}
                      <span className="font-semibold text-indigo-600">
                        {formatCurrency(customer.totalSpent)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Xem chi tiết
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

