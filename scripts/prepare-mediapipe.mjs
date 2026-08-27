#!/usr/bin/env node
/**
 * Copia o runtime wasm do MediaPipe e baixa o modelo de pose para /public,
 * garantindo que a análise rode sem depender de CDN em tempo de execução.
 */
import { cp, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const targetWasmDir = path.join(projectRoot, "public", "mediapipe", "wasm");
const targetModelDir = path.join(projectRoot, "public", "mediapipe", "models");
const modelFile = path.join(targetModelDir, "pose_landmarker_lite.task");
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyWasm() {
  const sourceDir = path.join(
    projectRoot,
    "node_modules",
    "@mediapipe",
    "tasks-vision",
    "wasm",
  );
  if (!(await exists(sourceDir))) {
    console.warn("[movia] runtime wasm não encontrado em node_modules");
    return;
  }
  await mkdir(targetWasmDir, { recursive: true });
  await cp(sourceDir, targetWasmDir, { recursive: true });
  console.log("[movia] runtime wasm copiado para public/mediapipe/wasm");
}

async function downloadModel() {
  if (await exists(modelFile)) {
    console.log("[movia] modelo de pose já disponível localmente");
    return;
  }
  await mkdir(targetModelDir, { recursive: true });
  try {
    const response = await fetch(MODEL_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(modelFile, buffer);
    console.log("[movia] modelo pose_landmarker_lite salvo em public/mediapipe/models");
  } catch (error) {
    console.warn(
      `[movia] não foi possível baixar o modelo (${error.message}). A aplicação usará a URL pública do MediaPipe como fallback.`,
    );
  }
}

await copyWasm();
await downloadModel();
