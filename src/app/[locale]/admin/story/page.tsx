"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Eye,
  Loader2,
  Upload,
  Image as ImageIcon,
  FileText,
  Video,
  Quote,
  BookOpen,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Copy,
  Trash2,
  Plus,
  Edit3,
  Layout,
  Palette,
} from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { usePathname } from "next/navigation";
// Removed Next.js Image import - using regular img tags for better compatibility

interface StorySettings {
  hero: {
    backgroundImage: string;
    title: string;
    subtitle: string;
    description: string;
  };
  chapter1: {
    image: string;
    location: string;
    locationText: string;
    title: string;
    content: string[];
    quote: string;
  };
  chapter2: {
    title: string;
    content: string[];
    items: string[];
    images: {
      image1: string;
      image2: string;
    };
  };
  quote: {
    text: string;
    author: string;
  };
  video: {
    youtubeId: string;
    title: string;
    description: string;
    enabled: boolean;
  };
  chapter3: {
    mainImage: string;
    smallImage: string;
    smallImageLabel: string;
    title: string;
    content: string[];
    cards: Array<{
      title: string;
      content: string;
    }>;
    buttonText: string;
  };
}

const defaultStorySettings: StorySettings = {
  hero: {
    backgroundImage: "/images/cauChuyenBackGround.jpg",
    title: "Hành Trình Trở Về",
    subtitle: "Đánh Thức",
    description: "Từ nỗi tự ti của một người con xa xứ, đến khát vọng mang niềm tự hào Vĩnh Lập vươn ra thế giới.",
  },
  chapter1: {
    image: "/images/songNuocBonBe.png",
    location: "Vĩnh Lập, Thanh Hà",
    locationText: '"Bốn bề là sông nước, người dân quanh năm vất vả..."',
    title: "Vùng Đất Đẹp Nhưng Nghèo",
    content: [
      "Tôi sinh ra và lớn lên tại Vĩnh Lập – Thanh Hà – Hải Dương, cái nôi của cây vải thiều. Nhưng ngày ấy, tôi chỉ thấy sự nhọc nhằn. Vùng đất này đẹp, nhưng giao thương hạn chế, đời sống người dân thiếu thốn đủ bề.",
    ],
    quote: '"Có một thời, tôi từng tự ti về quê hương mình đến mức không dám nói với bạn bè rằng mình đến từ Vĩnh Lập."',
  },
  chapter2: {
    title: "Góc Nhìn Từ Xứ Người",
    content: [
      "Mười năm du học và làm việc tại Nhật Bản là khoảng thời gian thay đổi cuộc đời tôi. Tại đó, tôi gặp người bạn đời - một cô giáo dạy tiếng Nhật.",
      "Khi cùng nhau trở về Việt Nam, chính ánh mắt của cô ấy đã giúp tôi nhìn lại quê hương mình. Cô chỉ cho tôi thấy vẻ đẹp của tình làng nghĩa xóm, sự bình yên của sông nước, và đặc biệt là vị ngon tuyệt hảo của trái vải mà bấy lâu tôi xem nhẹ.",
    ],
    items: [
      "Vẻ đẹp chân chất của con người Vĩnh Lập",
      "Hương vị vải thiều độc bản không nơi nào có",
      "Niềm tự hào tiềm ẩn trong sự bình dị",
    ],
    images: {
      image1: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2070&auto=format&fit=crop",
      image2: "/images/canhDongVai.jpg",
    },
  },
  quote: {
    text: '"Chúng tôi mang trái vải quê mình mời bạn bè Nhật Bản. Từ ánh mắt ngạc nhiên của họ, tôi nhận ra: Vùng đất tôi từng tự ti, lại là nơi đáng tự hào nhất."',
    author: "Founder LALA-LYCHEEE",
  },
  video: {
    youtubeId: "ioy9iZ8pOdg",
    title: "Câu Chuyện Trên Màn Ảnh",
    description: "Khám phá hành trình đưa vải thiều Vĩnh Lập vươn ra thế giới qua góc nhìn của những người trong cuộc",
    enabled: true,
  },
  chapter3: {
    mainImage: "/images/vaiThieuChinDo.jpg",
    smallImage: "/images/cayVaiToThanhHa.png",
    smallImageLabel: "Cây Vải Tổ Thanh Hà",
    title: "Mang Vải Thiều Vươn Ra Thế Giới",
    content: [
      "Sứ mệnh của LALA-LYCHEEE không chỉ là bán trái cây. Đó là hành trình khẳng định thương hiệu nông sản Việt. Để thế hệ trẻ Vĩnh Lập có thể dõng dạc nói: \"Tôi sinh ra ở Vĩnh Lập.\"",
    ],
    cards: [
      {
        title: "Chất Lượng",
        content: "Quy trình canh tác chuẩn Nhật Bản, giữ trọn hương vị tự nhiên.",
      },
      {
        title: "Cộng Đồng",
        content: "Tạo sinh kế bền vững, để người nông dân không phải ly hương.",
      },
    ],
    buttonText: "Trải Nghiệm Ngay",
  },
};

