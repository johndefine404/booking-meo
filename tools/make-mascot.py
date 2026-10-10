"""[Define404] 냥 시리즈 고양이 마스코트: 로티(JSON)와 로고(SVG)를 같은 도형 정의에서 만든다.

흰 덩어리 고양이(몸, 귀 둘, 말린 꼬리, 먹색 눈, 수염). 원 색과 배지는 제품마다 다르다.
사용: python3 tools/make-mascot.py   → widget/mascot.json, widget/logo.svg, widget/cat.svg
구간: 0~90 대기(꼬리 살랑, 깜빡임, 귀 쫑긋), 90~150 답변 중(몸 들썩, 꼬리 빠르게)
다른 냥 저장소의 로고도 이 파일의 도형을 가져다 쓴다(import 해서 cat_svg, logo_svg 사용).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W = H = 120
CAT = "#FFFFFF"       # 흰 고양이 (2026-10-11 김팀장: 아이콘 고양이 흰색 통일)
INK = "#141414"
BRAND = "#E5670E"     # 부킹냥 원 색

# 도형 정의 (로티와 SVG 공용). 120 x 120 원 안 가운데에 앉도록 배치했다.
BODY = (16, 47, 68, 44, 22)                       # x, y, 폭, 높이, 모서리
EAR_L = [(20, 57), (25, 27), (44, 49)]
EAR_R = [(58, 49), (74, 29), (80, 57)]
TAIL = [((82, 83), (0, 0), (12, -4)),             # (꼭짓점, 들어오는 손잡이, 나가는 손잡이), 상대값
        ((97, 51), (3, 14), (-2, -10)),
        ((82, 37), (6, -2), (0, 0))]
TAIL_W = 10
EYES = [(37, 72, 6, 9), (57, 72, 6, 9)]
WHISKERS = [[(15, 74), (26, 73)], [(15, 80), (26, 78)], [(68, 73), (79, 74)], [(68, 78), (79, 80)]]
WHISKER_W = 1.8


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


def rect(x, y, w, h, r):
    return {"ty": "rc", "p": st([x + w / 2, y + h / 2]), "s": st([w, h]), "r": st(r), "d": 1}


def poly(points, closed=True):
    z = [[0, 0]] * len(points)
    return {"ty": "sh", "ks": st({"i": z, "o": z, "v": [list(p) for p in points], "c": closed})}


def curve(nodes):
    return {"ty": "sh", "ks": st({"v": [list(v) for v, _, _ in nodes], "i": [list(i) for _, i, _ in nodes],
                                  "o": [list(o) for _, _, o in nodes], "c": False})}


def group(name, items, transform=None):
    return {"ty": "gr", "nm": name, "it": items + [transform or tr()]}


def lottie(name="booking-meo", body=CAT, feat=INK):
    tail_base = TAIL[0][0]
    ear_base = (69, 53)
    tail_wag = anim([(0, 0), (22, -8), (45, 0), (67, -8), (90, 0),
                     (98, -10), (106, 0), (114, -10), (122, 0), (130, -10), (138, 0), (150, 0)], 1)
    blink = anim([(38, [100, 100]), (41, [100, 8]), (44, [100, 100]),
                  (118, [100, 100]), (121, [100, 8]), (124, [100, 100])], 2)
    ear = anim([(58, 0), (61, 12), (64, 0), (67, 6), (70, 0)], 1)
    bob = anim([(90, [60, 60]), (100, [60, 56]), (110, [60, 60]), (120, [60, 56]),
                (130, [60, 60]), (140, [60, 56]), (150, [60, 60])], 2)
    eye_c = ((EYES[0][0] + EYES[1][0]) / 2, EYES[0][1])
    shapes = [
        # 로티는 배열 앞쪽 그룹이 위에 그려진다
        group("whiskers", [poly(w, False) for w in WHISKERS] + [stroke(feat, WHISKER_W)]),
        group("eyes", [ellipse(*e) for e in EYES] + [fill(feat)], tr(p=eye_c, a=eye_c, s=blink)),
        group("body", [rect(*BODY), fill(body)]),
        group("ear-r", [poly(EAR_R), fill(body)], tr(p=ear_base, a=ear_base, r=ear)),
        group("ear-l", [poly(EAR_L), fill(body)]),
        group("tail", [curve(TAIL), stroke(body, TAIL_W)], tr(p=tail_base, a=tail_base, r=tail_wag)),
    ]
    return {
        "v": "5.7.4", "fr": 30, "ip": 0, "op": 150, "w": W, "h": H, "nm": name, "ddd": 0, "assets": [],
        "markers": [{"tm": 0, "cm": "idle", "dr": 90}, {"tm": 90, "cm": "typing", "dr": 60}],
        "layers": [{
            "ddd": 0, "ind": 1, "ty": 4, "nm": "cat", "sr": 1, "ao": 0, "bm": 0,
            "ks": {"o": st(100), "r": st(0), "p": bob, "a": st([60, 60, 0]), "s": st([100, 100, 100])},
            "shapes": shapes, "ip": 0, "op": 150, "st": 0,
        }],
    }


def pts(p):
    return " ".join(f"{x},{y}" for x, y in p)


def tail_d():
    (v0, _, o0), (v1, i1, o1), (v2, i2, _) = TAIL
    c = lambda v, d: f"{v[0] + d[0]},{v[1] + d[1]}"
    return f"M{v0[0]},{v0[1]} C{c(v0, o0)} {c(v1, i1)} {v1[0]},{v1[1]} C{c(v1, o1)} {c(v2, i2)} {v2[0]},{v2[1]}"


def cat_svg(body=CAT, feat=INK, whiskers=True):
    x, y, w, h, r = BODY
    parts = [
        f'<path d="{tail_d()}" fill="none" stroke="{body}" stroke-width="{TAIL_W}" stroke-linecap="round"/>',
        f'<polygon points="{pts(EAR_L)}" fill="{body}"/>',
        f'<polygon points="{pts(EAR_R)}" fill="{body}"/>',
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{body}"/>',
    ]
    parts += [f'<ellipse cx="{a}" cy="{b}" rx="{c / 2}" ry="{d / 2}" fill="{feat}"/>' for a, b, c, d in EYES]
    if whiskers:
        parts += [f'<polyline points="{pts(p)}" fill="none" stroke="{feat}" stroke-width="{WHISKER_W}" '
                  f'stroke-linecap="round"/>' for p in WHISKERS]
    return "".join(parts)


def logo_svg(circle, badge="", label=None, whiskers=True):
    head = f' role="img" aria-label="{label}"><title>{label}</title>' if label else ">"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"{head}'
            f'<circle cx="60" cy="60" r="60" fill="{circle}"/>{cat_svg(whiskers=whiskers)}{badge}</svg>')


def main():
    (ROOT / "widget" / "mascot.json").write_text(json.dumps(lottie(), separators=(",", ":")))
    (ROOT / "widget" / "logo.svg").write_text(logo_svg(BRAND))
    (ROOT / "widget" / "cat.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">{cat_svg()}</svg>')
    print("ok")


if __name__ == "__main__":
    main()
