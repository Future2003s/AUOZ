"use client";

import { Search, Filter, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Task } from "@/hooks/useTasks";

interface TasksToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: "all" | "todo" | "pending" | "done";
  onStatusFilterChange: (status: "all" | "todo" | "pending" | "done") => void;
  tagFilter: string;
  onTagFilterChange: (tag: string) => void;
  tasks: Task[];
}

export default function TasksToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  tasks,
}: TasksToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Get unique tags from tasks
  const uniqueTags = useMemo(() => {
    const tags = new Set(tasks.map((task) => task.tag).filter(Boolean));
    return Array.from(tags).sort();
  }, [tasks]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (tagFilter) count++;
    if (searchQuery) count++;
    return count;
  }, [statusFilter, tagFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm công việc..."
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 rounded-lg transition-all active:scale-90 touch-manipulation"
            aria-label="Xóa tìm kiếm"
          >
            <X className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700 transition-all active:scale-95 touch-manipulation"
        >
          <Filter className="w-4 h-4" />
          <span>Bộ lọc</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold text-white bg-indigo-500 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Clear All Filters */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onStatusFilterChange("all");
              onTagFilterChange("");
            }}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 rounded-lg transition-all active:scale-95 touch-manipulation"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Trạng thái
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Tất cả" },
                { value: "todo", label: "Chưa làm" },
                { value: "pending", label: "Đang làm" },
                { value: "done", label: "Hoàn thành" },
              ].map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => onStatusFilterChange(option.value as any)}
                  className={`min-h-[40px] px-4 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 touch-manipulation ${
                    statusFilter === option.value
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30 active:bg-indigo-600"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filter */}
          {uniqueTags.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Loại việc
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onTagFilterChange("")}
                  className={`min-h-[40px] px-4 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 touch-manipulation ${
                    !tagFilter
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30 active:bg-indigo-600"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500"
                  }`}
                >
                  Tất cả
                </button>
                {uniqueTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => onTagFilterChange(tag)}
                    className={`min-h-[40px] px-4 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 touch-manipulation ${
                      tagFilter === tag
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30 active:bg-indigo-600"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
