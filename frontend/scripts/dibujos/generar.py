"""Genera los dibujos de productos (frontend/public/dibujos/*.svg), dibujados con tiza.

Uso (desde frontend/): python3 -I scripts/dibujos/generar.py

Todos comparten el mismo estilo, que vive aquí y no en cada archivo:
  - lienzo de 64x64, trazo de tiza blanca de 2,6 px con puntas redondeadas, SIN rellenos (se
    dibujan sobre la pizarra de la app);
  - un filtro "tiza" dentro de cada SVG que deforma un poco el trazo y lo granula;
  - las pepitas y motas son puntos de tiza; los brillos, un borrón muy leve.
Los envases (botellas, botes, latas, bolsas, bricks…) salen de plantillas con parámetros: así un
"bote de miel" y un "bote de aceitunas" son claramente de la misma familia.

Los colores que aparecen abajo (RED, GREEN…) son de cuando los dibujos eran a color: las primitivas
los ignoran y todo sale en tiza. Se dejan para poder distinguir las piezas al leer el código.

Qué dibujo le toca a cada producto lo decide frontend/src/products/drawings.ts.
"""
from pathlib import Path
import re

CHALK = "#f1efe7"
INK = CHALK  # el trazo de todos los dibujos
OUT = Path(__file__).resolve().parents[2] / "public" / "dibujos"

RED, RED_D, ORANGE, YELLOW = "#e04f3c", "#b53a2c", "#f2994a", "#f6cf4b"
GREEN, GREEN_D, GREEN_L = "#6dae4f", "#3e7d3a", "#b5d76b"
BROWN, BROWN_D, BREAD, CRUST = "#a46a3e", "#6e4428", "#e8b56a", "#c88743"
CREAM, WHITE, PINK, PINK_L = "#f7ecd4", "#ffffff", "#ee9a92", "#f6c9c0"
MEAT, FAT, SALMON, PURPLE = "#c9463d", "#f7e3da", "#f49a72", "#6c3a6f"
FISH, FISH_B, BLUE, BLUE_L = "#a9bccb", "#6f93b8", "#5e93d6", "#bfddf5"
GLASS, SILVER, GREY, BLACK = "#e3f1f6", "#d8dde2", "#c9c4c8", "#3a3438"
CHOC, CARAMEL, LILAC, PINK_P = "#7a4a2e", "#c77b2e", "#c9a7e0", "#f2b7c4"

# Lo que era una mancha de color sin contorno (la pulpa del kiwi, el contenido de un bote) pasa a
# ser un trazo fino y más suave; lo pequeño (pepitas, ojos) sigue siendo un punto de tiza.
SOFT = f'fill="none" stroke="{CHALK}" stroke-width="1.4" stroke-opacity=".6"'


def _shape(tag, attrs, extra, small):
    if 'stroke="none"' in extra:
        rest = extra.replace('stroke="none"', "")
        return f'<{tag} {attrs} fill="{CHALK}" stroke="none" {rest}/>' if small else f'<{tag} {attrs} {SOFT} {rest}/>'
    return f'<{tag} {attrs} fill="none" {extra}/>'


# --- primitivas ---------------------------------------------------------------------------------
def c(cx, cy, r, fill, extra=""):
    return _shape("circle", f'cx="{cx}" cy="{cy}" r="{r}"', extra, r <= 3)


def e(cx, cy, rx, ry, fill, rot=None, extra=""):
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ""
    return _shape("ellipse", f'cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"{t}', extra, max(rx, ry) <= 3)


def r(x, y, w, h, rx, fill, extra=""):
    return _shape("rect", f'x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"', extra, w * h <= 16)


def p(d, fill="none", extra=""):
    return _shape("path", f'd="{d}"', extra, False)


def line(d, width=2.4, color=INK):
    """Detalles (vetas, rayas, costuras): más finos y suaves que el contorno."""
    return f'<path d="{d}" fill="none" stroke="{CHALK}" stroke-width="{min(width, 1.8)}" stroke-opacity=".75"/>'


def dots(points, fill, rad=1.4):
    """Puntitos de tiza (pepitas, poros, motas)."""
    return "".join(f'<circle cx="{x}" cy="{y}" r="{rad}" fill="{CHALK}" stroke="none"/>' for x, y in points)


def hl(d):
    """El brillo: un borrón de tiza muy leve."""
    return f'<path d="{d}" fill="{CHALK}" fill-opacity=".16" stroke="none"/>'


def hl_e(cx, cy, rx, ry, rot=-25):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{CHALK}" fill-opacity=".16" stroke="none" transform="rotate({rot} {cx} {cy})"/>'


def leaf(x, y, rot=0, fill=GREEN, size=1.0):
    s = size
    return f'<path d="M0 0 C{4*s} {-6*s} {12*s} {-6*s} {14*s} {-3*s} C{10*s} {1*s} {4*s} {2*s} 0 0Z" fill="none" transform="translate({x} {y}) rotate({rot})"/>'


# --- plantillas de envases ----------------------------------------------------------------------
def bottle(body, cap, label, mark=""):
    """Botella de cuello medio (aceite, vinagre, zumo de cristal…)."""
    return (r(25, 4, 14, 7, 2, cap)
            + p("M26 11 L38 11 L38 16 C38 20 46 23 46 31 L46 55 C46 57 44 58 42 58 L22 58 C20 58 18 57 18 55 L18 31 C18 23 26 20 26 16Z", body)
            + r(18, 34, 28, 15, 0, label) + mark + hl("M22 30 C22 26 25 24 27 23 L27 52 L22 52Z"))


def wine(body, label, cap):
    """Botella alta de cuello largo (vino, cava, cerveza)."""
    return (r(28, 3, 8, 8, 1.5, cap)
            + p("M28 11 L36 11 L36 22 C36 25 44 27 44 34 L44 56 C44 57.5 43 58 41.5 58 L22.5 58 C21 58 20 57.5 20 56 L20 34 C20 27 28 25 28 22Z", body)
            + r(20, 38, 24, 13, 0, label) + hl("M23.5 33 C23.5 30 25.5 29 27 28 L27 54 L23.5 54Z"))


def beer(body, label):
    return (r(28, 5, 8, 5, 1.5, "#e3c15a")
            + p("M28.5 10 L35.5 10 L35.5 22 C35.5 26 42 28 42 35 L42 56 C42 57.5 41 58 39.5 58 L24.5 58 C23 58 22 57.5 22 56 L22 35 C22 28 28.5 26 28.5 22Z", body)
            + r(22, 38, 20, 12, 0, label) + hl("M25 34 C25 31 26.5 30 28 29 L28 54 L25 54Z"))


def water(body, cap, bubbles=False):
    b = (r(26, 4, 12, 6, 2, cap)
         + p("M27 10 L37 10 L37 14 C42 16 46 20 46 26 L46 55 C46 57 44 58 42 58 L22 58 C20 58 18 57 18 55 L18 26 C18 20 22 16 27 14Z", body)
         + line("M18 32 L46 32 M18 46 L46 46", 1.6) + r(18, 34, 28, 10, 0, BLUE))
    if bubbles:
        b += c(26, 52, 1.6, WHITE, 'stroke-width="1.2"') + c(33, 50, 1.2, WHITE, 'stroke-width="1.2"') + c(39, 53, 1.8, WHITE, 'stroke-width="1.2"') + c(30, 28, 1.4, WHITE, 'stroke-width="1.2"') + c(38, 25, 1.8, WHITE, 'stroke-width="1.2"')
    return b + hl("M21.5 27 C21.5 22 24 19 27 18 L27 30 L21.5 30Z")


def brick(label, mark=""):
    """Brick con tejadillo (leche, zumo, caldo, bebidas vegetales)."""
    return (p("M38 22 L46 17 L46 52 L38 57Z", "#e4dee3")
            + p("M28 12 L36 7 L46 17 L38 22Z", "#ece7eb")
            + p("M18 22 L28 12 L38 22Z", WHITE)
            + r(18, 22, 20, 35, 0, WHITE)
            + r(18, 31, 20, 17, 0, label) + mark + hl("M20.5 24 L23.5 24 L23.5 54 L20.5 54Z"))


def jar(content, lid, mark="", label=None):
    b = r(12, 11, 40, 9, 3, lid) + r(14, 20, 36, 37, 7, GLASS) + r(17, 27, 30, 27, 5, content, 'stroke="none"')
    if label:
        b += r(14, 32, 36, 13, 0, label)
    return b + mark + hl("M18 23 L22 23 L22 50 L18 50Z")


def small_jar(content, lid):
    """Bote de especias."""
    return r(21, 12, 22, 9, 2.5, lid) + r(22, 21, 20, 34, 4, GLASS) + r(24, 30, 16, 23, 3, content, 'stroke="none"') + r(22, 32, 20, 10, 0, WHITE) + hl("M25 23 L28 23 L28 30 L25 30Z")


