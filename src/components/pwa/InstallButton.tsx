"use client";

import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2 } from 'lucide-react';

interface InstallButtonProps {
  className?: string;
  size?: 'sm' | 'lg' | 'default' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

export function InstallButton({ 
  className = '', 
  size = 'default',
  variant = 'default' 
}: InstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = useInstallPrompt();

  if (isInstalled) {
    return (
      <Button
        size={size}
        variant="outline"
        className={`${className} bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 cursor-default`}
        disabled
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Đã cài đặt
      </Button>
    );
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      // Show iOS instructions
      alert(
        'Để cài đặt ứng dụng trên iOS:\n\n' +
        '1. Nhấn nút Share (⬆︎) ở thanh dưới cùng\n' +
        '2. Chọn "Thêm vào Màn hình chính"\n' +
        '3. Nhấn "Thêm" để hoàn tất'
      );
      return;
    }

    await install();
  };

  return (
    <Button
      onClick={handleInstall}
      size={size}
      variant={variant}
      className={className}
      disabled={!isInstallable && !isIOS}
    >
      <Download className="w-4 h-4 mr-2" />
      {isIOS ? 'Hướng dẫn cài đặt' : 'Cài đặt App'}
    </Button>
  );
}
