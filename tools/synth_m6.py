#!/usr/bin/env python3
# Sintetizzatore Python puro per MUSICA + SFX dedicati del MONDO 6 "Big Beauty Tower" (FINALE).
# Output: WAV 16-bit mono 22050Hz. Autonomo (non tocca gli altri mondi). Rilanciabile.
#   musica → assets/audio/music/  : mondo6_plaza_loop, mondo6_foundations_loop, mondo6_ascent_loop, mondo6_boss_loop
#   sfx    → assets/audio/sfx/     : mask_absorb, phase_shift, core_hit
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

def chord(buf, start, dur, names, amp, kind='saw', detune=0.004, a=0.08, r=0.2):
    for nm in names:
        note(buf, start, dur, f(nm), amp / max(1, len(names)) * 1.3, kind,
             0.5, a, 0.1, 0.85, r, detune=detune)

def kick(buf, start, amp=0.9):
    n = int(0.12 * SR); i0 = int(start * SR)
    for i in range(n):
        t = i / SR; e = math.exp(-t * 30)
        fr = 120 * math.exp(-t * 30) + 45
        v = math.sin(2 * math.pi * fr * t)
        idx = i0 + i
        if 0 <= idx < len(buf): buf[idx] += amp * e * v

def hat(buf, start, amp=0.25, dur=0.03, seed=1):
    n = int(dur * SR); i0 = int(start * SR); x = seed * 99991 + 7
    for i in range(n):
        t = i / SR; e = math.exp(-t * 120)
        x = (1103515245 * x + 12345) & 0x7fffffff
        v = (x / 0x3fffffff) - 1.0
        idx = i0 + i
        if 0 <= idx < len(buf): buf[idx] += amp * e * v

def snare(buf, start, amp=0.5, seed=3):
    n = int(0.14 * SR); i0 = int(start * SR); x = seed * 31337 + 11
    for i in range(n):
        t = i / SR; e = math.exp(-t * 22)
        x = (1103515245 * x + 12345) & 0x7fffffff
        nz = (x / 0x3fffffff) - 1.0
        tn = math.sin(2 * math.pi * 190 * t)
        idx = i0 + i
        if 0 <= idx < len(buf): buf[idx] += amp * e * (0.7 * nz + 0.3 * tn)

