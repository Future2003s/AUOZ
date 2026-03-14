"use client";
import React, { useCallback, useRef } from "react";
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
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, Star, Upload, GripVertical, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export interface GalleryImage {
  id: string;     // unique key for DnD
  url: string;
  isMain: boolean;
}

interface GalleryManagerProps {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  /** Called when user uploads files via the UI — returns the uploaded URL */
  onUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
}

// ─── Single sortable image card ──────────────────────────────────────────────
function SortableImageCard({
  image,
  index,
  onSetMain,
  onDelete,
}: {
  image: GalleryImage;
  index: number;
  onSetMain: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg overflow-hidden border-2 bg-gray-50 aspect-square transition-all ${
        image.isMain
          ? "border-blue-500 ring-2 ring-blue-300"
          : "border-gray-200 hover:border-gray-400"
      } ${isDragging ? "shadow-2xl scale-105" : ""}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 p-1 bg-black/40 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-3 w-3 text-white" />
      </div>

      {/* Image */}
      <img
        src={image.url}
        alt={`Ảnh ${index + 1}`}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Main badge */}
      {image.isMain && (
        <div className="absolute bottom-1 left-1 z-10 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
          <Star className="h-2.5 w-2.5 fill-current" />
          Chính
        </div>
      )}

      {/* Hover overlay actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
        {!image.isMain && (
          <button
            type="button"
            onClick={() => onSetMain(image.id)}
            title="Đặt làm ảnh chính"
            className="p-1.5 bg-yellow-400 hover:bg-yellow-500 rounded text-white transition-colors"
          >
            <Star className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(image.id)}
          title="Xóa ảnh"
          className="p-1.5 bg-red-500 hover:bg-red-600 rounded text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main GalleryManager ──────────────────────────────────────────────────────
export default function GalleryManager({
  images,
  onChange,
  onUpload,
  disabled = false,
}: GalleryManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(images, oldIndex, newIndex);
    // If the main image was moved, track it; otherwise ensure index 0 stays main
    onChange(
      reordered.map((img, i) => ({
        ...img,
        isMain: img.isMain ? true : i === 0 && reordered.every((r) => !r.isMain),
      }))
    );
  };

  const handleSetMain = (id: string) => {
    onChange(images.map((img) => ({ ...img, isMain: img.id === id })));
  };

  const handleDelete = (id: string) => {
    const next = images.filter((img) => img.id !== id);
    // If deleted was main, promote first remaining
    if (images.find((img) => img.id === id)?.isMain && next.length > 0) {
      next[0] = { ...next[0], isMain: true };
    }
    onChange(next);
  };

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!onUpload) {
        toast.error("Chức năng upload chưa được cấu hình");
        return;
      }
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArray.length === 0) {
        toast.error("Không có ảnh hợp lệ");
        return;
      }

      const toastId = toast.loading(`Đang upload ${fileArray.length} ảnh...`);
      try {
        const urls = await Promise.all(fileArray.map((f) => onUpload(f)));
        const newImages: GalleryImage[] = urls.map((url, i) => ({
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
          url,
          isMain: images.length === 0 && i === 0, // only set main if no existing images
        }));
        onChange([...images, ...newImages]);
        toast.success(`Upload ${urls.length} ảnh thành công!`, { id: toastId });
      } catch (err: any) {
        toast.error(err?.message || "Upload thất bại", { id: toastId });
      }
    },
    [images, onChange, onUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDropOnZone = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  };

  return (
    <div className={`space-y-3 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropOnZone}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-5 text-center cursor-pointer transition-colors group bg-gray-50 hover:bg-blue-50"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-blue-600 transition-colors">
          <div className="flex gap-2">
            <Upload className="h-6 w-6" />
            <ImagePlus className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">Kéo thả hoặc click để upload nhiều ảnh</p>
          <p className="text-xs text-gray-400">PNG, JPG, WebP • tối đa 10MB/ảnh</p>
        </div>
      </div>

      {/* Sortable gallery grid */}
      {images.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">
            {images.length} ảnh • Kéo để sắp xếp • ⭐ đặt ảnh chính • 🗑 xóa
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <SortableImageCard
                    key={image.id}
                    image={image}
                    index={index}
                    onSetMain={handleSetMain}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