const fetchStorySettings = async (): Promise<StorySettings> => {
  const response = await fetch("/api/settings/story", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return defaultStorySettings;
    }
    throw new Error("Không thể tải cấu hình story");
  }

  const result = await response.json();
  const data = result?.data || result;

  if (!data) {
    return defaultStorySettings;
  }

  return {
    ...defaultStorySettings,
    ...data,
    hero: { ...defaultStorySettings.hero, ...data.hero },
    chapter1: { ...defaultStorySettings.chapter1, ...data.chapter1 },
    chapter2: { ...defaultStorySettings.chapter2, ...data.chapter2 },
    quote: { ...defaultStorySettings.quote, ...data.quote },
    video: { ...defaultStorySettings.video, ...data.video },
    chapter3: { ...defaultStorySettings.chapter3, ...data.chapter3 },
  };
};

const saveStorySettings = async (settings: StorySettings): Promise<any> => {
  const response = await fetch("/api/settings/story", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Không thể lưu cấu hình");
  }

  return response.json();
};

const publishStorySettings = async (): Promise<any> => {
  const response = await fetch("/api/settings/story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Không thể xuất bản");
  }

  return response.json();
};

type SectionId = "hero" | "chapter1" | "chapter2" | "quote" | "video" | "chapter3";

interface Section {
  id: SectionId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const sections: Section[] = [
  {
    id: "hero",
    title: "Hero Section",
    description: "Phần đầu trang với background và tiêu đề chính",
    icon: Layout,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "chapter1",
    title: "Chương 1",
    description: "Vùng Đất Đẹp Nhưng Nghèo",
    icon: BookOpen,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "chapter2",
    title: "Chương 2",
    description: "Góc Nhìn Từ Xứ Người",
    icon: Globe,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "quote",
    title: "Quote",
    description: "Trích dẫn nổi bật",
    icon: Quote,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "video",
    title: "Video",
    description: "Video YouTube",
    icon: Video,
    color: "from-red-500 to-rose-500",
  },
  {
    id: "chapter3",
    title: "Chương 3",
    description: "Mang Vải Thiều Vươn Ra Thế Giới",
    icon: Sparkles,
    color: "from-indigo-500 to-violet-500",
  },
];

export default function StoryAdminPage() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";

  const { data, isLoading } = useQuery({
    queryKey: ["story-settings"],
    queryFn: fetchStorySettings,
  });

  const [formState, setFormState] = useState<StorySettings>(defaultStorySettings);
  const [activeSection, setActiveSection] = useState<SectionId>("hero");
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  useEffect(() => {
    if (data) {
      setFormState(data);
      setHasChanges(false);
    }
  }, [data]);

