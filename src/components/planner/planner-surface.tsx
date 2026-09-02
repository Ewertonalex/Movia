"use client";

import {
  AlertTriangle,
  CalendarDays,
  Dumbbell,
  Play,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Timer,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ExerciseModal } from "@/components/library/exercise-modal";
import { NamePrompt } from "@/components/profile/name-prompt";
import { CheckInPanel } from "@/components/planner/check-in-panel";
import { CalendarSync } from "@/components/planner/calendar-sync";
import { DeviceReminder } from "@/components/planner/device-reminder";
import { SessionActions } from "@/components/planner/session-actions";
import { WeekStrip } from "@/components/planner/week-strip";
import { QuickStartWizard } from "@/components/quick-start/quick-start-wizard";
import {
  Badge,
  buttonClasses,
  Eyebrow,
  OptionButton,
} from "@/components/ui/primitives";
import { CORE_CATALOG, MUSCLE_GROUPS, getExerciseById, youtubeThumbnail } from "@/lib/catalog";
import {
  GOALS,
  LEVELS,
  PLANNER_DEFAULTS,
  SESSION_MINUTES,
  SEXES,
  WEEKDAYS,
  generateWeeklyPlan,
  parseMeasureInput,
  validatePlannerInput,
} from "@/lib/planner/plan";
import {
  getPlanSnapshot,
  getServerPlanSnapshot,
  publishPlan,
  subscribeToPlan,
} from "@/lib/planner/storage";
import {
  dateOfWeekdayThisWeek,
  getServerSessionLog,
  getSessionLogSnapshot,
  localDateKey,
  statsSince,
  subscribeToSessionLog,
  weekProgress,
} from "@/lib/planner/session-log";
import type {
  CheckInFeeling,
  Exercise,
  MuscleGroup,
  PlannerGoal,
  PlannerInput,
  PlannerLevel,
  PlannerSex,
  WeekdayKey,
  WeeklyPlan,
} from "@/lib/types";
import {
  generateEquipmentAwarePlan,
  listSwapOptions,
  progressionHint,
  swapExerciseInPlan,
} from "@/lib/workout-generator/generator";
import { isCheckInDue, nextPlannerLevel } from "@/lib/profile/check-in";
import { firstName, useProfile } from "@/lib/profile/storage";
import { cn, formatRest } from "@/lib/utils";

interface PlannerSurfaceProps {
  catalog: Exercise[];
  onOpenLibrary: () => void;
  onAnalyze?: (exercise: Exercise) => void;
}

type PlannerMode = "personalized" | "quick";

function withoutGear(input: PlannerInput): PlannerInput {
  return {
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    sex: input.sex,
    goal: input.goal,
    level: input.level,
    minutes: input.minutes,
    days: input.days,
    muscles: input.muscles,
  };
}

function MeasureField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="eyebrow">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        pattern="[0-9]*"
        maxLength={3}
        value={value > 0 ? String(value) : ""}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => onChange(parseMeasureInput(event.target.value))}
        className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-lg font-[800] tracking-tight outline-none transition focus:border-vivid"
      />
    </label>
  );
}

function isQuickPlan(input: PlannerInput): boolean {
  return input.location !== undefined || input.equipment !== undefined;
}

/**
 * Superfície do planejador. A rotina personalizada é o fluxo clássico
 * (altura, peso, sexo, objetivo, nível, tempo, dias, músculos). Local e
 * equipamento existem só em "Treine com o que você tem".
 */
