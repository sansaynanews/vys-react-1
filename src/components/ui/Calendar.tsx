"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { tr } from "date-fns/locale";
import { format } from "date-fns";
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
            components={{
                Caption: (props: any) => {
                    const { displayMonth } = props;
                    return (
                        <div className="relative flex justify-center items-center pt-1 pb-4">
                            {/* Header: Dark Navy-Grey (Lacivert-Gri) */}
                            <div className="bg-slate-800 text-white w-full rounded-md py-2 flex justify-center items-center text-lg font-bold shadow-md relative overflow-hidden ring-1 ring-white/10">
                                {/* Decorative sheen */}
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 pointer-events-none"></div>

                                <span className="z-10 tracking-wide">{format(displayMonth, "MMMM", { locale: tr })}</span>
                                <span className="z-10 ml-2 text-yellow-400">{format(displayMonth, "yyyy")}</span>
                            </div>
                        </div>
                    );
                }
            }}
            modifiers={{
                weekend: (date) => {
                    const day = date.getDay();
                    return day === 0 || day === 6;
                }
            }}
            modifiersClassNames={{
                weekend: "text-red-600 font-bold" // Red Weekends
            }}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "hidden",
                nav: "space-x-1 flex items-center absolute right-3 top-3.5 z-20",
                nav_button: cn(
                    "h-6 w-6 bg-transparent p-0 opacity-70 hover:opacity-100 text-white hover:bg-white/20 rounded-full transition-all"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1 mx-auto",
                head_row: "flex justify-between mb-2",
                head_cell:
                    "text-slate-600 rounded-md w-9 font-bold text-[0.9rem]",
                row: "flex w-full mt-2 justify-between",
                cell: "h-9 w-9 text-center text-lg p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-full transition-colors text-slate-900"
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white shadow-md rounded-full",
                day_today: "bg-slate-600 text-white font-bold rounded-full", // Today: Navy-Grey Background
                day_outside:
                    "day-outside text-slate-300 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-500 aria-selected:opacity-30",
                day_disabled: "text-slate-300 opacity-50",
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
