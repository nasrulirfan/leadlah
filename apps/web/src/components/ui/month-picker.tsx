"use client";

import * as React from "react";
import { format, setMonth, setYear } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface MonthPickerProps {
    value?: string; // Format: YYYY-MM
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    showClearButton?: boolean;
}

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Parse YYYY-MM format
function parseMonth(value: string): { year: number; month: number } | undefined {
    if (!value) return undefined;
    const [yearStr, monthStr] = value.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (isNaN(year) || isNaN(month)) return undefined;
    return { year, month: month - 1 }; // month is 0-indexed
}

// Format to YYYY-MM
function formatMonthValue(year: number, month: number): string {
    return `${year}-${(month + 1).toString().padStart(2, "0")}`;
}

export function MonthPicker({
    value,
    onChange,
    placeholder = "Select month",
    className,
    disabled = false,
    showClearButton = true,
}: MonthPickerProps) {
    const [open, setOpen] = React.useState(false);
    const parsed = React.useMemo(() => parseMonth(value || ""), [value]);
    const [viewYear, setViewYear] = React.useState(() => parsed?.year ?? new Date().getFullYear());

    // Sync viewYear when value changes
    React.useEffect(() => {
        if (parsed?.year) {
            setViewYear(parsed.year);
        }
    }, [parsed?.year]);

    const handleMonthSelect = (monthIndex: number) => {
        onChange?.(formatMonthValue(viewYear, monthIndex));
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.("");
    };

    const handleThisMonth = () => {
        const now = new Date();
        onChange?.(formatMonthValue(now.getFullYear(), now.getMonth()));
        setOpen(false);
    };

    const displayValue = React.useMemo(() => {
        if (!parsed) return null;
        const date = new Date(parsed.year, parsed.month, 1);
        return format(date, "MMMM yyyy");
    }, [parsed]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal h-11",
                        !parsed && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {displayValue ? (
                        <span className="flex-1 truncate">{displayValue}</span>
                    ) : (
                        <span className="flex-1">{placeholder}</span>
                    )}
                    {showClearButton && parsed && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    handleClear(e as unknown as React.MouseEvent);
                                }
                            }}
                            className="ml-2 rounded-full p-1 hover:bg-muted transition-colors"
                        >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[280px] p-0 bg-popover/95 backdrop-blur-xl border-border/50 shadow-2xl"
                align="start"
            >
                <div className="p-4 space-y-4">
                    {/* Year Navigation */}
                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setViewYear(viewYear - 1)}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold text-foreground">{viewYear}</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setViewYear(viewYear + 1)}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        {MONTHS.map((month, index) => {
                            const isSelected = parsed?.year === viewYear && parsed?.month === index;
                            const isCurrentMonth =
                                new Date().getFullYear() === viewYear &&
                                new Date().getMonth() === index;

                            return (
                                <button
                                    key={month}
                                    type="button"
                                    onClick={() => handleMonthSelect(index)}
                                    className={cn(
                                        "h-9 rounded-lg text-sm font-medium transition-all duration-200",
                                        "hover:bg-muted/80",
                                        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                                        isCurrentMonth && !isSelected && "bg-accent text-accent-foreground",
                                        !isSelected && !isCurrentMonth && "text-foreground"
                                    )}
                                >
                                    {month}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleThisMonth}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            This month
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setOpen(false)}
                            className="px-4"
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
