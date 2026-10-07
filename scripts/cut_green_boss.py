"""Flood-fill chroma cut from image edges. Keeps green on the character if not edge-connected."""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image

# Target chroma + tolerance (AI greens vary)
DEF_RGB = (0, 255, 0)
TOL = 95


def near_green(r: int, g: int, b: int, tol: int = TOL) -> bool:
    # Strong green channel, not too reddish/blueish
    if g < 90:
        return False
    if g < r + 25 and g < b + 25:
        return False
    # Distance to pure green in a soft way
    dr, dg, db = r - DEF_RGB[0], g - DEF_RGB[1], b - DEF_RGB[2]
    # Prefer "green-ish background" over exact match
    return g >= 140 and g >= r + 40 and g >= b + 40 and (abs(dr) + abs(dg) + abs(db)) < 420


def cut(path_in: Path, path_out: Path) -> None:
    im = Image.open(path_in).convert("RGBA")
    w, h = im.size
    px = im.load()
    kill = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_push(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or kill[y][x]:
            return
        r, g, b, a = px[x, y]
        if a == 0 or not near_green(r, g, b):
            return
        kill[y][x] = True
        q.append((x, y))

    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            try_push(nx, ny)

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if kill[y][x]:
                continue
            r, g, b, a = px[x, y]
            if near_green(r, g, b, tol=TOL + 30) and g > r + 20 and g > b + 20:
                continue
            opx[x, y] = (r, g, b, a)

    # Second pass: erase green fringe glued to transparent edges.
    px2 = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px2[x, y]
            if a == 0:
                continue
            if not (g > r + 35 and g > b + 35 and g > 120):
                continue
            edge = False
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if nx < 0 or ny < 0 or nx >= w or ny >= h or px2[nx, ny][3] == 0:
                    edge = True
                    break
            if edge:
                px2[x, y] = (0, 0, 0, 0)

    path_out.parent.mkdir(parents=True, exist_ok=True)
    out.save(path_out, "PNG")
    print(f"OK {path_in.name} -> {path_out}")


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: cut_green_boss.py <in> <out.png>")
        sys.exit(1)
    cut(Path(sys.argv[1]), Path(sys.argv[2]))


if __name__ == "__main__":
    main()
