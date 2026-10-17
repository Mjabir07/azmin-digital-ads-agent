import React from "react";
import {
  AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { C } from "./brand";
import { WhatsAppIcon } from "./WhatsAppIcon";

/**
 * "Editorial creator" style: talking-head avatar + word-by-word captions, cream magazine pages,
 * sans/serif-italic type mix, cuts on the music's bars. Music: "Emerge" by Alex Beroza (CC BY 3.0).
 */

export const fonts = `
@font-face { font-family: Inter Tight; font-weight: 100 900; src: url(${staticFile("InterTight.woff2")}); }
@font-face { font-family: Serif; font-style: italic; src: url(${staticFile("InstrumentSerif-400i.woff2")}); }
`;
export const P = { paper: "#F4F1EA", ink: "#0B0B0C", muted: "#6B6A66", line: "rgba(11,11,12,.08)" };
export const PHONE = "+971 56 724 7597";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
const BAR = 60.6; // one bar of the track (4 beats at ~118.8 bpm) in frames
export const CREATOR_REEL_FRAMES = Math.round(BAR * 9);

const useSpring = (delay = 0, damping = 14) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping, mass: 0.6, stiffness: 180 } });
};

/** A caption line: words rise in one by one; *starred* words are serif italic on a blue marker. */
const Caption: React.FC<{ text: string; dark?: boolean; size?: number }> = ({ text, dark, size = 96 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 22px", padding: "0 70px" }}>
      {words.map((raw, i) => {
        const hot = raw.startsWith("*");
        const w = raw.replace(/\*/g, "");
        const s = spring({ frame: f - i * 3, fps, config: { damping: 15, mass: 0.5, stiffness: 200 } });
        const mark = interpolate(f - i * 3, [4, 14], [0, 1], { ...clamp, easing: outExpo });
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", opacity: s,
            transform: `translateY(${(1 - s) * 50}px)`, filter: `blur(${(1 - s) * 8}px)` }}>
            {hot && <span style={{ position: "absolute", left: -10, right: -10, bottom: size * 0.08, height: size * 0.5,
              background: C.blue, transform: `scaleX(${mark}) skewX(-8deg)`, transformOrigin: "left", borderRadius: 6 }} />}
            <span style={{ position: "relative", fontFamily: hot ? "Serif" : "Inter Tight", fontStyle: hot ? "italic" : "normal",
              fontWeight: hot ? 400 : 800, fontSize: hot ? size * 1.2 : size, letterSpacing: hot ? 0 : -3, lineHeight: 1.15,
              color: dark ? P.ink : C.white, textShadow: dark ? "none" : "0 4px 24px rgba(0,0,0,.45)" }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

/** Thin story-style progress bar + creator handle chip. */
const Chrome: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const f = useCurrentFrame();
  const col = dark ? P.ink : C.white;
  return (
    <>
      <div style={{ position: "absolute", top: 70, left: 50, right: 50, height: 6, borderRadius: 3, background: dark ? P.line : "rgba(255,255,255,.3)" }}>
        <div style={{ height: "100%", borderRadius: 3, background: col, width: `${(f / CREATOR_REEL_FRAMES) * 100}%` }} />
      </div>
      <div style={{ position: "absolute", top: 104, left: 50, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: "#fff", display: "grid", placeItems: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,.2)" }}><Img src={staticFile("logo.png")} style={{ width: 46 }} /></div>
        <div style={{ color: col, fontSize: 34, fontWeight: 700, textShadow: dark ? "none" : "0 2px 10px rgba(0,0,0,.4)" }}>azmindigital</div>
      </div>
    </>
  );
};

/* ---------- 1. Avatar talking head (0 – 4 bars) ---------- */

const lines = ["before they call you…", "they *google* you.", "no website?", "no *trust.*", "ready in as little as *1\u00a0day*"];

const Avatar: React.FC = () => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, BAR * 4], [1.06, 1.16]) + interpolate(f % (BAR / 2), [0, 3, 10], [0, 0.012, 0], clamp);
  const card = useSpring(BAR * 1.6, 13);
  const per = (BAR * 4) / lines.length;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 35%" }}>
        <OffthreadVideo src={staticFile("w00-s2.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35), transparent 22%, transparent 55%, rgba(0,0,0,.65))" }} />
      {/* pop-out of what he's showing: the real client site */}
      <div style={{ position: "absolute", left: 60, top: 760, opacity: card,
        transform: `translateX(${(1 - card) * -120}px) rotate(${-6 + (1 - card) * -10}deg) scale(${0.8 + 0.2 * card})` }}>
        <div style={{ width: 330, height: 560, borderRadius: 40, overflow: "hidden", border: "8px solid #fff",
          boxShadow: "0 30px 80px rgba(0,0,0,.5)", background: "#fff" }}>
          <Img src={staticFile("msj.png")} style={{ width: "100%", transform: `translateY(${-interpolate(f, [BAR * 1.6, BAR * 4], [0, 160], clamp)}px)` }} />
        </div>
        <div style={{ position: "absolute", top: -34, right: -40, background: P.paper, color: P.ink, padding: "12px 24px",
          borderRadius: 999, fontSize: 30, fontWeight: 700, transform: "rotate(8deg)", boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>
          real client <span style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 400, fontSize: 36 }}>↗</span>
        </div>
      </div>
      {lines.map((t, i) => (
        <Sequence key={i} from={Math.round(i * per)} durationInFrames={Math.round(per)}>
          <div style={{ position: "absolute", top: 1380, width: "100%" }}><Caption text={t} /></div>
        </Sequence>
      ))}
      <Chrome />
    </AbsoluteFill>
  );
};

