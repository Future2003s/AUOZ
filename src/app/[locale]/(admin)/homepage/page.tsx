"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Palette, Type, Image as ImageIcon, Save } from "lucide-react";
import { HomepageSettings } from "@/types/homepage";
import { defaultHomepageSettings } from "@/lib/homepage-default";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const convertToTextarea = (values?: string[]) => (values || []).join("\n");
const parseTextarea = (value: string) =>
  value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

const fetchDraft = async (): Promise<HomepageSettings> => {
  const response = await fetch("/api/homepage/draft", {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Không thể tải cấu hình trang chủ");
  }
  const data = await response.json();
  return data?.data || defaultHomepageSettings;
};

export default function HomepageBuilderPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["homepage", "draft"],
    queryFn: fetchDraft,
  });
  const [formState, setFormState] = useState<HomepageSettings>(
    defaultHomepageSettings
  );

  useEffect(() => {
    if (data) {
      setFormState(data);
    }
  }, [data]);

  const updateTypography = (field: keyof HomepageSettings["typography"], value: any) => {
    setFormState((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [field]: value,
      },
    }));
  };

  const updateColor = (field: keyof HomepageSettings["colors"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [field]: value,
      },
    }));
  };

  const heroSlideDefaults = {
    title: "",
    subtitle: "",
    desktopImage: { url: "" },
    cta: { label: "", href: "" },
  };

  const heroSlide = useMemo(() => {
    return (
      formState.sections.hero.data?.slides?.[0] || heroSlideDefaults
    );
  }, [formState]);

  const modifyHeroSlide = (updater: (slide: any) => any) => {
    setFormState((prev) => {
      const slides = [...(prev.sections.hero.data?.slides || [])];
      const current = slides[0] || heroSlideDefaults;
      slides[0] = updater(current);
      return {
        ...prev,
        sections: {
          ...prev.sections,
          hero: {
            ...prev.sections.hero,
            data: { ...prev.sections.hero.data, slides },
          },
        },
      };
    });
  };

  const mutation = useMutation({
    mutationFn: async (status: "draft" | "published") => {
      const response = await fetch("/api/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formState,
          status,
        }),
      });
      if (!response.ok) {
        throw new Error("Không thể lưu cấu hình");
      }
      return response.json();
    },
    onSuccess: (_, status) => {
      toast.success(
        status === "draft"
          ? "Đã lưu bản nháp trang chủ"
          : "Đã xuất bản trang chủ"
      );
      queryClient.invalidateQueries({ queryKey: ["homepage", "draft"] });
      if (status === "published") {
        queryClient.invalidateQueries({ queryKey: ["homepage", "published"] });
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Lưu cấu hình thất bại");
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-3">
        <Loader2 className="animate-spin" />
        <span>Đang tải cấu hình trang chủ...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tùy chỉnh trang chủ</h1>
          <p className="text-sm text-muted-foreground">
            Chỉnh sửa nội dung, phông chữ, màu sắc và hình ảnh của trang chủ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => mutation.mutate("draft")}
            disabled={mutation.isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Lưu nháp
          </Button>
          <Button
            onClick={() => mutation.mutate("published")}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Xuất bản
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Type />
            <div>
              <CardTitle>Phông chữ & Kích thước</CardTitle>
              <p className="text-sm text-muted-foreground">
                Điều chỉnh font chữ tổng thể cho trang
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Input
                value={formState.typography.fontFamily}
                onChange={(e) => updateTypography("fontFamily", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Google Font URL (tuỳ chọn)</Label>
              <Input
                value={formState.typography.fontUrl || ""}
                onChange={(e) => updateTypography("fontUrl", e.target.value)}
                placeholder="https://fonts.googleapis.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Cỡ chữ cơ bản (px)</Label>
              <Input
                type="number"
                min={12}
                max={24}
                value={formState.typography.baseSize}
                onChange={(e) =>
                  updateTypography("baseSize", Number(e.target.value))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Palette />
            <div>
              <CardTitle>Bảng màu</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tuỳ chỉnh màu thương hiệu
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {Object.entries(formState.colors).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label className="capitalize">{key}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    className="h-10 w-16 p-1"
                    value={value}
                    onChange={(e) => updateColor(key as any, e.target.value)}
                  />
                  <Input
                    value={value}
                    onChange={(e) => updateColor(key as any, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <ImageIcon />
          <div>
            <CardTitle>Hero Section</CardTitle>
            <p className="text-sm text-muted-foreground">
              Cập nhật nội dung slide đầu tiên của trang chủ
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Textarea
              value={(heroSlide?.title as string) || ""}
              onChange={(e) =>
                modifyHeroSlide((slide) => ({ ...slide, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              value={heroSlide?.subtitle || ""}
              onChange={(e) =>
                modifyHeroSlide((slide) => ({
                  ...slide,
                  subtitle: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Nút CTA</Label>
            <Input
              value={heroSlide?.cta?.label || ""}
              onChange={(e) =>
                modifyHeroSlide((slide) => ({
                  ...slide,
                  cta: { ...(slide.cta || {}), label: e.target.value },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Liên kết CTA</Label>
            <Input
              value={heroSlide?.cta?.href || ""}
              onChange={(e) =>
                modifyHeroSlide((slide) => ({
                  ...slide,
                  cta: { ...(slide.cta || {}), href: e.target.value },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Ảnh nền</Label>
            <Input
              value={heroSlide?.desktopImage?.url || ""}
              onChange={(e) =>
                modifyHeroSlide((slide) => ({
                  ...slide,
                  desktopImage: {
                    ...(slide.desktopImage || {}),
                    url: e.target.value,
                  },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marquee Banner</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mỗi dòng tương ứng một câu chạy chữ trên banner
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={6}
            value={convertToTextarea(
              formState.sections.marquee.data?.phrases
            )}
            onChange={(e) => {
              const phrases = parseTextarea(e.target.value);
              setFormState((prev) => ({
                ...prev,
                sections: {
                  ...prev.sections,
                  marquee: {
                    ...prev.sections.marquee,
                    data: {
                      ...(prev.sections.marquee.data || {}),
                      phrases,
                    },
                  },
                },
              }));
            }}
            placeholder={"Câu 1\nCâu 2\nCâu 3"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

