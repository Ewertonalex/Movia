import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-deep text-surface px-6 py-3 hover:bg-night shadow-[0_14px_28px_-16px_rgba(8,113,58,0.9)] hover:shadow-[0_18px_34px_-16px_rgba(8,113,58,0.95)]",
  secondary:
    "bg-surface text-ink border border-line px-6 py-3 hover:border-vivid hover:text-deep",
  ghost: "text-ink px-4 py-2 hover:bg-ink/5",
  dark: "bg-night text-surface px-6 py-3 hover:bg-ink",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  extra?: string,
): string {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], extra);
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "vivid" | "lime" | "dark" | "warn";
  className?: string;
}) {
  const tones = {
    neutral: "bg-canvas text-muted border-line",
    vivid: "bg-vivid/12 text-deep border-vivid/35",
    lime: "bg-lime text-night border-night/10",
    dark: "bg-night text-surface border-night",
    warn: "bg-[#FFF4E2] text-[#8A5A12] border-[#F0DCBC]",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-tight",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function Card({
  children,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Component className={cn("card-base", className)}>{children}</Component>
  );
}

export function OptionButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-3 py-3 text-sm font-semibold transition",
        active
          ? "border-deep bg-vivid/12 text-deep"
          : "border-line bg-canvas text-muted hover:border-vivid hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

export function StepLabel({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <span className="rounded-full bg-night px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-lime">
        {step}
      </span>
      <h2 className="display-md">{title}</h2>
    </div>
  );
}
