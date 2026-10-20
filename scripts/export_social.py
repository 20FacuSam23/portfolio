"""Exporta las composiciones gráficas del portfolio (Pillow, NumPy y FFmpeg)."""
from __future__ import annotations
import argparse
import math
from pathlib import Path
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = ROOT / 'assets/fonts/space-grotesk-variable.ttf'
BG = (16, 16, 20)
INK = (240, 238, 232)
VIOLET = (163, 138, 255)
LIME = (220, 249, 136)
MUTED = (170, 167, 180)
W, H = 1080, 1920
FPS, DURATION = 30, 18

def font(size, weight=500):
    f = ImageFont.truetype(str(FONT), round(size))
    if hasattr(f, 'set_variation_by_axes'):
        f.set_variation_by_axes([weight])
    return f

def fit(text, size, width, weight=500):
    f = font(size, weight)
    while f.getlength(text) > width:
        size -= 1
        f = font(size, weight)
    return f

def label(text, size, color, weight=500, width=920):
    f = fit(text, size, width, weight)
    box = f.getbbox(text)
    im = Image.new('RGBA', (math.ceil(f.getlength(text)) + 8, box[3] - box[1] + 8))
    ImageDraw.Draw(im).text((3, 3), text, fill=color, font=f, anchor='lt')
    return im

U, V = 112, 30
u = np.linspace(0, math.tau, U, endpoint=False)[None, :]
v = np.linspace(0, math.tau, V, endpoint=False)[:, None]
radius = 1.24 + .15 * np.cos(u * 3)
tube = .47 + .08 * np.sin(u * 2)
GEO = np.stack(np.broadcast_arrays((radius + tube * np.cos(v)) * np.cos(u), (radius + tube * np.cos(v)) * np.sin(u), tube * np.sin(v) + .24 * np.sin(u * 3)), axis=-1)

def geometry(t, center, scale):
    ax, ay, az = .84 + math.sin(t * .16) * .28, -.3 + t * .14, -.44 + math.sin(t * .12) * .3
    sx, cx, sy, cy, sz, cz = math.sin(ax), math.cos(ax), math.sin(ay), math.cos(ay), math.sin(az), math.cos(az)
    x, y, z = GEO[..., 0], GEO[..., 1], GEO[..., 2]
    a, b = x * cy + z * sy, z * cy - x * sy
    c, depth = y * cx - b * sx, y * sx + b * cx
    perspective = 4.5 / (4.5 + depth)
    px = center[0] + (a * cz - c * sz) * scale * perspective
    py = center[1] + (a * sz + c * cz) * scale * perspective
    return np.stack((px, py), axis=-1), depth

def orb(im, t, center, scale, opacity=1):
    points, depths = geometry(t, center, scale)
    layer = Image.new('RGBA', im.size)
    draw = ImageDraw.Draw(layer)
    for row in range(V):
        alpha = int((.3 + (1 - (depths[row].mean() + 1.8) / 3.6) * .45) * 255 * opacity)
        color = (224, 212, 255, alpha) if row % 7 == 0 else (*VIOLET, alpha)
        line = [tuple(p) for p in points[row]]
        draw.line(line + line[:1], fill=color, width=2 if im.width > 800 else 1, joint='curve')
    for col in range(0, U, 4):
        line = [tuple(p) for p in points[:, col]]
        draw.line(line + line[:1], fill=(*VIOLET, int(65 * opacity)), width=1)
    for i in range(5):
        angle = t * .12 + i * math.pi * .4
        x, y = center[0] + math.cos(angle) * scale * 2.05, center[1] + math.sin(angle) * scale * 1.65
        arm = 8 if i == 0 else 4
        color = (*LIME, int(255 * opacity)) if i == 0 else (213, 199, 255, int(255 * opacity))
        draw.line((x - arm, y, x + arm, y), fill=color, width=2)
        draw.line((x, y - arm, x, y + arm), fill=color, width=2)
    im.alpha_composite(layer)

def star(draw, center, radius, color, angle=0, arms=8):
    x, y = center
    for i in range(arms):
        a = angle + i * math.tau / arms
        draw.line((x + math.cos(a) * radius * .25, y + math.sin(a) * radius * .25, x + math.cos(a) * radius, y + math.sin(a) * radius), fill=color, width=max(2, int(radius * .1)))