def can(label, mark="", body=SILVER):
    return (r(16, 14, 32, 42, 5, body) + r(16, 22, 32, 26, 0, label) + mark
            + e(32, 14, 16, 4, body) + hl("M19.5 25 L23.5 25 L23.5 45 L19.5 45Z"))


def soda(color, mark=""):
    return (r(19, 10, 26, 46, 5, color) + p("M21 10 L23 6 L41 6 L43 10Z", SILVER) + mark
            + hl("M22.5 14 L26 14 L26 50 L22.5 50Z"))


def bag(color, window=None, mark="", fold=True):
    """Bolsa o paquete de pie (arroz, harina, legumbres, café…)."""
    b = p("M15 14 L49 14 L51 56 C51 57.5 50 58 48.5 58 L15.5 58 C14 58 13 57.5 13 56Z", color)
    if fold:
        b += r(14, 8, 36, 7, 1.5, color) + line("M18 11.5 L46 11.5", 1.4)
    if window:
        b += r(20, 26, 24, 20, 4, window)
    return b + mark + hl("M17 18 L21 18 L20 52 L16.5 52Z")


def box(color, side, mark=""):
    return (p("M46 12 L53 17 L53 58 L46 56Z", side) + r(12, 12, 34, 44, 2, color) + mark
            + hl("M15 15 L19 15 L19 52 L15 52Z"))


def jug(color, cap=WHITE, label=WHITE):
    """Garrafa con asa (detergente, suavizante, friegasuelos, lejía)."""
    return (r(15, 7, 13, 7, 2, cap)
            + p("M14 18 C14 15 16 14 18 14 L38 14 C44 14 50 19 50 26 L50 55 C50 57 48 58 46 58 L18 58 C16 58 14 57 14 55Z", color)
            + p("M34 20 C40 20 44 23 44 28 C44 31 41 31 39 31 L34 31Z", WHITE)
            + r(18, 36, 24, 16, 2, label) + hl("M17.5 20 L21 20 L21 52 L17.5 52Z"))


def slim(color, cap):
    """Botella estrecha con tapón abatible (lavavajillas a mano, gel)."""
    return (p("M27 4 L37 4 L37 12 L27 12Z", cap)
            + p("M24 12 L40 12 C44 16 45 22 45 28 L45 55 C45 57 43 58 41 58 L23 58 C21 58 19 57 19 55 L19 28 C19 22 20 16 24 12Z", color)
            + r(19, 34, 26, 14, 0, WHITE) + hl("M22.5 18 L26 18 L26 52 L22.5 52Z"))


def spray(color, head=WHITE):
    return (p("M21 27 L41 27 L44 55 C44 57 43 58 41 58 L21 58 C19 58 18 57 18 55Z", color)
            + p("M24 27 L24 17 L38 17 C44 17 50 20 52 24 L44 24 L41 27Z", head)
            + p("M30 23 L28 33 L33 33 L34 23", "none")
            + r(21, 38, 20, 13, 0, WHITE) + hl("M22 30 L25 30 L25 54 L22 54Z"))


def aerosol(color, cap):
    return (r(27, 6, 10, 7, 2, cap) + r(21, 13, 22, 4, 2, SILVER) + r(20, 17, 24, 39, 4, color)
            + r(20, 30, 24, 13, 0, WHITE) + hl("M23 20 L26.5 20 L26.5 52 L23 52Z"))


def shampoo(color, cap=WHITE, label=WHITE):
    return (r(24, 8, 16, 9, 3, cap)
            + p("M20 17 L44 17 C46 17 47 18.5 47 20 L46 55 C46 57 44 58 42 58 L22 58 C20 58 18 57 18 55 L17 20 C17 18.5 18 17 20 17Z", color)
            + r(18, 32, 28, 16, 3, label) + hl("M21 21 L24.5 21 L24.5 53 L21 53Z"))


def tube(color, cap, stripe=None):
    b = (p("M8 22 L12 20 L12 44 L8 42Z", color) + p("M12 20 L44 24 L44 40 L12 44Z", color)
         + r(44, 26, 10, 12, 2, cap))
    if stripe:
        b += p("M18 27.5 L38 29.5 L38 34.5 L18 36.5Z", stripe)
    return b + hl("M14 23 L40 26.5 L40 28.5 L14 26Z")


def roll(color, end, sheet=True):
    b = ""
    if sheet:
        b += p("M14 46 L14 56 L40 56 L40 46Z", color)
    b += (r(12, 18, 32, 30, 0, color) + e(44, 33, 8, 15, end) + e(44, 33, 3, 6, "#cfc8cd")
          + e(12, 33, 8, 15, color) + hl("M14 21 L40 21 L40 24 L14 24Z"))
    return b


def pack(color, mark=""):
    """Paquete blando (toallitas, pañales)."""
    return r(9, 20, 46, 32, 10, color) + mark + hl("M14 24 L19 24 L19 46 L14 46Z")


def glass_drink(color):
    return (p("M17 12 L47 12 L43 56 C43 57 42 58 41 58 L23 58 C22 58 21 57 21 56Z", GLASS)
            + p("M18.8 24 L45.2 24 L43 54 L21 54Z", color, 'stroke="none"')
            + line("M18.8 24 L45.2 24", 1.6) + hl("M21 15 L24.5 15 L25.5 52 L23 52Z"))


def yogurt(label):
    return (r(15, 16, 34, 7, 2.5, "#e9ecef")
            + p("M18 23 L46 23 L42.5 55 C42.3 57 41 58 39 58 L25 58 C23 58 21.7 57 21.5 55Z", WHITE)
            + p("M18.9 31 L45.1 31 L43.5 46 L20.5 46Z", label) + hl("M21.5 25 L24.5 25 L25.5 54 L23 54Z"))


def fish(body, back=None, extra=""):
    b = p("M6 33 C14 20 32 16 44 26 L56 17 L54 33 L56 49 L44 40 C32 50 14 46 6 33Z", body)
    if back:
        b += p("M10 28 C18 20 32 18 42 25 C32 23 20 24 10 30Z", back, 'stroke="none"')
    return (b + extra + line("M22 24 C25 29 25 37 22 42", 2) + c(15, 30, 2.6, INK, 'stroke="none"')
            + c(14.2, 29.2, 0.8, WHITE, 'stroke="none"'))


def sausage_log(color, slice_color, fat=None):
    b = (r(6, 22, 40, 20, 10, color) + line("M8 26 L4 22 M8 38 L4 42", 1.8)
         + c(48, 34, 11, slice_color))
    if fat:
        b += dots([(44, 30), (50, 29), (52, 35), (46, 37), (49, 40), (44, 34.5)], fat, 1.6)
    return b + hl("M12 25 L38 25 L38 28 L12 28Z")


DRAWINGS: dict[str, str] = {}


def draw(key, body):
    DRAWINGS[key] = body


# --- frutas y verduras --------------------------------------------------------------------------
draw("manzana", p("M32 20 C24 12 10 16 10 32 C10 46 20 56 28 55 C30 54.5 34 54.5 36 55 C44 56 54 46 54 32 C54 16 40 12 32 20Z", RED)
     + line("M32 20 C32 15 33 11 36 8") + leaf(34, 14, -35) + hl_e(20, 30, 3.5, 7, 20))
draw("naranja", c(32, 35, 21, ORANGE) + line("M32 14 L32 10") + leaf(32, 11, -30, GREEN_D)
     + dots([(24, 30), (38, 27), (42, 40), (28, 44), (35, 36)], "#d97b2b", 1.2) + hl_e(22, 28, 3.5, 7, 30))
draw("mandarina", e(32, 38, 19, 16, "#f4a13f") + c(32, 23, 2.5, "#e48a2c") + leaf(33, 23, -40, GREEN, 1.3)
     + leaf(31, 23, 200, GREEN_D, 1.1) + hl_e(22, 33, 3, 5.5, 40))
draw("limon", c(9, 34, 2.8, YELLOW) + c(55, 34, 2.8, YELLOW) + e(32, 34, 21, 15, YELLOW)
     + leaf(34, 20, -20, GREEN) + hl_e(22, 29, 6, 2.6, -15))
draw("melocoton", c(32, 35, 20, "#f6a66e") + line("M32 16 C26 26 26 44 32 55", 1.8, "#c8693c")
     + leaf(32, 15, -35, GREEN) + hl_e(22, 29, 3.5, 6.5, 20))
draw("tomate", c(32, 37, 20, RED) + p("M32 19 L25 14 L28.5 20.5 L21 21 L28.5 23.5 L32 28 L35.5 23.5 L43 21 L35.5 20.5 L39 14Z", GREEN)
     + line("M32 19 L32 12") + hl_e(21, 33, 3.5, 6.5, 25))
