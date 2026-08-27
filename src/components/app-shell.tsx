"use client";

import { useCallback, useState } from "react";
import { AboutSurface } from "@/components/about/about-surface";
import { AnalyzeSurface } from "@/components/analyze/analyze-surface";
import { MoviaMark } from "@/components/brand/movia-mark";
import { LibrarySurface } from "@/components/library/library-surface";
import { PlannerSurface } from "@/components/planner/planner-surface";
import { SiteHeader } from "@/components/site-header";
import { ToastProvider, useToast } from "@/components/ui/toast";
import type { CatalogSource } from "@/lib/db/reconcile";
import type { AnalysisProfile, Exercise, Surface } from "@/lib/types";

interface AppShellProps {
  catalog: Exercise[];
  source: CatalogSource;
}

export function AppShell(props: AppShellProps) {
  return (
    <ToastProvider>
      <AppSurfaces {...props} />
    </ToastProvider>
  );
}

function AppSurfaces({ catalog, source }: AppShellProps) {
  const { showToast } = useToast();
  const [surface, setSurface] = useState<Surface>("analyze");
  const [analyzeSession, setAnalyzeSession] = useState<{
    key: number;
    profile: AnalysisProfile;
  }>({ key: 0, profile: "squat" });

  const navigate = useCallback((next: Surface) => {
    setSurface(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const handleBrandClick = useCallback(() => {
    setSurface("analyze");
    setAnalyzeSession((session) => ({ key: session.key + 1, profile: "squat" }));
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const handleHistoryClick = useCallback(() => {
    showToast(
      "Histórico chega com as contas",
      "Suas análises acontecem no dispositivo e não são salvas em nuvem por enquanto.",
    );
  }, [showToast]);

  const handleAnalyzeExercise = useCallback(
    (exercise: Exercise) => {
      if (!exercise.analysisProfile) {
        showToast(
          "Este exercício ainda não tem análise por vídeo",
          "Agachamento, flexão, rosca direta e afundo já estão disponíveis.",
        );
        return;
      }
      const profile = exercise.analysisProfile;
      setAnalyzeSession((session) => ({ key: session.key + 1, profile }));
      setSurface("analyze");
      window.scrollTo({ top: 0, behavior: "auto" });
    },
    [showToast],
  );

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        active={surface}
        onNavigate={navigate}
        onBrandClick={handleBrandClick}
        onHistoryClick={handleHistoryClick}
      />

      <main className="flex-1">
        {surface === "analyze" ? (
          <AnalyzeSurface
            key={analyzeSession.key}
            catalog={catalog}
            initialProfile={analyzeSession.profile}
          />
        ) : null}

        {surface === "exercises" ? (
          <LibrarySurface catalog={catalog} onAnalyze={handleAnalyzeExercise} />
        ) : null}

        {surface === "routine" ? (
          <PlannerSurface
            catalog={catalog}
            onOpenLibrary={() => navigate("exercises")}
          />
        ) : null}

        {surface === "about" ? (
          <AboutSurface catalog={catalog} onNavigate={navigate} />
        ) : null}
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid w-full max-w-[1240px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <MoviaMark className="size-7" />
              <span className="text-xl leading-none font-[850] tracking-[-0.05em] lowercase">
                movia
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Seu movimento. Mais consciente. Análise visual responsável, feita
              no seu dispositivo.
            </p>
            <button
              type="button"
              onClick={() => navigate("about")}
              className="text-sm font-semibold text-deep underline-offset-4 transition hover:underline"
            >
              Conhecer o projeto
            </button>
          </div>

          <div className="space-y-2">
            <p className="eyebrow">Superfícies</p>
            <ul className="space-y-1.5 text-sm text-muted">
              <li>Exercícios · biblioteca com vídeos reais</li>
              <li>Rotina · planejamento semanal local</li>
              <li>Analisar vídeo · repetições e passadas</li>
              <li>Sobre · propósito, método e limites</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="eyebrow">Privacidade</p>
            <ul className="space-y-1.5 text-sm text-muted">
              <li>Processado no dispositivo</li>
              <li>Sem reconhecimento facial</li>
              <li>Vídeos não são armazenados</li>
              <li>
                Catálogo:{" "}
                {source === "database"
                  ? "banco local sincronizado"
                  : "catálogo embutido"}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-line">
          <p className="mx-auto w-full max-w-[1240px] px-4 py-5 text-xs leading-relaxed text-muted sm:px-6 lg:px-10">
            Resultado visual, não diagnóstico. O MOVIA não substitui avaliação
            profissional. Dor, lesão, gestação ou condição clínica pedem
            orientação de um profissional qualificado.
          </p>
        </div>
      </footer>
    </div>
  );
}
