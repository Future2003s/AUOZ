"use client";

import { memo, useCallback, useState, useMemo } from "react";
import { User, CheckCircle2, Calendar, FileText, MoreVertical } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useTaskContextMenu } from "@/hooks/useTaskContextMenu";

interface TaskCardProps {
  task: Task;
  filterType: "my-tasks" | "assigned-tasks" | "all";
  currentUserId?: string;
  isAdmin?: boolean;
  onTaskClick: (task: Task, e?: React.MouseEvent) => void;
  onEditTask: (task: Task) => void;
  // Context menu handlers - dùng activeTaskId
  onViewDetailFromContextMenu?: () => void;
  onEditFromContextMenu?: () => void;
  onToggleStatusFromContextMenu?: () => void;
  onDeleteFromContextMenu?: () => void;
  onCopyInfoFromContextMenu?: () => void;
  onCopyIdFromContextMenu?: () => void;
  onCopyLinkFromContextMenu?: () => void;
  onDuplicateFromContextMenu?: () => void;
  // Legacy handlers (cho backward compatibility)
  onToggleStatus: (taskId: number, e?: React.MouseEvent) => void;
  onDelete: (taskId: number) => void;
  onCopy: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  getTagStyle: (tag: string) => string;
  isContextMenuOpenRef: React.MutableRefObject<boolean>;
  isDeleteDialogOpen: boolean;
  onContextMenuOpen?: (taskId: number) => void;
  onContextMenuClose?: () => void;
}

// Custom comparison function để tối ưu re-renders
const areEqual = (prevProps: TaskCardProps, nextProps: TaskCardProps) => {
  // So sánh task (chỉ so sánh các field quan trọng ảnh hưởng đến render)
  const prevTask = prevProps.task;
  const nextTask = nextProps.task;
  
  if (prevTask.id !== nextTask.id) return false;
  if (prevTask._id !== nextTask._id) return false;
  if (prevTask.status !== nextTask.status) return false;
  if (prevTask.title !== nextTask.title) return false;
  if (prevTask.date !== nextTask.date) return false;
  if (prevTask.tag !== nextTask.tag) return false;
  if (prevTask.assignee !== nextTask.assignee) return false;
  if (prevTask.deadline !== nextTask.deadline) return false;
  
  // So sánh các props khác
  if (prevProps.filterType !== nextProps.filterType) return false;
  if (prevProps.isDeleteDialogOpen !== nextProps.isDeleteDialogOpen) return false;
  if (prevProps.currentUserId !== nextProps.currentUserId) return false;
  if (prevProps.isAdmin !== nextProps.isAdmin) return false;
  
  // Handlers được memoize nên không cần so sánh
  // Ref không cần so sánh vì nó là stable reference
  
  return true;
};

