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
 * Talking-presenter reel: Flow clips (Yara / Jabir avatar), jump-cut on pauses, karaoke captions from
 * faster-whisper word timings, pop-ups that land on spoken words, ducked music, contact end card.
 * Each script is a "set": its cuts + which pop-ups to show and on which word.
 */

const FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
type Word = [string, number, number];

type Cut = {
  clip: string; src: string; from: number; to: number;
  crop?: boolean; // zoom from the top to hide Veo's burned-in subtitles at the bottom
  mono?: boolean; // faded "before" look
};
/** A pop-up starts on the first time `word` is spoken in `clip` and lasts `dur` frames (or to the end of talking). */
type Pop =
  | { kind: "site" | "number" | "chat"; clip: string; word: string; dur?: number }
  | { kind: "price"; clip: string; word: string; dur?: number; chips?: [string, string][] }
  | { kind: "tag" | "chip"; clip: string; word: string; dur?: number; text: string };
export type ReelSet = { cuts: Cut[]; pops: Pop[]; hot: string[]; bubble: string; bubbleFrom: number };

const offerPops = (c2: string, c3: string): Pop[] => [
  { kind: "site", clip: c2, word: "we", dur: 92 },
  { kind: "price", clip: c2, word: "from", chips: [["domain", "Free domain"], ["hosting", "1 year hosting"]] },
  { kind: "number", clip: c3, word: "message" },
];
const OFFER_HOT = ["google", "competitor", "one", "day", "999", "whatsapp", "yours"];

