"use client";

import { ActivityCard } from "./ActivityCard";
import { Activity } from "@/apiRequests/activities";
import { Loader } from "@/components/ui/loader";

interface ActivityListProps {
  activities: Activity[];
  loading: boolean;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  deletingId: string | null;
}

export function ActivityList({
  activities,
  loading,
  onEdit,
  onDelete,
  onToggle,
  deletingId,
}: ActivityListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Chưa có hoạt động nào</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activities.map((activity) => (
        <ActivityCard
          key={activity._id}
          activity={activity}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
          isDeleting={deletingId === activity._id}
        />
      ))}
    </div>
  );
}

