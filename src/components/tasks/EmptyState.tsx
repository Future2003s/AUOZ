"use client";

import { Calendar, Plus } from "lucide-react";

interface EmptyStateProps {
  onCreateTask?: () => void;
  filterType?: "my-tasks" | "assigned-tasks" | "all";
}

export default function EmptyState({ onCreateTask, filterType }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Calendar className="w-10 h-10 text-slate-400 dark:text-slate-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Chưa có công việc nào
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm mb-6">
        {filterType === "assigned-tasks"
          ? "Bạn chưa có công việc nào được giao trong tháng này."
          : "Bắt đầu bằng cách tạo công việc mới cho tháng này."}
      </p>
      {filterType !== "assigned-tasks" && onCreateTask && (
        <button
          type="button"
          onClick={onCreateTask}
          className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 active:bg-indigo-700 dark:active:bg-indigo-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo công việc mới</span>
        </button>
      )}
    </div>
  );
}
