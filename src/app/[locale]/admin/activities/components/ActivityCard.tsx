"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, EyeOff, Calendar, MapPin } from "lucide-react";
import Image from "next/image";
import { Activity } from "@/apiRequests/activities";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ActivityCardProps {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  isDeleting: boolean;
}

export function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onToggle,
  isDeleting,
}: ActivityCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{activity.title}</CardTitle>
              <Badge variant={activity.published ? "default" : "secondary"}>
                {activity.published ? (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Đã xuất bản
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" />
                    Bản nháp
                  </>
                )}
              </Badge>
            </div>
            {activity.shortDescription && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {activity.shortDescription}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activity.imageUrl && (
          <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
            <Image
              src={activity.imageUrl}
              alt={activity.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        
        <div className="space-y-2 mb-4">
          {activity.activityDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(activity.activityDate), "dd/MM/yyyy", {
                  locale: vi,
                })}
              </span>
            </div>
          )}
          {activity.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{activity.location}</span>
            </div>
          )}
          {activity.tags && activity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {activity.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-gray-500">
            Thứ tự: {activity.order}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggle(activity._id!)}
            >
              {activity.published ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  Ẩn
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Xuất bản
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(activity)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Sửa
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(activity._id!)}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Xóa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

