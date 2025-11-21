"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Save, X } from "lucide-react";
import { Activity } from "@/apiRequests/activities";
import { ImageUpload } from "@/components/ImageUpload";
import { Badge } from "@/components/ui/badge";

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Activity>) => Promise<void>;
  activity?: Activity | null;
  isSubmitting: boolean;
}

export function ActivityForm({
  open,
  onClose,
  onSubmit,
  activity,
  isSubmitting,
}: ActivityFormProps) {
  const [formData, setFormData] = useState<Partial<Activity>>({
    title: "",
    shortDescription: "",
    content: "",
    imageUrl: "",
    gallery: [],
    activityDate: "",
    location: "",
    published: false,
    order: 0,
    tags: [],
    seo: {
      title: "",
      description: "",
      keywords: [],
    },
  });

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title || "",
        shortDescription: activity.shortDescription || "",
        content: activity.content || "",
        imageUrl: activity.imageUrl || "",
        gallery: activity.gallery || [],
        activityDate: activity.activityDate
          ? new Date(activity.activityDate).toISOString().split("T")[0]
          : "",
        location: activity.location || "",
        published: activity.published ?? false,
        order: activity.order ?? 0,
        tags: activity.tags || [],
        seo: activity.seo || {
          title: "",
          description: "",
          keywords: [],
        },
      });
    } else {
      setFormData({
        title: "",
        shortDescription: "",
        content: "",
        imageUrl: "",
        gallery: [],
        activityDate: "",
        location: "",
        published: false,
        order: 0,
        tags: [],
        seo: {
          title: "",
          description: "",
          keywords: [],
        },
      });
    }
  }, [activity, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {activity ? "Chỉnh sửa hoạt động" : "Tạo hoạt động mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Tiêu đề <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Nhập tiêu đề hoạt động"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Thứ tự hiển thị</Label>
              <Input
                id="order"
                name="order"
                type="number"
                value={formData.order}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Mô tả ngắn</Label>
            <Textarea
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="Nhập mô tả ngắn về hoạt động..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Nội dung <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              name="content"
              required
              value={formData.content}
              onChange={handleChange}
              placeholder="Nhập nội dung chi tiết về hoạt động..."
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              label="Hình ảnh chính"
              folder="activities"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="activityDate">Ngày diễn ra</Label>
              <Input
                id="activityDate"
                name="activityDate"
                type="date"
                value={formData.activityDate}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Địa điểm</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Nhập địa điểm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Thẻ tag</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Nhập tag và nhấn Enter"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Thêm
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">SEO Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input
                id="seoTitle"
                value={formData.seo?.title || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seo: { ...formData.seo, title: e.target.value },
                  })
                }
                placeholder="SEO Title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Textarea
                id="seoDescription"
                value={formData.seo?.description || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seo: { ...formData.seo, description: e.target.value },
                  })
                }
                placeholder="SEO Description"
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) =>
                setFormData({ ...formData, published: e.target.checked })
              }
              className="w-4 h-4"
            />
            <Label htmlFor="published">Xuất bản ngay</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

