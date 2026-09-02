/** Client ID público do OAuth Web. Sem ele, o botão da agenda explica a configuração. */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const GOOGLE_CALENDAR_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export function isGoogleConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 8;
}
