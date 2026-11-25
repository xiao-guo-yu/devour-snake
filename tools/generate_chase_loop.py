from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt


# 吞噬之蛇: a deterministic, locally synthesized 60-second chase loop.
SR = 44_100
BPM = 120
BEAT = 60.0 / BPM
BAR = 4.0 * BEAT
BARS = 30
DURATION = BARS * BAR
SAMPLE_COUNT = int(round(SR * DURATION))
SEED = 20_261_120

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "audio" / "music"

RNG = np.random.default_rng(SEED)


def midi_hz(note: float) -> float:
    return 440.0 * (2.0 ** ((note - 69.0) / 12.0))


CHORDS = {
    "Am": np.array([57, 60, 64], dtype=np.float32),
    "F": np.array([53, 57, 60], dtype=np.float32),
    "C": np.array([48, 52, 55], dtype=np.float32),
    "G": np.array([55, 59, 62], dtype=np.float32),
    "Dm": np.array([50, 53, 57], dtype=np.float32),
    "Bb": np.array([46, 50, 53], dtype=np.float32),
    "E": np.array([52, 56, 59], dtype=np.float32),
}


A_MOTIF = {
    "Am": [(0.00, 69, 0.65), (0.75, 76, 0.45), (1.50, 81, 0.45),
           (2.00, 79, 0.60), (2.75, 76, 0.25), (3.00, 74, 0.45),
           (3.50, 72, 0.35)],
    "F": [(0.00, 65, 0.65), (0.75, 72, 0.45), (1.50, 69, 0.45),
          (2.00, 72, 0.60), (2.50, 76, 0.35), (3.00, 77, 0.60),
          (3.50, 76, 0.35)],
    "C": [(0.00, 72, 0.65), (0.75, 67, 0.40), (1.50, 79, 0.45),
          (2.00, 76, 0.60), (2.75, 79, 0.25), (3.00, 84, 0.60),
          (3.50, 83, 0.35)],
    "G": [(0.00, 71, 0.65), (0.50, 74, 0.35), (1.50, 79, 0.45),
          (2.00, 77, 0.60), (2.50, 74, 0.35), (3.00, 71, 0.45),
          (3.50, 74, 0.35)],
}


B_MOTIF = {
    "Dm": [(0.00, 74, 0.70), (0.75, 77, 0.35), (1.00, 81, 0.45),
           (1.75, 77, 0.35), (2.00, 74, 0.55), (2.50, 81, 0.35),
           (3.00, 84, 0.55), (3.50, 81, 0.35)],
    "Bb": [(0.00, 70, 0.70), (0.75, 74, 0.35), (1.00, 77, 0.45),
           (1.75, 74, 0.35), (2.00, 70, 0.55), (2.50, 77, 0.35),
           (3.00, 82, 0.55), (3.50, 77, 0.35)],
    "F": [(0.00, 77, 0.65), (0.50, 81, 0.30), (0.75, 84, 0.45),
          (1.50, 81, 0.35), (2.00, 77, 0.55), (2.50, 84, 0.35),
          (3.00, 83, 0.50), (3.50, 81, 0.35)],
    "E": [(0.00, 76, 0.65), (0.50, 80, 0.30), (0.75, 83, 0.45),
          (1.50, 80, 0.35), (2.00, 76, 0.55), (2.50, 83, 0.35),
          (3.00, 87, 0.50), (3.50, 83, 0.35)],
}


def track() -> np.ndarray:
    return np.zeros(SAMPLE_COUNT, dtype=np.float32)


