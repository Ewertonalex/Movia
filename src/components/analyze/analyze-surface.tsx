"use client";

import {
  Activity,
  Cpu,
  EyeOff,
  Loader2,
  ScanLine,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BodyFigure } from "@/components/analyze/body-figure";
import { ExercisePicker } from "@/components/analyze/exercise-picker";
import { ResultsPanel } from "@/components/analyze/results-panel";
import { UploadZone } from "@/components/analyze/upload-zone";
import { Badge, buttonClasses, Eyebrow } from "@/components/ui/primitives";
import { buildDemoAnalysis } from "@/lib/analysis/demo";
import { buildAnalysis } from "@/lib/analysis/feedback";
import { getProfile, type CameraAngle } from "@/lib/analysis/profiles";
import {
  AnalysisError,
  PROGRESS_MESSAGES,
  extractPoseFrames,
  type ProgressStage,
} from "@/lib/analysis/pose";
import {
  readVideoDuration,
  validateDuration,
  validateVideoFile,
} from "@/lib/analysis/upload";
import { getExerciseById } from "@/lib/catalog";
import type { AnalysisProfile, AnalysisResult, Exercise } from "@/lib/types";
import { cn, formatBytes, formatSeconds } from "@/lib/utils";

type Stage = "choose" | "ready" | "analyzing" | "results";

const PROGRESS_ORDER: ProgressStage[] = [
  "model",
  "landmarks",
  "cycles",
  "recommendations",
];

interface AnalyzeSurfaceProps {
  catalog: Exercise[];
  initialProfile: AnalysisProfile;
}

