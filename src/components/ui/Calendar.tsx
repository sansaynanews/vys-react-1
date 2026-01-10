"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { isHoliday } from "@/lib/holidays";
import "react-day-picker/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            animate
            locale={tr}
            weekStartsOn={1}
            showOutsideDays
            className={cn("p-3", className)}
            modifiers={{
                weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
                holiday: (date) => isHoliday(date),
            }}
            modifiersClassNames={{
                weekend: "rdp-weekend",
                holiday: "rdp-holiday",
                today: "rdp-today",
                selected: "rdp-selected",
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };
