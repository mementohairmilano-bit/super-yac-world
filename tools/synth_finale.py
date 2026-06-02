#!/usr/bin/env python3
# Sintetizzatore per la SEQUENZA FINALE (chiusura.md, Beat 7).
# Output: WAV 16-bit mono 22050Hz. Autonomo, rilanciabile.
#   musica → assets/audio/music/ : finale_theme  (ripresa CALDA del tema, in maggiore, che cresce)
#   sfx    → assets/audio/sfx/    : letter_get (lettera GRINTA raccolta), chain_break (catena spezzata)
import wave, math, array, os

SR = 22050
BASE = "/Users/antoniomaniscalco/Desktop/YAC/Super Yac World/assets/audio"
OUT_M = os.path.join(BASE, "music")
OUT_S = os.path.join(BASE, "sfx")

NOTES = {'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6, 'E': -5,
         'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1, 'Ab': -1, 'A': 0,
         'A#': 1, 'Bb': 1, 'B': 2}

def f(n):
    if n is None: return 0.0
    name = n[:-1]; octv = int(n[-1])
    return 440.0 * 2 ** ((NOTES[name] + (octv - 4) * 12) / 12.0)

def adsr(t, dur, a, d, s, r):
    if t < a: return t / a
    if t < a + d: return 1 - (1 - s) * (t - a) / d
    if t < dur - r: return s
    if t < dur: return s * (1 - (t - (dur - r)) / r)
    return 0.0

def wave_val(kind, ph, duty=0.5):
    p = ph % 1.0
    if kind == 'square': return 1.0 if p < duty else -1.0
    if kind == 'tri': return 2 * abs(2 * p - 1) - 1
    if kind == 'saw': return 2 * p - 1
    if kind == 'sine': return math.sin(2 * math.pi * p)
    return 0.0

def note(buf, start, dur, freq, amp, kind='square', duty=0.5,
         a=0.005, d=0.05, s=0.7, r=0.06, detune=0.0, vib=0.0):
    if freq <= 0: return
    i0 = int(start * SR); n = int(dur * SR)
    for i in range(n):
        t = i / SR
        e = adsr(t, dur, a, d, s, r)
        if e <= 0: continue
        fr = freq * (1 + vib * math.sin(2 * math.pi * 5 * t) * 0.006)
        v = wave_val(kind, fr * t, duty)
        if detune:
            v = 0.5 * v + 0.5 * wave_val(kind, fr * (1 + detune) * t, duty)
        idx = i0 + i
        if 0 <= idx < len(buf): buf[idx] += amp * e * v

def chord(buf, start, dur, names, amp, kind='saw', detune=0.005, a=0.1, r=0.3):
    for nm in names:
        note(buf, start, dur, f(nm), amp / max(1, len(names)) * 1.3, kind,
             0.5, a, 0.12, 0.85, r, detune=detune)

def kick(buf, start, amp=0.8):
    n = int(0.12 * SR); i0 = int(start * SR)
    for i in range(n):
        t = i / SR; e = math.exp(-t * 30)
        fr = 120 * math.exp(-t * 30) + 45
        v = math.sin(2 * math.pi * fr * t)
        idx = i0 + i
        if 0 <= idx < len(buf): buf[idx] += amp * e * v

def hat(buf, start, amp=0.16, dur=0.03, seed=1):
    n = int(dur * SR); i0 = int(start * SR); x = seed * 99991 + 7
    for i in range(n):
        t = i / SR; e = math.exp(-t * 120)
        x = (1103515245 * x + 12345) & 0x7fffffff
        v = (x / 0x3fffffff) - 1.0
        idx = i0 + i
        if 0 <= idx < len(buf): buf[idx] += amp * e * v

