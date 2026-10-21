import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./brand";
import { WhatsAppIcon } from "./WhatsAppIcon";

/**
 * "What AED 999 gets your business": 32 s motion-graphics explainer for the Starter Combo (receipt trend).
 * Hook → problem (Google search) → receipt prints line by line → real client sites → 3 steps → WhatsApp CTA.
 * Claims only from config/packages.yaml. Stories/Reels safe zones: nothing important in the top 250 / bottom 340 px.
 * Silent: add music from Meta's / Instagram's free library when uploading.
 */

export const EXPLAINER_REEL_FRAMES = 960;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
const fonts = `
@font-face { font-family: Poppins; font-weight: 400; src: url(${staticFile("Poppins-400.woff2")}); }
@font-face { font-family: Poppins; font-weight: 600; src: url(${staticFile("Poppins-600.woff2")}); }
@font-face { font-family: Poppins; font-weight: 700; src: url(${staticFile("Poppins-700.woff2")}); }
@font-face { font-family: Poppins; font-weight: 800; src: url(${staticFile("Poppins-800.woff2")}); }
`;

const useSpring = (delay = 0, damping = 14, mass = 0.6) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping, mass, stiffness: 170 } });
};

/** Navy background with slowly drifting angled bars (echo the logo strokes) and soft glow. */
const Background: React.FC = () => {
  const f = useCurrentFrame();
  const bar = (w: number, h: number, x: number, y: number, color: string, o: number, speed: number) => (
    <div style={{ position: "absolute", width: w, height: h, left: x + Math.sin(f / speed) * 40, top: y + f * 0.15,
      borderRadius: 60, background: color, opacity: o, transform: "rotate(-28deg)" }} />
  );
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1400px 1100px at ${70 + Math.sin(f / 90) * 10}% 12%, #0A5BE0 0%, ${C.navy} 62%)`, overflow: "hidden" }}>
      {bar(900, 190, -380, 150, C.cyan, 0.07, 70)}
      {bar(620, 150, 640, 1460, C.cyan, 0.12, 55)}
      {bar(520, 120, 760, 420, C.blue, 0.18, 80)}
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", width: 6, height: 6, borderRadius: 3, background: "#fff",
          opacity: 0.12 + (i % 4) * 0.05, left: (i * 197) % 1080, top: ((i * 331 + f * (0.6 + (i % 3) * 0.3)) % 2000) - 40 }} />
      ))}
    </AbsoluteFill>
  );
};

/** Scene wrapper: slides in from the right with a blur, slides out to the left. */
const Scene: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  const inP = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: outExpo });
  const outP = interpolate(f, [len - 12, len], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: inP * (1 - outP), filter: `blur(${(1 - inP) * 10 + outP * 10}px)`,
      transform: `translateX(${(1 - inP) * 140 - outP * 140}px)` }}>{children}</AbsoluteFill>
  );
};

/** Diagonal brand-colour wipe between scenes. */
const Wipe: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 18], [-1600, 1600], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: -400, left: x, width: 520, height: 2800, transform: "rotate(-28deg)",
        background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})`, opacity: 0.9, borderRadius: 80 }} />
    </AbsoluteFill>
  );
};

const Rise: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const s = useSpring(delay);
  return <div style={{ opacity: s, transform: `translateY(${(1 - s) * 50}px)`, filter: `blur(${(1 - s) * 8}px)`, ...style }}>{children}</div>;
};

const Kicker: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => (
  <Rise delay={delay}>
    <span style={{ display: "inline-block", background: C.cyan, color: C.navy, fontWeight: 800, fontSize: 34, letterSpacing: 1,
      padding: "12px 28px", borderRadius: 999, textTransform: "uppercase" }}>{text}</span>
  </Rise>
);

const Logo: React.FC<{ size?: number }> = ({ size = 84 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
    <div style={{ width: size, height: size, borderRadius: size * 0.24, background: "#fff", padding: size * 0.1 }}>
      <Img src={staticFile("logo.png")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
    <div style={{ fontWeight: 800, fontSize: size * 0.38, letterSpacing: 1, color: "#fff" }}>AZMIN <span style={{ color: C.cyan }}>DIGITAL</span></div>
  </div>
);

const gradText: React.CSSProperties = { background: `linear-gradient(90deg, #fff, ${C.cyan})`, WebkitBackgroundClip: "text", color: "transparent" };

// ---- 1. Hook: price counts up -------------------------------------------------------------------
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [18, 52], [0, 999], { ...clamp, easing: outExpo }));
  const pop = useSpring(18, 9);
  const sweep = interpolate(f, [55, 80], [-300, 1300], clamp);
  return (
    <AbsoluteFill style={{ padding: "470px 80px 0" }}>
      <Rise><div style={{ fontSize: 100, fontWeight: 800, color: "#fff", lineHeight: 1 }}>What does</div></Rise>
      <div style={{ position: "relative", marginTop: 30, transform: `scale(${0.6 + 0.4 * pop})`, transformOrigin: "left center" }}>
        <div style={{ fontSize: 330, fontWeight: 800, letterSpacing: -10, lineHeight: 0.95, ...gradText }}>
          <span style={{ fontSize: 110, letterSpacing: 0, marginRight: 18 }}>AED</span>{n}
        </div>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: sweep, width: 160, transform: "skewX(-20deg)",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)" }} />
      </div>
      <Rise delay={30}><div style={{ fontSize: 100, fontWeight: 800, color: "#fff", lineHeight: 1.05, marginTop: 30 }}>get a UAE<br />business?</div></Rise>
      <Rise delay={50} style={{ marginTop: 60 }}><Kicker text="Let's see the receipt" /></Rise>
    </AbsoluteFill>
  );
};

