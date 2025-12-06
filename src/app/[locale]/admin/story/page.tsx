"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, Loader2, Upload } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

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

  // Merge with defaults to ensure all fields exist
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

export default function StoryAdminPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["story-settings"],
    queryFn: fetchStorySettings,
  });

  const [formState, setFormState] = useState<StorySettings>(defaultStorySettings);

  useEffect(() => {
    if (data) {
      setFormState(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: saveStorySettings,
    onSuccess: () => {
      toast.success("Đã lưu cấu hình story thành công");
      queryClient.invalidateQueries({ queryKey: ["story-settings"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể lưu cấu hình");
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishStorySettings,
    onSuccess: () => {
      toast.success("Đã xuất bản story thành công");
      queryClient.invalidateQueries({ queryKey: ["story-settings"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể xuất bản");
    },
  });

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
  };

  const handleSave = () => {
    saveMutation.mutate(formState);
  };

  const handlePublish = () => {
    if (confirm("Bạn có chắc muốn xuất bản story này không?")) {
      publishMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Trang Story</h1>
          <p className="text-muted-foreground mt-2">
            Chỉnh sửa nội dung và hình ảnh của trang story
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("/vi/story", "_blank")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Xem trước
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Lưu nháp
          </Button>
          <Button onClick={handlePublish} disabled={publishMutation.isPending}>
            {publishMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Xuất bản
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="chapter1">Chương 1</TabsTrigger>
          <TabsTrigger value="chapter2">Chương 2</TabsTrigger>
          <TabsTrigger value="quote">Quote</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="chapter3">Chương 3</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Background Image</Label>
                <ImageUpload
                  value={formState.hero.backgroundImage}
                  onChange={(url) => updateField(["hero", "backgroundImage"], url)}
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={formState.hero.title}
                  onChange={(e) => updateField(["hero", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={formState.hero.subtitle}
                  onChange={(e) => updateField(["hero", "subtitle"], e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formState.hero.description}
                  onChange={(e) => updateField(["hero", "description"], e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chapter 1 */}
        <TabsContent value="chapter1">
          <Card>
            <CardHeader>
              <CardTitle>Chương 1: Vùng Đất Đẹp Nhưng Nghèo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hình ảnh</Label>
                <ImageUpload
                  value={formState.chapter1.image}
                  onChange={(url) => updateField(["chapter1", "image"], url)}
                />
              </div>
              <div>
                <Label>Địa điểm</Label>
                <Input
                  value={formState.chapter1.location}
                  onChange={(e) => updateField(["chapter1", "location"], e.target.value)}
                />
              </div>
              <div>
                <Label>Text địa điểm</Label>
                <Textarea
                  value={formState.chapter1.locationText}
                  onChange={(e) => updateField(["chapter1", "locationText"], e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Tiêu đề</Label>
                <Input
                  value={formState.chapter1.title}
                  onChange={(e) => updateField(["chapter1", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Nội dung (mỗi dòng là một đoạn)</Label>
                <Textarea
                  value={formState.chapter1.content.join("\n")}
                  onChange={(e) =>
                    updateField(
                      ["chapter1", "content"],
                      e.target.value.split("\n").filter(Boolean)
                    )
                  }
                  rows={5}
                />
              </div>
              <div>
                <Label>Quote</Label>
                <Textarea
                  value={formState.chapter1.quote}
                  onChange={(e) => updateField(["chapter1", "quote"], e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chapter 2 */}
        <TabsContent value="chapter2">
          <Card>
            <CardHeader>
              <CardTitle>Chương 2: Góc Nhìn Từ Xứ Người</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tiêu đề</Label>
                <Input
                  value={formState.chapter2.title}
                  onChange={(e) => updateField(["chapter2", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Nội dung (mỗi dòng là một đoạn)</Label>
                <Textarea
                  value={formState.chapter2.content.join("\n")}
                  onChange={(e) =>
                    updateField(
                      ["chapter2", "content"],
                      e.target.value.split("\n").filter(Boolean)
                    )
                  }
                  rows={5}
                />
              </div>
              <div>
                <Label>Items (mỗi dòng là một item)</Label>
                <Textarea
                  value={formState.chapter2.items.join("\n")}
                  onChange={(e) =>
                    updateField(
                      ["chapter2", "items"],
                      e.target.value.split("\n").filter(Boolean)
                    )
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label>Hình ảnh 1</Label>
                <ImageUpload
                  value={formState.chapter2.images.image1}
                  onChange={(url) => updateField(["chapter2", "images", "image1"], url)}
                />
              </div>
              <div>
                <Label>Hình ảnh 2</Label>
                <ImageUpload
                  value={formState.chapter2.images.image2}
                  onChange={(url) => updateField(["chapter2", "images", "image2"], url)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quote */}
        <TabsContent value="quote">
          <Card>
            <CardHeader>
              <CardTitle>Quote Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Quote Text</Label>
                <Textarea
                  value={formState.quote.text}
                  onChange={(e) => updateField(["quote", "text"], e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label>Author</Label>
                <Input
                  value={formState.quote.author}
                  onChange={(e) => updateField(["quote", "author"], e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video */}
        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle>Video Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>YouTube Video ID</Label>
                <Input
                  value={formState.video.youtubeId}
                  onChange={(e) => updateField(["video", "youtubeId"], e.target.value)}
                  placeholder="ioy9iZ8pOdg"
                />
              </div>
              <div>
                <Label>Tiêu đề</Label>
                <Input
                  value={formState.video.title}
                  onChange={(e) => updateField(["video", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea
                  value={formState.video.description}
                  onChange={(e) => updateField(["video", "description"], e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chapter 3 */}
        <TabsContent value="chapter3">
          <Card>
            <CardHeader>
              <CardTitle>Chương 3: Mang Vải Thiều Vươn Ra Thế Giới</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hình ảnh chính</Label>
                <ImageUpload
                  value={formState.chapter3.mainImage}
                  onChange={(url) => updateField(["chapter3", "mainImage"], url)}
                />
              </div>
              <div>
                <Label>Hình ảnh nhỏ</Label>
                <ImageUpload
                  value={formState.chapter3.smallImage}
                  onChange={(url) => updateField(["chapter3", "smallImage"], url)}
                />
              </div>
              <div>
                <Label>Label hình ảnh nhỏ</Label>
                <Input
                  value={formState.chapter3.smallImageLabel}
                  onChange={(e) => updateField(["chapter3", "smallImageLabel"], e.target.value)}
                />
              </div>
              <div>
                <Label>Tiêu đề</Label>
                <Input
                  value={formState.chapter3.title}
                  onChange={(e) => updateField(["chapter3", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Nội dung (mỗi dòng là một đoạn)</Label>
                <Textarea
                  value={formState.chapter3.content.join("\n")}
                  onChange={(e) =>
                    updateField(
                      ["chapter3", "content"],
                      e.target.value.split("\n").filter(Boolean)
                    )
                  }
                  rows={5}
                />
              </div>
              <div>
                <Label>Card 1 - Tiêu đề</Label>
                <Input
                  value={formState.chapter3.cards[0]?.title || ""}
                  onChange={(e) =>
                    updateField(["chapter3", "cards", "0", "title"], e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Card 1 - Nội dung</Label>
                <Textarea
                  value={formState.chapter3.cards[0]?.content || ""}
                  onChange={(e) =>
                    updateField(["chapter3", "cards", "0", "content"], e.target.value)
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label>Card 2 - Tiêu đề</Label>
                <Input
                  value={formState.chapter3.cards[1]?.title || ""}
                  onChange={(e) =>
                    updateField(["chapter3", "cards", "1", "title"], e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Card 2 - Nội dung</Label>
                <Textarea
                  value={formState.chapter3.cards[1]?.content || ""}
                  onChange={(e) =>
                    updateField(["chapter3", "cards", "1", "content"], e.target.value)
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label>Text nút</Label>
                <Input
                  value={formState.chapter3.buttonText}
                  onChange={(e) => updateField(["chapter3", "buttonText"], e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

