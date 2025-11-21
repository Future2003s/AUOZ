"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Palette, Type, Image as ImageIcon, Save, Upload, X, Plus, Trash2, GripVertical } from "lucide-react";
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

// Transform backend format to frontend format
const transformBackendToFrontend = (backendData: any): HomepageSettings => {
  if (!backendData) return defaultHomepageSettings;
  
  // If already in frontend format (has sections), return as is
  if (backendData.sections) {
    return backendData as HomepageSettings;
  }

  // Transform from backend format
  return {
    typography: {
      fontFamily: backendData.typography?.headingFont || defaultHomepageSettings.typography.fontFamily,
      fontUrl: backendData.typography?.googleFontUrl,
      baseSize: backendData.typography?.baseFontSize || defaultHomepageSettings.typography.baseSize,
      headingScale: {
        h1: (backendData.typography?.headingSizes?.h1 || 48) / (backendData.typography?.baseFontSize || 16),
        h2: (backendData.typography?.headingSizes?.h2 || 36) / (backendData.typography?.baseFontSize || 16),
        h3: (backendData.typography?.headingSizes?.h3 || 24) / (backendData.typography?.baseFontSize || 16),
      },
      lineHeight: defaultHomepageSettings.typography.lineHeight,
    },
    colors: backendData.colors || defaultHomepageSettings.colors,
    sections: {
      hero: {
        enabled: true,
        order: 0,
        data: {
          slides: (backendData.hero?.slides || []).map((slide: any) => ({
            title: slide.title || "",
            subtitle: slide.subtitle || "",
            cta: {
              label: slide.ctaText || "",
              href: slide.ctaLink || "",
            },
            desktopImage: {
              url: slide.imageUrl || "",
              alt: "",
            },
          })),
        },
      },
      marquee: {
        enabled: backendData.marquee?.enabled !== false,
        order: 1,
        data: {
          phrases: backendData.marquee?.items || defaultHomepageSettings.sections.marquee.data.phrases,
          speed: 40,
        },
      },
      about: backendData.about ? {
        enabled: backendData.about.enabled !== false,
        order: 2,
        data: {
          heading: backendData.about.title || "",
          body: backendData.about.content || "",
          media: backendData.about.imageUrl ? {
            url: backendData.about.imageUrl,
            alt: "",
          } : undefined,
          founderName: backendData.about.founderName || "",
          founderTitle: backendData.about.founderTitle || "",
          founderQuote: backendData.about.founderQuote || "",
        },
      } : defaultHomepageSettings.sections.about,
      featuredProducts: backendData.featuredProducts ? {
        enabled: backendData.featuredProducts.enabled !== false,
        order: 3,
        data: {
          productIds: (backendData.featuredProducts.productIds || []).map((id: any) => 
            typeof id === 'string' ? id : id.toString()
          ),
          layout: "grid" as const,
        },
      } : defaultHomepageSettings.sections.featuredProducts,
      socialProof: backendData.socialProof ? {
        enabled: backendData.socialProof.enabled !== false,
        order: 4,
        data: {
          testimonials: backendData.socialProof.testimonials || [],
          logos: [],
        },
      } : defaultHomepageSettings.sections.socialProof,
      collection: backendData.collectionSection ? {
        enabled: backendData.collectionSection.enabled !== false,
        order: 5,
        data: {
          cards: [],
        },
      } : defaultHomepageSettings.sections.collection,
      craft: backendData.craft ? {
        enabled: backendData.craft.enabled !== false,
        order: 6,
        data: {
          steps: [],
        },
      } : defaultHomepageSettings.sections.craft,
      map: backendData.map ? {
        enabled: backendData.map.enabled !== false,
        order: 7,
        data: {
          title: "",
          description: "",
          coordinates: backendData.map.latitude && backendData.map.longitude ? {
            lat: backendData.map.latitude,
            lng: backendData.map.longitude,
          } : undefined,
        },
      } : defaultHomepageSettings.sections.map,
    },
    seo: backendData.seo || defaultHomepageSettings.seo,
    _id: backendData._id,
    version: backendData.version,
    status: backendData.status,
  };
};

const fetchDraft = async (): Promise<HomepageSettings> => {
  const response = await fetch("/api/homepage/draft", {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Không thể tải cấu hình trang chủ");
  }
  const result = await response.json();
  const backendData = result?.data || result;
  return transformBackendToFrontend(backendData);
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
        ...(prev?.typography || defaultHomepageSettings.typography),
        [field]: value,
      },
    }));
  };

  const updateColor = (field: keyof HomepageSettings["colors"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      colors: {
        ...(prev?.colors || defaultHomepageSettings.colors),
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

  const heroSlides = useMemo(() => {
    const slides = formState?.sections?.hero?.data?.slides || [];
    return slides.length > 0 ? slides : [heroSlideDefaults];
  }, [formState]);

  const addHeroSlide = () => {
    setFormState((prev) => {
      const sections = prev?.sections || defaultHomepageSettings.sections;
      const slides = [...(sections.hero?.data?.slides || [])];
      slides.push({ ...heroSlideDefaults });
      return {
        ...prev,
        sections: {
          ...sections,
          hero: {
            ...sections.hero,
            data: { ...sections.hero.data, slides },
          },
        },
      };
    });
  };

  const removeHeroSlide = (index: number) => {
    setFormState((prev) => {
      const sections = prev?.sections || defaultHomepageSettings.sections;
      const slides = [...(sections.hero?.data?.slides || [])];
      slides.splice(index, 1);
      return {
        ...prev,
        sections: {
          ...sections,
          hero: {
            ...sections.hero,
            data: { ...sections.hero.data, slides: slides.length > 0 ? slides : [heroSlideDefaults] },
          },
        },
      };
    });
  };

  const updateHeroSlide = (index: number, updater: (slide: any) => any) => {
    setFormState((prev) => {
      const sections = prev?.sections || defaultHomepageSettings.sections;
      const slides = [...(sections.hero?.data?.slides || [])];
      slides[index] = updater(slides[index] || heroSlideDefaults);
      return {
        ...prev,
        sections: {
          ...sections,
          hero: {
            ...sections.hero,
            data: { ...sections.hero.data, slides },
          },
        },
      };
    });
  };

  const moveHeroSlide = (fromIndex: number, toIndex: number) => {
    setFormState((prev) => {
      const sections = prev?.sections || defaultHomepageSettings.sections;
      const slides = [...(sections.hero?.data?.slides || [])];
      const [moved] = slides.splice(fromIndex, 1);
      slides.splice(toIndex, 0, moved);
      return {
        ...prev,
        sections: {
          ...sections,
          hero: {
            ...sections.hero,
            data: { ...sections.hero.data, slides },
          },
        },
      };
    });
  };

  // Transform frontend format to backend format
  const transformFrontendToBackend = (frontendData: HomepageSettings): any => {
    const heroSlide = frontendData?.sections?.hero?.data?.slides?.[0];
    return {
      typography: {
        headingFont: frontendData.typography?.fontFamily || "Playfair Display",
        bodyFont: "Be Vietnam Pro",
        googleFontUrl: frontendData.typography?.fontUrl,
        baseFontSize: frontendData.typography?.baseSize || 16,
        headingSizes: {
          h1: (frontendData.typography?.baseSize || 16) * (frontendData.typography?.headingScale?.h1 || 3),
          h2: (frontendData.typography?.baseSize || 16) * (frontendData.typography?.headingScale?.h2 || 2),
          h3: (frontendData.typography?.baseSize || 16) * (frontendData.typography?.headingScale?.h3 || 1.5),
          h4: 20,
        },
      },
      colors: frontendData.colors || {},
      hero: {
        slides: (frontendData.sections?.hero?.data?.slides || []).map((slide: any, index: number) => ({
          imageUrl: slide.desktopImage?.url || "",
          title: slide.title || "",
          subtitle: slide.subtitle || "",
          ctaText: slide.cta?.label || "",
          ctaLink: slide.cta?.href || "",
          order: index,
        })),
      },
      marquee: {
        items: frontendData.sections?.marquee?.data?.phrases || [],
        enabled: frontendData.sections?.marquee?.enabled !== false,
      },
      featuredProducts: {
        productIds: frontendData.sections?.featuredProducts?.data?.productIds || [],
        title: "Sản Phẩm Nổi Bật",
        subtitle: "",
        enabled: frontendData.sections?.featuredProducts?.enabled !== false,
      },
      about: frontendData.sections?.about ? {
        title: frontendData.sections.about.data?.heading || "",
        content: frontendData.sections.about.data?.body || "",
        imageUrl: frontendData.sections.about.data?.media?.url,
        founderName: frontendData.sections.about.data?.founderName || "",
        founderTitle: frontendData.sections.about.data?.founderTitle || "",
        founderQuote: frontendData.sections.about.data?.founderQuote || "",
        enabled: frontendData.sections.about.enabled !== false,
      } : undefined,
      socialProof: frontendData.sections?.socialProof ? {
        testimonials: frontendData.sections.socialProof.data?.testimonials || [],
        enabled: frontendData.sections.socialProof.enabled !== false,
      } : undefined,
      collectionSection: frontendData.sections?.collection ? {
        title: "",
        description: "",
        enabled: frontendData.sections.collection.enabled !== false,
      } : undefined,
      craft: frontendData.sections?.craft ? {
        title: "",
        description: "",
        images: [],
        enabled: frontendData.sections.craft.enabled !== false,
      } : undefined,
      map: frontendData.sections?.map ? {
        enabled: frontendData.sections.map.enabled !== false,
        latitude: frontendData.sections.map.data?.coordinates?.lat,
        longitude: frontendData.sections.map.data?.coordinates?.lng,
      } : undefined,
      seo: frontendData.seo || {},
      status,
      _id: frontendData._id,
      version: frontendData.version,
    };
  };

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload image function for specific slide
  const handleImageUploadForSlide = async (file: File, slideIndex: number) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/homepage/images", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload ảnh thất bại");
      }

      const imageUrl = result.data?.url || result.data?.secure_url || result.url;

      if (!imageUrl) {
        throw new Error("Không nhận được URL ảnh từ server");
      }

      // Update specific slide
      updateHeroSlide(slideIndex, (slide) => ({
        ...slide,
        desktopImage: {
          ...slide.desktopImage,
          url: imageUrl,
        },
      }));

      toast.success("Upload ảnh thành công!");
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error?.message || "Upload ảnh thất bại");
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload image function
  const handleImageUpload = async (file: File, field: "hero" | "about" | "collection" | "craft") => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/homepage/images", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload ảnh thất bại");
      }

      const imageUrl = result.data?.url || result.data?.secure_url || result.url;

      if (!imageUrl) {
        throw new Error("Không nhận được URL ảnh từ server");
      }

      // Update form state with new image URL
      if (field === "hero") {
        // Find first slide without image or update last slide
        setFormState((prev) => {
          const sections = prev?.sections || defaultHomepageSettings.sections;
          const slides = [...(sections.hero?.data?.slides || [])];
          const lastIndex = slides.length - 1;
          if (lastIndex >= 0) {
            slides[lastIndex] = {
              ...slides[lastIndex],
              desktopImage: {
                ...slides[lastIndex].desktopImage,
                url: imageUrl,
              },
            };
          } else {
            slides.push({
              ...heroSlideDefaults,
              desktopImage: { url: imageUrl },
            });
          }
          return {
            ...prev,
            sections: {
              ...sections,
              hero: {
                ...sections.hero,
                data: { ...sections.hero.data, slides },
              },
            },
          };
        });
      } else {
        // Handle other image fields if needed
        setFormState((prev) => {
          const sections = prev?.sections || defaultHomepageSettings.sections;
          return {
            ...prev,
            sections: {
              ...sections,
              [field]: {
                ...sections[field as keyof typeof sections],
                data: {
                  ...(sections[field as keyof typeof sections]?.data || {}),
                  ...(field === "about" && {
                    media: { url: imageUrl, alt: "" },
                  }),
                },
              },
            },
          };
        });
      }

      toast.success("Upload ảnh thành công!");
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error?.message || "Upload ảnh thất bại");
    } finally {
      setUploadingImage(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (status: "draft" | "published") => {
      const backendData = transformFrontendToBackend({ ...formState, status });
      const response = await fetch("/api/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(backendData),
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
                value={formState?.typography?.fontFamily || ""}
                onChange={(e) => updateTypography("fontFamily", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Google Font URL (tuỳ chọn)</Label>
              <Input
                value={formState?.typography?.fontUrl || ""}
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
                value={formState?.typography?.baseSize || 16}
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
            {Object.entries(formState?.colors || defaultHomepageSettings.colors).map(([key, value]) => (
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon />
            <div>
              <CardTitle>Hero Section - Slides</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quản lý nhiều slides cho hero section
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addHeroSlide}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm Slide
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-4 bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold">Slide {index + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveHeroSlide(index, index - 1)}
                    >
                      ↑
                    </Button>
                  )}
                  {index < heroSlides.length - 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveHeroSlide(index, index + 1)}
                    >
                      ↓
                    </Button>
                  )}
                  {heroSlides.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHeroSlide(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tiêu đề</Label>
                  <Textarea
                    value={(slide?.title as string) || ""}
                    onChange={(e) =>
                      updateHeroSlide(index, (slide) => ({
                        ...slide,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={slide?.subtitle || ""}
                    onChange={(e) =>
                      updateHeroSlide(index, (slide) => ({
                        ...slide,
                        subtitle: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nút CTA</Label>
                  <Input
                    value={slide?.cta?.label || ""}
                    onChange={(e) =>
                      updateHeroSlide(index, (slide) => ({
                        ...slide,
                        cta: { ...(slide.cta || {}), label: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Liên kết CTA</Label>
                  <Input
                    value={slide?.cta?.href || ""}
                    onChange={(e) =>
                      updateHeroSlide(index, (slide) => ({
                        ...slide,
                        cta: { ...(slide.cta || {}), href: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Ảnh nền</Label>
                  <div className="space-y-3">
                    {/* Image Preview */}
                    {slide?.desktopImage?.url && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={slide.desktopImage.url}
                          alt={`Hero slide ${index + 1} preview`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateHeroSlide(index, (slide) => ({
                              ...slide,
                              desktopImage: { ...slide.desktopImage, url: "" },
                            }))
                          }
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        data-slide-index={index}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          const slideIndex = parseInt(
                            e.currentTarget.getAttribute("data-slide-index") || "0"
                          );
                          if (file) {
                            handleImageUploadForSlide(file, slideIndex);
                          }
                          // Reset input
                          if (e.currentTarget) {
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.querySelector(
                            `input[data-slide-index="${index}"]`
                          ) as HTMLInputElement;
                          input?.click();
                        }}
                        disabled={uploadingImage}
                        className="flex items-center gap-2"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tải...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            {slide?.desktopImage?.url ? "Thay đổi ảnh" : "Tải ảnh lên"}
                          </>
                        )}
                      </Button>

                      {/* URL Input (fallback) */}
                      <div className="flex-1">
                        <Input
                          placeholder="Hoặc nhập URL ảnh"
                          value={slide?.desktopImage?.url || ""}
                          onChange={(e) =>
                            updateHeroSlide(index, (slide) => ({
                              ...slide,
                              desktopImage: {
                                ...(slide.desktopImage || {}),
                                url: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Hỗ trợ: JPEG, PNG, GIF, WebP (tối đa 10MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              formState?.sections?.marquee?.data?.phrases
            )}
            onChange={(e) => {
              const phrases = parseTextarea(e.target.value);
              setFormState((prev) => {
                const sections = prev?.sections || defaultHomepageSettings.sections;
                return {
                  ...prev,
                  sections: {
                    ...sections,
                    marquee: {
                      ...sections.marquee,
                      data: {
                        ...(sections.marquee?.data || {}),
                        phrases,
                      },
                    },
                  },
                };
              });
            }}
            placeholder={"Câu 1\nCâu 2\nCâu 3"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <ImageIcon />
          <div>
            <CardTitle>About Section - Về Chúng Tôi</CardTitle>
            <p className="text-sm text-muted-foreground">
              Chỉnh sửa nội dung phần giới thiệu về công ty
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input
              value={formState?.sections?.about?.data?.heading || ""}
              onChange={(e) => {
                setFormState((prev) => {
                  const sections = prev?.sections || defaultHomepageSettings.sections;
                  return {
                    ...prev,
                    sections: {
                      ...sections,
                      about: {
                        ...sections.about,
                        data: {
                          ...(sections.about?.data || {}),
                          heading: e.target.value,
                        },
                      },
                    },
                  };
                });
              }}
              placeholder="Câu Chuyện LALA-LYCHEE"
            />
          </div>

          <div className="space-y-2">
            <Label>Nội dung chính</Label>
            <Textarea
              rows={8}
              value={formState?.sections?.about?.data?.body || ""}
              onChange={(e) => {
                setFormState((prev) => {
                  const sections = prev?.sections || defaultHomepageSettings.sections;
                  return {
                    ...prev,
                    sections: {
                      ...sections,
                      about: {
                        ...sections.about,
                        data: {
                          ...(sections.about?.data || {}),
                          body: e.target.value,
                        },
                      },
                    },
                  };
                });
              }}
              placeholder="Nhập nội dung về công ty..."
            />
            <p className="text-xs text-muted-foreground">
              Sử dụng dòng trống để phân tách đoạn văn. Đoạn có dấu ngoặc kép sẽ được hiển thị dạng quote.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tên Founder/CEO</Label>
              <Input
                value={formState?.sections?.about?.data?.founderName || ""}
                onChange={(e) => {
                  setFormState((prev) => {
                    const sections = prev?.sections || defaultHomepageSettings.sections;
                    return {
                      ...prev,
                      sections: {
                        ...sections,
                        about: {
                          ...sections.about,
                          data: {
                            ...(sections.about?.data || {}),
                            founderName: e.target.value,
                          },
                        },
                      },
                    };
                  });
                }}
                placeholder="PHẠM VĂN NHÂN"
              />
            </div>

            <div className="space-y-2">
              <Label>Chức danh</Label>
              <Input
                value={formState?.sections?.about?.data?.founderTitle || ""}
                onChange={(e) => {
                  setFormState((prev) => {
                    const sections = prev?.sections || defaultHomepageSettings.sections;
                    return {
                      ...prev,
                      sections: {
                        ...sections,
                        about: {
                          ...sections.about,
                          data: {
                            ...(sections.about?.data || {}),
                            founderTitle: e.target.value,
                          },
                        },
                      },
                    };
                  });
                }}
                placeholder="Founder & CEO"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quote của Founder (hiển thị trên ảnh)</Label>
            <Input
              value={formState?.sections?.about?.data?.founderQuote || ""}
              onChange={(e) => {
                setFormState((prev) => {
                  const sections = prev?.sections || defaultHomepageSettings.sections;
                  return {
                    ...prev,
                    sections: {
                      ...sections,
                      about: {
                        ...sections.about,
                        data: {
                          ...(sections.about?.data || {}),
                          founderQuote: e.target.value,
                        },
                      },
                    },
                  };
                });
              }}
              placeholder='"Mang niềm tự hào trở lại với quê hương."'
            />
          </div>

          <div className="space-y-2">
            <Label>Ảnh Founder/CEO</Label>
            <div className="space-y-3">
              {/* Image Preview */}
              {formState?.sections?.about?.data?.media?.url && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={formState.sections.about.data.media.url}
                    alt="About preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormState((prev) => {
                        const sections = prev?.sections || defaultHomepageSettings.sections;
                        return {
                          ...prev,
                          sections: {
                            ...sections,
                            about: {
                              ...sections.about,
                              data: {
                                ...(sections.about?.data || {}),
                                media: { ...(sections.about?.data?.media || {}), url: "" },
                              },
                            },
                          },
                        };
                      });
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  id="about-image-upload"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadingImage(true);
                      try {
                        const formData = new FormData();
                        formData.append("image", file);

                        const response = await fetch("/api/homepage/images", {
                          method: "POST",
                          credentials: "include",
                          body: formData,
                        });

                        const result = await response.json();

                        if (!response.ok || !result.success) {
                          throw new Error(result.error || "Upload ảnh thất bại");
                        }

                        const imageUrl = result.data?.url || result.data?.secure_url || result.url;

                        if (!imageUrl) {
                          throw new Error("Không nhận được URL ảnh từ server");
                        }

                        setFormState((prev) => {
                          const sections = prev?.sections || defaultHomepageSettings.sections;
                          return {
                            ...prev,
                            sections: {
                              ...sections,
                              about: {
                                ...sections.about,
                                data: {
                                  ...(sections.about?.data || {}),
                                  media: { url: imageUrl, alt: "" },
                                },
                              },
                            },
                          };
                        });

                        toast.success("Upload ảnh thành công!");
                      } catch (error: any) {
                        console.error("Image upload error:", error);
                        toast.error(error?.message || "Upload ảnh thất bại");
                      } finally {
                        setUploadingImage(false);
                      }
                    }
                    // Reset input
                    if (e.target) {
                      e.target.value = "";
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById("about-image-upload") as HTMLInputElement;
                    input?.click();
                  }}
                  disabled={uploadingImage}
                  className="flex items-center gap-2"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {formState?.sections?.about?.data?.media?.url ? "Thay đổi ảnh" : "Tải ảnh lên"}
                    </>
                  )}
                </Button>

                {/* URL Input (fallback) */}
                <div className="flex-1">
                  <Input
                    placeholder="Hoặc nhập URL ảnh"
                    value={formState?.sections?.about?.data?.media?.url || ""}
                    onChange={(e) => {
                      setFormState((prev) => {
                        const sections = prev?.sections || defaultHomepageSettings.sections;
                        return {
                          ...prev,
                          sections: {
                            ...sections,
                            about: {
                              ...sections.about,
                              data: {
                                ...(sections.about?.data || {}),
                                media: {
                                  ...(sections.about?.data?.media || {}),
                                  url: e.target.value,
                                },
                              },
                            },
                          },
                        };
                      });
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Hỗ trợ: JPEG, PNG, GIF, WebP (tối đa 10MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

