import React, { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

// --- LABEL ---
export const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <label className={`text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1.5 block ${className}`}>
        {children}
    </label>
);

// --- INPUT GROUP ---
export const InputGroup: React.FC<{ label?: string; children: React.ReactNode; className?: string }> = ({
    label,
    children,
    className = ''
}) => (
    <div className={`flex flex-col ${className}`}>
        {label && <Label>{label}</Label>}
        {children}
    </div>
);

// --- INPUT ---
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', error, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border rounded-2xl text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 focus:border-amber-500 w-full shadow-sm hover:shadow-md
        ${error
                        ? 'border-rose-300 focus:ring-rose-500/20 text-rose-900'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-amber-500/20'
                    } ${className}`}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

// --- SELECT ---
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', error, children, ...props }, ref) => {
        return (
            <select
                ref={ref}
                className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border rounded-2xl text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 focus:border-amber-500 w-full shadow-sm hover:shadow-md appearance-none
        ${error
                        ? 'border-rose-300 focus:ring-rose-500/20 text-rose-900'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-amber-500/20'
                    } ${className}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                {...props}
            >
                {children}
            </select>
        );
    }
);
Select.displayName = 'Select';
