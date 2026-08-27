"use client";

import { ExternalLink, Play, ScanLine, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Badge, buttonClasses } from "@/components/ui/primitives";
import { youtubeThumbnail } from "@/lib/catalog";
import type { Exercise } from "@/lib/types";

interface ExerciseModalProps {
  exercise: Exercise;
  onClose: () => void;
  onAnalyze: (exercise: Exercise) => void;
}

export function ExerciseModal({
  exercise,
  onClose,
  onAnalyze,
}: ExerciseModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/45 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fechar detalhes do exercício"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercicio-titulo"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[24px] border border-line bg-surface shadow-lift sm:rounded-[24px]"
        style={{ animation: "movia-rise 200ms ease-out" }}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="min-w-0">
            <p className="eyebrow">{exercise.muscleGroup}</p>
            <h2
              id="exercicio-titulo"
              className="mt-1 truncate text-2xl font-[830] tracking-tight"
            >
              {exercise.name}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-full border border-line p-2 text-muted transition hover:border-vivid hover:text-deep"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden rounded-[18px] border border-line bg-night"
          >
            <Image
              src={youtubeThumbnail(exercise.videoId)}
              alt={`Miniatura do vídeo oficial de ${exercise.name}`}
              width={480}
              height={360}
              unoptimized
              className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-night/25 transition group-hover:bg-night/15">
              <span className="flex size-14 items-center justify-center rounded-full bg-surface/95 text-deep shadow-lift">
                <Play className="size-6 translate-x-0.5 fill-current" aria-hidden />
              </span>
            </span>
          </a>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{exercise.equipment}</Badge>
            <Badge tone="neutral">{exercise.difficulty}</Badge>
            <Badge tone="neutral">Câmera: {exercise.cameraView}</Badge>
            {exercise.analyzable ? (
              <Badge tone="vivid">
                <ScanLine className="size-3.5" aria-hidden />
                Analisa vídeo
              </Badge>
            ) : null}
          </div>

          <p className="text-base leading-relaxed text-muted">
            {exercise.description}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-canvas p-4">
              <p className="eyebrow">Músculo principal</p>
              <p className="mt-1.5 text-sm font-semibold">
                {exercise.muscleGroup}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-canvas p-4">
              <p className="eyebrow">Também trabalha</p>
              <p className="mt-1.5 text-sm font-semibold">
                {exercise.secondaryMuscles.join(" · ")}
              </p>
            </div>
          </div>

          <div>
            <p className="eyebrow">Como executar</p>
            <ol className="mt-3 space-y-3">
              {exercise.steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-canvas text-xs font-bold text-deep">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-muted">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-[#F0E2B6] bg-[#FFF8E3] p-4">
            <p className="text-[11px] font-bold tracking-[0.14em] text-[#7A5A0E] uppercase">
              Erro comum
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#7A5A0E]">
              {exercise.commonMistake}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("dark", "flex-1")}
            >
              Assistir execução correta
              <ExternalLink className="size-4" aria-hidden />
            </a>
            {exercise.analyzable ? (
              <button
                type="button"
                onClick={() => onAnalyze(exercise)}
                className={buttonClasses("primary", "flex-1")}
              >
                <ScanLine className="size-4" aria-hidden />
                Analisar meu vídeo
              </button>
            ) : null}
          </div>

          <p className="text-xs leading-relaxed text-muted">
            Fonte do vídeo: {exercise.videoSource}. O conteúdo abre no YouTube em
            uma nova aba.
          </p>
        </div>
      </div>
    </div>
  );
}