def finalize(buf, name, fade_in=0.008, fade_out=0.03):
    N = len(buf)
    fi = int(fade_in * SR); fo = int(fade_out * SR)
    for i in range(fi): buf[i] *= i / fi
    for i in range(fo): buf[N - 1 - i] *= i / fo
    peak = max((abs(x) for x in buf), default=1.0) or 1.0
    g = 0.82 / peak
    data = array.array('h', (max(-32767, min(32767, int(x * g * 32767))) for x in buf))
    with wave.open(os.path.join(OUT_M, name), 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(name, '%.2fs' % (N / SR), 'peak=%.2f' % peak)

# =================== 6-1  Il Piazzale — dark gauntlet, notturno e cattivo ===================
def make_m6_plaza():
    bpm = 150; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['A1', 'A1', 'F1', 'E1']                       # Am pedale, cupo
    chs = [['A3', 'C4', 'E4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['E3', 'G#3', 'B3']]
    arp = [['A4', 'C5', 'E5', 'C5'], ['A4', 'C5', 'E5', 'C5'], ['F4', 'A4', 'C5', 'A4'], ['E4', 'G#4', 'B4', 'G#4']]
    for bar in range(bars):
        t0 = bar * 4 * b
        for k in range(16): note(buf, t0 + k * 0.25 * b, 0.2 * b, f(roots[bar]), 0.30, 'square', duty=0.22, a=0.003, r=0.03)
        chord(buf, t0, 4 * b, chs[bar], 0.10, 'saw', detune=0.01, a=0.03, r=0.12)
        for beat in range(4):
            for j, nm in enumerate(arp[bar]): note(buf, t0 + beat * b + j * 0.25 * b, 0.2 * b, f(nm), 0.16, 'square', a=0.003, r=0.03, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in range(4): kick(buf, t0 + beat * b, 0.82)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.44, seed=beat + bar * 3)
        for k in range(8): hat(buf, t0 + k * 0.5 * b, 0.14, seed=k + bar)
    finalize(buf, 'mondo6_plaza_loop.wav')

# =================== 6-2  Le Fondamenta — industriale, oppressivo, lento ===================
def make_m6_foundations():
    bpm = 96; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR))
    prog = [['A2', 'E3', 'A3'], ['A2', 'F3', 'C4'], ['D2', 'A2', 'D3'], ['E2', 'G#3', 'B3']]
    sub = ['A1', 'F1', 'D1', 'E1']
    mel = {0: 'E4', 2.5: 'C4', 5: 'A3', 7: 'B3', 8: 'D4', 10.5: 'A3', 13: 'B3', 15: 'C4'}
    for bar in range(bars):
        t0 = bar * 4 * b
        chord(buf, t0, 4 * b * 0.96, prog[bar], 0.11, 'saw', detune=0.012, a=0.5, r=0.6)
        note(buf, t0, 4 * b * 0.96, f(sub[bar]), 0.26, 'sine', a=0.3, d=0.2, s=0.85, r=0.5)  # drone
        for k in (0, 1, 2, 3): note(buf, t0 + k * b, 0.3 * b, f(sub[bar]), 0.22, 'square', duty=0.18, a=0.004, r=0.04)  # pulse motore
    for beat, nm in mel.items(): note(buf, beat * b, 1.1 * b, f(nm), 0.16, 'tri', a=0.05, d=0.2, s=0.5, r=0.4, vib=1)
    for bar in range(bars):
        kick(buf, bar * 4 * b, 0.74); kick(buf, bar * 4 * b + 2 * b, 0.66)
        for k in (1, 3): hat(buf, bar * 4 * b + k * b, 0.1, seed=k + bar)
    finalize(buf, 'mondo6_foundations_loop.wav', fade_out=0.06)

# =================== 6-3  L'Ascesa — climactica, drammatica, in crescita ===================
def make_m6_ascent():
    bpm = 154; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['A1', 'F1', 'G1', 'A1']
    chs = [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4']]
    arp = [['A4', 'C5', 'E5', 'A5'], ['F4', 'A4', 'C5', 'F5'], ['G4', 'B4', 'D5', 'G5'], ['A4', 'E5', 'C5', 'E5']]
    lead = {0: 'A4', 1: 'E5', 2: 'A5', 3: 'B5', 4: 'C6', 5: 'A5', 6: 'F5', 7: 'A5',
            8: 'G5', 9: 'D5', 10: 'B4', 11: 'D5', 12: 'E5', 13: 'A5', 14: 'C6', 15: 'E6'}
    for bar in range(bars):
        t0 = bar * 4 * b
        for k in range(16): note(buf, t0 + k * 0.25 * b, 0.22 * b, f(roots[bar]), 0.28, 'saw', duty=0.5, a=0.004, r=0.03, detune=0.014)
        chord(buf, t0, 4 * b, chs[bar], 0.10, 'saw', detune=0.008, a=0.03, r=0.12)
        for beat in range(4):
            for j, nm in enumerate(arp[bar]): note(buf, t0 + beat * b + j * 0.25 * b, 0.2 * b, f(nm), 0.12, 'square', a=0.003, r=0.04)
    for beat, nm in lead.items(): note(buf, beat * b, 0.45 * b, f(nm), 0.24, 'saw', a=0.008, d=0.05, s=0.6, r=0.07, detune=0.006, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in range(4): kick(buf, t0 + beat * b, 0.8)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.44, seed=beat + bar * 2)
        for k in range(8): hat(buf, t0 + k * 0.5 * b, 0.14, seed=k + bar)
    finalize(buf, 'mondo6_ascent_loop.wav')

# =================== Boss THE CONGLOMERATE — climax epico e dissonante ===================
def make_m6_boss():
    bpm = 176; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['A1', 'A1', 'A#1', 'G#1']                     # cromatismo minaccioso
    chs = [['A3', 'C4', 'D#4'], ['A3', 'C4', 'D#4'], ['A#3', 'C#4', 'E4'], ['G#3', 'B3', 'D4']]  # diminuiti/tritono
    lead = ['A4', 'D#5', 'A4', 'F5', 'E5', 'C5', 'A4', 'G#4',
            'A#4', 'E5', 'A#4', 'F#5', 'F5', 'C#5', 'A#4', 'A4']
    for bar in range(bars):
        t0 = bar * 4 * b
        note(buf, t0, 4 * b, f('A1'), 0.16, 'sine', a=0.1, d=0.3, s=0.8, r=0.4)   # pedale cupo "sistema"
        for k in range(16): note(buf, t0 + k * 0.25 * b, 0.2 * b, f(roots[bar]), 0.30, 'saw', duty=0.4, a=0.003, r=0.03, detune=0.016)
        chord(buf, t0, 4 * b, chs[bar], 0.09, 'saw', detune=0.012, a=0.02, r=0.1)
        for k in range(16):
            nm = lead[k] if bar % 2 == 0 else lead[(k + 8) % 16]
            note(buf, t0 + k * 0.25 * b, 0.2 * b, f(nm), 0.20, 'square', a=0.003, r=0.03, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in range(4): kick(buf, t0 + beat * b, 0.88)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.46, seed=beat + bar * 5)
        for k in range(16): hat(buf, t0 + k * 0.25 * b, 0.12, seed=k + bar * 2)
    finalize(buf, 'mondo6_boss_loop.wav')

# ============================ SFX dedicati Mondo 6 ============================
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

# The Conglomerate assorbe le maschere: risucchio cupo (tono che scende + whoosh inverso)
def mask_absorb():
    n = int(0.55 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(211); prev = 0.0
    for i in range(n):
        t = i / SR; e = math.exp(-t * 3.2)
        fr = 90 + 320 * (t / 0.55)                            # tono che SALE (risucchio verso il centro)
        tone = 0.5 * math.sin(2 * math.pi * fr * t)
        nz = next(ng); prev = 0.85 * prev + 0.15 * nz
        whoosh = 0.5 * (1 - math.exp(-t * 4)) * prev
        buf[i] = e * (tone + whoosh)
    save_sfx('mask_absorb.wav', buf)

# Cambio fase: stab di potenza (sweep che sale + impatto)
def phase_shift():
    n = int(0.42 * SR); buf = array.array('d', [0.0] * n)
    for i in range(n):
        t = i / SR; e = math.exp(-t * 5)
        fr = 180 + 900 * t                                    # sweep ascendente
        v = 0.5 * sq(fr * t, 0.5) + 0.4 * math.sin(2 * math.pi * fr * t)
        if t > 0.28: v += 0.6 * math.exp(-(t - 0.28) * 26) * math.sin(2 * math.pi * 70 * t)  # impatto grave
        buf[i] = e * v
    save_sfx('phase_shift.wav', buf)

# Colpo decisivo al nucleo: impatto brillante + esplosione + coda
def core_hit():
    n = int(0.6 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(233); prev = 0.0
    for i in range(n):
        t = i / SR
        flash = 0.7 * math.exp(-t * 7) * math.sin(2 * math.pi * max(80, 1400 - 2200 * t) * t)  # tono che precipita
        nz = next(ng); prev = 0.4 * prev + 0.6 * nz
        boom = 0.7 * math.exp(-t * 5) * prev                  # boato
        buf[i] = flash + boom
    save_sfx('core_hit.wav', buf)

make_m6_plaza(); make_m6_foundations(); make_m6_ascent(); make_m6_boss()
mask_absorb(); phase_shift(); core_hit()
print('done')
