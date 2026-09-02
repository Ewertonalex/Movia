"use client";

import {
  Home,
  Sparkles,
  Trees,
  Dumbbell,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { Badge, buttonClasses, Eyebrow, OptionButton } from "@/components/ui/primitives";
import { MUSCLE_GROUPS } from "@/lib/catalog";
import { LEVELS, SEXES } from "@/lib/planner/plan";
import { publishPlan } from "@/lib/planner/storage";
import {
  generateEquipmentAwarePlan,
  toPlannerInput,
} from "@/lib/workout-generator/generator";
import { SURPRISE_COPY } from "@/lib/workout-generator/defaults";
import {
  EQUIPMENT_TAGS,
  LOCATIONS,
  QUICK_START_GOALS,
  QUICK_START_MINUTES,
  type QuickStartGoal,
  type QuickStartInput,
} from "@/lib/workout-generator/types";
import type {
  EquipmentTag,
  Exercise,
  LocationTag,
  MuscleGroup,
  PlannerLevel,
  PlannerSex,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = [
  "Sexo",
  "Objetivo",
  "Nível",
  "Local",
  "Equipamento",
  "Prioridade",
  "Tempo",
  "Frequência",
] as const;

const SURPRISE: QuickStartInput = {
  sex: "Prefiro não informar",
  goal: "Saúde e bem-estar",
  level: "Iniciante",
  location: "casa",
  equipment: [],
  unknownEquipment: true,
  muscles: [...MUSCLE_GROUPS],
  fullBody: true,
  minutes: 30,
  daysPerWeek: 3,
};

const INITIAL: QuickStartInput = {
  sex: "Prefiro não informar",
  goal: "Hipertrofia",
  level: "Iniciante",
  location: "casa",
  equipment: [],
  unknownEquipment: false,
  muscles: ["Quadríceps", "Glúteos e posterior", "Abdômen"],
  fullBody: false,
  minutes: 30,
  daysPerWeek: 3,
};

const LOCATION_ICON = {
  casa: Home,
  academia: Dumbbell,
  ar_livre: Trees,
  outro: Sparkles,
} as const;

interface QuickStartWizardProps {
  catalog: Exercise[];
}

export function QuickStartWizard({ catalog }: QuickStartWizardProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<QuickStartInput>(INITIAL);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<QuickStartInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const toggleEquipment = (tag: EquipmentTag) => {
    if (tag === "nenhum") {
      update({ equipment: [], unknownEquipment: false });
      return;
    }
    const withoutNone = draft.equipment.filter((item) => item !== "nenhum");
    const next = withoutNone.includes(tag)
      ? withoutNone.filter((item) => item !== tag)
      : [...withoutNone, tag];
    update({ equipment: next, unknownEquipment: false });
  };

  const toggleMuscle = (muscle: MuscleGroup) => {
    const next = draft.muscles.includes(muscle)
      ? draft.muscles.filter((item) => item !== muscle)
      : [...draft.muscles, muscle];
    update({ muscles: next, fullBody: false });
  };

  const canAdvance = () => {
    if (step === 5) return draft.fullBody || draft.muscles.length > 0;
    return true;
  };

  const generate = (input: QuickStartInput) => {
    if (!input.fullBody && input.muscles.length === 0) {
      setError("Escolha pelo menos um grupo muscular ou corpo inteiro.");
      return;
    }
    publishPlan(generateEquipmentAwarePlan(toPlannerInput(input), catalog));
  };

  return (
    <div className="card-base space-y-6 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>
          Passo {String(step + 1).padStart(2, "0")} de {STEPS.length}
        </Eyebrow>
        <button
          type="button"
          onClick={() => generate(SURPRISE)}
          className={buttonClasses("ghost", "text-muted")}
        >
          <Sparkles className="size-4" aria-hidden />
          Surpreenda-me
        </button>
      </div>

      <h3 className="display-md">{STEPS[step]}</h3>

      {step === 0 ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {SEXES.map((sex) => (
            <OptionButton
              key={sex}
              label={sex}
              active={draft.sex === sex}
              onClick={() => update({ sex: sex as PlannerSex })}
            />
          ))}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {QUICK_START_GOALS.map((goal) => (
            <OptionButton
              key={goal}
              label={goal}
              active={draft.goal === goal}
              onClick={() => update({ goal: goal as QuickStartGoal })}
            />
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((level) => (
            <OptionButton
              key={level}
              label={level}
              active={draft.level === level}
              onClick={() => update({ level: level as PlannerLevel })}
            />
          ))}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {LOCATIONS.map((location) => {
            const Icon = LOCATION_ICON[location.id];
            const active = draft.location === location.id;
            return (
              <button
                key={location.id}
                type="button"
                aria-pressed={active}
                onClick={() => update({ location: location.id as LocationTag })}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition",
                  active
                    ? "border-deep bg-vivid/12 text-deep"
                    : "border-line bg-canvas text-muted hover:border-vivid hover:text-ink",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {location.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <OptionButton
              label="Nenhum"
              active={!draft.unknownEquipment && draft.equipment.length === 0}
              onClick={() => update({ equipment: [], unknownEquipment: false })}
            />
            <OptionButton
              label="Não sei / deixe o Movia escolher"
              active={draft.unknownEquipment}
              onClick={() => update({ equipment: [], unknownEquipment: true })}
            />
          </div>
          <p className="text-xs text-muted">Básicos</p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_TAGS.filter((item) => item.group === "basic").map((item) => (
              <OptionButton
                key={item.id}
                label={item.label}
                active={!draft.unknownEquipment && draft.equipment.includes(item.id)}
                onClick={() => toggleEquipment(item.id)}
              />
            ))}
          </div>
          <p className="text-xs text-muted">Academia</p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_TAGS.filter((item) => item.group === "gym").map((item) => (
              <OptionButton
                key={item.id}
                label={item.label}
                active={!draft.unknownEquipment && draft.equipment.includes(item.id)}
                onClick={() => toggleEquipment(item.id)}
              />
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Se você não souber o que tem, o Movia assume nenhum equipamento —
            o treino continua executável.
          </p>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-3">
          <OptionButton
            label="Corpo inteiro"
            active={draft.fullBody}
            onClick={() =>
              update({ fullBody: true, muscles: [...MUSCLE_GROUPS] })
            }
          />
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((muscle) => (
              <button
                key={muscle}
                type="button"
                aria-pressed={!draft.fullBody && draft.muscles.includes(muscle)}
                onClick={() => toggleMuscle(muscle)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  !draft.fullBody && draft.muscles.includes(muscle)
                    ? "border-deep bg-vivid/15 text-deep"
                    : "border-line bg-canvas text-muted hover:border-vivid hover:text-deep",
                )}
              >
                {muscle}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 6 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {QUICK_START_MINUTES.map((minutes) => (
            <OptionButton
              key={minutes}
              label={minutes === 75 ? "+60 min" : `${minutes} min`}
              active={draft.minutes === minutes}
              onClick={() => update({ minutes })}
            />
          ))}
        </div>
      ) : null}

      {step === 7 ? (
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((count) => (
            <OptionButton
              key={count}
              label={String(count)}
              active={draft.daysPerWeek === count}
              onClick={() => update({ daysPerWeek: count })}
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-[#8A3418]">
          {error}
        </p>
      ) : null}

      {draft.unknownEquipment ? (
        <Badge tone="neutral">Sem equipamento assumido</Badge>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((current) => current - 1)}
            className={buttonClasses("secondary")}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Voltar
          </button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canAdvance()}
            onClick={() => setStep((current) => current + 1)}
            className={buttonClasses("primary")}
          >
            Continuar
            <ArrowRight className="size-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => generate(draft)}
            className={buttonClasses("primary")}
          >
            <Sparkles className="size-4" aria-hidden />
            Montar meu treino
          </button>
        )}
      </div>

      <p className="text-xs leading-relaxed text-muted">{SURPRISE_COPY}</p>
    </div>
  );
}
