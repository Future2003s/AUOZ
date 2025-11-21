"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Palette,
  Type,
  Image as ImageIcon,
  Save,
  Upload,
  X,
  Plus,
  Trash2,
  GripVertical,
  Layout,
  Settings,
  FileText,
  Eye,
} from "lucide-react";
import { HomepageSettings } from "@/types/homepage";
import { defaultHomepageSettings } from "@/lib/homepage-default";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { HomePageClient } from "@/components/pages/homepage-client";
import { ImageUpload } from "@/components/ImageUpload";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const convertToTextarea = (values?: string[]) => (values || []).join("\n");
const parseTextarea = (value: string) =>
  value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

// Sortable Slide Item Component
interface SortableSlideItemProps {
  id: string;
  slide: any;
  index: number;
  heroSlides: any[];
  updateHeroSlide: (index: number, updater: (slide: any) => any) => void;
  removeHeroSlide: (index: number) => void;
  moveHeroSlide: (from: number, to: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadingImage: boolean;
  handleImageUploadForSlide: (file: File, slideIndex: number) => void;
}

function SortableSlideItem({
  id,
  slide,
  index,
  heroSlides,
  updateHeroSlide,
  removeHeroSlide,
  moveHeroSlide,
  fileInputRef,
  uploadingImage,
  handleImageUploadForSlide,
}: SortableSlideItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-2 rounded-xl p-6 space-y-6 bg-white hover:border-blue-300 transition-colors ${
        isDragging ? "border-blue-500 shadow-lg" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-5 h-5 text-gray-400 hover:text-blue-600 transition-colors" />
          </div>
          <span className="font-bold text-lg text-gray-900">
            Slide {index + 1}
          </span>
          {slide?.desktopImage?.url && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              Có ảnh
            </span>
          )}
          {isDragging && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full animate-pulse">
              Đang kéo...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => moveHeroSlide(index, index - 1)}
              className="h-8 w-8 p-0"
            >
              ↑
            </Button>
          )}
          {index < heroSlides.length - 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => moveHeroSlide(index, index + 1)}
              className="h-8 w-8 p-0"
            >
              ↓
            </Button>
          )}
          {heroSlides.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeHeroSlide(index)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image Section - Left Side */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Ảnh nền</Label>
          {/* Image Preview */}
          {slide?.desktopImage?.url ? (
            <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
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
                className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative w-full h-64 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Chưa có ảnh</p>
              </div>
            </div>
          )}
          {/* Upload Button */}
          <div className="space-y-2">
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
              className="w-full flex items-center justify-center gap-2"
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
            <Input
              placeholder="Hoặc nhập URL ảnh trực tiếp"
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
            <p className="text-xs text-gray-500">
              Hỗ trợ: JPEG, PNG, GIF, WebP (tối đa 10MB)
            </p>
          </div>
        </div>

        {/* Content Section - Right Side */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Tiêu đề</Label>
            <Textarea
              value={(slide?.title as string) || ""}
              onChange={(e) =>
                updateHeroSlide(index, (slide) => ({
                  ...slide,
                  title: e.target.value,
                }))
              }
              placeholder="Nhập tiêu đề slide..."
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Mô tả</Label>
            <Textarea
              value={slide?.subtitle || ""}
              onChange={(e) =>
                updateHeroSlide(index, (slide) => ({
                  ...slide,
                  subtitle: e.target.value,
                }))
              }
              placeholder="Nhập mô tả slide..."
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Nút CTA</Label>
              <Input
                value={slide?.cta?.label || ""}
                onChange={(e) =>
                  updateHeroSlide(index, (slide) => ({
                    ...slide,
                    cta: { ...(slide.cta || {}), label: e.target.value },
                  }))
                }
                placeholder="Ví dụ: Xem ngay"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">Liên kết CTA</Label>
              <Input
                value={slide?.cta?.href || ""}
                onChange={(e) =>
                  updateHeroSlide(index, (slide) => ({
                    ...slide,
                    cta: { ...(slide.cta || {}), href: e.target.value },
                  }))
                }
                placeholder="#products"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      fontFamily:
        backendData.typography?.headingFont ||
        defaultHomepageSettings.typography.fontFamily,
      fontUrl: backendData.typography?.googleFontUrl,
      baseSize:
        backendData.typography?.baseFontSize ||
        defaultHomepageSettings.typography.baseSize,
      headingScale: {
        h1:
          (backendData.typography?.headingSizes?.h1 || 48) /
          (backendData.typography?.baseFontSize || 16),
        h2:
          (backendData.typography?.headingSizes?.h2 || 36) /
          (backendData.typography?.baseFontSize || 16),
        h3:
          (backendData.typography?.headingSizes?.h3 || 24) /
          (backendData.typography?.baseFontSize || 16),
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
          phrases:
            backendData.marquee?.items ||
            defaultHomepageSettings.sections.marquee.data.phrases,
          speed: 40,
        },
      },
      about: backendData.about
        ? {
        enabled: backendData.about.enabled !== false,
        order: 2,
        data: {
          heading: backendData.about.title || "",
          body: backendData.about.content || "",
              media: backendData.about.imageUrl
                ? {
            url: backendData.about.imageUrl,
            alt: "",
                  }
                : undefined,
          founderName: backendData.about.founderName || "",
          founderTitle: backendData.about.founderTitle || "",
          founderQuote: backendData.about.founderQuote || "",
        },
          }
        : defaultHomepageSettings.sections.about,
      featuredProducts: backendData.featuredProducts
        ? {
        enabled: backendData.featuredProducts.enabled !== false,
        order: 3,
        data: {
              productIds: (backendData.featuredProducts.productIds || []).map(
                (id: any) => (typeof id === "string" ? id : id.toString())
          ),
          layout: "grid" as const,
        },
          }
        : defaultHomepageSettings.sections.featuredProducts,
      socialProof: backendData.socialProof
        ? {
        enabled: backendData.socialProof.enabled !== false,
        order: 4,
        data: {
          testimonials: backendData.socialProof.testimonials || [],
          logos: [],
        },
          }
        : defaultHomepageSettings.sections.socialProof,
      collection: backendData.collectionSection
        ? {
        enabled: backendData.collectionSection.enabled !== false,
        order: 5,
        data: {
          cards: [],
        },
          }
        : defaultHomepageSettings.sections.collection,
      craft: backendData.craft
        ? {
        enabled: backendData.craft.enabled !== false,
        order: 6,
        data: {
              heading:
                backendData.craft.title ||
                defaultHomepageSettings.sections.craft.data.heading,
              subheading:
                backendData.craft.description ||
                defaultHomepageSettings.sections.craft.data.subheading,
              steps:
                backendData.craft.steps && backendData.craft.steps.length > 0
                  ? backendData.craft.steps
                      .slice()
                      .sort(
                        (a: any, b: any) =>
                          (a.order ?? 0) - (b.order ?? 0)
                      )
                      .map((step: any) => ({
                        title: step.title || "",
                        description: step.description || "",
                        imageUrl: step.imageUrl || "",
                      }))
                  : defaultHomepageSettings.sections.craft.data.steps,
            },
          }
        : defaultHomepageSettings.sections.craft,
      map: backendData.map
        ? {
        enabled: backendData.map.enabled !== false,
        order: 7,
        data: {
          title: "",
          description: "",
              coordinates:
                backendData.map.latitude && backendData.map.longitude
                  ? {
            lat: backendData.map.latitude,
            lng: backendData.map.longitude,
                    }
                  : undefined,
        },
          }
        : defaultHomepageSettings.sections.map,
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (data) {
      setFormState(data);
    }
  }, [data]);

  const updateTypography = (
    field: keyof HomepageSettings["typography"],
    value: any
  ) => {
    setFormState((prev) => ({
      ...prev,
      typography: {
        ...(prev?.typography || defaultHomepageSettings.typography),
        [field]: value,
      },
    }));
  };

  const updateColor = (
    field: keyof HomepageSettings["colors"],
    value: string
  ) => {
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

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormState((prev) => {
        const sections = prev?.sections || defaultHomepageSettings.sections;
        const slides = [...(sections.hero?.data?.slides || [])];
        const oldIndex = slides.findIndex((_, i) => `slide-${i}` === active.id);
        const newIndex = slides.findIndex((_, i) => `slide-${i}` === over.id);

        const newSlides = arrayMove(slides, oldIndex, newIndex);
        return {
          ...prev,
          sections: {
            ...sections,
            hero: {
              ...sections.hero,
              data: { ...sections.hero.data, slides: newSlides },
            },
          },
        };
      });
    }
  };

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
            data: {
              ...sections.hero.data,
              slides: slides.length > 0 ? slides : [heroSlideDefaults],
            },
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
  const transformFrontendToBackend = (
    frontendData: HomepageSettings & { status?: "draft" | "published" }
  ): any => {
    const heroSlide = frontendData?.sections?.hero?.data?.slides?.[0];
    return {
      typography: {
        headingFont: frontendData.typography?.fontFamily || "Playfair Display",
        bodyFont: "Be Vietnam Pro",
        googleFontUrl: frontendData.typography?.fontUrl,
        baseFontSize: frontendData.typography?.baseSize || 16,
        headingSizes: {
          h1:
            (frontendData.typography?.baseSize || 16) *
            (frontendData.typography?.headingScale?.h1 || 3),
          h2:
            (frontendData.typography?.baseSize || 16) *
            (frontendData.typography?.headingScale?.h2 || 2),
          h3:
            (frontendData.typography?.baseSize || 16) *
            (frontendData.typography?.headingScale?.h3 || 1.5),
          h4: 20,
        },
      },
      colors: frontendData.colors || {},
      hero: {
        slides: (frontendData.sections?.hero?.data?.slides || [])
          .filter((slide: any) => {
            // Filter out slides that don't have required fields (imageUrl is required)
            return (
              slide.desktopImage?.url && slide.desktopImage.url.trim() !== ""
            );
          })
          .map((slide: any, index: number) => ({
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
        productIds:
          frontendData.sections?.featuredProducts?.data?.productIds || [],
        title: "Sản Phẩm Nổi Bật",
        subtitle: "",
        enabled: frontendData.sections?.featuredProducts?.enabled !== false,
      },
      about: frontendData.sections?.about
        ? {
        title: frontendData.sections.about.data?.heading || "",
        content: frontendData.sections.about.data?.body || "",
        imageUrl: frontendData.sections.about.data?.media?.url,
        founderName: frontendData.sections.about.data?.founderName || "",
        founderTitle: frontendData.sections.about.data?.founderTitle || "",
        founderQuote: frontendData.sections.about.data?.founderQuote || "",
        enabled: frontendData.sections.about.enabled !== false,
          }
        : undefined,
      socialProof: frontendData.sections?.socialProof
        ? {
            testimonials:
              frontendData.sections.socialProof.data?.testimonials || [],
        enabled: frontendData.sections.socialProof.enabled !== false,
          }
        : undefined,
      collectionSection: frontendData.sections?.collection
        ? {
        title: "",
        description: "",
        enabled: frontendData.sections.collection.enabled !== false,
          }
        : undefined,
      craft: frontendData.sections?.craft
        ? {
            title:
              frontendData.sections.craft.data?.heading ||
              "Quy Trình Sáng Tạo",
            description:
              frontendData.sections.craft.data?.subheading ||
              "Hành trình từ trái vải tươi ngon đến sản phẩm tinh hoa trên tay bạn.",
        images: [],
            steps: (frontendData.sections.craft.data?.steps || []).map(
              (step, index) => ({
                title: step.title || "",
                description: step.description || "",
                imageUrl: step.imageUrl || "",
                order: index,
              })
            ),
        enabled: frontendData.sections.craft.enabled !== false,
          }
        : undefined,
      map: frontendData.sections?.map
        ? {
        enabled: frontendData.sections.map.enabled !== false,
        latitude: frontendData.sections.map.data?.coordinates?.lat,
        longitude: frontendData.sections.map.data?.coordinates?.lng,
          }
        : undefined,
      seo: frontendData.seo || {},
      status: frontendData.status || "draft", // Get status from frontendData
      // Don't send _id and version - let backend handle them
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

      const imageUrl =
        result.data?.url || result.data?.secure_url || result.url;

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
  const handleImageUpload = async (
    file: File,
    field: "hero" | "about" | "collection" | "craft"
  ) => {
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

      const imageUrl =
        result.data?.url || result.data?.secure_url || result.url;

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
      console.log("📝 [Admin Homepage] Publishing with status:", status);
      console.log(
        "📝 [Admin Homepage] Backend data:",
        JSON.stringify(backendData, null, 2)
      );

      // Validate hero slides before sending
      const validSlides =
        backendData.hero?.slides?.filter((slide: any) => {
          const isValid = slide.imageUrl && slide.imageUrl.trim() !== "";
          if (!isValid) {
            console.warn("📝 [Admin Homepage] Skipping invalid slide:", slide);
          }
          return isValid;
        }) || [];

      if (validSlides.length === 0 && backendData.hero?.slides?.length > 0) {
        throw new Error("Vui lòng thêm ít nhất một slide có hình ảnh");
      }

      // Update with filtered slides
      const validatedData = {
        ...backendData,
        hero: {
          ...backendData.hero,
          slides: validSlides,
        },
      };

      const response = await fetch("/api/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validatedData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("📝 [Admin Homepage] Error response:", errorText);
        let errorMessage = "Không thể lưu cấu hình";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          // If not JSON, use the text as is
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }
      const result = await response.json();
      console.log("📝 [Admin Homepage] Success response:", result);
      return result;
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
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
              <h1 className="text-2xl font-bold text-gray-900">Tùy chỉnh trang chủ</h1>
              <p className="text-sm text-gray-500 mt-1">
                Quản lý nội dung, thiết kế và cấu hình trang chủ
          </p>
        </div>
        <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(true)}
                size="lg"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem trước
              </Button>
          <Button
            variant="outline"
            onClick={() => mutation.mutate("draft")}
                disabled={mutation.isPending}
                size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            Lưu nháp
          </Button>
          <Button
            onClick={() => mutation.mutate("published")}
                disabled={mutation.isPending}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
          >
                {mutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Xuất bản
          </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="hero" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Hero Slides
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Thiết kế
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Nội dung
            </TabsTrigger>
            <TabsTrigger value="craft" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Quy trình
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Cài đặt
            </TabsTrigger>
          </TabsList>

          {/* Hero Slides Tab */}
          <TabsContent value="hero" className="space-y-6 mt-6">
        <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
            <div>
                    <CardTitle className="text-xl">Hero Section - Slides</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quản lý các slides hiển thị trên phần hero của trang chủ
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addHeroSlide}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm Slide
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={heroSlides.map((_, index) => `slide-${index}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {heroSlides.map((slide, index) => (
                        <SortableSlideItem
                          key={`slide-${index}`}
                          id={`slide-${index}`}
                          slide={slide}
                          index={index}
                          heroSlides={heroSlides}
                          updateHeroSlide={updateHeroSlide}
                          removeHeroSlide={removeHeroSlide}
                          moveHeroSlide={moveHeroSlide}
                          fileInputRef={fileInputRef}
                          uploadingImage={uploadingImage}
                          handleImageUploadForSlide={handleImageUploadForSlide}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-purple-600" />
                  <div>
                    <CardTitle className="text-xl">Phông chữ & Kích thước</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                Điều chỉnh font chữ tổng thể cho trang
              </p>
                  </div>
            </div>
          </CardHeader>
              <CardContent className="space-y-4 pt-6">
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
              <CardHeader className="bg-gradient-to-r from-pink-50 to-orange-50">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-pink-600" />
            <div>
                    <CardTitle className="text-xl">Bảng màu</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                Tuỳ chỉnh màu thương hiệu
              </p>
                  </div>
            </div>
          </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 pt-6">
                {Object.entries(
                  formState?.colors || defaultHomepageSettings.colors
                ).map(([key, value]) => (
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
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6 mt-6">
      <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
          <div className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-green-600" />
            <div>
                  <CardTitle className="text-xl">Marquee Banner</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mỗi dòng tương ứng một câu chạy chữ trên banner
              </p>
            </div>
          </div>
        </CardHeader>
            <CardContent className="pt-6">
              <Textarea
                rows={6}
                value={convertToTextarea(
                  formState?.sections?.marquee?.data?.phrases
                )}
                onChange={(e) => {
                  const phrases = parseTextarea(e.target.value);
                  setFormState((prev) => {
                    const sections =
                      prev?.sections || defaultHomepageSettings.sections;
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
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-purple-600" />
                  <div>
                    <CardTitle className="text-xl">Phông chữ & Kích thước</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Điều chỉnh font chữ tổng thể cho trang
                    </p>
                </div>
              </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
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
              <CardHeader className="bg-gradient-to-r from-pink-50 to-orange-50">
                    <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-pink-600" />
                  <div>
                    <CardTitle className="text-xl">Bảng màu</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tuỳ chỉnh màu thương hiệu
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 pt-6">
                {Object.entries(
                  formState?.colors || defaultHomepageSettings.colors
                ).map(([key, value]) => (
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
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6 mt-6">
      <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
              <div className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-green-600" />
                <div>
                  <CardTitle className="text-xl">Marquee Banner</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
            Mỗi dòng tương ứng một câu chạy chữ trên banner
          </p>
                </div>
              </div>
        </CardHeader>
            <CardContent className="pt-6">
          <Textarea
            rows={6}
            value={convertToTextarea(
              formState?.sections?.marquee?.data?.phrases
            )}
            onChange={(e) => {
              const phrases = parseTextarea(e.target.value);
              setFormState((prev) => {
                    const sections =
                      prev?.sections || defaultHomepageSettings.sections;
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
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-600" />
          <div>
                  <CardTitle className="text-xl">About Section - Về Chúng Tôi</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
              Chỉnh sửa nội dung phần giới thiệu về công ty
            </p>
                </div>
          </div>
        </CardHeader>
              <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input
              value={formState?.sections?.about?.data?.heading || ""}
              onChange={(e) => {
                setFormState((prev) => {
                        const sections =
                          prev?.sections || defaultHomepageSettings.sections;
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
                        const sections =
                          prev?.sections || defaultHomepageSettings.sections;
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
                    Sử dụng dòng trống để phân tách đoạn văn. Đoạn có dấu ngoặc kép sẽ
                    được hiển thị dạng quote.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tên Founder/CEO</Label>
              <Input
                value={formState?.sections?.about?.data?.founderName || ""}
                onChange={(e) => {
                  setFormState((prev) => {
                          const sections =
                            prev?.sections || defaultHomepageSettings.sections;
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
                          const sections =
                            prev?.sections || defaultHomepageSettings.sections;
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
                        const sections =
                          prev?.sections || defaultHomepageSettings.sections;
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
                              const sections =
                                prev?.sections || defaultHomepageSettings.sections;
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
                                        url: "",
                                      },
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
                                throw new Error(
                                  result.error || "Upload ảnh thất bại"
                                );
                        }

                              const imageUrl =
                                result.data?.url ||
                                result.data?.secure_url ||
                                result.url;

                        if (!imageUrl) {
                          throw new Error("Không nhận được URL ảnh từ server");
                        }

                        setFormState((prev) => {
                                const sections =
                                  prev?.sections || defaultHomepageSettings.sections;
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
                    if (e.target) {
                      e.target.value = "";
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                          const input = document.getElementById(
                            "about-image-upload"
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
                            {formState?.sections?.about?.data?.media?.url
                              ? "Thay đổi ảnh"
                              : "Tải ảnh lên"}
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
                              const sections =
                                prev?.sections || defaultHomepageSettings.sections;
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
          </TabsContent>

        {/* Craft Tab */}
        <TabsContent value="craft" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="bg-gradient-to-r from-rose-50 to-orange-50">
              <div className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-rose-600" />
                <div>
                  <CardTitle className="text-xl">Quy Trình Sáng Tạo</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tuỳ chỉnh tiêu đề, mô tả và các bước trong quy trình sáng tạo
                  </p>
    </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label>Tiêu đề section</Label>
                <Input
                  value={formState.sections.craft.data?.heading || ""}
                  onChange={(e) =>
                    setFormState((prev) => {
                      const sections =
                        prev?.sections || defaultHomepageSettings.sections;
                      return {
                        ...prev,
                        sections: {
                          ...sections,
                          craft: {
                            ...sections.craft,
                            data: {
                              ...(sections.craft?.data || {}),
                              heading: e.target.value,
                            },
                          },
                        },
                      };
                    })
                  }
                  placeholder="Quy Trình Sáng Tạo"
                />
              </div>

              <div className="space-y-2">
                <Label>Mô tả ngắn</Label>
                <Textarea
                  rows={3}
                  value={formState.sections.craft.data?.subheading || ""}
                  onChange={(e) =>
                    setFormState((prev) => {
                      const sections =
                        prev?.sections || defaultHomepageSettings.sections;
                      return {
                        ...prev,
                        sections: {
                          ...sections,
                          craft: {
                            ...sections.craft,
                            data: {
                              ...(sections.craft?.data || {}),
                              subheading: e.target.value,
                            },
                          },
                        },
                      };
                    })
                  }
                  placeholder="Hành trình từ trái vải tươi ngon..."
                />
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">Các bước quy trình</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormState((prev) => {
                      const sections =
                        prev?.sections || defaultHomepageSettings.sections;
                      const currentSteps =
                        sections.craft.data?.steps ||
                        defaultHomepageSettings.sections.craft.data.steps;
                      return {
                        ...prev,
                        sections: {
                          ...sections,
                          craft: {
                            ...sections.craft,
                            data: {
                              ...(sections.craft.data || {}),
                              steps: [
                                ...currentSteps,
                                {
                                  title: "",
                                  description: "",
                                  imageUrl: "",
                                },
                              ],
                            },
                          },
                        },
                      };
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm bước
                </Button>
              </div>

              <div className="space-y-4">
                {(formState.sections.craft.data?.steps ||
                  defaultHomepageSettings.sections.craft.data.steps
                ).map((step, index, arr) => (
                  <div
                    key={index}
                    className="border rounded-xl p-4 space-y-3 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        Bước {index + 1}{" "}
                        {step.title ? `- ${step.title}` : ""}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={index === 0}
                          onClick={() =>
                            setFormState((prev) => {
                              const sections =
                                prev?.sections ||
                                defaultHomepageSettings.sections;
                              const steps =
                                [...(sections.craft.data?.steps ||
                                  defaultHomepageSettings.sections.craft.data
                                    .steps)] || [];
                              if (index === 0) return prev;
                              const tmp = steps[index];
                              steps[index] = steps[index - 1];
                              steps[index - 1] = tmp;
                              return {
                                ...prev,
                                sections: {
                                  ...sections,
                                  craft: {
                                    ...sections.craft,
                                    data: {
                                      ...(sections.craft.data || {}),
                                      steps,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={index === arr.length - 1}
                          onClick={() =>
                            setFormState((prev) => {
                              const sections =
                                prev?.sections ||
                                defaultHomepageSettings.sections;
                              const steps =
                                [...(sections.craft.data?.steps ||
                                  defaultHomepageSettings.sections.craft.data
                                    .steps)] || [];
                              if (index === arr.length - 1) return prev;
                              const tmp = steps[index];
                              steps[index] = steps[index + 1];
                              steps[index + 1] = tmp;
                              return {
                                ...prev,
                                sections: {
                                  ...sections,
                                  craft: {
                                    ...sections.craft,
                                    data: {
                                      ...(sections.craft.data || {}),
                                      steps,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() =>
                            setFormState((prev) => {
                              const sections =
                                prev?.sections ||
                                defaultHomepageSettings.sections;
                              const steps =
                                [...(sections.craft.data?.steps ||
                                  defaultHomepageSettings.sections.craft.data
                                    .steps)] || [];
                              steps.splice(index, 1);
                              return {
                                ...prev,
                                sections: {
                                  ...sections,
                                  craft: {
                                    ...sections.craft,
                                    data: {
                                      ...(sections.craft.data || {}),
                                      steps,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Tiêu đề bước</Label>
                        <Input
                          value={step.title || ""}
                          onChange={(e) =>
                            setFormState((prev) => {
                              const sections =
                                prev?.sections ||
                                defaultHomepageSettings.sections;
                              const steps =
                                [...(sections.craft.data?.steps ||
                                  defaultHomepageSettings.sections.craft.data
                                    .steps)] || [];
                              steps[index] = {
                                ...steps[index],
                                title: e.target.value,
                              };
                              return {
                                ...prev,
                                sections: {
                                  ...sections,
                                  craft: {
                                    ...sections.craft,
                                    data: {
                                      ...(sections.craft.data || {}),
                                      steps,
                                    },
                                  },
                                },
                              };
                            })
                          }
                          placeholder="Nhập tiêu đề bước..."
                        />
                      </div>
                      <div className="space-y-2">
                        <ImageUpload
                          label="Ảnh bước"
                          value={step.imageUrl || ""}
                          onChange={(url) =>
                            setFormState((prev) => {
                              const sections =
                                prev?.sections ||
                                defaultHomepageSettings.sections;
                              const steps =
                                [...(sections.craft.data?.steps ||
                                  defaultHomepageSettings.sections.craft.data
                                    .steps)] || [];
                              steps[index] = {
                                ...steps[index],
                                imageUrl: url,
                              };
                              return {
                                ...prev,
                                sections: {
                                  ...sections,
                                  craft: {
                                    ...sections.craft,
                                    data: {
                                      ...(sections.craft.data || {}),
                                      steps,
                                    },
                                  },
                                },
                              };
                            })
                          }
                          folder="homepage-craft"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Mô tả bước</Label>
                      <Textarea
                        rows={3}
                        value={step.description || ""}
                        onChange={(e) =>
                          setFormState((prev) => {
                            const sections =
                              prev?.sections ||
                              defaultHomepageSettings.sections;
                            const steps =
                              [...(sections.craft.data?.steps ||
                                defaultHomepageSettings.sections.craft.data
                                  .steps)] || [];
                            steps[index] = {
                              ...steps[index],
                              description: e.target.value,
                            };
                            return {
                              ...prev,
                              sections: {
                                ...sections,
                                craft: {
                                  ...sections.craft,
                                  data: {
                                    ...(sections.craft.data || {}),
                                    steps,
                                  },
                                },
                              },
                            };
                          })
                        }
                        placeholder="Nhập mô tả chi tiết cho bước này..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0 z-50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <DialogTitle>Xem trước trang chủ</DialogTitle>
                <span className="text-xs text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full font-medium border border-amber-200">
                  ⚠️ Đây chỉ là bản xem trước - Thay đổi chưa được lưu
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    mutation.mutate("draft");
                  }}
                  disabled={mutation.isPending}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Lưu nháp
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    mutation.mutate("published");
                  }}
                  disabled={mutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Xuất bản ngay
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto h-[calc(95vh-73px)] bg-white">
            <HomePageClient settings={formState} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
