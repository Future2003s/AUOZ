"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Edit,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Upload,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface DebtItem {
  _id: string;
  order: string;
  orderNumber: string;
  amount: number;
  description?: string;
  status: "pending" | "paid" | "overdue";
  dueDate: string;
  paidAt?: string;
  paymentProof?: string;
}

interface Debt {
  _id: string;
  customer: any;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: DebtItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "pending" | "partial" | "paid" | "overdue";
  dueDate: string;
  notes?: string;
  history?: any[];
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeDebtTable() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Create form state
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (customerFilter) params.set("customerId", customerFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(`/api/debt?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Debt API error:", response.status, errorText);
        toast.error(`Lỗi ${response.status}: Không thể tải danh sách công nợ`);
        setDebts([]);
        return;
      }

      const data = await response.json();
      console.log("Debt API response:", data);

      if (data.success !== false) {
        // Handle both success: true and paginated responses
        let debtsList = data.data || [];
        
        // If data is an array, use it directly
        if (Array.isArray(data.data)) {
          debtsList = data.data;
        }
        
        if (searchTerm) {
          debtsList = debtsList.filter((debt: Debt) =>
            debt.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            debt.items?.some((item: DebtItem) =>
              item.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          );
        }
        
        setDebts(debtsList);
      } else {
        toast.error(data.message || "Không thể tải danh sách công nợ");
        setDebts([]);
      }
    } catch (error) {
      console.error("Error fetching debts:", error);
      toast.error("Lỗi khi tải dữ liệu: " + (error instanceof Error ? error.message : "Unknown error"));
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [statusFilter, customerFilter, startDate, endDate]);

  const fetchOrders = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOrders([]);
      return;
    }

    try {
      setLoadingOrders(true);
      const response = await fetch(
        `/api/orders/admin/all?page=1&size=20&search=${searchTerm}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        const ordersList = Array.isArray(data.data)
          ? data.data
          : data.data.content || [];
        setOrders(ordersList);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find((o) => o._id === orderId);
    if (order) {
      setOrderId(order._id);
      setOrderNumber(order.orderNumber || "");
      setAmount(order.total?.toString() || "");
      
      // Set customer info from order
      if (order.user) {
        setCustomerId(order.user._id || order.user.id || "");
        setCustomerName(
          order.user.firstName && order.user.lastName
            ? `${order.user.firstName} ${order.user.lastName}`
            : order.user.email?.split("@")[0] || ""
        );
        setCustomerPhone(order.user.phone || "");
        setCustomerEmail(order.user.email || "");
      } else if (order.shippingAddress) {
        setCustomerName(
          `${order.shippingAddress.firstName || ""} ${order.shippingAddress.lastName || ""}`.trim()
        );
        setCustomerPhone(order.shippingAddress.phone || "");
      }
    }
  };

  const handleCreateDebt = async () => {
    if (!customerId || !orderId || !amount || !dueDate) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/debt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerName,
          customerPhone: customerPhone || undefined,
          customerEmail: customerEmail || undefined,
          orderId,
          orderNumber: orderNumber || undefined,
          amount: parseFloat(amount),
          dueDate,
          description: description || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success || data.data) {
        toast.success("Đã tạo công nợ thành công");
        setIsCreateOpen(false);
        // Reset form
        setCustomerId("");
        setCustomerName("");
        setCustomerPhone("");
        setCustomerEmail("");
        setOrderId("");
        setOrderNumber("");
        setAmount("");
        setDueDate("");
        setDescription("");
        setNotes("");
        setOrders([]);
        fetchDebts();
      } else {
        toast.error(data.message || "Có lỗi xảy ra khi tạo công nợ");
      }
    } catch (error) {
      console.error("Error creating debt:", error);
      toast.error("Lỗi khi tạo công nợ");
    } finally {
      setCreating(false);
    }
  };

  const handleMarkPaid = async (debtId: string, itemId?: string) => {
    try {
      const response = await fetch(`/api/debt/${debtId}/paid`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã đánh dấu đã thu");
        fetchDebts();
        setIsPaymentOpen(false);
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error marking debt as paid:", error);
      toast.error("Lỗi khi cập nhật");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      partial: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return variants[status] || variants.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Chưa thu",
      paid: "Đã thu",
      overdue: "Quá hạn",
      partial: "Thu một phần",
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản Lý Công Nợ
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi và quản lý các khoản công nợ của khách hàng
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm Công Nợ
          </Button>
          <Button
            onClick={fetchDebts}
            variant="outline"
            className="bg-white dark:bg-gray-800"
          >
            <Filter className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Tìm kiếm</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Tên khách hàng, mã đơn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status" className="mt-1">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chưa thu</SelectItem>
                <SelectItem value="partial">Thu một phần</SelectItem>
                <SelectItem value="paid">Đã thu</SelectItem>
                <SelectItem value="overdue">Quá hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startDate">Từ ngày</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="endDate">Đến ngày</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : debts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có công nợ nào
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Mã đơn hàng</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Ngày đến hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((debt) =>
                debt.items.map((item, index) => (
                  <TableRow key={`${debt._id}-${item._id}`}>
                    <TableCell>
                      {index === 0 && (
                        <div>
                          <div className="font-medium">{debt.customerName}</div>
                          {debt.customerPhone && (
                            <div className="text-sm text-gray-500">
                              {debt.customerPhone}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.orderNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      <div
                        className={
                          isOverdue(item.dueDate) && item.status !== "paid"
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : ""
                        }
                      >
                        {formatDate(item.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedDebt(debt);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {item.status !== "paid" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedDebt(debt);
                              setIsPaymentOpen(true);
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết công nợ</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về công nợ của khách hàng
            </DialogDescription>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Thông tin khách hàng</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="font-medium">Tên:</span>{" "}
                    {selectedDebt.customerName}
                  </p>
                  {selectedDebt.customerPhone && (
                    <p>
                      <span className="font-medium">Điện thoại:</span>{" "}
                      {selectedDebt.customerPhone}
                    </p>
                  )}
                  {selectedDebt.customerEmail && (
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedDebt.customerEmail}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Danh sách công nợ</h3>
                <div className="space-y-2">
                  {selectedDebt.items.map((item) => (
                    <div
                      key={item._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.orderNumber}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500">
                              {item.description}
                            </p>
                          )}
                          <p className="text-lg font-semibold mt-2">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                        <Badge className={getStatusBadge(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Hạn thanh toán: {formatDate(item.dueDate)}</p>
                        {item.paidAt && (
                          <p>Đã thanh toán: {formatDate(item.paidAt)}</p>
                        )}
                      </div>
                      {item.paymentProof && (
                        <div className="mt-2">
                          <a
                            href={item.paymentProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Xem ảnh chứng từ
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Tổng công nợ</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(selectedDebt.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đã thu</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedDebt.paidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Còn lại</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(selectedDebt.remainingAmount)}
                  </p>
                </div>
              </div>

              {selectedDebt.history && selectedDebt.history.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Lịch sử cập nhật</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedDebt.history.map((entry, idx) => (
                      <div
                        key={idx}
                        className="text-sm bg-gray-50 dark:bg-gray-900 rounded p-2"
                      >
                        <p>
                          <span className="font-medium">
                            {entry.action === "created"
                              ? "Tạo mới"
                              : entry.action === "paid"
                              ? "Đã thu"
                              : entry.action === "updated"
                              ? "Cập nhật"
                              : entry.action}
                          </span>
                          {" - "}
                          {formatDate(entry.updatedAt)}
                        </p>
                        {entry.note && (
                          <p className="text-gray-500 mt-1">{entry.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đánh dấu đã thu</DialogTitle>
            <DialogDescription>
              Xác nhận đã thu tiền công nợ này
            </DialogDescription>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              <div>
                <Label>Khách hàng</Label>
                <p className="font-medium">{selectedDebt.customerName}</p>
              </div>
              <div>
                <Label>Số tiền cần thu</Label>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(selectedDebt.remainingAmount)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => handleMarkPaid(selectedDebt._id)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Xác nhận đã thu
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Debt Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm Công Nợ Mới</DialogTitle>
            <DialogDescription>
              Tạo công nợ mới cho khách hàng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Order Selection */}
            <div>
              <Label htmlFor="orderSearch">Tìm đơn hàng</Label>
              <div className="mt-1">
                <Input
                  id="orderSearch"
                  placeholder="Nhập mã đơn hàng để tìm..."
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    fetchOrders(e.target.value);
                  }}
                />
                {loadingOrders && (
                  <p className="text-sm text-gray-500 mt-1">Đang tìm...</p>
                )}
                {orders.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                    {orders.map((order) => (
                      <div
                        key={order._id}
                        onClick={() => handleOrderSelect(order._id)}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(order.total || 0)}
                          {" - "}
                          {order.shippingAddress
                            ? `${order.shippingAddress.firstName || ""} ${order.shippingAddress.lastName || ""}`.trim()
                            : order.user
                            ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
                            : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Tên khách hàng *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Số điện thoại</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Debt Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Số tiền (VND) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Ngày đến hạn *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả về công nợ này..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú thêm..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setCustomerId("");
                  setCustomerName("");
                  setCustomerPhone("");
                  setCustomerEmail("");
                  setOrderId("");
                  setOrderNumber("");
                  setAmount("");
                  setDueDate("");
                  setDescription("");
                  setNotes("");
                  setOrders([]);
                }}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateDebt}
                disabled={creating || !customerName || !amount || !dueDate}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {creating ? "Đang tạo..." : "Tạo Công Nợ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

