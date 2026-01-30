"use client";

import { useOffline } from '@/hooks/useOffline';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  const { online } = useOffline();
  const router = useRouter();

  const handleRetry = () => {
    if (online) {
      router.refresh();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Không có kết nối mạng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-slate-600 dark:text-slate-400">
            Bạn đang offline. Vui lòng kiểm tra kết nối mạng và thử lại.
          </p>

          <div className="space-y-2">
            <Button
              onClick={handleRetry}
              className="w-full"
              disabled={!online}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {online ? 'Tải lại' : 'Đang thử lại...'}
            </Button>

            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Về trang chủ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