/* ---------- 2. What you get (2 bars) ---------- */

export const Paper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: P.paper,
    backgroundImage: `linear-gradient(${P.line} 2px, transparent 2px), linear-gradient(90deg, ${P.line} 2px, transparent 2px)`,
    backgroundSize: "120px 120px", backgroundPosition: "-2px -2px" }}>{children}</AbsoluteFill>
);

const items = ["Custom business website", "Mobile-friendly design", "Free domain name", "1 year free hosting"];

const WhatYouGet: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Paper>
      <div style={{ position: "absolute", top: 300, left: 90, right: 90 }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.blue, letterSpacing: 6 }}>STARTER COMBO</div>
        <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: -7, color: P.ink, lineHeight: 1, marginTop: 20 }}>
          what you <span style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 400, letterSpacing: 0, color: C.blue }}>get</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 760, left: 90, right: 90 }}>
        {items.map((t, i) => {
          const s = spring({ frame: f - 12 - i * (BAR / 4), fps, config: { damping: 14, mass: 0.6 } });
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 34, padding: "34px 0", borderTop: `2px solid ${P.line}`,
              opacity: s, transform: `translateX(${(1 - s) * 80}px)` }}>
              <span style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 64, color: P.muted, width: 70 }}>0{i + 1}</span>
              <span style={{ flex: 1, fontSize: 58, fontWeight: 700, color: P.ink, letterSpacing: -1.5 }}>{t}</span>
              <span style={{ width: 70, height: 70, borderRadius: 35, background: C.blue, color: "#fff", display: "grid", placeItems: "center",
                fontSize: 40, fontWeight: 800, transform: `scale(${s})` }}>✓</span>
            </div>
          );
        })}
      </div>
      <Chrome dark />
    </Paper>
  );
};

/* ---------- 3. Price (1 bar) ---------- */

const Price: React.FC = () => {
  const f = useCurrentFrame();
  const r = interpolate(f, [0, 14], [0, 150], { ...clamp, easing: outExpo });
  const n = Math.round(interpolate(f, [4, 30], [0, 999], { ...clamp, easing: outExpo }));
  return (
    <AbsoluteFill style={{ clipPath: `circle(${r}% at 50% 50%)`, background: C.blue, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 150, color: P.paper, lineHeight: 1 }}>from</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, color: "#fff", fontWeight: 900, letterSpacing: -14, lineHeight: 0.9 }}>
        <span style={{ fontSize: 120, letterSpacing: -4 }}>AED</span><span style={{ fontSize: 330, fontVariantNumeric: "tabular-nums" }}>{n}</span>
      </div>
      <div style={{ marginTop: 40, fontSize: 50, fontWeight: 700, color: P.paper, letterSpacing: -1 }}>domain + hosting included</div>
      <Chrome />
    </AbsoluteFill>
  );
};

/* ---------- 4. Contact end card (3 bars) ---------- */

