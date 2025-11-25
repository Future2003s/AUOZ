"use client";
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Edit,
  Eye,
  History,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Order } from "../types";
import { OrderEditModal } from "./OrderEditModal";
import { OrderViewModal } from "./OrderViewModal";
import { OrderHistoryModal } from "./OrderHistoryModal";
import { OrderContextMenu } from "./OrderContextMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// Map backend status to Vietnamese for display
const statusToVietnamese: Record<string, string> = {
  processing: "Đang xử lý",
  delivered: "Đã giao",
  cancelled: "Đã huỷ",
  shipped: "Đang giao",
  pending: "Chờ xử lý",
};

interface OrdersViewProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
  onUpdateOrder: (order: Order) => void;
  onGoToPage: (page: number) => void;
  onChangePageSize: (size: number) => void;
  onStatusChanged?: (orderId: string, status: string) => void;
}

export const OrdersView = ({
  orders,
  loading,
  error,
  pagination,
  onUpdateOrder,
  onGoToPage,
  onChangePageSize,
  onStatusChanged,
}: OrdersViewProps) => {
  const [editModal, setEditModal] = useState<Order | null>(null);
  const [viewModal, setViewModal] = useState<Order | null>(null);
  const [historyModal, setHistoryModal] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    order: Order;
    position: { x: number; y: number };
  } | null>(null);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Đã giao":
        return "default";
      case "Đã huỷ":
        return "destructive";
      case "Đang giao":
        return "outline";
      case "Đang xử lý":
        return "secondary";
      default:
        return "secondary";
    }
  };

  // Context menu handlers - memoized for performance
  const handleContextMenu = useCallback((event: React.MouseEvent, order: Order) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      order,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  const handleQuickStatusUpdate = useCallback(async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      // Find the order to get backendId
      const order = orders.find((o) => o.id === orderId || o.backendId === orderId);
      if (!order) {
        throw new Error("Không tìm thấy đơn hàng");
      }

      const apiId = order.backendId || order.id;
      if (!apiId) {
        throw new Error("Không xác định được ID đơn hàng");
      }

      // Optimistic update - update UI immediately
      const statusMap: Record<string, Order["status"]> = {
        pending: "Chờ xử lý",
        processing: "Đang xử lý",
        shipped: "Đang giao",
        delivered: "Đã giao",
        cancelled: "Đã huỷ",
      };
      const mappedStatus = statusMap[newStatus] || "Chờ xử lý";
      const optimisticOrder: Order = {
        ...order,
        status: mappedStatus,
      };
      onUpdateOrder(optimisticOrder);

      // Call API to update status in database
      const response = await fetch(`/api/orders/${apiId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert on error
        onUpdateOrder(order);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.message || `Cập nhật thất bại (${response.status})`
        );
      }

      const responseData = await response.json().catch(() => ({}));
      
      // Get the actual status from response
      const backendStatus = responseData?.data?.status || responseData?.status || newStatus;
      const normalizedStatus = typeof backendStatus === "string" ? backendStatus.toLowerCase() : "";
      const finalStatus = statusMap[normalizedStatus] || mappedStatus;

      // Update with actual status from server
      if (finalStatus !== mappedStatus) {
        const finalOrder: Order = {
          ...order,
          status: finalStatus,
        };
        onUpdateOrder(finalOrder);
      }
      
      // Trigger status changed callback if provided
      if (onStatusChanged) {
        onStatusChanged(apiId, backendStatus);
      }
    } catch (error) {
      console.error("Quick status update failed:", error);
      throw error;
    }
  }, [orders, onUpdateOrder, onStatusChanged]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => onGoToPage(pagination.page)}>Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Size Selector */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Hiển thị {pagination.page * pagination.size + 1} -{" "}
          {Math.min(
            (pagination.page + 1) * pagination.size,
            pagination.totalElements
          )}{" "}
          của {pagination.totalElements} đơn hàng
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Hiển thị:</span>
          <Select
            value={pagination.size.toString()}
            onValueChange={(value) => onChangePageSize(Number(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">mục</span>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-600">
          💡 <strong>Mẹo:</strong> Click chuột phải vào dòng đơn hàng để mở menu
          nhanh với nhiều tùy chọn!
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã ĐH</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeletons
              Array.from({ length: pagination.size }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  Không có đơn hàng nào
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  onContextMenu={(e) => handleContextMenu(e, order)}
                  className="cursor-context-menu hover:bg-gray-50 transition-colors duration-150"
                >
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.total}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {statusToVietnamese[order.status] || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewModal(order)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditModal(order)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Cập nhật trạng thái
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setHistoryModal(order.id)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Lịch sử chỉnh sửa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Trang {pagination.page + 1} / {pagination.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGoToPage(pagination.page - 1)}
              disabled={pagination.first}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Trước</span>
            </Button>

            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNum =
                    Math.max(
                      0,
                      Math.min(pagination.totalPages - 5, pagination.page - 2)
                    ) + i;

                  if (pageNum >= pagination.totalPages) return null;

                  return (
                    <Button
                      key={pageNum}
                      variant={
                        pageNum === pagination.page ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => onGoToPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum + 1}
                    </Button>
                  );
                }
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onGoToPage(pagination.page + 1)}
              disabled={pagination.last}
              className="flex items-center space-x-1"
            >
              <span>Sau</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {editModal && (
        <OrderEditModal
          order={editModal}
          onSave={(updatedOrder) => {
            onUpdateOrder(updatedOrder);
            setEditModal(null);
          }}
          onClose={() => setEditModal(null)}
        />
      )}

      {viewModal && (
        <OrderViewModal order={viewModal} onClose={() => setViewModal(null)} />
      )}

      {historyModal && (
        <OrderHistoryModal
          orderId={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <OrderContextMenu
          order={contextMenu.order}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onEdit={(order) => {
            setEditModal(order);
            setContextMenu(null);
          }}
          onView={(order) => {
            setViewModal(order);
            setContextMenu(null);
          }}
          onHistory={(orderId) => {
            setHistoryModal(orderId);
            setContextMenu(null);
          }}
          onQuickStatusUpdate={handleQuickStatusUpdate}
          onStatusChanged={(orderId, status) => {
            const updated =
              orders.find((o) => o.id === orderId) || contextMenu.order;
            const orderToUpdate = {
              ...updated,
              status:
                status === "processing"
                  ? "Đang xử lý"
                  : status === "shipped"
                  ? "Đang giao"
                  : status === "delivered"
                  ? "Đã giao"
                  : status === "cancelled"
                  ? "Đã huỷ"
                  : status,
            } as Order;

            onUpdateOrder(orderToUpdate);
            onStatusChanged?.(orderId, status);
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
};
