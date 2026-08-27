#!/usr/bin/env node
/** Captura telas das três superfícies para conferência visual rápida. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = ".screenshots";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

const desktop = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await desktop.goto("http://localhost:3000", { waitUntil: "networkidle" });
await desktop.screenshot({ path: `${OUT}/1-analisar.png` });

await desktop
  .getByRole("button", { name: "Ver uma análise de demonstração" })
  .first()
  .click();
await desktop.waitForTimeout(600);
await desktop.screenshot({ path: `${OUT}/2-resultado.png`, fullPage: true });

await desktop
  .getByRole("navigation", { name: "Navegação principal" })
  .getByRole("button", { name: "Exercícios" })
  .click();
await desktop.waitForTimeout(1200);
await desktop.screenshot({ path: `${OUT}/3-exercicios.png` });

await desktop.getByText("Flexão de braço").first().click();
await desktop.waitForTimeout(800);
await desktop.screenshot({ path: `${OUT}/4-modal.png` });
await desktop.keyboard.press("Escape");

await desktop
  .getByRole("navigation", { name: "Navegação principal" })
  .getByRole("button", { name: "Rotina" })
  .click();
await desktop.getByRole("button", { name: /Gerar minha rotina|Refazer/ }).click();
await desktop.waitForTimeout(500);
await desktop.screenshot({ path: `${OUT}/5-rotina.png`, fullPage: true });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://localhost:3000", { waitUntil: "networkidle" });
await mobile.screenshot({ path: `${OUT}/6-mobile.png` });

await browser.close();
console.log("[movia] capturas salvas em .screenshots");
