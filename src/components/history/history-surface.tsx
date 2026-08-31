"use client";

import { CalendarDays, ScanLine, Sparkles, Trash2 } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Badge, buttonClasses, Eyebrow } from "@/components/ui/primitives";
import {
  getHistorySnapshot,
  getServerHistorySnapshot,
  removeAnalysis,
  subscribeToHistory,
} from "@/lib/analysis/history";
import { cycleCountLabel, getProfile } from "@/lib/analysis/profiles";
import type { SavedAnalysis } from "@/lib/types";

interface HistorySurfaceProps {
  onOpen: (saved: SavedAnalysis) => void;
  onAnalyze: () => void;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Data desconhecida";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function HistorySurface({ onOpen, onAnalyze }: HistorySurfaceProps) {
  const items = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    getServerHistorySnapshot,
  );

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 sm:px-6 lg:px-10">
      <section className="space-y-5 py-10 lg:py-14">
        <Eyebrow>Histórico local</Eyebrow>
        <h1 className="display-xl max-w-2xl">
          Minhas análises.
          <br />
          <span className="text-vivid">Só neste aparelho.</span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted">
          Cada resultado fica no banco do seu navegador. O vídeo nunca é
          enviado nem gravado — só o que a leitura enxergou: ciclos, scores e
          recomendações.
        </p>
        <Badge tone="vivid">
          <Sparkles className="size-3.5" aria-hidden />
          {items.length} {items.length === 1 ? "análise salva" : "análises salvas"}
        </Badge>
      </section>

      {items.length === 0 ? (
        <section className="card-base flex flex-col items-center gap-4 px-6 py-16 text-center">
          <CalendarDays className="size-6 text-muted" aria-hidden />
          <p className="text-lg font-[830] tracking-tight">
            Nenhuma análise ainda
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Analise um vídeo ou rode a demonstração. Na próxima visita, o
            resultado continua aqui.
          </p>
          <button
            type="button"
            onClick={onAnalyze}
            className={buttonClasses("primary")}
          >
            <ScanLine className="size-4" aria-hidden />
            Analisar um movimento
          </button>
        </section>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const profile = getProfile(item.profile);
            return (
              <li key={item.id} className="card-base flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">{formatWhen(item.createdAt)}</p>
                    <p className="mt-1 text-xl font-[830] tracking-tight">
                      {item.exerciseName}
                    </p>
                  </div>
                  <p className="text-3xl leading-none font-[850] tracking-tighter">
                    {item.consistency}
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {cycleCountLabel(profile, item.cycles.length)} · câmera{" "}
                  {item.cameraView}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.demo ? <Badge tone="lime">Demonstração</Badge> : null}
                  <Badge tone="neutral">
                    {item.validFrames} frames válidos
                  </Badge>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    className={buttonClasses("secondary", "flex-1")}
                  >
                    Ver resultado
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeAnalysis(item.id)}
                    aria-label={`Apagar análise de ${item.exerciseName}`}
                    className={buttonClasses("ghost", "text-muted")}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
