#!/usr/bin/env python3
"""Rimuove lo sfondo (bianco o a scacchiera) dagli sprite RGB cotti, producendo
un PNG/WEBP con vero canale alpha. Usa un flood-fill dai bordi sulla maschera
"sfondo candidato" (pixel chiari e poco saturi): così le aree chiare INTERNE al
personaggio (racchiuse dal contorno scuro) restano opache."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# soglia "candidato sfondo": chiaro e desaturato → copre bianco (255) e grigio scacchiera (~145)
LIGHT_MIN = 118   # min(R,G,B) >= → abbastanza chiaro
SAT_MAX = 32      # max-min <= → quasi neutro (no colori vivi del personaggio)


def remove_bg(path_in, path_out):
    im = Image.open(path_in).convert('RGB')
    arr = np.asarray(im).astype(np.int16)
    mn = arr.min(axis=2)
    mx = arr.max(axis=2)
    candidate = (mn >= LIGHT_MIN) & ((mx - mn) <= SAT_MAX)   # bool HxW

    # maschera binaria per il flood-fill (candidato=255)
    maskimg = Image.fromarray((candidate * 255).astype('uint8'), 'L')
    h, w = candidate.shape
    seeds = []
    # semina da molti punti di bordo che sono candidati (lo sfondo tocca i bordi)
    for x in range(0, w, max(1, w // 32)):
        for y in (0, h - 1):
            if candidate[y, x]:
                seeds.append((x, y))
    for y in range(0, h, max(1, h // 32)):
        for x in (0, w - 1):
            if candidate[y, x]:
                seeds.append((x, y))
    filled = maskimg.copy()
    for sx, sy in seeds:
        if filled.getpixel((sx, sy)) == 255:
            ImageDraw.floodfill(filled, (sx, sy), 128, thresh=0)

    bg = np.asarray(filled) == 128          # sfondo = regione candidata connessa al bordo
    alpha = np.where(bg, 0, 255).astype('uint8')

    # espando lo sfondo di 1px (erode il foreground) per mangiare l'alone di anti-alias chiaro
    amask = Image.fromarray(alpha, 'L').filter(ImageFilter.MinFilter(3))
    # micro-sfumatura del bordo per togliere la scaletta dei pixel
    amask = amask.filter(ImageFilter.GaussianBlur(0.6))

    out = im.convert('RGBA')
    out.putalpha(amask)
    # downscale: questi sprite sono resi a ~100-150px in gioco, non serve oltre ~720px
    MAX_H = 720
    if out.height > MAX_H:
        nw = round(out.width * MAX_H / out.height)
        out = out.resize((nw, MAX_H), Image.LANCZOS)
    out.save(path_out, 'WEBP', quality=92, method=6)
    import os
    kept = int((np.asarray(amask) > 8).sum())
    kb = os.path.getsize(path_out) / 1024
    print(f'  {path_in} -> {out.size}  {kb:.0f}KB  ({100*kept/(w*h):.1f}% opaco)')


if __name__ == '__main__':
    for p in sys.argv[1:]:
        remove_bg(p, p)