draw("platano", p("M11 17 C13 38 30 52 52 46 C55 45 55 41 52 40 C34 43 22 31 20 15 C19.5 12 12 13 11 17Z", YELLOW)
     + line("M16 22 C20 36 32 44 46 43", 1.6) + p("M11 17 L9 12 L13 11 L15 15Z", BROWN_D) + c(53.5, 43, 1.8, BROWN_D, 'stroke="none"')
     + hl("M14 22 C15 30 19 36 24 41 L22 42 C17 37 13.5 30 13 22Z"))
draw("uvas", line("M32 18 L32 8") + leaf(33, 12, -10, GREEN, 1.2)
     + "".join(c(x, y, 7.2, "#8a4f98") for x, y in [(21, 25), (32, 24), (43, 25), (26.5, 36), (37.5, 36), (32, 47)])
     + dots([(19, 22.5), (30, 21.5), (41, 22.5), (24.5, 33.5), (35.5, 33.5), (30, 44.5)], "#fff", 1.6))
draw("pera", p("M32 13 C26 13 26 23 24 29 C18 35 14 41 16 49 C18 57 46 57 48 49 C50 41 46 35 40 29 C38 23 38 13 32 13Z", GREEN_L)
     + line("M32 13 C32 10 33 8 35 6") + leaf(34, 9, -30, GREEN) + hl_e(23, 44, 3, 6, 20))
draw("fresa", p("M32 57 C20 51 11 39 13 29 C14 23 22 21 32 23 C42 21 50 23 51 29 C53 39 44 51 32 57Z", RED)
     + dots([(22, 31), (30, 30), (38, 30), (44, 33), (26, 39), (34, 38), (41, 41), (30, 46), (36, 48)], YELLOW, 1.3)
     + p("M19 25 L23 16 L28 22 L32 13 L36 22 L41 16 L45 25 C38 28 26 28 19 25Z", GREEN) + hl_e(19, 34, 2.5, 5, 20))
draw("pina", p("M32 25 L23 6 L30 15 L32 3 L34 15 L41 6Z", GREEN) + p("M29 23 L19 13 L32 22 M35 23 L45 13 L32 22", GREEN)
     + e(32, 41, 15, 17, "#e9b43f") + line("M22 31 L38 53 M20 41 L30 55 M27 25 L44 48 M42 31 L26 53 M44 41 L34 55 M37 25 L20 48", 1.5, "#a8772b")
     + hl_e(24, 36, 2.5, 6, 10))
draw("sandia", p("M7 24 A25 25 0 0 0 57 24Z", GREEN_D) + p("M11 24 A21 21 0 0 0 53 24Z", "#eef3d6", 'stroke="none"')
     + p("M14 24 A18 18 0 0 0 50 24Z", RED) + line("M7 24 L57 24")
     + "".join(e(x, y, 1.3, 2.2, INK, None, 'stroke="none"') for x, y in [(22, 30), (32, 34), (42, 30), (27, 38), (37, 38), (32, 28)]))
draw("melon", e(32, 35, 23, 17, "#c9d66a") + line("M12 30 C22 25 42 25 52 30 M10 38 C22 43 42 43 54 38 M14 23 C22 21 42 21 50 23 M14 46 C24 50 40 50 50 46", 1.6, GREEN_D)
     + hl_e(19, 30, 3, 6, 40))
draw("kiwi", c(32, 34, 21, "#8b6a3e") + c(32, 34, 17, "#9cc24a", 'stroke="none"') + c(32, 34, 6, "#f2ebc8", 'stroke="none"')
     + "".join(e(32 + 10 * dx, 34 + 10 * dy, 1.1, 2, INK, None, 'stroke="none"') for dx, dy in [(1, 0), (0.7, 0.7), (0, 1), (-0.7, 0.7), (-1, 0), (-0.7, -0.7), (0, -1), (0.7, -0.7)]))
draw("aguacate", p("M32 7 C24 7 22 19 18 27 C12 37 14 57 32 57 C50 57 52 37 46 27 C42 19 40 7 32 7Z", GREEN_D)
     + p("M32 12 C27 12 26 21 22 29 C17 38 19 52 32 52 C45 52 47 38 42 29 C38 21 37 12 32 12Z", "#d8e58f", 'stroke="none"')
     + c(32, 40, 8.5, BROWN) + hl_e(29, 37, 2, 3.5, 20))
draw("zanahoria", p("M46 16 C51 20 49 25 45 29 L17 55 C15 57 11 54 13 52 L38 21 C40 17 43 14 46 16Z", ORANGE)
     + line("M26 40 L30 41 M33 32 L37 33 M20 48 L23 49", 1.6)
     + p("M44 17 C43 9 46 5 50 4 C49 8 48 12 46 16Z", GREEN) + p("M47 19 C53 14 58 15 60 18 C56 20 52 21 48 21Z", GREEN)
     + p("M46 17 C49 10 54 8 57 9 C55 12 51 15 47 18Z", GREEN_D))
draw("patata", p("M13 31 C11 21 23 14 34 16 C46 18 54 26 52 38 C50 50 36 54 26 52 C16 50 14 41 13 31Z", "#c9955b")
     + dots([(24, 27), (38, 24), (44, 38), (30, 44), (20, 40)], BROWN_D, 1.5) + hl_e(22, 24, 2.5, 5, 50))
draw("cebolla", line("M32 11 L33 5")
     + p("M32 11 C34 19 48 25 50 39 C52 51 42 57 32 57 C22 57 12 51 14 39 C16 25 30 19 32 11Z", "#d9954a")
     + line("M32 19 C26 29 24 43 28 55 M32 19 C38 29 40 43 36 55", 1.5) + line("M28 57 L27 61 M32 57 L32 61 M36 57 L37 61", 1.6)
     + hl_e(22, 38, 2.5, 6, 15))
draw("ajo", line("M32 10 L32 5")
     + p("M32 10 C34 18 50 26 50 40 C50 51 42 57 32 57 C22 57 14 51 14 40 C14 26 30 18 32 10Z", "#f4eee3")
     + line("M32 17 C28 29 27 45 30 57 M32 17 C36 29 37 45 34 57 M24 28 C19 36 19 47 23 55 M40 28 C45 36 45 47 41 55", 1.4)
     + line("M28 57 L27 61 M32 57 L32 61 M36 57 L37 61", 1.6))
draw("lechuga", p("M32 12 C38 12 40 16 44 15 C50 15 52 21 51 25 C56 28 56 35 52 38 C55 44 50 50 45 49 C42 55 36 56 32 53 C28 56 22 55 19 49 C14 50 9 44 12 38 C8 35 8 28 13 25 C12 21 14 15 20 15 C24 16 26 12 32 12Z", GREEN)
     + p("M20 27 C24 21 40 21 44 27", "none") + line("M32 53 C30 44 30 34 32 24 M32 41 C27 37 23 35 18 34 M32 35 C37 31 41 29 46 29 M32 47 C36 44 41 42 46 42"))
draw("hojas", p("M32 56 C18 50 12 32 18 14 C30 20 38 38 32 56Z", GREEN_D) + p("M32 56 C46 50 52 32 46 14 C34 20 26 38 32 56Z", GREEN)
     + line("M32 56 C27 42 22 28 19 17 M32 56 C37 42 42 28 45 17", 1.4))
draw("hierbas", line("M32 58 L32 26 M28 58 L22 30 M36 58 L42 30")
     + leaf(32, 27, -95, GREEN, 1.15) + leaf(32, 27, -85, GREEN, 1.15).replace("rotate(-85)", "rotate(-85) scale(-1 1)")
     + leaf(23, 31, -130, GREEN, 1.0) + leaf(41, 31, -50, GREEN, 1.0) + leaf(27, 42, -150, GREEN, 0.9) + leaf(37, 42, -30, GREEN, 0.9)
     + r(25, 46, 14, 5, 1.5, RED))
draw("brocoli", p("M26 35 L24 56 L40 56 L38 35", GREEN_L)
     + p("M14 32 C10 28 12 20 19 20 C20 13 28 11 32 15 C36 11 44 13 45 20 C52 20 54 28 50 32 C48 36 42 37 40 35 L24 35 C22 37 16 36 14 32Z", GREEN_D)
     + line("M32 54 L32 40 M28 48 L25 38 M36 48 L39 38") + dots([(22, 26), (30, 22), (38, 24), (44, 28), (26, 31), (36, 30)], GREEN_L, 1.5))
draw("coliflor", p("M15 44 C7 42 5 34 9 30 C13 36 19 38 25 40Z", GREEN) + p("M49 44 C57 42 59 34 55 30 C51 36 45 38 39 40Z", GREEN)
     + p("M27 42 L28 54 L36 54 L37 42", GREEN_L)
     + p("M13 34 C9 29 12 21 19 21 C20 14 28 12 32 16 C36 12 44 14 45 21 C52 21 55 29 51 34 C49 40 42 42 32 42 C22 42 15 40 13 34Z", CREAM)
     + line("M21 27 C23 25 26 26 26 29 M32 22 C34 20 37 21 37 24 M40 30 C42 28 45 29 45 32 M27 34 C29 32 32 33 32 36"))
for key, color in [("pimiento-rojo", RED), ("pimiento-verde", GREEN)]:
    draw(key, p("M20 21 C14 23 12 35 16 45 C19 53 24 57 32 55 C40 57 45 53 48 45 C52 35 50 23 44 21 C40 19 36 23 32 22 C28 23 24 19 20 21Z", color)
         + line("M32 24 C31 34 31 44 32 54 M24 24 C21 34 22 44 25 52 M40 24 C43 34 42 44 39 52", 1.4)
         + p("M25 22 C27 18 37 18 39 22 C36 24 28 24 25 22Z", GREEN_D) + line("M32 19 C32 14 34 11 38 9") + hl_e(20, 34, 2.5, 6, 10))
draw("pepino", p("M12 45 C7 41 9 34 15 30 L42 14 C48 10 56 14 54 22 C53 26 50 28 48 30 L21 47 C17 49 14 48 12 45Z", GREEN_D)
     + dots([(20, 38), (28, 34), (36, 28), (44, 22), (24, 42), (40, 30)], GREEN_L, 1.3) + hl("M17 34 L42 18 L44 20 L19 36Z"))
draw("calabacin", p("M12 45 C7 41 9 34 15 30 L42 14 C48 10 56 14 54 22 C53 26 50 28 48 30 L21 47 C17 49 14 48 12 45Z", "#4f8a3e")
     + line("M16 37 L46 19 M18 42 L50 24", 1.4, "#8fbf5c") + r(52, 10, 6, 7, 2, "#a9c06a", 'transform="rotate(35 55 13)"'))
draw("berenjena", p("M40 18 C48 22 52 36 46 46 C40 56 24 58 16 50 C10 44 14 36 22 32 C28 29 32 22 40 18Z", PURPLE)
     + p("M37 21 C38 14 45 11 50 13 C49 18 47 22 42 23Z", GREEN) + line("M48 14 L54 8") + hl_e(22, 42, 2.5, 6, 50))
draw("calabaza", r(29, 12, 6, 9, 2, BROWN) + e(22, 38, 12, 16, ORANGE) + e(42, 38, 12, 16, ORANGE) + e(32, 38, 11, 17, "#f5a85a")
     + leaf(35, 17, -20, GREEN))
draw("champinon", p("M24 36 L22 53 C22 57 42 57 42 53 L40 36Z", CREAM)
     + p("M9 35 C9 18 55 18 55 35 C55 39 9 39 9 35Z", "#c8a27a") + dots([(22, 27), (36, 24), (44, 30), (29, 32)], "#e6cfb0", 2)
     + hl_e(19, 27, 2.5, 5, 50))
draw("judias", "".join(p("M12 14 C22 28 32 40 50 50 C53 51 52 55 49 54 C30 47 18 33 10 16Z", col, f'transform="translate({dx} {dy})"')
                       for (dx, dy, col) in [(8, -6, GREEN_D), (-2, 4, GREEN), (2, -1, GREEN_L)]))
draw("puerro", p("M27 30 L17 5 L29 20Z", GREEN_D) + p("M37 30 L47 5 L35 20Z", GREEN) + p("M30 28 L32 3 L34 28Z", GREEN)
     + r(26, 26, 12, 28, 6, CREAM) + line("M28 55 L26 60 M32 55 L32 61 M36 55 L38 60", 1.6) + line("M26 34 L38 34", 1.4))
draw("guisantes", p("M8 40 C16 24 40 16 56 22 C52 36 30 48 8 40Z", GREEN) + "".join(c(x, y, 5, GREEN_L) for x, y in [(19, 35), (29, 31), (39, 28), (48, 26)])
     + line("M8 40 C24 42 44 34 56 22", 2))

# --- carnicería ---------------------------------------------------------------------------------
draw("filete", p("M11 31 C11 19 29 12 44 16 C56 20 56 36 48 44 C40 52 22 54 14 46 C10 42 11 36 11 31Z", MEAT)
     + line("M19 28 C27 24 34 30 43 26 M17 38 C25 36 32 42 45 37", 2.2, FAT) + hl_e(20, 22, 4, 2, -20))
draw("chuleta", p("M33 31 C24 22 10 27 10 38 C10 49 24 53 34 46 C38 42 38 36 33 31Z", MEAT)
     + p("M33 33 L49 20 C50 16 56 16 56 20 C60 21 59 27 54 26 L38 41Z", CREAM) + line("M16 36 C21 33 26 37 31 35", 2, FAT))
draw("muslo", p("M14 47 C6 39 10 23 24 17 C36 13 46 21 44 31 C42 38 35 40 29 44 C25 48 20 51 14 47Z", "#e8a867")
     + p("M35 39 L39 35 L48 44 C50 40 56 42 54 46 C58 46 58 52 53 51 C53 56 47 56 47 52 C43 54 41 48 44 48Z", CREAM)
     + hl_e(20, 26, 3, 6, 40))
draw("pollo", e(32, 50, 26, 5, WHITE) + e(32, 36, 22, 14, "#e3a35e") + p("M12 32 C6 30 4 24 8 21 C11 19 14 24 16 28", "#e8b06c")
     + p("M52 32 C58 30 60 24 56 21 C53 19 50 24 48 28", "#e8b06c") + c(8, 20, 2.8, CREAM) + c(56, 20, 2.8, CREAM)
     + line("M22 32 C28 28 36 28 42 32", 1.8, "#b77a38") + hl_e(22, 30, 5, 2.5, -15))
draw("pechuga", p("M11 39 C9 27 21 17 35 19 C47 21 55 31 51 41 C47 51 29 53 19 49 C14 47 12 43 11 39Z", PINK_L)
     + line("M20 34 C28 30 38 30 46 34 M20 42 C28 39 38 40 44 43", 1.5, "#e3a597") + hl_e(22, 27, 4.5, 2, -25))
draw("carne-picada", r(7, 22, 50, 30, 6, "#ebe7ea") + p("M12 40 C10 30 20 26 32 27 C44 26 54 30 52 40 C50 47 14 47 12 40Z", MEAT)
     + line("M18 34 C20 31 23 37 26 33 C29 30 31 37 35 33 C38 30 41 37 44 33 M20 41 C23 38 26 43 30 40 C33 37 36 43 40 40", 1.4, PINK))
draw("salchichas", r(7, 16, 50, 13, 6.5, "#e9a08e") + r(7, 35, 50, 13, 6.5, "#e9a08e") + line("M57 22 L61 20 M57 41 L61 43", 1.6)
     + hl("M13 19 L50 19 L50 21.5 L13 21.5Z") + hl("M13 38 L50 38 L50 40.5 L13 40.5Z"))
draw("costillas", "".join(r(x, 10, 6, 14, 3, CREAM) for x in (16, 26, 36, 46))
     + p("M9 22 C9 18 55 18 55 22 L55 46 C55 52 9 52 9 46Z", "#b8523a") + line("M19 24 L19 47 M29 24 L29 48 M39 24 L39 48 M49 24 L49 47", 1.6, "#8a3523"))
draw("hamburguesa", r(6, 18, 52, 34, 4, "#f3eee6") + e(32, 35, 20, 11, "#8a4f33")
     + dots([(24, 32), (32, 30), (40, 33), (28, 38), (37, 39), (45, 36), (20, 36)], "#5e3220", 1.5) + hl_e(24, 29, 5, 1.8, -8))

# --- pescadería ---------------------------------------------------------------------------------
draw("pescado", fish(FISH, "#8aa1b3") + hl_e(30, 37, 7, 2, -5))
draw("pescado-azul", fish("#c9d5de", FISH_B) + line("M28 34 L40 34", 1.3, "#9fb3c3"))
draw("salmon", p("M9 40 C13 24 34 18 55 22 C57 30 51 44 30 48 C20 50 11 46 9 40Z", SALMON)
     + line("M18 42 C22 34 30 27 40 24 M26 45 C30 37 38 30 49 27 M14 34 C19 28 25 24 32 22", 1.8, "#fde1d4"))
draw("gamba", p("M44 16 C57 22 57 44 41 50 C31 54 19 50 15 42 L23 38 C27 44 35 44 39 40 C45 34 43 26 37 24Z", "#f08a66")
     + p("M15 42 L6 39 L9 49 L17 47Z", "#e57552") + line("M44 24 L39 28 M47 32 L41 35 M45 41 L39 41", 1.6)
     + line("M44 16 C40 8 30 6 22 8 M46 17 C46 10 40 4 34 3", 1.5) + c(43, 21, 1.8, INK, 'stroke="none"'))
draw("mejillon", p("M12 52 C8 38 20 16 34 12 C44 10 52 18 48 28 C42 42 28 54 12 52Z", "#3d3550")
     + p("M16 48 C14 38 23 22 33 18 C40 16 45 21 43 28 C38 38 28 47 16 48Z", "#f2a65a", 'stroke="none"')
     + line("M18 44 C22 36 28 28 36 22", 1.5, "#d9853a"))
