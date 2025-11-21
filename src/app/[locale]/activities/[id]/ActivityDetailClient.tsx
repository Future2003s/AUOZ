"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, MapPin, ArrowLeft, Loader2 } from "lucide-react";
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

          {activity.gallery && activity.gallery.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hình ảnh</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activity.gallery.map((imageUrl, index) => (
                  <div key={index} className="relative h-64 rounded-lg overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={`${activity.title} - ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

