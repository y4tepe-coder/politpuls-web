import { ImageResponse } from "next/og";

// App icon served at /icon (used by Next.js for the browser tab favicon).
// Renders the Politpuls mark — black speech bubble with white EKG pulse —
// matching the iOS app icon.

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fef8ed",
        }}
      >
        <svg viewBox="0 0 100 100" width="56" height="56">
          <path
            d="M 28 6 H 72 C 84 6 94 16 94 28 V 60 C 94 72 84 82 72 82 H 44 L 28 96 L 34 82 H 28 C 16 82 6 72 6 60 V 28 C 6 16 16 6 28 6 Z"
            fill="#0f172a"
          />
          <path
            d="M 20 46 H 38 L 44 36 L 50 18 L 56 76 L 62 46 H 80"
            fill="none"
            stroke="white"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