export function AnalyzeSurface({
  catalog,
  initialProfile,
}: AnalyzeSurfaceProps) {
  const [profileId, setProfileId] = useState<AnalysisProfile>(initialProfile);
  const [cameraView, setCameraView] = useState<CameraAngle>(
    getProfile(initialProfile).defaultCamera,
  );
  const [stage, setStage] = useState<Stage>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    stage: ProgressStage;
    ratio: number;
  }>({ stage: "model", ratio: 0 });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const profile = getProfile(profileId);

  const releaseVideo = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    releaseVideo();
    setFile(null);
    setVideoUrl(null);
    setDuration(0);
    setAnalysis(null);
    setError(null);
    setStage("choose");
    setProgress({ stage: "model", ratio: 0 });
  }, [releaseVideo]);

  useEffect(() => () => releaseVideo(), [releaseVideo]);

  const handleProfileChange = useCallback((next: AnalysisProfile) => {
    setProfileId(next);
    const nextProfile = getProfile(next);
    setCameraView((current) =>
      nextProfile.cameraAngles.includes(current)
        ? current
        : nextProfile.defaultCamera,
    );
    setError(null);
  }, []);

  const handleFile = useCallback(
    async (nextFile: File) => {
      setError(null);
      const rejection = validateVideoFile(nextFile);
      if (rejection) {
        setError(rejection.message);
        return;
      }

      releaseVideo();
      const url = URL.createObjectURL(nextFile);
      objectUrlRef.current = url;

      try {
        const seconds = await readVideoDuration(url);
        const durationRejection = validateDuration(seconds);
        if (durationRejection) {
          releaseVideo();
          setError(durationRejection.message);
          return;
        }
        setFile(nextFile);
        setVideoUrl(url);
        setDuration(seconds);
        setStage("ready");
      } catch {
        releaseVideo();
        setError(
          "Não conseguimos ler este vídeo. Tente exportar novamente em MP4, MOV ou WebM.",
        );
      }
    },
    [releaseVideo],
  );

  const handleDemo = () => {
    setError(null);
    setProfileId("squat");
    setCameraView("lateral");
    releaseVideo();
    setFile(null);
    setVideoUrl(null);
    setAnalysis(buildDemoAnalysis());
    setStage("results");
  };

  const waitForVideo = (video: HTMLVideoElement) =>
    new Promise<void>((resolve) => {
      if (video.readyState >= 2) {
        resolve();
        return;
      }
      video.addEventListener("loadeddata", () => resolve(), { once: true });
      video.load();
    });

  const runAnalysis = async () => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setStage("analyzing");
    setError(null);
    setProgress({ stage: "model", ratio: 0.02 });

    try {
      await waitForVideo(video);
      const extraction = await extractPoseFrames(video, (nextStage, ratio) =>
        setProgress({ stage: nextStage, ratio }),
      );

      setProgress({ stage: "recommendations", ratio: 0.92 });

      const result = buildAnalysis({
        profile,
        cameraView,
        frames: extraction.frames,
        durationSeconds: extraction.durationSeconds,
        sampledFrames: extraction.sampledFrames,
        validFrames: extraction.validFrames,
      });

      if (result.cycles.length === 0) {
        setError(profile.emptyCycleMessage);
        setStage("ready");
        return;
      }

      setAnalysis(result);
      setProgress({ stage: "recommendations", ratio: 1 });
      setStage("results");
    } catch (caught) {
      const message =
        caught instanceof AnalysisError
          ? caught.message
          : "Algo deu errado durante a análise. Recarregue a página e tente novamente com um vídeo mais curto.";
      setError(message);
      setStage("ready");
    }
  };

  if (stage === "results" && analysis) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6 lg:px-10">
        <ResultsPanel
          analysis={analysis}
          profile={getProfile(analysis.profile)}
          videoUrl={videoUrl}
          referenceExercise={getExerciseById(
            getProfile(analysis.profile).referenceExerciseId,
            catalog,
          )}
          onRestart={reset}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 sm:px-6 lg:px-10">
      <section className="grid items-center gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
        <div className="space-y-6">
          <Eyebrow>Workout form coach</Eyebrow>
          <h1 className="display-xl">
            Seu movimento.
            <br />
            <span className="text-vivid">Mais consciente.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Envie um vídeo curto. A gente identifica cada repetição ou passada,
            destaca o que merece atenção e mostra como melhorar.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="vivid">
              <Cpu className="size-3.5" aria-hidden />
              Processado no dispositivo
            </Badge>
            <Badge tone="neutral">
              <EyeOff className="size-3.5" aria-hidden />
              Sem reconhecimento facial
            </Badge>
          </div>
        </div>

        <BodyFigure className="max-w-md justify-self-center lg:justify-self-end" />
      </section>

      <div className="space-y-12">
        <ExercisePicker
          selected={profileId}
          cameraView={cameraView}
          onSelect={handleProfileChange}
          onCameraChange={setCameraView}
        />

        {stage === "choose" ? (
          <UploadZone
            profile={profile}
            error={error}
            onFile={(nextFile) => void handleFile(nextFile)}
            onDemo={handleDemo}
          />
        ) : null}

        {(stage === "ready" || stage === "analyzing") && videoUrl ? (
          <section className="space-y-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="rounded-full bg-night px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-lime">
                PASSO 02
              </span>
              <h2 className="display-md">
                {stage === "analyzing"
                  ? "Analisando o seu movimento"
                  : "Confira antes de analisar"}
              </h2>
            </div>

            <div className="card-base grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1fr]">
              <div className="overflow-hidden rounded-[18px] border border-line bg-night">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  playsInline
                  muted
                  controls={stage === "ready"}
                  preload="auto"
                  className="aspect-video w-full object-contain"
                />
              </div>

              <div className="flex flex-col justify-between gap-5">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="eyebrow">Arquivo</dt>
                    <dd className="mt-1 truncate text-sm font-semibold">
                      {file?.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Duração</dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {formatSeconds(duration)}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Exercício</dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {profile.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Ângulo</dt>
                    <dd className="mt-1 text-sm font-semibold capitalize">
                      {cameraView}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Tamanho</dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {file ? formatBytes(file.size) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Privacidade</dt>
                    <dd className="mt-1 text-sm font-semibold text-deep">
                      Processado no dispositivo
                    </dd>
                  </div>
                </dl>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-2xl border border-[#F3D2C9] bg-[#FDF1ED] px-4 py-3 text-sm leading-relaxed text-[#8A3418]"
                  >
                    {error}
                  </p>
                ) : null}

                {stage === "ready" ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void runAnalysis()}
                      className={buttonClasses("primary")}
                    >
                      <ScanLine className="size-4" aria-hidden />
                      Analisar meu movimento
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className={buttonClasses("secondary")}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Trocar vídeo
                    </button>
                  </div>
                ) : (
                  <div aria-live="polite" className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Loader2
                        className="size-5 animate-spin text-deep"
                        aria-hidden
                      />
                      <p className="text-base font-[800] tracking-tight">
                        {PROGRESS_MESSAGES[progress.stage]}
                      </p>
                    </div>

                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(progress.ratio * 100)}
                      aria-label="Progresso da análise"
                      className="h-2.5 w-full overflow-hidden rounded-full bg-canvas"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-vivid to-deep transition-[width] duration-300"
                        style={{
                          width: `${Math.max(progress.ratio * 100, 4)}%`,
                        }}
                      />
                    </div>

                    <ul className="space-y-2">
                      {PROGRESS_ORDER.map((item) => {
                        const done =
                          PROGRESS_ORDER.indexOf(item) <
                          PROGRESS_ORDER.indexOf(progress.stage);
                        const active = item === progress.stage;
                        return (
                          <li
                            key={item}
                            className={cn(
                              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                              active
                                ? "border-deep bg-vivid/8 font-semibold text-deep"
                                : done
                                  ? "border-line bg-canvas text-muted"
                                  : "border-line bg-surface text-muted/70",
                            )}
                          >
                            <Activity className="size-3.5 shrink-0" aria-hidden />
                            {PROGRESS_MESSAGES[item]}
                          </li>
                        );
                      })}
                    </ul>

                    <p className="text-xs leading-relaxed text-muted">
                      Seu vídeo continua no dispositivo durante todo o
                      processamento.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {stage === "choose" ? (
          <section className="card-base flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-deep" aria-hidden />
              <div>
                <p className="text-base font-[800] tracking-tight">
                  Prefere ver funcionando antes?
                </p>
                <p className="mt-1 text-sm text-muted">
                  A demonstração usa um movimento sintético e passa pelo mesmo
                  motor de análise.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemo}
              className={buttonClasses("secondary", "shrink-0")}
            >
              Ver uma análise de demonstração
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
