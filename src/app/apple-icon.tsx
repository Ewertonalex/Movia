import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícone da tela inicial no iPhone e atalho no Android. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10231a",
        }}
      >
        <svg width="156" height="156" viewBox="0 0 32 32">
          <defs>
            <linearGradient
              id="movia-apple-gradient"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#38D178" />
              <stop offset="100%" stopColor="#08713A" />
            </linearGradient>
          </defs>
          <path
            d="M16 1.6c8.2 0 14.4 5.9 14.4 14.4S24.2 30.4 16 30.4 1.6 24.5 1.6 16 7.8 1.6 16 1.6Z"
            fill="url(#movia-apple-gradient)"
          />
          <path
            d="M8.4 20.6c2.6-.2 4.4-1.4 5.8-3.5 1.4-2.1 2.6-3.4 4.3-3.9"
            stroke="#E4FF6D"
            strokeWidth="2.1"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M11.6 24.2c3.4-.3 5.8-1.9 7.6-4.7"
            stroke="#FFFFFF"
            strokeOpacity="0.85"
            strokeWidth="1.7"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="21.4" cy="10.6" r="2.6" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    size,
  );
}
