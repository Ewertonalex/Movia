import path from "node:path";
import { expect, test } from "@playwright/test";

const BUNDLE_PATH = path.resolve(
  process.cwd(),
  "node_modules/@mediapipe/tasks-vision/vision_bundle.mjs",
);

test.describe("runtime de análise no navegador", () => {
  test("serve o wasm e o modelo de pose localmente", async ({ request }) => {
    const wasm = await request.get(
      "/mediapipe/wasm/vision_wasm_internal.wasm",
    );
    expect(wasm.status()).toBe(200);
    const bytes = new Uint8Array((await wasm.body()).subarray(0, 4));
    expect(Array.from(bytes)).toEqual([0x00, 0x61, 0x73, 0x6d]);

    const model = await request.get(
      "/mediapipe/models/pose_landmarker_lite.task",
    );
    expect(model.status()).toBe(200);
    expect((await model.body()).byteLength).toBeGreaterThan(1_000_000);
  });

  test("cria o PoseLandmarker em modo VIDEO com os assets do app", async ({
    page,
  }) => {
    // O bundle do MediaPipe não é publicado em /public; servimos apenas no teste.
    await page.route("**/vision_bundle.mjs", (route) =>
      route.fulfill({ path: BUNDLE_PATH, contentType: "text/javascript" }),
    );

    await page.goto("/");

    const result = await page.evaluate(async () => {
      const bundleUrl = "/vision_bundle.mjs";
      const vision = (await import(bundleUrl)) as typeof import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "/mediapipe/wasm",
      );

      const create = (delegate: "GPU" | "CPU") =>
        vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: "/mediapipe/models/pose_landmarker_lite.task",
            delegate,
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.48,
          minPosePresenceConfidence: 0.48,
          minTrackingConfidence: 0.48,
        });

      let delegate = "GPU";
      let landmarker;
      try {
        landmarker = await create("GPU");
      } catch {
        delegate = "CPU";
        landmarker = await create("CPU");
      }

      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      const detection = landmarker.detectForVideo(canvas, 0);
      const poses = detection.landmarks.length;
      landmarker.close();

      return { delegate, poses };
    });

    expect(["GPU", "CPU"]).toContain(result.delegate);
    expect(result.poses).toBeGreaterThanOrEqual(0);
  });
});
