"""Generate Stateside icons.
- www/*.png            : PWA icons (mic mark on warm console square)
- assets/*.png         : sources for `npx @capacitor/assets generate` (native launcher + splash)
"""
import os
from PIL import Image, ImageDraw

BG = (36, 27, 18)        # #241b12 console
PAPER = (243, 233, 210)  # #f3e9d2
CREAM = (241, 230, 207)  # #f1e6cf
SS = 4                   # supersample for smooth edges


def draw_mic(S, content_frac=0.58, bg=BG, mic=True, mic_color=CREAM, radius_frac=0.0):
    s = S * SS
    img = Image.new("RGBA", (s, s), (bg + (255,)) if bg else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bg and radius_frac:  # rounded square (used for splash logo tile)
        r = radius_frac * s
        mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, s, s], radius=r, fill=255)
        img.putalpha(mask)
    if mic:
        scale = (content_frac * s) / 19.0
        cx, cy = s / 2, s / 2
        X = lambda x: cx + (x - 12) * scale
        Y = lambda y: cy + (y - 11.5) * scale
        lw = max(2, round(0.05 * content_frac * s))
        d.rounded_rectangle([X(9), Y(2), X(15), Y(14)], radius=3 * scale, fill=mic_color)
        d.arc([X(5), Y(3), X(19), Y(17)], start=0, end=180, fill=mic_color, width=lw)
        d.line([X(12), Y(17), X(12), Y(21)], fill=mic_color, width=lw)
        d.line([X(8), Y(21), X(16), Y(21)], fill=mic_color, width=lw)
    return img.resize((S, S), Image.LANCZOS)


def splash(S, dark=False):
    bg = BG if dark else PAPER
    tile = BG
    img = Image.new("RGBA", (S, S), bg + (255,))
    logo = draw_mic(round(S * 0.22), content_frac=0.58, bg=tile, radius_frac=0.22)
    img.alpha_composite(logo, ((S - logo.width) // 2, (S - logo.height) // 2))
    return img


# --- PWA icons (in www/) ---
os.makedirs("www", exist_ok=True)
draw_mic(192).save("www/icon-192.png")
draw_mic(512).save("www/icon-512.png")
draw_mic(512, content_frac=0.42).save("www/icon-maskable-512.png")
draw_mic(180).save("www/apple-touch-icon.png")

# --- native asset sources (in assets/) for @capacitor/assets ---
os.makedirs("assets", exist_ok=True)
draw_mic(1024).save("assets/icon-only.png")                              # legacy square icon
draw_mic(1024, content_frac=0.40, bg=None).save("assets/icon-foreground.png")  # adaptive fg (safe-zone padded)
draw_mic(1024, mic=False).save("assets/icon-background.png")             # adaptive bg (solid console)
splash(2732).save("assets/splash.png")
splash(2732, dark=True).save("assets/splash-dark.png")

print("icons + assets written")
