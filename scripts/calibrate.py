"""用与前端一致的算法，量出参考图的真实特征，作为品种画像的校准值。

算法要点：先把图缩到 96×96，取«植株像素»的外接框（外扩 8%），
再只在框内统计颜色与纹理，避免白墙/桌面/花盆的背景干扰。
"""
from PIL import Image
import colorsys
import glob
import os
import sys

SAMPLE = 96
IMAGES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images")


def is_plant(h, s, l):
    return 55 <= h <= 185 and s > 0.1 and 0.04 < l < 0.92


def features(path):
    im = Image.open(path).convert("RGB").resize((SAMPLE, SAMPLE), Image.LANCZOS)
    px = list(im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata())

    total = SAMPLE * SAMPLE
    hue = [0.0] * total
    sat = [0.0] * total
    lig = [0.0] * total
    mask = [False] * total
    minx, miny, maxx, maxy = SAMPLE, SAMPLE, -1, -1
    for i, (r, g, b) in enumerate(px):
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        h *= 360
        hue[i], sat[i], lig[i] = h, s, l
        if is_plant(h, s, l):
            mask[i] = True
            y, x = divmod(i, SAMPLE)
            minx, miny = min(minx, x), min(miny, y)
            maxx, maxy = max(maxx, x), max(maxy, y)

    if maxx < 0:
        rx0, ry0, rx1, ry1 = 0, 0, SAMPLE - 1, SAMPLE - 1
    else:
        w, h = maxx - minx + 1, maxy - miny + 1
        pxp, pyp = int(round(w * 0.08)) + 1, int(round(h * 0.08)) + 1
        rx0, ry0 = max(0, minx - pxp), max(0, miny - pyp)
        rx1, ry1 = min(SAMPLE - 1, maxx + pxp), min(SAMPLE - 1, maxy + pyp)
    crop = (rx1 - rx0 + 1) * (ry1 - ry0 + 1)

    green = yellow = brown = dark = bright = 0
    gh = gl = gs = 0.0
    esum = ecnt = 0.0
    gesum = gecnt = 0.0

    for y in range(ry0, ry1 + 1):
        for x in range(rx0, rx1 + 1):
            i = y * SAMPLE + x
            h, s, l = hue[i], sat[i], lig[i]
            if mask[i]:
                green += 1
                gh += h
                gl += l
                gs += s
            elif 35 <= h < 62 and s > 0.15 and l > 0.35:
                yellow += 1
            elif s > 0.12 and l < 0.62 and ((8 <= h < 52) or h >= 340 or h < 8):
                brown += 1
            if l < 0.22:
                dark += 1
            if l > 0.86 and s < 0.18:
                bright += 1
            for nx, ny in ((x + 1, y), (x, y + 1)):
                if nx > rx1 or ny > ry1:
                    continue
                j = ny * SAMPLE + nx
                d = abs(l - lig[j])
                esum += d
                ecnt += 1
                if mask[i] and mask[j]:
                    gesum += d
                    gecnt += 1

    bbox = (maxx - minx + 1) * (maxy - miny + 1) if maxx >= 0 else 0
    name = os.path.basename(path)
    print(
        f"{name:16s} sub={sum(mask)/total:.2f} green={green/crop:.2f} hue={gh/green if green else 0:6.1f} "
        f"gl={gl/green if green else 0:.2f} gs={gs/green if green else 0:.2f} "
        f"fill={green/bbox if bbox else 0:.2f} aspect={(maxy-miny+1)/(maxx-minx+1) if maxx>=0 else 1:.2f} "
        f"y={yellow/crop:.2f} br={brown/crop:.2f} dark={dark/crop:.2f} bright={bright/crop:.2f} "
        f"gedge={gesum/gecnt if gecnt else 0:.3f} edge={esum/ecnt if ecnt else 0:.3f}"
    )


targets = sys.argv[1:] or sorted(glob.glob(os.path.join(IMAGES, "*.jpg")))
for p in targets:
    if os.path.isabs(p):
        features(p)
    else:
        features(os.path.join(IMAGES, p))
