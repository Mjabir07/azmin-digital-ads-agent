"""Check the free Google AI Studio key by generating one test image (free tier, no billing).

Tries the current free Flash image models in order. The key is never printed.
"""

from __future__ import annotations

import base64
import os
import sys

import httpx

from agent.config import ROOT

MODELS = ["gemini-3.1-flash-image-preview", "gemini-2.5-flash-image"]
PROMPT = (
    "Premium vertical 9:16 photo for a Dubai digital agency ad: a sleek smartphone on a marble desk showing an "
    "abstract modern website layout in blue and cyan, soft studio light, shallow depth of field, no readable text, no logos."
)


def main() -> int:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        print("GEMINI_API_KEY secret is not set.")
        return 1
    out = ROOT / "media/inbox/gemini-test.png"
    with httpx.Client(timeout=120, headers={"x-goog-api-key": key}) as http:
        for model in MODELS:
            r = http.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                json={"contents": [{"parts": [{"text": PROMPT}]}],
                      "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}},
            )
            body = r.json()
            if r.status_code != 200:
                msg = body.get("error", {}).get("message", r.text)[:200].replace(key, "***")
                print(f"{model}: HTTP {r.status_code} - {msg}")
                continue
            for part in body.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                data = (part.get("inlineData") or part.get("inline_data") or {}).get("data")
                if data:
                    out.write_bytes(base64.b64decode(data))
                    print(f"OK: {model} generated {out.name} ({out.stat().st_size // 1024} KB) on the free tier")
                    return 0
            print(f"{model}: no image in response")
    return 1


if __name__ == "__main__":
    sys.exit(main())
