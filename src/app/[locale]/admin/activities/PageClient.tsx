"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { activityApi, type Activity } from "@/apiRequests/activities";
import { useAppContextProvider } from "@/context/app-context";
import { ActivityForm } from "./components/ActivityForm";
import { ActivityList } from "./components/ActivityList";

export default function PageClient() {
  const { sessionToken } = useAppContextProvider();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchActivities();
  }, [currentPage, sessionToken, searchQuery]);

  const fetchActivities = async () => {
    if (!sessionToken) return;

    try {
      setLoading(true);
      const response = await activityApi.getAllAdmin(
        {
          page: currentPage,
          limit: 12,
          search: searchQuery || undefined,
        },
        sessionToken
      );

      if (response.success && response.data) {
        setActivities(response.data.activities);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error: any) {
      toast.error("Không thể tải danh sách hoạt động");
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setCreating(true);
  };

  const handleEdit = (activity: Activity) => {
    setEditing(activity);
    setCreating(false);
  };

  const handleClose = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (data: Partial<Activity>) => {
    if (!sessionToken) return;

    try {
      setSaving(true);
      if (editing) {
        await activityApi.update(editing._id!, data, sessionToken);
        toast.success("Cập nhật hoạt động thành công");
      } else {
        await activityApi.create(data, sessionToken);
        toast.success("Tạo hoạt động thành công");
      }
      handleClose();
      fetchActivities();
    } catch (error: any) {
      toast.error(
        editing
          ? "Không thể cập nhật hoạt động"
          : "Không thể tạo hoạt động"
      );
      console.error("Error saving activity:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!sessionToken) return;
    if (!confirm("Bạn có chắc chắn muốn xóa hoạt động này?")) return;

    try {
      setDeletingId(id);
      await activityApi.delete(id, sessionToken);
      toast.success("Xóa hoạt động thành công");
      fetchActivities();
    } catch (error: any) {
      toast.error("Không thể xóa hoạt động");
      console.error("Error deleting activity:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: string) => {
    if (!sessionToken) return;

    try {
      await activityApi.toggle(id, sessionToken);
      toast.success("Cập nhật trạng thái thành công");
      fetchActivities();
    } catch (error: any) {
      toast.error("Không thể cập nhật trạng thái");
      console.error("Error toggling activity:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý hoạt động</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các hoạt động và sự kiện của công ty
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo hoạt động mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm hoạt động..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ActivityList
            activities={activities}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
            deletingId={deletingId}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-600">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || loading}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ActivityForm
        open={creating || editing !== null}
        onClose={handleClose}
        onSubmit={handleSubmit}
        activity={editing}
        isSubmitting={saving}
      />
    </div>
  );
}

