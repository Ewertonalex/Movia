import { useSyncExternalStore } from "react";
import type { MoviaProfile } from "@/lib/types";

export const PROFILE_STORAGE_KEY = "movia-profile-v1";

const EMPTY: MoviaProfile = {
  displayName: null,
  skippedName: false,
  googleEmail: null,
};

function isProfile(value: unknown): value is MoviaProfile {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<MoviaProfile>;
  return (
    (candidate.displayName === null ||
      typeof candidate.displayName === "string") &&
    typeof candidate.skippedName === "boolean"
  );
}

export function loadProfile(): MoviaProfile {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (isProfile(parsed)) {
      return {
        displayName: parsed.displayName?.trim() ? parsed.displayName.trim() : null,
        skippedName: parsed.skippedName,
        googleEmail: parsed.googleEmail ?? null,
      };
    }
  } catch {
    // perfil corrompido: começamos do zero
  }
  return EMPTY;
}

export function saveProfile(profile: MoviaProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // armazenamento indisponível
  }
}

const listeners = new Set<() => void>();
let snapshot: MoviaProfile | undefined;

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getProfileSnapshot(): MoviaProfile {
  if (snapshot === undefined) snapshot = loadProfile();
  return snapshot;
}

export function getServerProfileSnapshot(): MoviaProfile {
  return EMPTY;
}

export function useProfile(): MoviaProfile {
  return useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );
}

export function publishProfile(profile: MoviaProfile): void {
  snapshot = {
    ...profile,
    displayName: profile.displayName?.trim() ? profile.displayName.trim() : null,
  };
  saveProfile(snapshot);
  emit();
}

export function firstName(displayName: string | null): string | null {
  if (!displayName) return null;
  return displayName.trim().split(/\s+/)[0] ?? null;
}

export function normalizeDisplayName(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > 40) return null;
  return trimmed;
}
