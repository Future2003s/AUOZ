"use client";

import { memo, useCallback } from "react";
import {
  User,
  CheckCircle2,
  Calendar,
  FileText,
  Tag,
} from "lucide-react";
import { Task } from "@/hooks/useTasks";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Eye, Edit, Copy, Trash2, Clock, CheckCircle } from "lucide-react";

interface TaskCardProps {
  task: Task;
  filterType: "my-tasks" | "assigned-tasks" | "all";
  onTaskClick: (task: Task, e?: React.MouseEvent) => void;
  onToggleStatus: (taskId: number, e?: React.MouseEvent) => void;
  onDelete: (taskId: number) => void;
  onCopy: (task: Task) => void;
  getTagStyle: (tag: string) => string;
  isContextMenuOpenRef: React.MutableRefObject<boolean>;
  isDeleteDialogOpen: boolean;
}

const TaskCard = memo(function TaskCard({
  task,
  filterType,
  onTaskClick,
  onToggleStatus,
  onDelete,
  onCopy,
  getTagStyle,
  isContextMenuOpenRef,
  isDeleteDialogOpen,
}: TaskCardProps) {
  const tagStyle = getTagStyle(task.tag);
  const isDone = task.status === "done";

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!isContextMenuOpenRef.current && !isDeleteDialogOpen) {
        onTaskClick(task, e);
      }
    },
    [task, onTaskClick, isContextMenuOpenRef, isDeleteDialogOpen]
  );

  const handleToggleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onToggleStatus(task.id, e);
    },
    [task.id, onToggleStatus]
  );

  // Calculate deadline status
  const deadlineStatus = task.deadline
    ? (() => {
        const today = new Date();
        const deadlineDate = new Date(task.deadline);
        const daysDiff = Math.ceil(
          (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff < 0) return { color: "text-red-600 dark:text-red-400", iconColor: "text-red-600 dark:text-red-400" };
        if (daysDiff <= 1) return { color: "text-orange-600 dark:text-orange-400", iconColor: "text-orange-600 dark:text-orange-400" };
        return { color: "text-slate-600 dark:text-slate-400", iconColor: "text-slate-500 dark:text-slate-400" };
      })()
    : null;

  return (
    <ContextMenu
      onOpenChange={(open) => {
        isContextMenuOpenRef.current = open;
      }}
    >
      <ContextMenuTrigger asChild>
        <button
          type="button"
          className={`group/task w-full bg-white dark:bg-slate-700/80 border rounded-xl p-3.5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left cursor-pointer backdrop-blur-sm touch-manipulation
            ${
              isDone
                ? "border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 opacity-75"
                : "border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg active:bg-indigo-50 dark:active:bg-indigo-900/20"
            }`}
          onClick={(e) => {
            // Single click to open - no double click needed
            e.stopPropagation();
            if (!isContextMenuOpenRef.current && !isDeleteDialogOpen) {
              onTaskClick(task, e);
            }
          }}
        >
          {/* Header: Tag + Status Toggle */}
          <div className="flex justify-between items-start mb-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${tagStyle} ${
                isDone ? "saturate-0 opacity-70" : ""
              }`}
            >
              {task.tag}
            </span>

            <button
              type="button"
              onClick={handleToggleClick}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-all rounded-full active:scale-90 touch-manipulation ${
                isDone
                  ? "text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  : "text-slate-300 dark:text-slate-600 hover:text-emerald-400 dark:hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              aria-label={isDone ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
            >
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 fill-emerald-50 dark:fill-emerald-900/30" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-current" />
              )}
            </button>
          </div>

          {/* Title */}
          <p
            className={`text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug mb-2 transition-all ${
              isDone ? "line-through text-slate-400 dark:text-slate-500" : ""
            }`}
          >
            {task.title}
          </p>

          {/* Footer: Assignee + Deadline + Notes */}
          <div
            className={`flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-600 ${
              isDone ? "opacity-50" : ""
            }`}
          >
            {/* Assignee */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                <User className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {task.assignee}
              </span>
            </div>

            {/* Deadline */}
            {task.deadline && deadlineStatus && (
              <div className={`flex items-center gap-1.5 ${deadlineStatus.color}`}>
                <Calendar className={`w-3 h-3 ${deadlineStatus.iconColor}`} />
                <span className="text-xs truncate">
                  {new Date(task.deadline).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </div>
            )}

            {/* Progress Notes Indicator */}
            {task.progressNotes && task.progressNotes.trim() && (
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <FileText className="w-3 h-3" />
                <span className="text-xs">Có ghi chú</span>
              </div>
            )}
          </div>
        </button>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-1">
        <ContextMenuItem
          onSelect={(e) => {
            e.preventDefault();
            e.stopPropagation();
            isContextMenuOpenRef.current = false;
            onTaskClick(task, e as any);
          }}
          className="cursor-pointer min-h-[44px] rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
        >
          <Eye className="w-4 h-4 mr-2" />
          Xem chi tiết
        </ContextMenuItem>
        {filterType !== "assigned-tasks" && (
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isContextMenuOpenRef.current = false;
              onTaskClick(task, e as any);
            }}
            className="cursor-pointer min-h-[44px] rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Sửa công việc
          </ContextMenuItem>
        )}
        <ContextMenuSeparator className="my-1" />
        <ContextMenuItem
          onSelect={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            isContextMenuOpenRef.current = false;
            onToggleStatus(task.id);
          }}
          className="cursor-pointer min-h-[44px] rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
        >
          {isDone ? (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Đánh dấu chưa hoàn thành
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Đánh dấu hoàn thành
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={(e) => {
            e.preventDefault();
            e.stopPropagation();
            isContextMenuOpenRef.current = false;
            onCopy(task);
          }}
          className="cursor-pointer min-h-[44px] rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
        >
          <Copy className="w-4 h-4 mr-2" />
          Sao chép thông tin
        </ContextMenuItem>
        {filterType !== "assigned-tasks" && (
          <>
            <ContextMenuSeparator className="my-1" />
            <ContextMenuItem
              onSelect={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isContextMenuOpenRef.current = false;
                onDelete(task.id);
              }}
              variant="destructive"
              className="cursor-pointer min-h-[44px] rounded-lg px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa công việc
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});

export default TaskCard;
