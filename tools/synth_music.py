#!/usr/bin/env python3
# Sintetizzatore chiptune/synth in Python puro per le 4 tracce del Mondo 2 di Super Yac World.
# Output: WAV 16-bit mono 22050Hz, loop puliti, in assets/audio/music/.
import wave, math, struct, array, os

SR = 22050
OUT = "/Users/antoniomaniscalco/Desktop/YAC/Super Yac World/assets/audio/music"

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

def ping(buf, start, freq, amp=0.18, dur=0.18):  # bollicina/blip
    note(buf, start, dur, freq, amp, 'sine', a=0.002, d=0.04, s=0.4, r=0.12)

def finalize(buf, name, fade_in=0.008, fade_out=0.03):
    N = len(buf)
    fi = int(fade_in * SR); fo = int(fade_out * SR)
    for i in range(fi): buf[i] *= i / fi
    for i in range(fo): buf[N - 1 - i] *= i / fo
    peak = max((abs(x) for x in buf), default=1.0) or 1.0
    g = 0.82 / peak
    data = array.array('h', (max(-32767, min(32767, int(x * g * 32767))) for x in buf))
    path = os.path.join(OUT, name)
    with wave.open(path, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(name, '%.2fs' % (N / SR), 'peak=%.2f' % peak)

# =================== 2-1  Zona di Carico — chiptune brillante ===================
def make_surface():
    bpm = 138; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    # i-VI-III-VII in La minore: Am F C G  → allegro
    roots = ['A2', 'F2', 'C2', 'G2']
    chs = [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C3', 'E3', 'G3'], ['G3', 'B3', 'D4']]
    lead = {  # (beat -> note) melodia a crome
        0: 'A4', 0.5: 'C5', 1: 'E5', 1.5: 'C5', 2: 'D5', 3: 'C5', 3.5: 'A4',
        4: 'A4', 4.5: 'F4', 5: 'A4', 5.5: 'C5', 6: 'F5', 7: 'E5',
        8: 'G4', 8.5: 'C5', 9: 'E5', 10: 'G5', 11: 'E5', 11.5: 'C5',
        12: 'B4', 12.5: 'D5', 13: 'G5', 14: 'D5', 15: 'B4'
    }
    for bar in range(bars):
        t0 = bar * 4 * b
        chord(buf, t0, 4 * b, chs[bar], 0.16, 'square', detune=0, a=0.02, r=0.1)
        for k in range(8):  # basso a crome
            note(buf, t0 + k * 0.5 * b, 0.45 * b, f(roots[bar]) , 0.32, 'tri', a=0.005, r=0.05)
    for beat, nm in lead.items():
        note(buf, beat * b, 0.42 * b, f(nm), 0.30, 'square', duty=0.5, a=0.005, d=0.04, s=0.6, r=0.06, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in (0, 2): kick(buf, t0 + beat * b, 0.8)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.42, seed=beat + bar)
        for k in range(8): hat(buf, t0 + k * 0.5 * b, 0.16, seed=k + bar * 3)
    finalize(buf, 'mondo2_loop.wav')

# =================== 2-2  Sottomagazzino — pad caldo e teso ===================
def make_water():
    bpm = 76; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR))
    # Am(add9) - Fmaj7 - Dm7 - E7sus  → sospeso, acquatico
    prog = [['A2', 'E3', 'A3', 'B3', 'C4'], ['F2', 'C3', 'F3', 'A3', 'E4'],
            ['D2', 'A2', 'D3', 'F3', 'C4'], ['E2', 'B2', 'E3', 'A3', 'D4']]
    sub = ['A1', 'F1', 'D1', 'E1']
    mel = {0: 'E4', 1.5: 'C4', 3: 'D4', 4: 'C4', 6: 'A3', 7: 'B3',
           8: 'F4', 9.5: 'E4', 11: 'D4', 12: 'B3', 14: 'C4', 15: 'E4'}
    for bar in range(bars):
        t0 = bar * 4 * b
        chord(buf, t0, 4 * b * 0.98, prog[bar], 0.16, 'saw', detune=0.006, a=0.5, r=0.7)
        note(buf, t0, 4 * b * 0.98, f(sub[bar]), 0.26, 'sine', a=0.4, d=0.2, s=0.85, r=0.6)  # drone sub
    for beat, nm in mel.items():
        note(buf, beat * b, 1.4 * b, f(nm), 0.22, 'sine', a=0.06, d=0.2, s=0.6, r=0.5, vib=1)
    # bollicine deterministiche
    bub = [(0.7, 'E6'), (2.3, 'A6'), (3.6, 'C6'), (5.1, 'G6'), (6.8, 'D6'),
           (8.4, 'A6'), (9.9, 'E6'), (11.6, 'C6'), (13.2, 'F6'), (14.7, 'A6')]
    for beat, nm in bub: ping(buf, beat * b, f(nm), 0.10)
    finalize(buf, 'mondo2_water_loop.wav', fade_out=0.06)

