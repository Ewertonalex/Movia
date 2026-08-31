"use client";

import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  Gauge,
  Pause,
  Play,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PoseOverlay } from "@/components/analyze/pose-overlay";
import { ReferenceExecution } from "@/components/analyze/reference-execution";
import { Badge, buttonClasses, Eyebrow } from "@/components/ui/primitives";
import { cycleCountLabel, type ProfileConfig } from "@/lib/analysis/profiles";
import type { AnalysisResult, Exercise, Finding, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITY_STYLE: Record<
  Severity,
  { label: string; tone: string; icon: typeof CircleAlert }
> = {
  atencao: {
    label: "Merece atenção",
    tone: "bg-[#FDF1ED] text-[#8A3418] border-[#F3D2C9]",
    icon: TriangleAlert,
  },
  ajuste: {
    label: "Ajuste fino",
    tone: "bg-[#FFF8E3] text-[#7A5A0E] border-[#F0E2B6]",
    icon: CircleAlert,
  },
  ok: {
    label: "Consistente",
    tone: "bg-vivid/10 text-deep border-vivid/30",
    icon: BadgeCheck,
  },
};

interface ResultsPanelProps {
  analysis: AnalysisResult;
  profile: ProfileConfig;
  videoUrl: string | null;
  fromHistory?: boolean;
  referenceExercise: Exercise | undefined;
  onRestart: () => void;
}

export function ResultsPanel({
  analysis,
  profile,
  videoUrl,
  fromHistory = false,
  referenceExercise,
  onRestart,
}: ResultsPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pinnedCycle, setPinnedCycle] = useState<number | null>(null);

  const totalDuration = analysis.durationSeconds || 1;

  /** O ciclo em foco acompanha o vídeo, a menos que o tempo esteja num intervalo vazio. */
  const activeCycle = useMemo(() => {
    const fromTime = analysis.cycles.find(
      (cycle) => currentTime >= cycle.startTime && currentTime <= cycle.endTime,
    )?.index;
    if (fromTime !== undefined) return fromTime;
    return pinnedCycle ?? analysis.cycles[0]?.index ?? 1;
  }, [analysis.cycles, currentTime, pinnedCycle]);

  const focusCycle = useCallback((index: number, startTime: number) => {
    setPinnedCycle(index);
    setCurrentTime(startTime);
    const video = videoRef.current;
    if (video) video.currentTime = startTime;
  }, []);

  useEffect(() => {
    if (!analysis.demo || !playing) return;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setCurrentTime((time) => (time + delta > totalDuration ? 0 : time + delta));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [analysis.demo, playing, totalDuration]);

  const togglePlay = useCallback(() => {
    if (analysis.demo) {
      setPlaying((value) => !value);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }, [analysis.demo]);

  const findingsByCycle = useMemo(() => {
    const map = new Map<number, Finding[]>();
    for (const finding of analysis.findings) {
      const list = map.get(finding.cycleIndex) ?? [];
      list.push(finding);
      map.set(finding.cycleIndex, list);
    }
    return map;
  }, [analysis.findings]);

  const activeFindings = findingsByCycle.get(activeCycle) ?? [];
  const cycleNoun = profile.cycleNoun;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Eyebrow>Análise concluída</Eyebrow>
          <h1 className="display-lg max-w-xl">
            {cycleCountLabel(profile, analysis.cycles.length)}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="vivid">{profile.name}</Badge>
            <Badge tone="neutral">
              Câmera {analysis.cameraView === "frontal" ? "frontal" : "lateral"}
            </Badge>
            {analysis.demo ? <Badge tone="lime">Demonstração</Badge> : null}
            {fromHistory ? (
              <Badge tone="neutral">Salva neste aparelho</Badge>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="rounded-[18px] border border-line bg-surface px-5 py-4 text-right">
            <p className="eyebrow">Consistência</p>
            <p className="mt-1 text-4xl leading-none font-[850] tracking-tighter">
              {analysis.consistency}
            </p>
          </div>
          <button
            type="button"
            onClick={onRestart}
            className={buttonClasses("secondary")}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Nova análise
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <section className="card-base overflow-hidden">
          <div className="relative aspect-video w-full bg-night">
            {analysis.demo ? (
              <div className="absolute inset-0 bg-gradient-to-br from-[#132B20] to-[#0B1A13]">
                <div className="movia-lines absolute inset-0 opacity-30" />
              </div>
            ) : videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                muted
                onTimeUpdate={(event) =>
                  setCurrentTime(event.currentTarget.currentTime)
                }
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                className="size-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#132B20] to-[#0B1A13] px-8 text-center">
                <p className="max-w-sm text-sm leading-relaxed text-surface/80">
                  O vídeo ficou no seu aparelho e não foi salvo. Os ciclos,
                  scores e recomendações continuam aqui.
                </p>
              </div>
            )}

            <PoseOverlay frames={analysis.frames} time={currentTime} />

            <div className="absolute top-3 left-3 rounded-full bg-night/85 px-3 py-1.5 text-xs font-semibold text-surface">
              {cycleNoun.one.charAt(0).toUpperCase() + cycleNoun.one.slice(1)}{" "}
              {activeCycle} de {analysis.cycles.length}
            </div>

            {videoUrl || analysis.demo ? (
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pausar vídeo" : "Reproduzir vídeo"}
                className="absolute right-3 bottom-3 flex size-12 items-center justify-center rounded-full bg-surface/95 text-night shadow-lift transition hover:bg-surface"
              >
                {playing ? (
                  <Pause className="size-5 fill-current" aria-hidden />
                ) : (
                  <Play className="size-5 translate-x-0.5 fill-current" aria-hidden />
                )}
              </button>
            ) : null}
          </div>

          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Linha do tempo</p>
              <p className="text-xs text-muted">
                Clique em uma {cycleNoun.one} para revisar
              </p>
            </div>

            <div className="relative h-12 overflow-hidden rounded-xl bg-canvas">
              {analysis.cycles.map((cycle) => {
                const left = (cycle.startTime / totalDuration) * 100;
                const width = Math.max(
                  ((cycle.endTime - cycle.startTime) / totalDuration) * 100,
                  4,
                );
                const isActive = cycle.index === activeCycle;
                return (
                  <button
                    key={cycle.index}
                    type="button"
                    onClick={() => focusCycle(cycle.index, cycle.startTime)}
                    aria-pressed={isActive}
                    aria-label={`Ir para a ${cycleNoun.one} ${cycle.index}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    className={cn(
                      "absolute inset-y-1 rounded-lg border text-[11px] font-bold transition",
                      isActive
                        ? "border-deep bg-vivid text-night"
                        : "border-line bg-surface text-muted hover:border-vivid",
                    )}
                  >
                    {cycle.index}
                  </button>
                );
              })}
              <span
                style={{
                  left: `${Math.min((currentTime / totalDuration) * 100, 100)}%`,
                }}
                className="pointer-events-none absolute inset-y-0 w-0.5 bg-night/70"
                aria-hidden
              />
            </div>
          </div>
        </section>

        <section
          aria-live="polite"
          className="card-base flex flex-col gap-4 p-5 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-[800] tracking-tight">
              {cycleNoun.one.charAt(0).toUpperCase() + cycleNoun.one.slice(1)}{" "}
              {activeCycle}
            </p>
            <Badge tone="neutral">
              <Gauge className="size-3.5" aria-hidden />
              Score{" "}
              {analysis.cycles.find((cycle) => cycle.index === activeCycle)
                ?.score ?? "—"}
            </Badge>
          </div>

          {activeFindings.length === 0 ? (
            <div className="rounded-2xl border border-vivid/30 bg-vivid/8 p-4">
              <p className="text-sm font-semibold text-deep">
                Sem desvios acima das referências nesta {cycleNoun.one}.
              </p>
              <p className="mt-1 text-sm text-muted">
                Continue com esse padrão e observe as outras {cycleNoun.many}.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {activeFindings.map((finding) => {
                const style = SEVERITY_STYLE[finding.severity];
                const Icon = style.icon;
                return (
                  <li
                    key={finding.id}
                    className="rounded-[18px] border border-line bg-canvas/60 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          style.tone,
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden />
                        {style.label}
                      </span>
                      <span className="text-[11px] font-semibold text-muted">
                        Confiança {finding.confidenceLabel}
                      </span>
                      <span className="text-[11px] text-muted">
                        {finding.timestamp.toFixed(1)}s
                      </span>
                    </div>
                    <p className="mt-2.5 text-[0.95rem] font-[800] tracking-tight">
                      {finding.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {finding.detail}
                    </p>
                    <div className="mt-3 rounded-xl border border-line bg-surface px-3 py-2.5">
                      <p className="text-[11px] font-bold tracking-[0.14em] text-deep uppercase">
                        Experimente assim
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink">
                        {finding.cue}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card-base p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-[800] tracking-tight">
            {cycleNoun.one.charAt(0).toUpperCase() + cycleNoun.one.slice(1)} por{" "}
            {cycleNoun.one}
          </p>
          <p className="text-xs text-muted">
            {analysis.validFrames} frames válidos de {analysis.sampledFrames}{" "}
            amostrados
          </p>
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {analysis.cycles.map((cycle) => {
            const cycleFindings = findingsByCycle.get(cycle.index) ?? [];
            const alerts = cycleFindings.filter(
              (finding) => finding.severity !== "ok",
            ).length;
            const isActive = cycle.index === activeCycle;
            return (
              <li key={cycle.index}>
                <button
                  type="button"
                  onClick={() => focusCycle(cycle.index, cycle.startTime)}
                  aria-pressed={isActive}
                  className={cn(
                    "w-full rounded-[18px] border p-4 text-left transition",
                    isActive
                      ? "border-deep bg-vivid/8"
                      : "border-line bg-surface hover:border-vivid",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-[800] tracking-tight">
                      {cycleNoun.one.charAt(0).toUpperCase() +
                        cycleNoun.one.slice(1)}{" "}
                      {cycle.index}
                    </p>
                    <span className="text-2xl leading-none font-[850] tracking-tighter">
                      {cycle.score}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    {cycle.duration.toFixed(2)}s · mínimo {cycle.minAngle}°
                  </p>
                  <p className="mt-2 text-xs font-semibold text-muted">
                    {alerts === 0
                      ? "Sem alertas"
                      : `${alerts} ${alerts === 1 ? "ponto de atenção" : "pontos de atenção"}`}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {referenceExercise ? (
        <ReferenceExecution exercise={referenceExercise} />
      ) : null}

      <p className="rounded-[18px] border border-line bg-surface px-5 py-4 text-xs leading-relaxed text-muted">
        Resultado visual, não diagnóstico. Estimativas a partir de vídeo podem
        errar, principalmente com roupas largas, pouca luz ou câmera instável.
        Dor, desconforto persistente ou limitação de movimento pedem avaliação
        de um profissional qualificado.
      </p>
    </div>
  );
}
