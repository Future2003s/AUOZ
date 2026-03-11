import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface AlertBadgeProps {
    show?: boolean;
    msg: string;
    type?: 'ok' | 'err';
    className?: string;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({
    show = true,
    msg,
    type = 'ok',
    className = ''
}) => {
    if (!show || !msg) return null;

    const isOk = type === 'ok';
    const Icon = isOk ? CheckCircle2 : AlertCircle;

    return (
        <div className={`p-4 rounded-xl text-sm font-medium mb-4 flex items-center gap-3 shadow-sm border animate-in slide-in-from-top-2 fade-in duration-300
      ${isOk
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800'
                : 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800'
            } ${className}`}>
            <Icon className="w-5 h-5 shrink-0" />
            <p>{msg}</p>
        </div>
    );
};
