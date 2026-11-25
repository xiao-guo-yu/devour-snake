from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt


# A calm, simple main-menu loop synthesized without external samples.
SR = 44_100
BPM = 80
BEAT = 60.0 / BPM
BAR = 4.0 * BEAT
BARS = 20
DURATION = BARS * BAR
SAMPLE_COUNT = int(round(SR * DURATION))
SEED = 20_261_121

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "audio" / "music"
RNG = np.random.default_rng(SEED)


def midi_hz(note: float) -> float:
    return 440.0 * (2.0 ** ((note - 69.0) / 12.0))


CHORDS = {
    "Fmaj7": np.array([53, 57, 60, 64], dtype=np.float32),
    "Dm7": np.array([50, 53, 57, 60], dtype=np.float32),
    "Bbmaj7": np.array([46, 50, 53, 57], dtype=np.float32),
    "Cadd9": np.array([48, 55, 62, 64], dtype=np.float32),
}
PROGRESSION = ["Fmaj7", "Dm7", "Bbmaj7", "Cadd9"]


MELODY = {
    "Fmaj7": [(0.00, 69, 2.00), (2.00, 72, 1.00), (3.00, 76, 1.55)],
    "Dm7": [(0.00, 77, 1.85), (2.00, 76, 0.90), (3.00, 74, 1.75)],
    "Bbmaj7": [(0.00, 74, 1.65), (1.50, 77, 1.35), (3.00, 81, 1.55)],
    "Cadd9": [(0.00, 79, 1.60), (2.00, 76, 0.90), (3.00, 74, 0.75)],
}


def track() -> np.ndarray:
    return np.zeros(SAMPLE_COUNT, dtype=np.float32)


