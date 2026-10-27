import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { Accent, Badge, C, Confetti, FPS, INK, Sticker, Terminal, Title, Y, clamp, makeEpisode, sfx, useIn, type Line } from "../YaraEpisode";
import data from "../data/ep02-code.json";

/** Ep 2 (27 Oct): our reels are made with code (Claude Code + Remotion + Kokoro). Keyword CODE. */

const CODE = [
  ["<Sequence", " from={0}>"],
  ["  <Title>", "Meet find-skills"],
  ["  <Phone", " src=\"skills.jpg\" />"],
  ["  <Captions", " line={why} />"],
  ["</Sequence>", ""],
];

/** Editor card; lines appear one by one from `from` (local frames). */
const CodeCard: React.FC<{ top: number; left?: number; width?: number; from?: number; gap?: number; size?: number }> = ({ top, left = 60, width = 960, from = 10, gap = 12, size = 38 }) => {
  const f = useCurrentFrame();
  const s = useIn(0, 18);
  return (
    <div style={{ position: "absolute", left, top, width, borderRadius: 30, background: "#0A1222", boxShadow: "0 40px 90px rgba(0,98,245,.3)", opacity: s, transform: `scale(${0.92 + 0.08 * s})` }}>
      <div style={{ display: "flex", gap: 12, padding: "20px 26px", borderBottom: "2px solid rgba(255,255,255,.07)", alignItems: "center" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />)}
        <span style={{ marginLeft: 14, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 26, color: "rgba(230,238,255,.55)" }}>YaraEpisode.tsx</span>
      </div>
      <div style={{ padding: "24px 30px 30px", fontFamily: "ui-monospace, Menlo, monospace", fontSize: size, lineHeight: 1.5 }}>
        {CODE.map(([tag, rest], i) => {
          const o = interpolate(f, [from + i * gap, from + i * gap + 6], [0, 1], clamp);
          return <div key={i} style={{ opacity: o, transform: `translateX(${(1 - o) * 30}px)`, whiteSpace: "pre" }}><span style={{ color: Y }}>{tag}</span><span style={{ color: "#E6EEFF" }}>{rest}</span></div>;
        })}
      </div>
    </div>
  );
};

const Why: React.FC = () => {
  const f = useCurrentFrame();
  const arrow = interpolate(f, [55, 70], [0, 1], clamp);
  return (
    <>
      <Title top={340} size={96}>Code <Accent>→</Accent> reel</Title>
      <CodeCard top={520} left={50} width={600} from={8} gap={8} size={26} />
      <div style={{ position: "absolute", left: 650, top: 690, fontSize: 90, color: Y, opacity: arrow, transform: `translateX(${(1 - arrow) * -40}px)` }}>➜</div>
      <div style={{ opacity: interpolate(f, [62, 74], [0, 1], clamp) }}>
        <div style={{ position: "absolute", left: 760, top: 470, width: 270, height: 554, borderRadius: 44, background: "#0B1220", padding: 12, boxShadow: "0 50px 100px rgba(0,0,0,.45), 0 0 0 3px #2A3550 inset" }}>
          <Img src={staticFile("ep01/thumb-frame.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 34 }} />
        </div>
      </div>
    </>
  );
};

const Step1: React.FC = () => {
  const f = useCurrentFrame();
  const ask = "Make a 45-second reel about find-skills";
  const n = Math.floor(interpolate(f, [10, 10 + ask.length * 1.2], [0, ask.length], clamp));
  return (
    <>
      <Title top={340} size={84} color={INK}>Claude <Accent light>writes</Accent> the scenes</Title>
      <div style={{ position: "absolute", left: 60, right: 60, top: 540, display: "flex", justifyContent: "flex-end", transform: `scale(${useIn(4, 14)})` }}>
        <div style={{ maxWidth: 900, background: "#fff", color: INK, borderRadius: "40px 40px 10px 40px", padding: "26px 36px", fontSize: 46, lineHeight: 1.2, fontWeight: 800, boxShadow: "0 24px 60px rgba(0,0,0,.18)" }}>
          <div style={{ fontSize: 26, color: C.blue, fontWeight: 800 }}>You → Claude Code</div>{ask.slice(0, n)}
        </div>
      </div>
      <CodeCard top={830} from={62} gap={10} size={36} />
    </>
  );
};

const Step2: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <Title top={340} size={84}>A <Accent>free</Accent> AI voice</Title>
      <Terminal cmd="python -m agent.voice.tts ep02.yaml" ok="✓ 7 lines · Kokoro (free, open source)" okAt={60} top={560} cps={30} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 960, height: 160, display: "flex", alignItems: "center", gap: 10, opacity: interpolate(f, [64, 74], [0, 1], clamp) }}>
        {Array.from({ length: 34 }).map((_, k) => (
          <div key={k} style={{ flex: 1, borderRadius: 6, background: k % 4 === 0 ? Y : "#fff", height: 16 + 120 * Math.abs(Math.sin(f / 5 + k * 0.7)) * (0.4 + 0.6 * Math.abs(Math.sin(k)))}} />
        ))}
      </div>
    </>
  );
};

