"use client";

import { useEffect, useRef } from "react";
import { POSE_CONNECTIONS, RELEVANT_LANDMARKS } from "@/lib/analysis/geometry";
import type { PoseFrame } from "@/lib/types";
import { cn } from "@/lib/utils";

function nearestFrame(frames: PoseFrame[], time: number): PoseFrame | null {
  if (frames.length === 0) return null;
  let best = frames[0];
  let bestDistance = Math.abs(frames[0].time - time);
  for (const frame of frames) {
    const distance = Math.abs(frame.time - time);
    if (distance < bestDistance) {
      best = frame;
      bestDistance = distance;
    }
  }
  return bestDistance <= 0.34 ? best : null;
}

interface PoseOverlayProps {
  frames: PoseFrame[];
  time: number;
  className?: string;
}

export function PoseOverlay({ frames, time, className }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const render = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const ratio = window.devicePixelRatio || 1;
      const width = parent.clientWidth;
      const height = parent.clientHeight;

      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const frame = nearestFrame(frames, time);
      if (!frame) return;

      const toCanvas = (index: number) => {
        const landmark = frame.landmarks[index];
        if (!landmark) return null;
        return { x: landmark.x * width, y: landmark.y * height };
      };

      context.lineCap = "round";
      context.strokeStyle = "rgba(255, 255, 255, 0.85)";
      context.lineWidth = 5;
      for (const [from, to] of POSE_CONNECTIONS) {
        const a = toCanvas(from);
        const b = toCanvas(to);
        if (!a || !b) continue;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }

      context.strokeStyle = "#08713A";
      context.lineWidth = 2.5;
      for (const [from, to] of POSE_CONNECTIONS) {
        const a = toCanvas(from);
        const b = toCanvas(to);
        if (!a || !b) continue;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }

      for (const index of RELEVANT_LANDMARKS) {
        const point = toCanvas(index);
        if (!point) continue;
        context.beginPath();
        context.arc(point.x, point.y, 5.5, 0, Math.PI * 2);
        context.fillStyle = "#38D178";
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = "#FFFFFF";
        context.stroke();
      }
    };

    render();

    const observer = new ResizeObserver(render);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [frames, time]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