  // Auto-save functionality
  useEffect(() => {
    if (!hasChanges || !autoSaveEnabled) return;

    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [formState, hasChanges, autoSaveEnabled]);

  const saveMutation = useMutation({
    mutationFn: saveStorySettings,
    onSuccess: () => {
      toast.success("Đã lưu cấu hình story thành công", {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      });
      setHasChanges(false);
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["story-settings"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể lưu cấu hình", {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishStorySettings,
    onSuccess: () => {
      toast.success("Đã xuất bản story thành công!", {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      });
      queryClient.invalidateQueries({ queryKey: ["story-settings"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể xuất bản", {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      });
    },
  });

  const handleAutoSave = useCallback(() => {
    if (hasChanges && !saveMutation.isPending) {
      saveMutation.mutate(formState);
    }
  }, [formState, hasChanges, saveMutation]);

  const updateField = (path: string[], value: any) => {
    setFormState((prev) => {
      const newState = { ...prev };
      let current: any = newState;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newState;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(formState);
  };

  const handlePublish = () => {
    if (confirm("Bạn có chắc muốn xuất bản story này không? Story sẽ được hiển thị công khai trên website.")) {
      publishMutation.mutate();
    }
  };

  const activeSectionData = sections.find((s) => s.id === activeSection);
  const Icon = activeSectionData?.icon || FileText;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Đang tải cấu hình story...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản Lý Trang Story</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Chỉnh sửa và quản lý nội dung trang câu chuyện của bạn
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border">
                {hasChanges ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-xs text-gray-600">Đang chỉnh sửa</span>
                  </>
                ) : saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    <span className="text-xs text-gray-600">Đang lưu...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-gray-600">
                      Đã lưu {lastSaved.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-gray-600">Đã lưu</span>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => window.open(`/${locale}/story`, "_blank")}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Xem trước
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending || !hasChanges}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu nháp
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {publishMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Xuất bản
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Các Phần</CardTitle>
                <CardDescription>Chọn phần để chỉnh sửa</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                  <div className="space-y-1 p-2">
                    {sections.map((section) => {
                      const SectionIcon = section.icon;
                      const isActive = activeSection === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group ${
                            isActive
                              ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-sm"
                              : "hover:bg-gray-50 border-2 border-transparent"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              isActive
                                ? `bg-gradient-to-br ${section.color} text-white`
                                : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                            } transition-all`}
                          >
                            <SectionIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-medium text-sm ${
                                isActive ? "text-blue-900" : "text-gray-900"
                              }`}
                            >
                              {section.title}
                            </div>
                            <div
                              className={`text-xs mt-0.5 truncate ${
                                isActive ? "text-blue-700" : "text-gray-500"
                              }`}
                            >
                              {section.description}
                            </div>
                          </div>
                          {isActive && <ChevronRight className="w-4 h-4 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            <div className="space-y-6">
              {/* Section Header */}
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${activeSectionData?.color} text-white shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{activeSectionData?.title}</CardTitle>
                      <CardDescription className="text-base mt-1">
                        {activeSectionData?.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Hero Section */}
              {activeSection === "hero" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Background Image</CardTitle>
                      <CardDescription>Hình ảnh nền cho hero section</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ImageUpload
                        value={formState.hero.backgroundImage}
                        onChange={(url) => updateField(["hero", "backgroundImage"], url)}
                        label="Background Image"
                        endpoint="/api/story/images"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Nội dung Hero</CardTitle>
                      <CardDescription>Tiêu đề và mô tả chính</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={formState.hero.title}
                          onChange={(e) => updateField(["hero", "title"], e.target.value)}
                          placeholder="Nhập tiêu đề chính"
                          className="text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subtitle</Label>
                        <Input
                          value={formState.hero.subtitle}
                          onChange={(e) => updateField(["hero", "subtitle"], e.target.value)}
                          placeholder="Nhập phụ đề"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={formState.hero.description}
                          onChange={(e) => updateField(["hero", "description"], e.target.value)}
                          rows={4}
                          placeholder="Nhập mô tả"
                          className="resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative h-64 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                        {formState.hero.backgroundImage ? (
                          <>
                            <img
                              src={formState.hero.backgroundImage}
                              alt="Hero preview"
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                console.error("Hero preview image error:", formState.hero.backgroundImage);
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end z-10">
                              <div className="p-6 text-white w-full">
                                <p className="text-sm opacity-90 mb-1">{formState.hero.subtitle || "Subtitle"}</p>
                                <h2 className="text-3xl font-bold mb-2">{formState.hero.title || "Title"}</h2>
                                <p className="text-sm opacity-80">{formState.hero.description || "Description"}</p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-sm">Chưa có hình ảnh nền</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Chapter 1 */}
              {activeSection === "chapter1" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Hình ảnh</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ImageUpload
                        value={formState.chapter1.image}
                        onChange={(url) => updateField(["chapter1", "image"], url)}
                        label="Chapter 1 Image"
                        endpoint="/api/story/images"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Thông tin địa điểm</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Địa điểm</Label>
                        <Input
                          value={formState.chapter1.location}
                          onChange={(e) => updateField(["chapter1", "location"], e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Text địa điểm</Label>
                        <Textarea
                          value={formState.chapter1.locationText}
                          onChange={(e) => updateField(["chapter1", "locationText"], e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Nội dung chương</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tiêu đề</Label>
                        <Input
                          value={formState.chapter1.title}
                          onChange={(e) => updateField(["chapter1", "title"], e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nội dung (mỗi dòng là một đoạn)</Label>
                        <Textarea
                          value={formState.chapter1.content.join("\n")}
                          onChange={(e) =>
                            updateField(
                              ["chapter1", "content"],
                              e.target.value.split("\n").filter(Boolean)
                            )
                          }
                          rows={6}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          {formState.chapter1.content.length} đoạn văn
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Quote</Label>
                        <Textarea
                          value={formState.chapter1.quote}
                          onChange={(e) => updateField(["chapter1", "quote"], e.target.value)}
                          rows={3}
                          className="italic"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Chapter 2 */}
              {activeSection === "chapter2" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Nội dung chương</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tiêu đề</Label>
                        <Input
                          value={formState.chapter2.title}
                          onChange={(e) => updateField(["chapter2", "title"], e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nội dung (mỗi dòng là một đoạn)</Label>
                        <Textarea
                          value={formState.chapter2.content.join("\n")}
                          onChange={(e) =>
                            updateField(
                              ["chapter2", "content"],
                              e.target.value.split("\n").filter(Boolean)
                            )
                          }
                          rows={6}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          {formState.chapter2.content.length} đoạn văn
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Items (mỗi dòng là một item)</Label>
                        <Textarea
                          value={formState.chapter2.items.join("\n")}
                          onChange={(e) =>
                            updateField(
                              ["chapter2", "items"],
                              e.target.value.split("\n").filter(Boolean)
                            )
                          }
                          rows={4}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          {formState.chapter2.items.length} items
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Hình ảnh 1</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ImageUpload
                          value={formState.chapter2.images.image1}
                          onChange={(url) => updateField(["chapter2", "images", "image1"], url)}
                          label="Image 1"
                          endpoint="/api/story/images"
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Hình ảnh 2</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ImageUpload
                          value={formState.chapter2.images.image2}
                          onChange={(url) => updateField(["chapter2", "images", "image2"], url)}
                          label="Image 2"
                          endpoint="/api/story/images"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Quote */}
              {activeSection === "quote" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Quote Section</CardTitle>
                    <CardDescription>Trích dẫn nổi bật</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Quote Text</Label>
                      <Textarea
                        value={formState.quote.text}
                        onChange={(e) => updateField(["quote", "text"], e.target.value)}
                        rows={5}
                        className="text-lg italic"
                        placeholder="Nhập nội dung quote..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Author</Label>
                      <Input
                        value={formState.quote.author}
                        onChange={(e) => updateField(["quote", "author"], e.target.value)}
                        placeholder="Tên tác giả"
                      />
                    </div>

                    {/* Preview */}
                    <div className="mt-6 p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 border-orange-200">
                      <div className="text-center space-y-4">
                        <Quote className="w-12 h-12 text-orange-500 mx-auto" />
                        <p className="text-xl italic text-gray-800">"{formState.quote.text}"</p>
                        <p className="text-sm font-medium text-gray-600">— {formState.quote.author}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Video */}
              {activeSection === "video" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cấu hình Video</CardTitle>
                      <CardDescription>Video YouTube</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>YouTube Video ID</Label>
                        <Input
                          value={formState.video.youtubeId}
                          onChange={(e) => updateField(["video", "youtubeId"], e.target.value)}
                          placeholder="ioy9iZ8pOdg"
                        />
                        <p className="text-xs text-gray-500">
                          Lấy ID từ URL YouTube: https://www.youtube.com/watch?v=<strong>VIDEO_ID</strong>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Tiêu đề</Label>
                        <Input
                          value={formState.video.title}
                          onChange={(e) => updateField(["video", "title"], e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Textarea
                          value={formState.video.description}
                          onChange={(e) => updateField(["video", "description"], e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formState.video.enabled}
                          onChange={(e) => updateField(["video", "enabled"], e.target.checked)}
                          className="rounded"
                        />
                        <Label>Hiển thị video</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preview */}
                  {formState.video.youtubeId && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Preview Video</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
                          <iframe
                            src={`https://www.youtube.com/embed/${formState.video.youtubeId}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="mt-4">
                          <h3 className="font-semibold">{formState.video.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{formState.video.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Chapter 3 */}
              {activeSection === "chapter3" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Hình ảnh chính</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ImageUpload
                          value={formState.chapter3.mainImage}
                          onChange={(url) => updateField(["chapter3", "mainImage"], url)}
                          label="Main Image"
                          endpoint="/api/story/images"
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Hình ảnh nhỏ</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ImageUpload
                          value={formState.chapter3.smallImage}
                          onChange={(url) => updateField(["chapter3", "smallImage"], url)}
                          label="Small Image"
                          endpoint="/api/story/images"
                        />
                        <div className="mt-4 space-y-2">
                          <Label>Label hình ảnh nhỏ</Label>
                          <Input
                            value={formState.chapter3.smallImageLabel}
                            onChange={(e) => updateField(["chapter3", "smallImageLabel"], e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Nội dung chương</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tiêu đề</Label>
                        <Input
                          value={formState.chapter3.title}
                          onChange={(e) => updateField(["chapter3", "title"], e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nội dung (mỗi dòng là một đoạn)</Label>
                        <Textarea
                          value={formState.chapter3.content.join("\n")}
                          onChange={(e) =>
                            updateField(
                              ["chapter3", "content"],
                              e.target.value.split("\n").filter(Boolean)
                            )
                          }
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cards</CardTitle>
                      <CardDescription>Thẻ thông tin</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formState.chapter3.cards.map((card, index) => (
                        <Card key={index} className="border-2">
                          <CardHeader>
                            <CardTitle className="text-lg">Card {index + 1}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label>Tiêu đề</Label>
                              <Input
                                value={card.title}
                                onChange={(e) =>
                                  updateField(["chapter3", "cards", index.toString(), "title"], e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Nội dung</Label>
                              <Textarea
                                value={card.content}
                                onChange={(e) =>
                                  updateField(
                                    ["chapter3", "cards", index.toString(), "content"],
                                    e.target.value
                                  )
                                }
                                rows={3}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <div className="space-y-2">
                        <Label>Text nút</Label>
                        <Input
                          value={formState.chapter3.buttonText}
                          onChange={(e) => updateField(["chapter3", "buttonText"], e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
