"""[Define404] 부킹냥 고양이 마스코트: 로티(JSON)와 로고(SVG)를 같은 도형 정의에서 만든다.
사용: python3 tools/make-mascot.py   → widget/mascot.json, widget/logo.svg
구간: 0~90 대기(깜빡임, 귀 쫑긋), 90~150 답변 중(고개 끄덕임)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W = H = 120
BRAND = "#C94A22"
WHITE = "#FFFFFF"
INNER = "#FFB6A3"
DARK = "#2A211D"
WHISKER = "#D8CFCA"


def rgb(hex_):
    h = hex_.lstrip("#")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [1]


def st(v):
    return {"a": 0, "k": v}


def anim(keys, dims):
    out = []
    for i, (t, v) in enumerate(keys):
        k = {"t": t, "s": v if isinstance(v, list) else [v]}
        if i < len(keys) - 1:
            k["i"] = {"x": [0.4] * dims, "y": [1] * dims}
            k["o"] = {"x": [0.6] * dims, "y": [0] * dims}
        out.append(k)
    return {"a": 1, "k": out}


def tr(p=(0, 0), a=(0, 0), s=None, r=None):
    return {"ty": "tr", "p": st(list(p)), "a": st(list(a)), "s": s or st([100, 100]), "r": r or st(0),
            "o": st(100), "sk": st(0), "sa": st(0)}


def fill(c):
    return {"ty": "fl", "c": st(rgb(c)), "o": st(100), "r": 1}


def stroke(c, w):
    return {"ty": "st", "c": st(rgb(c)), "o": st(100), "w": st(w), "lc": 2, "lj": 2}


def ellipse(cx, cy, w, h):
    return {"ty": "el", "p": st([cx, cy]), "s": st([w, h]), "d": 1}


def poly(points, closed=True):
    z = [[0, 0]] * len(points)
    return {"ty": "sh", "ks": st({"i": z, "o": z, "v": [list(p) for p in points], "c": closed})}


def group(name, items, transform=None):
    return {"ty": "gr", "nm": name, "it": items + [transform or tr()]}


# 도형 정의 (SVG 와 공유)
EAR_L = [(27, 56), (33, 20), (55, 42)]
EAR_R = [(93, 56), (87, 20), (65, 42)]
IN_L = [(34, 48), (36, 30), (48, 42)]
IN_R = [(86, 48), (84, 30), (72, 42)]
HEAD = (60, 68, 80, 66)
EYES = [(46, 67, 9, 11), (74, 67, 9, 11)]
NOSE = [(56, 75), (64, 75), (60, 80)]
MOUTH = [[(60, 80), (55, 84)], [(60, 80), (65, 84)]]
WHISKERS = [[(24, 74), (40, 76)], [(25, 82), (40, 80)], [(96, 74), (80, 76)], [(95, 82), (80, 80)]]

ear_twitch = anim([(58, 0), (61, -14), (64, 0), (67, -8), (70, 0)], 1)
blink = anim([(38, [100, 100]), (41, [100, 8]), (44, [100, 100]),
              (118, [100, 100]), (121, [100, 8]), (124, [100, 100])], 2)
bob = anim([(90, [60, 60]), (100, [60, 55]), (110, [60, 60]), (120, [60, 55]),
            (130, [60, 60]), (140, [60, 55]), (150, [60, 60])], 2)

shapes = [
    # lottie 는 배열 앞쪽 그룹이 위에 그려진다
    group("whiskers", [poly(w, False) for w in WHISKERS] + [stroke(WHISKER, 2)]),
    group("mouth", [poly(m, False) for m in MOUTH] + [stroke(DARK, 2)]),
    group("nose", [poly(NOSE), fill(INNER)]),
    group("eyes", [ellipse(*e) for e in EYES] + [fill(DARK)],
          tr(p=(60, 67), a=(60, 67), s=blink)),
    group("head", [ellipse(*HEAD), fill(WHITE)]),
    group("ear-r", [group("in", [poly(IN_R), fill(INNER)]), group("out", [poly(EAR_R), fill(WHITE)])],
          tr(p=(79, 50), a=(79, 50), r=ear_twitch)),
    group("ear-l", [group("in", [poly(IN_L), fill(INNER)]), group("out", [poly(EAR_L), fill(WHITE)])]),
]

lottie = {
    "v": "5.7.4", "fr": 30, "ip": 0, "op": 150, "w": W, "h": H, "nm": "booking-meo", "ddd": 0, "assets": [],
    "markers": [{"tm": 0, "cm": "idle", "dr": 90}, {"tm": 90, "cm": "typing", "dr": 60}],
    "layers": [{
        "ddd": 0, "ind": 1, "ty": 4, "nm": "cat", "sr": 1, "ao": 0, "bm": 0,
        "ks": {"o": st(100), "r": st(0), "p": bob, "a": st([60, 60, 0]), "s": st([100, 100, 100])},
        "shapes": shapes, "ip": 0, "op": 150, "st": 0,
    }],
}
(ROOT / "widget" / "mascot.json").write_text(json.dumps(lottie, separators=(",", ":")))


def pts(p):
    return " ".join(f"{x},{y}" for x, y in p)


def cat_svg():
    parts = [
        f'<polygon points="{pts(EAR_L)}" fill="{WHITE}"/>',
        f'<polygon points="{pts(IN_L)}" fill="{INNER}"/>',
        f'<polygon points="{pts(EAR_R)}" fill="{WHITE}"/>',
        f'<polygon points="{pts(IN_R)}" fill="{INNER}"/>',
        f'<ellipse cx="{HEAD[0]}" cy="{HEAD[1]}" rx="{HEAD[2] / 2}" ry="{HEAD[3] / 2}" fill="{WHITE}"/>',
    ]
    parts += [f'<ellipse cx="{x}" cy="{y}" rx="{w / 2}" ry="{h / 2}" fill="{DARK}"/>' for x, y, w, h in EYES]
    parts.append(f'<polygon points="{pts(NOSE)}" fill="{INNER}"/>')
    parts += [f'<polyline points="{pts(m)}" fill="none" stroke="{DARK}" stroke-width="2" stroke-linecap="round"/>' for m in MOUTH]
    parts += [f'<polyline points="{pts(w)}" fill="none" stroke="{WHISKER}" stroke-width="2" stroke-linecap="round"/>' for w in WHISKERS]
    return "".join(parts)


svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
       f'<circle cx="60" cy="60" r="60" fill="{BRAND}"/>{cat_svg()}</svg>')
(ROOT / "widget" / "logo.svg").write_text(svg)
(ROOT / "widget" / "cat.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">{cat_svg()}</svg>')
print("ok", len(json.dumps(lottie)))
