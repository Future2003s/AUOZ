import * as React from "react";
import { Eye, Edit, Copy, Trash2, Clock, CheckCircle, Link2, CopyCheck } from "lucide-react";
import type { Task } from "./useTasks";

export type TaskFilterType = "my-tasks" | "assigned-tasks" | "all";

export type TaskContextMenuEntry =
  | {
      type: "item";
      id: string;
      label: string;
      icon?: React.ReactNode;
      variant?: "default" | "destructive";
      disabled?: boolean;
      hidden?: boolean;
      onSelect: () => void | Promise<void>;
    }
  | {
      type: "separator";
      id: string;
      hidden?: boolean;
    };

export interface UseTaskContextMenuParams {
  task: Task;
  filterType: TaskFilterType;
  currentUserId?: string;
  isAdmin?: boolean;
  onViewDetail: () => void;
  onEditTask: () => void;
  onToggleStatus: () => Promise<void> | void;
  onDelete: () => void;
  onCopyInfo: () => void;
  onDuplicate?: () => Promise<void> | void;
  onCopyId?: () => void;
  onCopyLink?: () => void;
}

export interface UseTaskContextMenuResult {
  items: TaskContextMenuEntry[];
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Centralized context menu logic for Task actions.
 * Keeps permissions / visibility consistent between employee & admin views.
 */
export const useTaskContextMenu = (
  params: UseTaskContextMenuParams
): UseTaskContextMenuResult => {
  const {
    task,
    filterType,
    currentUserId,
    isAdmin,
    onViewDetail,
    onEditTask,
    onToggleStatus,
    onDelete,
    onCopyInfo,
    onDuplicate,
    onCopyId,
    onCopyLink,
  } = params;

  const isDone = task.status === "done";
  const isOwner =
    Boolean(task.createdBy) &&
    Boolean(currentUserId) &&
    String(task.createdBy) === String(currentUserId);

  // Business rules:
  // - Assigned tasks tab: không sửa / xóa trực tiếp từ menu
  // - Nhân viên chỉ xóa được task mình tạo; admin/seller có thể xóa tất cả (thể hiện trên FE giống BE)
  const canEdit = filterType !== "assigned-tasks" && Boolean(task._id);
  const canDelete =
    filterType !== "assigned-tasks" && Boolean(task._id) && (Boolean(isAdmin) || isOwner);

  const items: TaskContextMenuEntry[] = [
    {
      type: "item",
      id: "view",
      label: "Xem chi tiết",
      icon: <Eye className="w-4 h-4" />,
      onSelect: onViewDetail,
    },
    {
      type: "item",
      id: "edit",
      label: "Sửa công việc",
      icon: <Edit className="w-4 h-4" />,
      hidden: !canEdit,
      disabled: !canEdit,
      onSelect: onEditTask,
    },
    {
      type: "separator",
      id: "sep-main",
      hidden: false,
    },
    {
      type: "item",
      id: "toggle-status",
      label: isDone ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành",
      icon: isDone ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />,
      onSelect: onToggleStatus,
    },
    {
      type: "item",
      id: "duplicate",
      label: "Nhân bản công việc",
      icon: <CopyCheck className="w-4 h-4" />,
      hidden: !onDuplicate,
      disabled: !onDuplicate,
      onSelect: () => {
        if (onDuplicate) onDuplicate();
      },
    },
    {
      type: "separator",
      id: "sep-secondary",
      hidden: false,
    },
    {
      type: "item",
      id: "copy-info",
      label: "Sao chép thông tin",
      icon: <Copy className="w-4 h-4" />,
      onSelect: onCopyInfo,
    },
    {
      type: "item",
      id: "copy-id",
      label: "Sao chép ID",
      icon: <Link2 className="w-4 h-4" />,
      hidden: !task._id,
      disabled: !task._id,
      onSelect: () => {
        if (onCopyId) {
          onCopyId();
        } else if (task._id && typeof window !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(task._id).catch(() => {
            // Im lặng nếu lỗi copy; hành vi này không critical
          });
        }
      },
    },
    {
      type: "item",
      id: "copy-link",
      label: "Sao chép đường dẫn",
      icon: <Link2 className="w-4 h-4" />,
      hidden: !task._id,
      disabled: !task._id,
      onSelect: () => {
        if (!task._id) return;
        if (onCopyLink) {
          onCopyLink();
          return;
        }
        if (typeof window !== "undefined" && navigator.clipboard) {
          const url = `${window.location.origin}/vi/employee/tasks?taskId=${task._id}`;
          navigator.clipboard.writeText(url).catch(() => {
            // Im lặng nếu lỗi copy
          });
        }
      },
    },
    {
      type: "separator",
      id: "sep-danger",
      hidden: !canDelete,
    },
    {
      type: "item",
      id: "delete",
      label: "Xóa công việc",
      icon: <Trash2 className="w-4 h-4" />,
      variant: "destructive",
      hidden: !canDelete,
      disabled: !canDelete,
      onSelect: onDelete,
    },
  ];

  // Ẩn các entry bị đánh dấu hidden để tránh render rỗng
  const visibleItems = items.filter((entry) => !entry.hidden);

  return {
    items: visibleItems,
    canEdit,
    canDelete,
  };
};

