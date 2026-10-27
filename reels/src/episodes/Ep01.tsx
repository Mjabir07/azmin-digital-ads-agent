import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { Accent, Badge, C, Confetti, FPS, INK, Phone, Sticker, Terminal, Title, Y, clamp, makeEpisode, sfx, useIn, type Line } from "../YaraEpisode";
import data from "../data/ep01-find-skills-v4.json";

/** Ep 1 (26 Oct): find-skills, teach Claude new skills in seconds. Keyword SKILL. */
// Section contents (local frame 0 = section start; voice starts at frame 6)
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

export const Ep01 = makeEpisode({
  num: 1,
  lines: data.lines as Line[],
  scenes: {
    hook: { body: FallbackHook, tone: "deep" },
    why: { body: Why, tone: "deep" },
    s1: { body: Step1, tone: "light" },
    s2: { body: Step2, tone: "bright" },
    s3: { body: Step3, tone: "deep" },
    result: { body: Result, tone: "bright" },
  },
  stepLabels: ["Install it", "Ask Claude", "Pick & install"],
  hookWords: ["The", "#1", "skill", "on", "skills.sh", "right", "now 🤯"], hot: "#1",
  guideImg: "guide01.png",
  effects: (at) => (
    <>
        {Array.from({ length: 30 }).map((_, k) => sfx("type.wav", at("s1") + 10 + k * 2, 0.22, 4))}
        {sfx("ding.wav", at("s1") + 110, 0.4)}
        {sfx("pop.wav", at("s3") + 30, 0.45, 10)}
        {sfx("pop.wav", at("s3") + 52, 0.45, 10)}
        {sfx("pop.wav", at("s3") + 74, 0.45, 10)}
        {sfx("ding.wav", at("s3") + 135, 0.35)}
        {sfx("shutter.wav", at("result") + 20, 0.4)}
    </>
  ),
});
