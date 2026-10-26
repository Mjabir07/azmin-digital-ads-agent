import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./brand";
import ep01 from "./data/ep01-find-skills.json";

/**
 * "AI Tools with Yara" tutorial reel, made fully in code: Yara's portrait (still, with a talking glow driven by
 * her voice), animated screen demos, karaoke captions, our own SFX + music bed. Voice: agent/voice/tts.py.
 * Ep 1: find-skills. Safe zones: nothing important in the top 250 px / bottom 340 px.
 */

type Line = { id: string; text: string; src: string; duration: number; words: { word: string; start: number; end: number }[]; envelope: number[] };
const FPS = 30;
const LEAD = 8; // frames before the first line
const GAP = 10; // frames between lines
const TAIL = 45; // frames after the last line
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

const layout = (lines: Line[]) => {
  let t = LEAD;
  return lines.map((l) => {
    const from = t;
    const len = Math.ceil(l.duration * FPS);
    t += len + GAP;
    return { ...l, from, len };
  });
};
const LINES = layout(ep01.lines as Line[]);
export const YARA_TUTORIAL_FRAMES = LINES[LINES.length - 1].from + LINES[LINES.length - 1].len + TAIL;

const fonts = `
@font-face { font-family: Inter Tight; font-weight: 100 900; src: url(${staticFile("InterTight.woff2")}); }
@font-face { font-family: Serif; font-style: italic; src: url(${staticFile("InstrumentSerif-400i.woff2")}); }
`;

const useIn = (delay = 0, damping = 14) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping, mass: 0.6, stiffness: 170 } });
};

/** Loudness of Yara's voice right now (0..1), for the talking glow. */
const useVoiceLevel = () => {
  const f = useCurrentFrame();
  const l = LINES.find((x) => f >= x.from && f < x.from + x.len);
  return l ? l.envelope[f - l.from] ?? 0 : 0;
};

const Background: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1300px 1000px at ${60 + Math.sin(f / 80) * 12}% 18%, #0B4FD1 0%, ${C.navy} 58%, #040E24 100%)` }}>
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.045) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.045) 2px,transparent 2px)",
        backgroundSize: "120px 120px", backgroundPosition: `0 ${(f * 0.6) % 120}px` }} />
      <div style={{ position: "absolute", width: 700, height: 160, borderRadius: 80, background: C.cyan, opacity: 0.08, transform: "rotate(-28deg)", left: -260, top: 380 + Math.sin(f / 50) * 30 }} />
      <div style={{ position: "absolute", width: 600, height: 140, borderRadius: 70, background: C.blue, opacity: 0.22, transform: "rotate(-28deg)", right: -220, bottom: 420 + Math.cos(f / 60) * 30 }} />
    </AbsoluteFill>
  );
};

const Logo: React.FC = () => (
  <div style={{ position: "absolute", top: 268, left: 70, display: "flex", alignItems: "center", gap: 14, color: "#fff", fontWeight: 800, fontSize: 30 }}>
    <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fff", padding: 6 }}><Img src={staticFile("logo.png")} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
    AZMIN <span style={{ color: C.cyan, marginLeft: -6 }}>DIGITAL</span>
    <span style={{ marginLeft: 10, fontSize: 24, fontWeight: 700, color: C.navy, background: C.cyan, borderRadius: 999, padding: "6px 16px" }}>AI TOOLS · EP 1</span>
  </div>
);

/** Yara's portrait: big card (hook / CTA) or a small circle (during demos). Glow pulses with her voice. */
const Yara: React.FC<{ big: boolean }> = ({ big }) => {
  const f = useCurrentFrame();
  const v = useVoiceLevel();
  const s = useIn(0, 16);
  const ring = 8 + v * 26;
  if (!big) {
    return (
      <div style={{ position: "absolute", right: 60, top: 250, width: 210, height: 210, borderRadius: 105, transform: `scale(${s})`,
        boxShadow: `0 0 0 6px ${C.cyan}, 0 0 ${ring * 2}px ${ring}px rgba(0,210,226,${0.25 + v * 0.45})`, overflow: "hidden" }}>
        <Img src={staticFile("yara.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 32%", transform: "scale(1.9)", transformOrigin: "50% 36%" }} />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 350, height: 760, borderRadius: 48, overflow: "hidden", opacity: s, transform: `translateY(${(1 - s) * 60}px)`,
      boxShadow: `0 40px 90px rgba(0,0,0,.45), 0 0 0 5px rgba(0,210,226,${0.35 + v * 0.65}), 0 0 ${ring * 3}px ${ring}px rgba(0,210,226,${0.15 + v * 0.35})` }}>
      <Img src={staticFile("yara.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%",
        transform: `scale(${1.05 + f * 0.0006})` }} />
      <div style={{ position: "absolute", left: 24, bottom: 24, display: "flex", gap: 10, alignItems: "center", background: "rgba(4,14,36,.72)", color: "#fff",
        borderRadius: 999, padding: "10px 20px", fontSize: 26, fontWeight: 700 }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: C.wa, boxShadow: `0 0 ${6 + v * 14}px ${C.wa}` }} />Yara · AZMIN DIGITAL
      </div>
    </div>
  );
};

