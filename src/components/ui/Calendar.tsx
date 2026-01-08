"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            locale={tr}
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2030}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-2 pb-2 relative items-center bg-blue-600 text-white rounded-t-lg -mx-3 -mt-3 mb-2", // Colorful header
                caption_label: "hidden",
                caption_dropdowns: "flex justify-center gap-1",
                dropdown: "bg-blue-600 text-white border-none text-sm font-bold hover:bg-blue-700 cursor-pointer appearance-none outline-none", // Dropdowns on colored header
                dropdown_month: "flex-1",
                dropdown_year: "",
                nav: "space-x-1 flex items-center absolute right-2",
                nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-blue-700 text-white rounded-md transition-all" // White nav buttons
                ),
                nav_button_previous: "absolute left-2",
                nav_button_next: "absolute right-2",
                table: "w-full border-collapse space-y-1 mx-1",
                head_row: "flex",
                head_cell:
                    "text-slate-500 rounded-md w-9 font-normal text-[0.8rem] mb-2",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-blue-50 rounded-full transition-colors"
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white shadow-md",
                day_today: "border-2 border-blue-600 text-blue-700 font-bold bg-blue-50/50", // Distinct Today: Dark Blue Border & Text
                day_outside:
                    "day-outside text-slate-400 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-500 aria-selected:opacity-30",
                day_disabled: "text-slate-500 opacity-50",
                day_range_middle:
                    "aria-selected:bg-slate-100 aria-selected:text-slate-900",
                day_hidden: "invisible",
                ...classNames,
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };
