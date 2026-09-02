"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/primitives";
import {
  normalizeDisplayName,
  publishProfile,
  useProfile,
} from "@/lib/profile/storage";

export function NamePrompt({ compact = false }: { compact?: boolean }) {
  const current = useProfile();
  const [value, setValue] = useState(current.displayName ?? "");
  const [error, setError] = useState<string | null>(null);

  if (current.displayName || current.skippedName) return null;

  const save = () => {
    const name = normalizeDisplayName(value);
    if (!name) {
      setError("Escreva um nome com 2 a 40 letras.");
      return;
    }
    publishProfile({
      ...current,
      displayName: name,
      skippedName: false,
    });
  };

  const skip = () => {
    publishProfile({
      ...current,
      displayName: null,
      skippedName: true,
    });
  };

  return (
    <div className={compact ? "space-y-3" : "card-base space-y-4 p-5 sm:p-6"}>
      <div className="space-y-1">
        <p className="text-sm font-[820] tracking-tight">
          Como você quer ser chamado?
        </p>
        <p className="text-xs leading-relaxed text-muted">
          Usamos só neste navegador, para o app falar com você. Pode ser
          apelido.
        </p>
      </div>
      <label className="block space-y-2">
        <span className="sr-only">Nome de tratamento</span>
        <input
          type="text"
          autoComplete="nickname"
          maxLength={40}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          placeholder="Ex.: Ana, Edu, Gabi"
          className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-base font-[800] tracking-tight outline-none transition focus:border-vivid"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-[#8A3418]">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={save} className={buttonClasses("primary")}>
          Pode me chamar assim
        </button>
        <button
          type="button"
          onClick={skip}
          className={buttonClasses("ghost", "text-muted")}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
