"use client";

import { Lock, ShieldCheck, Sparkles, VideoOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { MoviaMark } from "@/components/brand/movia-mark";
import { NamePrompt } from "@/components/profile/name-prompt";
import { Badge, buttonClasses } from "@/components/ui/primitives";
import { firstName, useProfile } from "@/lib/profile/storage";

const TRUST = [
  { icon: ShieldCheck, label: "Processado no seu dispositivo" },
  { icon: Lock, label: "Google só se quiser a agenda" },
  { icon: VideoOff, label: "Vídeos não são armazenados" },
] as const;

interface LandingSurfaceProps {
  onStart: () => void;
}

export function LandingSurface({ onStart }: LandingSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const profile = useProfile();
  const greeting = firstName(profile.displayName);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (media.matches) {
        video.pause();
        return;
      }
      void video.play().catch(() => {
        // Autoplay pode ser bloqueado; o poster visual do primeiro quadro permanece.
      });
    };

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <section className="relative isolate min-h-[100dvh] overflow-hidden bg-night">
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/brand/hero.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-night/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/78 to-canvas/30 lg:bg-gradient-to-r lg:from-canvas lg:via-canvas/80 lg:to-transparent" />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1240px] flex-col justify-end px-4 pb-12 pt-10 sm:justify-center sm:px-6 sm:pb-16 lg:px-10">
        <div className="max-w-xl space-y-7">
          <div className="flex items-center gap-3">
            <MoviaMark className="size-12" />
            <span className="text-[2rem] leading-none font-[850] tracking-[-0.06em] lowercase">
              movia
            </span>
          </div>

          <h1 className="display-xl">
            Seu movimento.
            <br />
            <span className="text-vivid">Mais consciente.</span>
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-muted">
            {greeting
              ? `Oi, ${greeting}. Você não precisa de academia para começar.`
              : "Você não precisa de academia para começar."}
          </p>

          <NamePrompt compact />

          <div>
            <button
              type="button"
              onClick={onStart}
              className={buttonClasses("primary", "px-8 py-3.5 text-base")}
            >
              <Sparkles className="size-4" aria-hidden />
              Montar meu treino
            </button>
          </div>

          <ul className="flex flex-wrap gap-2">
            {TRUST.map((item) => (
              <li key={item.label}>
                <Badge tone="neutral">
                  <item.icon className="size-3.5 text-deep" aria-hidden />
                  {item.label}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
