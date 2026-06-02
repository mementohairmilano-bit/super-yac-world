#!/usr/bin/env python3
# Sintetizzatore Python puro per MUSICA + SFX dedicati del MONDO 5 "La Borsa / Direzione".
# Output: WAV 16-bit mono 22050Hz. Autonomo (non tocca M2/M3/M4). Rilanciabile.
#   musica → assets/audio/music/  : mondo5_loop, mondo5_vault_loop, mondo5_penthouse_loop, mondo5_boss_loop
#   sfx    → assets/audio/sfx/     : bolletta_fire, chart_crash, laser_zap, uni_summon
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

def ping(buf, start, freq, amp=0.18, dur=0.18):
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

# =================== 5-1  La Sala Trading — brillante/freddo, "ticker" frenetico ===================
def make_m5_surface():
    bpm = 140; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['C2', 'A2', 'F2', 'G2']                       # C Am F G: brillante con tensione
    chs = [['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4']]
    # arpeggio "ticker tape" a sedicesimi
    arp = [['C5', 'E5', 'G5', 'E5'], ['A4', 'C5', 'E5', 'C5'], ['F4', 'A4', 'C5', 'A4'], ['G4', 'B4', 'D5', 'B4']]
    lead = {0: 'G4', 1: 'C5', 2: 'E5', 2.5: 'D5', 3: 'C5',
            4: 'E5', 5: 'C5', 6: 'A4', 7: 'B4',
            8: 'A4', 9: 'C5', 10: 'F5', 11: 'C5',
            12: 'D5', 13: 'G5', 14: 'B4', 15: 'D5'}
    for bar in range(bars):
        t0 = bar * 4 * b
        chord(buf, t0, 4 * b, chs[bar], 0.12, 'saw', detune=0.006, a=0.03, r=0.12)
        for k in range(8): note(buf, t0 + k * 0.5 * b, 0.45 * b, f(roots[bar]), 0.30, 'square', duty=0.4, a=0.005, r=0.04)  # basso
        for beat in range(4):
            for j, nm in enumerate(arp[bar]): note(buf, t0 + beat * b + j * 0.25 * b, 0.2 * b, f(nm), 0.11, 'square', duty=0.5, a=0.003, r=0.03)  # ticker
    for beat, nm in lead.items(): note(buf, beat * b, 0.42 * b, f(nm), 0.26, 'square', duty=0.5, a=0.005, d=0.04, s=0.6, r=0.06, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in (0, 2): kick(buf, t0 + beat * b, 0.8)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.40, seed=beat + bar)
        for k in range(8): hat(buf, t0 + k * 0.5 * b, 0.15, seed=k + bar * 3)
    finalize(buf, 'mondo5_loop.wav')

# =================== 5-2  Il Caveau — heist teso, furtivo ===================
def make_m5_vault():
    bpm = 86; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR))
    prog = [['A2', 'E3', 'A3'], ['A2', 'F3', 'C4'], ['D2', 'A2', 'D3'], ['E2', 'G#3', 'B3']]
    sub = ['A1', 'F1', 'D1', 'E1']
    # walking bass furtivo (pizzicato)
    walk = [['A2', 'C3', 'E3', 'C3'], ['A2', 'C3', 'F3', 'C3'], ['D2', 'F2', 'A2', 'F2'], ['E2', 'G#2', 'B2', 'G#2']]
    mel = {1: 'E4', 3: 'C4', 5: 'A3', 7: 'B3', 9: 'D4', 11: 'C4', 13: 'B3', 15: 'E4'}
    for bar in range(bars):
        t0 = bar * 4 * b
        chord(buf, t0, 4 * b * 0.95, prog[bar], 0.10, 'saw', detune=0.01, a=0.5, r=0.6)
        note(buf, t0, 4 * b * 0.95, f(sub[bar]), 0.24, 'sine', a=0.3, d=0.2, s=0.85, r=0.5)
        for k in range(4): note(buf, t0 + k * b, 0.4 * b, f(walk[bar][k]), 0.22, 'tri', a=0.004, d=0.06, s=0.3, r=0.08)  # pizz
    for beat, nm in mel.items(): note(buf, beat * b, 0.9 * b, f(nm), 0.16, 'sine', a=0.04, d=0.2, s=0.5, r=0.35, vib=1)
    # blip d'allarme lontani (luci di sicurezza)
    for beat, nm in [(2.5, 'E6'), (6.5, 'C6'), (10.5, 'G6'), (14.5, 'D6')]: ping(buf, beat * b, f(nm), 0.07, 0.12)
    for bar in range(bars):   # batteria minima, furtiva
        kick(buf, bar * 4 * b, 0.66)
        snare(buf, bar * 4 * b + 2 * b, 0.3, seed=bar + 4)
        for k in (1, 3): hat(buf, bar * 4 * b + k * b, 0.09, seed=k + bar)
    finalize(buf, 'mondo5_vault_loop.wav', fade_out=0.06)