draw("pulpo", "".join(p(d, "#d9768a") for d in [
    "M20 32 C15 41 9 43 7 50 C13 51 19 45 25 37Z", "M27 35 C25 45 20 51 21 58 C27 55 30 47 32 37Z",
    "M37 35 C39 45 44 51 43 58 C37 55 34 47 32 37Z", "M44 32 C49 41 55 43 57 50 C51 51 45 45 39 37Z"])
     + e(32, 24, 15, 14, "#d9768a") + c(26, 26, 2.2, INK, 'stroke="none"') + c(38, 26, 2.2, INK, 'stroke="none"') + hl_e(25, 17, 4, 2.2, -20))

# --- charcutería y quesos -----------------------------------------------------------------------
draw("jamon", p("M14 51 C7 45 9 30 20 22 C30 14 44 12 50 16 L55 10 C57 7 61 10 59 13 L54 20 C56 31 46 45 34 51 C26 55 18 55 14 51Z", "#a83c35")
     + p("M10 44 C12 52 20 55 26 52 C20 50 14 46 12 40Z", FAT) + p("M54 10 L58 7 L61 11 L57 13Z", BLACK) + hl_e(30, 24, 7, 2.5, -30))
draw("chorizo", sausage_log("#b5402e", "#d2533b", CREAM))
draw("fuet", sausage_log("#8a5a4a", "#b8655a", "#fff5ee") + dots([(14, 32), (22, 36), (30, 31), (38, 37), (18, 39)], "#efe7e2", 1.4))
draw("lomo-embuchado", sausage_log("#7a3b2f", "#c2564a"))
for key, color in [("lonchas", PINK_L), ("lonchas-pavo", "#f3d8c8"), ("lonchas-queso", "#f7d768")]:
    draw(key, e(26, 28, 19, 13, color) + e(32, 35, 19, 13, color) + e(38, 42, 19, 13, color) + hl_e(31, 39, 7, 2, -10))
draw("queso", p("M7 37 L40 17 L57 29Z", "#f7d768") + p("M7 37 L57 29 L57 47 L7 53Z", "#f2c94c")
     + "".join(e(x, y, rx, ry, "#d9a93a", None, 'stroke="none"') for x, y, rx, ry in [(20, 44, 3.5, 2.5), (35, 40, 2.5, 2), (46, 43, 3, 2.2), (28, 28, 2.2, 1.5)]))
draw("mozzarella", c(32, 37, 19, WHITE) + p("M27 19 C28 14 36 14 37 19 C35 21 29 21 27 19Z", WHITE) + hl_e(24, 31, 4, 7, 30)
     + line("M22 46 C28 49 36 49 42 46", 1.4, "#d4ccd1"))
draw("queso-fresco", r(10, 30, 44, 20, 3, WHITE) + e(32, 50, 22, 6, WHITE) + e(32, 30, 22, 7, "#fbf8f2") + line("M10 30 L10 50 M54 30 L54 50")
     + hl("M14 34 L18 34 L18 48 L14 47Z"))
draw("bacon", "".join(p("M7 21 C15 15 22 27 30 21 C38 15 45 27 57 19 L57 29 C45 37 38 25 30 31 C22 37 15 25 7 31Z", "#e58a78", f'transform="translate(0 {dy})"')
                      + line("M9 26 C16 21 22 31 30 26 C38 21 45 31 55 24", 2, CREAM).replace('d="', f'transform="translate(0 {dy})" d="') for dy in (0, 16)))

# --- lácteos y huevos ---------------------------------------------------------------------------
draw("leche", brick(BLUE, p("M28 35 C25 39 24 42 24 43.5 C24 46 26 47 28 47 C30 47 32 46 32 43.5 C32 42 31 39 28 35Z", WHITE)))
draw("bebida-vegetal", brick("#d9b57a", leaf(22, 43, -40, GREEN_D, 1.0)))
draw("bebida-soja", brick(GREEN_L, e(28, 40, 3.5, 5, "#f3e3a8")))
draw("nata", brick("#f3e0a0", p("M23 44 C23 37 33 37 33 44Z", WHITE)))
draw("caldo", brick("#e9a23b", line("M23 36 C25 34 27 38 29 36 M27 36 C29 34 31 38 33 36", 1.4)))
draw("zumo-naranja", brick(ORANGE, c(28, 40, 5.5, "#f8c070")))
draw("zumo-pina", brick(YELLOW, e(28, 41, 4, 5.5, "#e9b43f")))
draw("huevos", e(20, 33, 7.5, 9.5, "#f3e3cc") + e(32, 30, 7.5, 9.5, "#f1d9b8") + e(44, 33, 7.5, 9.5, "#f3e3cc")
     + p("M7 38 L57 38 L53 54 L11 54Z", "#d9c5a5") + line("M20 38 L18 54 M32 38 L32 54 M44 38 L46 54", 1.4) + hl_e(30, 27, 2, 3.5, 15))
draw("yogur", yogurt("#c9a7e0"))
draw("yogur-fresa", yogurt(PINK) + c(32, 38.5, 3.5, RED, 'stroke-width="1.6"'))
draw("natillas", yogurt(YELLOW) + c(32, 38.5, 3.5, "#e0b35a", 'stroke-width="1.6"'))
draw("kefir", beer(WHITE, "#c9a7e0").replace("#e3c15a", BLUE))
draw("flan", e(32, 53, 24, 5, WHITE) + p("M16 51 L22 25 L42 25 L48 51Z", "#f2c35a") + e(32, 25, 10, 3.2, CARAMEL)
     + p("M24 26 C23 32 26 32 26 27 M38 26 C38 34 41 33 40 27", CARAMEL, 'stroke-width="1.4"') + hl("M24 32 L27 32 L24 48 L21 48Z"))
draw("mantequilla", p("M8 33 L33 23 L55 31 L30 41Z", "#f7e08a") + p("M8 33 L30 41 L30 52 L8 44Z", "#f2d46b") + p("M30 41 L55 31 L55 42 L30 52Z", "#e9c657")
     + p("M36 38.5 L55 31 L55 42 L36 49.5Z", WHITE))

# --- panadería y bollería -----------------------------------------------------------------------
draw("baguette", p("M8 47 C5 41 40 14 50 14 C58 14 58 22 52 26 C40 34 16 53 11 51Z", BREAD)
     + line("M21 39 L27 34 M30 32 L36 27 M39 25 L45 21", 2.4, CRUST) + hl("M12 44 C20 36 36 22 46 18 L47 19.5 C37 24 22 37 13 46Z"))
draw("pan-molde", p("M12 53 L12 31 C8 25 13 14 32 14 C51 14 56 25 52 31 L52 53Z", CRUST)
     + p("M16 50 L16 30 C13 26 17 18 32 18 C47 18 51 26 48 30 L48 50Z", "#f6e3bf", 'stroke="none"') + dots([(24, 30), (36, 27), (40, 38), (27, 41), (32, 34)], "#e3c99a", 1.4))
draw("croissant", p("M24 30 C16 28 10 36 8 44 C14 47 20 43 25 38Z", BREAD) + p("M40 30 C48 28 54 36 56 44 C50 47 44 43 39 38Z", BREAD)
     + p("M22 26 C24 16 40 16 42 26 C43 34 41 42 32 44 C23 42 21 34 22 26Z", "#efc27a") + line("M27 22 C29 30 29 38 28 42 M37 22 C35 30 35 38 36 42", 1.5, CRUST))
draw("magdalena", p("M15 37 L49 37 L45 56 L19 56Z", "#f4dfa8") + line("M22 37 L24 56 M29 37 L30 56 M35 37 L34 56 M42 37 L40 56", 1.4)
     + p("M13 39 C11 27 21 18 32 18 C43 18 53 27 51 39Z", BREAD) + dots([(24, 27), (33, 24), (41, 29), (29, 32), (38, 34)], WHITE, 1.4))
draw("bizcocho", p("M9 29 C13 19 51 19 55 29Z", CRUST) + r(9, 29, 46, 22, 2, "#f1c76e")
     + dots([(18, 37), (28, 42), (40, 36), (48, 44), (22, 46)], "#e0ad4f", 1.4) + hl("M13 31 L17 31 L17 48 L13 48Z"))
draw("tortilla-trigo", c(27, 31, 19, "#f3ddaa") + c(37, 37, 19, "#f0d59c")
     + dots([(30, 30), (42, 34), (36, 44), (45, 44), (27, 40), (39, 27)], "#cf9d5a", 1.8))
draw("tostadas", p("M14 55 L14 27 C9 25 9 14 19 12 C25 10 29 14 32 14 C35 14 39 10 45 12 C55 14 55 25 50 27 L50 55Z", CRUST)
     + p("M18 51 L18 25 C15 23 15 17 21 16 C26 15 29 18 32 18 C35 18 38 15 43 16 C49 17 49 23 46 25 L46 51Z", "#ecc27e", 'stroke="none"'))