export const SETS: Record<string, ReelSet> = {
  jabir: {
    cuts: [
      { clip: "W01-A1", src: "w01-a1.mp4", from: 0, to: 3.55 },
      { clip: "W01-A1", src: "w01-a1.mp4", from: 4.25, to: 5.15 },
      { clip: "W01-A1", src: "w01-a1.mp4", from: 5.8, to: 7.15 },
      { clip: "W01-A2", src: "w01-a2.mp4", from: 0, to: 2.98 },
      { clip: "W01-A2", src: "w01-a2.mp4", from: 2.98, to: 7.5 },
      { clip: "W01-A3", src: "w01-a3.mp4", from: 0, to: 3.6 },
      { clip: "W01-A3", src: "w01-a3.mp4", from: 4.6, to: 5.75 },
    ],
    pops: offerPops("W01-A2", "W01-A3"), hot: OFFER_HOT, bubble: "w01-a3.mp4", bubbleFrom: 140,
  },
  yara: {
    cuts: [
      { clip: "W01-Y1", src: "w01-y1.mp4", from: 0.05, to: 2.62 },
      { clip: "W01-Y1", src: "w01-y1.mp4", from: 2.95, to: 3.95 },
      { clip: "W01-Y1", src: "w01-y1.mp4", from: 4.5, to: 5.38 },
      { clip: "W01-Y1", src: "w01-y1.mp4", from: 5.9, to: 7.25 },
      { clip: "W01-Y2", src: "w01-y2.mp4", from: 0, to: 3.0 },
      { clip: "W01-Y2", src: "w01-y2.mp4", from: 3.12, to: 7.45 },
      { clip: "W01-Y3", src: "w01-y3.mp4", from: 0.78, to: 3.85 },
      { clip: "W01-Y3", src: "w01-y3.mp4", from: 4.5, to: 5.65 },
    ],
    pops: offerPops("W01-Y2", "W01-Y3"), hot: OFFER_HOT, bubble: "w01-y3.mp4", bubbleFrom: 120,
  },
  /** W02-C — AI chatbot (trend: AI buzz in Dubai, Dubai AI Festival 26–28 Oct). */
  yaraAi: {
    cuts: [
      { clip: "W02-C1", src: "w02-c1.mp4", from: 0, to: 3.75 },
      { clip: "W02-C1", src: "w02-c1.mp4", from: 4.45, to: 7.45 },
      { clip: "W02-C2", src: "w02-c2.mp4", from: 0, to: 0.82, crop: true },
      { clip: "W02-C2", src: "w02-c2.mp4", from: 1.18, to: 5.5, crop: true },
      { clip: "W02-C2", src: "w02-c2.mp4", from: 5.95, to: 7.25, crop: true },
      { clip: "W02-C3", src: "w02-c3.mp4", from: 0, to: 2.3 },
      { clip: "W02-C3", src: "w02-c3.mp4", from: 3.05, to: 4.5 },
      { clip: "W02-C3", src: "w02-c3.mp4", from: 5.3, to: 7.3 },
    ],
    pops: [
      { kind: "chip", clip: "W02-C1", word: "ai", dur: 60, text: "🤖 AI is everywhere" },
      { kind: "chat", clip: "W02-C2", word: "an", dur: 165 },
      { kind: "chip", clip: "W02-C3", word: "we", dur: 50, text: "✅ We set it up for you" },
      { kind: "number", clip: "W02-C3", word: "message" },
    ],
    hot: ["ai", "chatbot", "whatsapp", "instantly", "2", "missed"], bubble: "w02-c3.mp4", bubbleFrom: 200,
  },
  /** W02-B — "me vs me" debate (trending format). */
  yaraDebate: {
    cuts: [
      { clip: "W02-B1", src: "w02-b1.mp4", from: 1.6, to: 3.55, mono: true },
      { clip: "W02-B1", src: "w02-b1.mp4", from: 4.35, to: 6.5, mono: true },
      { clip: "W02-B2", src: "w02-b2.mp4", from: 0, to: 0.95 },
      { clip: "W02-B2", src: "w02-b2.mp4", from: 2.0, to: 3.42 },
      { clip: "W02-B2", src: "w02-b2.mp4", from: 4.0, to: 7.3 },
      { clip: "W02-B3", src: "w02-b3.mp4", from: 0, to: 7.45 },
    ],
    pops: [
      { kind: "tag", clip: "W02-B1", word: "i", dur: 130, text: "ME · BEFORE" },
      { kind: "tag", clip: "W02-B2", word: "really", text: "ME · NOW" },
      { kind: "site", clip: "W02-B2", word: "a", dur: 100 },
      { kind: "price", clip: "W02-B3", word: "from", dur: 90 },
      { kind: "number", clip: "W02-B3", word: "message" },
    ],
    hot: ["website", "enough", "google", "trusted", "one", "day", "999", "whatsapp"], bubble: "w02-b3.mp4", bubbleFrom: 150,
  },
};
const END_CARD = 105;
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Lay the cuts out on the reel timeline (frames) and group the spoken words into caption lines. */
const timeline = (set: ReelSet) => {
  let at = 0;
  const layout = set.cuts.map((c) => {
    const len = Math.round((c.to - c.from) * FPS);
    const item = { ...c, start: at, len };
    at += len;
    return item;
  });
  const timed = layout.flatMap((c) =>
    (words as Record<string, Word[]>)[c.clip]
      .filter(([, s]) => s >= c.from - 0.05 && s < c.to)
      .map(([w, s, e]) => ({ w, clip: c.clip, s: c.start + Math.round((s - c.from) * FPS), e: c.start + Math.round((Math.min(e, c.to) - c.from) * FPS) })),
  );
  const groups: { words: typeof timed; start: number; end: number }[] = [];
  for (const t of timed) {
    const g = groups[groups.length - 1];
    const prevEndsPhrase = g && /[.,?!]$/.test(g.words[g.words.length - 1].w);
    if (!g || g.words.length >= 3 || prevEndsPhrase || t.s - g.end > 12) groups.push({ words: [t], start: t.s, end: t.e });
    else { g.words.push(t); g.end = t.e; }
  }
  groups.forEach((g, i) => { g.end = i + 1 < groups.length ? Math.min(groups[i + 1].start, g.end + 20) : g.end + 15; });
  const wordAt = (w: string, clip?: string) => timed.find((t) => norm(t.w) === w && (!clip || t.clip === clip))?.s ?? 0;
  return { layout, groups, wordAt, talkEnd: at, total: at + END_CARD };
};
type TL = ReturnType<typeof timeline>;
export const avatarReelFrames = (set: keyof typeof SETS) => timeline(SETS[set]).total;

