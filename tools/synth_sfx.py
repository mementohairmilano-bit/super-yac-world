#!/usr/bin/env python3
# Effetti sonori (SFX) del Mondo 3, sintetizzati in Python puro. WAV 16-bit mono 22050Hz.
import wave, math, array, os
SR = 22050
OUT = "/Users/antoniomaniscalco/Desktop/YAC/Super Yac World/assets/audio/sfx"

def noise_gen(seed):
    x = seed & 0x7fffffff
    while True:
        x = (1103515245 * x + 12345) & 0x7fffffff
        yield (x / 0x3fffffff) - 1.0

def save(name, buf):
    peak = max((abs(v) for v in buf), default=1.0) or 1.0
    g = 0.85 / peak
    data = array.array('h', (max(-32767, min(32767, int(v * g * 32767))) for v in buf))
    with wave.open(os.path.join(OUT, name), 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(name, '%.2fs' % (len(buf) / SR))

def sq(ph, duty=0.5): return 1.0 if (ph % 1.0) < duty else -1.0

# volantino lanciato: "swish" di carta (rumore filtrato, decadimento veloce)
def flyer_throw():
    n = int(0.18 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(7); prev = 0.0
    for i in range(n):
        t = i / SR; e = math.exp(-t * 22)
        nz = next(ng); prev = 0.6 * prev + 0.4 * nz          # low-pass → "fff"
        tone = 0.3 * math.sin(2 * math.pi * (900 - 1800 * t) * t)
        buf[i] = e * (0.8 * prev + tone)
    save('flyer_throw.wav', buf)

# Spray-Bill sparato: aerosol "pssh" + tono discendente
def spraybill():
    n = int(0.26 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(13)
    for i in range(n):
        t = i / SR; e = math.exp(-t * 11)
        nz = next(ng)
        tone = 0.4 * sq((600 - 900 * t) * t, 0.3)
        buf[i] = e * (0.7 * nz + tone)
    save('spraybill.wav', buf)

# lampo insegne (3-2): zap elettrico breve e brillante
def flash():
    n = int(0.16 * SR); buf = array.array('d', [0.0] * n); ng = noise_gen(29)
    for i in range(n):
        t = i / SR; e = math.exp(-t * 26)
        fr = 1500 + 400 * math.sin(2 * math.pi * 60 * t)     # ronzio
        v = 0.5 * sq(fr * t, 0.5) + 0.5 * next(ng)
        buf[i] = e * v
    save('flash.wav', buf)

# fascio neon del boss: laser discendente
def boss_zap():
    n = int(0.3 * SR); buf = array.array('d', [0.0] * n)
    for i in range(n):
        t = i / SR; e = math.exp(-t * 7)
        fr = 1300 - 1600 * t
        v = 0.6 * sq(max(60, fr) * t, 0.45) + 0.4 * math.sin(2 * math.pi * max(60, fr) * t)
        buf[i] = e * v
    save('boss_zap.wav', buf)

flyer_throw(); spraybill(); flash(); boss_zap()
print('done')
