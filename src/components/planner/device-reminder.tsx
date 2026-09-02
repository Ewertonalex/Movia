"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { buttonClasses } from "@/components/ui/primitives";
import {
  ensureNotificationPermission,
  formatSessionClock,
  getReminderPrefsSnapshot,
  getServerReminderPrefs,
  notificationsSupported,
  publishReminderPrefs,
  shouldUseDeviceReminder,
  subscribeToReminderPrefs,
} from "@/lib/planner/reminders";
import type { WeeklyPlan } from "@/lib/types";

interface DeviceReminderProps {
  plan: WeeklyPlan;
}

export function DeviceReminder({ plan }: DeviceReminderProps) {
  const prefs = useSyncExternalStore(
    subscribeToReminderPrefs,
    getReminderPrefsSnapshot,
    getServerReminderPrefs,
  );
  const [message, setMessage] = useState<string | null>(null);
  const offer = shouldUseDeviceReminder(plan);
  const supported = notificationsSupported();

  if (!offer) {
    return (
      <p className="text-xs leading-relaxed text-muted">
        Os avisos desta rotina vão pelo Google Agenda. O lembrete deste
        aparelho fica desligado para não repetir.
      </p>
    );
  }

  const enable = async () => {
    setMessage(null);
    if (!supported) {
      setMessage("Este navegador não envia avisos.");
      return;
    }
    const permission = await ensureNotificationPermission();
    if (permission !== "granted") {
      setMessage(
        "O navegador bloqueou o aviso. Você pode liberar nas configurações do site.",
      );
      return;
    }
    publishReminderPrefs({
      ...prefs,
      enabled: true,
    });
  };

  const disable = () => {
    publishReminderPrefs({ ...prefs, enabled: false });
    setMessage(null);
  };

  return (
    <div className="card-base space-y-4 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-canvas text-deep">
          {prefs.enabled ? (
            <BellRing className="size-4" aria-hidden />
          ) : (
            <Bell className="size-4" aria-hidden />
          )}
        </span>
        <div className="space-y-1.5">
          <p className="text-base font-[820] tracking-tight">
            Avisar neste aparelho
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Sem Google Agenda, o MOVIA pode lembrar no horário do treino
            escolhido acima. O aviso chega se o site estiver aberto neste
            aparelho — não vai para servidor nenhum.
          </p>
        </div>
      </div>

      {prefs.enabled ? (
        <button
          type="button"
          onClick={disable}
          className={buttonClasses("secondary")}
        >
          <BellOff className="size-4" aria-hidden />
          Desligar avisos
        </button>
      ) : (
        <button type="button" onClick={() => void enable()} className={buttonClasses("secondary")}>
          <Bell className="size-4" aria-hidden />
          Ativar avisos às {formatSessionClock(prefs.hour, prefs.minute)}
        </button>
      )}

      {prefs.enabled ? (
        <p className="text-xs text-muted" role="status">
          Aviso ligado para os dias de treino, às{" "}
          {formatSessionClock(prefs.hour, prefs.minute)}.
        </p>
      ) : null}
      {message ? (
        <p className="text-xs leading-relaxed text-muted" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
