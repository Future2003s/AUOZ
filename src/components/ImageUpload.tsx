"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  endpoint?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Hình ảnh",
  folder = "advertisements", // hiện tại chỉ dùng để mở rộng sau, backend đang dựa vào endpoint
  endpoint = "/api/advertisements/images", // Default endpoint, can be overridden
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with value prop
  useEffect(() => {
    if (value) {
      setPreview(value);
      setImageError(false);
    } else if (!uploading) {
      setPreview(null);
      setImageError(false);
    }
  }, [value, uploading]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Kích thước file quá lớn. Tối đa 10MB");
      return;
    }

    // Show immediate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append("image", file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error("JSON parse error:", error);
        throw new Error("Phản hồi không hợp lệ từ server");
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Upload failed: ${response.statusText}`);
      }

      // Extract image URL from various possible response formats
      const imageUrl = 
        data?.data?.url || 
        data?.data?.secure_url || 
        data?.data?.imageUrl ||
        data?.url || 
        data?.imageUrl ||
        data?.data?.data?.url;

      if (imageUrl) {
        // Clear the data URL preview and set the server URL
        setImageError(false);
        // Small delay to ensure state updates properly
        setTimeout(() => {
          setPreview(imageUrl);
          onChange(imageUrl);
        }, 100);
        toast.success("Upload ảnh thành công!", {
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        });
        console.log("Image uploaded successfully:", imageUrl);
      } else {
        console.error("Upload response structure:", data);
        console.error("Available keys:", Object.keys(data || {}));
        throw new Error("Không nhận được URL ảnh từ server. Vui lòng kiểm tra console để xem chi tiết.");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.message || "Lỗi khi upload ảnh");
      // Reset preview to previous value if upload fails
      setPreview(value || null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {preview ? (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200 shadow-md bg-gray-100">
            {!imageError ? (
              // Use regular img tag for better compatibility with external URLs
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
                style={{ display: imageError ? "none" : "block" }}
                onError={(e) => {
                  console.error("Image load error:", preview);
                  console.error("Image URL:", preview);
                  setImageError(true);
                }}
                onLoad={() => {
                  setImageError(false);
                  console.log("Image loaded successfully:", preview);
                }}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <ImageIcon className="w-12 h-12 mb-2" />
                <p className="text-xs">Không thể tải ảnh</p>
                <p className="text-xs text-gray-400 mt-1 break-all px-2 text-center">
                  {preview.length > 50 ? `${preview.substring(0, 50)}...` : preview}
                </p>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <div className="w-48 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-white">{uploadProgress}%</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClick}
                disabled={uploading}
                className="bg-white/90 hover:bg-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Thay đổi
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Xóa
              </Button>
            </div>
          </div>
          {value && (
            <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ảnh đã được tải lên thành công</span>
            </div>
          )}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Đang upload...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Click để chọn ảnh hoặc kéo thả vào đây
              </p>
              <p className="text-xs text-gray-500">
                JPEG, PNG, GIF, WebP (tối đa 10MB)
              </p>
            </div>
          )}
        </div>
      )}

      {/* URL input as fallback */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">Hoặc nhập URL hình ảnh trực tiếp:</Label>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={value || ""}
            onChange={(e) => {
              const url = e.target.value.trim();
              onChange(url);
              if (url) {
                setPreview(url);
              } else {
                setPreview(null);
              }
            }}
            disabled={uploading}
            className="flex-1"
          />
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onChange("");
                setPreview(null);
              }}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {value && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            URL đã được lưu: {value.length > 50 ? `${value.substring(0, 50)}...` : value}
          </p>
        )}
      </div>
    </div>
  );
}

