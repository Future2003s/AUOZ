"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { newsApi } from "@/apiRequests/news";
import { NewsStatus } from "@/types/news";
import { TiptapEditor } from "@/components/admin/news/TiptapEditor";
import { CoverImageUpload } from "@/components/admin/news/CoverImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  X,
  ChevronLeft,
  Globe,
  CheckCircle,
  PanelRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const newsSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự"),
  slug: z
    .string()
    .min(1, "Slug không được để trống")
    .regex(/^[a-z0-9-]+$/, "Slug chỉ dùng chữ thường, số, gạch ngang"),
  excerpt: z.string().max(160, "Tối đa 160 ký tự").optional().or(z.literal("")),
  content: z.string().min(1, "Nội dung không được để trống"),
  status: z.enum(["draft", "published"] as const),
  isFeatured: z.boolean(),
  category: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()),
  coverImage: z.string().optional().or(z.literal("")),
  publishedAt: z.string().optional().or(z.literal("")),
});

type NewsFormValues = z.infer<typeof newsSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const DEFAULT_CATEGORIES = [
  "Công nghệ",
  "Thời trang",
  "Sức khỏe",
  "Khuyến mãi",
  "Tin tức",
  "Hướng dẫn",
];

// ─── Settings Panel ───────────────────────────────────────────────────────────
const SettingsPanel = ({
  isOpen,
  onClose,
  control,
  watch,
  setValue,
  errors,
}: {
  isOpen: boolean;
  onClose: () => void;
  control: any;
  watch: any;
  setValue: any;
  errors: any;
}) => {
  const [newTag, setNewTag] = useState("");
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const tags = watch("tags") as string[];
  const title = watch("title") as string;
  const excerpt = watch("excerpt") as string;
  const slug = watch("slug") as string;
  const status = watch("status") as string;

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setValue("tags", [...tags, trimmed]);
    }
  };
  const removeTag = (tag: string) => setValue("tags", tags.filter((t) => t !== tag));

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-gray-200 bg-white h-[calc(100vh-64px)] overflow-y-auto fixed right-0 top-16 z-10 shadow-lg">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Cài đặt bài viết
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-8">
        {/* Status */}
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Xuất bản</h4>
          <div
            className={`rounded-lg p-3 space-y-3 border ${
              status === "published"
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trạng thái</span>
              <div className="flex items-center gap-2">
                {status === "published" && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                    <CheckCircle size={10} /> Đã đăng
                  </span>
                )}
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Bản nháp</SelectItem>
                        <SelectItem value="published">Đã xuất bản</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Hiển thị</span>
              <span
                className={`text-sm font-medium flex items-center gap-1 ${
                  status === "published" ? "text-green-600" : "text-gray-500"
                }`}
              >
                <Globe size={12} />
                {status === "published" ? "Công khai" : "Riêng tư"}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <Label className="text-xs text-gray-600">Ngày xuất bản</Label>
              <Controller
                name="publishedAt"
                control={control}
                render={({ field }) => (
                  <Input type="datetime-local" {...field} className="text-sm mt-1" />
                )}
              />
            </div>
            <div className="pt-2 border-t border-gray-200">
              <Controller
                name="isFeatured"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="rounded"
                    />
                    <span>Tin nổi bật</span>
                  </label>
                )}
              />
            </div>
          </div>
        </section>

        {/* SEO preview */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase">SEO & Tìm kiếm</h4>
            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {title.length > 0 && excerpt && excerpt.length > 0 && slug.length > 0
                ? "92/100"
                : "0/100"}
            </span>
          </div>
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[8px]">G</div>
              website.com › tin-tuc
            </div>
            <div className="text-blue-600 text-base leading-tight font-medium hover:underline mb-1 truncate">
              {title || "Tiêu đề bài viết"}
            </div>
            <div className="text-sm text-gray-600 line-clamp-2 leading-snug">
              {excerpt || "Đây là đoạn mô tả (Meta Description) sẽ hiện trên Google."}
            </div>
          </div>

          <div className="mt-3">
            <Label className="text-xs text-gray-500 font-medium block mb-1">Đường dẫn tĩnh (Slug)</Label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-2 overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
              <span className="text-gray-400 text-xs whitespace-nowrap">/tin-tuc/</span>
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    className="w-full bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-1.5 h-auto"
                    placeholder="slug-bai-viet"
                  />
                )}
              />
            </div>
            {errors.slug && (
              <p className="text-xs text-red-500 mt-1">{errors.slug.message as string}</p>
            )}
          </div>
        </section>

        {/* Excerpt */}
        <section>
          <Label className="text-xs font-bold text-gray-500 uppercase block mb-3">Mô tả ngắn (Excerpt)</Label>
          <Controller
            name="excerpt"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Viết mô tả ngắn gọn về bài viết..."
                rows={3}
                className="text-sm"
              />
            )}
          />
          <p className="text-xs text-gray-500 mt-1">{(watch("excerpt") || "").length}/160 ký tự</p>
          {errors.excerpt && (
            <p className="text-xs text-red-500 mt-1">{errors.excerpt.message as string}</p>
          )}
        </section>

        {/* Cover image */}
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Ảnh đại diện</h4>
          <Controller
            name="coverImage"
            control={control}
            render={({ field }) => (
              <CoverImageUpload value={field.value || ""} onChange={field.onChange} />
            )}
          />
        </section>

        {/* Category & Tags */}
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Phân loại</h4>
          <div className="space-y-3">
            {/* Category */}
            <div>
              <Label className="text-xs text-gray-600 block mb-1">Danh mục</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Select
                      value={field.value || "none"}
                      onValueChange={(val) => {
                        if (val === "custom") {
                          setShowCustomCategory(true);
                          setCustomCategory("");
                        } else if (val === "none") {
                          field.onChange("");
                          setShowCustomCategory(false);
                        } else {
                          field.onChange(val);
                          setShowCustomCategory(false);
                        }
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có danh mục</SelectItem>
                        {availableCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                        <SelectItem value="custom">+ Nhập danh mục mới</SelectItem>
                      </SelectContent>
                    </Select>
                    {showCustomCategory && (
                      <Input
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        onBlur={() => {
                          if (customCategory.trim()) {
                            field.onChange(customCategory.trim());
                            if (!availableCategories.includes(customCategory.trim())) {
                              setAvailableCategories((prev) => [...prev, customCategory.trim()].sort());
                            }
                          }
                          setShowCustomCategory(false);
                          setCustomCategory("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (customCategory.trim()) {
                              field.onChange(customCategory.trim());
                              if (!availableCategories.includes(customCategory.trim())) {
                                setAvailableCategories((prev) => [...prev, customCategory.trim()].sort());
                              }
                            }
                            setShowCustomCategory(false);
                            setCustomCategory("");
                          }
                        }}
                        placeholder="Nhập danh mục mới..."
                        className="text-sm"
                        autoFocus
                      />
                    )}
                  </div>
                )}
              />
            </div>
            {/* Tags */}
            <div>
              <Label className="text-xs text-gray-600 block mb-2">Thẻ (Tags)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 border border-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                  >
                    {tag}
                    <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => removeTag(tag)} />
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(newTag);
                      setNewTag("");
                    }
                  }}
                  placeholder="Thêm thẻ..."
                  className="text-sm flex-1"
                />
                <Button type="button" size="sm" onClick={() => { addTag(newTag); setNewTag(""); }}>
                  Thêm
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewsEditorPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const queryClient = useQueryClient();

  const locale = pathname?.split("/")[1] || "vi";
  const rawId = params?.id as string;
  const isNew = !rawId || rawId === "new";

  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  // ─── Form ──────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      status: "draft",
      isFeatured: false,
      category: "",
      tags: [],
      coverImage: "",
      publishedAt: "",
    },
  });

  // Auto-generate slug from title when creating new article
  const title = watch("title");
  const [slugAutoGenerated, setSlugAutoGenerated] = useState(isNew);
  useEffect(() => {
    if (slugAutoGenerated && isNew) {
      setValue("slug", slugify(title));
    }
  }, [title, slugAutoGenerated, isNew, setValue]);

  // ─── Load existing article (edit mode) ───────────────────
  const [articleLoaded, setArticleLoaded] = useState(false);
  const articleQuery = useQuery({
    queryKey: ["news-article-data", rawId],
    queryFn: () => newsApi.getById(rawId),
    enabled: !isNew && !articleLoaded,
    staleTime: 60_000,
  });
  useEffect(() => {
    if (articleQuery.data?.data && !articleLoaded) {
      const a = articleQuery.data.data;
      reset({
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt || "",
        content: a.content || "",
        status: a.status,
        isFeatured: a.isFeatured,
        category: a.category || "",
        tags: a.tags || [],
        coverImage: a.coverImage || "",
        publishedAt: a.publishedAt
          ? new Date(a.publishedAt).toISOString().slice(0, 16)
          : "",
      });
      setArticleLoaded(true);
      setSlugAutoGenerated(false);
    }
  }, [articleQuery.data, articleLoaded, reset]);

  // ─── Mutations ────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: Partial<typeof newsSchema._type>) =>
      newsApi.create({ ...payload, locale } as any),
    onSuccess: () => {
      toast.success("Tạo bài viết thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      router.push(`/${locale}/admin/news`);
    },
    onError: (err: any) => toast.error(err.message || "Không thể tạo bài viết"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<typeof newsSchema._type>) =>
      newsApi.update(rawId, payload as any),
    onSuccess: () => {
      toast.success("Cập nhật bài viết thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["news-article", rawId] });
      queryClient.invalidateQueries({ queryKey: ["news-article-data", rawId] });
    },
    onError: (err: any) => toast.error(err.message || "Không thể cập nhật bài viết"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ─── Submit ───────────────────────────────────────────────
  const onSubmit = handleSubmit((values) => {
    const payload = {
      ...values,
      locale,
      publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : undefined,
    };
    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  });

  // Publish directly
  const handlePublish = () => {
    setValue("status", "published");
    setTimeout(() => handleSubmit((values) => {
      const payload = { ...values, status: "published" as NewsStatus, locale };
      if (isNew) createMutation.mutate(payload);
      else updateMutation.mutate(payload);
    })(), 0);
  };

  // Loading state for edit mode
  if (!isNew && !articleLoaded && articleQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-gray-500">
        <Loader2 size={22} className="animate-spin" />
        <span>Đang tải bài viết...</span>
      </div>
    );
  }

  const status = watch("status");

  return (
    <div className={`min-h-screen bg-gray-50 transition-all ${settingsPanelOpen ? "pr-80" : ""}`}>
      {/* Top Navbar / Toolbar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push(`/${locale}/admin/news`)}
          >
            <ChevronLeft size={18} />
          </Button>
          <div className="min-w-0">
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  placeholder="Nhập tiêu đề bài viết..."
                  className="text-lg font-semibold w-full bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400 truncate"
                  onFocus={() => setSlugAutoGenerated(isNew)}
                  onBlur={() => setSlugAutoGenerated(false)}
                />
              )}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message as string}</p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <Badge variant={status === "published" ? "default" : "secondary"} className="hidden sm:flex">
            {status === "published" ? "Đã xuất bản" : "Bản nháp"}
          </Badge>

          {/* Save draft */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSubmit}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isNew ? "Lưu bản nháp" : "Cập nhật"}
          </Button>

          {/* Publish */}
          {status !== "published" && (
            <Button
              type="button"
              size="sm"
              onClick={handlePublish}
              disabled={isPending}
              className="gap-1.5 bg-green-600 hover:bg-green-700"
            >
              <Globe size={14} />
              Xuất bản
            </Button>
          )}

          {/* Settings toggle */}
          <Button
            type="button"
            variant={settingsPanelOpen ? "secondary" : "outline"}
            size="icon"
            className="shrink-0"
            onClick={() => setSettingsPanelOpen((v) => !v)}
            title="Cài đặt bài viết"
          >
            <PanelRight size={16} />
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Content error */}
        {errors.content && (
          <div className="mb-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-4 py-2">
            {errors.content.message as string}
          </div>
        )}

        {/* Tiptap Editor */}
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <TiptapEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Bắt đầu viết nội dung bài viết... Nhập '/' để chọn định dạng"
              minHeight="560px"
            />
          )}
        />

        {/* AI hint */}
        <p className="mt-3 text-xs text-gray-400 text-center flex items-center justify-center gap-1">
          <Sparkles size={11} />
          Tính năng AI Rewriter sẽ sớm ra mắt
        </p>
      </div>

      {/* Settings sidebar */}
      <SettingsPanel
        isOpen={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
        control={control}
        watch={watch}
        setValue={setValue}
        errors={errors}
      />
    </div>
  );
}
