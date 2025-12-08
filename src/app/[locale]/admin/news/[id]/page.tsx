"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
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
  availableCategories,
  setAvailableCategories,
  showCustomCategory,
  setShowCustomCategory,
  customCategory,
  setCustomCategory,
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
  availableCategories: string[];
  setAvailableCategories: (categories: string[]) => void;
  showCustomCategory: boolean;
  setShowCustomCategory: (show: boolean) => void;
  customCategory: string;
  setCustomCategory: (category: string) => void;
}) => {
  const [newTag, setNewTag] = useState("");
  if (!isOpen) return null;

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

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
              <div className="space-y-2">
                <Select
                  value={category || "none"}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setShowCustomCategory(true);
                      setCustomCategory("");
                    } else if (value === "none") {
                      setCategory("");
                      setShowCustomCategory(false);
                    } else {
                      setCategory(value);
                      setShowCustomCategory(false);
                    }
                  }}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Chọn hoặc nhập danh mục mới" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có danh mục</SelectItem>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
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
                        setCategory(customCategory.trim());
                        // Add to available categories if not exists
                        if (!availableCategories.includes(customCategory.trim())) {
                          setAvailableCategories([...availableCategories, customCategory.trim()].sort());
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (customCategory.trim()) {
                          setCategory(customCategory.trim());
                          // Add to available categories if not exists
                          if (!availableCategories.includes(customCategory.trim())) {
                            setAvailableCategories([...availableCategories, customCategory.trim()].sort());
                          }
                          setShowCustomCategory(false);
                          setCustomCategory("");
                        }
                      }
                    }}
                    placeholder="Nhập danh mục mới..."
                    className="text-sm"
                    autoFocus
                  />
                )}
              </div>
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể upload ảnh";
      console.error("Upload error:", error);
      toast.error(message);
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
const EditorToolbar = ({ 
  editorRef,
  onContentChange,
  onFormatChange
}: { 
  editorRef: React.RefObject<HTMLDivElement | null>;
  onContentChange?: () => void;
  onFormatChange?: () => void;
}) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentFormat, setCurrentFormat] = useState("Normal");

  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) {
      console.warn("Editor ref not available");
      return false;
    }
    
    try {
      // Ensure editor is focused and has selection
      editorRef.current.focus();
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        // Create a range at the end of editor
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      
      const success = document.execCommand(command, false, value);
      
      if (!success) {
        console.warn(`Command ${command} with value ${value} failed`);
      }
      
      // Trigger input event to update content state
      const inputEvent = new Event("input", { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
      
      return success;
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
      return false;
    }
  };

  const formatHeading = (level: string) => {
    if (!editorRef.current) {
      console.error("Editor ref not available");
      toast.error("Editor chưa sẵn sàng");
      return;
    }
    
    try {
      // Ensure editor is focused
      editorRef.current.focus();
      
      // Get or create selection
      const selection = window.getSelection();
      let range: Range;
      
      if (!selection || selection.rangeCount === 0) {
        // Create range at cursor position
        range = document.createRange();
        if (editorRef.current.firstChild) {
          range.setStart(editorRef.current, 0);
          range.setEnd(editorRef.current, 0);
        } else {
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
        }
        selection?.removeAllRanges();
        selection?.addRange(range);
      } else {
        range = selection.getRangeAt(0);
      }
      
      // Determine block tag
      const blockTag = level === "Normal" ? "p" : level.toLowerCase();
      
      // Find the block element containing the selection
      let blockElement: Element | null = null;
      let node: Node | null = range.commonAncestorContainer;
      
      // Traverse up to find the block element
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const tagName = element.tagName.toLowerCase();
          // Check if it's a block element
          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'li'].includes(tagName)) {
            blockElement = element;
            break;
          }
        }
        node = node.parentNode;
      }
      
      // If no block element found, wrap selection in new block element
      if (!blockElement) {
        // Get the selected content (clone to avoid removing it)
        const clonedContent = range.cloneContents();
        const textContent = range.toString() || " ";
        
        // Create new element
        const newElement = document.createElement(blockTag);
        if (clonedContent.childNodes.length > 0) {
          newElement.appendChild(clonedContent);
        } else {
          newElement.textContent = textContent || " ";
        }
        
        // Delete original content and insert new element
        range.deleteContents();
        range.insertNode(newElement);
        
        // Set cursor in new element
        const newRange = document.createRange();
        newRange.selectNodeContents(newElement);
        newRange.collapse(false);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        // Replace existing block element
        const newElement = document.createElement(blockTag);
        
        // Preserve all content including nested elements
        newElement.innerHTML = blockElement.innerHTML || blockElement.textContent || " ";
        
        // Replace the element
        blockElement.replaceWith(newElement);
        
        // Set cursor in new element (at the end)
        const newRange = document.createRange();
        newRange.selectNodeContents(newElement);
        newRange.collapse(false);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
      
      // Update current format
      setCurrentFormat(level === "Normal" ? "Normal" : level.toLowerCase());
      
      // Trigger format change event immediately to prevent DocumentEditor from overwriting
      if (editorRef.current) {
        const formatChangeEvent = new CustomEvent("formatchange", { bubbles: true });
        editorRef.current.dispatchEvent(formatChangeEvent);
      }
      
      // Notify that format has changed (to prevent DocumentEditor from overwriting)
      if (onFormatChange) {
        onFormatChange();
      }
      
      // Force update content state immediately using requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (editorRef.current) {
            // Get the updated HTML after DOM changes
            const updatedContent = editorRef.current.innerHTML;
            
            // Update content state
            if (onContentChange) {
              onContentChange();
            }
            
            // Trigger input event to ensure all listeners are notified
            const inputEvent = new Event("input", { bubbles: true });
            editorRef.current.dispatchEvent(inputEvent);
          }
        }, 0);
      });
      
      editorRef.current.focus();
      
      console.log(`Format changed to: ${level}`);
    } catch (error) {
      console.error("Error formatting heading:", error);
      toast.error("Không thể thay đổi định dạng. Vui lòng thử lại.");
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
    if (!editorRef.current) {
      console.error("Editor ref not available");
      toast.error("Editor chưa sẵn sàng");
      return;
    }
    
    try {
      // Ensure editor is focused
      editorRef.current.focus();
      
      // Get or create selection
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        // Create range at cursor position
        const range = document.createRange();
        if (editorRef.current.firstChild) {
          range.setStart(editorRef.current, 0);
          range.setEnd(editorRef.current, 0);
        } else {
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
        }
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      
      // Try execCommand first
      const success = document.execCommand("insertUnorderedList", false);
      
      if (!success && selection && selection.rangeCount > 0) {
        // Fallback: manually create list
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const parent = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement 
          : container as Element;
        
        const list = document.createElement("ul");
        list.style.marginLeft = "20px";
        list.style.paddingLeft = "20px";
        list.style.marginTop = "8px";
        list.style.marginBottom = "8px";
        
        const listItem = document.createElement("li");
        listItem.textContent = " ";
        list.appendChild(listItem);
        
        // If we're in an empty paragraph, replace it
        if (parent?.tagName === "P" && (!parent.textContent || parent.textContent.trim() === "")) {
          parent.replaceWith(list);
        } else {
          // Insert list at current position
          range.insertNode(list);
        }
        
        // Set cursor in list item
        const newRange = document.createRange();
        newRange.setStart(listItem, 0);
        newRange.setEnd(listItem, 0);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      // Trigger input event to update content state
      const inputEvent = new Event("input", { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
      editorRef.current.focus();
      
      console.log("List inserted successfully");
    } catch (error) {
      console.error("Error inserting list:", error);
      toast.error("Không thể chèn danh sách. Vui lòng thử lại.");
    }
  };

  // Update current format when selection changes
  useEffect(() => {
    const updateFormat = () => {
      if (!editorRef.current) return;
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Check if selection is within editor
        if (!editorRef.current.contains(range.commonAncestorContainer)) {
          return;
        }
        
        const container = range.commonAncestorContainer;
        let parent: Element | null = null;
        
        if (container.nodeType === Node.TEXT_NODE) {
          parent = container.parentElement;
        } else if (container.nodeType === Node.ELEMENT_NODE) {
          parent = container as Element;
        }
        
        // Traverse up to find block element
        while (parent && parent !== editorRef.current) {
          const tagName = parent.tagName.toLowerCase();
          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tagName)) {
            if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
              setCurrentFormat(tagName);
            } else if (tagName === "p") {
              setCurrentFormat("Normal");
            }
            return;
          }
          parent = parent.parentElement;
        }
        
        // Default to Normal if no block element found
        setCurrentFormat("Normal");
      }
    };
    
    // selectionchange is a global event on document
    document.addEventListener("selectionchange", updateFormat);
    
    if (editorRef.current) {
      editorRef.current.addEventListener("click", updateFormat);
      editorRef.current.addEventListener("keyup", updateFormat);
      
      return () => {
        document.removeEventListener("selectionchange", updateFormat);
        if (editorRef.current) {
          editorRef.current.removeEventListener("click", updateFormat);
          editorRef.current.removeEventListener("keyup", updateFormat);
        }
      };
    }
  }, [editorRef]);

  return (
    <div className="sticky top-[65px] z-10 flex justify-center py-3 pointer-events-none">
      <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm rounded-full px-4 py-2 flex items-center gap-1 pointer-events-auto transition-all hover:shadow-md">
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-2">
          <select
            className="text-sm font-medium bg-transparent border-none focus:ring-0 text-gray-700 cursor-pointer w-24"
            value={currentFormat}
            onChange={(e) => {
              const level = e.target.value;
              setCurrentFormat(level);
              formatHeading(level);
            }}
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
  const [isFormatting, setIsFormatting] = useState(false);

  // Initialize editor with content
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = content || "<p></p>";
      setIsInitialized(true);
      setLastContent(content);
    }
  }, [isInitialized, editorRef]);

  // Listen for format changes to prevent overwriting
  useEffect(() => {
    if (!editorRef.current) return;
    
    const handleFormatChange = () => {
      setIsFormatting(true);
      // Update lastContent to match current DOM to prevent overwrite
      if (editorRef.current) {
        const currentContent = editorRef.current.innerHTML;
        setLastContent(currentContent);
        // Also update the content state
        setContent(currentContent);
      }
      // Reset flag after a short delay
      setTimeout(() => setIsFormatting(false), 100);
    };

    editorRef.current.addEventListener("formatchange", handleFormatChange);
    
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener("formatchange", handleFormatChange);
      }
    };
  }, [editorRef, setContent]);

  // Update content when it changes from outside (e.g., loaded from API)
  useEffect(() => {
    // Don't update if we're currently formatting (to prevent overwriting format changes)
    if (isFormatting) {
      return;
    }
    
    if (editorRef.current && isInitialized && content !== lastContent) {
      // Only update if content actually changed and user isn't actively editing
      const currentContent = editorRef.current.innerHTML;
      // Only update if the content is significantly different (more than just whitespace)
      // This prevents overriding user's direct DOM edits (like format changes)
      const normalizedCurrent = currentContent.trim().replace(/\s+/g, ' ');
      const normalizedNew = content.trim().replace(/\s+/g, ' ');
      
      if (normalizedCurrent !== normalizedNew) {
        // Check if editor is focused - if so, don't override (user is actively editing)
        const isFocused = document.activeElement === editorRef.current;
        if (!isFocused) {
          editorRef.current.innerHTML = content || "<p></p>";
          setLastContent(content);
        }
      }
    }
  }, [content, isInitialized, lastContent, editorRef, isFormatting]);

  const handleInput = () => {
    if (editorRef.current && !isFormatting) {
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
  const params = useParams<{ id: string; locale: string }>();
  const id = params?.id as string | undefined;
  const locale = (params?.locale as string) || "vi";
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
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  // Fetch available categories from all articles
  const fetchCategories = React.useCallback(async () => {
    if (!isAuthenticated || !user || authLoading) {
      return;
    }
    
    try {
      const response = await newsApi.adminList({ locale, status: "all" });
      if (response && response.success && Array.isArray(response.data)) {
        const categorySet = new Set<string>();
        response.data.forEach((article: NewsArticle) => {
          if (article.category && article.category.trim()) {
            categorySet.add(article.category.trim());
          }
        });
        const categories = Array.from(categorySet).sort();
        setAvailableCategories(categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Không hiển thị error vì đây là optional feature
    }
  }, [isAuthenticated, user, authLoading, locale]);

  const fetchNews = React.useCallback(async () => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated || !user || !id) {
      if (!isAuthenticated || !user) {
        toast.error("Vui lòng đăng nhập để chỉnh sửa tin tức");
        router.push(`/${locale}/admin/news`);
      } else if (!id) {
        toast.error("ID bài viết không hợp lệ");
        router.push(`/${locale}/admin/news`);
      }
      setLoading(false);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải tin tức";
      console.error("Error fetching news:", error);
      toast.error(message);
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
      // Fetch categories first
      fetchCategories();
      
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lưu tin tức";
      toast.error(message);
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
      >
        {/* Left: Back + title + status */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => router.push(`/${locale}/admin/news`)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            aria-label="Quay lại danh sách"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading || isSaving}
              className="w-full text-lg font-medium text-gray-800 border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 bg-white hover:border-gray-300 transition-colors"
              placeholder="Nhập tiêu đề bài viết..."
            />
            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs ${
                  status === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {status === "published" ? "Đã đăng" : "Nháp"}
              </Badge>
              <span className="text-xs text-gray-400">
                {isSaving ? "Đang lưu..." : lastSaved || "Chưa lưu"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Preview + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(`/${locale}/news/${slug || ""}`, "_blank")}
            className="flex items-center gap-2"
          >
            <Eye size={16} />
            Xem bài viết
          </Button>

          <div className="h-6 w-px bg-gray-200 mx-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus("draft");
              handleSave();
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Đang lưu...
              </>
            ) : (
              "Lưu nháp"
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              handleSave();
            }}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Lưu
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setStatus("published");
              if (!publishedAt) {
                setPublishedAt(new Date());
              }
              handleSave();
            }}
            disabled={isSaving}
            className="bg-[#1A73E8] hover:bg-[#1557B0] text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Đang lưu...
              </>
            ) : status === "published" ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Cập nhật
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 mr-1" />
                Xuất bản
              </>
            )}
          </Button>
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
          <EditorToolbar 
            editorRef={editorRef}
            onContentChange={() => {
              if (editorRef.current) {
                const newContent = editorRef.current.innerHTML;
                setContent(newContent);
              }
            }}
            onFormatChange={() => {
              // This will be handled by the formatchange event listener
            }}
          />
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
          availableCategories={availableCategories}
          setAvailableCategories={setAvailableCategories}
          showCustomCategory={showCustomCategory}
          setShowCustomCategory={setShowCustomCategory}
          customCategory={customCategory}
          setCustomCategory={setCustomCategory}
          locale={locale}
          publishedAt={publishedAt}
          setPublishedAt={setPublishedAt}
          isFeatured={isFeatured}
          setIsFeatured={setIsFeatured}
        />
      </div>

    </div>
  );
}

