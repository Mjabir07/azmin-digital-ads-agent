import React from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./brand";
import ep01 from "./data/ep01-find-skills-v4.json";

/**
 * "AI Tools with Yara" episode template v4 (marketing/content/yara-ai-series.md): calm pacing, 45–59 s.
 * Opening (Yara's Flow clip, or her voice + badge as fallback) → series sting → why it matters → 3 steps
 * (step card, demo held long enough to read, takeaway) → result → ending (Flow clip or fallback) with the CTA.
 * Each episode gives: voice data (agent/voice/tts.py), a signature colour, hook words and one scene per section.
 */

type Line = { id: string; text: string; src: string; duration: number; words: { word: string; start: number; end: number }[]; envelope: number[] };
export type EpisodeProps = { hookClip?: string; endClip?: string };
const FPS = 30;
const CLIP = 240; // Flow clips are 8 s
const STING = 48;
const CARD = 30;
const HOLD = 30;
const Y = C.cyan; // only accent (AZMIN Editorial: cream, ink, navy, brand blue + cyan)
const PAPER = "#F4F1EA";
const INK = "#0B0B0C";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = Easing.bezier(0.22, 1, 0.36, 1);

const fonts = `
@font-face { font-family: Inter Tight; font-weight: 100 900; src: url(${staticFile("InterTight.woff2")}); }
@font-face { font-family: Serif; font-style: italic; src: url(${staticFile("InstrumentSerif-400i.woff2")}); }
`;

// ---------------- timeline ----------------
type Part = { key: string; kind: "clip" | "sting" | "voice" | "card"; from: number; len: number; line?: Line & { vFrom: number }; clip?: string; step?: number };
const lineOf = (id: string) => (ep01.lines as Line[]).find((l) => l.id === id)!;
const frames = (s: number) => Math.ceil(s * FPS);

export const buildTimeline = (p: EpisodeProps) => {
  const parts: Part[] = [];
  let t = 0;
  const push = (part: Omit<Part, "from">) => { parts.push({ ...part, from: t } as Part); t += part.len; };
  const voice = (key: string, id: string, pad: number, extra: Partial<Part> = {}) => {
    const l = lineOf(id);
    const lead = 8;
    push({ key, kind: "voice", len: lead + frames(l.duration) + pad, ...extra });
    parts[parts.length - 1].line = { ...l, vFrom: parts[parts.length - 1].from + lead };
  };
  if (p.hookClip) push({ key: "hook", kind: "clip", len: CLIP, clip: p.hookClip });
  else voice("hook", "hook", 20);
  push({ key: "sting", kind: "sting", len: STING });
  voice("why", "why", HOLD);
  ["s1", "s2", "s3"].forEach((id, i) => {
    push({ key: `card${i + 1}`, kind: "card", len: CARD, step: i + 1 });
    voice(id, id, HOLD, { step: i + 1 });
  });
  voice("result", "result", 24);
  if (p.endClip) push({ key: "end", kind: "clip", len: CLIP + 20, clip: p.endClip });
  else voice("end", "end", 45);
  return { parts, total: t };
};
export const episodeFrames = (p: EpisodeProps) => buildTimeline(p).total;

const useParts = () => {
  const { durationInFrames } = useVideoConfig();
  return durationInFrames;
};

// ---------------- shared pieces ----------------
const useIn = (delay = 0, damping = 16) => {
  const f = useCurrentFrame();
  return spring({ frame: f - delay, fps: FPS, config: { damping, mass: 0.7, stiffness: 120 } });
};

