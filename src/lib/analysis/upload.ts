import { formatBytes } from "@/lib/utils";
import { UPLOAD_LIMITS } from "./profiles";

export interface UploadRejection {
  code: "invalid-type" | "too-large" | "too-long" | "unreadable";
  message: string;
}

export function validateVideoFile(file: File): UploadRejection | null {
  const looksLikeVideo =
    file.type.startsWith("video/") ||
    /\.(mp4|mov|webm|m4v)$/i.test(file.name);

  if (!looksLikeVideo) {
    return {
      code: "invalid-type",
      message:
        "Esse arquivo não parece um vídeo. Envie um arquivo MP4, MOV ou WebM.",
    };
  }

  if (file.size > UPLOAD_LIMITS.maxBytes) {
    return {
      code: "too-large",
      message: `O vídeo tem ${formatBytes(file.size)} e o limite é 250 MB. Corte um trecho menor e tente de novo.`,
    };
  }

  return null;
}

export function validateDuration(seconds: number): UploadRejection | null {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return {
      code: "unreadable",
      message:
        "Não conseguimos ler a duração deste vídeo. Tente exportar novamente em MP4, MOV ou WebM.",
    };
  }

  if (seconds > UPLOAD_LIMITS.maxSeconds) {
    return {
      code: "too-long",
      message: `O vídeo tem ${Math.round(seconds)} segundos e o limite é 45 segundos. Envie um trecho mais curto.`,
    };
  }

  return null;
}

export function readVideoDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.muted = true;

    const cleanup = () => {
      probe.onloadedmetadata = null;
      probe.ontimeupdate = null;
      probe.onerror = null;
      probe.removeAttribute("src");
      probe.load();
    };

    const finish = (duration: number) => {
      cleanup();
      resolve(duration);
    };

    probe.onloadedmetadata = () => {
      if (Number.isFinite(probe.duration)) {
        finish(probe.duration);
        return;
      }

      // WebM gravado no navegador costuma vir sem duração: forçamos um seek
      // para o fim do arquivo e lemos o tempo real alcançado.
      probe.ontimeupdate = () => {
        probe.ontimeupdate = null;
        finish(Number.isFinite(probe.duration) ? probe.duration : probe.currentTime);
      };
      probe.currentTime = 1e6;
    };

    probe.onerror = () => {
      cleanup();
      reject(new Error("unreadable"));
    };

    probe.src = url;
  });
}