export function PlannerSurface({
  catalog,
  onOpenLibrary,
  onAnalyze,
}: PlannerSurfaceProps) {
  const plan = useSyncExternalStore(
    subscribeToPlan,
    getPlanSnapshot,
    getServerPlanSnapshot,
  );
  const [draft, setDraft] = useState<PlannerInput | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [mode, setMode] = useState<PlannerMode>("personalized");
  const [swapKey, setSwapKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<Exercise | null>(null);
  const [timer, setTimer] = useState<{ key: string; endsAt: number } | null>(
    null,
  );
  const log = useSyncExternalStore(
    subscribeToSessionLog,
    getSessionLogSnapshot,
    getServerSessionLog,
  );
  const profile = useProfile();
  const greeting = firstName(profile.displayName);

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
    const payload = withoutGear(input);
    const validation = validatePlannerInput(payload);
    setErrors(validation);
    if (validation.length > 0) return;
    publishPlan({
      ...generateWeeklyPlan(payload, CORE_CATALOG, rotation),
      checkIn: { status: "pending" },
    });
    setDraft(null);
    setSwapKey(null);
  };

  const reorganize = () => {
    if (!plan) return;
    const nextRotation = (plan.rotation ?? 0) + 1;
    const next = isQuickPlan(plan.input)
      ? generateEquipmentAwarePlan(plan.input, catalog, nextRotation)
      : generateWeeklyPlan(withoutGear(plan.input), CORE_CATALOG, nextRotation);
    publishPlan({
      ...next,
      createdAt: plan.createdAt,
      checkIn: plan.checkIn,
      calendarSyncedAt: plan.calendarSyncedAt,
    });
    setSwapKey(null);
  };

  const swap = (day: WeekdayKey, fromId: string, toId: string) => {
    if (!plan) return;
    publishPlan(swapExerciseInPlan(plan, day, fromId, toId, catalog));
    setSwapKey(null);
  };

  const rebuild = (
    nextInput: PlannerInput,
    checkIn: WeeklyPlan["checkIn"],
  ) => {
    const rebuilt = isQuickPlan(nextInput)
      ? generateEquipmentAwarePlan(nextInput, catalog, 0)
      : generateWeeklyPlan(withoutGear(nextInput), CORE_CATALOG, 0);
    publishPlan({ ...rebuilt, checkIn });
    setDraft(null);
    setSwapKey(null);
  };

  const answerCheckIn = (
    feeling: CheckInFeeling,
    status: "renewed" | "kept",
    raiseLevel: boolean,
  ) => {
    if (!plan) return;
    const answeredAt = new Date().toISOString();
    const level = raiseLevel
      ? nextPlannerLevel(plan.input.level)
      : plan.input.level;
    rebuild(
      { ...plan.input, level },
      { status, feeling, answeredAt },
    );
  };

  const totalExercises = useMemo(
    () =>
      plan?.days.reduce((total, day) => total + day.exercises.length, 0) ?? 0,
    [plan],
  );

  const adjustments = plan?.adjustments ?? [];
  const bodyweightHint =
    plan && isQuickPlan(plan.input) && plan.input.equipment?.length === 0
      ? progressionHint(plan.input)
      : null;
  const showSwap = Boolean(plan && isQuickPlan(plan.input));
  const week = useMemo(
    () => (plan ? weekProgress(plan, log) : []),
    [plan, log],
  );
  const checkInStats = useMemo(
    () =>
      plan
        ? statsSince(log, plan.checkIn?.answeredAt ?? plan.createdAt)
        : undefined,
    [plan, log],
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
          {greeting ? (
            <p className="max-w-xl text-lg leading-relaxed text-muted">
              Oi, {greeting}. Informe seus dados, escolha os dias e os músculos.
              A rotina é montada aqui mesmo, com regras claras de volume e
              descanso.
            </p>
          ) : (
            <p className="max-w-xl text-lg leading-relaxed text-muted">
              Informe seus dados, escolha os dias e os músculos. A rotina é montada
              aqui mesmo, com regras claras de volume e descanso.
            </p>
          )}
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

        <NamePrompt />

        <div className="grid gap-3 sm:grid-cols-2">
          <ModeCard
            title="Rotina personalizada"
            detail="Altura, peso, dias e músculos. O fluxo de sempre."
            active={mode === "personalized"}
            onClick={() => setMode("personalized")}
          />
          <ModeCard
            title="Treine com o que você tem"
            detail="Onde você está e o que tem à mão. Treino em menos de um minuto."
            active={mode === "quick"}
            onClick={() => setMode("quick")}
          />
        </div>

        {mode === "quick" ? (
          <QuickStartWizard catalog={catalog} />
        ) : (
          <div className="card-base space-y-8 p-5 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <MeasureField
                label="Altura (cm)"
                value={input.heightCm}
                onChange={(heightCm) =>
                  setInput((current) => ({ ...current, heightCm }))
                }
              />
              <MeasureField
                label="Peso (kg)"
                value={input.weightKg}
                onChange={(weightKg) =>
                  setInput((current) => ({ ...current, weightKg }))
                }
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="eyebrow">Sexo</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {SEXES.map((sex) => (
                  <OptionButton
                    key={sex}
                    label={sex}
                    active={input.sex === sex}
                    onClick={() =>
                      setInput((current) => ({
                        ...current,
                        sex: sex as PlannerSex,
                      }))
                    }
                  />
                ))}
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Usamos só para calibrar descanso, repetições e volume. Sem essa
                informação, a rotina segue a referência padrão.
              </p>
            </fieldset>

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
                <div className="grid gap-2 sm:grid-cols-3">
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
        )}
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

          <WeekStrip days={week} />

          {plan && isCheckInDue(plan) ? (
            <CheckInPanel
              plan={plan}
              displayName={profile.displayName}
              stats={checkInStats}
              onRenew={(feeling, raiseLevel) =>
                answerCheckIn(feeling, "renewed", raiseLevel)
              }
              onKeep={(feeling) => answerCheckIn(feeling, "kept", false)}
              onDismiss={() =>
                publishPlan({
                  ...plan,
                  checkIn: {
                    status: "dismissed",
                    answeredAt: new Date().toISOString(),
                  },
                })
              }
            />
          ) : null}

          <CalendarSync
            plan={plan}
            onSynced={() =>
              publishPlan({
                ...plan,
                calendarSyncedAt: new Date().toISOString(),
              })
            }
          />

          <DeviceReminder plan={plan} />

          {adjustments.length > 0 ? (
            <div className="card-base space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-deep" aria-hidden />
                <p className="text-sm font-[820] tracking-tight">
                  Como este plano foi calibrado
                </p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {adjustments.map((adjustment) => (
                  <li
                    key={adjustment.title}
                    className="rounded-2xl border border-line bg-canvas/60 p-4"
                  >
                    <p className="text-sm font-[800] tracking-tight">
                      {adjustment.title}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      {adjustment.detail}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="rounded-2xl bg-canvas px-4 py-3 text-xs leading-relaxed text-muted">
                São diferenças médias entre grupos. A variação entre pessoas do
                mesmo sexo é maior do que a diferença entre as médias, então use
                isto como ponto de partida e ajuste pelo que você sente na série.
              </p>
            </div>
          ) : null}

          {bodyweightHint ? (
            <div className="card-base space-y-2 p-5 sm:p-6">
              <p className="text-sm font-[820] tracking-tight">
                Progressão sem equipamento
              </p>
              <p className="text-sm leading-relaxed text-muted">{bodyweightHint}</p>
            </div>
          ) : null}

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plan.days.map((day) => {
              const weekday = WEEKDAYS.find((item) => item.key === day.day);
              const dayState = week.find((item) => item.weekday === day.day);
              const sessionDate = localDateKey(dateOfWeekdayThisWeek(day.day));
              return (
                <li
                  key={day.day}
                  className={cn(
                    "card-base flex h-full flex-col p-5",
                    day.rest && "bg-canvas/70",
                    dayState?.isToday && "border-deep/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">
                        {weekday?.full}
                        {dayState?.isToday ? " · hoje" : ""}
                      </p>
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
                      {dayState && dayState.total > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-deep">
                          {dayState.finished} de {dayState.total} exercícios
                        </p>
                      ) : null}
                      <ul className="mt-4 space-y-3">
                        {day.exercises.map((exercise) => {
                          const key = `${day.day}-${exercise.exerciseId}`;
                          const open = swapKey === key;
                          const usedIds = day.exercises
                            .map((item) => item.exerciseId)
                            .filter((id) => id !== exercise.exerciseId);
                          const options =
                            showSwap && open
                              ? listSwapOptions(
                                  exercise,
                                  plan.input,
                                  catalog,
                                  usedIds,
                                )
                              : [];
                          const catalogExercise = getExerciseById(
                            exercise.exerciseId,
                            catalog,
                          );

                          return (
                            <li
                              key={key}
                              className="rounded-2xl border border-line bg-canvas/60 p-3"
                            >
                              <div className="flex items-start gap-3">
                                {catalogExercise ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreview(catalogExercise)}
                                    aria-label={`Ver como fazer ${exercise.name}`}
                                    className="group relative w-[88px] shrink-0 overflow-hidden rounded-xl bg-night"
                                  >
                                    <Image
                                      src={youtubeThumbnail(
                                        catalogExercise.videoId,
                                      )}
                                      alt=""
                                      width={176}
                                      height={132}
                                      unoptimized
                                      className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center bg-night/25 transition group-hover:bg-night/10">
                                      <span className="flex size-7 items-center justify-center rounded-full bg-surface/95 text-deep">
                                        <Play
                                          className="size-3.5 translate-x-px fill-current"
                                          aria-hidden
                                        />
                                      </span>
                                    </span>
                                  </button>
                                ) : null}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    {catalogExercise ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreview(catalogExercise)
                                        }
                                        className="text-left text-sm font-[800] tracking-tight hover:text-deep"
                                      >
                                        {exercise.name}
                                      </button>
                                    ) : (
                                      <p className="text-sm font-[800] tracking-tight">
                                        {exercise.name}
                                      </p>
                                    )}
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
                                    {formatRest(exercise.restSeconds)} de
                                    descanso
                                  </p>
                                  <SessionActions
                                    exercise={exercise}
                                    catalogExercise={catalogExercise}
                                    weekday={day.day}
                                    date={sessionDate}
                                    planCreatedAt={plan.createdAt}
                                    log={log}
                                    timer={timer}
                                    timerKey={key}
                                    onTimer={setTimer}
                                  />
                                  {showSwap ? (
                                    <>
                                      <p className="mt-2 text-[11px] font-semibold text-muted">
                                        {exercise.analyzable
                                          ? "👁 Análise Movia disponível"
                                          : "Análise de movimento em breve"}
                                      </p>
                                      <button
                                        type="button"
                                        aria-expanded={open}
                                        onClick={() =>
                                          setSwapKey(open ? null : key)
                                        }
                                        className="mt-2 text-xs font-semibold text-deep hover:underline"
                                      >
                                        Trocar exercício
                                      </button>
                                      {open ? (
                                        <div className="mt-2 space-y-1">
                                          {options.length === 0 ? (
                                            <p className="text-xs text-muted">
                                              Não há alternativa cadastrada para
                                              o equipamento e o nível atuais.
                                            </p>
                                          ) : (
                                            options.map((option) => (
                                              <button
                                                key={option.id}
                                                type="button"
                                                onClick={() =>
                                                  swap(
                                                    day.day,
                                                    exercise.exerciseId,
                                                    option.id,
                                                  )
                                                }
                                                className="block w-full rounded-xl border border-line bg-surface px-3 py-2 text-left text-xs font-semibold hover:border-vivid"
                                              >
                                                {option.name}
                                              </button>
                                            ))
                                          )}
                                        </div>
                                      ) : null}
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </li>
                          );
                        })}
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

      {preview ? (
        <ExerciseModal
          exercise={preview}
          onClose={() => setPreview(null)}
          onAnalyze={
            onAnalyze
              ? (exercise) => {
                  setPreview(null);
                  onAnalyze(exercise);
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

function ModeCard({
  title,
  detail,
  active,
  onClick,
}: {
  title: string;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "card-base p-5 text-left transition",
        active
          ? "border-deep bg-vivid/10"
          : "hover:border-vivid",
      )}
    >
      <p className="text-sm font-[820] tracking-tight">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p>
    </button>
  );
}
