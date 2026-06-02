#!/usr/bin/env python3
# SFX extra (FX di gioco): firework, score_tick, shoot, star. WAV 16-bit mono 22050Hz.
import wave, math, array, os
SR=22050; OUT="/Users/antoniomaniscalco/Desktop/YAC/Super Yac World/assets/audio/sfx"
def ng(seed):
    x=seed&0x7fffffff
    while True:
        x=(1103515245*x+12345)&0x7fffffff; yield (x/0x3fffffff)-1.0
def save(name,buf):
    pk=max((abs(v) for v in buf),default=1.0) or 1.0; g=0.85/pk
    d=array.array('h',(max(-32767,min(32767,int(v*g*32767))) for v in buf))
    with wave.open(os.path.join(OUT,name),'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
    print(name,'%.2fs'%(len(buf)/SR))
def sq(ph,duty=0.5): return 1.0 if (ph%1.0)<duty else -1.0

# Fuoco d'artificio: fischio che sale + scoppio (boom + scintillio)
def firework():
    n=int(0.6*SR); buf=array.array('d',[0.0]*n); g=ng(7); prev=0.0
    for i in range(n):
        t=i/SR
        # 0-0.18s: fischio ascendente
        whistle = 0.5*math.sin(2*math.pi*(500+1400*t)*t)*math.exp(-t*4) if t<0.2 else 0.0
        # 0.2s+: scoppio (rumore + boom grave)
        boom=0.0
        if t>0.2:
            tt=t-0.2; e=math.exp(-tt*7); nz=next(g); prev=0.5*prev+0.5*nz
            boom=e*(0.8*prev + 0.5*math.sin(2*math.pi*max(60,200-260*tt)*tt))
        buf[i]=whistle+boom
    save('firework.wav',buf)

# Tick del conteggio punti: blip cortissimo e brillante
def score_tick():
    n=int(0.05*SR); buf=array.array('d',[0.0]*n)
    for i in range(n):
        t=i/SR; e=math.exp(-t*60); buf[i]=e*0.7*sq(1760*t,0.5)
    save('score_tick.wav',buf)

# Sparo dell'eroe: "pew" laser discendente
def shoot():
    n=int(0.13*SR); buf=array.array('d',[0.0]*n)
    for i in range(n):
        t=i/SR; e=math.exp(-t*22); fr=max(200,1400-3600*t)
        buf[i]=e*(0.6*sq(fr*t,0.45)+0.4*math.sin(2*math.pi*fr*t))
    save('shoot.wav',buf)

# Invincibilità (Yuri): scintillio/arpeggio ascendente brillante
def star():
    n=int(0.42*SR); buf=array.array('d',[0.0]*n)
    notes=[880,1175,1568,2093]  # arpeggio
    for i in range(n):
        t=i/SR; idx=min(3,int(t/0.1)); fr=notes[idx]
        e=math.exp(-(t%0.1)*10)
        buf[i]=0.6*e*(0.6*sq(fr*t,0.5)+0.4*math.sin(2*math.pi*fr*t))
    save('star.wav',buf)

firework(); score_tick(); shoot(); star(); print('done')
