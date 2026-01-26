"use client";

import { X, Calendar, User, Tag, FileText, Clock, CheckCircle2, AlertCircle, Edit, Trash2 } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface TaskDetailViewProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  filterType?: "my-tasks" | "assigned-tasks" | "all";
}

export default function TaskDetailView({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  filterType,
}: TaskDetailViewProps) {
  if (!isOpen || !task) return null;

  // Format date helper function
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE, dd MMMM yyyy", { locale: vi });
    } catch {
      // Fallback nếu date-fns không có locale vi hoặc lỗi
      const d = new Date(dateString);
      const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      const months = [
        "Tháng Một", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu",
        "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Mười Hai"
      ];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  };

  const isDone = task.status === "done";
  const statusLabels = {
    todo: "Chưa làm",
    pending: "Đang làm",
    done: "Hoàn thành",
  };

  const statusColors = {
    todo: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
    pending: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    done: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  };

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
            bgColor: "bg-red-50 dark:bg-red-900/20",
            borderColor: "border-red-200 dark:border-red-800",
            label: `Quá hạn ${Math.abs(daysDiff)} ngày`,
            icon: AlertCircle,
          };
        if (daysDiff <= 1)
          return {
            color: "text-orange-600 dark:text-orange-400",
            bgColor: "bg-orange-50 dark:bg-orange-900/20",
            borderColor: "border-orange-200 dark:border-orange-800",
            label: `Còn ${daysDiff} ngày`,
            icon: AlertCircle,
          };
        return {
          color: "text-slate-600 dark:text-slate-400",
          bgColor: "bg-slate-50 dark:bg-slate-800",
          borderColor: "border-slate-200 dark:border-slate-700",
          label: `Còn ${daysDiff} ngày`,
          icon: Calendar,
        };
      })()
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Detail View - Full screen on mobile, sidebar on desktop */}
      <div className="fixed inset-0 lg:inset-y-0 lg:right-0 lg:w-full lg:max-w-2xl bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDone
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-indigo-100 dark:bg-indigo-900/30"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Chi tiết công việc
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Thông tin đầy đủ về công việc
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 rounded-lg transition-all active:scale-90 touch-manipulation"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <h1
              className={`text-2xl font-bold text-slate-900 dark:text-white mb-2 ${
                isDone ? "line-through opacity-60" : ""
              }`}
            >
              {task.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${statusColors[task.status]}`}
              >
                {statusLabels[task.status]}
              </span>
              {task.tag && (
                <span className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {task.tag}
                </span>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Ngày thực hiện
                  </p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {formatDate(task.date)}
                  </p>
                </div>
              </div>
            </div>

            {/* Assignee */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Người phụ trách
                  </p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {task.assignee}
                  </p>
                </div>
              </div>
            </div>

            {/* Deadline */}
            {task.deadline && deadlineStatus && (
              <div
                className={`p-4 rounded-xl border ${
                  deadlineStatus.bgColor
                } ${deadlineStatus.borderColor} ${
                  task.deadline ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      deadlineStatus.bgColor
                    }`}
                  >
                    <deadlineStatus.icon
                      className={`w-5 h-5 ${deadlineStatus.color}`}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Thời hạn
                    </p>
                    <p className={`text-base font-semibold ${deadlineStatus.color}`}>
                      {formatDate(task.deadline)}
                    </p>
                    <p className={`text-sm mt-1 ${deadlineStatus.color}`}>
                      {deadlineStatus.label}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Mô tả công việc
                </h3>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </div>
          )}

          {/* Progress Notes */}
          {task.progressNotes && task.progressNotes.trim() && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Ghi chú tiến độ
                </h3>
              </div>
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {task.progressNotes}
                </p>
              </div>
            </div>
          )}

          {/* Empty State for Description and Notes */}
          {!task.description && !task.progressNotes && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chưa có mô tả hoặc ghi chú</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {filterType !== "assigned-tasks" && (onEdit || onDelete) && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="min-h-[44px] flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 active:bg-indigo-700 dark:active:bg-indigo-800 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 touch-manipulation"
              >
                <Edit className="w-4 h-4" />
                <span>Sửa công việc</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 active:bg-rose-100 dark:active:bg-rose-900/50 rounded-xl transition-all active:scale-95 touch-manipulation"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
