"use client";

import { useServiceWorker } from '@/hooks/useServiceWorker';
import { Button } from '@/components/ui/button';
import { X, RefreshCw, Download } from 'lucide-react';
import { useState } from 'react';

export function UpdateBanner() {
  const { hasUpdate, isUpdating, update } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);

  if (!hasUpdate || dismissed || isUpdating) {
    return null;
  }

  const handleUpdate = async () => {
    await update();
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Auto show lại sau 1 giờ
    setTimeout(() => setDismissed(false), 60 * 60 * 1000);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 dark:bg-blue-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Download className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Có bản cập nhật mới</p>
            <p className="text-xs opacity-90">
              Nhấn để tải lại và sử dụng phiên bản mới nhất
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleUpdate}
            size="sm"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-blue-50 dark:text-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Cập nhật
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