# =================== 5-3  L'Attico — scalata grandiosa, drammatica ===================
def make_m5_penthouse():
    bpm = 150; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['A1', 'F1', 'C2', 'G1']                       # Am F C G: ascesa decisa
    chs = [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4']]
    arp = [['A4', 'C5', 'E5', 'A5'], ['F4', 'A4', 'C5', 'F5'], ['C5', 'E5', 'G5', 'C6'], ['G4', 'B4', 'D5', 'G5']]
    lead = {0: 'A4', 1: 'E5', 2: 'A5', 3: 'G5', 4: 'F5', 5: 'C5', 6: 'A4', 7: 'C5',
            8: 'G5', 9: 'E5', 10: 'C5', 11: 'E5', 12: 'D5', 13: 'G5', 14: 'B5', 15: 'D5'}
    for bar in range(bars):
        t0 = bar * 4 * b
        for k in range(16): note(buf, t0 + k * 0.25 * b, 0.22 * b, f(roots[bar]), 0.28, 'saw', duty=0.5, a=0.004, r=0.03, detune=0.012)
        chord(buf, t0, 4 * b, chs[bar], 0.10, 'saw', detune=0.008, a=0.03, r=0.12)
        for beat in range(4):
            for j, nm in enumerate(arp[bar]): note(buf, t0 + beat * b + j * 0.25 * b, 0.2 * b, f(nm), 0.12, 'square', a=0.003, r=0.04)
    for beat, nm in lead.items(): note(buf, beat * b, 0.45 * b, f(nm), 0.24, 'saw', a=0.008, d=0.05, s=0.6, r=0.07, detune=0.006, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in range(4): kick(buf, t0 + beat * b, 0.78)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.42, seed=beat + bar * 2)
        for k in range(8): hat(buf, t0 + k * 0.5 * b, 0.14, seed=k + bar)
    finalize(buf, 'mondo5_penthouse_loop.wav')

# =================== Boss Unibeauty — aggressivo e "patinato" (corporate villain) ===================
def make_m5_boss():
    bpm = 172; b = 60 / bpm; bars = 4; buf = array.array('d', [0.0] * int(bars * 4 * b * SR + SR // 2))
    roots = ['A1', 'A1', 'F1', 'G1']
    # accordi con maj7 "patinato" alternati a tensione
    chs = [['A3', 'C#4', 'E4', 'G#4'], ['A3', 'C#4', 'E4', 'G#4'], ['F3', 'A3', 'C4', 'E4'], ['G3', 'B3', 'D4', 'F#4']]
    lead = ['A4', 'C#5', 'E5', 'A5', 'G#5', 'E5', 'C#5', 'B4',
            'C5', 'F5', 'A5', 'F5', 'D5', 'G5', 'B5', 'G5']
    for bar in range(bars):
        t0 = bar * 4 * b
        for k in range(16): note(buf, t0 + k * 0.25 * b, 0.2 * b, f(roots[bar]), 0.30, 'saw', duty=0.4, a=0.003, r=0.03, detune=0.015)
        chord(buf, t0, 4 * b, chs[bar], 0.08, 'saw', detune=0.01, a=0.02, r=0.1)
        for k in range(16):
            nm = lead[k] if bar % 2 == 0 else lead[(k + 8) % 16]
            note(buf, t0 + k * 0.25 * b, 0.2 * b, f(nm), 0.20, 'square', a=0.003, r=0.03, vib=1)
    for bar in range(bars):
        t0 = bar * 4 * b
        for beat in range(4): kick(buf, t0 + beat * b, 0.85)
        for beat in (1, 3): snare(buf, t0 + beat * b, 0.45, seed=beat + bar * 5)
        for k in range(16): hat(buf, t0 + k * 0.25 * b, 0.12, seed=k + bar * 2)
    finalize(buf, 'mondo5_boss_loop.wav')

# ============================ SFX dedicati Mondo 5 ============================
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

# Bolletta Bill sparata: "thunk" di timbro + swish di carta + ching di cassa
def bolletta_fire():
    n = int(0.22 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(101); prev = 0.0
    for i in range(n):
        t = i / SR
        thunk = 0.6 * math.exp(-t * 40) * sq(140 * t, 0.4)              # timbro che schiaccia
        nz = next(ng); prev = 0.5 * prev + 0.5 * nz
        swish = 0.4 * math.exp(-t * 16) * prev                          # carta che vola
        ching = 0.0
        if t > 0.05: ching = 0.35 * math.exp(-(t - 0.05) * 22) * math.sin(2 * math.pi * 1760 * t)  # cassa
        buf[i] = thunk + swish + ching
    save_sfx('bolletta_fire.wav', buf)

# Crollo del grafico / pavimento che cede: whoomp discendente + tonfo
def chart_crash():
    n = int(0.36 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(113); prev = 0.0
    for i in range(n):
        t = i / SR; e = math.exp(-t * 6)
        fr = max(70, 520 - 1500 * t)                                    # tono che precipita
        tone = 0.6 * sq(fr * t, 0.5)
        nz = next(ng); prev = 0.6 * prev + 0.4 * nz
        thud = 0.4 * math.exp(-t * 9) * prev                            # tonfo finale
        buf[i] = e * tone + thud
    save_sfx('chart_crash.wav', buf)

# Laser di sicurezza che si arma/scatta: zap elettrico acuto e secco
def laser_zap():
    n = int(0.16 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(127)
    for i in range(n):
        t = i / SR; e = math.exp(-t * 24)
        fr = 1900 + 220 * math.sin(2 * math.pi * 90 * t)                # tono acuto con tremolo
        v = 0.6 * sq(fr * t, 0.5) + 0.4 * next(ng)
        buf[i] = e * v
    save_sfx('laser_zap.wav', buf)

# Unibeauty evoca i minion: allerta corporate a due note ascendenti + ronzio
def uni_summon():
    n = int(0.34 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(139)
    for i in range(n):
        t = i / SR; e = math.exp(-t * 6)
        fr = 660 if t < 0.14 else 880                                   # bip-bip ascendente (allerta)
        v = 0.55 * sq(fr * t, 0.5) + 0.12 * next(ng)
        buf[i] = e * v
    save_sfx('uni_summon.wav', buf)

make_m5_surface(); make_m5_vault(); make_m5_penthouse(); make_m5_boss()
bolletta_fire(); chart_crash(); laser_zap(); uni_summon()
print('done')
