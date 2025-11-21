"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { advertisementApi, type Advertisement } from "@/apiRequests/advertisements";
import { useAppContextProvider } from "@/context/app-context";
import { ImageUpload } from "@/components/ImageUpload";
import Image from "next/image";

export default function PageClient() {
  const { sessionToken } = useAppContextProvider();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Advertisement | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState<Partial<Advertisement>>({
    enabled: true,
    title: "",
    content: "",
    imageUrl: "",
    link: "",
    linkText: "Xem thêm",
    delayTime: 0,
    width: "auto",
    height: "auto",
    maxWidth: "90vw",
    maxHeight: "90vh",
    position: "center",
    showCloseButton: true,
    closeOnClickOutside: true,
    closeOnEscape: true,
    autoCloseTime: 0,
    priority: 0,
  });

  useEffect(() => {
    fetchAdvertisements();
  }, [currentPage, sessionToken]);

  const fetchAdvertisements = async () => {
    if (!sessionToken) return;
    
    try {
      setLoading(true);
      const response = await advertisementApi.getAll(
        { page: currentPage, limit: 10 },
        sessionToken
      );
      
      if (response.success && response.data) {
        setAdvertisements(response.data.advertisements);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error: any) {
      toast.error("Không thể tải danh sách quảng cáo");
      console.error("Error fetching advertisements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      enabled: true,
      title: "",
      content: "",
      imageUrl: "",
      link: "",
      linkText: "Xem thêm",
      delayTime: 0,
      width: "auto",
      height: "auto",
      maxWidth: "90vw",
      maxHeight: "90vh",
      position: "center",
      showCloseButton: true,
      closeOnClickOutside: true,
      closeOnEscape: true,
      autoCloseTime: 0,
      priority: 0,
    });
    setCreating(true);
    setEditing(null);
  };

  const handleEdit = (ad: Advertisement) => {
    setFormData({
      enabled: ad.enabled,
      title: ad.title || "",
      content: ad.content,
      imageUrl: ad.imageUrl || "",
      link: ad.link || "",
      linkText: ad.linkText || "Xem thêm",
      delayTime: ad.delayTime,
      width: ad.width || "auto",
      height: ad.height || "auto",
      maxWidth: ad.maxWidth || "90vw",
      maxHeight: ad.maxHeight || "90vh",
      position: ad.position || "center",
      showCloseButton: ad.showCloseButton,
      closeOnClickOutside: ad.closeOnClickOutside,
      closeOnEscape: ad.closeOnEscape,
      autoCloseTime: ad.autoCloseTime || 0,
      priority: ad.priority,
      startDate: ad.startDate,
      endDate: ad.endDate,
    });
    setEditing(ad);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!sessionToken) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    if (!formData.content?.trim()) {
      toast.error("Vui lòng nhập nội dung quảng cáo");
      return;
    }

    try {
      setSaving(true);
      
      if (editing?._id) {
        // Update
        const response = await advertisementApi.update(
          editing._id,
          formData,
          sessionToken
        );
        
        if (response.success) {
          toast.success("Cập nhật quảng cáo thành công");
          setEditing(null);
          fetchAdvertisements();
        } else {
          toast.error("Cập nhật quảng cáo thất bại");
        }
      } else {
        // Create
        const response = await advertisementApi.create(
          formData,
          sessionToken
        );
        
        if (response.success) {
          toast.success("Tạo quảng cáo thành công");
          setCreating(false);
          fetchAdvertisements();
        } else {
          toast.error("Tạo quảng cáo thất bại");
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra");
      console.error("Error saving advertisement:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!sessionToken || !confirm("Bạn có chắc chắn muốn xóa quảng cáo này?")) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await advertisementApi.delete(id, sessionToken);
      
      if (response.success) {
        toast.success("Xóa quảng cáo thành công");
        fetchAdvertisements();
      } else {
        toast.error("Xóa quảng cáo thất bại");
      }
    } catch (error: any) {
      toast.error("Có lỗi xảy ra khi xóa");
      console.error("Error deleting advertisement:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (ad: Advertisement) => {
    if (!sessionToken || !ad._id) return;

    try {
      const response = await advertisementApi.toggle(ad._id, sessionToken);
      
      if (response.success) {
        toast.success(
          response.data?.enabled ? "Đã bật quảng cáo" : "Đã tắt quảng cáo"
        );
        fetchAdvertisements();
      }
    } catch (error: any) {
      toast.error("Có lỗi xảy ra");
      console.error("Error toggling advertisement:", error);
    }
  };

  if (loading && advertisements.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader isLoading={true} message="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Quảng cáo</h1>
          <p className="text-gray-600 mt-1">Quản lý modal quảng cáo hiển thị trên website</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tạo quảng cáo mới
        </Button>
      </div>

      {/* Advertisements List */}
      <div className="grid grid-cols-1 gap-4">
        {advertisements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Chưa có quảng cáo nào</p>
              <Button onClick={handleCreate} className="mt-4">
                Tạo quảng cáo đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          advertisements.map((ad) => (
            <Card key={ad._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {ad.title || "Quảng cáo không có tiêu đề"}
                    </CardTitle>
                    <Badge variant={ad.enabled ? "default" : "secondary"}>
                      {ad.enabled ? "Đang hiển thị" : "Đã tắt"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(ad)}
                    >
                      {ad.enabled ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ad)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => ad._id && handleDelete(ad._id)}
                      disabled={deletingId === ad._id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ad.imageUrl ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                      <Image
                        src={ad.imageUrl}
                        alt={ad.title || "Quảng cáo"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Có ảnh
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Chưa có ảnh</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {ad.content.replace(/<[^>]*>/g, "").substring(0, 100)}...
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>Delay: {ad.delayTime}ms</span>
                    <span>•</span>
                    <span>Vị trí: {ad.position}</span>
                    <span>•</span>
                    <span>Ưu tiên: {ad.priority}</span>
                    {ad.autoCloseTime && ad.autoCloseTime > 0 && (
                      <>
                        <span>•</span>
                        <span>Tự đóng: {ad.autoCloseTime}ms</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={creating || editing !== null} onOpenChange={(open) => {
        if (!open) {
          setCreating(false);
          setEditing(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Chỉnh sửa quảng cáo" : "Tạo quảng cáo mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Enabled */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData({ ...formData, enabled: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="enabled">Hiển thị quảng cáo</Label>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Tiêu đề (tùy chọn)</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Nhập tiêu đề quảng cáo"
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Nội dung *</Label>
              <Textarea
                id="content"
                value={formData.content || ""}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Nhập nội dung quảng cáo (có thể dùng HTML)"
                rows={5}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <ImageUpload
                value={formData.imageUrl}
                onChange={(url) => {
                  setFormData({ ...formData, imageUrl: url });
                  // Force re-render to ensure sync
                  console.log("🖼️ Image URL updated:", url);
                }}
                label="Hình ảnh quảng cáo (tùy chọn)"
              />
              {formData.imageUrl && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium mb-1">
                    ✓ Ảnh đã được chọn
                  </p>
                  <p className="text-xs text-blue-600 break-all">
                    {formData.imageUrl}
                  </p>
                </div>
              )}
            </div>

            {/* Link */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="link">Link (tùy chọn)</Label>
                <Input
                  id="link"
                  value={formData.link || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="/products hoặc https://..."
                />
              </div>
              <div>
                <Label htmlFor="linkText">Text nút link</Label>
                <Input
                  id="linkText"
                  value={formData.linkText || "Xem thêm"}
                  onChange={(e) =>
                    setFormData({ ...formData, linkText: e.target.value })
                  }
                  placeholder="Xem thêm"
                />
              </div>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delayTime">Thời gian delay (ms)</Label>
                <Input
                  id="delayTime"
                  type="number"
                  min="0"
                  value={formData.delayTime || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delayTime: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Thời gian chờ trước khi hiển thị (0 = hiển thị ngay)
                </p>
              </div>
              <div>
                <Label htmlFor="autoCloseTime">Tự động đóng (ms)</Label>
                <Input
                  id="autoCloseTime"
                  type="number"
                  min="0"
                  value={formData.autoCloseTime || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      autoCloseTime: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  0 = không tự đóng
                </p>
              </div>
            </div>

            {/* Position & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Vị trí</Label>
                <Select
                  value={formData.position || "center"}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, position: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Giữa</SelectItem>
                    <SelectItem value="top">Trên</SelectItem>
                    <SelectItem value="bottom">Dưới</SelectItem>
                    <SelectItem value="left">Trái</SelectItem>
                    <SelectItem value="right">Phải</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Ưu tiên</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Số càng cao, ưu tiên càng lớn
                </p>
              </div>
            </div>

            {/* Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxWidth">Max Width</Label>
                <Input
                  id="maxWidth"
                  value={formData.maxWidth || "90vw"}
                  onChange={(e) =>
                    setFormData({ ...formData, maxWidth: e.target.value })
                  }
                  placeholder="90vw"
                />
              </div>
              <div>
                <Label htmlFor="maxHeight">Max Height</Label>
                <Input
                  id="maxHeight"
                  value={formData.maxHeight || "90vh"}
                  onChange={(e) =>
                    setFormData({ ...formData, maxHeight: e.target.value })
                  }
                  placeholder="90vh"
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label>Tùy chọn</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showCloseButton"
                    checked={formData.showCloseButton}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        showCloseButton: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="showCloseButton">Hiển thị nút đóng</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="closeOnClickOutside"
                    checked={formData.closeOnClickOutside}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        closeOnClickOutside: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="closeOnClickOutside">
                    Đóng khi click bên ngoài
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="closeOnEscape"
                    checked={formData.closeOnEscape}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        closeOnEscape: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="closeOnEscape">Đóng khi nhấn ESC</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