/** Karaoke captions: 4-word chunks, the spoken word lights up. */
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const l = LINES.find((x) => f >= x.from && f < x.from + x.len + GAP);
  if (!l) return null;
  const t = (f - l.from) / FPS;
  const idx = l.words.findIndex((w) => t < w.end);
  const cur = idx === -1 ? l.words.length - 1 : idx;
  const start = Math.floor(cur / 4) * 4;
  const chunk = l.words.slice(start, start + 4);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1395, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 18px" }}>
      {chunk.map((w, i) => {
        const on = start + i === cur;
        const said = start + i < cur;
        return (
          <span key={i} style={{ fontSize: 70, fontWeight: 900, letterSpacing: -1.5, color: on ? C.navy : "#fff", background: on ? C.cyan : "transparent",
            borderRadius: 14, padding: "0 10px", opacity: said || on ? 1 : 0.55, transform: `scale(${on ? 1.06 : 1})`,
            textShadow: on ? "none" : "0 4px 18px rgba(0,0,0,.5)" }}>{w.word}</span>
        );
      })}
    </div>
  );
};

const Title: React.FC<{ children: React.ReactNode; top: number; delay?: number; size?: number }> = ({ children, top, delay = 0, size = 92 }) => {
  const s = useIn(delay);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, color: "#fff", fontSize: size, fontWeight: 900, letterSpacing: -3.5, lineHeight: 1.02,
      opacity: s, transform: `translateY(${(1 - s) * 40}px)`, filter: `blur(${(1 - s) * 8}px)` }}>{children}</div>
  );
};
const Mark: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 400, letterSpacing: 0, color: C.navy, background: C.cyan, padding: "0 12px", borderRadius: 8 }}>{children}</span>
);

/** Terminal window that types a command, then prints output lines. */
const Terminal: React.FC<{ cmd: string; out: { text: string; color?: string; at: number }[]; typeFrom?: number; cps?: number; top?: number }> = ({ cmd, out, typeFrom = 8, cps = 34, top = 560 }) => {
  const f = useCurrentFrame();
  const s = useIn(0, 16);
  const n = Math.max(0, Math.floor(((f - typeFrom) / FPS) * cps));
  const caret = Math.floor(f / 8) % 2 === 0 && n < cmd.length + 6;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, borderRadius: 28, background: "#0A1222", boxShadow: "0 40px 90px rgba(0,0,0,.5), 0 0 0 2px rgba(255,255,255,.08)",
      opacity: s, transform: `translateY(${(1 - s) * 80}px) scale(${0.94 + 0.06 * s})` }}>
      <div style={{ display: "flex", gap: 12, padding: "22px 26px", borderBottom: "2px solid rgba(255,255,255,.06)", alignItems: "center" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />)}
        <span style={{ marginLeft: 16, color: "#7E8BA8", fontSize: 24, fontFamily: "ui-monospace, Menlo, monospace" }}>Claude Code — terminal</span>
      </div>
      <div style={{ padding: "26px 30px 34px", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 34, lineHeight: 1.45, color: "#E6EEFF", wordBreak: "break-all" }}>
        <span style={{ color: C.cyan }}>$ </span>{cmd.slice(0, n)}{caret && <span style={{ background: C.cyan, color: C.cyan }}>_</span>}
        {out.map((o, i) => f >= o.at && (
          <div key={i} style={{ color: o.color ?? "#9FB0CE", marginTop: 10, opacity: interpolate(f, [o.at, o.at + 6], [0, 1], clamp) }}>{o.text}</div>
        ))}
      </div>
    </div>
  );
};

