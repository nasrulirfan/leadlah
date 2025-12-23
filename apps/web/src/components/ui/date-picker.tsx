"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    showClearButton?: boolean;
}

// Helper to convert date string (YYYY-MM-DD) to Date
function parseDate(value: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value + "T00:00:00");
    return isNaN(date.getTime()) ? undefined : date;
}

// Helper to convert Date to date string format (YYYY-MM-DD)
function formatDateValue(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return `${year}-${month}-${day}`;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    className,
    disabled = false,
    showClearButton = true,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const date = React.useMemo(() => parseDate(value || ""), [value]);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            onChange?.(formatDateValue(selectedDate));
            setOpen(false);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.("");
    };

    const handleToday = () => {
        const now = new Date();
        onChange?.(formatDateValue(now));
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal h-11",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {date ? (
                        <span className="flex-1 truncate">
                            {format(date, "MMM d, yyyy")}
                        </span>
                    ) : (
                        <span className="flex-1">{placeholder}</span>
                    )}
                    {showClearButton && date && (
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
                className="w-auto p-0 bg-popover/95 backdrop-blur-xl border-border/50 shadow-2xl"
                align="start"
            >
                <div className="p-3">
                    {/* Calendar Section */}
                    <div className="rounded-xl border border-border/40 bg-background/50 overflow-hidden">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                            className="rounded-xl"
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleToday}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Today
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
