import React from "react";
import {
  AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { C } from "./brand";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { EndCard, P, PHONE, SlideUp, fonts } from "./CreatorReel";
import words from "./data/w01-words.json";

/**
 * Talking-avatar reel: Flow clips of Jabir's avatar, jump-cut on pauses, karaoke captions from
 * faster-whisper word timings, pop-ups timed to the words, ducked music, contact end card.
 */

const FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
type Word = [string, number, number];
type ClipId = "W01-A1" | "W01-A2" | "W01-A3";

/** Kept parts of each clip (seconds) — pauses are cut out. */
const CUTS: { clip: ClipId; src: string; from: number; to: number }[] = [
  { clip: "W01-A1", src: "w01-a1.mp4", from: 0, to: 3.55 },
  { clip: "W01-A1", src: "w01-a1.mp4", from: 4.25, to: 5.15 },
  { clip: "W01-A1", src: "w01-a1.mp4", from: 5.8, to: 7.15 },
  { clip: "W01-A2", src: "w01-a2.mp4", from: 0, to: 2.98 },
  { clip: "W01-A2", src: "w01-a2.mp4", from: 2.98, to: 7.5 },
  { clip: "W01-A3", src: "w01-a3.mp4", from: 0, to: 3.6 },
  { clip: "W01-A3", src: "w01-a3.mp4", from: 4.6, to: 5.75 },
];
const END_CARD = 105;
/** Words that get the serif-italic + blue marker treatment. */
const HOT = new Set(["google", "competitor", "one", "day", "999", "whatsapp", "yours"]);

// Lay the cuts out on the reel timeline (frames).
let at = 0;
const LAYOUT = CUTS.map((c) => {
  const len = Math.round((c.to - c.from) * FPS);
  const item = { ...c, start: at, len };
  at += len;
  return item;
});
export const AVATAR_REEL_FRAMES = at + END_CARD;
const TALK_END = at;

/** All words mapped to reel frames, then grouped into short caption lines (max 3 words / punctuation). */
const TIMED = LAYOUT.flatMap((c) =>
  (words as Record<string, Word[]>)[c.clip]
    .filter(([, s]) => s >= c.from - 0.05 && s < c.to)
    .map(([w, s, e]) => ({ w, s: c.start + Math.round((s - c.from) * FPS), e: c.start + Math.round((Math.min(e, c.to) - c.from) * FPS) })),
);
const GROUPS: { words: typeof TIMED; start: number; end: number }[] = [];
for (const t of TIMED) {
  const g = GROUPS[GROUPS.length - 1];
  const prevEndsPhrase = g && /[.,?!]$/.test(g.words[g.words.length - 1].w);
  if (!g || g.words.length >= 3 || prevEndsPhrase || t.s - g.end > 12) GROUPS.push({ words: [t], start: t.s, end: t.e });
  else { g.words.push(t); g.end = t.e; }
}
GROUPS.forEach((g, i) => { g.end = i + 1 < GROUPS.length ? Math.min(GROUPS[i + 1].start, g.end + 20) : g.end + 15; });
const wordAt = (w: string) => TIMED.find((t) => t.w.toLowerCase().replace(/[^a-z0-9]/g, "") === w)?.s ?? 0;

const Karaoke: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = GROUPS.find((x) => f >= x.start && f < x.end);
  if (!g) return null;
  const pop = spring({ frame: f - g.start, fps, config: { damping: 13, mass: 0.5, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", top: 1360, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center",
      gap: "0 22px", transform: `scale(${0.85 + 0.15 * pop})`, opacity: Math.min(1, pop * 1.6) }}>
      {g.words.map((t, i) => {
        const clean = t.w.toLowerCase().replace(/[^a-z0-9']/g, "");
        const hot = HOT.has(clean);
        const active = f >= t.s;
        const mark = interpolate(f - t.s, [0, 8], [0, 1], { ...clamp, easing: outExpo });
        const label = clean === "999" ? "999" : t.w.replace(/[.,]$/, "");
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", opacity: active ? 1 : 0.45,
            transform: `translateY(${active ? 0 : 8}px)` }}>
            {hot && <span style={{ position: "absolute", left: -10, right: -10, bottom: 12, height: 60, background: C.blue,
              transform: `scaleX(${mark}) skewX(-8deg)`, transformOrigin: "left", borderRadius: 6 }} />}
            <span style={{ position: "relative", fontFamily: hot ? "Serif" : "Inter Tight", fontStyle: hot ? "italic" : "normal",
              fontWeight: hot ? 400 : 800, fontSize: hot ? 120 : 98, letterSpacing: hot ? 0 : -3, lineHeight: 1.15,
              color: C.white, textShadow: "0 4px 24px rgba(0,0,0,.5)", textTransform: hot ? "none" : "lowercase" }}>{label}</span>
          </span>
        );
      })}
    </div>
  );
};

/** One kept piece of a clip; every other cut is punched in (classic talking-head jump-cut look). */
const Cut: React.FC<{ src: string; from: number; idx: number }> = ({ src, from, idx }) => {
  const f = useCurrentFrame();
  const base = idx % 2 ? 1.16 : 1.04;
  const kick = interpolate(f, [0, 5], [0.04, 0], { ...clamp, easing: outExpo });
  return (
    <AbsoluteFill style={{ transform: `scale(${base + kick + f * 0.0006})`, transformOrigin: "50% 28%" }}>
      <OffthreadVideo src={staticFile(src)} startFrom={Math.round(from * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

const sticker: React.CSSProperties = { background: P.paper, color: P.ink, borderRadius: 999, fontWeight: 800, boxShadow: "0 14px 40px rgba(0,0,0,.35)" };

/** Real client site popping out while he says "we build your website". */
const SitePop: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 13, mass: 0.6 } });
  const out = interpolate(f, [80, 92], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", right: 40, top: 210, opacity: s * out,
      transform: `translateX(${(1 - s) * 140}px) rotate(${5 + (1 - s) * 10}deg) scale(${0.8 + 0.2 * s})` }}>
      <div style={{ width: 280, height: 470, borderRadius: 34, overflow: "hidden", border: "8px solid #fff", background: "#fff",
        boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
        <Img src={staticFile("msj.png")} style={{ width: "100%", transform: `translateY(${-f * 1.6}px)` }} />
      </div>
      <div style={{ ...sticker, position: "absolute", top: -32, left: -46, padding: "12px 24px", fontSize: 30, fontWeight: 700, transform: "rotate(-7deg)" }}>
        real client ↗
      </div>
    </div>
  );
};

