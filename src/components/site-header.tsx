"use client";

import { ShieldCheck, Sparkles } from "lucide-react";
import { MoviaMark } from "@/components/brand/movia-mark";
import type { Surface } from "@/lib/types";
import { firstName, useProfile } from "@/lib/profile/storage";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { id: Surface; label: string; short: string }[] = [
  { id: "exercises", label: "Exercícios", short: "Exercícios" },
  { id: "routine", label: "Rotina", short: "Rotina" },
  { id: "analyze", label: "Analisar vídeo", short: "Analisar" },
  { id: "about", label: "Sobre", short: "Sobre" },
];

interface SiteHeaderProps {
  active: Surface;
  onNavigate: (surface: Surface) => void;
  onBrandClick: () => void;
  onHistoryClick: () => void;
}

export function SiteHeader({
  active,
  onNavigate,
  onBrandClick,
  onHistoryClick,
}: SiteHeaderProps) {
  const greeting = firstName(useProfile().displayName);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onBrandClick}
          className="group order-1 flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 transition hover:bg-ink/5"
          aria-label="MOVIA — voltar ao início"
        >
          <MoviaMark className="size-8 transition-transform duration-300 group-hover:scale-105" />
          <span className="text-[1.35rem] leading-none font-[850] tracking-[-0.05em] lowercase">
            movia
          </span>
          {greeting ? (
            <span className="hidden text-sm font-semibold text-muted sm:inline">
              oi, {greeting}
            </span>
          ) : null}
        </button>

        <nav
          aria-label="Navegação principal"
          className="no-scrollbar order-4 -mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 sm:order-2 sm:w-auto sm:flex-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "shrink-0 rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap transition sm:px-3.5",
                  isActive
                    ? "bg-night text-surface"
                    : "text-muted hover:bg-ink/5 hover:text-ink",
                )}
              >
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="order-3 hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 xl:flex">
          <ShieldCheck className="size-4 text-deep" aria-hidden />
          <span className="text-xs font-semibold text-muted">
            Análise visual responsável
          </span>
        </div>

        <button
          type="button"
          onClick={onHistoryClick}
          aria-label="Minhas análises"
          className="order-2 ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold transition hover:border-vivid hover:text-deep sm:order-4 sm:ml-0 sm:px-4"
        >
          <Sparkles className="size-4 text-deep" aria-hidden />
          <span className="hidden sm:inline">Minhas análises</span>
        </button>
      </div>
    </header>
  );
}