def add_event(
    target: np.ndarray,
    start_sec: float,
    duration_sec: float,
    synth,
    amp: float,
) -> None:
    start = max(0, int(round(start_sec * SR)))
    if start >= SAMPLE_COUNT:
        return
    count = min(SAMPLE_COUNT - start, int(round(duration_sec * SR)))
    if count <= 1:
        return
    t = np.arange(count, dtype=np.float32) / SR
    wave = synth(t, count / SR).astype(np.float32, copy=False)
    attack = min(max(1, int(0.0025 * SR)), max(1, count // 5))
    release = min(max(1, int(0.018 * SR)), max(1, count // 3))
    env = np.ones(count, dtype=np.float32)
    env[:attack] *= np.linspace(0.0, 1.0, attack, dtype=np.float32)
    env[-release:] *= np.linspace(1.0, 0.0, release, dtype=np.float32) ** 0.8
    target[start:start + count] += wave * env * amp


def pluck_synth(freq: float):
    def synth(t: np.ndarray, _duration: float) -> np.ndarray:
        vibrato = 1.0 + 0.0035 * np.sin(2.0 * np.pi * 5.2 * t)
        phase = 2.0 * np.pi * freq * t * vibrato
        body = (
            np.sin(phase)
            + 0.24 * np.sin(2.0 * phase + 0.18)
            + 0.10 * np.sin(3.0 * phase + 0.55)
        )
        return np.tanh(1.15 * body) * np.exp(-t / 0.23)
    return synth


def bass_synth(freq: float):
    def synth(t: np.ndarray, _duration: float) -> np.ndarray:
        phase = 2.0 * np.pi * freq * t
        body = (
            np.sin(phase)
            + 0.34 * np.sin(2.0 * phase)
            + 0.10 * np.sin(3.0 * phase)
        )
        return np.tanh(1.35 * body) * np.exp(-t / 0.19)
    return synth


def blip_synth(freq: float):
    def synth(t: np.ndarray, _duration: float) -> np.ndarray:
        phase = 2.0 * np.pi * freq * t
        body = np.sin(phase) + 0.24 * np.sin(2.0 * phase + 0.8)
        return body * np.exp(-t / 0.065)
    return synth


def pad_synth(freq: float, detune_cents: float):
    detune = 2.0 ** (detune_cents / 1200.0)

    def synth(t: np.ndarray, duration: float) -> np.ndarray:
        phase = 2.0 * np.pi * freq * detune * t
        body = (
            np.sin(phase)
            + 0.26 * np.sin(0.5 * phase + 0.4)
            + 0.09 * np.sin(2.0 * phase + 0.1)
        )
        attack = np.minimum(t / 0.13, 1.0)
        release = np.minimum(np.maximum(duration - t, 0.0) / 0.32, 1.0)
        return body * attack * release
    return synth


def stab_synth(freq: float):
    def synth(t: np.ndarray, _duration: float) -> np.ndarray:
        phase = 2.0 * np.pi * freq * t
        body = np.sin(phase) + 0.34 * np.sin(2.0 * phase + 0.2)
        gate = np.exp(-t / 0.045)
        return np.tanh(1.45 * body) * gate
    return synth


def kick_synth(t: np.ndarray, _duration: float) -> np.ndarray:
    freq = 47.0 + 105.0 * np.exp(-t / 0.028)
    phase = 2.0 * np.pi * np.cumsum(freq) / SR
    click = RNG.standard_normal(len(t)).astype(np.float32) * np.exp(-t / 0.005)
    return (0.92 * np.sin(phase) + 0.10 * click) * np.exp(-t / 0.095)


def snare_synth(t: np.ndarray, _duration: float) -> np.ndarray:
    noise = RNG.standard_normal(len(t)).astype(np.float32)
    body = np.sin(2.0 * np.pi * 185.0 * t) * 0.28
    return (noise + body) * np.exp(-t / 0.085)


def hat_synth(t: np.ndarray, _duration: float) -> np.ndarray:
    noise = RNG.standard_normal(len(t)).astype(np.float32)
    return noise * np.exp(-t / 0.022)


def tom_synth(freq: float):
    def synth(t: np.ndarray, _duration: float) -> np.ndarray:
        swept = freq * (1.0 + 0.38 * np.exp(-t / 0.045))
        phase = 2.0 * np.pi * np.cumsum(swept) / SR
        return np.sin(phase) * np.exp(-t / 0.12)
    return synth


def riser_synth(t: np.ndarray, duration: float) -> np.ndarray:
    norm = np.clip(t / max(duration, 0.001), 0.0, 1.0)
    sweep = 260.0 * (2.0 ** (2.1 * norm))
    phase = 2.0 * np.pi * np.cumsum(sweep) / SR
    noise = RNG.standard_normal(len(t)).astype(np.float32)
    rise = norm ** 1.8
    fall = np.minimum((duration - t) / 0.025, 1.0).clip(0.0, 1.0)
    return (0.38 * np.sin(phase) + 0.18 * noise) * rise * fall


def add_note(target: np.ndarray, start_sec: float, note: float, duration: float, amp: float) -> None:
    add_event(target, start_sec, duration, pluck_synth(midi_hz(note)), amp)


def add_kick(target: np.ndarray, start_sec: float, amp: float = 0.60) -> None:
    add_event(target, start_sec, 0.22, kick_synth, amp)


def add_snare(target: np.ndarray, start_sec: float, amp: float = 0.27) -> None:
    add_event(target, start_sec, 0.19, snare_synth, amp)


def add_hat(target: np.ndarray, start_sec: float, amp: float = 0.10) -> None:
    add_event(target, start_sec, 0.075, hat_synth, amp)


def apply_filter(data: np.ndarray, kind: str, cutoff: float, order: int = 2) -> np.ndarray:
    sos = butter(order, cutoff / (SR / 2.0), btype=kind, output="sos")
    return sosfilt(sos, data).astype(np.float32, copy=False)


def panned_add(mix: np.ndarray, mono: np.ndarray, pan: float, gain: float) -> None:
    pan = float(np.clip(pan, -1.0, 1.0))
    angle = (pan + 1.0) * np.pi / 4.0
    mix[:, 0] += mono * (np.cos(angle) * gain)
    mix[:, 1] += mono * (np.sin(angle) * gain)


def chord_for_bar(bar: int) -> str:
    if bar == 0:
        return "Am"
    if bar == 1:
        return "G"
    if 2 <= bar <= 9:
        return ["Am", "F", "C", "G"][(bar - 2) % 4]
    if 10 <= bar <= 17:
        return ["Dm", "Bb", "F", "E"][(bar - 10) % 4]
    if 18 <= bar <= 25:
        return ["Am", "F", "C", "G"][(bar - 18) % 4]
    return ["Am", "F", "C", "G"][(bar - 26) % 4]


def render() -> tuple[np.ndarray, dict]:
    lead = track()
    lead_double = track()
    arp = track()
    bass = track()
    pad = track()
    stabs = track()
    kick = track()
    snare = track()
    hats_l = track()
    hats_r = track()
    toms = track()
    riser = track()
    percussion = track()

    # Tonal bed and bass.
    for bar in range(BARS):
        t0 = bar * BAR
        chord_name = chord_for_bar(bar)
        notes = CHORDS[chord_name]

        for index, note in enumerate(notes):
            add_event(
                pad,
                t0,
                BAR * 0.94,
                pad_synth(midi_hz(note - 12), -7.0 if index % 2 else 7.0),
                0.018,
            )

        bass_pattern = [0, 0, 7, 0, 12, 7, 0, 7]
        root = notes[0] - 12
        for step, interval in enumerate(bass_pattern):
            add_event(
                bass,
                t0 + step * BEAT * 0.5,
                0.20,
                bass_synth(midi_hz(root + interval)),
                0.115 if step not in (0, 4) else 0.135,
            )

    # Lead melody: A, tense B, A with octave support, then a fading close.
    for bar in list(range(2, 10)) + list(range(18, 30)):
        t0 = bar * BAR
        chord_name = chord_for_bar(bar)
        for position, note, length in A_MOTIF[chord_name]:
            add_note(lead, t0 + position * BEAT, note, length * BEAT, 0.115)
            if 18 <= bar <= 25 and note >= 72:
                add_note(lead_double, t0 + position * BEAT, note - 12, length * BEAT, 0.045)

    for bar in range(10, 18):
        t0 = bar * BAR
        chord_name = chord_for_bar(bar)
        for position, note, length in B_MOTIF[chord_name]:
            add_note(lead, t0 + position * BEAT, note, length * BEAT, 0.125)
            add_note(lead_double, t0 + position * BEAT, note - 12, length * BEAT, 0.035)

    # A sparse opening hook and octave arpeggios keep the pulse moving.
    for bar in (0, 1):
        t0 = bar * BAR
        notes = CHORDS[chord_for_bar(bar)]
        pattern = [0, 1, 2, 1, 0, 1, 2, 1]
        for step, chord_index in enumerate(pattern):
            add_event(
                arp,
                t0 + step * BEAT * 0.5,
                0.15,
                blip_synth(midi_hz(notes[chord_index] + 12)),
                0.035,
            )

    for bar in range(10, 26):
        t0 = bar * BAR
        notes = CHORDS[chord_for_bar(bar)]
        pattern = [0, 1, 2, 1, 0, 2, 1, 2]
        for step, chord_index in enumerate(pattern):
            add_event(
                arp,
                t0 + step * BEAT * 0.5,
                0.12,
                blip_synth(midi_hz(notes[chord_index] + 12)),
                0.027,
            )

    # Short chromatic chord stabs carry the tense, urgent side.
    for bar in range(10, 18):
        t0 = bar * BAR
        notes = CHORDS[chord_for_bar(bar)]
        for beat in (0.0, 2.5):
            for note in notes:
                add_event(stabs, t0 + beat * BEAT, 0.15, stab_synth(midi_hz(note + 12)), 0.022)
    for bar in range(18, 26, 2):
        t0 = bar * BAR
        for note in CHORDS[chord_for_bar(bar)]:
            add_event(stabs, t0, 0.13, stab_synth(midi_hz(note + 12)), 0.014)

    # Drums: lighter start, syncopated A groove, denser B groove.
    for bar in range(BARS):
        t0 = bar * BAR

        if bar < 2:
            kick_positions = [0.0, 1.0, 2.0, 3.0]
            snare_positions = [] if bar == 0 else [1.0, 3.0]
        elif 10 <= bar <= 17:
            kick_positions = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5]
            snare_positions = [1.0, 2.5, 3.0]
        else:
            kick_positions = [0.0, 0.75, 1.5, 2.0, 2.75, 3.25]
            snare_positions = [1.0, 3.0]

        for beat in kick_positions:
            add_kick(kick, t0 + beat * BEAT, 0.66 if beat in (0.0, 2.0) else 0.50)

        for beat in snare_positions:
            add_snare(snare, t0 + beat * BEAT, 0.30)
        if bar >= 2:
            add_snare(snare, t0 + 3.75 * BEAT, 0.095)
            add_snare(percussion, t0 + 0.75 * BEAT, 0.035)

        if bar < 2:
            hat_step = 0.5
            hat_count = 8
        else:
            hat_step = 0.25
            hat_count = 16

        for step in range(hat_count):
            beat = step * hat_step
            accent = 1.15 if abs(beat - round(beat)) < 1e-6 else 0.74
            if 10 <= bar <= 17 and step % 4 == 2:
                accent *= 0.82
            target = hats_l if step % 2 == 0 else hats_r
            add_hat(target, t0 + beat * BEAT, 0.105 * accent)

        # A short 32nd-note rattle at phrase endings.
        if bar in (9, 17, 25) and bar < BARS - 1:
            for step in range(8):
                add_hat(
                    hats_l if step % 2 == 0 else hats_r,
                    t0 + 3.5 * BEAT + step * BEAT / 8.0,
                    0.085 - step * 0.004,
                )

    for bar in (8, 16, 24):
        t0 = bar * BAR
        for step, note in enumerate((110, 92, 78, 66)):
            add_event(toms, t0 + (3.0 + step * 0.25) * BEAT, 0.22, tom_synth(note), 0.16)

    for bar in (9, 17, 25):
        add_event(riser, bar * BAR + 2.25 * BEAT, 1.75 * BEAT, riser_synth, 0.10)

    # Tight tone shaping.
    bass = apply_filter(bass, "lowpass", 4800.0)
    pad = apply_filter(pad, "lowpass", 3200.0)
    pad = apply_filter(pad, "highpass", 90.0)
    stabs = apply_filter(stabs, "highpass", 380.0)
    hats_l = apply_filter(hats_l, "highpass", 5200.0, order=3)
    hats_r = apply_filter(hats_r, "highpass", 5200.0, order=3)
    snare = apply_filter(snare, "highpass", 150.0)
    riser = apply_filter(riser, "highpass", 450.0)

    mix = np.zeros((SAMPLE_COUNT, 2), dtype=np.float32)

    # Dry stereo placement.
    panned_add(mix, lead, 0.03, 1.00)
    panned_add(mix, lead_double, -0.18, 0.55)
    panned_add(mix, arp, -0.42, 0.72)
    panned_add(mix, bass, 0.00, 1.00)
    panned_add(mix, pad, 0.12, 1.00)
    panned_add(mix, stabs, 0.32, 0.88)
    panned_add(mix, kick, 0.00, 1.00)
    panned_add(mix, snare, -0.04, 1.00)
    panned_add(mix, hats_l, -0.38, 0.82)
    panned_add(mix, hats_r, 0.42, 0.82)
    panned_add(mix, toms, 0.10, 0.90)
    panned_add(mix, riser, -0.12, 0.78)
    panned_add(mix, percussion, 0.36, 0.72)

    # A dotted-eighth echo widens the lead without blurring the rhythm.
    delay = int(round(0.75 * BEAT * SR))
    echo = np.zeros_like(lead)
    echo[delay:] = lead[:-delay] * 0.19
    echo = apply_filter(echo, "highpass", 280.0)
    panned_add(mix, echo, 0.60, 0.62)

    # Small synthetic room send for polish.
    send = (
        lead * 0.42
        + lead_double * 0.22
        + arp * 0.22
        + pad * 0.34
        + stabs * 0.25
        + snare * 0.10
    )
    ir_t = np.arange(int(0.72 * SR), dtype=np.float32) / SR
    ir_noise = RNG.standard_normal(len(ir_t)).astype(np.float32)
    ir = ir_noise * np.exp(-ir_t / 0.18)
    ir = apply_filter(ir, "lowpass", 5200.0)
    ir[0] += 0.45
    ir /= np.sqrt(np.sum(ir * ir))
    reverb = fftconvolve(send, ir, mode="full")[:SAMPLE_COUNT].astype(np.float32)
    reverb = apply_filter(reverb, "highpass", 180.0)
    panned_add(mix, reverb, -0.20, 0.20)

    # Remove DC, gently saturate the bus, and normalize with headroom.
    mix -= np.mean(mix, axis=0, keepdims=True, dtype=np.float64).astype(np.float32)
    sos_hp = butter(2, 24.0 / (SR / 2.0), btype="highpass", output="sos")
    mix = sosfilt(sos_hp, mix, axis=0).astype(np.float32, copy=False)
    peak = float(np.max(np.abs(mix)))
    mix /= max(peak, 1e-9)
    mix = np.tanh(mix * 1.12) / np.tanh(1.12)
    mix *= 0.887
    peak = float(np.max(np.abs(mix)))
    mix *= 0.891 / max(peak, 1e-9)

    return mix.astype(np.float32), {
        "title": "吞噬之蛇 · 急速回环",
        "bpm": BPM,
        "beats_per_bar": 4,
        "bars": BARS,
        "key": "A minor",
        "sections": [
            {"name": "intro", "bars": "1-2", "seconds": "0-4"},
            {"name": "A1", "bars": "3-10", "seconds": "4-20"},
            {"name": "B tension", "bars": "11-18", "seconds": "20-36"},
            {"name": "A2 full", "bars": "19-26", "seconds": "36-52"},
            {"name": "outro fade", "bars": "27-30", "seconds": "52-60"},
        ],
        "progression_A": ["Am", "F", "C", "G"],
        "progression_B": ["Dm", "Bb", "F", "E"],
        "instrumentation": [
            "bright plucked lead",
            "octave double",
            "staccato bass",
            "soft chord bed",
            "tense chord stabs",
            "kick",
            "snare",
            "16th-note hi-hats",
            "tom fills",
            "short tension risers",
        ],
        "sample_rate": SR,
        "channels": 2,
        "seed": SEED,
    }


def normalize(data: np.ndarray, peak_target: float = 0.891) -> np.ndarray:
    peak = float(np.max(np.abs(data)))
    return (data * (peak_target / max(peak, 1e-9))).astype(np.float32)


def fade_loop_version(mix: np.ndarray) -> np.ndarray:
    out = mix.copy()
    fade_in_n = int(0.22 * SR)
    out[:fade_in_n] *= np.sin(np.linspace(0.0, np.pi / 2.0, fade_in_n, dtype=np.float32))[:, None]

    fade_start = int(57.0 * SR)
    fade_n = SAMPLE_COUNT - fade_start
    u = np.linspace(0.0, 1.0, fade_n, dtype=np.float32)
    gain = (0.5 + 0.5 * np.cos(np.pi * u))[:, None]
    out[fade_start:] *= gain
    out[-1] = 0.0
    return normalize(out, 0.87)


def crossfade_loop_version(mix: np.ndarray, crossfade_sec: float = 0.80) -> np.ndarray:
    # The final 0.8 s wraps into the opening so the track's last sample
    # naturally hands control back to its first sample.
    count = int(round(crossfade_sec * SR))
    length = SAMPLE_COUNT - count
    out = mix[:length].copy()
    head = mix[:count].copy()
    tail = mix[-count:].copy()
    u = np.linspace(0.0, 1.0, count, dtype=np.float32)[:, None]
    equal_power_tail = np.cos(u * np.pi / 2.0)
    equal_power_head = np.sin(u * np.pi / 2.0)
    out[:count] = tail * equal_power_tail + head * equal_power_head
    edge = 64
    out[:edge] *= np.sin(np.linspace(0.0, np.pi / 2.0, edge, dtype=np.float32))[:, None]
    out[-edge:] *= np.sin(np.linspace(np.pi / 2.0, 0.0, edge, dtype=np.float32))[:, None]
    return normalize(out, 0.87)


def to_pcm16(data: np.ndarray) -> np.ndarray:
    return np.clip(data, -1.0, 1.0) * 32767.0


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    raw, metadata = render()
    faded = fade_loop_version(raw)
    seamless = crossfade_loop_version(raw, 0.80)

    fade_path = OUT_DIR / "吞噬之蛇_急速追逐_60s_淡出循环.wav"
    loop_path = OUT_DIR / "吞噬之蛇_急速追逐_59.2s_无缝循环.wav"
    wavfile.write(fade_path, SR, to_pcm16(faded).astype(np.int16))
    wavfile.write(loop_path, SR, to_pcm16(seamless).astype(np.int16))

    metadata["loop_notes"] = {
        "fade_version": {
            "file": fade_path.name,
            "duration_seconds": round(SAMPLE_COUNT / SR, 3),
            "fade_start_seconds": 57.0,
            "use": "Play the whole file in a loop; the 3-second fade resets cleanly to the quiet opening.",
        },
        "seamless_version": {
            "file": loop_path.name,
            "duration_seconds": round(len(seamless) / SR, 3),
            "crossfade_seconds": 0.8,
            "use": "Loop the whole file directly; the final 0.8 seconds are crossfaded into the opening.",
        },
    }
    metadata_path = OUT_DIR / "吞噬之蛇_急速追逐_音乐说明.json"
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"fade: {fade_path} ({len(faded) / SR:.3f}s)")
    print(f"loop: {loop_path} ({len(seamless) / SR:.3f}s)")
    print(f"meta: {metadata_path}")


if __name__ == "__main__":
    main()
