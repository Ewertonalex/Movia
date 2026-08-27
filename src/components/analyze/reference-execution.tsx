"use client";

import { ExternalLink, Play } from "lucide-react";
import Image from "next/image";
import { youtubeThumbnail } from "@/lib/catalog";
import { buttonClasses, Eyebrow } from "@/components/ui/primitives";
import type { Exercise } from "@/lib/types";

export function ReferenceExecution({ exercise }: { exercise: Exercise }) {
  return (
    <section
      aria-labelledby="execucao-referencia"
      className="card-base overflow-hidden"
    >
      <div className="grid gap-0 lg:grid-cols-[1.05fr_1fr]">
        <div className="space-y-5 p-6 sm:p-8">
          <Eyebrow>Execução de referência</Eyebrow>
          <h2 id="execucao-referencia" className="display-md">
            Compare com uma execução bem feita.
          </h2>
          <div>
            <p className="text-lg font-[800] tracking-tight">{exercise.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {exercise.description}
            </p>
          </div>

          <ol className="space-y-3">
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

          <p className="rounded-2xl bg-canvas px-4 py-3 text-xs leading-relaxed text-muted">
            Respeite sua mobilidade e não treine com dor. Se algo incomodar,
            procure um profissional qualificado.
          </p>
        </div>

        <div className="relative border-t border-line bg-canvas p-6 sm:p-8 lg:border-t-0 lg:border-l">
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block overflow-hidden rounded-[18px] border border-line bg-night"
          >
            <span className="relative block aspect-video w-full">
              <Image
                src={youtubeThumbnail(exercise.videoId)}
                alt={`Miniatura do vídeo de referência de ${exercise.name}`}
                width={480}
                height={360}
                unoptimized
                className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-night/25 transition group-hover:bg-night/15">
                <span className="flex size-14 items-center justify-center rounded-full bg-surface/95 text-deep shadow-lift">
                  <Play className="size-6 translate-x-0.5 fill-current" aria-hidden />
                </span>
              </span>
            </span>
          </a>

          <p className="mt-3 text-xs text-muted">
            Fonte: {exercise.videoSource} · abre no YouTube em uma nova aba
          </p>

          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("dark", "mt-4 w-full")}
          >
            Assistir execução correta
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
