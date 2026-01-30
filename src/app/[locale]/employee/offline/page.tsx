"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Home } from 'lucide-react';

export default function EmployeeOfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Không thể tải trang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-slate-600 dark:text-slate-400">
            Vui lòng kiểm tra kết nối mạng và thử lại.
          </p>

          <div className="space-y-2">
            <Button
              onClick={handleRetry}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tải lại
            </Button>

            <Button
              onClick={() => router.push('/vi/employee')}
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
