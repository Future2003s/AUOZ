"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { newsApi } from "@/apiRequests/news";
import { NewsArticle, NewsStatus } from "@/types/news";
import { ImageUpload } from "@/components/ImageUpload";
import {
  Save,
  X,
  Image as ImageIcon,
  Calendar,
  Globe,
  ChevronLeft,
  MoreHorizontal,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  UploadCloud,
  CheckCircle,
  PanelRight,
  Sparkles,
  History,
  Type,
  Maximize,
  MoreVertical,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Settings Panel Component
const SettingsPanel = ({
  isOpen,
  onClose,
  status,
  setStatus,
  slug,
  setSlug,
  title,
  excerpt,
  setExcerpt,
  coverImage,
  setCoverImage,
  category,
  setCategory,
  tags,
  setTags,
  locale,
  publishedAt,
  setPublishedAt,
  isFeatured,
  setIsFeatured,
}: {
  isOpen: boolean;
  onClose: () => void;
  status: NewsStatus;
  setStatus: (status: NewsStatus) => void;
  slug: string;
  setSlug: (slug: string) => void;
  title: string;
  excerpt: string;
  setExcerpt: (excerpt: string) => void;
  coverImage: string;
  setCoverImage: (image: string) => void;
  category: string;
  setCategory: (category: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  locale: string;
  publishedAt?: Date;
  setPublishedAt: (date: Date | undefined) => void;
  isFeatured: boolean;
  setIsFeatured: (featured: boolean) => void;
}) => {
  if (!isOpen) return null;

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const [newTag, setNewTag] = useState("");

  return (
    <div className="w-80 border-l border-gray-200 bg-white h-[calc(100vh-64px)] overflow-y-auto fixed right-0 top-16 z-10 shadow-lg transition-transform duration-300">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Cài đặt bài viết
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-8">
        {/* Status Section */}
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">
            Xuất bản
          </h4>
          <div className={`rounded-lg p-3 space-y-3 border ${
            status === "published"
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-100"
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trạng thái</span>
              <div className="flex items-center gap-2">
                {status === "published" && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                    <CheckCircle size={10} />
                    Đã đăng
                  </span>
                )}
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as NewsStatus)}
                >
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bản nháp</SelectItem>
                    <SelectItem value="published">Đã xuất bản</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Hiển thị</span>
              <span
                className={`text-sm font-medium flex items-center gap-1 ${
                  status === "published"
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                <Globe size={12} />{" "}
                {status === "published" ? "Công khai" : "Riêng tư"}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Ngày xuất bản</Label>
                <Input
                  type="datetime-local"
                  value={
                    publishedAt
                      ? new Date(publishedAt)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setPublishedAt(
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                  className="text-sm"
                />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded"
                />
                <span>Tin nổi bật</span>
              </label>
            </div>
          </div>
        </section>

        {/* SEO Section */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase">
              SEO & Tìm kiếm
            </h4>
            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {title.length > 0 && excerpt.length > 0 && slug.length > 0
                ? "92/100"
                : "0/100"}
            </span>
          </div>
          <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group bg-white">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[8px]">
                G
              </div>
              website.com › tin-tuc
            </div>
            <div className="text-blue-600 text-lg leading-tight font-medium hover:underline mb-1 truncate">
              {title || "Tiêu đề bài viết"}
            </div>
            <div className="text-sm text-gray-600 line-clamp-2 leading-snug">
              {excerpt ||
                "Đây là đoạn mô tả (Meta Description) sẽ hiện trên Google. Hãy viết ngắn gọn và chứa từ khóa quan trọng."}
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-xs text-gray-500 font-medium block mb-1">
              Đường dẫn tĩnh (Slug)
            </Label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-2 overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
              <span className="text-gray-400 text-xs whitespace-nowrap">
                /tin-tuc/
              </span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-1.5 h-auto"
                placeholder="slug-bai-viet"
              />
            </div>
          </div>
        </section>

        {/* Excerpt */}
        <section>
          <Label className="text-xs font-bold text-gray-500 uppercase block mb-3">
            Mô tả ngắn (Excerpt)
          </Label>
          <Textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Viết mô tả ngắn gọn về bài viết..."
            rows={3}
            className="text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            {excerpt.length}/160 ký tự
          </p>
        </section>

        {/* Feature Image */}
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">
            Ảnh đại diện
          </h4>
          <ImageUpload
            value={coverImage}
            onChange={setCoverImage}
            endpoint="/api/news/images"
          />
        </section>

        {/* Tags & Categories */}
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">
            Phân loại
          </h4>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600 block mb-1">
                Danh mục
              </Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Nhập danh mục..."
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 block mb-2">Thẻ (Tags)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 border border-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                  >
                    {tag}{" "}
                    <X
                      size={10}
                      className="cursor-pointer hover:text-red-500"
                      onClick={() => removeTag(tag)}
                    />
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
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    addTag(newTag);
                    setNewTag("");
                  }}
                >
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

// Image Upload Dialog Component
const ImageUploadDialog = ({
  open,
  onClose,
  onImageUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onImageUploaded: (url: string) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file phải nhỏ hơn 5MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/news/images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.data?.url) {
        setImageUrl(data.data.url);
        toast.success("Upload ảnh thành công");
      } else {
        toast.error(data.error || "Upload ảnh thất bại");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Không thể upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleInsert = () => {
    if (imageUrl) {
      onImageUploaded(imageUrl);
      setImageUrl("");
      onClose();
    }
  };

  const handleUrlInsert = () => {
    const url = prompt("Nhập URL ảnh:");
    if (url) {
      onImageUploaded(url);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chèn ảnh vào bài viết</DialogTitle>
          <DialogDescription>
            Upload ảnh từ máy tính hoặc nhập URL ảnh
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Upload from file */}
          <div className="space-y-2">
            <Label>Upload ảnh từ máy tính</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang upload...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Chọn ảnh
                  </>
                )}
              </Button>
            </div>
            {imageUrl && (
              <div className="mt-2">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-w-full h-auto max-h-64 rounded-lg border"
                />
              </div>
            )}
          </div>

          {/* Or use URL */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Hoặc</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nhập URL ảnh</Label>
            <Button
              type="button"
              variant="outline"
              onClick={handleUrlInsert}
              className="w-full"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Sử dụng URL
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleInsert}
              disabled={!imageUrl || uploading}
            >
              Chèn ảnh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Editor Toolbar
const EditorToolbar = ({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const formatHeading = (level: string) => {
    if (level === "Normal") {
      execCommand("formatBlock", "p");
    } else {
      execCommand("formatBlock", level.toLowerCase());
    }
  };

  const insertLink = () => {
    const url = prompt("Nhập URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const handleImageUploaded = (url: string) => {
    if (editorRef.current) {
      // Save current selection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Create image element with proper attributes
        const img = document.createElement("img");
        img.src = url;
        img.alt = "Image"; // Add alt text for accessibility
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.className = "rounded-lg my-4";
        img.setAttribute("data-image-url", url); // Store URL as data attribute for reference
        
        range.insertNode(img);
        
        // Move cursor after image and add a paragraph
        range.setStartAfter(img);
        range.collapse(true);
        const p = document.createElement("p");
        range.insertNode(p);
        range.setStart(p, 0);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // If no selection, just insert at cursor
        execCommand("insertImage", url);
        // Update the inserted image
        setTimeout(() => {
          if (editorRef.current) {
            const imgs = editorRef.current.querySelectorAll("img");
            const lastImg = imgs[imgs.length - 1];
            if (lastImg && lastImg.src === url) {
              lastImg.style.maxWidth = "100%";
              lastImg.style.height = "auto";
              lastImg.className = "rounded-lg my-4";
              lastImg.setAttribute("data-image-url", url);
            }
          }
        }, 0);
      }
      editorRef.current.focus();
      
      // Trigger input event to update content state immediately
      const inputEvent = new Event("input", { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
    }
  };

  const insertList = () => {
    execCommand("insertUnorderedList");
  };

  return (
    <div className="sticky top-[65px] z-10 flex justify-center py-3 pointer-events-none">
      <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm rounded-full px-4 py-2 flex items-center gap-1 pointer-events-auto transition-all hover:shadow-md">
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-2">
          <select
            className="text-sm font-medium bg-transparent border-none focus:ring-0 text-gray-700 cursor-pointer w-24"
            onChange={(e) => formatHeading(e.target.value)}
            defaultValue="Normal"
          >
            <option value="Normal">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </div>

        <button
          onClick={() => execCommand("bold")}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
          title="Bold (Ctrl+B)"
          type="button"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => execCommand("italic")}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
          title="Italic (Ctrl+I)"
          type="button"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={insertLink}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
          title="Insert Link"
          type="button"
        >
          <LinkIcon size={18} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1"></div>

        <button
          onClick={() => execCommand("justifyLeft")}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
          title="Align Left"
          type="button"
        >
          <AlignLeft size={18} />
        </button>
        <button
          onClick={() => execCommand("justifyCenter")}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
          title="Align Center"
          type="button"
        >
          <AlignCenter size={18} />
        </button>
        <button
          onClick={() => execCommand("justifyRight")}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
          title="Align Right"
          type="button"
        >
          <AlignRight size={18} />
        </button>
        <button
          onClick={() => setImageDialogOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
          title="Insert Image"
          type="button"
        >
          <ImageIcon size={18} />
        </button>
        <button
          onClick={insertList}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
          title="Insert Bullet List"
          type="button"
        >
          <List size={18} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1"></div>

        <button
          className="p-2 hover:bg-gray-100 rounded-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          title="AI Rewriter (Coming Soon)"
          type="button"
          disabled
        >
          <Sparkles size={18} />
        </button>
      </div>
      
      <ImageUploadDialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        onImageUploaded={handleImageUploaded}
      />
    </div>
  );
};

// Document Editor
const DocumentEditor = ({
  content,
  setContent,
  onFocus,
  editorRef,
}: {
  content: string;
  setContent: (content: string) => void;
  onFocus: () => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastContent, setLastContent] = useState<string>("");

  // Initialize editor with content
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = content || "<p></p>";
      setIsInitialized(true);
      setLastContent(content);
    }
  }, [isInitialized, editorRef]);

  // Update content when it changes from outside (e.g., loaded from API)
  useEffect(() => {
    if (editorRef.current && isInitialized && content !== lastContent) {
      // Only update if content actually changed and user isn't actively editing
      const currentContent = editorRef.current.innerHTML;
      if (currentContent !== content) {
        editorRef.current.innerHTML = content || "<p></p>";
        setLastContent(content);
      }
    }
  }, [content, isInitialized, lastContent, editorRef]);

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      setLastContent(newContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") {
        e.preventDefault();
        document.execCommand("bold", false);
      } else if (e.key === "i") {
        e.preventDefault();
        document.execCommand("italic", false);
      } else if (e.key === "u") {
        e.preventDefault();
        document.execCommand("underline", false);
      }
    }
  };

  return (
    <div
      ref={editorRef}
      className="max-w-[850px] mx-auto bg-white min-h-[1000px] shadow-sm border border-gray-200 mt-6 mb-20 p-12 outline-none transition-shadow focus-within:shadow-lg focus-within:ring-1 focus-within:ring-gray-200/50 prose prose-lg prose-slate max-w-none"
      contentEditable
      suppressContentEditableWarning
      onFocus={onFocus}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      style={{ minHeight: "1000px" }}
    />
  );
};

// Main Page
export default function NewsEditPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";
  const pathSegments = pathname?.split("/").filter(Boolean) || [];
  const lastSegment = pathSegments[pathSegments.length - 1];
  const id = lastSegment && lastSegment !== "new" ? lastSegment : null;
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<NewsStatus>("draft");
  const [showSettings, setShowSettings] = useState(true);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [publishedAt, setPublishedAt] = useState<Date | undefined>(undefined);
  const [isFeatured, setIsFeatured] = useState(false);
  const [lastSaved, setLastSaved] = useState("Chưa lưu");
  const [loading, setLoading] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);

  const fetchNews = React.useCallback(async () => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated || !user || !id) {
      if (!isAuthenticated || !user) {
        toast.error("Vui lòng đăng nhập để chỉnh sửa tin tức");
        router.push(`/${locale}/admin/news`);
      }
      return;
    }
    
    setLoading(true);
    try {
      // Fetch news by ID - token is sent via httpOnly cookie
      const response = await newsApi.getById(id);
      if (response.success && response.data) {
        const article = response.data;
        setTitle(article.title || "");
        setSlug(article.slug || "");
        setExcerpt(article.excerpt || "");
        const articleContent = article.content || "<p></p>";
        
        console.log("Loaded article content:", articleContent);
        console.log("Content length:", articleContent.length);
        console.log("Has images in loaded content:", articleContent.includes("<img"));
        if (articleContent.includes("<img")) {
          const imgMatches = articleContent.match(/<img[^>]*>/g);
          console.log("Image tags found:", imgMatches);
        }
        
        // Set content and update editor
        setContent(articleContent);
        // Force update editor with loaded content
        if (editorRef.current) {
          editorRef.current.innerHTML = articleContent;
        }
        
        setCoverImage(article.coverImage || "");
        setCategory(article.category || "");
        setTags(article.tags || []);
        setStatus(article.status || "draft");
        setIsFeatured(article.isFeatured || false);
        if (article.publishedAt) {
          setPublishedAt(new Date(article.publishedAt));
        }
      } else {
        toast.error("Không tìm thấy tin tức");
        router.push(`/${locale}/admin/news`);
      }
    } catch (error: any) {
      console.error("Error fetching news:", error);
      toast.error(error.message || "Không thể tải tin tức");
      router.push(`/${locale}/admin/news`);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading, id, locale, router]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    
    if (isAuthenticated && user) {
      if (id) {
        fetchNews();
      } else {
        // New article - initialize empty form
        setLoading(false);
        setTitle("");
        setSlug("");
        setExcerpt("");
        setContent("<p></p>");
        setCoverImage("");
        setCategory("");
        setTags([]);
        setStatus("draft");
        setIsFeatured(false);
        setPublishedAt(undefined);
      }
    } else {
      setLoading(false);
      toast.error("Vui lòng đăng nhập để chỉnh sửa tin tức");
      router.push(`/${locale}/admin/news`);
    }
  }, [isAuthenticated, user, authLoading, id, fetchNews, locale, router]);

  const handleSave = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    // Validate required fields
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết");
      return;
    }

    if (!excerpt.trim()) {
      toast.error("Vui lòng nhập mô tả ngắn (excerpt)");
      return;
    }

    // Auto-generate slug if not provided
    let finalSlug = slug.trim();
    if (!finalSlug && title.trim()) {
      finalSlug = generateSlug(title);
      setSlug(finalSlug);
      toast.info(`Slug tự động: ${finalSlug}`);
    }

    if (!finalSlug) {
      toast.error("Vui lòng nhập slug hoặc tiêu đề để tự động tạo slug");
      return;
    }
    
    // Get content directly from editor to ensure we have the latest content including images
    let editorContent = content;
    if (editorRef.current) {
      editorContent = editorRef.current.innerHTML;
      // Update state with latest content
      setContent(editorContent);
      console.log("Editor content before save:", editorContent);
      console.log("Has images:", editorContent.includes("<img"));
    }
    
    // Clean content - remove empty paragraphs but preserve images
    // Be careful not to remove image tags
    const cleanContent = editorContent
      .replace(/<p><\/p>/g, "")
      .replace(/<p>\s*<\/p>/g, "")
      .trim() || "<p></p>";
    
    console.log("Cleaned content:", cleanContent);
    console.log("Content length:", cleanContent.length);

    setIsSaving(true);
    try {
      const payload: Partial<NewsArticle> = {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt.trim(),
        content: cleanContent,
        coverImage,
        category,
        tags,
        status,
        locale,
        isFeatured,
        publishedAt: publishedAt?.toISOString(),
      };

      // Token is sent via httpOnly cookie, no need to pass it
      let response;
      if (id) {
        response = await newsApi.update(id, payload);
      } else {
        response = await newsApi.create(payload);
      }

      if (response.success) {
        const isPublished = status === "published";
        const articleSlug = finalSlug || response.data?.slug;
        
        if (isPublished && articleSlug) {
          toast.success(
            id
              ? "Cập nhật và xuất bản thành công"
              : "Tạo mới và xuất bản thành công",
            {
              description: "Bài viết đã được đăng lên website",
              action: {
                label: "Xem bài viết",
                onClick: () => {
                  window.open(`/${locale}/news/${articleSlug}`, "_blank");
                },
              },
              duration: 5000,
            }
          );
        } else {
          toast.success(
            id ? "Cập nhật thành công" : "Tạo mới thành công"
          );
        }
        
        setLastSaved("Vừa xong");
        if (!id && response.data) {
          const newId = response.data._id || response.data.id;
          router.push(`/${locale}/admin/news/${newId}`);
        }
        // Refresh to update status if editing
        if (id) {
          setTimeout(() => {
            if (id) {
              fetchNews();
            }
          }, 500);
        }
      } else {
        toast.error(response.message || "Lưu thất bại");
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể lưu tin tức");
    } finally {
      setIsSaving(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  useEffect(() => {
    if (!slug && title) {
      setSlug(generateSlug(title));
    }
  }, [title]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-gray-900 flex flex-col" style={{ paddingTop: 0 }}>
      {/* Header */}
      <header 
        className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between fixed top-0 w-full z-[100] shadow-sm" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0,
          zIndex: 100
        }}
      >
        {/* Left: Branding & Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden relative z-10">
          <button
            onClick={() => router.push(`/${locale}/admin/news`)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              <Type size={18} />
            </div>
            <div className="flex flex-col gap-1 relative z-20" style={{ position: 'relative', zIndex: 20 }}>
              <label className="text-xs text-gray-500 font-medium">Tiêu đề bài viết</label>
              <Input
                value={title}
                onChange={(e) => {
                  e.stopPropagation();
                  setTitle(e.target.value);
                }}
                onFocus={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                disabled={loading || isSaving}
                readOnly={false}
                className="block w-full max-w-md text-lg font-medium text-gray-800 border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 bg-white hover:border-gray-300 transition-colors"
                placeholder="Nhập tiêu đề bài viết..."
                style={{ 
                  pointerEvents: (loading || isSaving) ? 'none' : 'auto',
                  cursor: (loading || isSaving) ? 'not-allowed' : 'text',
                  position: 'relative',
                  zIndex: 20,
                  minWidth: '300px'
                }}
                autoFocus={false}
              />
              {status === "published" && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                  <CheckCircle size={12} />
                  Đã đăng
                </span>
              )}
              {status === "draft" && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                  Bản nháp
                </span>
              )}
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
              <span className="hover:underline cursor-pointer">File</span>
              <span className="hover:underline cursor-pointer">Edit</span>
              <span className="hover:underline cursor-pointer">View</span>
              <span className="hover:underline cursor-pointer">Help</span>
              <span className="mx-1 text-gray-300">|</span>
              {isSaving ? (
                <span className="text-gray-500">Đang lưu...</span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400">
                  <CheckCircle size={10} /> {lastSaved}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions - Các nút lưu luôn hiển thị */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {/* View Published Article Button */}
          {status === "published" && slug && (
            <>
              <button
                onClick={() => {
                  window.open(`/${locale}/news/${slug}`, "_blank");
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                title="Xem bài viết trên website"
              >
                <Eye size={16} />
                Xem bài viết
              </button>
              <div className="h-6 w-px bg-gray-200 mx-1"></div>
            </>
          )}

          <button
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            title="Lịch sử phiên bản"
          >
            <History size={20} />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-colors ${
              showSettings
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            title="Cài đặt bài viết"
          >
            <PanelRight size={20} />
          </button>

          <div className="h-6 w-px bg-gray-200 mx-1"></div>

          {/* Simple Save Button - Lưu với trạng thái hiện tại */}
          <button
            onClick={() => {
              handleSave();
            }}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-all hover:shadow active:scale-95 disabled:opacity-50"
            title="Lưu với trạng thái hiện tại"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu
              </>
            )}
          </button>

          {/* Save as Draft Button */}
          <button
            onClick={() => {
              setStatus("draft");
              handleSave();
            }}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-all hover:shadow active:scale-95 disabled:opacity-50"
            title="Lưu dưới dạng bản nháp"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu nháp"
            )}
          </button>

          {/* Publish Button */}
          <button
            onClick={() => {
              setStatus("published");
              if (!publishedAt) {
                setPublishedAt(new Date());
              }
              handleSave();
            }}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-lg shadow-sm transition-all hover:shadow active:scale-95 disabled:opacity-50"
            title={status === "published" ? "Cập nhật bài viết đã xuất bản" : "Xuất bản bài viết"}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : status === "published" ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Cập nhật
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Xuất bản
              </>
            )}
          </button>
        </div>
      </header>

      {/* Body Content */}
      <div className="flex-1 mt-16 flex relative">
        {/* Main Editor Area */}
        <main
          className={`flex-1 overflow-y-auto h-[calc(100vh-64px)] scroll-smooth transition-all duration-300 ${
            showSettings ? "mr-80" : "mr-0"
          }`}
        >
          <EditorToolbar editorRef={editorRef} />
          <div className="px-4 pb-20">
            <DocumentEditor
              content={content}
              setContent={setContent}
              onFocus={() => {}}
              editorRef={editorRef}
            />
          </div>
        </main>

        {/* Settings Sidebar */}
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          status={status}
          setStatus={setStatus}
          slug={slug}
          setSlug={setSlug}
          title={title}
          excerpt={excerpt}
          setExcerpt={setExcerpt}
          coverImage={coverImage}
          setCoverImage={setCoverImage}
          category={category}
          setCategory={setCategory}
          tags={tags}
          setTags={setTags}
          locale={locale}
          publishedAt={publishedAt}
          setPublishedAt={setPublishedAt}
          isFeatured={isFeatured}
          setIsFeatured={setIsFeatured}
        />
      </div>

      {/* Floating Action Bar - Các nút lưu luôn hiển thị */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {/* Simple Save Button */}
        <button
          onClick={() => {
            handleSave();
          }}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-50 min-w-[140px] justify-center"
          title="Lưu với trạng thái hiện tại"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Lưu
            </>
          )}
        </button>

        {/* Save as Draft Button */}
        <button
          onClick={() => {
            setStatus("draft");
            handleSave();
          }}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-50 min-w-[140px] justify-center"
          title="Lưu dưới dạng bản nháp"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu nháp"
          )}
        </button>

        {/* Publish Button */}
        <button
          onClick={() => {
            setStatus("published");
            if (!publishedAt) {
              setPublishedAt(new Date());
            }
            handleSave();
          }}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-lg shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-50 min-w-[140px] justify-center"
          title={status === "published" ? "Cập nhật bài viết đã xuất bản" : "Xuất bản bài viết"}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang lưu...
            </>
          ) : status === "published" ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Cập nhật
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              Xuất bản
            </>
          )}
        </button>
      </div>
    </div>
  );
}

