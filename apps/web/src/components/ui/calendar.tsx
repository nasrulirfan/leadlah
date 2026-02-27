"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month_caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
                ),
                month_grid: "w-full border-collapse space-y-1",
                weekday:
                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                range_end: "rounded-r-md",
                range_middle: "rounded-none bg-accent text-accent-foreground",
                range_start: "rounded-l-md",
                selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                today: "bg-accent text-accent-foreground",
                outside: "text-muted-foreground opacity-50",
                disabled: "text-muted-foreground opacity-50",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, ...chevronProps }) =>
                    orientation === "left" ? (
                        <ChevronLeft
                            {...chevronProps}
                            className={cn("h-4 w-4", chevronProps.className)}
                        />
                    ) : (
                        <ChevronRight
                            {...chevronProps}
                            className={cn("h-4 w-4", chevronProps.className)}
                        />
                    ),
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };
