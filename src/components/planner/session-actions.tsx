"use client";

import { Timer } from "lucide-react";
import { useEffect, useState } from "react";
import type { Exercise, PlannedExercise, WeekdayKey } from "@/lib/types";
import {
  getExerciseProgress,
  logExerciseSkipped,
  logSetDone,
  normalizeLoad,
  publishSessionLog,
  undoExerciseSession,
  usesExternalLoad,
  type SessionLogState,
} from "@/lib/planner/session-log";
import { cn, formatRest } from "@/lib/utils";

interface SessionActionsProps {
  exercise: PlannedExercise;
  catalogExercise?: Exercise;
  weekday: WeekdayKey;
  date: string;
  planCreatedAt: string;
  log: SessionLogState;
  timer: { key: string; endsAt: number } | null;
  timerKey: string;
  onTimer: (next: { key: string; endsAt: number } | null) => void;
}

function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function SessionActions({
  exercise,
  catalogExercise,
  weekday,
  date,
  planCreatedAt,
  log,
  timer,
  timerKey,
  onTimer,
}: SessionActionsProps) {
  const progress = getExerciseProgress(
    log,
    date,
    weekday,
    planCreatedAt,
    exercise.exerciseId,
    exercise.sets,
  );
  const showLoad = usesExternalLoad(catalogExercise);
  const [loadDraft, setLoadDraft] = useState(progress.load ?? "");
  const running = timer?.key === timerKey;
  const [left, setLeft] = useState(0);

  useEffect(() => {
    setLoadDraft(progress.load ?? "");
  }, [progress.load]);

  useEffect(() => {
    if (!running || !timer) {
      setLeft(0);
      return;
    }
    let finished = false;
    const tick = () => {
      if (finished) return;
      const seconds = Math.max(
        0,
        Math.ceil((timer.endsAt - Date.now()) / 1000),
      );
      setLeft(seconds);
      if (seconds <= 0) {
        finished = true;
        onTimer(null);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(200);
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running, timer, onTimer]);

  const identity = {
    date,
    weekday,
    planCreatedAt,
    exerciseId: exercise.exerciseId,
  };

  const startRest = () => {
    onTimer({
      key: timerKey,
      endsAt: Date.now() + exercise.restSeconds * 1000,
    });
  };

  const markSet = () => {
    const load = showLoad ? normalizeLoad(loadDraft) : undefined;
    publishSessionLog(
      logSetDone(log, {
        ...identity,
        plannedSets: exercise.sets,
        load,
      }),
    );
    const nextCount = progress.completedSets + 1;
    if (nextCount < exercise.sets) startRest();
    else onTimer(null);
  };

  const skip = () => {
    publishSessionLog(logExerciseSkipped(log, identity));
    onTimer(null);
  };

  const undo = () => {
    publishSessionLog(undoExerciseSession(log, identity));
    onTimer(null);
  };

  if (progress.finished) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold text-deep">
          {progress.skipped
            ? progress.completedSets > 0
              ? `Parou em ${progress.completedSets} de ${exercise.sets}`
              : "Pulei hoje"
            : "Feito"}
          {progress.load ? ` · ${progress.load}` : ""}
        </p>
        <button
          type="button"
          onClick={undo}
          className="text-[11px] font-semibold text-muted hover:text-deep hover:underline"
        >
          Desfazer
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] font-semibold text-muted">
        Série {progress.completedSets + 1} de {exercise.sets}
      </p>
      {showLoad ? (
        <label className="block">
          <span className="sr-only">Peso usado, opcional</span>
          <input
            type="text"
            inputMode="text"
            maxLength={24}
            value={loadDraft}
            onChange={(event) => setLoadDraft(event.target.value)}
            placeholder="Peso usado, se quiser"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none transition placeholder:text-muted/80 focus:border-vivid"
          />
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={markSet}
          className="rounded-full bg-deep px-3 py-1.5 text-[11px] font-bold text-surface"
        >
          Fiz esta série
        </button>
        <button
          type="button"
          onClick={skip}
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted hover:border-vivid hover:text-deep"
        >
          Pulei
        </button>
        <button
          type="button"
          onClick={() => (running ? onTimer(null) : startRest())}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold",
            running
              ? "border-deep bg-vivid/15 text-deep"
              : "border-line bg-surface text-muted hover:border-vivid hover:text-deep",
          )}
          aria-pressed={running}
        >
          <Timer className="size-3" aria-hidden />
          {running
            ? formatCountdown(left)
            : `Descansar ${formatRest(exercise.restSeconds)}`}
        </button>
      </div>
    </div>
  );
}
