"use client";
import { OrdersView } from "../dashboard/components/OrdersView";
import { useOrders } from "../dashboard/hooks/useOrders";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { useOrderEvents } from "@/hooks/useOrderEvents";

export default function OrdersPage() {
  // Enable order events to auto-refresh orders list
  useOrderEvents(true, { channel: "admin" });
  const {
    orders,
    loading,
    error,
    pagination,
    updateOrder,
    syncOrderStatus,
    goToPage,
    changePageSize,
  } = useOrders();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <NotificationBell />
      </div>
      <OrdersView
        orders={orders}
        loading={loading}
        error={error}
        pagination={pagination}
        onUpdateOrder={updateOrder}
        onGoToPage={goToPage}
        onChangePageSize={changePageSize}
        onStatusChanged={syncOrderStatus}
      />
    </div>
  );
}
