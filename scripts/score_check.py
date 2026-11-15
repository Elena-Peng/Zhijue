"""验证识别排序：用与前端一致的算法给每张参考图/真实照片打分，看第一名是否正确。

用法：python scripts/score_check.py <图片路径...>
不带参数时跑 public/images 下所有品种参考图。
"""
from PIL import Image
import colorsys
import os
import sys
import math

SAMPLE = 96
IMAGES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images")

PROFILES = {
    "monstera":   dict(hue=120.6, light=0.28, sat=0.29, fill=0.29, aspect=1.12, yellow=0.01, bright=0.05, green=0.25, brown=0.12, greenEdge=0.058, subject=0.23),
    "pothos":     dict(hue=96.3, light=0.41, sat=0.43, fill=0.31, aspect=0.97, yellow=0.06, bright=0.04, green=0.26, brown=0.08, greenEdge=0.077, subject=0.25),
    "succulent":  dict(hue=77.7, light=0.42, sat=0.23, fill=0.18, aspect=1.32, yellow=0.06, bright=0.24, green=0.14, brown=0.14, greenEdge=0.080, subject=0.10),
    "snake":      dict(hue=84.8, light=0.28, sat=0.38, fill=0.31, aspect=0.85, yellow=0.42, bright=0.10, green=0.22, brown=0.06, greenEdge=0.088, subject=0.10),
    "fiddle":     dict(hue=89.6, light=0.23, sat=0.35, fill=0.15, aspect=0.61, yellow=0.03, bright=0.14, green=0.12, brown=0.25, greenEdge=0.061, subject=0.09),
    "peace-lily": dict(hue=89.5, light=0.23, sat=0.43, fill=0.45, aspect=0.67, yellow=0.10, bright=0.00, green=0.37, brown=0.07, greenEdge=0.062, subject=0.28),
    "aloe":       dict(hue=92.1, light=0.43, sat=0.23, fill=0.14, aspect=1.22, yellow=0.00, bright=0.59, green=0.11, brown=0.01, greenEdge=0.122, subject=0.09),
    "rubber":     dict(hue=110.2, light=0.14, sat=0.37, fill=0.26, aspect=0.97, yellow=0.00, bright=0.40, green=0.17, brown=0.03, greenEdge=0.043, subject=0.04),
    "spider":     dict(hue=96.3, light=0.62, sat=0.48, fill=0.28, aspect=0.99, yellow=0.26, bright=0.05, green=0.26, brown=0.04, greenEdge=0.099, subject=0.26),
}
WEIGHT = dict(hue=.16, light=.12, sat=.12, fill=.08, aspect=.08, yellow=.10, bright=.06, green=.07, brown=.07, greenEdge=.05, subject=.09)
SIGMA = dict(hue=12, light=.1, sat=.09, fill=.14, aspect=.3, yellow=.1, bright=.1, green=.09, brown=.08, greenEdge=.03, subject=.1)


def is_plant(h, s, l):
    return 55 <= h <= 185 and s > 0.1 and 0.04 < l < 0.92


def features(path):
    im = Image.open(path).convert("RGB").resize((SAMPLE, SAMPLE), Image.LANCZOS)
    px = list(im.getdata())
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
    gh = gl = gs = esum = ecnt = gesum = gecnt = 0.0
    for y in range(ry0, ry1 + 1):
        for x in range(rx0, rx1 + 1):
            i = y * SAMPLE + x
            h, s, l = hue[i], sat[i], lig[i]
            if mask[i]:
                green += 1; gh += h; gl += l; gs += s
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
                esum += d; ecnt += 1
                if mask[i] and mask[j]:
                    gesum += d; gecnt += 1

    bbox = (maxx - minx + 1) * (maxy - miny + 1) if maxx >= 0 else 0
    return dict(
        hue=gh / green if green else 0,
        light=gl / green if green else 0.5,
        sat=gs / green if green else 0,
        green=green / crop, yellow=yellow / crop, brown=brown / crop,
        dark=dark / crop, bright=bright / crop,
        fill=green / bbox if bbox else 0,
        aspect=(maxy - miny + 1) / (maxx - minx + 1) if maxx >= 0 else 1,
        greenEdge=gesum / gecnt if gecnt else 0,
        edge=esum / ecnt if ecnt else 0,
        subject=sum(mask) / total,
    )


def score(f, prof):
    return sum(w * math.exp(-0.5 * ((f[k] - prof[k]) / SIGMA[k]) ** 2) for k, w in WEIGHT.items())


def softmax(vals, t):
    m = max(vals)
    e = [math.exp((v - m) / t) for v in vals]
    s = sum(e)
    return [x / s for x in e]


for path in (sys.argv[1:] or sorted(glob := [os.path.join(IMAGES, f) for f in os.listdir(IMAGES) if f.endswith(".jpg") and not f.startswith(("balcony", "disease-leaf"))])):
    f = features(path)
    rows = sorted(((k, score(f, p)) for k, p in PROFILES.items()), key=lambda r: -r[1])
    top, second = rows[0], rows[1]
    strength = max(0, min(1, (top[1] - 0.58) / 0.3)) if (f["subject"] >= 0.06 and f["green"] >= 0.06) else 0
    shares = softmax([r[1] for r in rows], 0.09)
    view = ", ".join(f"{n} {strength * shares[i] * 100:.0f}%" for i, (n, _) in enumerate(rows[:3]))
    flag = "OK " if os.path.basename(path).split(".")[0].replace("2", "") in (top[0], top[0].replace("-lily", "")) else "?? "
    print(f"{flag}{os.path.basename(path):16s} top={top[0]}({top[1]:.3f}) gap={top[1]-second[1]:.3f} sub={f['subject']:.2f} | {view}")
