"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Package, User, Calendar, DollarSign } from "lucide-react";
import { employeeApiRequest } from "@/apiRequests/employee";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function NotInDebtPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, authLoading, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeApiRequest.getOrdersNotInDebt({
        page,
        limit,
      });
      if (response.success && response.data) {
        setOrders(response.data);
        setTotal(response.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu. Vui lòng thử lại sau.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "processing":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Chờ xử lý",
      confirmed: "Đã xác nhận",
      processing: "Đang xử lý",
      shipped: "Đã gửi hàng",
      delivered: "Đã giao hàng",
      cancelled: "Đã hủy",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6 mt-25">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Chưa vào công nợ
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Danh sách các đơn hàng/hóa đơn chưa được ghi vào công nợ
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
          Đang tải...
        </div>
      ) : orders.length === 0 ? (
        <Card className="border border-slate-200 dark:border-slate-700">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400">
              Không có đơn hàng chưa vào công nợ
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {orders.map((order: any) => (
              <Card
                key={order._id}
                className="border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            {order.user
                              ? typeof order.user === "object"
                                ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
                                : "Khách hàng"
                              : "Khách vãng lai"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {order.createdAt
                              ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", {
                                  locale: vi,
                                })
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {order.total?.toLocaleString("vi-VN")} VNĐ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Sản phẩm:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-700 dark:text-slate-300"
                          >
                            {item.name} x{item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Đơn hàng này chưa được ghi vào công nợ. Vui lòng xử lý.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Trang {page} / {Math.ceil(total / limit)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

