'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: string; // YYYY-MM-DD format
  max?: string; // YYYY-MM-DD format
  label?: string;
  required?: boolean;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, placeholder = 'Chọn ngày', className, disabled, min, max, label, required, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
      value ? new Date(value) : undefined
    );

    // Update selectedDate when value prop changes
    React.useEffect(() => {
      if (value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      } else {
        setSelectedDate(undefined);
      }
    }, [value]);

    const handleSelect = (date: Date | undefined) => {
      if (date) {
        setSelectedDate(date);
        const formattedDate = format(date, 'yyyy-MM-dd');
        onChange?.(formattedDate);
        setOpen(false);
      }
    };

    const displayValue = selectedDate
      ? format(selectedDate, 'dd/MM/yyyy', { locale: vi })
      : '';

    const today = new Date();
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

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
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
              'h-9 sm:h-10 px-2.5 sm:px-3 md:px-4',
              'text-xs sm:text-sm md:text-base',
              !selectedDate && 'text-muted-foreground',
              'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600',
              'hover:bg-slate-50 dark:hover:bg-slate-700',
              'focus-visible:ring-2 focus-visible:ring-indigo-500',
              'active:scale-[0.98] transition-transform touch-manipulation',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            ref={ref as any}
            {...props}
          >
            <CalendarIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className={cn(
              'flex-1 text-left truncate',
              !displayValue && 'text-slate-400 dark:text-slate-500'
            )}>
              {displayValue || placeholder}
            </span>
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className={cn(
              'w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-none sm:max-w-md p-0',
              'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
              'max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-lg sm:rounded-xl shadow-2xl',
              '!left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2',
              '!mx-0 !my-0'
            )}>
              <DialogHeader className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-slate-200 dark:border-slate-700 text-center sm:text-left">
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Chọn Ngày
                </DialogTitle>
              </DialogHeader>
              <div className="p-2 sm:p-3 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelect}
                  disabled={disabledDays}
                  locale={vi}
                  initialFocus
                  className="rounded-md border-0"
                  formatters={{
                    formatCaption: (date: Date) => format(date, 'MMMM yyyy', { locale: vi }),
                    formatWeekdayName: (date: Date) => {
                      // Get weekday index (0 = Sunday, 1 = Monday, etc.)
                      const dayIndex = date.getDay();
                      // Vietnamese weekday abbreviations
                      const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                      return weekdays[dayIndex];
                    },
                  } as any}
                  classNames={{
                    months: 'flex flex-col space-y-3 sm:space-y-4',
                    month: 'space-y-2 sm:space-y-3 md:space-y-4 w-full min-w-[280px]',
                    caption: 'flex justify-center pt-1 relative items-center mb-2 sm:mb-3 px-1 sm:px-2',
                    caption_label: 'text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-white capitalize',
                    nav: 'space-x-1 flex items-center',
                    nav_button: cn(
                      'h-7 w-7 sm:h-8 sm:w-8 bg-transparent p-0 opacity-70 hover:opacity-100',
                      'border border-slate-300 dark:border-slate-600 rounded-lg',
                      'hover:bg-slate-100 dark:hover:bg-slate-700 transition-all',
                      'active:scale-95 touch-manipulation',
                      'flex items-center justify-center'
                    ),
                    nav_button_previous: 'absolute left-1 sm:left-2 md:left-3',
                    nav_button_next: 'absolute right-1 sm:right-2 md:right-3',
                    table: 'w-full border-collapse',
                    head_row: 'flex mb-0.5 sm:mb-1',
                    head_cell: cn(
                      'text-slate-600 dark:text-slate-400 font-semibold',
                      'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10',
                      'text-[10px] xs:text-xs sm:text-sm',
                      'flex items-center justify-center',
                      'first:rounded-l-md last:rounded-r-md',
                      'uppercase tracking-wide'
                    ),
                    row: 'flex w-full mt-0.5 sm:mt-1',
                    cell: cn(
                      'h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10',
                      'text-center text-xs sm:text-sm md:text-base p-0 relative',
                      '[&:has([aria-selected].day-range-end)]:rounded-r-md',
                      '[&:has([aria-selected].day-outside)]:bg-slate-50 dark:bg-slate-800/50',
                      '[&:has([aria-selected])]:bg-slate-100 dark:bg-slate-800',
                      'first:[&:has([aria-selected])]:rounded-l-md',
                      'last:[&:has([aria-selected])]:rounded-r-md',
                      'focus-within:relative focus-within:z-20'
                    ),
                    day: cn(
                      'h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10',
                      'p-0 font-normal aria-selected:opacity-100',
                      'hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md',
                      'transition-all duration-200 cursor-pointer',
                      'flex items-center justify-center',
                      'touch-manipulation active:scale-95',
                      'text-xs sm:text-sm md:text-base',
                      'text-slate-900 dark:text-slate-100'
                    ),
                    day_selected: 'bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white focus:bg-indigo-600 focus:text-white rounded-md shadow-lg font-semibold',
                    day_today: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100 font-bold border-2 border-indigo-300 dark:border-indigo-700',
                    day_outside: 'text-slate-400 dark:text-slate-500 opacity-60',
                    day_disabled: 'text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed hover:bg-transparent active:scale-100',
                    day_range_middle: 'aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-100',
                    day_hidden: 'invisible',
                  }}
                  components={{
                    IconLeft: ({ ...props }: any) => <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" {...props} />,
                    IconRight: ({ ...props }: any) => <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" {...props} />,
                  } as any}
                />
              </div>
              {min || max ? (
                <div className="px-2 sm:px-3 pb-2 sm:pb-3 text-[10px] xs:text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left break-words">
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
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };

