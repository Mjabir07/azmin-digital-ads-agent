import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./brand";
import { EndCard, P, Paper, SlideUp, fonts } from "./CreatorReel";

/** Motion reel (no Flow credits): real client site in a floating phone, AZMIN Editorial look. */
export const WORK_REEL_FRAMES = 420;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Title: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 14, mass: 0.6 } });
  return <div style={{ opacity: s, transform: `translateY(${(1 - s) * 40}px)`, filter: `blur(${(1 - s) * 6}px)` }}>{children}</div>;
};

const Phone: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f - 10, fps, config: { damping: 16, mass: 0.8 } });
  const zoom = interpolate(f, [40, 300], [1, 1.08], clamp);
  return (
    <div style={{ position: "absolute", left: "50%", top: 640 + Math.sin(f / 16) * 10, perspective: 1800 }}>
      <div style={{ width: 470, height: 960, marginLeft: -235, borderRadius: 68, background: "#0B1220", padding: 16,
        boxShadow: "0 60px 120px rgba(11,11,12,.35)", transform: `rotateY(${interpolate(enter, [0, 1], [40, -10])}deg) rotateX(6deg) scale(${0.75 + 0.25 * enter})` }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 54, overflow: "hidden", background: "#fff" }}>
          <Img src={staticFile("msj.png")} style={{ width: "100%", transform: `scale(${zoom})`, transformOrigin: "50% 30%" }} />
        </div>
      </div>
    </div>
  );
};

const Chip: React.FC<{ text: string; x: number; y: number; delay: number }> = ({ text, x, y, delay }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 12, mass: 0.5 } });
  return (
    <div style={{ position: "absolute", left: x, top: y + Math.sin((f + delay) / 12) * 6, transform: `scale(${s})`, opacity: s,
      background: "#fff", color: P.ink, borderRadius: 999, padding: "18px 30px", fontSize: 38, fontWeight: 800,
      boxShadow: "0 16px 40px rgba(11,11,12,.18)", display: "flex", gap: 12, alignItems: "center" }}>
      <span style={{ width: 40, height: 40, borderRadius: 20, background: C.blue, color: "#fff", display: "grid", placeItems: "center", fontSize: 24 }}>✓</span>{text}
    </div>
  );
};

export const WorkReel: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: "Inter Tight, sans-serif" }}>
      <style>{fonts}</style>
      <Audio src={staticFile("music-emerge.mp3")} startFrom={Math.round(40.04 * 30)}
        volume={(x) => interpolate(x, [0, 6, durationInFrames - 20, durationInFrames - 1], [0, 0.8, 0.8, 0], clamp)} />
      <Paper>
        <div style={{ position: "absolute", top: 250, left: 80, right: 80 }}>
          <Title><div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 6, color: C.blue }}>OUR WORK</div></Title>
          <Title delay={6}><div style={{ fontSize: 110, fontWeight: 800, letterSpacing: -5, color: P.ink, lineHeight: 1.02, marginTop: 14 }}>
            Real client, <span style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 400, letterSpacing: 0, color: "#fff", background: C.blue, padding: "0 12px" }}>real website.</span>
          </div></Title>
        </div>
        <Phone />
        <Chip text="Mobile-first" x={40} y={900} delay={70} />
        <Chip text="Quote button" x={640} y={1130} delay={95} />
        <Chip text="WhatsApp chat" x={50} y={1380} delay={120} />
        <Sequence from={150}>
          <div style={{ position: "absolute", bottom: 150, width: "100%", textAlign: "center", fontSize: 40, fontWeight: 700, color: P.muted,
            opacity: interpolate(f, [150, 165], [0, 1], clamp) }}>
            MSJ Technical Services · <span style={{ color: P.ink }}>msjtechnicaluae.com</span>
          </div>
        </Sequence>
      </Paper>
      <Sequence from={300}><SlideUp><EndCard bubble="w01-y3.mp4" bubbleFrom={120} /></SlideUp></Sequence>
    </AbsoluteFill>
  );
};