draw("picos", "".join(r(x, 10, 8, 44, 4, BREAD, f'transform="rotate({rot} {x + 4} 32)"') for x, rot in [(16, -14), (28, 0), (40, 14)])
     + dots([(31, 18), (33, 28), (31, 38), (33, 47)], "#c88743", 1.2))

# --- despensa -----------------------------------------------------------------------------------
draw("aceite", bottle("#cfc24a", GREEN_D, CREAM, e(32, 41.5, 4, 5, GREEN, -20)))
draw("aceite-girasol", bottle("#f2d24c", YELLOW, WHITE, c(32, 41.5, 4.5, "#f6cf4b") + c(32, 41.5, 2, BROWN, 'stroke="none"')))
draw("vinagre", bottle("#7a3b2f", BLACK, CREAM))
draw("aceitunas", jar(GREEN_L, GREEN_D, "".join(e(x, y, 4, 3, "#8c9a3c") for x, y in [(23, 34), (32, 38), (41, 34), (26, 46), (38, 46)])))
draw("pepinillos", jar("#c7d98a", RED_D, "".join(r(x, 30, 6, 20, 3, "#7ba34a") for x in (21, 29, 37))))
draw("mermelada", jar(RED, RED_D, label=CREAM))
draw("miel", jar("#f2b53a", CARAMEL, p("M14 20 C14 26 18 26 18 22 C18 28 22 28 22 21Z", "#f2b53a"), CREAM))
draw("crema-cacao", jar(CHOC, RED, label=WHITE))
draw("esparragos", jar("#eef0d6", GREEN_D, "".join(r(x, 26, 5, 27, 2.5, "#f6f1dc") for x in (20, 27, 34, 41))))
draw("maiz", can(YELLOW, dots([(26, 33), (30, 36), (34, 33), (38, 36), (28, 40), (36, 40), (32, 30)], "#e9a92b", 2)))
draw("tomate-lata", can(RED, c(32, 35, 6.5, "#f07a62") + p("M29 29 L32 27 L35 29", GREEN)))
draw("lata-atun", r(9, 30, 46, 16, 6, SILVER) + r(9, 34, 46, 9, 0, BLUE) + e(32, 30, 23, 6, SILVER) + e(32, 30, 18, 3.5, "#c3cad0")
     + hl("M13 33 L17 33 L17 44 L13 44Z"))
draw("lata-sardinas", r(7, 20, 50, 28, 9, SILVER) + r(11, 24, 42, 20, 6, FISH_B) + p("M18 34 C22 29 32 28 40 33 L46 29 L45 34 L46 39 L40 35 C32 40 22 39 18 34Z", WHITE)
     + p("M50 20 C56 14 60 18 56 22", "none"))
draw("arroz", bag(WHITE, GLASS, dots([(25, 33), (31, 30), (37, 35), (28, 39), (35, 41), (40, 30), (24, 41)], "#e0d8c8", 1.5)
                                     .replace('r="1.5"', 'r="1.6"')) + r(20, 48, 24, 4, 1, RED, 'stroke="none"'))
draw("harina", bag("#f4efe6", None, r(20, 26, 24, 18, 2, WHITE) + line("M32 41 L32 29 M32 32 L28 29 M32 32 L36 29 M32 37 L28 34 M32 37 L36 34", 1.6, CARAMEL)))
draw("azucar", bag(WHITE, None, r(23, 30, 8, 8, 1.5, "#f2f2f2") + r(33, 30, 8, 8, 1.5, "#f2f2f2") + r(28, 39, 8, 8, 1.5, "#f2f2f2")
                   + r(18, 50, 28, 3, 1, BLUE, 'stroke="none"')))
draw("sal", r(22, 10, 20, 12, 5, SILVER) + dots([(28, 14), (32, 16), (36, 14)], INK, 1) + r(20, 22, 24, 34, 5, GLASS)
     + r(22, 30, 20, 23, 3, WHITE, 'stroke="none"') + hl("M23 25 L26 25 L26 52 L23 52Z"))
