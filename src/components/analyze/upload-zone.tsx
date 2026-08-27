"use client";

import { AlertTriangle, PlayCircle, UploadCloud, Video } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { StepLabel, buttonClasses } from "@/components/ui/primitives";
import type { ProfileConfig } from "@/lib/analysis/profiles";
import { UPLOAD_LIMITS } from "@/lib/analysis/profiles";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  profile: ProfileConfig;
  error: string | null;
  onFile: (file: File) => void;
  onDemo: () => void;
}

export function UploadZone({ profile, error, onFile, onDemo }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <section aria-labelledby="passo-02" className="space-y-6">
      <div className="space-y-3">
        <StepLabel step="PASSO 02" title="Envie o seu vídeo" />
        <p id="passo-02" className="max-w-2xl text-base text-muted">
          O arquivo fica no seu dispositivo. Nada é enviado para servidores.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "card-base flex flex-col items-center justify-center gap-5 px-6 py-12 text-center transition",
            dragging ? "border-deep bg-vivid/8" : "border-dashed",
          )}
        >
          <span className="flex size-14 items-center justify-center rounded-2xl bg-vivid/12 text-deep">
            <UploadCloud className="size-7" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <p className="text-lg font-[830] tracking-tight">
              Arraste o vídeo aqui
            </p>
            <p className="text-sm text-muted">
              MP4, MOV ou WebM · até 250 MB e 45 segundos
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={buttonClasses("primary")}
            >
              <Video className="size-4" aria-hidden />
              Escolher vídeo
            </button>
            <button
              type="button"
              onClick={onDemo}
              className={buttonClasses("ghost", "text-sm text-muted")}
            >
              <PlayCircle className="size-4" aria-hidden />
              Ver uma análise de demonstração
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={UPLOAD_LIMITS.acceptAttribute}
            className="sr-only"
            aria-label="Escolher vídeo do treino"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              event.target.value = "";
            }}
          />

          {error ? (
            <p
              role="alert"
              className="flex max-w-md items-start gap-2 rounded-2xl border border-[#F3D2C9] bg-[#FDF1ED] px-4 py-3 text-left text-sm text-[#8A3418]"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          ) : null}
        </div>

        <aside className="card-base space-y-4 p-6">
          <p className="eyebrow">Guia de gravação</p>
          <ul className="space-y-3">
            {profile.recordingTips.map((tip, index) => (
              <li key={tip} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-canvas text-xs font-bold text-deep">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-muted">{tip}</span>
              </li>
            ))}
          </ul>
          <p className="rounded-2xl bg-canvas px-4 py-3 text-xs leading-relaxed text-muted">
            Resultado visual, não diagnóstico. Estimativas por vídeo têm margem
            de erro.
          </p>
        </aside>
      </div>
    </section>
  );
}