def add_event(target: np.ndarray, start_sec: float, duration_sec: float, synth, amp: float) -> None:
    start = max(0, int(round(start_sec * SR)))
    if start >= SAMPLE_COUNT:
        return
    count = min(SAMPLE_COUNT - start, int(round(duration_sec * SR)))
    if count <= 1:
        return
    t = np.arange(count, dtype=np.float32) / SR
    wave = synth(t, count / SR).astype(np.float32, copy=False)
    attack = min(max(1, int(0.007 * SR)), max(1, count // 5))
    release = min(max(1, int(0.050 * SR)), max(1, count // 3))
    env = np.ones(count, dtype=np.float32)
    env[:attack] *= np.linspace(0.0, 1.0, attack, dtype=np.float32)
    env[-release:] *= np.linspace(1.0, 0.0, release, dtype=np.float32) ** 0.85
    target[start:start + count] += wave * env * amp


def felt_piano_synth(freq: float):
    partials = (
        (1.000, 0.78, 0.78),
        (2.001, 0.28, 0.52),
        (3.006, 0.15, 0.38),
        (4.017, 0.08, 0.26),
        (5.033, 0.045, 0.18),
    )

    def synth(t: np.ndarray, _duration: float) -> np.ndarray:
        out = np.zeros_like(t)
        for ratio, gain, decay in partials:
            phase = 2.0 * np.pi * freq * ratio * t
            out += gain * np.sin(phase) * np.exp(-t / decay)
        soft_click = RNG.standard_normal(len(t)).astype(np.float32)
        soft_click *= np.exp(-t / 0.012) * 0.012
        body = np.tanh((out + soft_click) * 0.85)
        return body * np.exp(-t / 2.4)
    return synth


def bell_synth(freq: float):
    def synth(t: np.ndarray, _duration: float) -> np.ndarray:
        out = (
            0.72 * np.sin(2.0 * np.pi * freq * t) * np.exp(-t / 0.75)
            + 0.22 * np.sin(2.0 * np.pi * freq * 2.01 * t + 0.2) * np.exp(-t / 0.42)
            + 0.10 * np.sin(2.0 * np.pi * freq * 3.93 * t + 0.8) * np.exp(-t / 0.27)
        )
        return out
    return synth


def pad_synth(freq: float, detune_cents: float):
    detune = 2.0 ** (detune_cents / 1200.0)

    def synth(t: np.ndarray, duration: float) -> np.ndarray:
        phase = 2.0 * np.pi * freq * detune * t
        slow_motion = 1.0 + 0.035 * np.sin(2.0 * np.pi * 0.13 * t)
        body = (
            0.72 * np.sin(phase * slow_motion)
            + 0.22 * np.sin(2.0 * phase + 0.35)
            + 0.08 * np.sin(0.5 * phase + 0.8)
        )
        attack = np.minimum(t / 0.65, 1.0)
        release = np.minimum(np.maximum(duration - t, 0.0) / 0.72, 1.0)
        return body * attack * release
    return synth


def bass_synth(freq: float):
    def synth(t: np.ndarray, duration: float) -> np.ndarray:
        phase = 2.0 * np.pi * freq * t
        body = np.sin(phase) + 0.16 * np.sin(2.0 * phase + 0.1)
        attack = np.minimum(t / 0.22, 1.0)
        release = np.minimum(np.maximum(duration - t, 0.0) / 0.65, 1.0)
        return body * attack * release
    return synth


def air_synth(seed: int):
    local_rng = np.random.default_rng(seed)

    def synth(t: np.ndarray, _duration: float) -> np.ndarray:
        noise = local_rng.standard_normal(len(t)).astype(np.float32)
        return noise * (0.72 + 0.28 * np.sin(2.0 * np.pi * 0.055 * t + 0.7))
    return synth


def apply_filter(data: np.ndarray, kind: str, cutoff: float, order: int = 2) -> np.ndarray:
    sos = butter(order, cutoff / (SR / 2.0), btype=kind, output="sos")
    return sosfilt(sos, data).astype(np.float32, copy=False)


def panned_add(mix: np.ndarray, mono: np.ndarray, pan: float, gain: float) -> None:
    pan = float(np.clip(pan, -1.0, 1.0))
    angle = (pan + 1.0) * np.pi / 4.0
    mix[:, 0] += mono * (np.cos(angle) * gain)
    mix[:, 1] += mono * (np.sin(angle) * gain)


def normalize(data: np.ndarray, peak_target: float) -> np.ndarray:
    peak = float(np.max(np.abs(data)))
    return (data * (peak_target / max(peak, 1e-9))).astype(np.float32)


def render() -> tuple[np.ndarray, dict]:
    piano = track()
    bell = track()
    arp = track()
    pad = track()
    bass = track()
    air = track()

    for bar in range(BARS):
        t0 = bar * BAR
        chord_name = PROGRESSION[bar % 4]
        notes = CHORDS[chord_name]

        for index, note in enumerate(notes[:3]):
            add_event(
                pad,
                t0,
                BAR * 0.99,
                pad_synth(midi_hz(note), -5.0 if index % 2 == 0 else 6.0),
                0.030,
            )
            add_event(
                pad,
                t0,
                BAR * 0.99,
                pad_synth(midi_hz(note + 12), 5.0 if index % 2 == 0 else -5.0),
                0.011,
            )

        add_event(
            bass,
            t0,
            BAR * 0.92,
            bass_synth(midi_hz(notes[0] - 12)),
            0.105,
        )

        # Sparse eighth-note arpeggio; quiet enough to stay under the melody.
        arp_pattern = [0, 1, 2, 3, 2, 1, 2, 3]
        for step, chord_index in enumerate(arp_pattern):
            if bar < 2 and step % 2:
                continue
            velocity = 1.0 if step in (0, 3, 4) else 0.72
            add_event(
                arp,
                t0 + step * BEAT * 0.5,
                0.92,
                felt_piano_synth(midi_hz(notes[chord_index] + 12)),
                0.025 * velocity,
            )

    # The four-bar melody repeats gently, with small changes in timbre.
    for cycle in range(5):
        start_bar = cycle * 4
        for offset, chord_name in enumerate(PROGRESSION):
            bar = start_bar + offset
            if bar >= BARS:
                break
            if cycle == 4 and offset == 3:
                continue
            t0 = bar * BAR
            for position, note, length in MELODY[chord_name]:
                add_event(
                    piano,
                    t0 + position * BEAT,
                    length * BEAT * 1.15,
                    felt_piano_synth(midi_hz(note)),
                    0.095 if cycle != 3 else 0.085,
                )
                if cycle == 2 and position >= 2.0:
                    add_event(
                        bell,
                        t0 + position * BEAT + 0.12,
                        length * BEAT,
                        bell_synth(midi_hz(note + 12)),
                        0.018,
                    )
                if cycle == 3 and offset in (0, 2):
                    add_event(
                        bell,
                        t0 + min(position + 0.75, 2.75) * BEAT,
                        1.25 * BEAT,
                        bell_synth(midi_hz(note + 12)),
                        0.012,
                    )

    # A quiet air bed and long room create space without adding rhythm.
    add_event(air, 0.0, DURATION, air_synth(SEED + 7), 0.026)
    air = apply_filter(air, "highpass", 420.0)
    air = apply_filter(air, "lowpass", 4800.0)
    piano = apply_filter(piano, "lowpass", 7200.0)
    arp = apply_filter(arp, "lowpass", 6200.0)
    bell = apply_filter(bell, "highpass", 550.0)
    bell = apply_filter(bell, "lowpass", 10_000.0)
    pad = apply_filter(pad, "lowpass", 3600.0)
    bass = apply_filter(bass, "lowpass", 600.0)

    mix = np.zeros((SAMPLE_COUNT, 2), dtype=np.float32)
    panned_add(mix, piano, 0.03, 1.00)
    panned_add(mix, bell, 0.48, 0.78)
    panned_add(mix, arp, -0.35, 0.86)
    panned_add(mix, pad, 0.08, 1.0)
    panned_add(mix, bass, 0.0, 1.0)
    panned_add(mix, air, -0.62, 0.24)
    panned_add(mix, air[::-1], 0.62, 0.13)

    # Two soft bell echoes give the menu a floating, unhurried tail.
    echo_1 = np.zeros_like(bell)
    delay_1 = int(round(0.75 * BEAT * SR))
    echo_1[delay_1:] = bell[:-delay_1] * 0.24
    panned_add(mix, apply_filter(echo_1, "lowpass", 7000.0), -0.62, 0.72)

    echo_2 = np.zeros_like(bell)
    delay_2 = int(round(1.75 * BEAT * SR))
    echo_2[delay_2:] = bell[:-delay_2] * 0.13
    panned_add(mix, apply_filter(echo_2, "lowpass", 6500.0), 0.70, 0.62)

    # Long, softly darkened room.
    send = piano * 0.58 + bell * 0.72 + arp * 0.20 + pad * 0.30
    ir_t = np.arange(int(2.25 * SR), dtype=np.float32) / SR
    predelay = int(0.035 * SR)
    ir_noise = RNG.standard_normal(len(ir_t) + predelay).astype(np.float32)
    ir_noise[:predelay] = 0.0
    ir = ir_noise[predelay:] * np.exp(-ir_t / 0.72)
    ir = apply_filter(ir, "lowpass", 4600.0)
    ir[0] += 0.30
    ir /= np.sqrt(np.sum(ir * ir))
    reverb = fftconvolve(send, ir, mode="full")[:SAMPLE_COUNT].astype(np.float32)
    reverb = apply_filter(reverb, "highpass", 160.0)
    panned_add(mix, reverb, 0.18, 0.30)

    mix -= np.mean(mix, axis=0, keepdims=True, dtype=np.float64).astype(np.float32)
    sos_hp = butter(2, 27.0 / (SR / 2.0), btype="highpass", output="sos")
    mix = sosfilt(sos_hp, mix, axis=0).astype(np.float32, copy=False)
    mix = np.tanh(mix * 0.72) / 0.72
    mix = normalize(mix, 0.72)

    return mix, {
        "title": "吞噬之蛇 · 主菜单「静候」",
        "purpose": "main menu background music",
        "bpm": BPM,
        "time_signature": "4/4",
        "bars": BARS,
        "duration_seconds": round(DURATION, 3),
        "key": "F major with gentle major-seventh color",
        "progression": PROGRESSION,
        "mood": "calm, warm, spacious, low-distraction",
        "instrumentation": [
            "soft felt-piano lead",
            "quiet felt-piano arpeggio",
            "warm analog-style pad",
            "soft sub bass",
            "glass bell accents",
            "air texture",
            "long room reverb",
        ],
        "sample_rate": SR,
        "channels": 2,
        "seed": SEED,
    }


def faded_version(mix: np.ndarray) -> np.ndarray:
    out = mix.copy()
    fade_in = int(0.55 * SR)
    out[:fade_in] *= np.sin(np.linspace(0.0, np.pi / 2.0, fade_in, dtype=np.float32))[:, None]
    fade_out = int(1.35 * SR)
    out[-fade_out:] *= np.cos(
        np.linspace(0.0, np.pi / 2.0, fade_out, dtype=np.float32)
    )[:, None]
    out[-1] = 0.0
    return normalize(out, 0.35)


def seamless_version(mix: np.ndarray, crossfade_sec: float = 0.80) -> np.ndarray:
    count = int(round(crossfade_sec * SR))
    length = SAMPLE_COUNT - count
    out = mix[:length].copy()
    head = mix[:count]
    tail = mix[-count:]
    u = np.linspace(0.0, 1.0, count, dtype=np.float32)[:, None]
    out[:count] = tail * np.cos(u * np.pi / 2.0) + head * np.sin(u * np.pi / 2.0)

    edge = 64
    out[:edge] *= np.sin(np.linspace(0.0, np.pi / 2.0, edge, dtype=np.float32))[:, None]
    out[-edge:] *= np.sin(np.linspace(np.pi / 2.0, 0.0, edge, dtype=np.float32))[:, None]
    return normalize(out, 0.35)


def to_pcm16(data: np.ndarray) -> np.ndarray:
    return np.clip(data, -1.0, 1.0) * 32767.0


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    mix, metadata = render()
    faded = faded_version(mix)
    seamless = seamless_version(mix)

    faded_path = OUT_DIR / "吞噬之蛇_主菜单_静候_60s_柔和循环.wav"
    seamless_path = OUT_DIR / "吞噬之蛇_主菜单_静候_59.2s_无缝循环.wav"
    wavfile.write(faded_path, SR, to_pcm16(faded).astype(np.int16))
    wavfile.write(seamless_path, SR, to_pcm16(seamless).astype(np.int16))

    metadata["loop_notes"] = {
        "soft_loop": {
            "file": faded_path.name,
            "duration_seconds": 60.0,
            "use": "Play the whole file in a loop; the short soft fade at each end gives a gentle breath.",
        },
        "seamless_loop": {
            "file": seamless_path.name,
            "duration_seconds": 59.2,
            "crossfade_seconds": 0.8,
            "use": "Recommended for the main menu; loop the whole file directly with no audible seam.",
        },
    }
    metadata_path = OUT_DIR / "吞噬之蛇_主菜单_静候_音乐说明.json"
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"soft: {faded_path} ({len(faded) / SR:.3f}s)")
    print(f"seamless: {seamless_path} ({len(seamless) / SR:.3f}s)")
    print(f"meta: {metadata_path}")


if __name__ == "__main__":
    main()
