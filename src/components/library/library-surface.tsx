"use client";

import { Play, ScanLine, Search, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ExerciseModal } from "@/components/library/exercise-modal";
import { Badge, Eyebrow } from "@/components/ui/primitives";
import { MUSCLE_GROUPS, youtubeThumbnail } from "@/lib/catalog";
import type { Exercise, MuscleGroup } from "@/lib/types";
import { cn, normalizeText } from "@/lib/utils";

interface LibrarySurfaceProps {
  catalog: Exercise[];
  onAnalyze: (exercise: Exercise) => void;
}

type Filter = MuscleGroup | "Todos";

export function LibrarySurface({ catalog, onAnalyze }: LibrarySurfaceProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Todos");
  const [selected, setSelected] = useState<Exercise | null>(null);

  const analyzableCount = catalog.filter((item) => item.analyzable).length;
  const groupCount = new Set(catalog.map((item) => item.muscleGroup)).size;

  const filtered = useMemo(() => {
    const term = normalizeText(query);
    return catalog
      .filter((exercise) =>
        filter === "Todos" ? true : exercise.muscleGroup === filter,
      )
      .filter((exercise) => {
        if (!term) return true;
        const haystack = normalizeText(
          [
            exercise.name,
            exercise.muscleGroup,
            exercise.secondaryMuscles.join(" "),
            exercise.equipment,
          ].join(" "),
        );
        return haystack.includes(term);
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [catalog, filter, query]);

  const grouped = useMemo(() => {
    const map = new Map<MuscleGroup, Exercise[]>();
    for (const exercise of filtered) {
      const list = map.get(exercise.muscleGroup) ?? [];
      list.push(exercise);
      map.set(exercise.muscleGroup, list);
    }
    return MUSCLE_GROUPS.filter((group) => map.has(group)).map((group) => ({
      group,
      items: map.get(group) ?? [],
    }));
  }, [filtered]);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 sm:px-6 lg:px-10">
      <section className="grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-14">
        <div className="space-y-5">
          <Eyebrow>Biblioteca de exercícios</Eyebrow>
          <h1 className="display-xl max-w-2xl">
            Aprenda primeiro.
            <br />
            <span className="text-vivid">Treine melhor.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Vídeos reais, instruções objetivas e o erro mais comum de cada
            movimento, organizados por músculo.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-3">
          {[
            { label: "Exercícios", value: catalog.length },
            { label: "Grupos musculares", value: groupCount },
            { label: "Com análise", value: analyzableCount },
          ].map((item) => (
            <div key={item.label} className="card-base p-4">
              <dt className="eyebrow text-[0.62rem]">{item.label}</dt>
              <dd className="mt-1.5 text-3xl leading-none font-[850] tracking-tighter">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="sticky top-[64px] z-30 -mx-4 space-y-3 border-b border-line/70 bg-canvas/90 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, músculo ou equipamento"
            aria-label="Buscar exercícios"
            className="w-full rounded-full border border-line bg-surface py-3 pr-11 pl-11 text-sm outline-none transition placeholder:text-muted/70 focus:border-vivid"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <div
          role="group"
          aria-label="Filtrar por grupo muscular"
          className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {(["Todos", ...MUSCLE_GROUPS] as Filter[]).map((option) => {
            const isActive = filter === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={isActive}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition",
                  isActive
                    ? "border-night bg-night text-surface"
                    : "border-line bg-surface text-muted hover:border-vivid hover:text-deep",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="card-base mt-10 flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Search className="size-6 text-muted" aria-hidden />
          <p className="text-lg font-[830] tracking-tight">
            Nenhum exercício encontrado
          </p>
          <p className="max-w-sm text-sm text-muted">
            Tente outro termo ou volte para o filtro “Todos” para ver a
            biblioteca completa.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("Todos");
            }}
            className="mt-1 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold transition hover:border-vivid hover:text-deep"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {grouped.map(({ group, items }) => (
            <section key={group} aria-labelledby={`grupo-${normalizeText(group).replace(/\s+/g, "-")}`}>
              <div className="flex items-baseline justify-between gap-4">
                <h2
                  id={`grupo-${normalizeText(group).replace(/\s+/g, "-")}`}
                  className="display-md"
                >
                  {group}
                </h2>
                <p className="text-sm text-muted">
                  {items.length}{" "}
                  {items.length === 1 ? "exercício" : "exercícios"}
                </p>
              </div>

              <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((exercise) => (
                  <li key={exercise.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(exercise)}
                      className="card-base group flex h-full w-full flex-col overflow-hidden text-left transition duration-200 hover:-translate-y-0.5 hover:border-vivid hover:shadow-lift"
                    >
                      <span className="relative block overflow-hidden bg-night">
                        <Image
                          src={youtubeThumbnail(exercise.videoId)}
                          alt={`Miniatura do vídeo de ${exercise.name}`}
                          width={480}
                          height={360}
                          loading="lazy"
                          unoptimized
                          className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-night/20 opacity-0 transition group-hover:opacity-100">
                          <span className="flex size-11 items-center justify-center rounded-full bg-surface/95 text-deep">
                            <Play
                              className="size-5 translate-x-0.5 fill-current"
                              aria-hidden
                            />
                          </span>
                        </span>
                        {exercise.analyzable ? (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-night">
                            <ScanLine className="size-3.5" aria-hidden />
                            Analisa vídeo
                          </span>
                        ) : null}
                      </span>

                      <span className="flex flex-1 flex-col gap-3 p-5">
                        <span className="block text-[1.05rem] leading-tight font-[820] tracking-tight">
                          {exercise.name}
                        </span>
                        <span className="block text-sm leading-relaxed text-muted">
                          {exercise.description}
                        </span>
                        <span className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                          <Badge tone="neutral">{exercise.equipment}</Badge>
                          <Badge tone="neutral">{exercise.difficulty}</Badge>
                        </span>
                        <span className="block text-[11px] text-muted">
                          Vídeo: {exercise.videoSource}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {selected ? (
        <ExerciseModal
          exercise={selected}
          onClose={() => setSelected(null)}
          onAnalyze={(exercise) => {
            setSelected(null);
            onAnalyze(exercise);
          }}
        />
      ) : null}
    </div>
  );
}
