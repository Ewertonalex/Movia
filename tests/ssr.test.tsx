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

  it("entrega o produto real já no primeiro carregamento", () => {
    expect(html).toContain("Seu movimento.");
    expect(html).toContain("Mais consciente.");
    expect(html).toContain("Workout form coach");
    expect(html).toContain("Envie um vídeo curto.");
  });

  it("mostra a navegação com as três superfícies", () => {
    expect(html).toContain("Exercícios");
    expect(html).toContain("Rotina");
    expect(html).toContain("Analisar vídeo");
    expect(html).toContain("Minhas análises");
  });

  it("traz a microcopy obrigatória de privacidade", () => {
    expect(html).toContain("Análise visual responsável");
    expect(html).toContain("Processado no dispositivo");
    expect(html).toContain("Sem reconhecimento facial");
  });

  it("apresenta o passo de escolha do exercício com os quatro movimentos", () => {
    expect(html).toContain("PASSO 01");
    expect(html).toContain("O que você vai treinar?");
    expect(html).toContain("Agachamento");
    expect(html).toContain("Flexão");
    expect(html).toContain("Rosca direta");
    expect(html).toContain("Afundo livre / caminhando");
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