const Background: React.FC<{ tone: "deep" | "bright" | "light" }> = ({ tone }) => {
  const f = useCurrentFrame();
  const bg = tone === "deep" ? `radial-gradient(1300px 1000px at 30% 10%, #12357F 0%, ${C.navy} 55%, #040D22 100%)`
    : tone === "bright" ? `linear-gradient(165deg, ${C.blue} 0%, #0050CC 60%, #003C9E 100%)`
      : PAPER;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${tone === "light" ? "rgba(11,11,12,.06)" : "rgba(255,255,255,.05)"} 2px,transparent 2px),linear-gradient(90deg,${tone === "light" ? "rgba(11,11,12,.06)" : "rgba(255,255,255,.05)"} 2px,transparent 2px)`, backgroundSize: "120px 120px" }} />
      {tone !== "light" && <div style={{ position: "absolute", width: 700, height: 700, borderRadius: 350, filter: "blur(90px)", opacity: 0.22, background: C.cyan,
        left: 540 + Math.sin(f / 120) * 300 - 350, top: 700 + Math.cos(f / 140) * 400 - 350 }} />}
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div style={{ position: "absolute", top: 270, left: 70, display: "flex", alignItems: "center", gap: 12, fontWeight: 800, fontSize: 26,
    color: dark ? INK : "#fff", background: dark ? "#fff" : "rgba(4,14,36,.55)", borderRadius: 999, padding: "8px 20px 8px 8px", boxShadow: dark ? "0 6px 20px rgba(0,0,0,.08)" : "none" }}>
    <div style={{ width: 40, height: 40, borderRadius: 20, background: "#fff", padding: 5 }}><Img src={staticFile("logo.png")} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
    AI TOOLS WITH YARA · <span style={{ color: dark ? C.blue : Y }}>EP 01</span>
  </div>
);

const Sticker: React.FC<{ children: React.ReactNode; left: number; top: number; rot?: number; delay?: number; bg?: string; color?: string; size?: number }> = ({ children, left, top, rot = -2, delay = 0, bg = "#fff", color = INK, size = 50 }) => {
  const s = useIn(delay, 11);
  return (
    <div style={{ position: "absolute", left, top, background: bg, color, fontWeight: 900, fontSize: size, padding: "14px 30px", borderRadius: 22,
      transform: `rotate(${rot}deg) scale(${s})`, boxShadow: "0 16px 40px rgba(0,0,0,.18)", whiteSpace: "nowrap" }}>{children}</div>
  );
};

const Title: React.FC<{ children: React.ReactNode; top: number; size?: number; color?: string; delay?: number; align?: "left" | "center" }> = ({ children, top, size = 88, color = "#fff", delay = 0, align = "left" }) => {
  const s = useIn(delay);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, fontSize: size, fontWeight: 900, letterSpacing: -3, lineHeight: 1.03, color, textAlign: align,
      opacity: s, transform: `translateY(${(1 - s) * 50}px)` }}>{children}</div>
  );
};

/** Instrument Serif italic accent on a brand-blue marker (AZMIN Editorial). */
const Accent: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children }) => (
  <span style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 400, letterSpacing: 0, color: "#fff", padding: "0 .12em",
    background: `linear-gradient(transparent 14%, ${C.blue} 14%, ${C.blue} 90%, transparent 90%)` }}>{children}</span>
);

/** Yara's voice badge (face in a ring pulsing with her voice + live waveform). */
const Badge: React.FC<{ line?: Part["line"]; dark?: boolean; big?: boolean }> = ({ line, dark, big }) => {
  const f = useCurrentFrame();
  const { from } = { from: 0 };
  const rel = line ? f - (line.vFrom - (line.vFrom - from)) : 0;
  const v = line ? line.envelope[rel] ?? 0 : 0;
  const d = big ? 280 : 116;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, background: big ? "transparent" : dark ? "rgba(255,255,255,.85)" : "rgba(4,14,36,.7)",
      borderRadius: 999, padding: big ? 0 : "8px 26px 8px 8px", flexDirection: big ? "column" : "row" }}>
      <div style={{ width: d, height: d, borderRadius: d / 2, overflow: "hidden", flex: "none", transform: `scale(${1 + v * 0.04})`,
        boxShadow: `0 0 0 ${big ? 9 : 5}px ${Y}, 0 0 ${18 + v * 40}px ${4 + v * 14}px rgba(255,210,63,${0.25 + v * 0.45})` }}>
        <Img src={staticFile("yara.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", transform: "scale(1.9)", transformOrigin: "50% 36%" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: big ? "center" : "flex-start", gap: 4 }}>
        <div style={{ fontWeight: 900, fontSize: big ? 50 : 30, color: dark && !big ? "#0B0B0C" : "#fff" }}>Yara <span style={{ color: dark && !big ? C.blue : Y, fontWeight: 700 }}>· AI Tools</span></div>
        <div style={{ display: "flex", gap: 4, alignItems: "center", height: big ? 54 : 30 }}>
          {Array.from({ length: big ? 14 : 10 }).map((_, k) => (
            <div key={k} style={{ width: 6, borderRadius: 3, background: k % 3 === 0 ? Y : dark && !big ? C.blue : "#fff", height: 5 + v * (big ? 46 : 24) * (0.35 + 0.65 * Math.abs(Math.sin(f / 3 + k))) }} />
          ))}
        </div>
      </div>
    </div>
  );
};

/** 3-word karaoke captions for a narrated line (local frame 0 = line start). */
const Captions: React.FC<{ line: NonNullable<Part["line"]>; offset: number; dark?: boolean }> = ({ line, offset, dark }) => {
  const f = useCurrentFrame() - offset;
  if (f < 0) return null;
  const sec = f / FPS;
  const raw = line.words.findIndex((w) => sec < w.end);
  const cur = raw === -1 ? line.words.length - 1 : raw;
  const start = Math.floor(cur / 3) * 3;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1415, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 16px" }}>
      {line.words.slice(start, start + 3).map((w, i) => {
        const on = start + i === cur;
        return (
          <span key={i} style={{ fontSize: 72, fontWeight: 900, letterSpacing: -2, padding: "2px 14px", borderRadius: 14, color: on ? "#fff" : dark ? INK : "#fff",
            background: on ? C.blue : "transparent", textShadow: on || dark ? "none" : "0 5px 18px rgba(0,0,0,.45)" }}>{w.word}</span>
        );
      })}
    </div>
  );
};

const Phone: React.FC<{ src: string; left: number; top: number; width: number; scroll: [number, number, number, number]; tilt?: number; children?: React.ReactNode }> = ({ src, left, top, width, scroll, tilt = 0, children }) => {
  const f = useCurrentFrame();
  const s = useIn(0, 18);
  const y = interpolate(f, [scroll[0], scroll[1]], [scroll[2], scroll[3]], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left, top, width, height: width * 2.05, borderRadius: 60, background: "#0B1220", padding: 15, boxShadow: "0 50px 100px rgba(0,0,0,.45), 0 0 0 3px #2A3550 inset",
      transform: `rotate(${tilt}deg) translateY(${(1 - s) * 300}px)`, opacity: s }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 46, overflow: "hidden", position: "relative", background: "#000" }}>
        <Img src={staticFile(src)} style={{ width: "100%", transform: `translateY(${-y}px)` }} />
        {children}
      </div>
    </div>
  );
};

const Terminal: React.FC<{ cmd: string; ok?: string; okAt?: number; top: number; typeFrom?: number; cps?: number }> = ({ cmd, ok, okAt = 999, top, typeFrom = 10, cps = 26 }) => {
  const f = useCurrentFrame();
  const s = useIn(0, 18);
  const n = Math.max(0, Math.floor(((f - typeFrom) / FPS) * cps));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, borderRadius: 30, background: "#0A1222", boxShadow: "0 40px 90px rgba(0,98,245,.3)", opacity: s, transform: `scale(${0.92 + 0.08 * s})` }}>
      <div style={{ display: "flex", gap: 12, padding: "22px 26px", borderBottom: "2px solid rgba(255,255,255,.07)" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />)}
      </div>
      <div style={{ padding: "28px 32px 36px", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 38, lineHeight: 1.45, color: "#E6EEFF", wordBreak: "break-all" }}>
        <span style={{ color: Y }}>$ </span>{cmd.slice(0, n)}{n < cmd.length && Math.floor(f / 8) % 2 === 0 && <span style={{ color: C.cyan }}>▋</span>}
        {ok && f >= okAt && <div style={{ color: "#3DDC84", marginTop: 16, fontWeight: 700, opacity: interpolate(f, [okAt, okAt + 8], [0, 1], clamp) }}>{ok}</div>}
      </div>
    </div>
  );
};

const Confetti: React.FC<{ at: number; x: number; y: number }> = ({ at: t0, x, y }) => {
  const f = useCurrentFrame() - t0;
  if (f < 0 || f > 80) return null;
  const cols = [C.cyan, C.blue, "#fff", C.navy];
  return <>{Array.from({ length: 40 }).map((_, i) => {
    const a = random(`a${i}`) * Math.PI * 2;
    const sp = 10 + random(`s${i}`) * 16;
    return <div key={i} style={{ position: "absolute", left: x + Math.cos(a) * sp * f, top: y + Math.sin(a) * sp * f * 0.8 + 0.7 * f * f, width: 16, height: 9, background: cols[i % cols.length],
      borderRadius: 3, transform: `rotate(${f * (6 + i)}deg)`, opacity: interpolate(f, [55, 80], [1, 0], clamp) }} />;
  })}</>;
};

// ---------------- sections ----------------
const HOOK_WORDS = ["The", "#1", "skill", "on", "skills.sh", "right", "now 🤯"];

const ClipSection: React.FC<{ src: string; hook: boolean }> = ({ src, hook }) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, CLIP], [1.0, 1.06]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}><OffthreadVideo src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,10,28,.45) 0%, rgba(3,10,28,0) 22%, rgba(3,10,28,0) 52%, rgba(3,10,28,.82) 80%, rgba(3,10,28,.9) 100%)" }} />
      {hook ? (
        <div style={{ position: "absolute", left: 70, right: 70, top: 1130, display: "flex", flexWrap: "wrap", gap: "0 22px" }}>
          {HOOK_WORDS.map((w, i) => {
            const s = spring({ frame: f - 10 - i * 11, fps: FPS, config: { damping: 12 } });
            const hot = w === "#1";
            return <span key={i} style={{ fontSize: hot ? 150 : 96, fontWeight: hot ? 400 : 900, fontFamily: hot ? "Serif" : undefined, fontStyle: hot ? "italic" : undefined, letterSpacing: hot ? 0 : -3, color: "#fff", background: hot ? C.blue : "transparent", borderRadius: 6,
              padding: hot ? "0 18px" : 0, opacity: s, transform: `translateY(${(1 - s) * 40}px) scale(${0.8 + 0.2 * s})`, textShadow: hot ? "none" : "0 6px 24px rgba(0,0,0,.5)" }}>{w}</span>;
          })}
        </div>
      ) : (
        <>
          <Sticker left={70} top={1170} rot={-2} delay={20} size={76} bg="#fff" color={INK}>Comment <Accent light>SKILL</Accent> 👇</Sticker>
          <div style={{ position: "absolute", right: 60, top: 340, width: 200, height: 283, borderRadius: 14, overflow: "hidden", border: "5px solid #fff", transform: `rotate(6deg) scale(${useIn(60, 13)})`, boxShadow: "0 30px 60px rgba(0,0,0,.4)" }}>
            <Img src={staticFile("guide01.png")} style={{ width: "100%" }} />
          </div>
          <Sticker left={70} top={1340} rot={1} delay={110} bg={C.blue} color="#fff" size={44}>+ Follow for daily AI tips</Sticker>
        </>
      )}
    </AbsoluteFill>
  );
};

const Sting: React.FC = () => {
  const f = useCurrentFrame();
  const wipe = interpolate(f, [0, 14], [-1200, 0], { ...clamp, easing: smooth });
  const out = interpolate(f, [STING - 10, STING], [0, 1200], { ...clamp, easing: Easing.in(Easing.cubic) });
  const s = useIn(8, 10);
  return (
    <AbsoluteFill style={{ background: PAPER, transform: `translateX(${wipe + out}px)`, alignItems: "center", justifyContent: "center",
      backgroundImage: "linear-gradient(rgba(11,11,12,.06) 2px,transparent 2px),linear-gradient(90deg,rgba(11,11,12,.06) 2px,transparent 2px)", backgroundSize: "120px 120px" }}>
      <div style={{ transform: `scale(${s})`, textAlign: "center" }}>
        <div style={{ width: 140, height: 140, borderRadius: 36, background: "#fff", padding: 16, margin: "0 auto", boxShadow: "0 20px 50px rgba(0,0,0,.2)" }}>
          <Img src={staticFile("logo.png")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div style={{ marginTop: 30, fontSize: 96, fontWeight: 900, letterSpacing: -4, color: INK, lineHeight: 1 }}>AI TOOLS<br /><span style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 400, letterSpacing: 0, color: "#fff", background: C.blue, padding: "0 16px" }}>with Yara</span></div>
        <div style={{ marginTop: 26, fontSize: 34, fontWeight: 800, color: INK, opacity: 0.55, letterSpacing: 8 }}>EPISODE 01</div>
      </div>
    </AbsoluteFill>
  );
};

const StepCard: React.FC<{ n: number; label: string }> = ({ n, label }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 10], [0, 1], { ...clamp, easing: smooth });
  return (
    <AbsoluteFill style={{ background: [C.navy, C.blue, PAPER][n - 1], clipPath: `circle(${s * 140}% at 50% 50%)`, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 56, fontWeight: 800, color: n === 3 ? C.blue : C.cyan, letterSpacing: 10 }}>STEP</div>
      <div style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 380, color: n === 3 ? INK : "#fff", lineHeight: 0.95, transform: `scale(${0.75 + 0.25 * useIn(2, 12)})` }}>{n}</div>
      <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: -2, color: n === 3 ? INK : "#fff", marginTop: 10 }}>{label}</div>
    </AbsoluteFill>
  );
};

// Ep 1 section contents (local frame 0 = section start; voice starts at frame 8)
const Why: React.FC = () => {
  const f = useCurrentFrame();
  const hl = interpolate(f, [70, 82], [0, 1], clamp);
  return (
    <>
      <Title top={360} size={96}>Meet <Accent>find-skills</Accent></Title>
      <Phone src="ep01/skills-home.jpg" left={250} top={520} width={480} scroll={[20, 75, 0, 400]}>
        <div style={{ position: "absolute", left: 8, right: 8, top: 1585 * (450 / 860) - 400 - 12, height: 74, borderRadius: 12, border: `6px solid ${Y}`, boxShadow: `0 0 30px ${Y}`, opacity: hl, transform: `scale(${0.9 + 0.1 * hl})` }} />
      </Phone>
      <Sticker left={600} top={1040} rot={4} delay={90} bg={C.blue} color="#fff" size={46}>4.1M installs</Sticker>
    </>
  );
};
const Step1: React.FC = () => (
  <>
    <Title top={350} size={84} color={INK}>Install it with <Accent light>one command</Accent></Title>
    <Terminal cmd="npx skills add https://github.com/vercel-labs/skills --skill find-skills" ok="✓ find-skills installed" okAt={110} top={640} />
    <Confetti at={110} x={540} y={980} />
  </>
);
const Step2: React.FC = () => {
  const f = useCurrentFrame();
  const txt = "Find me a skill for Instagram reels";
  const n = Math.floor(interpolate(f, [55, 55 + txt.length * 1.6], [0, txt.length], clamp));
  return (
    <>
      <Title top={350} size={84}>Ask in <Accent>plain words</Accent></Title>
      <div style={{ position: "absolute", left: 130, right: 60, top: 640, display: "flex", justifyContent: "flex-end", transform: `scale(${useIn(40, 14)})` }}>
        <div style={{ background: "#fff", color: "#0B0B0C", borderRadius: "40px 40px 10px 40px", padding: "30px 40px", fontSize: 56, fontWeight: 800, boxShadow: "0 24px 60px rgba(0,0,0,.25)" }}>
          <div style={{ fontSize: 28, color: C.blue, fontWeight: 800 }}>You → Claude</div>{txt.slice(0, n)}
        </div>
      </div>
    </>
  );
};
const RESULTS = [{ name: "remotion-best-practices", by: "remotion-dev", n: "684K" }, { name: "social", by: "coreyhaines31", n: "85K" }, { name: "social-content", by: "coreyhaines31", n: "67K" }];
const Step3: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <Title top={350} size={84}>Pick a <Accent>trusted</Accent> one</Title>
      {RESULTS.map((r, i) => {
        const k = spring({ frame: f - 30 - i * 22, fps: FPS, config: { damping: 16 } });
        const pick = i === 0 && f > 120;
        return (
          <div key={r.name} style={{ position: "absolute", left: 60, right: 60, top: 590 + i * 190, borderRadius: 28, padding: "28px 34px", display: "flex", alignItems: "center",
            background: "#fff", color: INK, outline: pick ? `6px solid ${C.cyan}` : "none", transform: `translateX(${(1 - k) * 700}px) scale(${pick ? 1.03 : 1})`, opacity: k, boxShadow: "0 20px 44px rgba(0,0,0,.22)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 42, fontWeight: 900, fontFamily: "ui-monospace, Menlo, monospace" }}>{r.name}</div>
              <div style={{ fontSize: 28, opacity: 0.6 }}>by {r.by}</div>
            </div>
            <div style={{ fontSize: 42, fontWeight: 900, color: C.blue }}>⬇ {r.n}</div>
          </div>
        );
      })}
      <Sticker left={330} top={1180} rot={-3} delay={135} bg={C.blue} color="#fff" size={46}>✓ installed by Claude</Sticker>
    </>
  );
};
const Result: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <Title top={350} size={84}>Every reel on <Accent>this page</Accent></Title>
      {["ep01/work1.png", "ep01/work2.jpg", "ep01/work3.jpg"].map((src, i) => {
        const s = spring({ frame: f - 20 - i * 14, fps: FPS, config: { damping: 15 } });
        return (
          <div key={src} style={{ position: "absolute", left: [60, 390, 720][i], top: 560 + [30, -10, 30][i] + Math.sin((f + i * 20) / 30) * 8, width: 300, height: 533, borderRadius: 26, overflow: "hidden",
            border: "6px solid #fff", boxShadow: "0 30px 60px rgba(0,0,0,.4)", transform: `rotate(${[-6, 0, 6][i]}deg) scale(${s})` }}>
            <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        );
      })}
    </>
  );
};
const FallbackHook: React.FC = () => (
  <>
    <Title top={380} size={170} align="center"><Accent>#1</Accent></Title>
    <Title top={600} size={86} align="center" delay={12}>skill on skills.sh 🤯</Title>
    <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center" }}><Badge big /></div>
  </>
);
const FallbackEnd: React.FC = () => (
  <>
    <Sticker left={170} top={360} rot={-3} delay={10} size={76} bg="#fff" color={INK}>Comment <Accent light>SKILL</Accent> 👇</Sticker>
    <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center" }}><Badge big /></div>
    <Sticker left={170} top={1200} rot={3} delay={60} bg={C.blue} color="#fff" size={44}>+ Follow for daily AI tips</Sticker>
  </>
);

const VOICE_SCENES: Record<string, { body: React.FC; tone: "deep" | "bright" | "light" }> = {
  hook: { body: FallbackHook, tone: "deep" },
  why: { body: Why, tone: "deep" },
  s1: { body: Step1, tone: "light" },
  s2: { body: Step2, tone: "bright" },
  s3: { body: Step3, tone: "deep" },
  result: { body: Result, tone: "bright" },
  end: { body: FallbackEnd, tone: "bright" },
};
const STEP_LABELS = ["Install it", "Ask Claude", "Pick & install"];

/** Section wrapper: smooth slide-up in, fade out. */
const Section: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  const i = interpolate(f, [0, 12], [0, 1], { ...clamp, easing: smooth });
  const o = interpolate(f, [len - 8, len], [1, 0], clamp);
  return <AbsoluteFill style={{ opacity: Math.min(i, o), transform: `translateY(${(1 - i) * 60}px) scale(${0.98 + 0.02 * i})` }}>{children}</AbsoluteFill>;
};

const sfx = (src: string, from: number, volume = 0.45, dur = 40) => (
  <Sequence key={`${src}${from}`} from={Math.max(0, from)} durationInFrames={dur}><Audio src={staticFile(`sfx/${src}`)} volume={volume} /></Sequence>
);

export const YaraEpisode: React.FC<EpisodeProps> = (props) => {
  const total = useParts();
  const { parts } = buildTimeline(props);
  const at = (k: string) => parts.find((p) => p.key === k)!.from;
  const voiced = parts.filter((p) => p.kind === "voice");
  return (
    <AbsoluteFill style={{ fontFamily: "Inter Tight, sans-serif", background: C.navy }}>
      <style>{fonts}</style>
      {/* music sits low; quieter under Yara's clips */}
      <Audio src={staticFile("sfx/beat.m4a")} volume={(x) => {
        const inClip = parts.some((p) => p.kind === "clip" && x >= p.from && x < p.from + p.len);
        return interpolate(x, [0, 15, total - 30, total - 1], [0, 1, 1, 0], clamp) * (inClip ? 0.05 : 0.1);
      }} />
      {sfx("sparkle.wav", at("sting") + 4, 0.5)}
      {sfx("boom.wav", at("sting") + 8, 0.45, 50)}
      {[1, 2, 3].map((n) => sfx("swoosh.wav", at(`card${n}`), 0.5, 15))}
      {Array.from({ length: 30 }).map((_, k) => sfx("type.wav", at("s1") + 10 + k * 2, 0.22, 4))}
      {sfx("ding.wav", at("s1") + 110, 0.4)}
      {sfx("pop.wav", at("s3") + 30, 0.45, 10)}
      {sfx("pop.wav", at("s3") + 52, 0.45, 10)}
      {sfx("pop.wav", at("s3") + 74, 0.45, 10)}
      {sfx("ding.wav", at("s3") + 135, 0.35)}
      {sfx("shutter.wav", at("result") + 20, 0.4)}
      {parts.map((p) => {
        if (p.kind === "clip") return <Sequence key={p.key} from={p.from} durationInFrames={p.len}><Section len={p.len}><ClipSection src={p.clip!} hook={p.key === "hook"} /><Tag /></Section></Sequence>;
        if (p.kind === "sting") return <Sequence key={p.key} from={p.from} durationInFrames={p.len}><Sting /></Sequence>;
        if (p.kind === "card") return <Sequence key={p.key} from={p.from} durationInFrames={p.len}><StepCard n={p.step!} label={STEP_LABELS[p.step! - 1]} /></Sequence>;
        const sc = VOICE_SCENES[p.key];
        const dark = sc.tone === "light";
        const Body = sc.body;
        return (
          <Sequence key={p.key} from={p.from} durationInFrames={p.len}>
            <Section len={p.len}>
              <Background tone={sc.tone} />
              <Body />
              <Tag dark={dark} />
              {p.key !== "hook" && p.key !== "end" && (
                <div style={{ position: "absolute", left: 0, right: 0, top: 1245, display: "flex", justifyContent: "center" }}><BadgeAt line={p.line!} offset={8} dark={dark} /></div>
              )}
              <Captions line={p.line!} offset={8} dark={dark} />
            </Section>
            <Sequence from={8}><Audio src={staticFile(p.line!.src)} /></Sequence>
          </Sequence>
        );
      })}
      <ProgressBar total={total} />
      {voiced.length === 0 && null}
    </AbsoluteFill>
  );
};

/** Badge whose loudness follows the line (local frame minus offset). */
const BadgeAt: React.FC<{ line: NonNullable<Part["line"]>; offset: number; dark?: boolean }> = ({ line, offset, dark }) => {
  const f = useCurrentFrame() - offset;
  const shifted = { ...line, envelope: line.envelope, vFrom: 0 };
  return <EnvBadge v={f >= 0 ? shifted.envelope[f] ?? 0 : 0} dark={dark} />;
};
const EnvBadge: React.FC<{ v: number; dark?: boolean }> = ({ v, dark }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, background: dark ? "rgba(255,255,255,.85)" : "rgba(4,14,36,.7)", borderRadius: 999, padding: "8px 26px 8px 8px" }}>
      <div style={{ width: 112, height: 112, borderRadius: 56, overflow: "hidden", transform: `scale(${1 + v * 0.05})`, boxShadow: `0 0 0 5px ${Y}, 0 0 ${16 + v * 36}px ${3 + v * 12}px rgba(255,210,63,${0.25 + v * 0.45})` }}>
        <Img src={staticFile("yara.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", transform: "scale(1.9)", transformOrigin: "50% 36%" }} />
      </div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 30, color: dark ? "#0B0B0C" : "#fff" }}>Yara <span style={{ color: dark ? C.blue : Y, fontWeight: 700 }}>· AI Tools</span></div>
        <div style={{ display: "flex", gap: 4, alignItems: "center", height: 30 }}>
          {Array.from({ length: 10 }).map((_, k) => <div key={k} style={{ width: 6, borderRadius: 3, background: k % 3 === 0 ? Y : dark ? C.blue : "#fff", height: 5 + v * 24 * (0.35 + 0.65 * Math.abs(Math.sin(f / 3 + k))) }} />)}
        </div>
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 252, height: 8, borderRadius: 4, background: "rgba(255,255,255,.3)" }}>
      <div style={{ width: `${(f / total) * 100}%`, height: "100%", borderRadius: 4, background: Y }} />
    </div>
  );
};
