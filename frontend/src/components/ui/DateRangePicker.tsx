import * as React from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { type DateRange, DayPicker } from "react-day-picker";
import * as Popover from "@radix-ui/react-popover";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DateRangePickerProps {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    className?: string;
}

export function DateRangePicker({ date, setDate, className }: DateRangePickerProps) {
    const [open, setOpen] = React.useState(false);

    // Presets configuration
    const presets = [
        {
            label: "Hoy",
            getValue: () => ({ from: new Date(), to: new Date() }),
        },
        {
            label: "Esta Semana",
            getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }),
        },
        {
            label: "Este Mes",
            getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
        },
        {
            label: "Últimos 30 Días",
            getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }),
        },
    ];

    const handlePresetSelect = (preset: { getValue: () => DateRange }) => {
        setDate(preset.getValue());
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger asChild>
                    <button
                        id="date"
                        className={cn(
                            "flex items-center justify-start text-left font-normal transition-all duration-200",
                            "w-full md:w-[300px] rounded-xl border border-gray-200 px-4 py-2.5",
                            "bg-white hover:bg-gray-50 hover:border-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500/20",
                            "shadow-sm hover:shadow",
                            !date && "text-gray-500"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gold-600" />
                        <span className="text-sm text-navy-900 font-medium truncate">
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                                        {format(date.to, "LLL dd, y", { locale: es })}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y", { locale: es })
                                )
                            ) : (
                                <span>Seleccionar fecha</span>
                            )}
                        </span>
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        className="w-auto p-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row font-sans animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-200"
                        align="start"
                        sideOffset={8}
                    >
                        {/* Sidebar Presets */}
                        <div className="flex flex-col gap-1 p-3 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 min-w-[140px]">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Rangos Rápidos</p>
                            {presets.map((preset) => {

                                return (
                                    <button
                                        key={preset.label}
                                        onClick={() => handlePresetSelect(preset)}
                                        className={cn(
                                            "text-xs text-left px-3 py-2 rounded-lg transition-colors font-medium",
                                            "hover:bg-white hover:text-navy-900 hover:shadow-sm",
                                            "text-gray-600"
                                        )}
                                    >
                                        {preset.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Calendar */}
                        <div className="p-3 bg-white">
                            <DayPicker
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={es}
                                showOutsideDays={false}
                                className="p-3"
                                classNames={{
                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                    month: "space-y-4",
                                    caption: "flex justify-center pt-1 relative items-center",
                                    caption_label: "text-sm font-bold text-navy-900 capitalize",
                                    nav: "space-x-1 flex items-center",
                                    nav_button: cn(
                                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-all"
                                    ),
                                    nav_button_previous: "absolute left-1",
                                    nav_button_next: "absolute right-1",
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "flex",
                                    head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem] capitalize",
                                    row: "flex w-full mt-2",
                                    cell: cn(
                                        "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-navy-50",
                                        "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                                    ),
                                    day: cn(
                                        "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md transition-all flex items-center justify-center text-gray-700"
                                    ),
                                    day_selected:
                                        "bg-navy-900 text-white hover:bg-navy-800 hover:text-white focus:bg-navy-900 focus:text-white rounded-md shadow-md",
                                    day_today: "bg-gray-50 text-gold-600 font-bold border border-gold-200",
                                    day_outside: "text-gray-300 opacity-50",
                                    day_disabled: "text-gray-300 opacity-50",
                                    day_range_middle:
                                        "aria-selected:bg-navy-50 aria-selected:text-navy-900 rounded-none",
                                    day_hidden: "invisible",
                                }}
                                components={{
                                    Chevron: ({ orientation }) => {
                                        return orientation === "left" ? (
                                            <ChevronLeft className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        );
                                    },
                                }}
                            />
                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}
