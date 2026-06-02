#!/usr/bin/env python3
# Compressione immagini di Super Yac World: ridimensiona + ottimizza i PNG IN PLACE,
# mantenendo nomi/estensioni (nessun cambio di path nel codice). Solo downscale (mai
# upscale) + optimize. Rilanciabile (se già piccola, salta). Obiettivo: alleggerire il
# primo caricamento (card) e il peso per-mondo (sfondi/boss) senza perdita visibile.
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets')

# regola: (prefisso/suffisso match) -> lato massimo (px). Verificato sui display reali:
#  card menu ~140px (480 ok per retina), sfondi scalati a schermo, boss/sprite piccoli.
def max_side_for(name):
    n = name.lower()
    if n.endswith('_card.png'):                 return 480     # card menu (primo caricamento)
    if n.startswith('char_'):                   return 380     # eroi (player + postazioni Officina)
    if n.startswith('bg_') or n.startswith('sfondo') or n.startswith('sotterraneo'):
        return 1100                                            # sfondi (caricati per-mondo)
    if n.startswith('boss'):                    return 640     # boss (scaleH 80-150)
    if n.startswith('salon_'):                  return 520     # saloni (~212px a schermo)
    if n.startswith('enemy') or n.startswith('soldato') or n.startswith('koopa') \
       or n.startswith('gusciokoopa') or n.startswith('spugnotto') or n.startswith('flacone') \
       or n.startswith('promoter') or n.startswith('spraybill') or n.startswith('etichetta') \
       or n.startswith('lakitu') or n.startswith('spiny') or n.startswith('flyer'):
        return 320                                             # nemici/sprite
    return None                                                # tutto il resto: non toccare

def main():
    before = after = 0
    changed = 0
    for fn in sorted(os.listdir(ROOT)):
        if not fn.lower().endswith('.png'):
            continue
        path = os.path.join(ROOT, fn)
        if not os.path.isfile(path):
            continue
        ms = max_side_for(fn)
        if ms is None:
            continue
        sz0 = os.path.getsize(path)
        im = Image.open(path)
        w, h = im.size
        scale = ms / max(w, h)
        # converto in lavoro solo se serve (downscale) o se non era ottimizzata
        if scale < 1.0:
            im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
        # salva PNG ottimizzato (mantiene alpha se presente)
        im.save(path, 'PNG', optimize=True)
        sz1 = os.path.getsize(path)
        before += sz0; after += sz1
        if sz1 != sz0:
            changed += 1
            print(f'{fn:28} {w}x{h} {sz0//1024:5}KB -> {im.size[0]}x{im.size[1]} {sz1//1024:5}KB')
    print(f'\n{changed} file modificati. Totale: {before//1024//1024} MB -> {after//1024//1024} MB '
          f'(risparmio {(before-after)//1024//1024} MB)')

if __name__ == '__main__':
    main()
