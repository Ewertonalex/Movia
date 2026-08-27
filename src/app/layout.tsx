import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MOVIA — Seu movimento. Mais consciente.",
  description:
    "Envie um vídeo curto do seu treino, veja cada repetição mapeada no próprio dispositivo, aprenda com vídeos reais e monte sua rotina semanal.",
  applicationName: "MOVIA",
  keywords: [
    "análise de movimento",
    "treino",
    "exercícios",
    "rotina semanal",
    "postura",
  ],
};

export const viewport: Viewport = {
  themeColor: "#f4f6f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
