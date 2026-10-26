"""Upbeat music bed + extra SFX, synthesised with numpy (our own sounds: no licences needed).

    uv run --group voice python reels/public/sfx/synth.py
"""

from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
OUT = Path(__file__).parent
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.005, r=None):
    e = np.ones(n)
    k = max(1, int(SR * a))
    e[:k] = np.linspace(0, 1, k)
    if r:
        e *= np.exp(-np.arange(n) / (SR * r))
    return e


def kick():
    x = t(0.35)
    f = 50 + 120 * np.exp(-x * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.002, 0.12)


def clap():
    x = rng.standard_normal(int(SR * 0.18))
    return np.convolve(x, np.ones(6) / 6, "same") * env(len(x), 0.001, 0.05) * 0.5


def hat():
    x = rng.standard_normal(int(SR * 0.05))
    return np.diff(x, prepend=0) * env(len(x), 0.001, 0.012) * 0.25


def tone(freq, d, shape="saw", decay=None):
    x = t(d)
    if shape == "saw":
        y = 2 * ((x * freq) % 1) - 1
    else:
        y = np.sin(2 * np.pi * freq * x)
    return y * env(len(x), 0.01, decay)


def lowpass(y, k=12):
    return np.convolve(y, np.ones(k) / k, "same")


def beat(seconds=45, bpm=112):
    beat_s = 60 / bpm
    n = int(SR * seconds)
    mix = np.zeros(n + SR)
    roots = [110.0, 87.31, 130.81, 98.0]  # A2 F2 C3 G2
    chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]]

    def add(sig, at, gain=1.0):
        i = int(at * SR)
        if i < n:
            mix[i:i + len(sig)] += sig[: len(mix) - i] * gain

    bar = 4 * beat_s
    for b in range(int(seconds / bar) + 1):
        c = b % 4
        for k in range(4):
            add(kick(), b * bar + k * beat_s, 0.9)
            if k in (1, 3):
                add(clap(), b * bar + k * beat_s, 0.6)
        for k in range(8):
            add(hat(), b * bar + k * beat_s / 2, 0.7 if k % 2 else 0.4)
        for k in range(8):  # bass eighths
            add(lowpass(tone(roots[c], beat_s / 2 * 0.9, "saw", 0.15), 20), b * bar + k * beat_s / 2, 0.35)
        pad = sum(lowpass(tone(f, bar, "saw"), 40) for f in chords[c]) / 3
        pad *= np.minimum(1, np.minimum(np.arange(len(pad)) / (SR * 0.3), (len(pad) - np.arange(len(pad))) / (SR * 0.4)))
        add(pad, b * bar, 0.22)
    mix = mix[:n]
    fade = int(SR * 1.5)
    mix[:fade] *= np.linspace(0, 1, fade)
    mix[-fade:] *= np.linspace(1, 0, fade)
    return mix / np.max(np.abs(mix)) * 0.8


def boom():
    x = t(1.2)
    f = 40 + 80 * np.exp(-x * 8)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.002, 0.35) * 0.95


def riser(d=1.2):
    x = t(d)
    noise = rng.standard_normal(len(x))
    swept = np.sin(2 * np.pi * np.cumsum(300 + 1500 * (x / d) ** 2) / SR)
    return (lowpass(noise, 8) * 0.25 + swept * 0.25) * (x / d) ** 2


def shutter():
    a = rng.standard_normal(int(SR * 0.04)) * env(int(SR * 0.04), 0.001, 0.008)
    return np.concatenate([a, np.zeros(int(SR * 0.05)), a * 0.8]) * 0.6


def sparkle():
    out = np.zeros(int(SR * 0.7))
    for i, f in enumerate([1568, 2093, 2637, 3136]):
        s = tone(f, 0.4, "sin", 0.08) * 0.25
        j = int(i * 0.06 * SR)
        out[j:j + len(s)] += s
    return out


def swoosh():
    x = t(0.35)
    noise = rng.standard_normal(len(x))
    return lowpass(noise, 4) * np.sin(np.pi * x / 0.35) ** 2 * 0.5


if __name__ == "__main__":
    for name, sig in {"boom": boom(), "riser": riser(), "shutter": shutter(), "sparkle": sparkle(), "swoosh": swoosh()}.items():
        sf.write(OUT / f"{name}.wav", sig.astype(np.float32), SR)
    sf.write(OUT / "beat.wav", beat().astype(np.float32), SR)
    print("ok")
