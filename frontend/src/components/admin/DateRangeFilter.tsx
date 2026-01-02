import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { type DateRange, DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { useState, useEffect, useRef } from 'react';

interface DateRangeFilterProps {
    dateRange: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
    activePreset: string;
    onPresetChange: (preset: string) => void;
}

export const DateRangeFilter = ({ dateRange, onChange, activePreset, onPresetChange }: DateRangeFilterProps) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const presets = [
        {
            id: 'today',
            label: 'Hoy',
            getValue: () => ({ from: new Date(), to: new Date() })
        },
        {
            id: '7days',
            label: '7 Días',
            getValue: () => ({ from: subDays(new Date(), 7), to: new Date() })
        },
        {
            id: 'month',
            label: 'Este Mes',
            getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
        }
    ];

    const handlePresetClick = (presetId: string, getValue: () => DateRange) => {
        onPresetChange(presetId);
        onChange(getValue());
        setIsPopoverOpen(false);
    };

    const handleRangeSelect = (range: DateRange | undefined) => {
        onChange(range);
        onPresetChange('custom');
    };

    // Outside click handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsPopoverOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    return (
        <div className="flex bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-gray-100 dark:border-navy-700 p-1" ref={containerRef}>
            {/* Presets */}
            <div className="flex">
                {presets.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => handlePresetClick(preset.id, preset.getValue)}
                        className={`
                            px-4 py-2 text-sm font-bold rounded-lg transition-all
                            ${activePreset === preset.id 
                                ? 'bg-navy-900 text-gold-500 shadow-md' 
                                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-navy-700 dark:text-gray-400'
                            }
                        `}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="w-px bg-gray-200 dark:bg-navy-700 mx-2 my-1" />

            {/* Custom Trigger */}
            <div className="relative">
                <button
                    onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                        ${activePreset === 'custom' 
                            ? 'bg-navy-900 text-gold-500 shadow-md' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700'
                        }
                    `}
                >
                    <CalendarIcon size={16} />
                    <span>
                        {dateRange?.from ? (
                            dateRange.to ? (
                                `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                            ) : (
                                format(dateRange.from, 'MMM dd')
                            )
                        ) : (
                            'Seleccionar'
                        )}
                    </span>
                </button>

                {/* Popover */}
                {isPopoverOpen && (
                    <div 
                        className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-gray-100 dark:border-navy-600 p-4 animate-in fade-in zoom-in-95 duration-200"
                        style={{ width: 'max-content' }}
                    >
                         <DayPicker
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={handleRangeSelect}
                            numberOfMonths={2}
                            locale={es}
                            showOutsideDays={false}
                            className="p-1"
                            classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center mb-2",
                                caption_label: "text-sm font-bold text-navy-900 dark:text-white capitalize",
                                nav: "space-x-1 flex items-center bg-gray-50 dark:bg-navy-700 rounded-lg p-1",
                                nav_button: "h-7 w-7 bg-transparent hover:bg-white dark:hover:bg-navy-600 rounded-md flex items-center justify-center transition-all text-gray-500 shadow-sm",
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-gray-400 dark:text-gray-500 rounded-md w-9 font-normal text-[0.8rem] capitalize uppercase",
                                row: "flex w-full mt-2",
                                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-navy-50/50 dark:[&:has([aria-selected])]:bg-navy-900/30 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-md transition-all text-navy-900 dark:text-gray-200",
                                day_range_start: "day-range-start",
                                day_range_end: "day-range-end",
                                day_selected: "bg-navy-900 text-gold-500 hover:bg-navy-800 dark:bg-gold-500 dark:text-navy-900 hover:text-white dark:hover:text-navy-900 shadow-md font-bold",
                                day_today: "text-gold-600 font-bold bg-gray-50 border border-gray-200 dark:bg-navy-700 dark:border-navy-600 dark:text-white",
                                day_outside: "text-gray-300 opacity-50 dark:text-gray-600",
                                day_disabled: "text-gray-300 opacity-50 dark:text-gray-600",
                                day_range_middle: "aria-selected:bg-navy-50 aria-selected:text-navy-900 dark:aria-selected:bg-navy-900/50 dark:aria-selected:text-gray-200",
                                day_hidden: "invisible",
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
