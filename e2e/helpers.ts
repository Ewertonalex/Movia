import { expect, type Page } from "@playwright/test";

/** Sai da tela inicial e entra no app, onde a navegação principal aparece. */
export async function enterApp(page: Page) {
  await page.getByRole("button", { name: "Montar meu treino" }).click();
  await expect(
    page.getByRole("navigation", { name: "Navegação principal" }),
  ).toBeVisible();
}
