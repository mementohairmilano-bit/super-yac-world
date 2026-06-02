#!/usr/bin/env python3
# Sintetizzatore Python puro per MUSICA + SFX dedicati del MONDO 4 "Il Laboratorio Chimico".
# Output: WAV 16-bit mono 22050Hz. Autonomo (non tocca M2/M3). Rilanciabile per ritoccare.
#   musica → assets/audio/music/  : mondo4_loop, mondo4_basement_loop, mondo4_reactor_loop, mondo4_boss_loop
#   sfx    → assets/audio/sfx/     : goccia_drop, acid_splash, acid_sizzle, vapor
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
    with wave.open(os.path.join(OUT_M, name), 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(name, '%.2fs' % (N / SR), 'peak=%.2f' % peak)

# =================== 4-1  Le Vasche — luminoso/clinico, bollicine ===================
def make_m4_surface():
    bpm = 130; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['C2', 'G2', 'A2', 'F2']                       # C G Am F: brillante (ritorno alla luce)
    chs = [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4']]
    lead = {0: 'G4', 0.5: 'E4', 1: 'C5', 1.5: 'G4', 2: 'E5', 3: 'D5', 3.5: 'B4',
            4: 'D5', 4.5: 'B4', 5: 'G4', 5.5: 'D5', 6: 'B4', 7: 'D5',
            8: 'C5', 8.5: 'A4', 9: 'E5', 10: 'C5', 11: 'A4', 11.5: 'E4',
            12: 'A4', 12.5: 'C5', 13: 'F5', 14: 'C5', 15: 'A4'}
    for bar in range(bars):
        t0 = bar * 4 * b
        chord(buf, t0, 4 * b, chs[bar], 0.15, 'square', detune=0, a=0.02, r=0.1)
        for k in range(8):
            note(buf, t0 + k * 0.5 * b, 0.45 * b, f(roots[bar]), 0.30, 'tri', a=0.005, r=0.05)
    for beat, nm in lead.items():
        note(buf, beat * b, 0.42 * b, f(nm), 0.28, 'square', duty=0.5, a=0.005, d=0.04, s=0.6, r=0.06, vib=1)
    # bollicine "chimiche" (accenti verde-tossico) deterministiche
    for beat, nm in [(1.75, 'E6'), (3.75, 'C6'), (5.75, 'G6'), (7.75, 'D6'),
                     (9.75, 'A6'), (11.75, 'C6'), (13.75, 'F6'), (15.5, 'A6')]:
        ping(buf, beat * b, f(nm), 0.08, 0.14)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in (0, 2): kick(buf, t0 + beat * b, 0.8)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.40, seed=beat + bar)
        for k in range(8): hat(buf, t0 + k * 0.5 * b, 0.16, seed=k + bar * 3)
    finalize(buf, 'mondo4_loop.wav')

# =================== 4-2  Il Seminterrato — buio, ooze che sale (teso, sgocciola) ===================
def make_m4_basement():
    bpm = 90; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR))
    prog = [['A2', 'E3', 'A3'], ['A2', 'F3', 'C4'], ['D2', 'A2', 'D3'], ['E2', 'G#3', 'B3']]
    sub = ['A1', 'F1', 'D1', 'E1']
    # motivo di basso ASCENDENTE (eco della scalata: "sali e non fermarti")
    climb = ['A2', 'C3', 'E3', 'A3']
    mel = {0: 'E4', 2.5: 'C4', 4: 'A3', 6.5: 'B3', 8: 'D4', 10.5: 'A3', 12: 'B3', 14.5: 'C4'}
    for bar in range(bars):
        t0 = bar * 4 * b
        chord(buf, t0, 4 * b * 0.96, prog[bar], 0.12, 'saw', detune=0.01, a=0.5, r=0.6)
        note(buf, t0, 4 * b * 0.96, f(sub[bar]), 0.26, 'sine', a=0.3, d=0.2, s=0.85, r=0.5)  # drone
        for k in range(4):   # scalata che monta
            note(buf, t0 + k * b, 0.5 * b, f(climb[k]), 0.16, 'tri', a=0.01, r=0.06)
    for beat, nm in mel.items():
        note(buf, beat * b, 1.2 * b, f(nm), 0.18, 'sine', a=0.05, d=0.2, s=0.5, r=0.4, vib=1)
    # gocce d'acido che cadono (ping discendenti)
    for beat, nm in [(0.6, 'A6'), (1.9, 'E6'), (3.3, 'C6'), (5.0, 'G5'), (6.6, 'D6'),
                     (8.2, 'A6'), (9.6, 'E6'), (11.4, 'C6'), (13.0, 'G5'), (14.4, 'D6')]:
        ping(buf, beat * b, f(nm), 0.09, 0.16)
    for bar in range(bars):   # batteria minima, cupa
        kick(buf, bar * 4 * b, 0.7); kick(buf, bar * 4 * b + 2.5 * b, 0.6)
        for k in (1, 3): hat(buf, bar * 4 * b + k * b, 0.1, seed=k + bar)
    finalize(buf, 'mondo4_basement_loop.wav', fade_out=0.06)