// ---- 2. Problem: customers Google you first ---------------------------------------------------------
const QUERY = "website designer near me";
const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const typed = QUERY.slice(0, Math.floor(interpolate(f, [16, 50], [0, QUERY.length], clamp)));
  const caret = Math.floor(f / 8) % 2 === 0;
  const result = (i: number, title: string, url: string, mine: boolean) => {
    const s = useSpring(55 + i * 8, 15);
    return (
      <div key={i} style={{ opacity: s, transform: `translateY(${(1 - s) * 40}px)`, background: mine ? "#fff" : "rgba(255,255,255,.08)",
        borderRadius: 26, padding: "26px 32px", border: mine ? `4px solid ${C.cyan}` : "2px solid rgba(255,255,255,.12)" }}>
        <div style={{ fontSize: 26, color: mine ? "#5B6B85" : "#8FA3C7" }}>{url}</div>
        <div style={{ fontSize: 40, fontWeight: 700, color: mine ? C.ink : "#B9C8E6", marginTop: 4 }}>{title}</div>
      </div>
    );
  };
  const strike = interpolate(f, [100, 115], [0, 1], { ...clamp, easing: outExpo });
  return (
    <AbsoluteFill style={{ padding: "360px 80px 0" }}>
      <Rise><div style={{ fontSize: 90, fontWeight: 800, color: "#fff", lineHeight: 1.05 }}>Customers <span style={{ color: C.cyan }}>Google</span><br />you first.</div></Rise>
      <Rise delay={8} style={{ marginTop: 56 }}>
        <div style={{ background: "#fff", borderRadius: 999, padding: "30px 40px", display: "flex", alignItems: "center", gap: 24,
          boxShadow: "0 30px 70px rgba(0,0,0,.35)" }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#5B6B85" strokeWidth="2.4" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5l5 5" /></svg>
          <span style={{ fontSize: 44, color: C.ink, fontWeight: 600 }}>{typed}<span style={{ opacity: caret ? 1 : 0, color: C.blue }}>|</span></span>
        </div>
      </Rise>
      <div style={{ display: "grid", gap: 22, marginTop: 40 }}>
        {result(0, "Your Business — Official Website", "www.yourbusiness.ae", true)}
        {result(1, "Another company", "www.another-company.ae", false)}
        {result(2, "Another company", "www.another-company-2.ae", false)}
      </div>
      <Rise delay={95} style={{ marginTop: 50 }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff", position: "relative", display: "inline-block" }}>
          No website? They choose someone else.
          <div style={{ position: "absolute", left: 0, bottom: -12, height: 10, width: `${strike * 100}%`, background: C.cyan, borderRadius: 5 }} />
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

// ---- 3. Receipt prints line by line ------------------------------------------------------------------
const LINES: { item: string; value: string; free?: boolean }[] = [
  { item: "Professional business website", value: "✓" },
  { item: "Mobile-friendly design", value: "✓" },
  { item: "WhatsApp chat button", value: "✓" },
  { item: "Domain name", value: "FREE", free: true },
  { item: "1 year hosting", value: "FREE", free: true },
  { item: "Ready in as little as", value: "1 day" },
];
const Receipt: React.FC = () => {
  const f = useCurrentFrame();
  const paper = interpolate(f, [6, 40], [0, 1], { ...clamp, easing: outExpo });
  const lineAt = (i: number) => 30 + i * 20;
  const totalStart = lineAt(LINES.length) + 6;
  const total = Math.round(interpolate(f, [totalStart, totalStart + 24], [0, 999], { ...clamp, easing: outExpo }));
  const stamp = useSpring(totalStart + 30, 8, 0.5);
  return (
    <AbsoluteFill style={{ padding: "280px 70px 0" }}>
      <Kicker text="Here's the receipt" />
      <Rise delay={4}><div style={{ fontSize: 70, fontWeight: 800, color: "#fff", lineHeight: 1.05, marginTop: 22 }}>Everything to get your<br />business <span style={{ color: C.cyan }}>online</span></div></Rise>
      <div style={{ marginTop: 20, paddingTop: 40, overflow: "hidden", height: 1080 * paper, transform: "rotate(-1.2deg)" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "36px 44px", boxShadow: "0 40px 90px rgba(0,0,0,.4)", position: "relative" }}>
          <div style={{ textAlign: "center", borderBottom: "3px dashed #C9D3E6", paddingBottom: 18, marginBottom: 12 }}>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 7, color: C.ink }}>AZMIN DIGITAL</div>
            <div style={{ fontSize: 22, letterSpacing: 3, color: "#5B6B85" }}>RECEIPT · DUBAI, UAE</div>
          </div>
          {LINES.map((l, i) => {
            const s = spring({ frame: f - lineAt(i), fps: 30, config: { damping: 12, mass: 0.5 } });
            const hl = interpolate(f, [lineAt(i), lineAt(i) + 8, lineAt(i) + 22], [0, 1, 0], clamp);
            return (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 14, fontSize: 34, fontWeight: 600, color: C.ink,
                padding: "11px 10px", margin: "0 -10px", opacity: s, transform: `translateX(${(1 - s) * -40}px)`, borderRadius: 12,
                background: `rgba(0,210,226,${hl * 0.18})` }}>
                <span>{l.item}</span>
                <i style={{ flex: 1, borderBottom: "3px dotted #C9D3E6", transform: "translateY(-8px)" }} />
                <b style={l.free ? { color: "#fff", background: C.wa, borderRadius: 10, padding: "2px 14px", fontSize: 28, transform: `scale(${s})`, display: "inline-block" }
                  : { color: C.blue, fontWeight: 800, transform: `scale(${s})`, display: "inline-block" }}>{l.value}</b>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "3px dashed #C9D3E6", marginTop: 14, paddingTop: 20 }}>
            <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: 5, color: C.ink }}>TOTAL</span>
            <span style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2, background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})`, WebkitBackgroundClip: "text", color: "transparent" }}>AED {total}</span>
          </div>
          <div style={{ textAlign: "center", fontSize: 24, color: "#5B6B85", marginTop: 10 }}>Fixed price · No hidden costs</div>
          <div style={{ position: "absolute", right: 18, top: -30, transform: `rotate(10deg) scale(${2 - stamp})`, opacity: stamp,
            background: C.wa, color: "#fff", borderRadius: 18, padding: "10px 24px", fontSize: 34, fontWeight: 800, letterSpacing: 2,
            boxShadow: "0 14px 34px rgba(37,211,102,.45)" }}>ALL INCLUDED ✓</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---- 4. Real client websites -----------------------------------------------------------------------
const Phone: React.FC<{ src: string; delay: number; x: number; tilt: number }> = ({ src, delay, x, tilt }) => {
  const f = useCurrentFrame();
  const s = useSpring(delay, 16, 0.8);
  const zoom = interpolate(f, [delay + 20, delay + 190], [1, 1.12], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: x, top: 640 + Math.sin((f + delay) / 18) * 10, perspective: 1800 }}>
      <div style={{ width: 400, height: 820, borderRadius: 60, background: "#0B1220", padding: 14, boxShadow: "0 50px 100px rgba(0,0,0,.45), 0 0 0 3px #2A3550 inset",
        transform: `rotateY(${interpolate(s, [0, 1], [tilt * 3, tilt])}deg) translateY(${(1 - s) * 300}px)`, opacity: s }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 48, overflow: "hidden", background: "#fff" }}>
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transform: `scale(${zoom})`, transformOrigin: "50% 20%" }} />
        </div>
      </div>
    </div>
  );
};
const Samples: React.FC = () => (
  <AbsoluteFill style={{ padding: "290px 80px 0" }}>
    <Kicker text="Our work" />
    <Rise delay={4}><div style={{ fontSize: 80, fontWeight: 800, color: "#fff", lineHeight: 1.05, marginTop: 22 }}>Real websites,<br /><span style={{ color: C.cyan }}>real UAE clients.</span></div></Rise>
    <Phone src="msj.png" delay={14} x={70} tilt={14} />
    <Phone src="ppj.png" delay={30} x={590} tilt={-14} />
    <Rise delay={60} style={{ position: "absolute", left: 80, right: 80, top: 1500, display: "flex", justifyContent: "space-between", fontSize: 30, fontWeight: 700, color: "#B9C8E6" }}>
      <span>msjtechnicaluae.com</span><span>purepreciousjewellery.com</span>
    </Rise>
  </AbsoluteFill>
);

// ---- 5. Three simple steps ----------------------------------------------------------------------------
const STEPS = ["Share your business details", "We design your website", "You go live 🚀"];
const Steps: React.FC = () => {
  const f = useCurrentFrame();
  const line = interpolate(f, [20, 100], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ padding: "380px 80px 0" }}>
      <Kicker text="How it works" />
      <Rise delay={4}><div style={{ fontSize: 84, fontWeight: 800, color: "#fff", lineHeight: 1.05, marginTop: 22 }}>3 simple steps</div></Rise>
      <div style={{ position: "relative", marginTop: 90 }}>
        <div style={{ position: "absolute", left: 54, top: 60, width: 8, height: 520 * line, borderRadius: 4, background: `linear-gradient(${C.cyan}, ${C.blue})` }} />
        {STEPS.map((t, i) => {
          const s = useSpring(20 + i * 30, 11);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 36, marginBottom: 140, opacity: s, transform: `translateX(${(1 - s) * 80}px)` }}>
              <div style={{ width: 116, height: 116, borderRadius: 58, background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`, display: "grid", placeItems: "center",
                fontSize: 56, fontWeight: 800, color: "#fff", boxShadow: "0 20px 50px rgba(0,98,245,.45)", transform: `scale(${s})`, flex: "none" }}>{i + 1}</div>
              <div style={{ fontSize: 50, fontWeight: 700, color: "#fff" }}>{t}</div>
            </div>
          );
        })}
      </div>
      <Rise delay={110}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: "#fff", color: C.ink, borderRadius: 24, padding: "22px 34px", fontSize: 44, fontWeight: 800 }}>
          ⚡ Ready in as little as <span style={{ color: C.blue }}>1 day</span>
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

