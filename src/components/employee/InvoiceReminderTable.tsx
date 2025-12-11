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
  FileText,
  Calendar,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

interface InvoiceOrder {
  order: string;
  orderNumber: string;
  amount: number;
  orderDate: string;
}

interface Invoice {
  _id: string;
  customer: any;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  orders: InvoiceOrder[];
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceFile?: string;
  invoiceVAT?: string;
  status: "pending" | "reminded" | "issued" | "overdue";
  deadline: string;
  remindedAt?: string;
  issuedAt?: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

interface PendingInvoice {
  orderId: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
}

export default function InvoiceReminderTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [showPendingNotification, setShowPendingNotification] = useState(false);
  
  // Issue form
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/invoice?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        let filtered = data.data || [];
        
        if (searchTerm) {
          filtered = filtered.filter((invoice: Invoice) =>
            invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.orders.some((order) =>
              order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
            ) ||
            (invoice.invoiceNumber &&
              invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        setInvoices(filtered);
      } else {
        toast.error("Không thể tải danh sách nhắc nhở");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  useEffect(() => {
    loadPendingInvoices();
    
    // Check for pending invoices periodically
    const interval = setInterval(() => {
      loadPendingInvoices();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [invoices]); // Re-check when invoices change

  const loadPendingInvoices = () => {
    try {
      const stored = localStorage.getItem("pendingInvoices");
      if (stored) {
        const pending: PendingInvoice[] = JSON.parse(stored);
        
        // Filter out invoices that have been issued (check against fetched invoices)
        const issuedOrderIds = new Set(
          invoices
            .filter((inv) => inv.status === "issued")
            .flatMap((inv) => inv.orders.map((o) => o.order))
        );
        
        const stillPending = pending.filter(
          (p) => !issuedOrderIds.has(p.orderId)
        );
        
        // Also remove old entries (older than 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentPending = stillPending.filter(
          (p) => new Date(p.createdAt) > sevenDaysAgo
        );
        
        setPendingInvoices(recentPending);
        setShowPendingNotification(recentPending.length > 0);
        
        // Update localStorage
        if (recentPending.length !== pending.length) {
          localStorage.setItem("pendingInvoices", JSON.stringify(recentPending));
        }
      }
    } catch (error) {
      console.error("Error loading pending invoices:", error);
    }
  };

  const markInvoiceAsIssued = (orderId: string) => {
    try {
      const stored = localStorage.getItem("pendingInvoices");
      if (stored) {
        const pending: PendingInvoice[] = JSON.parse(stored);
        const updated = pending.filter((p) => p.orderId !== orderId);
        localStorage.setItem("pendingInvoices", JSON.stringify(updated));
        setPendingInvoices(updated);
        setShowPendingNotification(updated.length > 0);
      }
    } catch (error) {
      console.error("Error marking invoice as issued:", error);
    }
  };

  const handleIssueInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      const response = await fetch(`/api/invoice/${selectedInvoice._id}/issue`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoiceNumber || undefined,
          invoiceDate: invoiceDate || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã xuất hóa đơn thành công");
        
        const invoiceId = data.data?._id || data.data?.id || selectedInvoice._id;
        
        // Mark pending invoices as issued
        selectedInvoice.orders.forEach((order) => {
          markInvoiceAsIssued(order.order);
        });
        
        // Upload file if provided
        if (invoiceFile) {
          await handleUploadFile(invoiceId, "invoice");
        } else {
          setInvoiceNumber("");
          setInvoiceDate("");
          setNotes("");
          setInvoiceFile(null);
          setIsIssueOpen(false);
          fetchInvoices();
          loadPendingInvoices();
        }
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error issuing invoice:", error);
      toast.error("Lỗi khi xuất hóa đơn");
    }
  };

  const handleUploadFile = async (invoiceId: string, type: "invoice" | "vat") => {
    if (!invoiceFile) return;

    try {
      const formData = new FormData();
      formData.append("file", invoiceFile);
      formData.append("type", type);

      const response = await fetch(`/api/invoice/${invoiceId}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success || data.data) {
        toast.success("Đã tải lên file thành công");
        setIsUploadOpen(false);
        setIsIssueOpen(false);
        setInvoiceFile(null);
        setInvoiceNumber("");
        setInvoiceDate("");
        setNotes("");
        fetchInvoices();
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Lỗi khi tải lên file");
    }
  };

  const getStatusBadge = (invoice: Invoice) => {
    const daysUntilDeadline = differenceInDays(new Date(invoice.deadline), new Date());
    
    if (invoice.status === "issued") {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    }
    
    if (invoice.status === "overdue") {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    }
    
    if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
    
    if (daysUntilDeadline < 0) {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    }
    
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  };

  const getStatusLabel = (invoice: Invoice) => {
    const daysUntilDeadline = differenceInDays(new Date(invoice.deadline), new Date());
    
    if (invoice.status === "issued") return "Đã xuất";
    if (invoice.status === "overdue") return "Quá hạn";
    if (invoice.status === "reminded") return "Đã nhắc";
    if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) return `Còn ${daysUntilDeadline} ngày`;
    if (daysUntilDeadline < 0) return "Quá hạn";
    return "Bình thường";
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

  const getUrgencyIcon = (invoice: Invoice) => {
    const daysUntilDeadline = differenceInDays(new Date(invoice.deadline), new Date());
    
    if (invoice.status === "overdue" || daysUntilDeadline < 0) {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    
    if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    }
    
    return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nhắc Nhở Xuất Hóa Đơn
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi và xuất hóa đơn cho các đơn hàng chưa có hóa đơn
          </p>
        </div>
        <Button
          onClick={() => {
            fetchInvoices();
            loadPendingInvoices();
          }}
          variant="outline"
          className="bg-white dark:bg-gray-800"
        >
          <Filter className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Pending Invoices Notification */}
      {showPendingNotification && pendingInvoices.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded-r-lg shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                  Có {pendingInvoices.length} đơn hàng cần xuất hóa đơn
                </h3>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {pendingInvoices.map((pending, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-2 rounded flex items-center justify-between"
                  >
                    <span>
                      <span className="font-medium">{pending.orderNumber}</span> - {pending.customerName}
                    </span>
                    <span className="text-xs">
                      {format(new Date(pending.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setShowPendingNotification(false);
              }}
              className="ml-4 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search">Tìm kiếm</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Khách hàng, mã đơn, số hóa đơn..."
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
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="reminded">Đã nhắc</SelectItem>
                <SelectItem value="issued">Đã xuất</SelectItem>
                <SelectItem value="overdue">Quá hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có nhắc nhở nào
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Số đơn</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Hạn xuất</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.customerName}</div>
                      {invoice.customerPhone && (
                        <div className="text-sm text-gray-500">
                          {invoice.customerPhone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {invoice.orders.map((order) => (
                        <div key={order.order} className="font-mono text-sm">
                          {order.orderNumber}
                        </div>
                      ))}
                      <div className="text-xs text-gray-500">
                        {invoice.orders.length} đơn
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(invoice.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getUrgencyIcon(invoice)}
                      <span>{formatDate(invoice.deadline)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(invoice)}>
                      {getStatusLabel(invoice)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.status !== "issued" ? (
                      <Button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsIssueOpen(true);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white"
                        size="sm"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Xuất hóa đơn
                      </Button>
                    ) : (
                      <div className="text-sm text-green-600 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã xuất
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Issue Invoice Dialog */}
      <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xuất Hóa Đơn</DialogTitle>
            <DialogDescription>
              Nhập thông tin để xuất hóa đơn cho khách hàng
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div>
                <Label>Khách hàng</Label>
                <p className="font-medium">{selectedInvoice.customerName}</p>
              </div>

              <div>
                <Label>Danh sách đơn hàng</Label>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mt-1">
                  {selectedInvoice.orders.map((order) => (
                    <div key={order.order} className="flex justify-between py-1">
                      <span className="font-mono text-sm">{order.orderNumber}</span>
                      <span className="font-medium">
                        {formatCurrency(order.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>Tổng cộng:</span>
                    <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="invoiceNumber">Số hóa đơn (tùy chọn)</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Hệ thống sẽ tự động tạo nếu để trống"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="invoiceDate">Ngày xuất hóa đơn</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
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
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="invoiceFile">Upload hóa đơn (PDF/JPG)</Label>
                <Input
                  id="invoiceFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsIssueOpen(false);
                    setInvoiceNumber("");
                    setInvoiceDate("");
                    setNotes("");
                    setInvoiceFile(null);
                  }}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleIssueInvoice}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Xuất hóa đơn
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

