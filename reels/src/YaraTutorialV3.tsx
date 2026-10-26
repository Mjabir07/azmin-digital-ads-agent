import React from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./brand";
import ep from "./data/ep01-find-skills-v2.json";

/**
 * "AI Tools with Yara" Ep 1, v3 (current template): full motion graphics + Yara's voice. Yara appears as a voice-host
 * badge (face in a ring that pulses with her voice + live waveform), not a still body that looks frozen.
 * Optional `talkingClip` (e.g. a Flow clip in reels/public/) replaces the hook scene when a real talking video exists.
 */

type Line = { id: string; text: string; src: string; duration: number; words: { word: string; start: number; end: number }[]; envelope: number[] };
const FPS = 30;
const LEAD = 6;
const GAP = 6;
const TAIL = 50;
const Y = "#FFD23F"; // sticker yellow (accent)
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outBack = Easing.bezier(0.34, 1.56, 0.64, 1);

const LINES = (() => {
  let t = LEAD;
  return (ep.lines as Line[]).map((l) => {
    const from = t;
    const len = Math.ceil(l.duration * FPS);
    t += len + GAP;
    return { ...l, from, len };
  });
})();
export const YARA_V3_FRAMES = LINES[LINES.length - 1].from + LINES[LINES.length - 1].len + TAIL;
const at = (id: string) => LINES.find((l) => l.id === id)!;

const fonts = `
@font-face { font-family: Inter Tight; font-weight: 100 900; src: url(${staticFile("InterTight.woff2")}); }
@font-face { font-family: Serif; font-style: italic; src: url(${staticFile("InstrumentSerif-400i.woff2")}); }
`;

const useIn = (delay = 0, damping = 12) => {
  const f = useCurrentFrame();
  return spring({ frame: f - delay, fps: FPS, config: { damping, mass: 0.6, stiffness: 180 } });
};
const useVoice = () => {
  const f = useCurrentFrame();
  const l = LINES.find((x) => f >= x.from && f < x.from + x.len);
  return l ? l.envelope[f - l.from] ?? 0 : 0;
};

// ---------- backgrounds: one colourful look per scene, cross-faded ----------
const BGS: Record<string, string> = {
  l1: `radial-gradient(1200px 900px at 30% 20%, #1F3FFF 0%, #071A3D 55%, #02060F 100%)`,
  l2: `linear-gradient(160deg, ${C.blue} 0%, #2B7BFF 45%, ${C.cyan} 100%)`,
  l3: `linear-gradient(170deg, #FFF7E0 0%, #F4F1EA 50%, #DDF6FF 100%)`,
  l4: `linear-gradient(200deg, ${C.cyan} 0%, #1E8BFF 55%, ${C.blue} 100%)`,
  l5: `radial-gradient(1200px 900px at 70% 30%, #2B5BFF 0%, ${C.navy} 60%, #030B1E 100%)`,
  l6: `linear-gradient(150deg, #FF9F1C 0%, ${Y} 30%, ${C.cyan} 75%, ${C.blue} 100%)`,
};
const Background: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {LINES.map((l, i) => {
        const o = interpolate(f, [l.from - 4, l.from + 4], [0, 1], clamp) * (i === LINES.length - 1 ? 1 : interpolate(f, [l.from + l.len + GAP - 2, l.from + l.len + GAP + 6], [1, 0], clamp));
        return <AbsoluteFill key={l.id} style={{ background: BGS[l.id], opacity: o }} />;
      })}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", width: 520, height: 520, borderRadius: 260, filter: "blur(60px)", opacity: 0.35, mixBlendMode: "screen",
          background: [C.cyan, Y, "#7B61FF"][i], left: 540 + Math.sin(f / (40 + i * 13) + i * 2) * 420 - 260, top: 900 + Math.cos(f / (55 + i * 9) + i) * 600 - 260 }} />
      ))}
    </AbsoluteFill>
  );
};


/** Yara as a voice host: face in a ring that pulses with her voice, name, live waveform. */
const YaraBadge: React.FC<{ big?: boolean }> = ({ big }) => {
  const f = useCurrentFrame();
  const v = useVoice();
  const d = big ? 300 : 124;
  const ring = 6 + v * (big ? 30 : 16);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: big ? 0 : 18, flexDirection: big ? "column" : "row", background: big ? "transparent" : "rgba(4,14,36,.78)",
      borderRadius: 999, padding: big ? 0 : "10px 30px 10px 10px", boxShadow: big ? "none" : "0 18px 40px rgba(0,0,0,.3)" }}>
      <div style={{ width: d, height: d, borderRadius: d / 2, overflow: "hidden", flex: "none", transform: `scale(${1 + v * 0.04})`,
        boxShadow: `0 0 0 ${big ? 10 : 6}px ${Y}, 0 0 ${ring * 3}px ${ring}px rgba(255,210,63,${0.25 + v * 0.5})` }}>
        <Img src={staticFile("yara.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", transform: "scale(1.9)", transformOrigin: "50% 36%" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: big ? "center" : "flex-start", marginTop: big ? 26 : 0 }}>
        <div style={{ color: "#fff", fontWeight: 900, fontSize: big ? 52 : 34, textShadow: big ? "0 6px 20px rgba(0,0,0,.35)" : "none" }}>Yara <span style={{ color: Y, fontWeight: 700 }}>· AI Tools</span></div>
        <div style={{ display: "flex", gap: 5, alignItems: "center", height: big ? 60 : 36 }}>
          {Array.from({ length: big ? 16 : 11 }).map((_, k) => (
            <div key={k} style={{ width: big ? 8 : 6, borderRadius: 4, background: k % 3 === 0 ? Y : "#fff",
              height: 6 + v * (big ? 50 : 28) * (0.35 + 0.65 * Math.abs(Math.sin(f / 2.6 + k * 0.9))) }} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------- captions: 3-word chunks, active word on a yellow sticker ----------
const Captions: React.FC<{ dark?: boolean }> = () => {
  const f = useCurrentFrame();
  const l = LINES.find((x) => f >= x.from && f < x.from + x.len + GAP);
  if (!l) return null;
  const sec = (f - l.from) / FPS;
  const raw = l.words.findIndex((w) => sec < w.end);
  const cur = raw === -1 ? l.words.length - 1 : raw;
  const start = Math.floor(cur / 3) * 3;
  const light = l.id === "l3";
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1400, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px" }}>
      {l.words.slice(start, start + 3).map((w, i) => {
        const on = start + i === cur;
        const pop = on ? spring({ frame: f - l.from - Math.round(w.start * FPS), fps: FPS, config: { damping: 9, mass: 0.4 } }) : 1;
        return (
          <span key={i} style={{ fontSize: 78, fontWeight: 900, letterSpacing: -2, padding: "2px 14px", borderRadius: 16,
            color: on ? "#0B0B0C" : light ? "#0B0B0C" : "#fff", background: on ? Y : "transparent", transform: `scale(${on ? 0.9 + 0.16 * pop : 1}) rotate(${on ? -2 : 0}deg)`,
            textShadow: on || light ? "none" : "0 5px 20px rgba(0,0,0,.45)", WebkitTextStroke: on || light ? "0" : "2px rgba(0,0,0,.15)" }}>{w.word}</span>
        );
      })}
    </div>
  );
};

const Sticker: React.FC<{ children: React.ReactNode; left: number; top: number; rot?: number; delay?: number; bg?: string; color?: string; size?: number }> = ({ children, left, top, rot = -4, delay = 0, bg = Y, color = "#0B0B0C", size = 48 }) => {
  const f = useCurrentFrame();
  const s = useIn(delay, 8);
  return (
    <div style={{ position: "absolute", left, top, background: bg, color, fontWeight: 900, fontSize: size, padding: "14px 28px", borderRadius: 22,
      transform: `rotate(${rot + Math.sin(f / 12) * 1.5}deg) scale(${s})`, boxShadow: "0 16px 40px rgba(0,0,0,.3)", border: "4px solid #fff", whiteSpace: "nowrap" }}>{children}</div>
  );
};

const Kinetic: React.FC<{ text: string; top: number; size?: number; color?: string; delay?: number }> = ({ text, top, size = 120, color = "#fff", delay = 0 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontSize: size, fontWeight: 900, letterSpacing: -4, color }}>
      {text.split("").map((ch, i) => {
        const s = spring({ frame: f - delay - i * 2, fps: FPS, config: { damping: 10, mass: 0.5 } });
        return <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - s) * -120}px) rotate(${(1 - s) * 20}deg)`, opacity: s, textShadow: "0 10px 30px rgba(0,0,0,.25)" }}>{ch}</span>;
      })}
    </div>
  );
};

/** Phone showing a real website screenshot, scrolling. */
const Phone: React.FC<{ src: string; left: number; top: number; width: number; scroll: [number, number, number, number]; tilt?: number; children?: React.ReactNode }> = ({ src, left, top, width, scroll, tilt = -4, children }) => {
  const f = useCurrentFrame();
  const s = useIn(0, 14);
  const y = interpolate(f, [scroll[0], scroll[1]], [scroll[2], scroll[3]], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const h = width * 2.05;
  return (
    <div style={{ position: "absolute", left, top, width, height: h, borderRadius: 64, background: "#0B1220", padding: 16, boxShadow: "0 50px 100px rgba(0,0,0,.5), 0 0 0 3px #2A3550 inset",
      transform: `rotate(${tilt}deg) translateY(${(1 - s) * 400}px) scale(${0.9 + 0.1 * s})`, opacity: s }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 50, overflow: "hidden", position: "relative", background: "#000" }}>
        <Img src={staticFile(src)} style={{ width: "100%", transform: `translateY(${-y}px)` }} />
        {children}
      </div>
    </div>
  );
};

const Terminal: React.FC<{ cmd: string; ok: string; okAt: number; top: number }> = ({ cmd, ok, okAt, top }) => {
  const f = useCurrentFrame();
  const s = useIn(0, 14);
  const n = Math.max(0, Math.floor(((f - 6) / FPS) * 46));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, borderRadius: 30, background: "#0A1222", boxShadow: "0 40px 90px rgba(0,98,245,.35)", transform: `rotate(-2deg) scale(${0.85 + 0.15 * s})`, opacity: s }}>
      <div style={{ display: "flex", gap: 12, padding: "22px 26px", alignItems: "center", borderBottom: "2px solid rgba(255,255,255,.07)" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />)}
        <span style={{ marginLeft: 14, color: "#7E8BA8", fontSize: 26, fontFamily: "ui-monospace, Menlo, monospace" }}>terminal</span>
      </div>
      <div style={{ padding: "28px 32px 36px", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 36, lineHeight: 1.45, color: "#E6EEFF", wordBreak: "break-all" }}>
        <span style={{ color: Y }}>$ </span>{cmd.slice(0, n)}{n < cmd.length && Math.floor(f / 6) % 2 === 0 && <span style={{ color: C.cyan }}>▋</span>}
        {f >= okAt && <div style={{ color: "#3DDC84", marginTop: 14, fontWeight: 700, transform: `scale(${spring({ frame: f - okAt, fps: FPS, config: { damping: 9 } })})`, transformOrigin: "left" }}>{ok}</div>}
      </div>
    </div>
  );
};

const Confetti: React.FC<{ at: number; x: number; y: number }> = ({ at: t0, x, y }) => {
  const f = useCurrentFrame() - t0;
  if (f < 0 || f > 70) return null;
  const cols = [Y, C.cyan, "#FF5F8F", "#3DDC84", "#fff", "#7B61FF"];
  return (
    <>
      {Array.from({ length: 46 }).map((_, i) => {
        const a = random(`a${i}`) * Math.PI * 2;
        const sp = 14 + random(`s${i}`) * 22;
        const px = x + Math.cos(a) * sp * f;
        const py = y + Math.sin(a) * sp * f * 0.8 + 0.9 * f * f;
        return <div key={i} style={{ position: "absolute", left: px, top: py, width: 18, height: 10, background: cols[i % cols.length], borderRadius: 3,
          transform: `rotate(${f * (8 + i)}deg)`, opacity: interpolate(f, [50, 70], [1, 0], clamp) }} />;
      })}
    </>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [0, 2, 7], [0, 0.85, 0], clamp), pointerEvents: "none" }} />;
};

// ---------- scenes ----------
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const hl = interpolate(f, [62, 74], [0, 1], { ...clamp, easing: outBack });
  return (
    <>
      <Phone src="ep01/skills-home.jpg" left={70} top={350} width={520} scroll={[18, 60, 0, 430]} tilt={-5}>
        <div style={{ position: "absolute", left: 10, right: 10, top: 456, height: 80, borderRadius: 14, border: `6px solid ${Y}`,
          boxShadow: `0 0 30px ${Y}`, transform: `scale(${hl})`, opacity: hl }} />
      </Phone>
      <Kinetic text="#1" top={430} size={260} color={Y} delay={60} />
      <Sticker left={450} top={760} rot={6} delay={66} size={56}>skill on skills.sh 🏆</Sticker>
      <Sticker left={520} top={900} rot={-5} delay={78} bg="#FF5F8F" color="#fff" size={56}>4.1M installs 🤯</Sticker>
    </>
  );
};

const S2: React.FC = () => (
  <>
    <Kinetic text="find-skills" top={320} size={136} color={Y} />
    <Phone src="ep01/skills-findskills.jpg" left={500} top={500} width={470} scroll={[10, 110, 0, 520]} tilt={5} />
    <Sticker left={60} top={600} rot={-7} delay={30} bg="#fff">teaches Claude 🧠</Sticker>
    <Sticker left={80} top={800} rot={5} delay={48} bg={C.navy} color="#fff">finds new skills ✨</Sticker>
    <Sticker left={50} top={990} rot={-4} delay={66} bg="#3DDC84" color="#fff">for you 🙌</Sticker>
  </>
);

const S3: React.FC = () => (
  <>
    <Kinetic text="1 command" top={320} size={110} color="#0B0B0C" />
    <Terminal cmd="npx skills add https://github.com/vercel-labs/skills --skill find-skills" ok="✓ find-skills installed" okAt={40} top={560} />
    <Confetti at={40} x={540} y={900} />
  </>
);

const RESULTS = [
  { name: "remotion-best-practices", by: "remotion-dev", n: "684K", c: Y },
  { name: "social", by: "coreyhaines31", n: "85K", c: "#fff" },
  { name: "social-content", by: "coreyhaines31", n: "67K", c: "#fff" },
];
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const s = useIn(0, 12);
  const txt = "Find me a skill for Instagram reels";
  const n = Math.floor(interpolate(f, [4, 40], [0, txt.length], clamp));
  return (
    <>
      <div style={{ position: "absolute", left: 120, right: 60, top: 320, display: "flex", justifyContent: "flex-end", transform: `scale(${s})` }}>
        <div style={{ background: "#fff", color: "#0B0B0C", borderRadius: "40px 40px 10px 40px", padding: "26px 36px", fontSize: 50, fontWeight: 800, boxShadow: "0 24px 60px rgba(0,0,0,.25)" }}>
          <div style={{ fontSize: 26, color: C.blue, fontWeight: 800 }}>You → Claude</div>{txt.slice(0, n)}
        </div>
      </div>
      {RESULTS.map((r, i) => {
        const k = spring({ frame: f - 52 - i * 8, fps: FPS, config: { damping: 11, mass: 0.5 } });
        return (
          <div key={r.name} style={{ position: "absolute", left: 60, right: 60, top: 620 + i * 190, borderRadius: 30, padding: "30px 34px", display: "flex", alignItems: "center",
            background: i === 0 ? r.c : "rgba(255,255,255,.92)", color: "#0B0B0C", boxShadow: "0 24px 50px rgba(0,0,0,.25)", transform: `translateX(${(1 - k) * 900}px) rotate(${i === 0 ? -1.5 : 0}deg)` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 44, fontWeight: 900, fontFamily: "ui-monospace, Menlo, monospace" }}>{r.name}</div>
              <div style={{ fontSize: 28, opacity: 0.65 }}>by {r.by}</div>
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.blue }}>⬇ {r.n}</div>
          </div>
        );
      })}
      <Sticker left={520} top={1070} rot={-4} delay={100} bg="#3DDC84" color="#fff">most trusted first ✓</Sticker>
    </>
  );
};

const S5: React.FC = () => {
  const f = useCurrentFrame();
  const tiles = ["ep01/work1.png", "ep01/work2.jpg", "ep01/work3.jpg"];
  return (
    <>
      <Sticker left={300} top={320} rot={-3} bg="#3DDC84" color="#fff" size={58}>✓ skill installed</Sticker>
      {tiles.map((src, i) => {
        const s = spring({ frame: f - 30 - i * 7, fps: FPS, config: { damping: 12 } });
        return (
          <div key={src} style={{ position: "absolute", left: [60, 390, 720][i], top: 520 + [30, -20, 30][i] + Math.sin((f + i * 15) / 14) * 12, width: 300, height: 533, borderRadius: 28, overflow: "hidden",
            border: "6px solid #fff", boxShadow: "0 30px 70px rgba(0,0,0,.5)", transform: `rotate(${[-8, 0, 8][i] * s}deg) scale(${s})` }}>
            <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        );
      })}
      <Sticker left={170} top={1100} rot={3} delay={70} bg={Y}>made with code + AI 🎬</Sticker>
    </>
  );
};

const S6: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = 1 + Math.sin(f / 5) * 0.04;
  const g = useIn(30, 12);
  return (
    <>
      <div style={{ position: "absolute", left: 40, top: 720, width: 520, display: "flex", justifyContent: "center" }}><YaraBadge big /></div>
      <div style={{ position: "absolute", right: 50, top: 330, transform: `rotate(5deg) scale(${useIn(8, 7) * pulse})`, background: "#0B0B0C", color: Y, borderRadius: 30, padding: "26px 34px",
        fontSize: 78, fontWeight: 900, letterSpacing: -2, boxShadow: `0 0 0 8px #fff, 0 24px 60px rgba(0,0,0,.35)` }}>Comment<br /><span style={{ color: "#fff" }}>“SKILL”</span> 👇</div>
      <div style={{ position: "absolute", right: 90, top: 700, width: 230, height: 325, borderRadius: 14, overflow: "hidden", background: "#fff", border: "5px solid #fff",
        transform: `rotate(-7deg) translateY(${(1 - g) * 500}px)`, boxShadow: "0 30px 60px rgba(0,0,0,.4)" }}>
        <Img src={staticFile("guide01.png")} style={{ width: "100%" }} />
      </div>
      <Sticker left={590} top={1090} rot={-4} delay={60} bg={C.blue} color="#fff" size={44}>+ Follow for AI tips</Sticker>
      <Confetti at={14} x={760} y={420} />
    </>
  );
};

/** A real talking clip of Yara (Flow or similar) for the hook, with its own audio. */
const TalkingHook: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill><OffthreadVideo src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></AbsoluteFill>
);

const SCENES: Record<string, React.FC> = { l1: S1, l2: S2, l3: S3, l4: S4, l5: S5, l6: S6 };

const Whip: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  const inP = interpolate(f, [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const outP = interpolate(f, [len - 6, len], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ transform: `translateX(${(1 - inP) * 420 - outP * 420}px) skewX(${(1 - inP) * -8 + outP * 8}deg)`, filter: `blur(${(1 - inP) * 14 + outP * 14}px)`, opacity: Math.min(1, inP * 1.5) * (1 - outP * 0.7) }}>
      {children}
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 255, height: 8, borderRadius: 4, background: "rgba(255,255,255,.25)" }}>
      <div style={{ width: `${(f / durationInFrames) * 100}%`, height: "100%", borderRadius: 4, background: Y }} />
    </div>
  );
};

const Brand: React.FC = () => (
  <div style={{ position: "absolute", top: 280, left: 70, display: "flex", alignItems: "center", gap: 12, color: "#fff", fontWeight: 800, fontSize: 26,
    background: "rgba(4,14,36,.55)", borderRadius: 999, padding: "8px 18px 8px 8px" }}>
    <div style={{ width: 40, height: 40, borderRadius: 20, background: "#fff", padding: 5 }}><Img src={staticFile("logo.png")} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
    AI Tools with Yara · Ep 1
  </div>
);

const sfx = (src: string, from: number, volume = 0.5, dur = 40) => (
  <Sequence key={`${src}${from}`} from={Math.max(0, from)} durationInFrames={dur}><Audio src={staticFile(`sfx/${src}`)} volume={volume} /></Sequence>
);

export const YaraTutorialV3: React.FC<{ talkingClip?: string }> = ({ talkingClip }) => {
  const { durationInFrames } = useVideoConfig();
  const L = (id: string) => at(id).from;
  return (
    <AbsoluteFill style={{ fontFamily: "Inter Tight, sans-serif" }}>
      <style>{fonts}</style>
      <Background />
      <Audio src={staticFile("sfx/beat.m4a")} volume={(x) => interpolate(x, [0, 10, durationInFrames - 30, durationInFrames - 1], [0, 0.13, 0.13, 0], clamp)} />
      {/* sound design */}
      {sfx("boom.wav", 0, 0.7, 60)}
      {sfx("riser.wav", L("l1") + 22, 0.35)}
      {sfx("ding.wav", L("l1") + 64, 0.5)}
      {sfx("pop.wav", L("l1") + 66, 0.6)}
      {sfx("pop.wav", L("l1") + 78, 0.6)}
      {LINES.slice(1).map((l) => sfx("swoosh.wav", l.from - 4, 0.55, 15))}
      {Array.from({ length: 26 }).map((_, k) => sfx("type.wav", L("l3") + 6 + k * 2, 0.3, 4))}
      {sfx("sparkle.wav", L("l3") + 40, 0.5)}
      {sfx("ding.wav", L("l3") + 40, 0.45)}
      {Array.from({ length: 12 }).map((_, k) => sfx("type.wav", L("l4") + 4 + k * 3, 0.25, 4))}
      {[0, 1, 2].map((i) => sfx("pop.wav", L("l4") + 52 + i * 8, 0.55, 8))}
      {sfx("shutter.wav", L("l5") + 2, 0.6)}
      {[0, 1, 2].map((i) => sfx("swoosh.wav", L("l5") + 30 + i * 7, 0.35, 12))}
      {sfx("riser.wav", L("l6") - 36, 0.3)}
      {sfx("boom.wav", L("l6"), 0.5, 60)}
      {sfx("sparkle.wav", L("l6") + 14, 0.5)}
      {LINES.map((l, i) => {
        const Body = SCENES[l.id];
        const end = i === LINES.length - 1 ? durationInFrames - l.from : l.len + GAP;
        return (
          <Sequence key={l.id} from={l.from} durationInFrames={end}>
            <Whip len={end}>{i === 0 && talkingClip ? <TalkingHook src={talkingClip} /> : <Body />}</Whip>
            {i > 0 && <Flash />}
            {!(i === 0 && talkingClip) && <Audio src={staticFile(l.src)} />}
          </Sequence>
        );
      })}
      <Progress />
      <Brand />
      <Sequence from={0} durationInFrames={at("l6").from}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1225, display: "flex", justifyContent: "center", opacity: talkingClip ? 0 : 1 }}><YaraBadge /></div>
      </Sequence>
      <Captions />
    </AbsoluteFill>
  );
};
