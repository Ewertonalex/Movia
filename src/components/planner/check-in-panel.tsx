"use client";

import { useState } from "react";
import { buttonClasses, OptionButton } from "@/components/ui/primitives";
import {
  CHECK_IN_DAYS,
  nextPlannerLevel,
  shouldSuggestRaise,
} from "@/lib/profile/check-in";
import { firstName } from "@/lib/profile/storage";
import type { CheckInFeeling, WeeklyPlan } from "@/lib/types";

const FEELINGS: { id: CheckInFeeling; label: string }[] = [
  { id: "facil", label: "Está fácil" },
  { id: "adequado", label: "Está adequado" },
  { id: "dificil", label: "Está pesado" },
];

interface CheckInPanelProps {
  plan: WeeklyPlan;
  displayName: string | null;
  onRenew: (feeling: CheckInFeeling, raiseLevel: boolean) => void;
  onKeep: (feeling: CheckInFeeling) => void;
  onDismiss: () => void;
}

export function CheckInPanel({
  plan,
  displayName,
  onRenew,
  onKeep,
  onDismiss,
}: CheckInPanelProps) {
  const [feeling, setFeeling] = useState<CheckInFeeling | null>(null);
  const name = firstName(displayName);
  const suggestRaise = shouldSuggestRaise(plan.input.level, feeling);
  const next = nextPlannerLevel(plan.input.level);

  return (
    <div className="card-base space-y-4 border-vivid/35 p-5 sm:p-6">
      <div className="space-y-1">
        <p className="text-sm font-[820] tracking-tight">
          {name ? `${name}, faz cerca de ${CHECK_IN_DAYS} dias` : `Faz cerca de ${CHECK_IN_DAYS} dias`}{" "}
          com esta rotina
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Isso não é avaliação de saúde. É só para decidir se vale renovar o
          treino. Se algo doer ou preocupar, procure um profissional.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="eyebrow">Como você tem se sentido?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {FEELINGS.map((item) => (
            <OptionButton
              key={item.id}
              label={item.label}
              active={feeling === item.id}
              onClick={() => setFeeling(item.id)}
            />
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        {suggestRaise ? (
          <button
            type="button"
            disabled={!feeling}
            onClick={() => feeling && onRenew(feeling, true)}
            className={buttonClasses(
              feeling === "facil" ? "primary" : "secondary",
            )}
          >
            Renovar e subir para {next}
          </button>
        ) : null}
        <button
          type="button"
          disabled={!feeling}
          onClick={() => feeling && onKeep(feeling)}
          className={buttonClasses(
            feeling === "facil" && suggestRaise ? "secondary" : "primary",
          )}
        >
          Renovar no mesmo nível
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className={buttonClasses("ghost", "text-muted")}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
