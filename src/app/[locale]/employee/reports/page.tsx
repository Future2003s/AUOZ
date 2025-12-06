"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Download,
  Calendar,
} from "lucide-react";

const stats = [
  {
    label: "Doanh thu tháng này",
    value: "125,000,000",
    change: "+15.2%",
    changeType: "positive",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    label: "Đơn hàng tháng này",
    value: "342",
    change: "+8.5%",
    changeType: "positive",
    icon: ShoppingBag,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    label: "Khách hàng mới",
    value: "128",
    change: "+12.3%",
    changeType: "positive",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    label: "Tỷ lệ hoàn thành",
    value: "94.5%",
    change: "+2.1%",
    changeType: "positive",
    icon: TrendingUp,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
];

export default function EmployeeReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Báo Cáo & Thống Kê
          </h1>
          <p className="text-slate-600">
            Xem báo cáo doanh thu và hiệu suất làm việc
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Chọn khoảng thời gian
          </Button>
          <Button className="bg-indigo-500 hover:bg-indigo-600 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="border-0 shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Doanh thu theo ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
              <p className="text-slate-400">Biểu đồ sẽ được hiển thị ở đây</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Xu hướng đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
              <p className="text-slate-400">Biểu đồ sẽ được hiển thị ở đây</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