// ---- 6. Call to action --------------------------------------------------------------------------------
const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = 1 + Math.sin(f / 6) * 0.03;
  const btn = useSpring(30, 10);
  return (
    <AbsoluteFill style={{ padding: "400px 80px 0", alignItems: "center", textAlign: "center" }}>
      <Rise><Logo size={110} /></Rise>
      <Rise delay={8}><div style={{ fontSize: 96, fontWeight: 800, color: "#fff", lineHeight: 1.05, marginTop: 70 }}>Get your website<br />today</div></Rise>
      <Rise delay={16}><div style={{ fontSize: 150, fontWeight: 800, letterSpacing: -5, marginTop: 30, ...gradText }}><span style={{ fontSize: 64, letterSpacing: 0, marginRight: 14 }}>AED</span>999</div></Rise>
      <Rise delay={22}><div style={{ fontSize: 40, fontWeight: 600, color: C.cyan }}>Domain + 1 year hosting included</div></Rise>
      <div style={{ marginTop: 70, transform: `scale(${btn * pulse})`, opacity: btn }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 20, background: C.wa, color: "#fff", fontWeight: 800, fontSize: 52,
          padding: "32px 56px", borderRadius: 999, boxShadow: `0 0 0 ${10 + Math.sin(f / 6) * 8}px rgba(37,211,102,.25), 0 24px 60px rgba(37,211,102,.45)` }}>
          <WhatsAppIcon size={60} />Chat on WhatsApp
        </div>
      </div>
      <Rise delay={40}><div style={{ fontSize: 32, fontWeight: 600, color: "#B9C8E6", marginTop: 44 }}>Fixed price · No hidden costs</div></Rise>
    </AbsoluteFill>
  );
};

const SCENES: [React.FC, number][] = [[Hook, 110], [Problem, 160], [Receipt, 250], [Samples, 200], [Steps, 150], [Cta, 90]];

export const ExplainerReel: React.FC = () => {
  let start = 0;
  return (
    <AbsoluteFill style={{ fontFamily: "Poppins, sans-serif" }}>
      <style>{fonts}</style>
      <Background />
      {SCENES.map(([S, len], i) => {
        const from = start;
        start += len;
        return (
          <React.Fragment key={i}>
            <Sequence from={from} durationInFrames={i === SCENES.length - 1 ? len : len + 6}>
              <Scene len={i === SCENES.length - 1 ? len + 999 : len + 6}><S /></Scene>
            </Sequence>
            {i > 0 && <Sequence from={from - 9} durationInFrames={20}><Wipe /></Sequence>}
          </React.Fragment>
        );
      })}
      <Sequence durationInFrames={EXPLAINER_REEL_FRAMES - 96}>
        <div style={{ position: "absolute", top: 120, left: 80, opacity: 0.9 }}><Logo size={64} /></div>
      </Sequence>
    </AbsoluteFill>
  );
};
