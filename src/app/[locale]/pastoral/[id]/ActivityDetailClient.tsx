"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, MapPin, ArrowLeft, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { activityApi, Activity } from "@/apiRequests/activities";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";

interface ActivityDetailClientProps {
  locale: string;
  id: string;
}

export default function ActivityDetailClient({
  locale,
  id,
}: ActivityDetailClientProps) {
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const response = await activityApi.getById(id);
      if (response.success && response.data) {
        setActivity(response.data);
      } else {
        router.push(`/${locale}/activities`);
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
      router.push(`/${locale}/activities`);
    } finally {
      setLoading(false);
    }
  };

  const gallery = activity?.gallery ?? [];

  const handleNextPhoto = useCallback(() => {
    setSelectedPhotoIndex((prev) =>
      prev === null ? 0 : prev === gallery.length - 1 ? 0 : prev + 1
    );
  }, [gallery.length]);

  const handlePrevPhoto = useCallback(() => {
    setSelectedPhotoIndex((prev) =>
      prev === null ? 0 : prev === 0 ? gallery.length - 1 : prev - 1
    );
  }, [gallery.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === "Escape") setSelectedPhotoIndex(null);
      if (e.key === "ArrowLeft") handlePrevPhoto();
      if (e.key === "ArrowRight") handleNextPhoto();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex, handlePrevPhoto, handleNextPhoto]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Không tìm thấy hoạt động</p>
          <Link href={`/${locale}/activities`}>
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      {activity.imageUrl && (
        <section className="relative h-96 md:h-[500px] overflow-hidden">
          <Image
            src={activity.imageUrl}
            alt={activity.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
            <div className="container mx-auto max-w-4xl">
              <Link href={`/${locale}/activities`}>
                <Button variant="outline" className="mb-4 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">{activity.title}</h1>
              {activity.shortDescription && (
                <p className="text-xl text-white/90">{activity.shortDescription}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Content Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {!activity.imageUrl && (
            <div className="mb-8">
              <Link href={`/${locale}/activities`}>
                <Button variant="outline" className="mb-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                {activity.title}
              </h1>
              {activity.shortDescription && (
                <p className="text-xl text-gray-600 mb-6">{activity.shortDescription}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b">
            {activity.activityDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>
                  {format(new Date(activity.activityDate), "dd 'tháng' MM, yyyy", {
                    locale: vi,
                  })}
                </span>
              </div>
            )}
            {activity.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>{activity.location}</span>
              </div>
            )}
          </div>

          {activity.tags && activity.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {activity.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: activity.content }}
          />

          {gallery.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hình ảnh</h2>

              {/* Masonry Gallery Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[220px]">
                {gallery.map((imageUrl, index) => {
                  // Ô đầu tiên chiếm 2 cột × 2 hàng, tạo điểm nhấn
                  const spanClass =
                    index === 0
                      ? "md:col-span-2 md:row-span-2"
                      : index === gallery.length - 1 && gallery.length % 2 === 0
                        ? "md:col-span-2 md:row-span-1"
                        : "md:col-span-1 md:row-span-1";
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`relative overflow-hidden rounded-2xl cursor-pointer group bg-gray-100 ${spanClass}`}
                    >
                      <Image
                        src={imageUrl}
                        alt={`${activity.title} - ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        unoptimized
                        loading="lazy"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                        <span className="text-white text-sm font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          Phóng to
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && gallery.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
          {/* Nút đóng */}
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-50"
            aria-label="Đóng"
          >
            <X size={26} />
          </button>

          {/* Nút Previous */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-50"
            aria-label="Ảnh trước"
          >
            <ChevronLeft size={30} />
          </button>

          {/* Ảnh chính */}
          <div
            className="w-full h-full flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
              <Image
                src={gallery[selectedPhotoIndex]}
                alt={`${activity.title} - ${selectedPhotoIndex + 1}`}
                fill
                className="object-contain"
                unoptimized
                priority
              />
            </div>
          </div>

          {/* Nút Next */}
          <button
            onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-50"
            aria-label="Ảnh tiếp"
          >
            <ChevronRight size={30} />
          </button>

          {/* Bộ đếm ảnh */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium tracking-widest bg-black/50 px-4 py-2 rounded-full">
            {selectedPhotoIndex + 1} / {gallery.length}
          </div>
        </div>
      )}
    </div>
  );
}

