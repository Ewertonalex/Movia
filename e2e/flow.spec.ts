import { expect, test, type Page } from "@playwright/test";
import { EXERCISE_CATALOG } from "../src/lib/catalog";
import { enterApp } from "./helpers";

async function openAnalyze(page: Page) {
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("button", { name: "Analisar vídeo" })
    .click();
}

test.describe("tela inicial", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("apresenta a marca, o vídeo e um único convite", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: /Seu movimento/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Montar meu treino" }),
    ).toBeVisible();
    await expect(page.getByText("Processado no seu dispositivo")).toBeVisible();
    await expect(page.getByText("Google só se quiser a agenda")).toBeVisible();
    await expect(page.getByText("Vídeos não são armazenados")).toBeVisible();
    await expect(page.locator("video source")).toHaveAttribute(
      "src",
      "/brand/hero.mp4",
    );
    await expect(
      page.getByRole("navigation", { name: "Navegação principal" }),
    ).toHaveCount(0);
    await expect(page.locator("iframe")).toHaveCount(0);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("o convite leva ao planejador", async ({ page }) => {
    await enterApp(page);
    await expect(
      page.getByRole("heading", { level: 1, name: /Sua rotina/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Gerar minha rotina inteligente" }),
    ).toBeVisible();
  });
});

test.describe("fluxo principal do MOVIA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
  });

  test("navega entre as superfícies", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Navegação principal" });

    await nav.getByRole("button", { name: "Exercícios" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Aprenda primeiro/ }),
    ).toBeVisible();

    await nav.getByRole("button", { name: "Rotina" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Sua rotina/ }),
    ).toBeVisible();

    await nav.getByRole("button", { name: "Sobre" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Treinar bem/ }),
    ).toBeVisible();

    await nav.getByRole("button", { name: "Analisar vídeo" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Seu movimento/ }),
    ).toBeVisible();
  });

  test("a superfície Sobre explica o projeto e leva às outras telas", async ({
    page,
  }) => {
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: "Sobre" })
      .click();

    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", { name: "Três superfícies, um só objetivo." }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: /Do vídeo à recomendação/ }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: /Seu vídeo nunca sai do seu aparelho/ }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "O que o MOVIA não é." }),
    ).toBeVisible();

    const faq = main.getByText("Meu vídeo vai para algum servidor?");
    await expect(faq).toBeVisible();
    await faq.click();
    await expect(main.getByText(/endereço temporário local/)).toBeVisible();

    await main.getByRole("button", { name: "Abrir a biblioteca" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Aprenda primeiro/ }),
    ).toBeVisible();
  });

  test("lista os exercícios agrupados e permite buscar", async ({ page }) => {
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: "Exercícios" })
      .click();

    await expect(page.getByRole("listitem").first()).toBeVisible();
    const cards = page.locator("main ul > li");
    await expect(cards).toHaveCount(EXERCISE_CATALOG.length);

    const search = page.getByRole("searchbox", { name: "Buscar exercícios" });
    await search.fill("agachamento livre");
    await expect(page.locator("main ul > li")).toHaveCount(1);

    await search.fill("zzzz");
    await expect(page.getByText("Nenhum exercício encontrado")).toBeVisible();
    await page.getByRole("button", { name: "Limpar filtros" }).click();
    await expect(page.locator("main ul > li")).toHaveCount(EXERCISE_CATALOG.length);

    await page.getByRole("button", { name: "Peito", exact: true }).click();
    await expect(page.locator("main ul > li")).toHaveCount(
      EXERCISE_CATALOG.filter((item) => item.muscleGroup === "Peito").length,
    );
  });

  test("abre o detalhe do exercício e fecha com Escape", async ({ page }) => {
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: "Exercícios" })
      .click();

    await page.getByText("Flexão de braço").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Erro comum")).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: /Assistir execução correta/ }),
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=Env8gAr_QnE");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("leva da biblioteca para a análise do exercício escolhido", async ({
    page,
  }) => {
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: "Exercícios" })
      .click();

    await page.getByText("Afundo caminhando").first().click();
    await page.getByRole("button", { name: "Analisar meu vídeo" }).click();

    await expect(
      page.getByRole("button", { name: /Afundo livre \/ caminhando/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("2 a 6 passadas")).toBeVisible();
  });

  test("recusa arquivo que não é vídeo", async ({ page }) => {
    await openAnalyze(page);
    await page.getByLabel("Escolher vídeo do treino").setInputFiles({
      name: "planilha.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("nome,serie\nagachamento,3"),
    });

    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "Esse arquivo não parece um vídeo",
    );
  });

  test("gera a análise de demonstração com repetições e vídeo de referência", async ({
    page,
  }) => {
    await openAnalyze(page);
    await page
      .getByRole("button", { name: "Ver uma análise de demonstração" })
      .first()
      .click();

    await expect(page.getByText("Análise concluída")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "5 repetições encontradas" }),
    ).toBeVisible();
    await expect(page.getByText("Consistência")).toBeVisible();
    await expect(page.getByText("Experimente assim").first()).toBeVisible();

    await page.getByRole("button", { name: "Ir para a repetição 3" }).click();
    await expect(page.getByText("Repetição 3 de 5")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Compare com uma execução bem feita." }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Assistir execução correta/ }),
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=l83R5PblSMA");
  });

  test("gera, persiste e reorganiza a rotina semanal", async ({ page }) => {
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: "Rotina" })
      .click();

    await page
      .getByRole("button", { name: "Gerar minha rotina inteligente" })
      .click();

    await expect(page.getByText("Recuperação").first()).toBeVisible();
    await expect(page.getByText("3 dias")).toBeVisible();
    await expect(page.getByText("12 exercícios na semana")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Fiz esta série" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Descansar/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Ver como fazer/ }).first(),
    ).toBeVisible();

    const loadInput = page.getByPlaceholder("Peso usado, se quiser").first();
    await expect(loadInput).toBeVisible();
    await loadInput.click();
    await loadInput.pressSequentially("3abc!");
    await expect(loadInput).toHaveValue("3");
    await loadInput.press("Enter");
    await expect(loadInput).toHaveValue("3");
    await expect(loadInput).toBeVisible();

    await page.getByRole("button", { name: /Ver como fazer/ }).first().click();
    const preview = page.getByRole("dialog");
    await expect(preview).toBeVisible();
    await expect(
      preview.getByRole("link", { name: /Assistir execução correta/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Sua rotina/ }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(preview).toBeHidden();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem("movia-weekly-plan-v1"),
    );
    expect(stored).toBeTruthy();

    const before = await page.locator("main ul > li").allInnerTexts();
    await page.getByRole("button", { name: "Reorganizar" }).click();
    const after = await page.locator("main ul > li").allInnerTexts();
    expect(after).not.toEqual(before);

    await page.reload();
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: "Rotina" })
      .click();
    await expect(page.getByText("12 exercícios na semana")).toBeVisible();
  });

  test("calibra a rotina pelo sexo informado", async ({ page }) => {
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: "Rotina" })
      .click();

    const main = page.getByRole("main");
    await page.getByRole("button", { name: "Gerar minha rotina inteligente" }).click();
    await expect(main.getByText("Como este plano foi calibrado")).toBeVisible();
    await expect(main.getByText(/Sem o sexo informado/)).toBeVisible();
    await expect(main.getByText("8–12 reps", { exact: false }).first()).toBeVisible();

    await page.getByRole("button", { name: "Feminino", exact: true }).click();
    await page.getByRole("button", { name: "Refazer minha rotina" }).click();

    await expect(main.getByText(/Descanso de 1 min em vez de/)).toBeVisible();
    await expect(main.getByText(/Faixa de 10–14 repetições/)).toBeVisible();
    await expect(main.getByText("10–14 reps", { exact: false }).first()).toBeVisible();
  });

  test("valida o formulário da rotina", async ({ page }) => {
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: "Rotina" })
      .click();

    for (const day of ["SEG", "QUA", "SEX"]) {
      const button = page.getByRole("button", { name: day, exact: false });
      if ((await button.first().getAttribute("aria-pressed")) === "true") {
        await button.first().click();
      }
    }

    await page
      .getByRole("button", { name: /Gerar minha rotina|Refazer minha rotina/ })
      .click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "Escolha pelo menos dois dias",
    );
  });

  test("monta treino rápido com o que a pessoa tem", async ({ page }) => {
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: "Rotina" })
      .click();

    await page.getByRole("button", { name: "Treine com o que você tem" }).click();
    await expect(page.getByRole("button", { name: "Surpreenda-me" })).toBeVisible();
    await page.getByRole("button", { name: "Surpreenda-me" }).click();

    await expect(page.getByText("Progressão sem equipamento")).toBeVisible();
    await expect(page.getByText("Análise de movimento em breve").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Trocar exercício" }).first()).toBeVisible();
  });

  test("a marca volta ao início", async ({ page }) => {
    await openAnalyze(page);
    await page
      .getByRole("button", { name: "Ver uma análise de demonstração" })
      .first()
      .click();
    await expect(page.getByText("Análise concluída")).toBeVisible();

    await page.getByRole("button", { name: /MOVIA/ }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Seu movimento/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Montar meu treino" }),
    ).toBeVisible();
  });

  test("salva a análise de demonstração e reabre pelo histórico", async ({
    page,
  }) => {
    await openAnalyze(page);
    await page
      .getByRole("button", { name: "Ver uma análise de demonstração" })
      .first()
      .click();
    await expect(page.getByText("Análise concluída")).toBeVisible();

    await page.getByRole("button", { name: "Minhas análises" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Minhas análises/ }),
    ).toBeVisible();
    await expect(page.getByText("1 análise salva")).toBeVisible();
    await expect(page.getByText("Agachamento").first()).toBeVisible();

    await page.getByRole("button", { name: "Ver resultado" }).click();
    await expect(page.getByText("Análise concluída")).toBeVisible();
    await expect(page.getByText("Salva neste aparelho")).toBeVisible();
    await expect(page.getByText("Demonstração").first()).toBeVisible();
  });

  test("não gera rolagem horizontal", async ({ page }) => {
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, "Rotina").toBeLessThanOrEqual(1);

    for (const surface of ["Exercícios", "Analisar vídeo"]) {
      await page
        .getByRole("navigation", { name: "Navegação principal" })
        .getByRole("button", { name: surface })
        .click();
      const next = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(next, surface).toBeLessThanOrEqual(1);
    }
  });
});
