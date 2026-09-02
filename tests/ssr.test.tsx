import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppShell } from "@/components/app-shell";
import { EXERCISE_CATALOG } from "@/lib/catalog";

function renderApp(): string {
  return renderToString(
    <AppShell catalog={EXERCISE_CATALOG} source="catalog" />,
  );
}

describe("renderização no servidor", () => {
  const html = renderApp();

  it("entrega a tela inicial da marca já no primeiro carregamento", () => {
    expect(html).toContain("Seu movimento.");
    expect(html).toContain("Mais consciente.");
    expect(html).toContain("Montar meu treino");
    expect(html).toContain("/brand/hero.mp4");
  });

  it("não joga a pessoa no formulário antes do convite", () => {
    expect(html).not.toContain("Altura (cm)");
    expect(html).not.toContain("Gerar minha rotina inteligente");
    expect(html).not.toContain("Navegação principal");
  });

  it("traz selos de confiança na entrada", () => {
    expect(html).toContain("Processado no seu dispositivo");
    expect(html).toContain("Sem cadastro");
    expect(html).toContain("Vídeos não são armazenados");
  });

  it("não depende de skeleton nem de conteúdo genérico", () => {
    expect(html).not.toContain("Lorem ipsum");
    expect(html).not.toContain("animate-pulse");
    expect(html).not.toContain("Create Next App");
  });

  it("não usa iframe de vídeo na marcação inicial", () => {
    expect(html).not.toContain("<iframe");
  });
});
