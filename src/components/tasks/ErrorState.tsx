"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Đã xảy ra lỗi
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm mb-6">
        {error}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 active:bg-slate-700 dark:active:bg-slate-300 text-white dark:text-slate-900 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Thử lại</span>
        </button>
      )}
    </div>
  );
}