const TaskCard = memo(function TaskCard({
  task,
  filterType,
  currentUserId,
  isAdmin,
  onTaskClick,
  onEditTask,
  // Context menu handlers
  onViewDetailFromContextMenu,
  onEditFromContextMenu,
  onToggleStatusFromContextMenu,
  onDeleteFromContextMenu,
  onCopyInfoFromContextMenu,
  onCopyIdFromContextMenu,
  onCopyLinkFromContextMenu,
  onDuplicateFromContextMenu,
  // Legacy handlers
  onToggleStatus,
  onDelete,
  onCopy,
  onDuplicate,
  getTagStyle,
  isContextMenuOpenRef,
  isDeleteDialogOpen,
  onContextMenuOpen,
  onContextMenuClose,
}: TaskCardProps) {
  const tagStyle = getTagStyle(task.tag);
  const isDone = task.status === "done";
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

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
        if (daysDiff < 0)
          return {
            color: "text-red-600 dark:text-red-400",
            iconColor: "text-red-600 dark:text-red-400",
          };
        if (daysDiff <= 1)
          return {
            color: "text-orange-600 dark:text-orange-400",
            iconColor: "text-orange-600 dark:text-orange-400",
          };
        return {
          color: "text-slate-600 dark:text-slate-400",
          iconColor: "text-slate-500 dark:text-slate-400",
        };
      })()
    : null;

  // Memoize context menu handlers để tránh re-render không cần thiết
  const contextMenuHandlers = useMemo(() => ({
    onViewDetail: onViewDetailFromContextMenu || (() => onTaskClick(task)),
    onEditTask: onEditFromContextMenu || (() => onEditTask(task)),
    onToggleStatus: onToggleStatusFromContextMenu || (() => onToggleStatus(task.id)),
    onDelete: onDeleteFromContextMenu || (() => onDelete(task.id)),
    onCopyInfo: onCopyInfoFromContextMenu || (() => onCopy(task)),
    onCopyId: onCopyIdFromContextMenu,
    onCopyLink: onCopyLinkFromContextMenu,
    onDuplicate: onDuplicateFromContextMenu || (onDuplicate ? () => onDuplicate(task) : undefined),
  }), [
    onViewDetailFromContextMenu,
    onEditFromContextMenu,
    onToggleStatusFromContextMenu,
    onDeleteFromContextMenu,
    onCopyInfoFromContextMenu,
    onCopyIdFromContextMenu,
    onCopyLinkFromContextMenu,
    onDuplicateFromContextMenu,
    onTaskClick,
    onEditTask,
    onToggleStatus,
    onDelete,
    onCopy,
    onDuplicate,
    task.id,
    task,
  ]);

  const { items } = useTaskContextMenu({
    task,
    filterType,
    currentUserId,
    isAdmin,
    ...contextMenuHandlers,
  });

  return (
      <ContextMenu
      open={isContextMenuOpen}
      onOpenChange={(open) => {
        setIsContextMenuOpen(open);
        isContextMenuOpenRef.current = open;
        
        // Set activeTaskId khi menu mở
        if (open) {
          onContextMenuOpen?.(task.id);
        } else {
          // Reset khi đóng
          onContextMenuClose?.();
        }
      }}
    >
      <ContextMenuTrigger asChild>
        <button
          type="button"
          className={`group/task w-full bg-white dark:bg-slate-700/80 border rounded-xl p-3.5 shadow-sm hover:shadow-md active:scale-[0.98] transition-[shadow,transform] text-left cursor-pointer backdrop-blur-sm touch-manipulation
            ${
              isDone
                ? "border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 opacity-75"
                : "border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg active:bg-indigo-50 dark:active:bg-indigo-900/20"
            }`}
          onClick={(e) => {
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

            <div className="flex items-center gap-1">
              {/* Mobile action menu button (tap) */}
              <button
                type="button"
                className="inline-flex sm:hidden min-w-[32px] min-h-[32px] items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 active:scale-95 transition-colors touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  // Mở context menu cho mobile
                  isContextMenuOpenRef.current = true;
                  setIsContextMenuOpen(true);
                }}
                aria-label="Mở menu thao tác"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Status toggle */}
              <button
                type="button"
                onClick={handleToggleClick}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors rounded-full active:scale-90 touch-manipulation ${
                  isDone
                    ? "text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    : "text-slate-300 dark:text-slate-600 hover:text-emerald-400 dark:hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                aria-label={
                  isDone ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"
                }
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 fill-emerald-50 dark:fill-emerald-900/30" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-current" />
                )}
              </button>
            </div>
          </div>

          {/* Title */}
          <p
            className={`text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug mb-2 ${
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
        {items.map((entry) => {
          if (entry.type === "separator") {
            return (
              <ContextMenuSeparator key={entry.id} className="my-1" />
            );
          }

          return (
            <ContextMenuItem
              key={entry.id}
              variant={entry.variant}
              disabled={entry.disabled}
              onSelect={(e) => {
                // Radix UI sẽ tự đóng menu sau khi onSelect hoàn thành
                // Chúng ta chỉ cần chạy handler
                if (!entry.onSelect) return;
                
                try {
                  const result = entry.onSelect();
                  // Nếu handler là async, không cần await - để nó chạy background
                  // Radix sẽ đóng menu ngay lập tức
                  if (result instanceof Promise) {
                    result.catch((error) => {
                      console.error(`Error executing context menu action "${entry.label}":`, error);
                    });
                  }
                } catch (error) {
                  console.error(`Error executing context menu action "${entry.label}":`, error);
                }
              }}
              className="cursor-pointer min-h-[44px] rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
            >
              {entry.icon && <span className="mr-2">{entry.icon}</span>}
              {entry.label}
            </ContextMenuItem>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}, areEqual);

export default TaskCard;