def export_share():
    im = Image.new('RGBA', (1200, 630), BG)
    orb(im, 1.2, (924, 329), 128, .95)
    d = ImageDraw.Draw(im)
    d.line((60, 103, 1140, 103), fill=(53, 51, 62), width=1)
    d.text((60, 41), 'FA', fill=INK, font=font(44, 600), anchor='lt')
    d.text((160, 43), 'FACUNDO SAMELA ARAGÓN', fill=INK, font=font(17), anchor='lt')
    d.text((160, 70), 'DESARROLLO WEB & DISEÑO', fill=MUTED, font=font(12), anchor='lt')
    d.text((60, 179), 'DE LA IDEA', fill=INK, font=fit('DE LA IDEA', 103, 720, 600), anchor='lt')
    d.text((60, 299), 'A LO REAL.', fill=VIOLET, font=fit('A LO REAL.', 103, 690, 600), anchor='lt')
    d.text((65, 447), 'Diseño con intención. Código con criterio.', fill=MUTED, font=font(21), anchor='lt')
    d.text((65, 558), '20facusam23.github.io/portfolio', fill=INK, font=font(16), anchor='lt')
    d.text((1004, 560), '2026 / FA', fill=MUTED, font=font(13), anchor='lt')
    star(d, (1080, 170), 17, LIME, .15)
    out = ROOT / 'assets/compartir.png'
    im.convert('RGB').save(out, optimize=True)

def make_card(title, caption, color, ink, title_size=108):
    card = Image.new('RGBA', (900, 210), color)
    d = ImageDraw.Draw(card)
    d.text((40, 29), caption, font=font(20, 500), fill=ink, anchor='lt')
    d.text((38, 84), title, font=fit(title, title_size, 820, 600), fill=ink, anchor='lt')
    return card

LABELS = {}
def text_layer(key, text, size, color, x, y, order=0, weight=500, width=912):
    LABELS[key] = (label(text, size, color, weight, width), x, y, order)

text_layer('s0-eyebrow', 'DESARROLLO WEB & DISEÑO', 24, MUTED, 84, 300)
text_layer('s0-line0', 'DE LA', 188, INK, 78, 400, 0, 600)
text_layer('s0-line1', 'IDEA A', 188, INK, 78, 598, 1, 600)
text_layer('s0-line2', 'LO REAL.', 188, VIOLET, 78, 796, 2, 600)
text_layer('s0-note0', 'Diseño con intención.', 37, MUTED, 84, 1540, 3)
text_layer('s0-note1', 'Código con criterio.', 37, MUTED, 84, 1592, 3)
text_layer('s1-eyebrow', 'UNA IDEA. MUCHAS POSIBILIDADES.', 22, MUTED, 84, 300)
for i, word in enumerate(['DISEÑO.', 'CÓDIGO.', 'CRITERIO.']):
    text_layer(f's1-line{i}', word, 170, VIOLET if i == 2 else INK, 78, 402 + i * 192, i, 600)
for i, word in enumerate(['INTERFACES  ↗', 'DESARROLLO WEB  ↗', 'EXPERIENCIAS  ↗']):
    text_layer(f's1-row{i}', word, 33, INK, 84, 1135 + i * 125, 3 + i)
text_layer('s1-note0', 'Del primer boceto a lo real.', 34, MUTED, 84, 1600, 5)
text_layer('s2-eyebrow', 'PROYECTOS PROPIOS', 24, MUTED, 84, 300)
text_layer('s2-line0', 'IDEAS CON', 155, INK, 78, 412, 0, 600)
text_layer('s2-line1', 'IDENTIDAD.', 155, VIOLET, 78, 580, 1, 600)
text_layer('s3-eyebrow', '¿TENÉS UNA IDEA?', 24, (60, 46, 80), 84, 300)
for i, word in enumerate(['HAGAMOS', 'QUE', 'PASE.']):
    text_layer(f's3-line{i}', word, 181 if i < 2 else 235, INK if i == 2 else (32, 27, 43), 78, 420 + i * 210, i, 600)
text_layer('s3-note0', 'Facundo Samela Aragón', 43, (32, 27, 43), 84, 1515, 3)
text_layer('s3-note1', '@facusam_', 42, INK, 84, 1590, 3)
CARDS = [make_card('datalisting ↗', 'PLATAFORMA & COMERCIO', VIOLET, (37, 32, 54)), make_card('nuts', 'IDENTIDAD & TIENDA', (220, 235, 199), (48, 67, 43), 116), make_card('Reservas ↗', 'APLICACIÓN FULL STACK', (239, 150, 110), (67, 46, 43), 102)]
star(ImageDraw.Draw(CARDS[1]), (355, 135), 26, (113, 148, 68), .15)
BRAND_LIGHT = label('FA ↗', 66, INK, 600)
BRAND_DARK = label('FA ↗', 66, (32, 27, 43), 600)
NAME_LIGHT = label('FACUNDO SAMELA ARAGÓN', 22, INK)
NAME_DARK = label('FACUNDO SAMELA ARAGÓN', 22, (32, 27, 43))
FOOT_LIGHT = label('20facusam23.github.io/portfolio', 25, MUTED)
FOOT_DARK = label('20facusam23.github.io/portfolio', 25, (51, 40, 68))

