"""Yara's voice-over: free, offline text-to-speech with Kokoro-82M (Apache-2.0, commercial use OK).

    uv run --group voice python -m agent.voice.tts reels/scripts/ep01-find-skills.yaml

Script YAML: {id, voice?, speed?, lines: [{id, text, say?}]}. `say` is what is spoken when it differs from the
on-screen text (e.g. "nine hundred and ninety-nine dirhams" for "AED 999").
Writes reels/public/vo/<id>/<line>.wav (48 kHz mono, loudness-normalised) and reels/src/data/<id>.json with each
line's duration, approximate word timings (for captions) and a 30 fps loudness envelope (for the talking glow).
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

import yaml

from agent.config import ROOT

CACHE = Path.home() / ".cache" / "azmin-voice"
HF = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main"
DEFAULT_VOICE = "af_heart"  # Yara's voice: warm female, American English
FPS = 30


def _download(url: str, target: Path) -> Path:
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        print(f"downloading {url.rsplit('/', 1)[-1]} …")
        urllib.request.urlretrieve(url, target)
    return target


def _fix_espeak_data() -> None:
    """espeakng-loader's library looks for its data at the path it was built at; point that path to the
    bundled data (works in cloud sessions and on GitHub runners, where /home/runner/work is writable)."""
    import espeakng_loader

    built = Path("/home/runner/work/espeakng-loader/espeakng-loader/espeak-ng/_dynamic/share/espeak-ng-data")
    if built.exists():
        return
    try:
        built.parent.mkdir(parents=True, exist_ok=True)
        built.symlink_to(espeakng_loader.get_data_path())
    except OSError as e:
        print(f"warning: could not link espeak data ({e}); install espeak-ng if speech fails")


def _model(voice: str):
    import numpy as np
    from kokoro_onnx import Kokoro

    _fix_espeak_data()
    model = _download(f"{HF}/onnx/model.onnx", CACHE / "kokoro.onnx")
    raw = _download(f"{HF}/voices/{voice}.bin", CACHE / f"{voice}.bin")
    voices = CACHE / f"{voice}.npz"
    if not voices.exists():
        np.savez(voices, **{voice: np.fromfile(raw, dtype=np.float32).reshape(-1, 1, 256)})
    return Kokoro(str(model), str(voices))


def word_timings(text: str, duration: float, lead: float = 0.08, tail: float = 0.25) -> list[dict]:
    """Spread the line's words over its audio by character count (Kokoro gives no timestamps)."""
    words = text.split()
    weights = [len(re.sub(r"\W", "", w)) + 2 + (4 if re.search(r"[.,!?:]$", w) else 0) for w in words]
    span, t, out = max(duration - lead - tail, 0.1), lead, []
    for w, k in zip(words, weights):
        d = span * k / sum(weights)
        out.append({"word": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return out


def envelope(samples, sr: int) -> list[float]:
    import numpy as np

    hop = sr // FPS
    rms = [float(np.sqrt(np.mean(samples[i:i + hop] ** 2))) for i in range(0, len(samples), hop)]
    peak = max(rms) or 1.0
    return [round(r / peak, 3) for r in rms]


def generate(script_path: Path) -> Path:
    import soundfile as sf

    spec = yaml.safe_load(script_path.read_text())
    sid, voice, speed = spec["id"], spec.get("voice", DEFAULT_VOICE), float(spec.get("speed", 1.05))
    out_dir = ROOT / "reels/public/vo" / sid
    out_dir.mkdir(parents=True, exist_ok=True)
    kokoro = _model(voice)
    lines = []
    for line in spec["lines"]:
        audio, sr = kokoro.create(line.get("say", line["text"]), voice=voice, speed=speed, lang="en-us")
        raw = out_dir / f"{line['id']}.raw.wav"
        wav = out_dir / f"{line['id']}.wav"
        sf.write(raw, audio, sr)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                        "-ar", "48000", "-ac", "1", str(wav)], check=True)
        raw.unlink()
        data, sr2 = sf.read(wav)
        duration = len(data) / sr2
        lines.append({"id": line["id"], "text": line["text"], "src": f"vo/{sid}/{line['id']}.wav",
                      "duration": round(duration, 3), "words": word_timings(line["text"], duration),
                      "envelope": envelope(data, sr2)})
        print(f"  {line['id']}: {duration:.2f}s")
    target = ROOT / "reels/src/data" / f"{sid}.json"
    target.write_text(json.dumps({"id": sid, "voice": voice, "fps": FPS, "lines": lines}, indent=1))
    return target


if __name__ == "__main__":
    print(generate(Path(sys.argv[1]).resolve()).relative_to(ROOT))
