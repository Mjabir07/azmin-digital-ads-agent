from itertools import pairwise

import pytest

from agent.voice.tts import envelope, word_timings


def test_word_timings_cover_line_in_order():
    w = word_timings("Comment SKILL and I'll send you the guide.", 4.0)
    assert w[0]["word"] == "Comment" and len(w) == 8
    assert all(a["end"] <= b["start"] + 1e-6 for a, b in pairwise(w))
    assert w[0]["start"] > 0 and w[-1]["end"] <= 4.0


def test_envelope_is_normalised_per_frame():
    np = pytest.importorskip("numpy")  # voice group only
    sr = 48000
    tone = np.concatenate([np.zeros(sr // 2), np.sin(np.linspace(0, 2000, sr // 2))])
    env = envelope(tone, sr)
    assert len(env) == 30 and max(env) == 1.0 and env[0] == 0.0
