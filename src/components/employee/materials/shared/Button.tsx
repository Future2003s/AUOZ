import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'gold' | 'honey' | 'green' | 'red' | 'blue' | 'ghost' | 'outline';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'gold',
    size = 'md',
    className = '',
    isLoading,
    children,
    disabled,
    ...props
}) => {
    const base = "font-semibold transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2";

    const sizes = {
        xs: "px-2.5 py-1.5 text-xs rounded-md",
        sm: "px-3.5 py-2 text-sm rounded-lg",
        md: "px-4.5 py-2.5 text-sm rounded-xl",
        lg: "px-6 py-3 text-base rounded-2xl"
    };

    const variants = {
        gold: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5 focus:ring-amber-500",
        honey: "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 focus:ring-orange-500",
        green: "bg-emerald-50/70 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-500 backdrop-blur-sm",
        red: "bg-rose-50/70 text-rose-700 border border-rose-200 hover:bg-rose-100 focus:ring-rose-500 backdrop-blur-sm",
        blue: "bg-indigo-50/70 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 focus:ring-indigo-500 backdrop-blur-sm",
        ghost: "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 focus:ring-slate-500 backdrop-blur-sm",
        outline: "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-300/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 shadow-sm hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-500 focus:ring-amber-500"
    };

    const isDisabled = disabled || isLoading;

    return (
        <button
            className={`${base} ${sizes[size]} ${variants[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
            disabled={isDisabled}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 text-current animate-spin" />}
            {children}
        </button>
    );
};
