"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Save, Loader2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useAppContextProvider } from "@/context/app-context";
import { complaintApi } from "@/apiRequests/complaints";
import {
  ComplaintSettings,
  defaultComplaintSettings,
  ComplaintRequest,
  ComplaintStatus,
} from "@/types/complaints";
import { toast } from "sonner";

export default function AdminComplaintsPage() {
  const { sessionToken } = useAppContextProvider();
  const [settings, setSettings] = useState<ComplaintSettings>(
    defaultComplaintSettings
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<ComplaintRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(
    null
  );
  const statusOptions: { value: ComplaintStatus | "all"; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "new", label: "Mới" },
    { value: "in_progress", label: "Đang xử lý" },
    { value: "resolved", label: "Đã giải quyết" },
    { value: "rejected", label: "Từ chối" },
  ];

  const statusLabel: Record<ComplaintStatus, string> = {
    new: "Mới",
    in_progress: "Đang xử lý",
    resolved: "Đã giải quyết",
    rejected: "Từ chối",
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await complaintApi.getSettings();
        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error("Failed to load complaint settings:", error);
        toast.error("Không thể tải cấu hình khiếu nại");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const fetchRequests = async () => {
    if (!sessionToken) return;
    try {
      setRequestsLoading(true);
      const response = await complaintApi.getRequests(
        {
          status: statusFilter,
          search: searchTerm.trim() || undefined,
        },
        sessionToken
      );
      if (response.success) {
        setRequests(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load complaint requests:", error);
      toast.error("Không thể tải danh sách khiếu nại");
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionToken) {
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, statusFilter]);

  const handleSave = async () => {
    if (!sessionToken) {
      toast.error("Bạn cần đăng nhập lại");
      return;
    }
    try {
      setSaving(true);
      const res = await complaintApi.updateSettings(settings, sessionToken);
      if (res.success) {
        toast.success("Cập nhật thông tin thành công");
        setSettings(res.data);
      } else {
        throw new Error("Update failed");
      }
    } catch (error: any) {
      console.error("Failed to update complaint settings:", error);
      toast.error(error?.message || "Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRequestStatus = async (
    id: string,
    nextStatus: ComplaintStatus
  ) => {
    if (!sessionToken) {
      toast.error("Bạn cần đăng nhập lại");
      return;
    }
    try {
      setUpdatingRequestId(id);
      const res = await complaintApi.updateRequest(
        id,
        { status: nextStatus },
        sessionToken
      );
      if (res.success) {
        toast.success("Đã cập nhật trạng thái khiếu nại");
        fetchRequests();
      }
    } catch (error: any) {
      console.error("Failed to update complaint request:", error);
      toast.error(error?.message || "Không thể cập nhật trạng thái");
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleSearchRequests = () => {
    fetchRequests();
  };

  const updateStep = (index: number, field: "title" | "description", value: string) => {
    setSettings((prev) => {
      const steps = [...prev.steps];
      steps[index] = { ...steps[index], [field]: value };
      return { ...prev, steps };
    });
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    setSettings((prev) => {
      const steps = [...prev.steps];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= steps.length) return prev;
      const temp = steps[index];
      steps[index] = steps[newIndex];
      steps[newIndex] = temp;
      return { ...prev, steps };
    });
  };

  const removeStep = (index: number) => {
    setSettings((prev) => {
      const steps = [...prev.steps];
      steps.splice(index, 1);
      return { ...prev, steps };
    });
  };

  const addStep = () => {
    setSettings((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          title: "",
          description: "",
        },
      ],
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
      </div>
    );
    }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý trang khiếu nại</h1>
          <p className="text-slate-600">
            Tuỳ chỉnh nội dung hero, quy trình và thông tin liên hệ
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu khiếu nại từ khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ComplaintStatus | "all")
                }
                className="w-full border rounded-md px-3 py-2"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Tìm kiếm</Label>
              <div className="flex gap-2">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tên, mã đơn, email..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchRequests}
                >
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </div>

          {requestsLoading ? (
            <div className="py-10 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Đang tải yêu cầu...
            </div>
          ) : requests.length === 0 ? (
            <p className="py-6 text-center text-slate-500">
              Chưa có yêu cầu khiếu nại nào phù hợp.
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="border rounded-xl p-4 shadow-sm bg-white space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-lg">
                        {request.title}
                      </p>
                      <p className="text-sm text-slate-500">
                        Mã đơn: {request.orderCode}
                      </p>
                    </div>
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {statusLabel[request.status]}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <span className="font-semibold">Khách hàng:</span>{" "}
                      {request.fullName}
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      {request.email}
                    </p>
                    {request.phone && (
                      <p>
                        <span className="font-semibold">SĐT:</span>{" "}
                        {request.phone}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Ngày gửi:</span>{" "}
                      {new Date(request.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-lg p-3">
                    {request.description}
                  </p>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <p className="text-sm text-slate-500 flex-1">
                      <span className="font-semibold">Ghi chú nội bộ:</span>{" "}
                      {request.adminNotes || "Chưa có"}
                    </p>
                    <div className="flex items-center gap-2">
                      <select
                        value={request.status}
                        onChange={(e) =>
                          handleUpdateRequestStatus(
                            request._id,
                            e.target.value as ComplaintStatus
                          )
                        }
                        className="border rounded-md px-3 py-2 text-sm"
                        disabled={updatingRequestId === request._id}
                      >
                        {statusOptions
                          .filter((opt) => opt.value !== "all")
                          .map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </select>
                      {updatingRequestId === request._id && (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input
              value={settings.heroTitle}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, heroTitle: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              rows={3}
              value={settings.heroSubtitle}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  heroSubtitle: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quy trình</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input
                value={settings.processTitle}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    processTitle: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                rows={3}
                value={settings.processDescription}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    processDescription: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Các bước</h3>
            <Button type="button" variant="outline" onClick={addStep}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm bước
            </Button>
          </div>

          <div className="space-y-4">
            {settings.steps.map((step, index) => (
              <div
                key={index}
                className="border rounded-xl p-4 space-y-3 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    Bước {index + 1} {step.title ? `- ${step.title}` : ""}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => moveStep(index, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => moveStep(index, "down")}
                      disabled={index === settings.steps.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tiêu đề bước</Label>
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(index, "title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả bước</Label>
                  <Textarea
                    rows={2}
                    value={step.description || ""}
                    onChange={(e) =>
                      updateStep(index, "description", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin liên hệ</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nhãn hotline</Label>
            <Input
              value={settings.hotlineLabel}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  hotlineLabel: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Số hotline</Label>
            <Input
              value={settings.hotlineNumber}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  hotlineNumber: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Thời gian trực</Label>
            <Input
              value={settings.hotlineHours}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  hotlineHours: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={settings.email}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Ghi chú email</Label>
            <Textarea
              rows={2}
              value={settings.emailNote}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, emailNote: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Thông điệp cam kết</Label>
            <Textarea
              rows={3}
              value={settings.guaranteeText}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  guaranteeText: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


