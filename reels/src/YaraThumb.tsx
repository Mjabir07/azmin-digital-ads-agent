import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "./brand";

/**
 * Reel cover / thumbnail for "AI Tools with Yara" (AZMIN Editorial). Yara comes from that episode's Flow clip
 * (a frame with her outfit, place and expression of the day), so every cover looks different.
 * Text stays inside the centre 1080x1350 so the profile grid crop never cuts it.
 */
export type ThumbProps = { ep: number; kicker: string; title: string; accent: string; image: string; layout?: "bottom" | "top" };

const fonts = `
@font-face { font-family: Inter Tight; font-weight: 100 900; src: url(${staticFile("InterTight.woff2")}); }
@font-face { font-family: Serif; font-style: italic; src: url(${staticFile("InstrumentSerif-400i.woff2")}); }
`;

export const YaraThumb: React.FC<ThumbProps> = ({ ep, kicker, title, accent, image, layout = "bottom" }) => {
  const top = layout === "top";
  const [before, after] = title.split(accent);
  return (
    <AbsoluteFill style={{ fontFamily: "Inter Tight, sans-serif", background: C.navy }}>
      <style>{fonts}</style>
      <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%" }} />
      <AbsoluteFill style={{ background: top
        ? "linear-gradient(180deg, rgba(7,26,61,.92) 0%, rgba(7,26,61,.55) 38%, rgba(7,26,61,0) 60%)"
        : "linear-gradient(0deg, rgba(7,26,61,.95) 0%, rgba(7,26,61,.6) 36%, rgba(7,26,61,0) 62%)" }} />
      <div style={{ position: "absolute", left: 70, right: 70, top: top ? 330 : undefined, bottom: top ? undefined : 330 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ background: C.cyan, color: C.navy, fontWeight: 900, fontSize: 34, letterSpacing: 4, padding: "10px 22px", borderRadius: 999 }}>EP {String(ep).padStart(2, "0")}</span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 30, letterSpacing: 5, opacity: 0.9 }}>{kicker}</span>
        </div>
        <div style={{ marginTop: 26, color: "#fff", fontSize: 112, fontWeight: 900, letterSpacing: -4.5, lineHeight: 1.0, textShadow: "0 6px 30px rgba(0,0,0,.35)" }}>
          {before}
          <span style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 400, letterSpacing: 0, padding: "0 .1em",
            background: `linear-gradient(transparent 14%, ${C.blue} 14%, ${C.blue} 90%, transparent 90%)` }}>{accent}</span>
          {after}
        </div>
        <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 14, color: "#fff", fontWeight: 800, fontSize: 30 }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: "#fff", padding: 7 }}><Img src={staticFile("logo.png")} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
          AI TOOLS <span style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 400, fontSize: 38, marginLeft: -4 }}>with Yara</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
