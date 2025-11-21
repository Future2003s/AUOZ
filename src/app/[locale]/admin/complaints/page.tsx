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
} from "@/types/complaints";
import { toast } from "sonner";

export default function AdminComplaintsPage() {
  const { sessionToken } = useAppContextProvider();
  const [settings, setSettings] = useState<ComplaintSettings>(
    defaultComplaintSettings
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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