draw("legumbres", bag("#d9b98a", GLASS, "".join(e(x, y, 3.2, 2.4, "#b06a4a", None, 'stroke-width="1.2"') for x, y in [(25, 32), (32, 36), (39, 31), (27, 40), (36, 42), (32, 29)])))
draw("garbanzos", bag("#e8c27a", GLASS, "".join(c(x, y, 3, "#e9c88d", 'stroke-width="1.2"') for x, y in [(25, 32), (32, 36), (39, 31), (27, 40), (36, 42), (32, 29)])))
draw("lentejas", bag("#c99a5a", GLASS, "".join(e(x, y, 2.6, 1.8, "#8a6a3a", None, 'stroke-width="1"') for x, y in [(25, 32), (31, 35), (37, 31), (27, 40), (35, 41), (32, 29), (40, 38), (23, 37)])))
draw("cuscus", bag("#f2d58a", GLASS, dots([(24 + (i % 6) * 3.5, 30 + (i // 6) * 3.5) for i in range(24)], "#e3b54f", 1.1)))
draw("espaguetis", r(25, 6, 14, 52, 3, "#f3d58a") + line("M28 8 L28 56 M31 8 L31 56 M34 8 L34 56 M37 8 L37 56", 1.2, "#d9b25a")
     + r(22, 26, 20, 12, 2, BLUE) + hl("M26.5 40 L28 40 L28 54 L26.5 54Z"))
draw("macarrones", "".join(r(x, y, 8, 22, 4, "#f3d58a", f'transform="rotate({rot} {x + 4} {y + 11})"') + e(x + 4, y + 2, 3, 1.6, "#d9b25a", rot)
                           for x, y, rot in [(14, 18, -30), (28, 14, 10), (40, 22, 35), (22, 32, 60), (34, 34, -20)]))
draw("lasana", "".join(p(f"M10 {y} C16 {y-3} 20 {y+3} 26 {y} C32 {y-3} 36 {y+3} 42 {y} C48 {y-3} 52 {y+3} 54 {y} L54 {y+8} L10 {y+8}Z", "#f3d58a")
                       for y in (18, 30, 42)))
draw("tomate-frito", brick(RED, c(28, 40, 5.5, "#f07a62") + p("M25.5 35.5 L28 34 L30.5 35.5", GREEN)))
draw("especias-rojo", small_jar("#c8442c", RED))
draw("especias-verde", small_jar("#7f9a4a", GREEN_D))
draw("especias-marron", small_jar("#a0703e", BROWN_D))
draw("especias-negro", small_jar("#3a3438", BLACK))
draw("ketchup", p("M26 17 L30 5 L34 5 L38 17Z", RED_D) + p("M19 23 C19 17 45 17 45 23 L47 53 C47 57 17 57 17 53Z", RED)
     + r(19, 32, 26, 12, 2, WHITE) + c(32, 38, 3.5, RED, 'stroke-width="1.4"') + hl("M21.5 24 L24.5 24 L23.5 51 L20.5 51Z"))
draw("mayonesa", p("M26 17 L30 5 L34 5 L38 17Z", BLUE) + p("M19 23 C19 17 45 17 45 23 L47 53 C47 57 17 57 17 53Z", "#f6ecc4")
     + r(19, 32, 26, 12, 2, BLUE) + hl("M21.5 24 L24.5 24 L23.5 51 L20.5 51Z"))
draw("mostaza", p("M26 17 L30 5 L34 5 L38 17Z", RED) + p("M19 23 C19 17 45 17 45 23 L47 53 C47 57 17 57 17 53Z", YELLOW)
     + r(19, 32, 26, 12, 2, WHITE) + hl("M21.5 24 L24.5 24 L23.5 51 L20.5 51Z"))
draw("almendras", "".join(e(x, y, 7, 11, "#c68a55", rot) + line(f"M{x} {y - 6} C{x - 2} {y - 2} {x - 2} {y + 2} {x} {y + 6}", 1.2, "#a06a3a")
                          for x, y, rot in [(22, 30, -25), (40, 28, 20), (31, 44, 70)]))
draw("nueces", c(32, 34, 19, "#c9965e") + line("M32 15 C29 22 35 28 31 34 C27 40 34 46 32 53", 2)
     + line("M22 24 C25 27 22 31 25 34 M42 24 C39 27 42 31 39 34 M21 42 C24 40 26 44 28 41 M43 42 C40 40 38 44 36 41", 1.4, "#9c6a3a"))
draw("patatas-fritas", p("M14 8 L50 8 L47 34 L50 58 L14 58 L17 34Z", YELLOW) + line("M14 13 L50 13 M14 53 L50 53", 1.6, RED)
     + e(26, 33, 7, 5, "#f8e7a0", -15) + e(37, 37, 7, 5, "#f8e7a0", 20) + e(32, 27, 6, 4, "#f8e7a0", 5))
draw("frutos-secos", e(22, 38, 8, 12, "#c68a55", -25) + c(40, 34, 13, "#c9965e") + line("M40 21 C38 26 42 30 39 34 C36 38 41 42 40 47", 1.6)
     + c(24, 22, 6, "#e3c08a"))
draw("levadura", r(14, 18, 36, 28, 3, "#f2d58a") + line("M14 22 L50 22 M14 42 L50 42", 1.4, "#c99a3a") + c(32, 32, 5.5, WHITE))

# --- desayuno y dulces --------------------------------------------------------------------------
draw("cafe", bag(BROWN_D, None, e(32, 36, 7, 10, "#b07a4a", 20) + line("M30 27 C35 32 29 40 34 45", 1.6), fold=True))
draw("capsulas", "".join(p(f"M{x} {y} L{x + 16} {y} L{x + 13} {y + 15} L{x + 3} {y + 15}Z", col) + e(x + 8, y, 8, 2.4, SILVER)
                         for x, y, col in [(10, 30, "#b5423a"), (36, 30, "#5e93d6"), (23, 14, "#c9a23a")]))
draw("cafe-soluble", jar(CHOC, RED, label=CREAM))
draw("te", p("M14 28 L46 28 L42 51 C41 55 19 55 18 51Z", WHITE) + p("M45 32 C54 32 54 44 43 44", "none")
     + e(30, 28, 16, 3, "#c98a45") + line("M38 28 L46 14", 1.4) + r(43, 8, 9, 9, 1.5, GREEN, 'transform="rotate(25 47 12)"'))
draw("manzanilla", p("M14 28 L46 28 L42 51 C41 55 19 55 18 51Z", WHITE) + p("M45 32 C54 32 54 44 43 44", "none")
     + e(30, 28, 16, 3, "#f0d47a") + line("M38 28 L46 14", 1.4) + r(43, 8, 9, 9, 1.5, YELLOW, 'transform="rotate(25 47 12)"'))
draw("cereales", box("#f2a83b", "#d98b26", c(29, 38, 11, WHITE) + p("M19 38 L39 38 C39 46 19 46 19 38Z", BLUE_L)
                     + dots([(24, 36), (29, 35), (34, 36), (27, 33), (32, 33)], "#d98b26", 2)))
draw("galletas", c(25, 37, 14, "#d9a15a") + c(41, 29, 14, "#e2ae66")
     + dots([(20, 34), (28, 40), (24, 43), (38, 25), (44, 31), (41, 35), (47, 25)], "#8a5a2e", 1.8))
draw("chocolate", r(15, 10, 34, 46, 3, CHOC) + line("M15 22 L49 22 M32 10 L32 34", 1.6, "#5a3420")
     + r(15, 34, 34, 22, 2, RED) + p("M15 34 L22 30 L28 35 L35 30 L42 35 L49 31 L49 36 L15 36Z", SILVER) + hl("M18 13 L21 13 L21 30 L18 30Z"))
draw("turron", p("M8 30 L32 22 L56 28 L32 36Z", "#f0dcb2") + p("M8 30 L32 36 L32 50 L8 44Z", "#e9d3a8") + p("M32 36 L56 28 L56 42 L32 50Z", "#dcc296")
     + "".join(e(x, y, 2.5, 1.5, "#c68a55", rot) for x, y, rot in [(16, 39, 20), (24, 43, -10), (42, 40, 15), (50, 36, -20), (28, 28, 0)]))
draw("cacao", can("#7a4a2e", c(32, 35, 6, "#c9965e"), "#c77b2e"))

# --- congelados ---------------------------------------------------------------------------------
draw("helado", p("M21 34 L32 59 L43 34Z", BREAD) + line("M25 39 L37 51 M29 35 L40 46 M39 39 L27 51 M35 35 L24 46")
     + p("M19 35 C14 33 14 26 19 24 C18 17 25 12 32 14 C39 12 46 17 45 24 C50 26 50 33 45 35Z", PINK_L)
     + line("M24 29 C27 26 31 27 33 24") + c(32, 9, 2.8, RED) + line("M32 9 C33 6 35 5 37 5"))
draw("hielo", r(10, 26, 24, 24, 5, BLUE_L, 'transform="rotate(-12 22 38)"') + r(30, 14, 24, 24, 5, "#d5ebfa", 'transform="rotate(10 42 26)"')
     + hl("M15 31 L22 30 L21 33 L15.5 34Z") + hl("M35 19 L42 20 L41.5 23 L35 22Z"))
draw("pizza", p("M32 57 L9 15 C21 8 43 8 55 15Z", "#f2c35a") + p("M9 15 C21 8 43 8 55 15 L52 21 C40 15 24 15 12 21Z", CRUST)
     + c(30, 27, 4.5, RED) + c(39, 33, 4, RED) + c(29, 40, 4, RED) + dots([(23, 25), (35, 22), (33, 48)], GREEN_D, 1.4))
draw("fritas", "".join(r(x, y, 6, 26, 1.5, YELLOW, f'transform="rotate({rot} {x + 3} {y + 13})"') for x, y, rot in
                       [(18, 10, -12), (25, 6, -4), (32, 8, 6), (39, 11, 14), (29, 12, 0)])
     + p("M15 30 L49 30 L45 57 L19 57Z", RED) + p("M24 30 C24 38 40 38 40 30", "none", f'stroke="{WHITE}" stroke-width="2"'))
draw("croquetas", "".join(r(x, y, 26, 12, 6, "#d9953f", f'transform="rotate({rot} {x + 13} {y + 6})"') + dots([(x + 7, y + 4), (x + 14, y + 7), (x + 20, y + 4)], "#a8652a", 1.2)
                          for x, y, rot in [(8, 36, -8), (30, 38, 10), (19, 21, 4)]))
draw("varitas", "".join(r(x, y, 34, 9, 3, "#e3a44a", f'transform="rotate({rot} {x + 17} {y + 4.5})"') + dots([(x + 8, y + 4), (x + 18, y + 5), (x + 27, y + 4)], "#b0702a", 1.1)
                        for x, y, rot in [(12, 18, -6), (16, 30, 0), (12, 42, 6)]))
draw("congelado", bag(BLUE_L, None, line("M32 24 L32 44 M23 29 L41 39 M23 39 L41 29", 2, WHITE)
                      + dots([(22, 48), (28, 50), (36, 49), (42, 47)], GREEN, 2.2) + dots([(25, 46), (39, 51)], ORANGE, 2.2)))
draw("lasana-bandeja", r(8, 22, 48, 30, 4, SILVER) + r(11, 25, 42, 24, 2, "#e2a24a")
     + line("M11 33 L53 33 M11 41 L53 41", 2, RED) + dots([(18, 28), (30, 29), (44, 27)], "#c87a2a", 1.8))
draw("empanado", r(8, 26, 48, 24, 8, "#d9953f") + r(8, 18, 48, 22, 8, "#e3a44a") + p("M14 38 C20 35 26 40 32 37 C38 34 44 39 50 36 L50 40 L14 41Z", "#f7d768", 'stroke-width="1.6"')
     + dots([(18, 24), (28, 27), (40, 23), (46, 30), (22, 31), (36, 30)], "#a8652a", 1.4))

# --- bebidas ------------------------------------------------------------------------------------
draw("agua", water(BLUE_L, BLUE))
draw("agua-gas", water(BLUE_L, GREEN_D, bubbles=True))
draw("isotonica", water("#8fd0e6", WHITE))
draw("cola", soda("#b5302a", p("M19 32 C26 28 36 38 45 32 L45 36 C36 42 26 32 19 36Z", WHITE)))
draw("refresco-limon", soda(YELLOW, c(32, 33, 6, "#f8e27a") + leaf(33, 27, -40, GREEN)))
draw("tonica", soda("#e8eef0", r(19, 26, 26, 14, 0, BLUE) + dots([(26, 46), (34, 48), (38, 44)], BLUE_L, 1.8)))
draw("cerveza", beer("#8a4e22", CREAM))
draw("cerveza-sin", beer("#8a4e22", BLUE_L))
draw("vino-tinto", wine("#5a2233", CREAM, RED_D))
draw("vino-blanco", wine("#bfd38a", CREAM, "#e3c15a"))
draw("cava", wine("#3b5b3a", CREAM, "#e3c15a").replace(r(28, 3, 8, 8, 1.5, "#e3c15a"), p("M27 3 L37 3 L37 20 L27 20Z", "#e3c15a")))
draw("horchata", glass_drink("#f4ecd9"))
draw("gazpacho", glass_drink("#e0603f") + leaf(44, 12, 210, GREEN, 0.9))

# --- limpieza -----------------------------------------------------------------------------------
draw("detergente", jug(BLUE))
draw("suavizante", jug("#e9a3c9"))
draw("friegasuelos", jug("#f2c94c"))
draw("lejia", jug(WHITE, RED, BLUE_L))
draw("lavavajillas", slim(GREEN, WHITE))
draw("limpiacristales", spray(BLUE_L))
draw("multiusos", spray(GREEN_L))
draw("quitagrasas", spray(ORANGE))
draw("ambientador", aerosol(LILAC, WHITE))
draw("estropajo", r(10, 30, 44, 20, 4, YELLOW) + r(10, 22, 44, 9, 2, GREEN_D) + dots([(18, 38), (26, 43), (34, 37), (42, 43), (48, 37), (22, 46)], "#e3b23a", 1.6))
draw("bayeta", p("M10 18 L50 14 L54 50 L14 54Z", BLUE) + line("M18 22 L46 19 M19 30 L47 27 M20 38 L48 35 M21 46 L49 43", 1.4, "#8bb6e6"))
draw("bolsas-basura", r(10, 18, 34, 30, 0, BLACK) + e(44, 33, 8, 15, "#5a5257") + e(44, 33, 3, 6, "#2a2428") + e(10, 33, 8, 15, BLACK)
     + p("M12 48 L12 58 L36 58 L40 48Z", BLACK))
draw("papel-cocina", roll(WHITE, "#f4f1f3"))
draw("papel-higienico", r(16, 14, 32, 40, 0, WHITE) + e(32, 14, 16, 5, "#f4f1f3") + e(32, 14, 6, 2, "#cfc8cd") + e(32, 54, 16, 5, WHITE)
     + line("M16 54 L16 14 M48 14 L48 54") + line("M16 28 L48 28 M16 42 L48 42", 1.2, "#d6d0d4") + hl("M19 18 L22 18 L22 52 L19 52Z"))
draw("aluminio", roll(SILVER, "#e9ecef"))
draw("film", roll("#e3f1f6", "#f2f9fc"))
draw("pastillas", box("#5e93d6", "#3f74b8", "".join(r(x, y, 10, 8, 2, WHITE) for x, y in [(17, 22), (30, 22), (17, 34), (30, 34)])))

# --- higiene y cuidado personal -----------------------------------------------------------------
draw("cepillo", p("M8 53 L40 21 L45 26 L13 58Z", BLUE) + p("M40 21 L48 13 L53 18 L45 26Z", WHITE) + line("M45 10 L54 19 M43 12 L52 21 M41 14 L50 23", 1.6))
draw("pasta-dientes", tube(WHITE, BLUE, RED))
draw("protector-solar", tube(ORANGE, WHITE, YELLOW))
draw("champu", shampoo("#7fb6d9"))
draw("gel", shampoo("#9dd3b0", GREEN_D))
draw("enjuague", r(23, 5, 18, 10, 3, WHITE) + p("M20 15 L44 15 L46 55 C46 57 44 58 42 58 L22 58 C20 58 18 57 18 55Z", "#5fb8a8")
     + r(18, 32, 28, 14, 2, WHITE) + hl("M21.5 19 L25 19 L25 53 L21.5 53Z"))
draw("crema", r(12, 32, 40, 22, 7, WHITE) + r(10, 24, 44, 10, 3, LILAC) + r(12, 38, 40, 9, 0, "#efe3f6") + hl("M16 36 L19 36 L19 51 L16 51Z"))
draw("jabon", r(27, 16, 10, 10, 1.5, WHITE) + p("M30 16 L30 10 L46 10 L46 14", "none") + r(17, 26, 30, 31, 7, PINK_P)
     + r(17, 36, 30, 12, 0, WHITE) + hl("M20.5 30 L24 30 L24 53 L20.5 53Z"))
draw("desodorante", r(21, 7, 22, 12, 5, WHITE) + r(21, 18, 22, 39, 6, "#a8c6e8") + r(21, 30, 22, 12, 0, WHITE) + hl("M24 21 L27.5 21 L27.5 53 L24 53Z"))
draw("maquinilla", p("M18 58 L34 26 L39 28.5 L23 60Z", "#5e93d6") + r(26, 12, 28, 12, 3, "#e9ecef", 'transform="rotate(25 40 18)"')
     + line("M30 14 L52 24", 1.6, "#8a8f95"))
draw("panuelos", r(9, 30, 46, 24, 3, BLUE_L) + p("M24 30 C22 19 29 14 34 19 C39 12 47 21 40 30Z", WHITE) + e(32, 30, 11, 2.5, "#9fc6e6", None, 'stroke-width="1.6"'))
draw("algodon", "".join(c(x, y, 10, WHITE) for x, y in [(22, 40), (42, 40), (32, 26)]) + dots([(19, 36), (38, 36), (29, 22)], "#e9e4e7", 2.2))
draw("bastoncillos", "".join(line(f"M{x1} {y1} L{x2} {y2}", 2.6, INK) + line(f"M{x1} {y1} L{x2} {y2}", 1.2, WHITE)
                             + e(x1, y1, 3.6, 5, WHITE, rot) + e(x2, y2, 3.6, 5, WHITE, rot)
                             for x1, y1, x2, y2, rot in [(14, 14, 48, 50, -43), (24, 10, 52, 40, -43)]))
draw("caja-higiene", box(PINK_P, "#e293a6", c(29, 32, 7, WHITE) + c(29, 32, 2.5, PINK_P, 'stroke="none"')))

# --- bebé y mascotas ----------------------------------------------------------------------------
draw("panal", p("M9 20 L55 20 L51 34 C47 50 17 50 13 34Z", WHITE) + r(7, 18, 11, 8, 2, BLUE_L) + r(46, 18, 11, 8, 2, BLUE_L)
     + line("M20 30 C26 34 38 34 44 30", 1.4, "#d6d0d4"))
draw("biberon", p("M26 17 C26 8 38 8 38 17Z", "#f2d6a8") + r(21, 16, 22, 7, 2, BLUE) + r(22, 23, 20, 33, 6, WHITE)
     + r(24, 33, 16, 20, 4, "#f6efe0", 'stroke="none"') + line("M36 30 L40 30 M36 37 L40 37 M36 44 L40 44", 1.3))
draw("potito", r(18, 14, 28, 8, 2.5, BLUE) + r(19, 22, 26, 34, 6, GLASS) + r(21, 28, 22, 26, 4, ORANGE, 'stroke="none"') + r(19, 34, 26, 11, 0, WHITE))
draw("toallitas", pack(BLUE_L, e(32, 30, 13, 6, WHITE) + p("M24 30 C26 24 38 24 40 30Z", "#f4f1f3")))
draw("comida-perro", bag("#b5734a", None, r(20, 27, 24, 18, 3, WHITE) + p("M25 33 C22 31 22 36 25 35 L39 37 C42 38 42 33 39 34Z", "#e3c08a")))
draw("comida-gato", bag(LILAC, None, r(20, 27, 24, 18, 3, WHITE) + p("M24 36 C27 31 34 31 37 35 L41 32 L40 36 L41 40 L37 37 C34 41 27 41 24 36Z", FISH_B)))
draw("arena", bag(GREY, None, r(20, 27, 24, 18, 3, WHITE) + c(32, 38, 3.5, "#9a9196", 'stroke="none"')
                  + dots([(27, 33), (31, 31.5), (35.5, 32), (38.5, 34.5)], "#9a9196", 1.8)))
draw("hueso", p("M18 26 C12 20 18 12 24 18 C26 12 34 14 32 22 L42 32 C48 30 52 38 46 40 C52 42 50 50 44 46 C42 52 34 50 36 44 L26 34 C20 36 14 30 18 26Z", CREAM))

# --- genéricos ----------------------------------------------------------------------------------
draw("bolsa", p("M14 24 L50 24 L47 57 L17 57Z", "#f2d6a8") + p("M24 24 C24 12 40 12 40 24", "none")
     + leaf(30, 22, -60, GREEN, 1.1) + p("M36 24 L38 12 L41 13 L39 24Z", "#f2d24c"))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.svg"):
        old.unlink()
    for key, body in DRAWINGS.items():
        # Cualquier color que quedara en un atributo de trazo, a tiza
        body = re.sub(r'stroke="#[0-9a-fA-F]{6}"', f'stroke="{CHALK}"', body)
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
               f'<filter id="t" x="-15%" y="-15%" width="130%" height="130%">'
               f'<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="4" result="w"/>'
               f'<feDisplacementMap in="SourceGraphic" in2="w" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="r"/>'
               f'<feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="11" result="g"/>'
               f'<feColorMatrix in="g" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -2 0 0 0 1.75" result="m"/>'
               f'<feComposite in="r" in2="m" operator="in"/></filter>'
               f'<g filter="url(#t)" stroke="{CHALK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">{body}</g></svg>\n')
        (OUT / f"{key}.svg").write_text(svg)
    print(f"{len(DRAWINGS)} dibujos en {OUT}")


if __name__ == "__main__":
    main()
