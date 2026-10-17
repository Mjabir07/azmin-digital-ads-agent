import React from "react";
import {
  AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { C } from "./brand";

const fonts = `
@font-face { font-family: Poppins; font-weight: 400; src: url(${staticFile("Poppins-400.woff2")}); }
@font-face { font-family: Poppins; font-weight: 600; src: url(${staticFile("Poppins-600.woff2")}); }
@font-face { font-family: Poppins; font-weight: 700; src: url(${staticFile("Poppins-700.woff2")}); }
@font-face { font-family: Poppins; font-weight: 800; src: url(${staticFile("Poppins-800.woff2")}); }
`;

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Words rise in one by one with a soft blur — the "premium kinetic type" look. */
const KineticLine: React.FC<{ words: string[]; start: number; size: number; highlight?: string[] }> = ({
  words, start, size, highlight = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `0 ${size * 0.28}px` }}>
      {words.map((w, i) => {
        const s = spring({ frame: frame - start - i * 4, fps, config: { damping: 200, mass: 0.6 } });
        return (
          <span key={i} style={{
            fontSize: size, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.05,
            color: highlight.includes(w) ? C.cyan : C.white,
            opacity: s, transform: `translateY(${(1 - s) * 60}px)`, filter: `blur(${(1 - s) * 10}px)`,
            textShadow: "0 6px 30px rgba(0,0,0,.45)",
          }}>{w}</span>
        );
      })}
    </div>
  );
};

const Fade: React.FC<{ children: React.ReactNode; dur: number; inF?: number; outF?: number }> = ({
  children, dur, inF = 10, outF = 12,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, inF, dur - outF, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const BrandBg: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 200], [0, -80]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 1100px at 80% 12%, #0A5BE0 0%, ${C.navy} 62%)` }}>
      <div style={{ position: "absolute", width: 900, height: 200, borderRadius: 60, background: C.cyan, opacity: 0.12,
        transform: `rotate(-28deg) translateX(${drift}px)`, right: -260, bottom: 300 }} />
      <div style={{ position: "absolute", width: 1100, height: 230, borderRadius: 60, background: C.cyan, opacity: 0.07,
        transform: `rotate(-28deg) translateX(${-drift}px)`, left: -420, top: 260 }} />
    </AbsoluteFill>
  );
};

/** Scene 1+2: the Veo clip with a slow push-in and kinetic headlines. */
const HeroClip: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 240], [1.0, 1.12]);
  const vol = interpolate(frame, [0, 15, 200, 240], [0, 0.6, 0.6, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo src={staticFile("w00-s1.mp4")} volume={vol} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,26,61,.85) 0%, rgba(7,26,61,.25) 38%, rgba(7,26,61,0) 55%, rgba(7,26,61,.55) 100%)" }} />
      <Sequence from={6} durationInFrames={118}>
        <Fade dur={118}>
          <div style={{ position: "absolute", top: 270, left: 80, right: 80 }}>
            <KineticLine words={["Your", "customers", "check", "your", "website"]} start={0} size={96} highlight={["website"]} />
            <div style={{ height: 12 }} />
            <KineticLine words={["before", "they", "call."]} start={22} size={96} />
          </div>
        </Fade>
      </Sequence>
      <Sequence from={126} durationInFrames={114}>
        <Fade dur={114} outF={8}>
          <div style={{ position: "absolute", top: 270, left: 80, right: 80 }}>
            <KineticLine words={["Does", "yours", "look"]} start={0} size={110} />
            <KineticLine words={["this", "premium?"]} start={10} size={110} highlight={["premium?"]} />
          </div>
        </Fade>
      </Sequence>
    </AbsoluteFill>
  );
};

