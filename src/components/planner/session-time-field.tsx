"use client";

import { useSyncExternalStore } from "react";
import {
  formatSessionClock,
  getReminderPrefsSnapshot,
  getServerReminderPrefs,
  parseSessionClock,
  publishReminderPrefs,
  subscribeToReminderPrefs,
} from "@/lib/planner/reminders";

export function SessionTimeField({
  legend = "Horário do treino",
}: {
  legend?: string;
}) {
  const prefs = useSyncExternalStore(
    subscribeToReminderPrefs,
    getReminderPrefsSnapshot,
    getServerReminderPrefs,
  );

  return (
    <label className="block max-w-xs space-y-2">
      <span className="eyebrow">{legend}</span>
      <input
        type="time"
        value={formatSessionClock(prefs.hour, prefs.minute)}
        onChange={(event) => {
          const parsed = parseSessionClock(event.target.value);
          if (!parsed) return;
          publishReminderPrefs({
            ...prefs,
            hour: parsed.hour,
            minute: parsed.minute,
          });
        }}
        className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-base font-[800] tracking-tight outline-none transition focus:border-vivid"
        aria-label={legend}
      />
    </label>
  );
}
