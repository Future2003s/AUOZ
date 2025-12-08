'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { type DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DateRangePickerProps {
  value?: { from?: string; to?: string }; // { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
  onChange?: (value: { from?: string; to?: string }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: string; // YYYY-MM-DD format
  max?: string; // YYYY-MM-DD format
  label?: string;
  required?: boolean;
}

const DateRangePicker = React.forwardRef<HTMLButtonElement, DateRangePickerProps>(
  ({ value, onChange, placeholder = 'Chọn khoảng ngày', className, disabled, min, max, label, required, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
      value?.from || value?.to
        ? {
            from: value.from ? new Date(value.from) : undefined,
            to: value.to ? new Date(value.to) : undefined,
          }
        : undefined
    );

    // Check if mobile on mount and resize
    React.useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 640);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Update dateRange when value prop changes
    React.useEffect(() => {
      if (value?.from || value?.to) {
        setDateRange({
          from: value.from ? new Date(value.from) : undefined,
          to: value.to ? new Date(value.to) : undefined,
        });
      } else {
        setDateRange(undefined);
      }
    }, [value]);

    const handleSelect = (range: DateRange | undefined) => {
      setDateRange(range);
    };

    const handleApply = () => {
      if (dateRange?.from && dateRange?.to) {
        const formattedRange = {
          from: format(dateRange.from, 'yyyy-MM-dd'),
          to: format(dateRange.to, 'yyyy-MM-dd'),
        };
        onChange?.(formattedRange);
        setOpen(false);
      }
    };

    const handleCancel = () => {
      // Reset to original value
      if (value?.from || value?.to) {
        setDateRange({
          from: value.from ? new Date(value.from) : undefined,
          to: value.to ? new Date(value.to) : undefined,
        });
      } else {
        setDateRange(undefined);
      }
      setOpen(false);
    };

    const displayValue = React.useMemo(() => {
      if (dateRange?.from && dateRange?.to) {
        return `${format(dateRange.from, 'dd/MM/yyyy', { locale: vi })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: vi })}`;
      } else if (dateRange?.from) {
        return `Từ ${format(dateRange.from, 'dd/MM/yyyy', { locale: vi })}`;
      }
      return '';
    }, [dateRange]);

    const minDate = min ? new Date(min) : undefined;
    const maxDate = max ? new Date(max) : undefined;

    // Disable dates outside range
    const disabledDays = React.useMemo(() => {
      const disabled: Array<Date | { from: Date; to: Date }> = [];
      
      if (minDate) {
        const beforeMin = new Date(minDate);
        beforeMin.setDate(beforeMin.getDate() - 1);
        disabled.push({ from: new Date(0), to: beforeMin });
      }
      
      if (maxDate) {
        const afterMax = new Date(maxDate);
        afterMax.setDate(afterMax.getDate() + 1);
        disabled.push({ from: afterMax, to: new Date(8640000000000000) });
      }
      
      return disabled.length > 0 ? disabled : undefined;
    }, [minDate, maxDate]);

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setDateRange(undefined);
      onChange?.({ from: undefined, to: undefined });
    };

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => !disabled && setOpen(true)}
            className={cn(
              'w-full justify-start text-left font-normal',
              'h-9 sm:h-10 px-3 sm:px-4',
              !dateRange && 'text-muted-foreground',
              'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600',
              'hover:bg-slate-50 dark:hover:bg-slate-700',
              'focus-visible:ring-2 focus-visible:ring-indigo-500',
              'active:scale-[0.98] transition-transform',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            ref={ref as any}
            {...props}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className={cn(
              'flex-1 text-left truncate text-sm sm:text-base',
              !displayValue && 'text-slate-400 dark:text-slate-500'
            )}>
              {displayValue || placeholder}
            </span>
            {dateRange && (dateRange.from || dateRange.to) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-5 w-5 p-0 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full ml-2 shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className={cn(
              'w-[calc(100vw-1rem)] max-w-lg sm:max-w-2xl p-0',
              'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
              'max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl',
              'fixed left-2 right-2 top-4 bottom-4 sm:left-[50%] sm:right-auto sm:top-[50%] sm:bottom-auto',
              'sm:translate-x-[-50%] sm:translate-y-[-50%]',
              'flex flex-col'
            )}>
              <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <DialogTitle className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
                  Chọn Khoảng Ngày
                </DialogTitle>
              </DialogHeader>
              <div className="p-2 sm:p-4 flex-1 overflow-y-auto">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleSelect}
                  disabled={disabledDays}
                  locale={vi}
                  numberOfMonths={isMobile ? 1 : 2}
                  className="rounded-lg border shadow-sm"
                  formatters={{
                    formatCaption: (date: Date) => format(date, 'MMMM yyyy', { locale: vi }),
                    formatWeekdayName: (date: Date) => {
                      const dayIndex = date.getDay();
                      const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                      return weekdays[dayIndex];
                    },
                  } as any}
                />
              </div>
              {min || max ? (
                <div className="px-3 sm:px-4 pb-2 sm:pb-3 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left break-words flex-shrink-0">
                  {min && max && (
                    <span>Khoảng: {format(new Date(min), 'dd/MM/yyyy', { locale: vi })} - {format(new Date(max), 'dd/MM/yyyy', { locale: vi })}</span>
                  )}
                  {min && !max && (
                    <span>Từ: {format(new Date(min), 'dd/MM/yyyy', { locale: vi })}</span>
                  )}
                  {!min && max && (
                    <span>Đến: {format(new Date(max), 'dd/MM/yyyy', { locale: vi })}</span>
                  )}
                </div>
              ) : null}
              {dateRange?.from && !dateRange?.to && (
                <div className="px-4 pb-2 sm:pb-3 text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 text-center font-medium flex-shrink-0">
                  Chọn ngày kết thúc
                </div>
              )}
              <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 sm:pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={handleApply}
                  disabled={!dateRange?.from || !dateRange?.to}
                  className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Áp dụng
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }
);

DateRangePicker.displayName = 'DateRangePicker';

export { DateRangePicker };