/** Brand-stroke wipe between scenes (echoes the logo's angled bars). */
const Wipe: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 18], [-2600, 2600], { easing: ease, extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: -600, left: 0, width: 1500, height: 3200, transform: `translateX(${x}px) rotate(28deg)`,
        background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})` }} />
    </AbsoluteFill>
  );
};

/** Scene 3: real client work in a 3D phone reveal. */
const OurWork: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 4, fps, config: { damping: 18, mass: 0.9 } });
  const rot = interpolate(s, [0, 1], [38, -12]);
  const scroll = interpolate(frame, [30, 110], [0, -60], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <BrandBg />
      <div style={{ position: "absolute", top: 260, left: 80, right: 80 }}>
        <KineticLine words={["Websites", "that", "win", "customers."]} start={2} size={88} highlight={["win"]} />
      </div>
      <div style={{ position: "absolute", left: "50%", top: 560, perspective: 1600 }}>
        <div style={{
          width: 440, height: 900, marginLeft: -220, borderRadius: 64, background: "#0B1220", padding: 18,
          boxShadow: "0 60px 120px rgba(0,0,0,.5), 0 0 0 4px #2A3550 inset",
          transform: `translateY(${(1 - s) * 500}px) rotateY(${rot}deg) rotateX(6deg)`, opacity: Math.min(1, s * 1.5),
        }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 56, overflow: "hidden", background: "#000" }}>
            <Img src={staticFile("msj.png")} style={{ width: "100%", transform: `translateY(${scroll}px)` }} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 1500, width: "100%", textAlign: "center", color: "#B9C8E6", fontSize: 34, fontWeight: 600,
        opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" }) }}>
        Our work · msjtechnicaluae.com
      </div>
    </AbsoluteFill>
  );
};

const services = [
  { icon: "🌐", t: "Website Design" },
  { icon: "🤖", t: "AI Automation" },
  { icon: "📈", t: "Digital Marketing" },
  { icon: "📧", t: "Business Email" },
];

/** Scene 4: the four services spring in. */
const Services: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <BrandBg />
      <div style={{ position: "absolute", top: 300, left: 80, right: 80 }}>
        <KineticLine words={["One", "team", "for", "your", "growth."]} start={0} size={100} highlight={["growth."]} />
      </div>
      <div style={{ position: "absolute", top: 720, left: 80, right: 80, display: "grid", gap: 30 }}>
        {services.map((sv, i) => {
          const s = spring({ frame: frame - 12 - i * 6, fps, config: { damping: 14, mass: 0.7 } });
          return (
            <div key={sv.t} style={{
              display: "flex", alignItems: "center", gap: 30, padding: "30px 36px", borderRadius: 34,
              background: "rgba(255,255,255,.08)", border: "2px solid rgba(255,255,255,.16)",
              transform: `translateX(${(1 - s) * -700}px)`, opacity: s,
            }}>
              <div style={{ width: 96, height: 96, borderRadius: 28, display: "grid", placeItems: "center", fontSize: 50,
                background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})` }}>{sv.icon}</div>
              <div style={{ color: C.white, fontSize: 56, fontWeight: 700 }}>{sv.t}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Scene 5: logo + call to action. */
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12 } });
  const cta = spring({ frame: frame - 12, fps, config: { damping: 14 } });
  const pulse = 1 + Math.sin(frame / 5) * 0.02 * cta;
  return (
    <AbsoluteFill>
      <BrandBg />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 50 }}>
        <div style={{ width: 260, height: 260, borderRadius: 64, background: C.white, display: "grid", placeItems: "center",
          transform: `scale(${s})`, boxShadow: "0 40px 90px rgba(0,98,245,.45)" }}>
          <Img src={staticFile("logo.png")} style={{ width: 200 }} />
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, color: C.white, letterSpacing: 2, opacity: s }}>
          AZMIN <span style={{ color: C.cyan }}>DIGITAL</span>
        </div>
        <div style={{ transform: `scale(${cta * pulse})`, background: C.wa, color: C.white, fontSize: 52, fontWeight: 800,
          padding: "32px 64px", borderRadius: 999, boxShadow: "0 24px 60px rgba(37,211,102,.4)" }}>
          💬 Chat on WhatsApp
        </div>
        <div style={{ color: "#B9C8E6", fontSize: 38, fontWeight: 600, opacity: cta }}>azmindigital.com</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const DemoReel: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: "Poppins, sans-serif", backgroundColor: C.navy }}>
    <style>{fonts}</style>
    <Sequence durationInFrames={240}><HeroClip /></Sequence>
    <Sequence from={240} durationInFrames={120}><OurWork /></Sequence>
    <Sequence from={360} durationInFrames={90}><Services /></Sequence>
    <Sequence from={450} durationInFrames={90}><Outro /></Sequence>
    <Sequence from={228} durationInFrames={24}><Wipe /></Sequence>
    <Sequence from={350} durationInFrames={24}><Wipe /></Sequence>
    <Sequence from={440} durationInFrames={24}><Wipe /></Sequence>
  </AbsoluteFill>
);