export const EndCard: React.FC<{ bubble?: string; bubbleFrom?: number; chrome?: boolean }> = ({ bubble = "w00-s2.mp4", bubbleFrom = 120, chrome = true }) => {
  const f = useCurrentFrame();
  const head = useSpring(0);
  const pill = useSpring(10, 12);
  const num = useSpring(18);
  const typed = PHONE.slice(0, Math.round(interpolate(f, [18, 44], [0, PHONE.length], clamp)));
  const ring = ((f + 30) % 36) / 36;
  const bob = Math.sin(f / 6) * 10;
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 380 }}>
        <div style={{ position: "relative", width: 260, height: 260, transform: `scale(${head})` }}>
          <div style={{ width: 260, height: 260, borderRadius: 130, overflow: "hidden", border: "8px solid #fff", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <OffthreadVideo src={staticFile(bubble)} muted startFrom={bubbleFrom} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} />
          </div>
          <div style={{ position: "absolute", right: 14, bottom: 14, width: 48, height: 48, borderRadius: 24, background: C.wa, border: "6px solid " + P.paper }} />
        </div>
        <div style={{ marginTop: 50, fontSize: 116, fontWeight: 800, color: P.ink, letterSpacing: -5, opacity: head,
          transform: `translateY(${(1 - head) * 30}px)` }}>
          let's build <span style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 400, letterSpacing: 0, color: C.blue }}>yours</span>
        </div>
        <div style={{ position: "relative", marginTop: 60, transform: `scale(${pill})` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: `5px solid ${C.wa}`, transform: `scale(${1 + ring * 0.3})`, opacity: 1 - ring }} />
          <div style={{ display: "flex", alignItems: "center", gap: 22, background: C.wa, color: "#fff", fontSize: 56, fontWeight: 800,
            padding: "30px 62px", borderRadius: 999, boxShadow: "0 24px 60px rgba(37,211,102,.4)" }}>
            <WhatsAppIcon size={66} /> Chat on WhatsApp
          </div>
        </div>
        <div style={{ marginTop: 56, display: "flex", alignItems: "center", gap: 20, opacity: num }}>
          <WhatsAppIcon size={58} color={C.wa} />
          <span style={{ fontSize: 84, fontWeight: 800, color: P.ink, letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>{typed}</span>
        </div>
        <div style={{ marginTop: 26, fontSize: 40, fontWeight: 500, color: P.muted, opacity: num }}>azmindigital.com · Dubai</div>
        <div style={{ position: "absolute", bottom: 150, fontSize: 38, fontWeight: 700, color: P.ink, opacity: num, transform: `translateY(${bob}px)` }}>
          tap <span style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 400, fontSize: 46 }}>"Send message"</span> ↓
        </div>
      </AbsoluteFill>
      {chrome && <Chrome dark />}
    </Paper>
  );
};

/** Paper sheet that slides up over the previous scene (rounded top) — the "page turn" between scenes. */
export const SlideUp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const y = interpolate(f, [0, 12], [1920, 0], { ...clamp, easing: outExpo });
  const rad = interpolate(f, [0, 12], [80, 0], clamp);
  return <AbsoluteFill style={{ transform: `translateY(${y}px)`, borderRadius: `${rad}px ${rad}px 0 0`, overflow: "hidden" }}>{children}</AbsoluteFill>;
};

export const CreatorReel: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const b = (n: number) => Math.round(BAR * n);
  return (
    <AbsoluteFill style={{ fontFamily: "Inter Tight, sans-serif", backgroundColor: P.ink }}>
      <style>{fonts}</style>
      <Audio src={staticFile("music-emerge.mp3")} startFrom={Math.round(40.04 * 30)}
        volume={(f) => interpolate(f, [0, 4, durationInFrames - 25, durationInFrames - 1], [0, 0.9, 0.9, 0], clamp)} />
      <Sequence durationInFrames={b(4)}><Avatar /></Sequence>
      <Sequence from={b(4)} durationInFrames={b(2)}><SlideUp><WhatYouGet /></SlideUp></Sequence>
      <Sequence from={b(6)} durationInFrames={b(1)}><Price /></Sequence>
      <Sequence from={b(7)}><SlideUp><EndCard /></SlideUp></Sequence>
    </AbsoluteFill>
  );
};
