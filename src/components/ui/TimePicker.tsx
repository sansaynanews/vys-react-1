"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
    value?: string;
    onChange?: (time: string) => void;
    className?: string;
    placeholder?: string;
}

export function TimePicker({
    value = "09:00",
    onChange,
    className,
}: TimePickerProps) {
    return (
        <div className={cn("relative", className)}>
            <input
                type="time"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className={cn(
                    "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg",
                    "text-sm font-medium text-slate-700",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    "transition-all duration-200 shadow-sm"
                )}
            />
        </div>
    );
}

export default TimePicker;