const Step3: React.FC = () => {
  const f = useCurrentFrame();
  const pct = Math.round(interpolate(f, [45, 110], [0, 100], clamp));
  return (
    <>
      <Title top={340} size={84}><Accent>One</Accent> command</Title>
      <Terminal cmd="npx remotion render YaraEp02 ep02.mp4" ok="✓ ep02.mp4 · captions · music · sound" okAt={112} top={560} cps={30} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 990, opacity: interpolate(f, [40, 48], [0, 1], clamp) }}>
        <div style={{ height: 30, borderRadius: 15, background: "rgba(255,255,255,.15)", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: Y, borderRadius: 15 }} />
        </div>
        <div style={{ marginTop: 16, fontSize: 46, fontWeight: 900, color: "#fff", textAlign: "center" }}>Rendering {pct}%</div>
      </div>
      <Confetti at={112} x={540} y={1000} />
    </>
  );
};

const Result: React.FC = () => {
  const f = useCurrentFrame();
  const s = spring({ frame: f - 8, fps: FPS, config: { damping: 14 } });
  return (
    <>
      <Title top={340} size={92}>Me? I'm <Accent>AI</Accent> too</Title>
      <div style={{ position: "absolute", left: 290, top: 540, width: 500, height: 500, borderRadius: 250, overflow: "hidden", transform: `scale(${s})`,
        boxShadow: `0 0 0 12px ${Y}, 0 40px 90px rgba(0,0,0,.45)` }}>
        <Img src={staticFile("ep01/thumb-frame.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%" }} />
      </div>
      <Sticker left={90} top={1010} rot={-4} delay={40} bg="#fff" color={INK} size={46}>🎬 made with Google Flow</Sticker>
      <Sticker left={470} top={1110} rot={3} delay={70} bg={C.navy} color="#fff" size={46}>everything else = code</Sticker>
    </>
  );
};

const FallbackHook: React.FC = () => (
  <>
    <Title top={380} size={100} align="center">Made with</Title>
    <Title top={500} size={200} align="center" delay={10}><Accent>CODE</Accent></Title>
    <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center" }}><Badge big /></div>
  </>
);

export const Ep02 = makeEpisode({
  num: 2,
  lines: data.lines as Line[],
  scenes: {
    hook: { body: FallbackHook, tone: "deep" },
    why: { body: Why, tone: "deep" },
    s1: { body: Step1, tone: "light" },
    s2: { body: Step2, tone: "deep" },
    s3: { body: Step3, tone: "bright" },
    result: { body: Result, tone: "deep" },
  },
  stepLabels: ["Write it", "Voice it", "Render it"],
  hookWords: ["Our", "reels", "are", "made", "with", "CODE", "👀"], hot: "CODE",
  guideImg: "guide02.png",
  effects: (at) => (
    <>
      {Array.from({ length: 24 }).map((_, k) => sfx("type.wav", at("s1") + 10 + k * 2, 0.2, 4))}
      {[0, 1, 2, 3, 4].map((k) => sfx("click.wav", at("s1") + 62 + k * 10, 0.3, 8))}
      {sfx("ding.wav", at("s2") + 60, 0.4)}
      {sfx("riser.wav", at("s3") + 45, 0.3, 66)}
      {sfx("ding.wav", at("s3") + 112, 0.4)}
      {sfx("sparkle.wav", at("result") + 8, 0.45)}
    </>
  ),
});
