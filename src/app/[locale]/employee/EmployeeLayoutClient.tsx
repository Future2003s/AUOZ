'use client';

import { ReactNode } from 'react';
import { EmployeeMobileNavbar } from '@/components/employee/employee-mobile-navbar';
import { InstallPrompt } from '@/components/employee/InstallPrompt';

interface EmployeeLayoutClientProps {
  children: ReactNode;
}

export default function EmployeeLayoutClient({ children }: EmployeeLayoutClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <EmployeeMobileNavbar />
      <div className="container mx-auto px-4 pb-24 lg:pb-28">
        {children}
      </div>
      <InstallPrompt />
    </div>
  );
}

