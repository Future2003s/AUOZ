"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Globe, Image as ImageIcon, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import Link from "next/link";
import GalleryManager from "@/components/admin/GalleryManager";

// —— Zod schema ——
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const seoSchema = z.object({
  metaTitle: z.string().max(70, "Tối đa 70 ký tự").optional().or(z.literal("")),
  metaDescription: z.string().max(160, "Tối đa 160 ký tự").optional().or(z.literal("")),
  ogImage: z.string().optional().or(z.literal("")),
});

const postSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự").max(200, "Tối đa 200 ký tự"),
  slug: z
    .string()
    .min(2, "Slug quá ngắn")
    .max(120, "Slug quá dài")
    .regex(slugPattern, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang"),
  excerpt: z.string().max(300, "Tóm tắt tối đa 300 ký tự").optional().or(z.literal("")),
  body: z.string().optional().or(z.literal("")),
  status: z.enum(["published", "draft", "archived"]),
  category: z.string().optional().or(z.literal("")),
  seo: seoSchema,
});

type PostForm = z.infer<typeof postSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

interface CmsPostFormProps {
  isEdit?: boolean;
  postId?: string;
}

export default function CmsPostForm({ isEdit = false, postId }: CmsPostFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);
  const [ogImages, setOgImages] = useState<Array<{ id: string; url: string; isMain: boolean }>>([]);

  const {
    register, handleSubmit, setValue, watch, formState: { errors }, reset,
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "", slug: "", excerpt: "", body: "",
      status: "draft", category: "",
      seo: { metaTitle: "", metaDescription: "", ogImage: "" },
    },
  });

  const titleValue = watch("title");
  const slugValue = watch("slug");
  const excerptValue = watch("excerpt") ?? "";
  const seoMetaTitle = watch("seo.metaTitle") ?? "";
  const seoMetaDesc = watch("seo.metaDescription") ?? "";
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && titleValue) {
      setValue("slug", slugify(titleValue), { shouldValidate: true });
    }
  }, [titleValue, slugManuallyEdited, setValue]);

  // Load existing post if editing
  useEffect(() => {
    if (!isEdit || !postId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/cms/posts/${postId}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const post = data?.data || data;
        if (!post) return;
        reset({
          title: post.title ?? "",
          slug: post.slug ?? "",
          excerpt: post.excerpt ?? "",
          body: post.body ?? "",
          status: post.status ?? "draft",
          category: post.category ?? "",
          seo: {
            metaTitle: post.seo?.metaTitle ?? "",
            metaDescription: post.seo?.metaDescription ?? "",
            ogImage: post.seo?.ogImage ?? "",
          },
        });
        setSlugManuallyEdited(true);
        if (post.seo?.ogImage) {
          setOgImages([{ id: "og-1", url: post.seo.ogImage, isMain: true }]);
        }
      } catch { /* ignore */ }
    };
    load();
  }, [isEdit, postId, reset]);

  const onSubmit = useCallback(async (data: PostForm) => {
    setSubmitting(true);
    setSubmitError(null);
    const mainOgImg = ogImages.find(img => img.isMain)?.url || ogImages[0]?.url || "";
    const payload = { ...data, seo: { ...data.seo, ogImage: mainOgImg } };
    try {
      const url = isEdit ? `/api/cms/posts/${postId}` : "/api/cms/posts";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Lỗi lưu bài viết");
      router.push(`/${locale}/admin/cms/posts`);
    } catch (err: any) {
      setSubmitError(err?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, postId, ogImages, locale, router]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-6 mt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/admin/cms/posts`}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isEdit ? `ID: ${postId}` : "Điền thông tin bài viết bên dưới"}
          </p>
        </div>
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          ⚠️ {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Title */}
        <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Nội dung</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title")}
              placeholder="Nhập tiêu đề bài viết..."
              className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${errors.title ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              Slug (URL) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 font-mono">/blog/</span>
              <input
                {...register("slug")}
                placeholder="ten-bai-viet"
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""), { shouldValidate: true });
                }}
                className={`flex-1 px-4 py-2.5 border rounded-xl text-sm font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${errors.slug ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
              />
            </div>
            {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              Tóm tắt <span className="text-gray-400 font-normal">({excerptValue.length}/300)</span>
            </label>
            <textarea
              {...register("excerpt")}
              rows={3}
              placeholder="Mô tả ngắn về bài viết..."
              className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors resize-none ${errors.excerpt ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
            />
            {errors.excerpt && <p className="text-xs text-red-500 mt-1">{errors.excerpt.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              Nội dung bài viết
              <span className="ml-2 text-xs text-gray-400 font-normal">(Rich Text Editor sẽ được tích hợp sau)</span>
            </label>
            <textarea
              {...register("body")}
              rows={10}
              placeholder="Nhập nội dung bài viết (Markdown hoặc HTML)..."
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors resize-y font-mono"
            />
          </div>
        </div>

        {/* Meta */}
        <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Phân loại & Trạng thái</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Danh mục</label>
              <input {...register("category")} placeholder="ví dụ: Sức khỏe, Công thức..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Trạng thái <span className="text-red-500">*</span></label>
              <select {...register("status")} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors">
                <option value="draft">Bản nháp</option>
                <option value="published">Đã đăng</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>
          </div>
        </div>

        {/* SEO Section */}
        <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setSeoOpen(!seoOpen)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              Cài đặt SEO
            </span>
            {seoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {seoOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  Meta Title <span className="text-gray-400 font-normal">({seoMetaTitle.length}/70)</span>
                </label>
                <input
                  {...register("seo.metaTitle")}
                  placeholder="Tiêu đề SEO (mặc định dùng tiêu đề bài viết)"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${errors.seo?.metaTitle ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.seo?.metaTitle && <p className="text-xs text-red-500 mt-1">{errors.seo.metaTitle.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  Meta Description <span className="text-gray-400 font-normal">({seoMetaDesc.length}/160)</span>
                </label>
                <textarea
                  {...register("seo.metaDescription")}
                  rows={3}
                  placeholder="Mô tả ngắn cho Google Search (khuyến khích 120–160 ký tự)"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors resize-none ${errors.seo?.metaDescription ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.seo?.metaDescription && <p className="text-xs text-red-500 mt-1">{errors.seo.metaDescription.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  <ImageIcon className="h-4 w-4 inline mr-1.5 text-gray-400" />
                  OpenGraph Image (og:image)
                </label>
                <GalleryManager
                  images={ogImages}
                  onChange={(images) => setOgImages(images)}
                />
                <p className="text-xs text-gray-400 mt-1.5">Kích thước khuyến nghị: 1200×630px</p>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/${locale}/admin/cms/posts`}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-full text-sm font-semibold transition-colors shadow-sm"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo bài viết"}
          </button>
        </div>
      </form>
    </div>
  );
}