# =================== 4-3  Il Reattore — industriale, ominoso, pulsante ===================
def make_m4_reactor():
    bpm = 148; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['D2', 'D2', 'F2', 'E2']                       # Dm base, colori diminuiti
    chs = [['D3', 'F3', 'A3'], ['D3', 'F3', 'A3'], ['F3', 'Ab3', 'C4'], ['E3', 'G3', 'Bb3']]
    arp = [['D4', 'F4', 'A4', 'F4'], ['D4', 'F4', 'A4', 'F4'],
           ['F4', 'Ab4', 'C5', 'Ab4'], ['E4', 'G4', 'Bb4', 'G4']]
    for bar in range(bars):
        t0 = bar * 4 * b
        for k in range(16):   # basso pulsante a sedicesimi (macchinario)
            note(buf, t0 + k * 0.25 * b, 0.22 * b, f(roots[bar]), 0.30, 'square', duty=0.25, a=0.004, r=0.03)
        chord(buf, t0, 4 * b, chs[bar], 0.10, 'saw', detune=0.008, a=0.03, r=0.12)
        for beat in range(4):
            for j, nm in enumerate(arp[bar]):
                note(buf, t0 + beat * b + j * 0.25 * b, 0.2 * b, f(nm), 0.16, 'square', a=0.003, r=0.04, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in range(4): kick(buf, t0 + beat * b, 0.78)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.42, seed=beat + bar * 2)
        for k in range(8): hat(buf, t0 + k * 0.5 * b, 0.14, seed=k + bar)
    finalize(buf, 'mondo4_reactor_loop.wav')

# =================== Boss ToxiLab — intenso, acido, dissonante ===================
def make_m4_boss():
    bpm = 168; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['D2', 'D2', 'Eb2', 'D2']                      # spinta cromatica
    chs = [['D3', 'Ab3', 'C4'], ['D3', 'Ab3', 'C4'], ['Eb3', 'A3', 'Db4'], ['D3', 'F3', 'Ab3']]  # tritoni
    lead = ['D5', 'Ab4', 'D5', 'F5', 'E5', 'C5', 'A4', 'Ab4',
            'Eb5', 'A4', 'Eb5', 'Gb5', 'F5', 'Db5', 'A4', 'Ab4']
    for bar in range(bars):
        t0 = bar * 4 * b
        for k in range(16):
            note(buf, t0 + k * 0.25 * b, 0.2 * b, f(roots[bar]), 0.30, 'saw', duty=0.4, a=0.003, r=0.03, detune=0.015)
        chord(buf, t0, 4 * b, chs[bar], 0.09, 'saw', detune=0.012, a=0.02, r=0.1)
        for k in range(16):
            nm = lead[k] if bar % 2 == 0 else lead[(k + 8) % 16]
            note(buf, t0 + k * 0.25 * b, 0.2 * b, f(nm), 0.20, 'square', a=0.003, r=0.03, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in range(4): kick(buf, t0 + beat * b, 0.85)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.45, seed=beat + bar * 5)
        for k in range(16): hat(buf, t0 + k * 0.25 * b, 0.12, seed=k + bar * 2)
    finalize(buf, 'mondo4_boss_loop.wav')

# ============================ SFX dedicati Mondo 4 ============================
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

# Spruzzabot rilascia una Goccia Corrosiva: "blop" che scende + codina bagnata
def goccia_drop():
    n = int(0.22 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(41)
    for i in range(n):
        t = i / SR; e = math.exp(-t * 13)
        fr = max(150, 720 - 2400 * t)                       # tonfo discendente
        v = 0.7 * math.sin(2 * math.pi * fr * t)
        if t > 0.12: v += 0.45 * math.exp(-(t - 0.12) * 42) * next(ng)   # splat finale
        buf[i] = e * v
    save_sfx('goccia_drop.wav', buf)

# Schizzo d'acido del ToxiLab: "splat" liquido (rumore lowpass + gloop grave)
def acid_splash():
    n = int(0.2 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(53); prev = 0.0
    for i in range(n):
        t = i / SR; e = math.exp(-t * 17)
        nz = next(ng); prev = 0.55 * prev + 0.45 * nz       # lowpass → liquido
        gloop = 0.4 * math.sin(2 * math.pi * max(90, 360 - 700 * t) * t)
        buf[i] = e * (0.7 * prev + gloop)
    save_sfx('acid_splash.wav', buf)

# Pozza d'acido che si forma e sfrigola (bolle + sibilo filtrato)
def acid_sizzle():
    n = int(0.42 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(67); prev = 0.0
    for i in range(n):
        t = i / SR; e = math.exp(-t * 4.5)
        bub = 0.55 + 0.45 * math.sin(2 * math.pi * 17 * t)  # modulazione "bollicine"
        nz = next(ng); prev = 0.72 * prev + 0.28 * nz       # sibilo lowpass
        blip = 0.12 * math.sin(2 * math.pi * (220 + 90 * math.sin(2 * math.pi * 9 * t)) * t)
        buf[i] = e * (0.8 * prev * bub + blip)
    save_sfx('acid_sizzle.wav', buf)

# Sbuffo di vapore: "pssshhh" (rumore highpass con attacco rapido)
def vapor():
    n = int(0.32 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(83); prev = 0.0
    for i in range(n):
        t = i / SR
        e = (t / 0.04) if t < 0.04 else math.exp(-(t - 0.04) * 8.5)
        nz = next(ng); prev = 0.86 * prev + 0.14 * nz       # lowpass…
        hp = nz - prev                                       # …per ricavare l'highpass (vapore "ffff")
        buf[i] = e * 0.95 * hp
    save_sfx('vapor.wav', buf)

make_m4_surface(); make_m4_basement(); make_m4_reactor(); make_m4_boss()
goccia_drop(); acid_splash(); acid_sizzle(); vapor()
print('done')
