"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateTimePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    showClearButton?: boolean;
}

// Helper to convert datetime-local string to Date
function parseDateTime(value: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
}

// Helper to convert Date to datetime-local string format
function formatDateTime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = "Pick date & time",
    className,
    disabled = false,
    showClearButton = true,
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false);
    const date = React.useMemo(() => parseDateTime(value || ""), [value]);

    // Local state for time inputs
    const [hours, setHours] = React.useState(() => {
        if (!date) return 12;
        const h = date.getHours();
        return h === 0 ? 12 : h > 12 ? h - 12 : h;
    });
    const [minutes, setMinutes] = React.useState(() => date?.getMinutes() ?? 0);
    const [isPM, setIsPM] = React.useState(() => {
        if (!date) return false;
        return date.getHours() >= 12;
    });

    // Sync time state when value changes externally
    React.useEffect(() => {
        if (date) {
            const h = date.getHours();
            setHours(h === 0 ? 12 : h > 12 ? h - 12 : h);
            setMinutes(date.getMinutes());
            setIsPM(h >= 12);
        }
    }, [date]);

    const updateDateTime = (
        newDate?: Date,
        newHours?: number,
        newMinutes?: number,
        newIsPM?: boolean
    ) => {
        const targetDate = newDate ?? date ?? new Date();
        const targetHours = newHours ?? hours;
        const targetMinutes = newMinutes ?? minutes;
        const targetIsPM = newIsPM ?? isPM;

        // Convert 12-hour to 24-hour format
        let hour24 = targetHours;
        if (targetIsPM && targetHours !== 12) {
            hour24 = targetHours + 12;
        } else if (!targetIsPM && targetHours === 12) {
            hour24 = 0;
        }

        const result = new Date(targetDate);
        result.setHours(hour24, targetMinutes, 0, 0);
        onChange?.(formatDateTime(result));
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            updateDateTime(selectedDate);
        }
    };

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 1 && val <= 12) {
            setHours(val);
            updateDateTime(undefined, val);
        }
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 0 && val <= 59) {
            setMinutes(val);
            updateDateTime(undefined, undefined, val);
        }
    };

    const togglePeriod = () => {
        const newIsPM = !isPM;
        setIsPM(newIsPM);
        updateDateTime(undefined, undefined, undefined, newIsPM);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.("");
        setHours(12);
        setMinutes(0);
        setIsPM(false);
    };

    const handleToday = () => {
        const now = new Date();
        setHours(now.getHours() === 0 ? 12 : now.getHours() > 12 ? now.getHours() - 12 : now.getHours());
        setMinutes(now.getMinutes());
        setIsPM(now.getHours() >= 12);
        updateDateTime(now,
            now.getHours() === 0 ? 12 : now.getHours() > 12 ? now.getHours() - 12 : now.getHours(),
            now.getMinutes(),
            now.getHours() >= 12
        );
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
                            {format(date, "MMM d, yyyy")} at {format(date, "h:mm a")}
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
                <div className="p-4 space-y-4">
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

                    {/* Time Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Time</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Hours */}
                            <div className="relative">
                                <input
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={hours}
                                    onChange={handleHoursChange}
                                    className={cn(
                                        "w-14 h-12 text-center text-lg font-semibold rounded-xl",
                                        "border border-border/40 bg-background/80",
                                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                                        "transition-all duration-200",
                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    )}
                                />
                            </div>

                            <span className="text-2xl font-light text-muted-foreground">:</span>

                            {/* Minutes */}
                            <div className="relative">
                                <input
                                    type="number"
                                    min={0}
                                    max={59}
                                    value={minutes.toString().padStart(2, "0")}
                                    onChange={handleMinutesChange}
                                    className={cn(
                                        "w-14 h-12 text-center text-lg font-semibold rounded-xl",
                                        "border border-border/40 bg-background/80",
                                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                                        "transition-all duration-200",
                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    )}
                                />
                            </div>

                            {/* AM/PM Toggle */}
                            <div className="flex rounded-xl border border-border/40 overflow-hidden bg-background/50">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isPM) togglePeriod();
                                    }}
                                    className={cn(
                                        "px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                                        !isPM
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    AM
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isPM) togglePeriod();
                                    }}
                                    className={cn(
                                        "px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                                        isPM
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    PM
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleToday}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Now
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