def ease(value):
    return 1 - (1 - min(1, max(0, value))) ** 3

def paste(im, item, x, y, alpha=1):
    if alpha <= 0: return
    if alpha < .999:
        item = item.copy()
        item.putalpha(item.getchannel('A').point(lambda a: round(a * alpha)))
    im.alpha_composite(item, (round(x), round(y)))

def render(t):
    scene = min(3, int(t / 4.5))
    local = t - scene * 4.5
    dark = scene != 3
    im = Image.new('RGBA', (W, H), BG if dark else VIOLET)
    if scene < 3:
        orb(im, 1.2 + t, (635, 1190), 290 if scene == 0 else 350, [.9, .27, .18][scene])
    draw = ImageDraw.Draw(im)
    fade = min(1, max(0, (4.5 - local) / .28))
    for key, (item, x, y, order) in LABELS.items():
        if not key.startswith(f's{scene}-'): continue
        e = ease((local - .1 - order * .08) / .7)
        paste(im, item, x, y + (1 - e) * 130 - (1 - fade) * 45, e * fade)
    if scene == 0:
        star(draw, (900, 1040), 67, LIME, t * .2)
    if scene == 1:
        for y in [1090, 1215, 1340, 1465]: draw.line((84, y, 996, y), fill=(53, 51, 62), width=2)
    if scene == 2:
        for i, card in enumerate(CARDS):
            e = ease((local - .25 - i * .15) / .8)
            angle = [-4, 4, -2][i] + math.sin(local * .9 + i) * 1.0
            rotated = card.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
            x = (W - rotated.width) / 2 + [1, -1, 1][i] * (1 - e) * 180
            paste(im, rotated, x, 820 + i * 245 + (1 - e) * 90, e * fade)
    if scene == 3:
        end = 930 + math.sin(local * 1.2) * 14
        draw.line((740, 1280, end, 1090), fill=INK, width=19)
        draw.line((end - 155, 1090, end, 1090, end, 1245), fill=INK, width=19)
    paste(im, BRAND_LIGHT if dark else BRAND_DARK, 84, 136)
    name = NAME_LIGHT if dark else NAME_DARK
    paste(im, name, W - name.width - 84, 166)
    paste(im, FOOT_LIGHT if dark else FOOT_DARK, 84, 1740)
    draw.text((918, 1744), f'{scene + 1:02} / 04', fill=MUTED if dark else (51, 40, 68), font=font(21), anchor='lt')
    draw.line((84, 1810, 996, 1810), fill=(53, 51, 62) if dark else (116, 88, 168), width=2)
    draw.line((84, 1810, 84 + 912 * min(1, t / DURATION), 1810), fill=LIME if dark else INK, width=3)
    return im.convert('RGB')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--preview-only', action='store_true')
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    export_share()
    previews = []
    for i, t in enumerate([2.0, 6.5, 11.0, 15.5]):
        im = render(t)
        im.save(args.output.parent / f'preview_{i + 1}.png')
        previews.append(im.resize((270, 480), Image.Resampling.LANCZOS))
    sheet = Image.new('RGB', (1080, 480), BG)
    for i, im in enumerate(previews): sheet.paste(im, (270 * i, 0))
    sheet.save(args.output.parent / 'preview_general.jpg', quality=92)
    if args.preview_only:
        print('Composiciones y vista previa exportadas.', flush=True)
        return
    command = ['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-vcodec', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '4', str(args.output)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for n in range(FPS * DURATION):
            process.stdin.write(render(n / FPS).tobytes())
            if n % (FPS * 3) == 0: print(f'Video: {n // FPS}/{DURATION} segundos', flush=True)
        process.stdin.close()
        if process.wait() != 0: raise RuntimeError('FFmpeg no pudo completar el video.')
    except BaseException:
        process.kill()
        raise
    print(f'Video exportado: {args.output.name} ({args.output.stat().st_size} bytes)', flush=True)

if __name__ == '__main__': main()
