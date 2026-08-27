"use client";

import {
  AlertTriangle,
  CalendarDays,
  Dumbbell,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Shuffle,
  Sparkles,
  Timer,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Badge, buttonClasses, Eyebrow } from "@/components/ui/primitives";
import { MUSCLE_GROUPS } from "@/lib/catalog";
import {
  GOALS,
  LEVELS,
  PLANNER_DEFAULTS,
  SESSION_MINUTES,
  WEEKDAYS,
  generateWeeklyPlan,
  validatePlannerInput,
} from "@/lib/planner/plan";
import {
  getPlanSnapshot,
  getServerPlanSnapshot,
  publishPlan,
  subscribeToPlan,
} from "@/lib/planner/storage";
import type {
  Exercise,
  MuscleGroup,
  PlannerGoal,
  PlannerInput,
  PlannerLevel,
  WeekdayKey,
} from "@/lib/types";
import { cn, formatRest } from "@/lib/utils";

interface PlannerSurfaceProps {
  catalog: Exercise[];
  onOpenLibrary: () => void;
}

export function PlannerSurface({
  catalog,
  onOpenLibrary,
}: PlannerSurfaceProps) {
  const plan = useSyncExternalStore(
    subscribeToPlan,
    getPlanSnapshot,
    getServerPlanSnapshot,
  );
  const [draft, setDraft] = useState<PlannerInput | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const input: PlannerInput = draft ?? plan?.input ?? PLANNER_DEFAULTS;
  const setInput = (updater: (current: PlannerInput) => PlannerInput) =>
    setDraft(updater(input));

  const toggleDay = (day: WeekdayKey) => {
    setInput((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day],
    }));
  };

  const toggleMuscle = (muscle: MuscleGroup) => {
    setInput((current) => ({
      ...current,
      muscles: current.muscles.includes(muscle)
        ? current.muscles.filter((item) => item !== muscle)
        : [...current.muscles, muscle],
    }));
  };

  const generate = (rotation = 0) => {
    const validation = validatePlannerInput(input);
    setErrors(validation);
    if (validation.length > 0) return;
    publishPlan(generateWeeklyPlan(input, catalog, rotation));
    setDraft(null);
  };

  const reorganize = () => {
    if (!plan) return;
    publishPlan(
      generateWeeklyPlan(plan.input, catalog, (plan.rotation ?? 0) + 1),
    );
  };

  const totalExercises = useMemo(
    () =>
      plan?.days.reduce((total, day) => total + day.exercises.length, 0) ?? 0,
    [plan],
  );

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 sm:px-6 lg:px-10">
      <section className="grid gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-14">
        <div className="space-y-5">
          <Eyebrow>Planejador semanal</Eyebrow>
          <h1 className="display-xl max-w-2xl">
            Sua rotina.
            <br />
            <span className="text-vivid">Do seu jeito.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Informe seus dados, escolha os dias e os músculos. A rotina é montada
            aqui mesmo, com regras claras de volume e descanso.
          </p>
          <Badge tone="vivid">
            <Sparkles className="size-3.5" aria-hidden />
            Planejamento inteligente no dispositivo
          </Badge>
        </div>

        <div className="card-base space-y-3 p-6">
          <p className="text-sm font-[800] tracking-tight">
            Rotina é sugestão educacional
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Dor, lesão, gestação ou condição clínica pedem orientação
            profissional antes de começar.
          </p>
          <p className="rounded-2xl bg-canvas px-4 py-3 text-xs leading-relaxed text-muted">
            Seus dados físicos não são enviados para serviços externos.
          </p>
        </div>
      </section>

      <section aria-labelledby="planner-form" className="space-y-6">
        <h2 id="planner-form" className="display-md">
          Monte sua semana
        </h2>

        <div className="card-base space-y-8 p-5 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="eyebrow">Altura (cm)</span>
              <input
                type="number"
                min={120}
                max={230}
                value={input.heightCm}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    heightCm: Number(event.target.value),
                  }))
                }
                className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-lg font-[800] tracking-tight outline-none transition focus:border-vivid"
              />
            </label>
            <label className="space-y-2">
              <span className="eyebrow">Peso (kg)</span>
              <input
                type="number"
                min={35}
                max={250}
                value={input.weightKg}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    weightKg: Number(event.target.value),
                  }))
                }
                className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-lg font-[800] tracking-tight outline-none transition focus:border-vivid"
              />
            </label>
          </div>

          <fieldset className="space-y-3">
            <legend className="eyebrow">Objetivo</legend>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {GOALS.map((goal) => (
                <OptionButton
                  key={goal}
                  label={goal}
                  active={input.goal === goal}
                  onClick={() =>
                    setInput((current) => ({
                      ...current,
                      goal: goal as PlannerGoal,
                    }))
                  }
                />
              ))}
            </div>
          </fieldset>

          <div className="grid gap-6 lg:grid-cols-2">
            <fieldset className="space-y-3">
              <legend className="eyebrow">Experiência</legend>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((level) => (
                  <OptionButton
                    key={level}
                    label={level}
                    active={input.level === level}
                    onClick={() =>
                      setInput((current) => ({
                        ...current,
                        level: level as PlannerLevel,
                      }))
                    }
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="eyebrow">Tempo por treino</legend>
              <div className="grid grid-cols-4 gap-2">
                {SESSION_MINUTES.map((minutes) => (
                  <OptionButton
                    key={minutes}
                    label={`${minutes} min`}
                    active={input.minutes === minutes}
                    onClick={() =>
                      setInput((current) => ({ ...current, minutes }))
                    }
                  />
                ))}
              </div>
            </fieldset>
          </div>

          <fieldset className="space-y-3">
            <legend className="eyebrow">Dias de treino</legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {WEEKDAYS.map((day) => {
                const active = input.days.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    aria-pressed={active}
                    aria-label={day.full}
                    onClick={() => toggleDay(day.key)}
                    className={cn(
                      "rounded-2xl border px-2 py-3 text-sm font-bold tracking-tight transition",
                      active
                        ? "border-night bg-night text-lime"
                        : "border-line bg-canvas text-muted hover:border-vivid hover:text-deep",
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted">
              Escolha pelo menos dois dias na semana.
            </p>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="eyebrow">Foco muscular</legend>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((muscle) => {
                const active = input.muscles.includes(muscle);
                return (
                  <button
                    key={muscle}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleMuscle(muscle)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "border-deep bg-vivid/15 text-deep"
                        : "border-line bg-canvas text-muted hover:border-vivid hover:text-deep",
                    )}
                  >
                    {muscle}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {errors.length > 0 ? (
            <ul
              role="alert"
              className="space-y-2 rounded-2xl border border-[#F3D2C9] bg-[#FDF1ED] px-4 py-3"
            >
              {errors.map((message) => (
                <li
                  key={message}
                  className="flex items-start gap-2 text-sm text-[#8A3418]"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {message}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => generate(plan?.rotation ?? 0)}
              className={buttonClasses("primary")}
            >
              <Sparkles className="size-4" aria-hidden />
              {plan ? "Refazer minha rotina" : "Gerar minha rotina inteligente"}
            </button>
            {plan ? (
              <>
                <button
                  type="button"
                  onClick={reorganize}
                  className={buttonClasses("secondary")}
                >
                  <Shuffle className="size-4" aria-hidden />
                  Reorganizar
                </button>
                <button
                  type="button"
                  onClick={onOpenLibrary}
                  className={buttonClasses("ghost", "text-muted")}
                >
                  <ScanLine className="size-4" aria-hidden />
                  Ver vídeos dos exercícios
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {plan ? (
        <section aria-labelledby="rotina-semanal" className="mt-14 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <Eyebrow>Sua semana</Eyebrow>
              <h2 id="rotina-semanal" className="display-lg">
                {plan.input.goal} · {plan.input.level}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">
                <CalendarDays className="size-3.5" aria-hidden />
                {plan.input.days.length} dias
              </Badge>
              <Badge tone="neutral">
                <Timer className="size-3.5" aria-hidden />
                {plan.input.minutes} min por treino
              </Badge>
              <Badge tone="vivid">
                <Dumbbell className="size-3.5" aria-hidden />
                {totalExercises} exercícios na semana
              </Badge>
            </div>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plan.days.map((day) => {
              const weekday = WEEKDAYS.find((item) => item.key === day.day);
              return (
                <li
                  key={day.day}
                  className={cn(
                    "card-base flex h-full flex-col p-5",
                    day.rest && "bg-canvas/70",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">{weekday?.full}</p>
                      <p className="mt-1 text-xl font-[830] tracking-tight">
                        {day.rest ? "Recuperação" : day.sessionLabel}
                      </p>
                    </div>
                    {day.rest ? (
                      <RotateCcw className="size-4 text-muted" aria-hidden />
                    ) : (
                      <Badge tone="lime">{day.minutes} min</Badge>
                    )}
                  </div>

                  {day.rest ? (
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      Dia livre. Caminhada leve, mobilidade e sono suficiente
                      também fazem parte do resultado.
                    </p>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-muted">
                        {day.focus?.join(" · ")}
                      </p>
                      <ul className="mt-4 space-y-3">
                        {day.exercises.map((exercise) => (
                          <li
                            key={`${day.day}-${exercise.exerciseId}`}
                            className="rounded-2xl border border-line bg-canvas/60 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-[800] tracking-tight">
                                {exercise.name}
                              </p>
                              {exercise.analyzable ? (
                                <ScanLine
                                  className="mt-0.5 size-3.5 shrink-0 text-deep"
                                  aria-label="Exercício com análise por vídeo"
                                />
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              {exercise.equipment}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-ink">
                              {exercise.sets} × {exercise.reps} reps ·{" "}
                              {formatRest(exercise.restSeconds)} de descanso
                            </p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-line bg-surface px-5 py-4">
            <RefreshCw className="size-4 shrink-0 text-deep" aria-hidden />
            <p className="text-xs leading-relaxed text-muted">
              A rotina fica salva apenas neste navegador. Ajuste os campos e
              gere novamente sempre que sua semana mudar.
            </p>
          </div>
        </section>
      ) : (
        <section className="card-base mt-14 flex flex-col items-center gap-3 px-6 py-16 text-center">
          <CalendarDays className="size-6 text-muted" aria-hidden />
          <p className="text-lg font-[830] tracking-tight">
            Sua semana aparece aqui
          </p>
          <p className="max-w-sm text-sm text-muted">
            Preencha os campos acima e gere a rotina para ver os treinos dia a
            dia.
          </p>
        </section>
      )}
    </div>
  );
}

function OptionButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-3 py-3 text-sm font-semibold transition",
        active
          ? "border-deep bg-vivid/12 text-deep"
          : "border-line bg-canvas text-muted hover:border-vivid hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
