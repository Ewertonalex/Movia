"use client";

import { Check, Minus } from "lucide-react";
import { WEEKDAYS } from "@/lib/planner/plan";
import type { WeekDayProgress } from "@/lib/planner/session-log";
import { cn } from "@/lib/utils";

export function WeekStrip({ days }: { days: WeekDayProgress[] }) {
  return (
    <ol className="grid grid-cols-7 gap-1.5">
      {days.map((day) => {
        const weekday = WEEKDAYS.find((item) => item.key === day.weekday);
        const label = day.rest
          ? "—"
          : day.total === 0
            ? "—"
            : day.finished >= day.total
              ? "ok"
              : day.finished > 0
                ? `${day.finished}/${day.total}`
                : "·";
        return (
          <li key={day.weekday}>
            <div
              className={cn(
                "rounded-2xl border px-1 py-2 text-center",
                day.isToday
                  ? "border-deep bg-vivid/15"
                  : "border-line bg-canvas/80",
              )}
            >
              <p className="text-[10px] font-bold tracking-[0.12em] text-muted">
                {weekday?.label}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs font-[800] tracking-tight",
                  day.rest ? "text-muted" : "text-ink",
                )}
                aria-label={
                  day.rest
                    ? `${weekday?.full}: recuperação`
                    : `${weekday?.full}: ${day.finished} de ${day.total} exercícios`
                }
              >
                {day.finished >= day.total && !day.rest ? (
                  <Check className="mx-auto size-3.5 text-deep" aria-hidden />
                ) : day.rest ? (
                  <Minus className="mx-auto size-3.5 text-muted" aria-hidden />
                ) : (
                  label
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
