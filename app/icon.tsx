import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#1A1A1A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
          fontSize: 20,
          color: "#C9956C",
          fontStyle: "italic",
          fontWeight: 700,
        }}
      >
        A
      </div>
    ),
    { ...size }
  );
}
