"use client";

import React, { useState } from "react";
import TimeKeeper from "react-timekeeper";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

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
    placeholder = "Saat Seçin"
}: TimePickerProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [time, setTime] = useState(value);

    const handleChange = (data: { formatted24: string }) => {
        setTime(data.formatted24);
        onChange?.(data.formatted24);
    };

    const handleDone = () => {
        setShowPicker(false);
    };

    return (
        <div className={cn("relative", className)}>
            {/* Input Trigger */}
            <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 w-full",
                    "bg-white border border-slate-200 rounded-lg",
                    "text-sm font-medium text-slate-700",
                    "hover:border-blue-400 hover:bg-blue-50/50",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    "transition-all duration-200"
                )}
            >
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{time || placeholder}</span>
            </button>

            {/* TimeKeeper Popup */}
            {showPicker && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={handleDone}
                    />

                    {/* Picker - Scaled Down */}
                    <div className="absolute top-full left-0 mt-2 z-50 shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 transform scale-[0.8] origin-top-left">
                        <TimeKeeper
                            time={time}
                            onChange={handleChange}
                            hour24Mode={true}
                            switchToMinuteOnHourSelect={true}
                            doneButton={() => (
                                <div
                                    onClick={handleDone}
                                    className="text-center py-2 px-3 bg-blue-600 text-white text-sm font-bold cursor-pointer hover:bg-blue-700 transition-colors"
                                >
                                    TAMAM
                                </div>
                            )}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default TimePicker;
