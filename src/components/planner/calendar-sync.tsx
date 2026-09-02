"use client";

import { useState, useSyncExternalStore } from "react";
import { GoogleG } from "@/components/brand/google-g";
import { SessionTimeField } from "@/components/planner/session-time-field";
import { connectGoogleCalendar } from "@/lib/google/auth";
import { draftWorkoutEvents, insertCalendarEvents } from "@/lib/google/calendar";
import { isGoogleConfigured } from "@/lib/google/config";
import {
  firstName,
  publishProfile,
  useProfile,
} from "@/lib/profile/storage";
import {
  formatSessionClock,
  getReminderPrefsSnapshot,
  getServerReminderPrefs,
  subscribeToReminderPrefs,
} from "@/lib/planner/reminders";
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
  const clock = useSyncExternalStore(
    subscribeToReminderPrefs,
    getReminderPrefsSnapshot,
    getServerReminderPrefs,
  );
  const timeLabel = formatSessionClock(clock.hour, clock.minute);
  const drafts = draftWorkoutEvents(
    plan,
    new Date(),
    clock.hour,
    clock.minute,
  );
  const alreadySent = Boolean(plan.calendarSyncedAt);

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
          ? `Pronto. Seu treino já está na agenda, às ${timeLabel}, por oito semanas. Você pode mudar o horário no Google Agenda.`
          : `Pronto. ${created} treinos foram para a sua agenda, às ${timeLabel}, por oito semanas. Você pode mudar o horário no Google Agenda.`,
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

  const label = busy ? "Falando com o Google…" : "Continuar com o Google";

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[#4285F4]/35 bg-surface shadow-[0_18px_40px_-24px_rgba(66,133,244,0.55)]">
      <div
        className="h-1.5 w-full"
        style={{
          background:
            "linear-gradient(90deg, #4285F4 0 25%, #EA4335 25% 50%, #FBBC05 50% 75%, #34A853 75% 100%)",
        }}
        aria-hidden
      />

      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-white">
            <GoogleG />
          </span>
          <div className="space-y-1.5">
            <p className="text-base font-[820] tracking-tight sm:text-lg">
              {name
                ? `${name}, manda esta rotina para o Google Agenda?`
                : "Manda esta rotina para o Google Agenda?"}
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Um toque: o Movia entra com a sua conta{" "}
              <span className="font-semibold text-ink">Google</span> e cria os
              treinos na agenda. Sem baixar arquivo, sem anexo. O vídeo continua
              só no seu aparelho.
            </p>
            {alreadySent ? (
              <p className="text-xs text-muted">
                Último envio:{" "}
                {new Date(plan.calendarSyncedAt!).toLocaleString("pt-BR")}
              </p>
            ) : null}
          </div>
        </div>

        <SessionTimeField legend="Que horas você treina?" />

        <div className="space-y-2">
          <button
            type="button"
            disabled={busy || drafts.length === 0 || !configured}
            onClick={() => void sync()}
            className="inline-flex h-11 w-full max-w-sm items-center justify-center gap-3 rounded-[4px] border border-[#747775] bg-white px-4 text-sm font-medium text-[#1F1F1F] shadow-[0_1px_2px_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] transition hover:bg-[#F8F9FA] hover:shadow-[0_1px_3px_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <GoogleG />
            <span>{label}</span>
          </button>
          <p className="text-xs font-semibold tracking-tight text-muted">
            {alreadySent
              ? `Envia de novo os treinos para o Google Agenda, às ${timeLabel}`
              : `Cria os treinos no Google Agenda, às ${timeLabel}`}
          </p>
        </div>

        {!configured ? (
          <p className="text-xs leading-relaxed text-muted">
            Para funcionar de verdade, este site precisa da chave{" "}
            <code className="rounded bg-canvas px-1">
              NEXT_PUBLIC_GOOGLE_CLIENT_ID
            </code>{" "}
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
    </div>
  );
}
