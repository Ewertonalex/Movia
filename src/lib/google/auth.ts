import {
  GOOGLE_CALENDAR_SCOPES,
  GOOGLE_CLIENT_ID,
  isGoogleConfigured,
} from "./config";

interface TokenClient {
  requestAccessToken: (override?: { prompt?: string }) => void;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
  scope?: string;
}

interface GoogleNamespace {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }) => TokenClient;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleNamespace;
  }
}

export interface GoogleSession {
  accessToken: string;
  email?: string;
  givenName?: string;
}

let scriptPromise: Promise<void> | null = null;
let session: GoogleSession | null = null;

function loadGis(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google só funciona no navegador."));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Não foi possível carregar o login do Google.")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Não foi possível carregar o login do Google."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

async function readUserInfo(accessToken: string): Promise<{
  email?: string;
  givenName?: string;
}> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return {};
  const payload = (await response.json()) as {
    email?: string;
    given_name?: string;
    name?: string;
  };
  return {
    email: payload.email,
    givenName: payload.given_name ?? payload.name?.split(/\s+/)[0],
  };
}

export function getGoogleSession(): GoogleSession | null {
  return session;
}

export function clearGoogleSession(): void {
  session = null;
}

/**
 * Pede login Google + permissão para criar eventos na agenda.
 * O token fica só na memória desta sessão, não no localStorage.
 */
export async function connectGoogleCalendar(): Promise<GoogleSession> {
  if (!isGoogleConfigured()) {
    throw new Error(
      "O login Google ainda não foi configurado neste site (falta a chave do cliente).",
    );
  }

  await loadGis();
  const api = window.google?.accounts?.oauth2;
  if (!api) {
    throw new Error("O login Google não carregou. Tente de novo em instantes.");
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = api.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_CALENDAR_SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(
              "Não autorizamos a agenda. Sem essa permissão o Movia não consegue criar os treinos.",
            ),
          );
          return;
        }
        const granted = response.scope ?? "";
        if (!granted.includes("calendar.events")) {
          session = null;
          reject(
            new Error(
              "O Google entrou, mas a agenda não foi liberada. Na janela de permissão, deixe marcado o Calendar e confirme.",
            ),
          );
          return;
        }
        resolve(response.access_token);
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });

  const info = await readUserInfo(accessToken);
  session = {
    accessToken,
    email: info.email,
    givenName: info.givenName,
  };
  return session;
}
