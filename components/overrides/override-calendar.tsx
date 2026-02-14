'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';

interface OverrideCalendarProps {
  onDateSelect: (date: Date) => void;
  currentDate: Date;
  selectedDate: Date | null;
}

export default function OverrideCalendar({ onDateSelect, currentDate, selectedDate }: OverrideCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Get first day of month and total days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const getDayStatus = (day: number): 'today' | 'tomorrow' | 'past' | 'future' => {
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return 'today';
    if (date.getTime() === tomorrow.getTime()) return 'tomorrow';
    if (date.getTime() < today.getTime()) return 'past';
    return 'future';
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  const handleDayClick = (day: number) => {
    const status = getDayStatus(day);
    if (status === 'future') return; // locked
    onDateSelect(new Date(viewYear, viewMonth, day));
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-space-grotesk font-bold text-[#1A1C1E]">
          {monthNames[viewMonth]} {viewYear}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-3 text-center">
        {['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].map(d => (
          <span key={d} className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{d}</span>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const status = getDayStatus(day);
          const selected = isSelected(day);
          const isFuture = status === 'future';
          const isToday = status === 'today';
          const isTomorrow = status === 'tomorrow';
          const isPast = status === 'past';

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              disabled={isFuture}
              className={`relative h-8 w-8 mx-auto flex items-center justify-center text-xs font-bold transition-all rounded-full
                ${isToday ? 'bg-[#08677A] text-white shadow-lg shadow-[#08677A]/30' : ''}
                ${isTomorrow ? 'bg-[#08677A]/10 text-[#08677A] ring-1 ring-[#08677A]/30' : ''}
                ${isPast ? 'text-slate-400 hover:bg-slate-100' : ''}
                ${isFuture ? 'text-slate-200 cursor-not-allowed' : 'cursor-pointer'}
                ${selected && !isToday ? 'ring-2 ring-[#08677A] ring-offset-2' : ''}
              `}
            >
              {day}
              {/* Status dots */}
              <div className="absolute -bottom-1 flex gap-0.5">
                {(isToday || isTomorrow) && <div className="w-1 h-1 rounded-full bg-[#FF7D1F]" />}
                {isPast && day % 3 === 0 && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                {isPast && day % 5 === 0 && <div className="w-1 h-1 rounded-full bg-slate-300" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-50 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-[#08677A]" /> Today / Tomorrow — Overridable
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-slate-300" /> Past — Archived Logs
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-slate-100 border border-slate-200" /> Future — Locked
        </div>
      </div>
    </div>
  );
}