"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImageIcon, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CoverImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function CoverImageUpload({ value, onChange }: CoverImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Chỉ chấp nhận JPEG, PNG, GIF, WebP");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ảnh phải nhỏ hơn 5MB");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch("/api/news/images", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success && data.data?.url) {
          onChange(data.data.url);
          toast.success("Upload ảnh bìa thành công");
        } else {
          toast.error(data.error || "Upload thất bại");
        }
      } catch {
        toast.error("Không thể upload ảnh");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) uploadFile(acceptedFiles[0]);
    },
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="space-y-2">
      {value ? (
        /* Preview mode */
        <div className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50">
          <img
            src={value}
            alt="Ảnh bìa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <div
              {...getRootProps()}
              className="cursor-pointer bg-white/90 hover:bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
            >
              <input {...getInputProps()} />
              <Upload size={13} />
              Thay ảnh
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="bg-red-500/90 hover:bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
            >
              <X size={13} />
              Xóa
            </button>
          </div>
        </div>
      ) : (
        /* Upload dropzone */
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg aspect-video flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100/50"
          } ${uploading ? "pointer-events-none opacity-70" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 text-center px-4">
            {uploading ? (
              <>
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-gray-600">Đang upload...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <ImageIcon size={22} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {isDragActive ? "Thả ảnh vào đây" : "Kéo thả ảnh hoặc click để chọn"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    PNG, JPG, WebP tối đa 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CoverImageUpload;
