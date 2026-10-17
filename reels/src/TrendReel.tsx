import React from "react";
import {
  AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { C } from "./brand";
import { WhatsAppIcon } from "./WhatsAppIcon";

const fonts = `
@font-face { font-family: Poppins; font-weight: 600; src: url(${staticFile("Poppins-600.woff2")}); }
@font-face { font-family: Poppins; font-weight: 700; src: url(${staticFile("Poppins-700.woff2")}); }
@font-face { font-family: Poppins; font-weight: 800; src: url(${staticFile("Poppins-800.woff2")}); }
`;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

/* ---------- shared looks ---------- */

/** Animated gradient-mesh background (moving light blobs) — modern "tech brand" look. */
const Mesh: React.FC = () => {
  const f = useCurrentFrame();
  const b = (phase: number, r: number) => ({ x: 50 + Math.sin(f / 40 + phase) * r, y: 40 + Math.cos(f / 55 + phase) * r });
  const p1 = b(0, 22), p2 = b(2, 28), p3 = b(4, 18);
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(40% 30% at ${p1.x}% ${p1.y}%, rgba(0,98,245,.85), transparent 70%),
        radial-gradient(35% 28% at ${p2.x}% ${p2.y + 30}%, rgba(0,210,226,.45), transparent 70%),
        radial-gradient(30% 25% at ${p3.x - 20}% ${p3.y + 10}%, rgba(90,60,255,.35), transparent 70%), ${C.navy}`,
    }} />
  );
};

/** Film grain + vignette on top of everything. */
const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 7} /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 45%, transparent 60%, rgba(0,0,0,.55) 100%)" }} />
    </AbsoluteFill>
  );
};

/** CapCut-style caption: big words, the active word gets a cyan box; pops in on each beat. */
const Beat: React.FC<{ words: string[]; hot?: number; size?: number; top?: number }> = ({ words, hot = -1, size = 118, top = 300 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 11, mass: 0.5, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", top, left: 60, right: 60, textAlign: "center",
      transform: `scale(${0.6 + 0.4 * pop}) rotate(${(1 - pop) * -4}deg)`, opacity: Math.min(1, pop * 2) }}>
      {words.map((w, i) => (
        <span key={i} style={{
          display: "inline-block", margin: "6px 10px", padding: i === hot ? "0 22px" : 0, borderRadius: 22,
          background: i === hot ? C.cyan : "transparent", color: i === hot ? C.navy : C.white,
          fontSize: size, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, textTransform: "uppercase",
          textShadow: i === hot ? "none" : "0 8px 30px rgba(0,0,0,.5)",
        }}>{w}</span>
      ))}
    </div>
  );
};

/** Whip transition: blurred streak + flash. */
const Whip: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 10], [-1400, 1400], { ...clamp, easing: Easing.in(Easing.quad) });
  const flash = interpolate(f, [3, 6, 10], [0, 0.55, 0], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, width: 900, left: 90, transform: `translateX(${x}px) skewX(-18deg)`,
        background: `linear-gradient(90deg, transparent, ${C.cyan}, ${C.blue}, transparent)`, filter: "blur(40px)" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

/* ---------- scenes ---------- */

/** 0–3.5 s: Veo hero clip with punch-zooms on every beat. */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const punch = (at: number) => interpolate(f, [at, at + 4, at + 14], [0, 0.07, 0], clamp);
  const zoom = 1.08 + f * 0.0015 + punch(0) + punch(35) + punch(70);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo src={staticFile("w00-s1.mp4")} volume={0.35} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,26,61,.75), rgba(7,26,61,0) 45%, rgba(7,26,61,.6))" }} />
      <Sequence durationInFrames={35}><Beat words={["Your", "customers"]} hot={1} /></Sequence>
      <Sequence from={35} durationInFrames={35}><Beat words={["Google", "you"]} hot={0} /></Sequence>
      <Sequence from={70} durationInFrames={35}><Beat words={["first."]} hot={0} size={170} /></Sequence>
    </AbsoluteFill>
  );
};

/** 3.5–6 s: problem beat on the mesh. */
const Problem: React.FC = () => (
  <AbsoluteFill>
    <Mesh />
    <Sequence durationInFrames={38}><Beat words={["No", "website?"]} hot={1} top={640} size={130} /></Sequence>
    <Sequence from={38} durationInFrames={37}><Beat words={["They", "choose", "your", "competitor."]} hot={3} top={600} size={100} /></Sequence>
  </AbsoluteFill>
);

const glass: React.CSSProperties = {
  position: "absolute", display: "flex", alignItems: "center", gap: 16, padding: "22px 30px", borderRadius: 28,
  background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.28)", backdropFilter: "blur(18px)",
  color: C.white, fontSize: 40, fontWeight: 700, boxShadow: "0 20px 50px rgba(0,0,0,.35)",
};

/** 6–10.5 s: real client site in a floating 3D phone, glass feature cards, a tap with ripple. */
const Showcase: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 16, mass: 0.8 } });
  const float = Math.sin(f / 14) * 12;
  const rotY = interpolate(enter, [0, 1], [55, -14]) + Math.sin(f / 30) * 3;
  const card = (d: number) => spring({ frame: f - d, fps, config: { damping: 12, mass: 0.6 } });
  const tap = interpolate(f, [95, 110], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Mesh />
      <div style={{ position: "absolute", top: 250, width: "100%", textAlign: "center", color: C.white, fontSize: 92, fontWeight: 800,
        letterSpacing: -2, opacity: enter, transform: `translateY(${(1 - enter) * 40}px)` }}>
        Like <span style={{ color: C.cyan }}>this.</span>
      </div>
      <div style={{ position: "absolute", left: "50%", top: 470 + float, perspective: 1800 }}>
        <div style={{ width: 460, height: 940, marginLeft: -230, borderRadius: 66, background: "#0B1220", padding: 16,
          boxShadow: "0 80px 140px rgba(0,0,0,.6), 0 0 0 4px #2A3550 inset, 0 0 120px rgba(0,210,226,.25)",
          transform: `rotateY(${rotY}deg) rotateX(8deg) scale(${0.7 + 0.3 * enter})` }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 52, overflow: "hidden", position: "relative" }}>
            <Img src={staticFile("msj.png")} style={{ width: "100%" }} />
            <div style={{ position: "absolute", left: 92, top: 570, width: 120 * tap, height: 120 * tap, marginLeft: -60 * tap, marginTop: -60 * tap,
              borderRadius: "50%", border: `6px solid ${C.cyan}`, opacity: 1 - tap }} />
          </div>
        </div>
      </div>
      {[
        { t: "📱 Mobile-first", x: 40, y: 640, d: 20 },
        { t: "⚡ Loads fast", x: 620, y: 860, d: 30 },
        { t: "🔍 SEO ready", x: 60, y: 1120, d: 40 },
        { t: "💬 WhatsApp button", x: 520, y: 1330, d: 50 },
      ].map((c) => {
        const s = card(c.d);
        return (
          <div key={c.t} style={{ ...glass, left: c.x, top: c.y + Math.sin((f + c.d) / 12) * 8, opacity: s,
            transform: `scale(${s}) translateY(${(1 - s) * 30}px)` }}>{c.t}</div>
        );
      })}
      <div style={{ position: "absolute", top: 1490, width: "100%", textAlign: "center", color: "#B9C8E6", fontSize: 32, fontWeight: 600,
        opacity: card(60) }}>Our work · msjtechnicaluae.com</div>
    </AbsoluteFill>
  );
};

const Marquee: React.FC<{ items: string[]; speed: number; top: number; dir: 1 | -1 }> = ({ items, speed, top, dir }) => {
  const f = useCurrentFrame();
  const row = [...items, ...items, ...items];
  return (
    <div style={{ position: "absolute", top, left: 0, whiteSpace: "nowrap", transform: `translateX(${dir * (-f * speed) - (dir > 0 ? 0 : 1400)}px) rotate(-6deg)` }}>
      {row.map((t, i) => (
        <span key={i} style={{ display: "inline-block", margin: "0 18px", padding: "22px 40px", borderRadius: 999, fontSize: 52, fontWeight: 800,
          color: i % 2 ? C.navy : C.white, background: i % 2 ? C.cyan : "rgba(255,255,255,.1)", border: "2px solid rgba(255,255,255,.2)" }}>{t}</span>
      ))}
    </div>
  );
};

/** 10.5–12.5 s: services marquee. */
const Services: React.FC = () => (
  <AbsoluteFill>
    <Mesh />
    <Beat words={["One", "team.", "Everything", "digital."]} hot={3} top={330} size={96} />
    <Marquee items={["Website Design", "AI Automation", "Digital Marketing", "Business Email"]} speed={14} top={900} dir={1} />
    <Marquee items={["WhatsApp Chatbots", "Google & Meta Ads", "SEO", "Google Workspace"]} speed={12} top={1080} dir={-1} />
  </AbsoluteFill>
);

/** 12.5–16 s: AED 999 counter → logo light sweep → WhatsApp CTA. */
const Offer: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.round(interpolate(f, [0, 28], [0, 999], { ...clamp, easing: outExpo }));
  const logo = spring({ frame: f - 40, fps, config: { damping: 12 } });
  const sweep = interpolate(f, [52, 72], [-150, 350], clamp);
  const cta = spring({ frame: f - 55, fps, config: { damping: 12 } });
  const ring = ((f - 55) % 30) / 30;
  return (
    <AbsoluteFill>
      <Mesh />
      <div style={{ position: "absolute", top: 260, width: "100%", textAlign: "center", opacity: interpolate(f, [0, 8, 36, 44], [0, 1, 1, 0], clamp) }}>
        <div style={{ color: "#B9C8E6", fontSize: 44, fontWeight: 700, letterSpacing: 4 }}>WEBSITES FROM</div>
        <div style={{ fontSize: 260, fontWeight: 800, letterSpacing: -8, lineHeight: 1,
          background: `linear-gradient(90deg, #fff, ${C.cyan})`, WebkitBackgroundClip: "text", color: "transparent" }}>
          <span style={{ fontSize: 100, letterSpacing: 0 }}>AED </span>{n}
        </div>
        <div style={{ color: C.white, fontSize: 46, fontWeight: 700, marginTop: 10 }}>Domain + 1 year hosting included</div>
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 46, paddingTop: 120, opacity: logo }}>
        <div style={{ position: "relative", width: 250, height: 250, borderRadius: 62, background: "#fff", overflow: "hidden",
          display: "grid", placeItems: "center", transform: `scale(${logo})`, boxShadow: "0 40px 100px rgba(0,98,245,.5)" }}>
          <Img src={staticFile("logo.png")} style={{ width: 190 }} />
          <div style={{ position: "absolute", top: -50, left: sweep, width: 70, height: 360, transform: "rotate(25deg)",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,.9), transparent)" }} />
        </div>
        <div style={{ fontSize: 74, fontWeight: 800, color: C.white, letterSpacing: 2 }}>AZMIN <span style={{ color: C.cyan }}>DIGITAL</span></div>
        <div style={{ position: "relative", transform: `scale(${cta})` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: `4px solid ${C.wa}`, transform: `scale(${1 + ring * 0.35})`, opacity: 1 - ring }} />
          <div style={{ display: "flex", alignItems: "center", gap: 20, background: C.wa, color: "#fff", fontSize: 54, fontWeight: 800,
            padding: "30px 60px", borderRadius: 999, boxShadow: "0 24px 60px rgba(37,211,102,.45)" }}>
            <WhatsAppIcon size={62} /> Chat on WhatsApp
          </div>
        </div>
        <div style={{ color: "#B9C8E6", fontSize: 38, fontWeight: 600, opacity: cta }}>azmindigital.com</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const TrendReel: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: "Poppins, sans-serif", backgroundColor: C.navy }}>
    <style>{fonts}</style>
    <Sequence durationInFrames={105}><Hook /></Sequence>
    <Sequence from={105} durationInFrames={75}><Problem /></Sequence>
    <Sequence from={180} durationInFrames={135}><Showcase /></Sequence>
    <Sequence from={315} durationInFrames={60}><Services /></Sequence>
    <Sequence from={375} durationInFrames={105}><Offer /></Sequence>
    {[100, 175, 310, 370].map((at) => <Sequence key={at} from={at} durationInFrames={12}><Whip /></Sequence>)}
    <Finish />
  </AbsoluteFill>
);
