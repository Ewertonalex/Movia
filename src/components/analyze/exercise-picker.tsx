"use client";

import { Check } from "lucide-react";
import { ANALYSIS_PROFILES, type CameraAngle } from "@/lib/analysis/profiles";
import { StepLabel } from "@/components/ui/primitives";
import type { AnalysisProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const CAMERA_LABEL: Record<CameraAngle, string> = {
  lateral: "Lateral",
  frontal: "Frontal",
};

interface ExercisePickerProps {
  selected: AnalysisProfile;
  cameraView: CameraAngle;
  onSelect: (profile: AnalysisProfile) => void;
  onCameraChange: (view: CameraAngle) => void;
}

export function ExercisePicker({
  selected,
  cameraView,
  onSelect,
  onCameraChange,
}: ExercisePickerProps) {
  const activeProfile =
    ANALYSIS_PROFILES.find((profile) => profile.id === selected) ??
    ANALYSIS_PROFILES[0];

  return (
    <section aria-labelledby="passo-01" className="space-y-6">
      <div className="space-y-3">
        <StepLabel step="PASSO 01" title="O que você vai treinar?" />
        <p id="passo-01" className="max-w-2xl text-base text-muted">
          Escolha o movimento para ajustar as referências de análise e o ângulo
          de gravação.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ANALYSIS_PROFILES.map((profile) => {
          const isActive = profile.id === selected;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSelect(profile.id)}
              aria-pressed={isActive}
              className={cn(
                "group card-base flex flex-col gap-4 p-5 text-left transition-all duration-200",
                isActive
                  ? "border-deep shadow-lift ring-2 ring-vivid/35"
                  : "hover:-translate-y-0.5 hover:border-vivid/60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-2xl text-sm font-[830] tracking-tight transition",
                    isActive
                      ? "bg-night text-lime"
                      : "bg-canvas text-ink group-hover:bg-vivid/15 group-hover:text-deep",
                  )}
                >
                  {profile.code}
                </span>
                {isActive ? (
                  <span className="flex size-6 items-center justify-center rounded-full bg-vivid text-night">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <p className="text-[1.05rem] leading-tight font-[800] tracking-tight">
                  {profile.name}
                </p>
                <p className="text-sm leading-relaxed text-muted">
                  {profile.summary}
                </p>
              </div>
              <p className="text-xs font-semibold text-muted">
                {profile.cameraAngles.length > 1
                  ? "Lateral ou frontal"
                  : "Câmera lateral"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="card-base flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-[800] tracking-tight">Ângulo da câmera</p>
          <p className="mt-1 text-sm text-muted">
            {activeProfile.cameraAngles.length > 1
              ? "O agachamento aceita gravação lateral ou frontal."
              : `${activeProfile.name} é analisado com a câmera lateral.`}
          </p>
        </div>
        <div
          role="group"
          aria-label="Ângulo da câmera"
          className="flex gap-2 rounded-full border border-line bg-canvas p-1"
        >
          {(["lateral", "frontal"] as CameraAngle[]).map((angle) => {
            const enabled = activeProfile.cameraAngles.includes(angle);
            const isActive = cameraView === angle && enabled;
            return (
              <button
                key={angle}
                type="button"
                disabled={!enabled}
                aria-pressed={isActive}
                onClick={() => onCameraChange(angle)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-night text-surface"
                    : enabled
                      ? "text-muted hover:text-ink"
                      : "cursor-not-allowed text-muted/45",
                )}
              >
                {CAMERA_LABEL[angle]}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
