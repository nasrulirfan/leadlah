"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface YearPickerProps {
    value?: number;
    onChange?: (year: number) => void;
    minYear?: number;
    maxYear?: number;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function YearPicker({
    value,
    onChange,
    minYear,
    maxYear,
    placeholder = "Select year",
    className,
    disabled = false,
}: YearPickerProps) {
    const [open, setOpen] = React.useState(false);
    const currentYear = new Date().getFullYear();

    // Default range: 10 years back, 5 years forward
    const effectiveMinYear = minYear ?? currentYear - 10;
    const effectiveMaxYear = maxYear ?? currentYear + 5;

    // Calculate the decade start for the current view
    const [decadeStart, setDecadeStart] = React.useState(() => {
        const year = value ?? currentYear;
        return Math.floor(year / 10) * 10;
    });

    // Generate years for the current decade view (12 years to fill a 3x4 grid)
    const years = React.useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => decadeStart + i);
    }, [decadeStart]);

    const handleYearSelect = (year: number) => {
        onChange?.(year);
        setOpen(false);
    };

    const handlePrevDecade = () => {
        setDecadeStart((prev) => prev - 10);
    };

    const handleNextDecade = () => {
        setDecadeStart((prev) => prev + 10);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <Calendar className="mr-2 h-4 w-4" />
                    {value ? value.toString() : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[280px] p-0 overflow-hidden"
                align="start"
            >
                {/* Gradient border wrapper */}
                <div className="relative">
                    <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-br from-primary/30 via-primary/10 to-transparent pointer-events-none" />

                    <div className="relative bg-popover rounded-lg">
                        {/* Header with decade navigation */}
                        <div className="flex items-center justify-between p-3 border-b border-border/50">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted/80 transition-colors"
                                onClick={handlePrevDecade}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-semibold text-foreground">
                                {decadeStart} - {decadeStart + 11}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted/80 transition-colors"
                                onClick={handleNextDecade}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Year grid */}
                        <div className="p-3">
                            <div className="grid grid-cols-4 gap-2">
                                {years.map((year) => {
                                    const isSelected = value === year;
                                    const isCurrent = year === currentYear;
                                    const isDisabled = year < effectiveMinYear || year > effectiveMaxYear;

                                    return (
                                        <Button
                                            key={year}
                                            variant={isSelected ? "default" : "ghost"}
                                            size="sm"
                                            disabled={isDisabled}
                                            onClick={() => handleYearSelect(year)}
                                            className={cn(
                                                "h-10 text-sm font-medium transition-all duration-200",
                                                isSelected && "bg-primary text-primary-foreground shadow-md shadow-primary/25",
                                                !isSelected && isCurrent && "ring-1 ring-primary/40 text-primary",
                                                !isSelected && !isCurrent && "hover:bg-muted/80",
                                                isDisabled && "opacity-40 cursor-not-allowed"
                                            )}
                                        >
                                            {year}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick actions footer */}
                        <div className="flex items-center justify-between border-t border-border/50 p-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    onChange?.(currentYear);
                                    setOpen(false);
                                }}
                            >
                                This Year
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