def finalize(buf, name, fade_in=0.01, fade_out=0.04):
    N = len(buf)
    fi = int(fade_in * SR); fo = int(fade_out * SR)
    for i in range(fi): buf[i] *= i / fi
    for i in range(fo): buf[N - 1 - i] *= i / fo
    peak = max((abs(x) for x in buf), default=1.0) or 1.0
    g = 0.80 / peak
    data = array.array('h', (max(-32767, min(32767, int(x * g * 32767))) for x in buf))
    with wave.open(os.path.join(OUT_M, name), 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(name, '%.2fs' % (N / SR), 'peak=%.2f' % peak)

# ===================== FINALE — tema caldo in DO maggiore, uplifting =====================
# Progressione I–V–vi–IV (C–G–Am–F) ×2: la più "alba dopo la tempesta". Lead brillante,
# pad caldi (sine/tri), batteria morbida che entra nel secondo giro → senso di crescita.
def make_finale():
    bpm = 116; b = 60 / bpm; bars = 8
    buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR))
    prog = [['C3', 'E3', 'G3'], ['G2', 'B2', 'D3'], ['A2', 'C3', 'E3'], ['F2', 'A2', 'C3']]
    bass = ['C2', 'G1', 'A1', 'F1']
    # melodia calda (due frasi: la seconda sale più in alto = crescita)
    lead = {0: 'G4', 1.5: 'A4', 2: 'C5', 3: 'B4', 4: 'G4', 5: 'E4', 6: 'G4', 7: 'D4',
            8: 'E4', 9.5: 'G4', 10: 'A4', 11: 'C5', 12: 'D5', 13: 'C5', 14: 'A4', 15: 'G4',
            16: 'C5', 17.5: 'D5', 18: 'E5', 19: 'D5', 20: 'C5', 21: 'G4', 22: 'C5', 23: 'B4',
            24: 'A4', 25: 'C5', 26: 'E5', 27: 'D5', 28: 'G5', 29: 'E5', 30: 'C5', 31: 'G4'}
    for bar in range(bars):
        t0 = bar * 4 * b; ch = prog[bar % 4]
        amp = 0.10 if bar < 4 else 0.13      # il secondo giro cresce
        chord(buf, t0, 4 * b * 0.98, ch, amp, 'saw', detune=0.006, a=0.12, r=0.4)
        # tappeto morbido (tri) un'ottava sopra
        chord(buf, t0, 4 * b * 0.98, [n[:-1] + str(int(n[-1]) + 1) for n in ch], amp * 0.55, 'tri', detune=0.004, a=0.2, r=0.5)
        # basso caldo che pulsa in croma
        for k in range(8):
            note(buf, t0 + k * 0.5 * b, 0.42 * b, f(bass[bar % 4]), 0.26, 'tri', a=0.01, d=0.1, s=0.7, r=0.08)
    # lead brillante (sine+tri, dolce)
    for beat, nm in lead.items():
        dur = 0.9 * b
        note(buf, beat * b, dur, f(nm), 0.22, 'tri', a=0.02, d=0.08, s=0.6, r=0.25, vib=1)
        note(buf, beat * b, dur, f(nm), 0.10, 'sine', a=0.02, d=0.08, s=0.6, r=0.25)
    # batteria morbida solo nel secondo giro (crescita)
    for bar in range(4, bars):
        t0 = bar * 4 * b
        for beat in range(4): kick(buf, t0 + beat * b, 0.6)
        for k in range(8): hat(buf, t0 + k * 0.5 * b, 0.12, seed=k + bar)
    # campanella finale luminosa sull'ultimo accordo (C maggiore alto)
    for j, nm in enumerate(['C5', 'E5', 'G5', 'C6']):
        note(buf, (bars - 1) * 4 * b + 3 * b + j * 0.12 * b, 0.6 * b, f(nm), 0.16, 'sine', a=0.01, d=0.1, s=0.5, r=0.4)
    finalize(buf, 'finale_theme.wav')

# ============================ SFX del finale ============================
def noise_gen(seed):
    x = seed & 0x7fffffff
    while True:
        x = (1103515245 * x + 12345) & 0x7fffffff
        yield (x / 0x3fffffff) - 1.0

def save_sfx(name, buf):
    peak = max((abs(v) for v in buf), default=1.0) or 1.0
    g = 0.85 / peak
    data = array.array('h', (max(-32767, min(32767, int(v * g * 32767))) for v in buf))
    with wave.open(os.path.join(OUT_S, name), 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(name, '%.2fs' % (len(buf) / SR))

def sq(ph, duty=0.5): return 1.0 if (ph % 1.0) < duty else -1.0

# Lettera GRINTA raccolta: arpeggio brillante ascendente (do-mi-sol-do), caldo e premiante
def letter_get():
    notes = [523.25, 659.25, 783.99, 1046.5]   # C5 E5 G5 C6
    seg = 0.075; n = int(len(notes) * seg * SR + 0.25 * SR)
    buf = array.array('d', [0.0] * n)
    for i in range(n):
        t = i / SR; idx = min(len(notes) - 1, int(t / seg)); fr = notes[idx]
        e = math.exp(-(t % seg) * 9) if t < len(notes) * seg else math.exp(-(t - len(notes) * seg) * 7)
        buf[i] = 0.6 * e * (0.5 * sq(fr * t, 0.5) + 0.5 * math.sin(2 * math.pi * fr * t))
    save_sfx('letter_get.wav', buf)

# Catena spezzata: SNAP metallico (rumore filtrato) + clang discendente di due toni detunati + coda
def chain_break():
    n = int(0.5 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(151); prev = 0.0
    for i in range(n):
        t = i / SR
        # snap iniziale: burst di rumore brillante
        nz = next(ng); prev = 0.3 * prev + 0.7 * nz
        snap = 0.7 * math.exp(-t * 40) * prev
        # clang metallico: due toni detunati che scendono
        fr = max(180, 900 - 1400 * t)
        clang = 0.45 * math.exp(-t * 6) * (math.sin(2 * math.pi * fr * t) + 0.6 * math.sin(2 * math.pi * fr * 1.5 * t))
        buf[i] = snap + clang
    save_sfx('chain_break.wav', buf)

make_finale()
letter_get(); chain_break()
print('done')
