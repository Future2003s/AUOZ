"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Activity } from "@/apiRequests/activities";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface ActivityCardProps {
  activity: Activity;
  locale: string;
}

export function ActivityCard({ activity, locale }: ActivityCardProps) {
  return (
    <Link
      href={`/${locale}/activities/${activity._id}`}
      className="block bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 group h-full"
    >
      {activity.imageUrl && (
        <div className="relative h-64 overflow-hidden">
          <Image
            src={activity.imageUrl}
            alt={activity.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        </div>
      )}

      <div className="p-6">
        {activity.tags && activity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {activity.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
          {activity.title}
        </h3>

        {activity.shortDescription && (
          <p className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-3">
            {activity.shortDescription}
          </p>
        )}

        <div className="space-y-2 mb-4">
          {activity.activityDate && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(activity.activityDate), "dd/MM/yyyy", {
                  locale: vi,
                })}
              </span>
            </div>
          )}
          {activity.location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{activity.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
          <span>Xem chi tiết</span>
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

