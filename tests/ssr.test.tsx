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
    expect(html).toContain("Sua rotina.");
    expect(html).toContain("Do seu jeito.");
    expect(html).toContain("Planejador semanal");
    expect(html).toContain("Monte sua semana");
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

  it("apresenta o formulário da rotina no primeiro carregamento", () => {
    expect(html).toContain("Altura (cm)");
    expect(html).toContain("Peso (kg)");
    expect(html).toContain("Gerar minha rotina inteligente");
    expect(html).toContain("Hipertrofia");
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