# =================== 2-3  Torre degli Scaffali — chiptune incalzante ===================
def make_tower():
    bpm = 152; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['A2', 'A2', 'D2', 'E2']                       # Am Am Dm E (minore armonico)
    chs = [['A3', 'C4', 'E4'], ['A3', 'C4', 'E4'], ['D3', 'F3', 'A3'], ['E3', 'G#3', 'B3']]
    for bar in range(bars):
        t0 = bar * 4 * b
        for k in range(16):  # basso a sedicesimi pulsante
            note(buf, t0 + k * 0.25 * b, 0.22 * b, f(roots[bar]), 0.30, 'square', duty=0.25, a=0.004, r=0.03)
        chord(buf, t0, 4 * b, chs[bar], 0.12, 'saw', detune=0.004, a=0.03, r=0.12)
    # arpeggio teso in alto
    arp = [['A4', 'C5', 'E5', 'C5'], ['A4', 'C5', 'E5', 'C5'],
           ['D5', 'F5', 'A5', 'F5'], ['E5', 'G#5', 'B5', 'G#5']]
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in range(4):
            for j, nm in enumerate(arp[bar]):
                note(buf, t0 + beat * b + j * 0.25 * b, 0.22 * b, f(nm), 0.20, 'square', duty=0.5, a=0.004, r=0.04)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in (0, 1, 2, 3): kick(buf, t0 + beat * b, 0.7)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.4, seed=beat + bar * 2)
        for k in range(8): hat(buf, t0 + k * 0.5 * b, 0.14, seed=k + bar)
    finalize(buf, 'mondo2_tower_loop.wav')

# =================== Boss BoxKing — chiptune intenso e veloce ===================
def make_boss():
    bpm = 170; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    # tensione cromatica/diminuita
    roots = ['A2', 'A2', 'A#2', 'A#2']
    chs = [['A3', 'C4', 'D#4'], ['A3', 'C4', 'D#4'], ['A#3', 'C#4', 'E4'], ['A#3', 'C#4', 'E4']]
    leadseq = ['A4', 'D#5', 'A4', 'F5', 'E5', 'C5', 'A4', 'G#4',
               'A#4', 'E5', 'A#4', 'F#5', 'F5', 'C#5', 'A#4', 'A4']
    for bar in range(bars):
        t0 = bar * 4 * b
        for k in range(16):
            note(buf, t0 + k * 0.25 * b, 0.2 * b, f(roots[bar]), 0.32, 'square', duty=0.2, a=0.003, r=0.02)
        chord(buf, t0, 4 * b, chs[bar], 0.10, 'saw', detune=0.006, a=0.02, r=0.1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for k in range(16):
            nm = leadseq[k] if bar % 2 == 0 else leadseq[(k + 8) % 16]
            note(buf, t0 + k * 0.25 * b, 0.2 * b, f(nm), 0.22, 'square', duty=0.5, a=0.003, r=0.03, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in range(4): kick(buf, t0 + beat * b, 0.85)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.45, seed=beat + bar * 5)
        for k in range(16): hat(buf, t0 + k * 0.25 * b, 0.12, seed=k + bar * 2)
    finalize(buf, 'mondo2_boss_loop.wav')

# =================== MONDO 3 — notte / neon (synthwave) ===================
def make_m3_surface():   # 3-1 Viale dei Cartelloni — synthwave brillante
    bpm = 124; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['A1', 'F1', 'G1', 'E1']                       # Am F G E (notturno deciso)
    chs = [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['E3', 'G#3', 'B3']]
    arp = [['A4', 'E5', 'C5', 'E5'], ['F4', 'C5', 'A4', 'C5'], ['G4', 'D5', 'B4', 'D5'], ['E4', 'B4', 'G#4', 'B4']]
    lead = {0: 'A4', 1.5: 'B4', 2: 'C5', 3: 'E5', 4: 'A4', 5.5: 'F4', 6: 'G4', 7: 'C5',
            8: 'B4', 9.5: 'D5', 10: 'G4', 11: 'B4', 12: 'G#4', 13.5: 'B4', 14: 'E5', 15: 'B4'}
    for bar in range(bars):
        t0 = bar * 4 * b
        chord(buf, t0, 4 * b, chs[bar], 0.13, 'saw', detune=0.008, a=0.06, r=0.2)
        for k in range(8): note(buf, t0 + k * 0.5 * b, 0.46 * b, f(roots[bar]), 0.30, 'saw', duty=0.5, a=0.005, r=0.05, detune=0.01)  # basso
        for beat in range(4):
            for j, nm in enumerate(arp[bar]): note(buf, t0 + beat * b + j * 0.25 * b, 0.22 * b, f(nm), 0.12, 'square', duty=0.5, a=0.004, r=0.04)
    for beat, nm in lead.items(): note(buf, beat * b, 0.45 * b, f(nm), 0.26, 'saw', a=0.01, d=0.05, s=0.6, r=0.08, detune=0.006, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in (0, 2): kick(buf, t0 + beat * b, 0.8)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.4, seed=beat + bar)
        for k in range(8): hat(buf, t0 + k * 0.5 * b, 0.16, seed=k + bar * 3)
    finalize(buf, 'mondo3_loop.wav')

def make_m3_net():   # 3-2 La Rete — teso, rado, al buio
    bpm = 92; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR))
    prog = [['A2', 'E3', 'A3'], ['A2', 'F3', 'A3'], ['D2', 'A2', 'D3'], ['E2', 'B2', 'E3']]
    sub = ['A1', 'A1', 'D1', 'E1']
    mel = {0: 'E4', 2: 'C4', 4: 'A3', 6: 'B3', 8: 'D4', 10: 'A3', 12: 'B3', 14: 'C4'}
    for bar in range(bars):
        t0 = bar * 4 * b
        chord(buf, t0, 4 * b * 0.96, prog[bar], 0.12, 'saw', detune=0.01, a=0.5, r=0.6)
        note(buf, t0, 4 * b * 0.96, f(sub[bar]), 0.26, 'tri', a=0.3, d=0.2, s=0.85, r=0.5)   # drone
        for k in (0, 2): note(buf, t0 + k * b, 0.22 * b, f(sub[bar]), 0.22, 'square', duty=0.25, a=0.004, r=0.04)  # pulse cupo
    for beat, nm in mel.items(): note(buf, beat * b, 1.1 * b, f(nm), 0.18, 'sine', a=0.05, d=0.2, s=0.5, r=0.4, vib=1)
    for bar in range(bars):   # batteria minima
        kick(buf, bar * 4 * b, 0.7); kick(buf, bar * 4 * b + 2.5 * b, 0.6)
        for k in (1, 3): hat(buf, bar * 4 * b + k * b, 0.1, seed=k + bar)
    finalize(buf, 'mondo3_net_loop.wav', fade_out=0.06)

