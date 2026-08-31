import { getProfile } from "@/lib/analysis/profiles";
import type { AnalysisResult, SavedAnalysis } from "@/lib/types";

export const HISTORY_DB_NAME = "movia-history";
export const HISTORY_STORE = "analyses";
export const HISTORY_FALLBACK_KEY = "movia-analyses-v1";
export const MAX_SAVED_ANALYSES = 40;

export function toSavedAnalysis(result: AnalysisResult): SavedAnalysis {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    exerciseName: getProfile(result.profile).name,
    profile: result.profile,
    cameraView: result.cameraView,
    consistency: result.consistency,
    sampledFrames: result.sampledFrames,
    validFrames: result.validFrames,
    durationSeconds: result.durationSeconds,
    demo: result.demo,
    cycles: result.cycles,
    findings: result.findings,
  };
}

export function toAnalysisResult(saved: SavedAnalysis): AnalysisResult {
  return {
    profile: saved.profile,
    cameraView: saved.cameraView,
    cycles: saved.cycles,
    findings: saved.findings,
    consistency: saved.consistency,
    frames: [],
    sampledFrames: saved.sampledFrames,
    validFrames: saved.validFrames,
    durationSeconds: saved.durationSeconds,
    demo: saved.demo,
  };
}

export function isSavedAnalysis(value: unknown): value is SavedAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<SavedAnalysis>;
  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.exerciseName === "string" &&
    typeof item.profile === "string" &&
    typeof item.consistency === "number" &&
    Array.isArray(item.cycles) &&
    Array.isArray(item.findings)
  );
}

function readFallback(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_FALLBACK_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedAnalysis);
  } catch {
    return [];
  }
}

function writeFallback(items: SavedAnalysis[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_FALLBACK_KEY, JSON.stringify(items));
  } catch {
    // cota cheia ou modo privado
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HISTORY_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readFromIndexedDb(): Promise<SavedAnalysis[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE, "readonly");
    const request = tx.objectStore(HISTORY_STORE).getAll();
    request.onsuccess = () => {
      const rows = Array.isArray(request.result) ? request.result : [];
      resolve(
        rows
          .filter(isSavedAnalysis)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function writeToIndexedDb(items: SavedAnalysis[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE, "readwrite");
    const store = tx.objectStore(HISTORY_STORE);
    store.clear();
    for (const item of items) store.put(item);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function persist(items: SavedAnalysis[]): Promise<SavedAnalysis[]> {
  const trimmed = items
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_SAVED_ANALYSES);
  try {
    if (typeof indexedDB !== "undefined") {
      await writeToIndexedDb(trimmed);
    }
  } catch {
    // IndexedDB indisponível: o fallback abaixo cobre
  }
  writeFallback(trimmed);
  return trimmed;
}

export async function loadSavedAnalyses(): Promise<SavedAnalysis[]> {
  if (typeof window === "undefined") return [];
  try {
    if (typeof indexedDB !== "undefined") {
      const fromDb = await readFromIndexedDb();
      if (fromDb.length > 0) return fromDb;
    }
  } catch {
    // cai no fallback
  }
  return readFallback();
}

const listeners = new Set<() => void>();
let snapshot: SavedAnalysis[] | undefined;

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getHistorySnapshot(): SavedAnalysis[] {
  return snapshot ?? [];
}

export function getServerHistorySnapshot(): SavedAnalysis[] {
  return [];
}

export async function hydrateHistory(): Promise<void> {
  const loaded = await loadSavedAnalyses();
  if (snapshot && snapshot.length > 0) {
    const byId = new Map(loaded.map((item) => [item.id, item]));
    for (const item of snapshot) byId.set(item.id, item);
    snapshot = [...byId.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  } else {
    snapshot = loaded;
  }
  emit();
}

export async function saveAnalysis(result: AnalysisResult): Promise<SavedAnalysis> {
  const current = snapshot ?? (await loadSavedAnalyses());
  const saved = toSavedAnalysis(result);
  snapshot = await persist([saved, ...current.filter((item) => item.id !== saved.id)]);
  emit();
  return saved;
}

export async function removeAnalysis(id: string): Promise<void> {
  const current = snapshot ?? (await loadSavedAnalyses());
  snapshot = await persist(current.filter((item) => item.id !== id));
  emit();
}
