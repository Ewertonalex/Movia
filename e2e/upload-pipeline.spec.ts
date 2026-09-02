import { expect, test } from "@playwright/test";

/**
 * Grava um WebM real no próprio navegador para exercitar upload, leitura de
 * duração e processamento de pose de ponta a ponta.
 */
async function recordSyntheticVideo(
  page: import("@playwright/test").Page,
): Promise<Buffer> {
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext("2d");
    const stream = canvas.captureStream(25);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);

    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    recorder.start();
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const draw = () => {
        const elapsed = performance.now() - start;
        if (context) {
          context.fillStyle = "#f4f6f1";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.fillStyle = "#17231d";
          context.fillRect(140 + Math.sin(elapsed / 200) * 40, 90, 40, 90);
        }
        if (elapsed > 2500) {
          resolve();
          return;
        }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    });

    recorder.stop();
    await stopped;

    const blob = new Blob(chunks, { type: "video/webm" });
    const buffer = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  });

  return Buffer.from(base64, "base64");
}

test.describe("pipeline de upload com vídeo real", () => {
  test.setTimeout(180_000);

  test("aceita o arquivo, lê a duração e explica quando não enxerga o corpo", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: "Analisar vídeo" })
      .click();
    const buffer = await recordSyntheticVideo(page);
    expect(buffer.byteLength).toBeGreaterThan(1000);

    await page.getByLabel("Escolher vídeo do treino").setInputFiles({
      name: "treino-sintetico.webm",
      mimeType: "video/webm",
      buffer,
    });

    await expect(page.getByText("Confira antes de analisar")).toBeVisible();
    await expect(page.getByText("treino-sintetico.webm")).toBeVisible();
    await expect(page.getByText("Duração")).toBeVisible();

    await page.getByRole("button", { name: "Analisar meu movimento" }).click();

    await expect(page.getByText("Analisando o seu movimento")).toBeVisible();

    // Sem uma pessoa no quadro, o resultado correto é o erro de visibilidade.
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      /articulações apareceram pouco visíveis|Não identificamos/,
      { timeout: 120_000 },
    );
  });
});