def make_m3_heights():   # 3-3 In Quota — incalzante, drammatico
    bpm = 140; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['A1', 'A1', 'F1', 'G1']
    chs = [['A3', 'C4', 'E4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4']]
    arp = [['A4', 'C5', 'E5', 'A5'], ['A4', 'C5', 'E5', 'A5'], ['F4', 'A4', 'C5', 'F5'], ['G4', 'B4', 'D5', 'G5']]
    for bar in range(bars):
        t0 = bar * 4 * b
        for k in range(16): note(buf, t0 + k * 0.25 * b, 0.22 * b, f(roots[bar]), 0.28, 'saw', duty=0.5, a=0.004, r=0.03, detune=0.012)
        chord(buf, t0, 4 * b, chs[bar], 0.1, 'saw', detune=0.008, a=0.03, r=0.12)
        for beat in range(4):
            for j, nm in enumerate(arp[bar]): note(buf, t0 + beat * b + j * 0.25 * b, 0.2 * b, f(nm), 0.18, 'square', a=0.003, r=0.04)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in range(4): kick(buf, t0 + beat * b, 0.75)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.42, seed=beat + bar * 2)
        for k in range(8): hat(buf, t0 + k * 0.5 * b, 0.14, seed=k + bar)
    finalize(buf, 'mondo3_heights_loop.wav')

def make_m3_boss():   # ViralCorp — flashy e intenso
    bpm = 158; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['A1', 'A1', 'C2', 'B1']
    chs = [['A3', 'C4', 'E4'], ['A3', 'C4', 'E4'], ['C4', 'D#4', 'G4'], ['B3', 'D4', 'F4']]
    lead = ['A4', 'E5', 'C5', 'A5', 'G#5', 'E5', 'C5', 'B4', 'C5', 'G5', 'D#5', 'C5', 'B4', 'F5', 'D4', 'B3']
    for bar in range(bars):
        t0 = bar * 4 * b
        for k in range(16): note(buf, t0 + k * 0.25 * b, 0.2 * b, f(roots[bar]), 0.3, 'saw', duty=0.4, a=0.003, r=0.03, detune=0.015)
        chord(buf, t0, 4 * b, chs[bar], 0.09, 'saw', detune=0.01, a=0.02, r=0.1)
        for k in range(16):
            nm = lead[k] if bar % 2 == 0 else lead[(k + 8) % 16]
            note(buf, t0 + k * 0.25 * b, 0.2 * b, f(nm), 0.2, 'square', a=0.003, r=0.03, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in range(4): kick(buf, t0 + beat * b, 0.85)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.45, seed=beat + bar * 5)
        for k in range(16): hat(buf, t0 + k * 0.25 * b, 0.12, seed=k + bar * 2)
    finalize(buf, 'mondo3_boss_loop.wav')

make_surface(); make_water(); make_tower(); make_boss()
make_m3_surface(); make_m3_net(); make_m3_heights(); make_m3_boss()
print('done')
