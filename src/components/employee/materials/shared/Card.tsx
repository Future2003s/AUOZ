import React from 'react';

export interface CardProps {
    title?: React.ReactNode;
    badge?: React.ReactNode;
    badgeColor?: string;
    sideContent?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({
    title,
    badge,
    badgeColor,
    sideContent,
    children,
    className = ''
}) => {
    return (
        <div className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/50 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-3xl mb-6 overflow-hidden flex flex-col ${className}`}>
            {title && (
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        {title}
                        {badge && (
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${badgeColor}`}>
                                {badge}
                            </span>
                        )}
                    </div>
                    {sideContent}
                </div>
            )}
            <div className="p-5 flex-1">
                {children}
            </div>
        </div>
    );
};
