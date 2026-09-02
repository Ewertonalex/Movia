"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/primitives";
import { connectGoogleCalendar } from "@/lib/google/auth";
import { draftWorkoutEvents, insertCalendarEvents } from "@/lib/google/calendar";
import { isGoogleConfigured } from "@/lib/google/config";
import {
  firstName,
  publishProfile,
  useProfile,
} from "@/lib/profile/storage";
import type { WeeklyPlan } from "@/lib/types";

interface CalendarSyncProps {
  plan: WeeklyPlan;
  onSynced: () => void;
}

export function CalendarSync({ plan, onSynced }: CalendarSyncProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const configured = isGoogleConfigured();
  const profile = useProfile();
  const name = firstName(profile.displayName);
  const drafts = draftWorkoutEvents(plan);

  const sync = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const google = await connectGoogleCalendar();
      publishProfile({
        ...profile,
        googleEmail: google.email ?? profile.googleEmail,
        displayName:
          profile.displayName ?? google.givenName ?? profile.displayName,
      });
      const created = await insertCalendarEvents(google.accessToken, drafts);
      onSynced();
      setMessage(
        created === 1
          ? "Pronto. Seu treino já está na agenda, às 19h, por oito semanas. Você pode mudar o horário no Google."
          : `Pronto. ${created} treinos foram para a sua agenda, às 19h, por oito semanas. Você pode mudar o horário no Google.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível falar com o Google agora.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-base space-y-3 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-deep" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-[820] tracking-tight">
            {name
              ? `${name}, mandar esta rotina para o Google Agenda?`
              : "Mandar esta rotina para o Google Agenda?"}
          </p>
          <p className="text-xs leading-relaxed text-muted">
            O Movia pede permissão, cria os eventos e pronto: não precisa baixar
            arquivo nem anexar nada. O vídeo do treino continua só no seu
            aparelho.
          </p>
          {plan.calendarSyncedAt ? (
            <p className="text-xs text-muted">
              Último envio:{" "}
              {new Date(plan.calendarSyncedAt).toLocaleString("pt-BR")}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        disabled={busy || drafts.length === 0 || !configured}
        onClick={() => void sync()}
        className={buttonClasses("secondary")}
      >
        {busy
          ? "Falando com o Google…"
          : plan.calendarSyncedAt
            ? "Enviar de novo para a agenda"
            : "Entrar com Google e enviar treinos"}
      </button>

      {!configured ? (
        <p className="text-xs leading-relaxed text-muted">
          Para funcionar de verdade, este site precisa da chave{" "}
          <code className="rounded bg-canvas px-1">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
          no ambiente (Google Cloud → cliente OAuth Web, com a origem do site
          autorizada e a API da Agenda ligada).
        </p>
      ) : null}

      {message ? (
        <p className="text-sm leading-relaxed text-muted" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
