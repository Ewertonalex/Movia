"use client";

import { useEffect, useRef } from "react";
import { useSyncExternalStore } from "react";
import {
  getPlanSnapshot,
  getServerPlanSnapshot,
  subscribeToPlan,
} from "@/lib/planner/storage";
import {
  getReminderPrefsSnapshot,
  getServerReminderPrefs,
  nextTrainingReminder,
  shouldUseDeviceReminder,
  showWorkoutNotification,
  subscribeToReminderPrefs,
} from "@/lib/planner/reminders";

const MAX_TIMEOUT = 2_147_000_000;

/**
 * Mantém o próximo aviso agendado enquanto o MOVIA está aberto neste aparelho.
 * Sem servidor e sem push: o temporizador vive só nesta aba.
 */
export function ReminderRuntime() {
  const plan = useSyncExternalStore(
    subscribeToPlan,
    getPlanSnapshot,
    getServerPlanSnapshot,
  );
  const prefs = useSyncExternalStore(
    subscribeToReminderPrefs,
    getReminderPrefsSnapshot,
    getServerReminderPrefs,
  );
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const clear = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    if (
      !prefs.enabled ||
      !shouldUseDeviceReminder(plan) ||
      !plan
    ) {
      clear();
      return clear;
    }

    const schedule = () => {
      clear();
      const upcoming = nextTrainingReminder(
        plan,
        prefs.hour,
        new Date(),
        prefs.minute,
      );
      if (!upcoming) return;
      const delay = Math.min(
        MAX_TIMEOUT,
        Math.max(1_000, upcoming.at.getTime() - Date.now()),
      );
      timeoutRef.current = window.setTimeout(() => {
        showWorkoutNotification(upcoming);
        schedule();
      }, delay);
    };

    schedule();
    return clear;
  }, [plan, prefs.enabled, prefs.hour, prefs.minute]);

  return null;
}