const Karaoke: React.FC<{ tl: TL; hot: Set<string> }> = ({ tl, hot: HOT }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = tl.groups.find((x) => f >= x.start && f < x.end);
  if (!g) return null;
  const pop = spring({ frame: f - g.start, fps, config: { damping: 13, mass: 0.5, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", top: 1360, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center",
      gap: "0 22px", transform: `scale(${0.85 + 0.15 * pop})`, opacity: Math.min(1, pop * 1.6) }}>
      {g.words.map((t, i) => {
        const clean = t.w.toLowerCase().replace(/[^a-z0-9']/g, "");
        const hot = HOT.has(norm(t.w));
        const active = f >= t.s;
        const mark = interpolate(f - t.s, [0, 8], [0, 1], { ...clamp, easing: outExpo });
        const label = clean === "999" ? "999" : clean === "2" ? "2" : t.w.replace(/[.,]$/, "");
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
const CutView: React.FC<{ cut: Cut; idx: number }> = ({ cut, idx }) => {
  const f = useCurrentFrame();
  const base = cut.crop ? 1.24 : idx % 2 ? 1.16 : 1.04;
  const kick = interpolate(f, [0, 5], [0.04, 0], { ...clamp, easing: outExpo });
  return (
    <AbsoluteFill style={{ transform: `scale(${base + kick + f * 0.0006})`, transformOrigin: cut.crop ? "50% 8%" : "50% 28%",
      filter: cut.mono ? "grayscale(.85) contrast(.9) brightness(.92) sepia(.15)" : undefined }}>
      <OffthreadVideo src={staticFile(cut.src)} startFrom={Math.round(cut.from * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

const sticker: React.CSSProperties = { background: P.paper, color: P.ink, borderRadius: 999, fontWeight: 800, boxShadow: "0 14px 40px rgba(0,0,0,.35)" };
const useEnter = (delay = 0, damping = 13) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping, mass: 0.6 } });
};

/** Real client site popping out. */
const SitePop: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const s = useEnter();
  const out = interpolate(f, [dur - 12, dur], [1, 0], clamp);
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

/** Price sticker (+ optional included chips, each landing on its spoken word). */
const PricePop: React.FC<{ chipAt: (w: string) => number; chips: [string, string][] }> = ({ chipAt, chips }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = (at: number) => spring({ frame: f - at, fps, config: { damping: 11, mass: 0.5, stiffness: 200 } });
  const price = sp(0);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 220, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 22 }}>
      <div style={{ background: C.blue, color: "#fff", borderRadius: 36, padding: "22px 40px 26px", transform: `rotate(-5deg) scale(${price})`,
        boxShadow: "0 24px 60px rgba(0,98,245,.5)", textAlign: "center" }}>
        <div style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 54, lineHeight: 1, color: P.paper }}>from</div>
        <div style={{ fontSize: 100, fontWeight: 900, letterSpacing: -5, lineHeight: 1 }}><span style={{ fontSize: 50, letterSpacing: -1 }}>AED </span>999</div>
      </div>
      {chips.map(([w, label]) => {
        const s = sp(chipAt(w));
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

/** Number banner that rises when the presenter says "message us". */
const NumberPop: React.FC = () => {
  const f = useCurrentFrame();
  const s = useEnter(0, 14);
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

/** WhatsApp chat mock-up: a customer message at 2:07 AM gets an instant AI reply. */
const ChatPop: React.FC = () => {
  const f = useCurrentFrame();
  const card = useEnter();
  const q = useEnter(8);
  const typing = f > 22 && f < 46;
  const a = useEnter(46);
  const bubble = (mine: boolean): React.CSSProperties => ({
    alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%", padding: "14px 20px", borderRadius: 22, fontSize: 30, lineHeight: 1.3,
    background: mine ? "#D9FDD3" : "#fff", color: "#111", boxShadow: "0 2px 4px rgba(0,0,0,.08)",
    borderBottomRightRadius: mine ? 6 : 22, borderBottomLeftRadius: mine ? 22 : 6,
  });
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 200, opacity: card, transform: `translateY(${(1 - card) * -60}px) scale(${0.9 + 0.1 * card})` }}>
      <div style={{ borderRadius: 36, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.45)", background: "#EFE7DE" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 26px", background: "#075E54", color: "#fff" }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: "#fff", display: "grid", placeItems: "center" }}>
            <Img src={staticFile("logo.png")} style={{ width: 40 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>Your Business</div>
            <div style={{ fontSize: 24, opacity: 0.85 }}>{typing ? "typing…" : "online · AI assistant"}</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, background: "rgba(255,255,255,.15)", padding: "8px 16px", borderRadius: 999 }}>2:07 AM</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "24px 22px 28px", minHeight: 300 }}>
          <div style={{ ...bubble(false), opacity: q, transform: `scale(${q})`, transformOrigin: "left bottom" }}>
            Hi! Are you open tomorrow? Can I book for 10 AM? <span style={{ fontSize: 20, color: "#888" }}>2:07</span>
          </div>
          {typing && <div style={{ ...bubble(true), fontSize: 34, letterSpacing: 6 }}>• • •</div>}
          {f >= 46 && (
            <div style={{ ...bubble(true), opacity: a, transform: `scale(${a})`, transformOrigin: "right bottom" }}>
              Hi 👋 Yes, we're open 9 AM – 9 PM. 10 AM tomorrow is free. Shall I book it for you? <span style={{ fontSize: 20, color: "#888" }}>2:07 ✓✓</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ ...sticker, position: "absolute", bottom: -30, right: -20, padding: "14px 26px", fontSize: 32, background: C.blue, color: "#fff",
        transform: `rotate(-4deg) scale(${a})` }}>⚡ replied in 2 seconds</div>
    </div>
  );
};

/** Name tag ("ME · BEFORE") or service chip, top-centre. */
const TagPop: React.FC<{ text: string; dark?: boolean }> = ({ text, dark }) => {
  const s = useEnter(0, 11);
  return (
    <div style={{ position: "absolute", top: 230, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ ...sticker, padding: "18px 36px", fontSize: 44, letterSpacing: dark ? 4 : 0, background: dark ? P.ink : P.paper, color: dark ? "#fff" : P.ink,
        transform: `scale(${s}) rotate(${(1 - s) * -8}deg)`, opacity: s }}>{text}</div>
    </div>
  );
};

/** Story-style progress bar + handle, across the whole reel. */
const TopBar: React.FC<{ talkEnd: number }> = ({ talkEnd }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const dark = f >= talkEnd + 6;
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

export const AvatarReel: React.FC<{ set: keyof typeof SETS }> = ({ set }) => {
  const { durationInFrames } = useVideoConfig();
  const cfg = SETS[set];
  const tl = timeline(cfg);
  const { layout, talkEnd } = tl;
  const musicVol = (f: number) =>
    f < talkEnd ? 0.11 : interpolate(f, [talkEnd, talkEnd + 10, durationInFrames - 20, durationInFrames - 1], [0.11, 0.6, 0.6, 0], clamp);
  return (
    <AbsoluteFill style={{ fontFamily: "Inter Tight, sans-serif", backgroundColor: P.ink }}>
      <style>{fonts}</style>
      <Audio src={staticFile("music-emerge.mp3")} startFrom={Math.round(40.04 * FPS)} volume={musicVol} />
      {layout.map((c, i) => (
        <Sequence key={i} from={c.start} durationInFrames={c.len}><CutView cut={c} idx={i} /></Sequence>
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35), transparent 20%, transparent 55%, rgba(0,0,0,.6))" }} />
      {cfg.pops.map((p, i) => {
        const start = Math.max(0, tl.wordAt(p.word, p.clip) - 3);
        const next = cfg.pops.slice(i + 1).find((q) => q.kind === p.kind);
        const end = p.dur ? start + p.dur : next ? Math.max(0, tl.wordAt(next.word, next.clip) - 3) : talkEnd;
        const dur = Math.max(1, Math.min(end, talkEnd) - start);
        const body =
          p.kind === "site" ? <SitePop dur={dur} /> :
          p.kind === "price" ? <PricePop chips={p.chips ?? []} chipAt={(w) => tl.wordAt(w, p.clip) - start} /> :
          p.kind === "number" ? <NumberPop /> :
          p.kind === "chat" ? <ChatPop /> :
          <TagPop text={p.text} dark={p.kind === "tag"} />;
        return <Sequence key={i} from={start} durationInFrames={dur}>{body}</Sequence>;
      })}
      <Karaoke tl={tl} hot={new Set(cfg.hot)} />
      <Sequence from={talkEnd}><SlideUp><EndCard bubble={cfg.bubble} bubbleFrom={cfg.bubbleFrom} chrome={false} /></SlideUp></Sequence>
      <TopBar talkEnd={talkEnd} />
    </AbsoluteFill>
  );
};