/** Price sticker + included chips, each landing on the spoken word. */
const PricePop: React.FC<{ t0: number }> = ({ t0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = (at: number) => spring({ frame: f - (at - t0), fps, config: { damping: 11, mass: 0.5, stiffness: 200 } });
  const price = sp(wordAt("999"));
  const chips = [["domain", "Free domain"], ["hosting", "1 year hosting"]] as const;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 220, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 22 }}>
      <div style={{ background: C.blue, color: "#fff", borderRadius: 36, padding: "22px 40px 26px", transform: `rotate(-5deg) scale(${price})`,
        boxShadow: "0 24px 60px rgba(0,98,245,.5)", textAlign: "center" }}>
        <div style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 54, lineHeight: 1, color: P.paper }}>from</div>
        <div style={{ fontSize: 100, fontWeight: 900, letterSpacing: -5, lineHeight: 1 }}><span style={{ fontSize: 50, letterSpacing: -1 }}>AED </span>999</div>
      </div>
      {chips.map(([w, label]) => {
        const s = sp(wordAt(w));
        return (
          <div key={w} style={{ ...sticker, display: "flex", alignItems: "center", gap: 14, padding: "16px 28px", fontSize: 38,
            transform: `scale(${s}) translateX(${(1 - s) * 60}px)`, opacity: s }}>
            <span style={{ width: 44, height: 44, borderRadius: 22, background: C.wa, color: "#fff", display: "grid", placeItems: "center", fontSize: 28 }}>✓</span>
            {label}
          </div>
        );
      })}
    </div>
  );
};

/** Number banner that rises as he points down ("the number's on screen"). */
const NumberPop: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 8, fps, config: { damping: 14, mass: 0.6 } });
  const ring = (f % 30) / 30;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1590, display: "flex", justifyContent: "center",
      transform: `translateY(${(1 - s) * 260}px)`, opacity: s }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 22, background: C.wa, color: "#fff",
        padding: "26px 44px", borderRadius: 999, boxShadow: "0 24px 60px rgba(37,211,102,.45)" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: `5px solid ${C.wa}`, transform: `scale(${1 + ring * 0.25})`, opacity: 1 - ring }} />
        <WhatsAppIcon size={70} />
        <span style={{ fontSize: 66, fontWeight: 800, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>{PHONE}</span>
      </div>
    </div>
  );
};

/** Story-style progress bar + handle, across the whole reel. */
const TopBar: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const dark = f >= TALK_END + 6;
  const col = dark ? P.ink : C.white;
  return (
    <>
      <div style={{ position: "absolute", top: 70, left: 50, right: 50, height: 6, borderRadius: 3, background: dark ? P.line : "rgba(255,255,255,.3)" }}>
        <div style={{ height: "100%", borderRadius: 3, background: col, width: `${(f / durationInFrames) * 100}%` }} />
      </div>
      <div style={{ position: "absolute", top: 104, left: 50, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: "#fff", display: "grid", placeItems: "center", boxShadow: "0 4px 16px rgba(0,0,0,.2)" }}>
          <Img src={staticFile("logo.png")} style={{ width: 46 }} />
        </div>
        <div style={{ color: col, fontSize: 34, fontWeight: 700, textShadow: dark ? "none" : "0 2px 10px rgba(0,0,0,.4)" }}>azmindigital</div>
      </div>
    </>
  );
};

export const AvatarReel: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const a2 = LAYOUT.filter((c) => c.clip === "W01-A2");
  const a3 = LAYOUT.find((c) => c.clip === "W01-A3")!;
  const musicVol = (f: number) =>
    f < TALK_END ? 0.11 : interpolate(f, [TALK_END, TALK_END + 10, durationInFrames - 20, durationInFrames - 1], [0.11, 0.6, 0.6, 0], clamp);
  return (
    <AbsoluteFill style={{ fontFamily: "Inter Tight, sans-serif", backgroundColor: P.ink }}>
      <style>{fonts}</style>
      <Audio src={staticFile("music-emerge.mp3")} startFrom={Math.round(40.04 * FPS)} volume={musicVol} />
      {LAYOUT.map((c, i) => (
        <Sequence key={i} from={c.start} durationInFrames={c.len}><Cut src={c.src} from={c.from} idx={i} /></Sequence>
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35), transparent 20%, transparent 55%, rgba(0,0,0,.6))" }} />
      <Sequence from={a2[0].start} durationInFrames={a2[0].len + 6}><SitePop /></Sequence>
      <Sequence from={a2[1].start} durationInFrames={a2[1].len}><PricePop t0={a2[1].start} /></Sequence>
      <Sequence from={a3.start} durationInFrames={TALK_END - a3.start}><NumberPop /></Sequence>
      <Karaoke />
      <Sequence from={TALK_END}><SlideUp><EndCard bubble="w01-a3.mp4" bubbleFrom={140} chrome={false} /></SlideUp></Sequence>
      <TopBar />
    </AbsoluteFill>
  );
};
