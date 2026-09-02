import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MOVIA",
    short_name: "MOVIA",
    description:
      "Seu movimento. Mais consciente. Análise no dispositivo, biblioteca e rotina semanal.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f1",
    theme_color: "#08713a",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
        purpose: "any",
      },
    ],
  };
}
