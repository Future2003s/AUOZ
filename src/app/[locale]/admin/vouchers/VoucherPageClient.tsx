"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, RefreshCw, Search, Tag, Trash2 } from "lucide-react";

type Voucher = {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountValue?: number;
  minOrderValue?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  status: string;
  manualStatus?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

const initialForm: Partial<Voucher> & {
  autoApply?: boolean;
} = {
  code: "",
  name: "",
  description: "",
  discountType: "fixed",
  discountValue: 50000,
  maxDiscountValue: undefined,
  minOrderValue: 0,
  usageLimit: undefined,
  perUserLimit: undefined,
  startDate: "",
  endDate: "",
  isActive: true,
};

const formatCurrency = (value?: number) => {
  if (!value) return "0đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const toNumber = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const statusBadgeClass: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-blue-100 text-blue-800",
  expired: "bg-gray-200 text-gray-600",
  disabled: "bg-red-100 text-red-700",
  draft: "bg-yellow-100 text-yellow-800",
};

export default function VoucherPageClient() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [formState, setFormState] = useState(initialForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/vouchers?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const text = await res.text();
      const payload = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(
          payload?.message || "Không thể tải danh sách voucher"
        );
      }

      const data = payload?.data ?? payload;
      const list: Voucher[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.vouchers)
        ? data.vouchers
        : [];

      setVouchers(
        list.map((voucher: any) => ({
          id: String(voucher.id || voucher._id),
          code: voucher.code,
          name: voucher.name,
          description: voucher.description,
          discountType: voucher.discountType,
          discountValue: Number(voucher.discountValue || 0),
          maxDiscountValue: voucher.maxDiscountValue
            ? Number(voucher.maxDiscountValue)
            : undefined,
          minOrderValue: voucher.minOrderValue
            ? Number(voucher.minOrderValue)
            : undefined,
          usageLimit: voucher.usageLimit
            ? Number(voucher.usageLimit)
            : undefined,
          usageCount: Number(voucher.usageCount || 0),
          perUserLimit: voucher.perUserLimit
            ? Number(voucher.perUserLimit)
            : undefined,
          status: voucher.status || "active",
          manualStatus: voucher.manualStatus,
          isActive: voucher.isActive !== false,
          startDate: voucher.startDate,
          endDate: voucher.endDate,
          createdAt: voucher.createdAt,
          updatedAt: voucher.updatedAt,
        }))
      );

      if (data?.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      } else {
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Fetch vouchers failed:", err);
      setError(err?.message || "Không thể tải voucher");
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const openCreate = () => {
    setFormState(initialForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (voucher: Voucher) => {
    setFormState({
      ...voucher,
      startDate: voucher.startDate
        ? voucher.startDate.substring(0, 16)
        : undefined,
      endDate: voucher.endDate ? voucher.endDate.substring(0, 16) : undefined,
    });
    setEditingId(voucher.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormState(initialForm);
  };

  const handleModalChange = (open: boolean) => {
    if (!open) {
      closeModal();
    } else {
      setModalOpen(true);
    }
  };

  const handleChange = (
    field: keyof typeof formState,
    value: string | number | boolean | undefined
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const buildPayload = () => {
    return {
      code: formState.code?.trim(),
      name: formState.name?.trim(),
      description: formState.description?.trim() || undefined,
      discountType: formState.discountType,
      discountValue: Number(formState.discountValue || 0),
      maxDiscountValue: toNumber(formState.maxDiscountValue),
      minOrderValue: toNumber(formState.minOrderValue) ?? 0,
      usageLimit: toNumber(formState.usageLimit),
      perUserLimit: toNumber(formState.perUserLimit),
      startDate: formState.startDate
        ? new Date(formState.startDate).toISOString()
        : undefined,
      endDate: formState.endDate
        ? new Date(formState.endDate).toISOString()
        : undefined,
      isActive: formState.isActive !== false,
    };
  };

  const handleSave = async () => {
    try {
      if (!formState.code?.trim() || !formState.name?.trim()) {
        toast.error("Vui lòng nhập mã và tên voucher");
        return;
      }
      setSaving(true);
      const payload = buildPayload();
      const url = editingId ? `/api/vouchers/${editingId}` : "/api/vouchers";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(
          data?.message || data?.data?.message || "Không thể lưu voucher"
        );
      }
      toast.success(editingId ? "Đã cập nhật voucher" : "Đã tạo voucher");
      closeModal();
      fetchVouchers();
    } catch (error: any) {
      console.error("Save voucher failed:", error);
      toast.error(error?.message || "Không thể lưu voucher");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắn chắn muốn xóa voucher này?")) return;
    try {
      const res = await fetch(`/api/vouchers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        throw new Error(
          data?.message || data?.data?.message || "Không thể xóa voucher"
        );
      }
      toast.success("Đã xóa voucher");
      fetchVouchers();
    } catch (error: any) {
      console.error("Delete voucher failed:", error);
      toast.error(error?.message || "Không thể xóa voucher");
    }
  };

  const filteredVouchers = useMemo(() => {
    if (!searchTerm.trim()) return vouchers;
    const term = searchTerm.trim().toLowerCase();
    return vouchers.filter(
      (voucher) =>
        voucher.code.toLowerCase().includes(term) ||
        voucher.name.toLowerCase().includes(term)
    );
  }, [vouchers, searchTerm]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 pb-16">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quản lý Voucher
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Tạo và giám sát các mã ưu đãi cho khách hàng
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={fetchVouchers}
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          <Button className="flex items-center gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Thêm voucher
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo mã hoặc tên voucher..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="scheduled">Chờ kích hoạt</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
                <SelectItem value="disabled">Đã tắt</SelectItem>
                <SelectItem value="draft">Nháp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách voucher ({filteredVouchers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang tải dữ liệu...
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              Không có voucher nào khớp điều kiện.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Loại giảm</TableHead>
                    <TableHead>Giảm tối đa</TableHead>
                    <TableHead>Đơn tối thiểu</TableHead>
                    <TableHead>Giới hạn</TableHead>
                    <TableHead>Tình trạng</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          <Tag className="h-4 w-4 text-gray-400" />
                          {voucher.code}
                        </div>
                        <p className="text-xs text-gray-500">
                          Đã dùng: {voucher.usageCount}
                          {voucher.usageLimit
                            ? ` / ${voucher.usageLimit}`
                            : ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{voucher.name}</p>
                          {voucher.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {voucher.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {voucher.discountType === "percentage"
                          ? `${voucher.discountValue}%`
                          : formatCurrency(voucher.discountValue)}
                      </TableCell>
                      <TableCell>
                        {voucher.maxDiscountValue
                          ? formatCurrency(voucher.maxDiscountValue)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {voucher.minOrderValue
                          ? formatCurrency(voucher.minOrderValue)
                          : "Không yêu cầu"}
                      </TableCell>
                      <TableCell>
                        {voucher.usageLimit
                          ? `${voucher.usageCount}/${voucher.usageLimit}`
                          : "Không giới hạn"}
                        {voucher.perUserLimit && (
                          <p className="text-xs text-gray-500">
                            {voucher.perUserLimit} lần / khách
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusBadgeClass[voucher.status] ||
                            "bg-gray-100 text-gray-700"
                          }
                        >
                          {voucher.status === "active"
                            ? "Đang hoạt động"
                            : voucher.status === "scheduled"
                            ? "Chờ kích hoạt"
                            : voucher.status === "expired"
                            ? "Hết hạn"
                            : voucher.status === "disabled"
                            ? "Đã tắt"
                            : "Nháp"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(voucher)}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDelete(voucher.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.max(1, prev - 1))
                }
                disabled={currentPage === 1}
              >
                Trang trước
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Trang {currentPage}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) =>
                    prev >= totalPages ? prev : prev + 1
                  )
                }
                disabled={currentPage >= totalPages}
              >
                Trang sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={handleModalChange}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Cập nhật voucher" : "Tạo voucher mới"}
            </DialogTitle>
            <DialogDescription>
              Thiết lập thông tin mã giảm giá cho khách hàng
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Mã voucher</Label>
                <Input
                  value={formState.code}
                  onChange={(e) =>
                    handleChange("code", e.target.value.toUpperCase())
                  }
                  placeholder="VD: TET2025"
                />
              </div>
              <div>
                <Label>Tên hiển thị</Label>
                <Input
                  value={formState.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Giảm giá Tết 2025"
                />
              </div>
            </div>

            <div>
              <Label>Mô tả</Label>
              <Textarea
                rows={3}
                value={formState.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Thông tin mô tả cho khách hàng..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Loại giảm</Label>
                <Select
                  value={formState.discountType}
                  onValueChange={(value) =>
                    handleChange("discountType", value as "percentage" | "fixed")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại giảm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Giảm tiền cố định</SelectItem>
                    <SelectItem value="percentage">Giảm theo %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Giá trị giảm</Label>
                <Input
                  type="number"
                  value={formState.discountValue}
                  onChange={(e) =>
                    handleChange("discountValue", Number(e.target.value))
                  }
                  min={0}
                />
              </div>
              <div>
                <Label>Giảm tối đa</Label>
                <Input
                  type="number"
                  value={formState.maxDiscountValue ?? ""}
                  onChange={(e) =>
                    handleChange("maxDiscountValue", e.target.value)
                  }
                  placeholder="Không giới hạn"
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Đơn hàng tối thiểu</Label>
                <Input
                  type="number"
                  value={formState.minOrderValue ?? 0}
                  onChange={(e) =>
                    handleChange("minOrderValue", Number(e.target.value))
                  }
                  min={0}
                />
              </div>
              <div>
                <Label>Giới hạn tổng</Label>
                <Input
                  type="number"
                  value={formState.usageLimit ?? ""}
                  onChange={(e) => handleChange("usageLimit", e.target.value)}
                  placeholder="Không giới hạn"
                  min={1}
                />
              </div>
              <div>
                <Label>Giới hạn / khách</Label>
                <Input
                  type="number"
                  value={formState.perUserLimit ?? ""}
                  onChange={(e) =>
                    handleChange("perUserLimit", e.target.value)
                  }
                  placeholder="Không giới hạn"
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="datetime-local"
                  value={formState.startDate || ""}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                />
              </div>
              <div>
                <Label>Ngày kết thúc</Label>
                <Input
                  type="datetime-local"
                  value={formState.endDate || ""}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Kích hoạt</Label>
                <p className="text-sm text-gray-500">
                  Cho phép áp dụng ngay khi điều kiện thỏa mãn
                </p>
              </div>
              <Switch
                checked={formState.isActive !== false}
                onCheckedChange={(checked) => handleChange("isActive", checked)}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeModal}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

