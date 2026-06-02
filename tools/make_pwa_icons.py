#!/usr/bin/env python3
# Genera le icone PWA di Super Yac World dal logo (assets/logo_yac.png, bianco su trasparente).
# Output in public/ (Vite copia public/ nella root del sito): icon-192, icon-512,
# icon-512-maskable (con safe-zone), apple-touch-icon-180. Sfondo plum scuro del brand.
import os
from PIL import Image

ASSETS = os.path.join(os.path.dirname(__file__), '..', 'assets')
PUBLIC = os.path.join(os.path.dirname(__file__), '..', 'public')
os.makedirs(PUBLIC, exist_ok=True)
BG = (27, 16, 32, 255)   # #1b1020 plum scuro

def make(size, logo_frac, out):
    icon = Image.new('RGBA', (size, size), BG)
    logo = Image.open(os.path.join(ASSETS, 'logo_yac.png')).convert('RGBA')
    box = int(size * logo_frac)
    w, h = logo.size
    s = box / max(w, h)
    logo = logo.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    icon.alpha_composite(logo, ((size - logo.size[0]) // 2, (size - logo.size[1]) // 2))
    icon.save(os.path.join(PUBLIC, out), 'PNG', optimize=True)
    print(out, f'{size}x{size}')

make(192, 0.62, 'icon-192.png')
make(512, 0.62, 'icon-512.png')
make(512, 0.50, 'icon-512-maskable.png')   # safe-zone: logo più piccolo per il ritaglio rotondo
make(180, 0.62, 'apple-touch-icon-180.png')
print('done')