const ChatBubble: React.FC<{ text: string; top: number }> = ({ text, top }) => {
  const f = useCurrentFrame();
  const s = useIn(0, 13);
  const n = Math.floor(interpolate(f, [6, 6 + text.length * 1.2], [0, text.length], clamp));
  return (
    <div style={{ position: "absolute", right: 60, left: 160, top, display: "flex", justifyContent: "flex-end", opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
      <div style={{ background: "#fff", color: C.ink, borderRadius: "36px 36px 8px 36px", padding: "28px 36px", fontSize: 46, fontWeight: 700, lineHeight: 1.25, boxShadow: "0 24px 60px rgba(0,0,0,.35)" }}>
        <div style={{ fontSize: 24, color: "#5B6B85", fontWeight: 700, marginBottom: 6 }}>You → Claude</div>
        {text.slice(0, n)}
      </div>
    </div>
  );
};

const RESULTS = [
  { name: "remotion-best-practices", by: "remotion-dev", installs: "684K" },
  { name: "social", by: "coreyhaines31", installs: "85K" },
  { name: "social-content", by: "coreyhaines31", installs: "67K" },
];
const Results: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 560 }}>
      <Title top={-100} size={52}><span style={{ color: "#9FB0CE", fontWeight: 700, letterSpacing: 0 }}>skills.sh · real results, 26 Oct</span></Title>
      {RESULTS.map((r, i) => {
        const s = spring({ frame: f - 6 - i * 9, fps: FPS, config: { damping: 13, mass: 0.5 } });
        const pick = i === 0 && f > 70;
        return (
          <div key={r.name} style={{ marginTop: 26, borderRadius: 28, padding: "30px 34px", background: pick ? "#fff" : "rgba(255,255,255,.08)", color: pick ? C.ink : "#fff",
            border: pick ? `5px solid ${C.cyan}` : "2px solid rgba(255,255,255,.12)", opacity: s, transform: `translateX(${(1 - s) * 120}px) scale(${pick ? 1.03 : 1})`,
            display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 42, fontWeight: 900, fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: -1 }}>{r.name}</div>
              <div style={{ fontSize: 28, opacity: 0.7, marginTop: 4 }}>by {r.by}</div>
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: pick ? C.blue : C.cyan }}>⬇ {r.installs}</div>
          </div>
        );
      })}
      {f > 70 && (
        <div style={{ marginTop: 30, display: "inline-block", background: C.wa, color: "#fff", fontWeight: 900, fontSize: 40, borderRadius: 999, padding: "16px 34px",
          transform: `scale(${spring({ frame: f - 70, fps: FPS, config: { damping: 9 } })})` }}>✓ Most trusted first</div>
      )}
    </div>
  );
};

const Work: React.FC = () => {
  const f = useCurrentFrame();
  const tiles = ["ep01/work1.png", "ep01/work2.jpg", "ep01/work3.jpg"];
  return (
    <>
      <div style={{ position: "absolute", left: 60, right: 60, top: 520 }}>
        <div style={{ display: "inline-block", background: C.wa, color: "#fff", fontWeight: 900, fontSize: 44, borderRadius: 999, padding: "16px 34px",
          transform: `scale(${spring({ frame: f - 2, fps: FPS, config: { damping: 9 } })})` }}>✓ Skill installed</div>
      </div>
      {tiles.map((src, i) => {
        const s = spring({ frame: f - 40 - i * 8, fps: FPS, config: { damping: 14 } });
        const x = [70, 390, 710][i];
        return (
          <div key={src} style={{ position: "absolute", left: x, top: 700 + (i === 1 ? -30 : 20) + Math.sin((f + i * 20) / 18) * 10, width: 300, height: 533, borderRadius: 26, overflow: "hidden",
            boxShadow: "0 30px 70px rgba(0,0,0,.5)", transform: `rotate(${[-6, 0, 6][i]}deg) translateY(${(1 - s) * 300}px)`, opacity: s }}>
            <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        );
      })}
      <Title top={1275} size={46} delay={60}><span style={{ color: "#9FB0CE", fontWeight: 700, letterSpacing: 0 }}>Our posts & reels · made with code + AI skills</span></Title>
    </>
  );
};

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = 1 + Math.sin(f / 5) * 0.035;
  const s = useIn(10, 10);
  const g = useIn(24, 14);
  return (
    <>
      <div style={{ position: "absolute", left: 70, right: 70, top: 1135, display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ flex: 1, transform: `scale(${s * pulse})`, transformOrigin: "left center", background: C.cyan, color: C.navy, borderRadius: 30, padding: "24px 30px",
          fontSize: 66, fontWeight: 900, letterSpacing: -2, boxShadow: `0 0 0 ${8 + Math.sin(f / 5) * 6}px rgba(0,210,226,.25)` }}>Comment “SKILL” 👇</div>
        <div style={{ width: 170, height: 240, borderRadius: 14, overflow: "hidden", background: "#fff", transform: `rotate(6deg) translateY(${(1 - g) * 200}px)`, opacity: g,
          boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
          <Img src={staticFile("guide01.png")} style={{ width: "100%" }} />
        </div>
      </div>
    </>
  );
};

const SCENES: Record<string, { big: boolean; body: React.FC }> = {
  l1: { big: true, body: () => <Title top={1150} size={84}>Claude can learn <Mark>new skills</Mark> 🤯</Title> },
  l2: {
    big: false,
    body: () => (
      <>
        <Title top={460} size={64}>Step 1 · install <Mark>find-skills</Mark></Title>
        <Terminal cmd="npx skills add https://github.com/vercel-labs/skills --skill find-skills" top={640}
          out={[{ text: "◇ Installing to Claude Code…", at: 82 }, { text: "✓ find-skills installed", color: C.wa, at: 96 }]} />
      </>
    ),
  },
  l3: {
    big: false,
    body: () => (
      <>
        <Title top={460} size={64}>Step 2 · <Mark>just ask</Mark></Title>
        <ChatBubble text="Find me a skill for Instagram reels" top={640} />
        <Terminal cmd="npx skills find instagram reels" top={1000} typeFrom={58} cps={30} out={[]} />
      </>
    ),
  },
  l4: { big: false, body: Results },
  l5: { big: false, body: Work },
  l6: { big: true, body: Cta },
};

const SFX: React.FC = () => (
  <>
    {LINES.map((l, i) => (
      <Sequence key={l.id} from={Math.max(0, l.from - 6)} durationInFrames={20}><Audio src={staticFile("sfx/whoosh.wav")} volume={i === 0 ? 0 : 0.5} /></Sequence>
    ))}
    {/* typing on the step-1 command, ding when installed */}
    {Array.from({ length: 22 }).map((_, k) => (
      <Sequence key={`t${k}`} from={LINES[1].from + 8 + k * 3} durationInFrames={4}><Audio src={staticFile("sfx/type.wav")} volume={0.35} /></Sequence>
    ))}
    <Sequence from={LINES[1].from + 96} durationInFrames={30}><Audio src={staticFile("sfx/ding.wav")} volume={0.45} /></Sequence>
    {[0, 1, 2].map((i) => (
      <Sequence key={`p${i}`} from={LINES[3].from + 6 + i * 9} durationInFrames={6}><Audio src={staticFile("sfx/pop.wav")} volume={0.5} /></Sequence>
    ))}
    <Sequence from={LINES[3].from + 70} durationInFrames={30}><Audio src={staticFile("sfx/ding.wav")} volume={0.4} /></Sequence>
    <Sequence from={LINES[4].from + 2} durationInFrames={30}><Audio src={staticFile("sfx/ding.wav")} volume={0.4} /></Sequence>
    <Sequence from={LINES[5].from + 10} durationInFrames={10}><Audio src={staticFile("sfx/click.wav")} volume={0.6} /></Sequence>
  </>
);

export const YaraTutorial: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: "Inter Tight, sans-serif" }}>
      <style>{fonts}</style>
      <Background />
      <Audio src={staticFile("sfx/bed.m4a")} volume={(x) => interpolate(x, [0, 15, durationInFrames - 30, durationInFrames - 1], [0, 0.16, 0.16, 0], clamp)} />
      <SFX />
      {LINES.map((l, i) => {
        const sc = SCENES[l.id];
        const end = i === LINES.length - 1 ? durationInFrames - l.from : l.len + GAP;
        return (
          <Sequence key={l.id} from={l.from} durationInFrames={end}>
            <Scene len={end}><Yara big={sc.big} /><sc.body /></Scene>
            <Audio src={staticFile(l.src)} />
          </Sequence>
        );
      })}
      <Logo />
      <Captions />
    </AbsoluteFill>
  );
};

/** Scene wrapper: quick blur-slide in, fade out at the end. */
const Scene: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  const inP = interpolate(f, [0, 10], [0, 1], { ...clamp, easing: outExpo });
  const outP = interpolate(f, [len - 6, len], [0, 1], clamp);
  return <AbsoluteFill style={{ opacity: inP * (1 - outP), filter: `blur(${(1 - inP) * 10}px)`, transform: `translateX(${(1 - inP) * 90}px)` }}>{children}</AbsoluteFill>;
};
