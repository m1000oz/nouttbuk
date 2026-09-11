import os
import subprocess

BRAND_DIR = "/home/mexyniti/Escritorio/nouttbuk/public/brand"
PUBLIC_DIR = "/home/mexyniti/Escritorio/nouttbuk/public"
APP_DIR = "/home/mexyniti/Escritorio/nouttbuk/src/app"

os.makedirs(BRAND_DIR, exist_ok=True)

# Minimal V2 exact 'tt' cutout paths
TT_V2_CUTOUT = """
      <!-- Negative Space Cutouts: 'tt' in exact Minimal V2 design -->
      <g transform="translate(16, 0)" fill="{cutout_color}">
        <!-- Letter t1 (y = -32) -->
        <path d="
          M -42 -41
          C -47 -41 -51 -37 -51 -32
          C -51 -27 -47 -23 -42 -23
          L -25 -23
          L -25 -10
          C -25 -5 -21 -1 -16 -1
          C -11 -1 -7 -5 -7 -10
          L -7 -23
          L 15 -23
          C 29 -23 37 -31 37 -43
          C 37 -48 35 -52 32 -55
          C 28 -59 28 -65 33 -68
          C 38 -71 44 -69 47 -64
          C 52 -57 54 -49 54 -41
          C 54 -19 40 -6 15 -6
          L -7 -6
          L -7 6
          C -7 11 -11 15 -16 15
          C -21 15 -25 11 -25 6
          L -25 -6
          L -42 -6
          C -47 -6 -51 -10 -51 -15
          C -51 -20 -47 -24 -42 -24
          L -25 -24
          L -25 -41
          Z
        " />

        <!-- Letter t2 (y = +32) -->
        <path d="
          M -42 23
          C -47 23 -51 27 -51 32
          C -51 37 -47 41 -42 41
          L -25 41
          L -25 54
          C -25 59 -21 63 -16 63
          C -11 63 -7 59 -7 54
          L -7 41
          L 15 41
          C 29 41 37 33 37 21
          C 37 16 35 12 32 9
          C 28 5 28 -1 33 -4
          C 38 -7 44 -5 47 0
          C 52 7 54 15 54 23
          C 54 45 40 58 15 58
          L -7 58
          L -7 70
          C -7 75 -11 79 -16 79
          C -21 79 -25 75 -25 70
          L -25 58
          L -42 58
          C -47 58 -51 54 -51 49
          C -51 44 -47 40 -42 40
          L -25 40
          L -25 23
          Z
        " />
      </g>
"""

# 1. Master Minimal V2 Isotipo (Flat matte Indigo + Teal edge + White 'tt')
def get_minimal_v2_isotipo():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <g transform="translate(256, 256)">
    <!-- 45-degree tilted notebook -->
    <g transform="rotate(45)">
      <!-- Teal under-layer / accent page edge (#14B8A6) -->
      <rect x="-120" y="-120" width="240" height="240" rx="34" fill="#14B8A6" transform="translate(10, 10)" />

      <!-- Main Notebook Cover: Flat Matte Indigo (#4F46E5) -->
      <rect x="-120" y="-120" width="240" height="240" rx="32" fill="#4F46E5" />

      <!-- Minimalist Ring Bindings along spine (x = -120) -->
      <g>
        <circle cx="-96" cy="-80" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="-40" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="0" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="40" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="80" r="8" fill="#1E1B4B" />

        <path d="M -136 -80 L -96 -80" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 -40 L -96 -40" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 0 L -96 0" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 40 L -96 40" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 80 L -96 80" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
      </g>

      {TT_V2_CUTOUT.format(cutout_color="#FFFFFF")}
    </g>
  </g>
</svg>"""

# 2. Monochrome Isotipo
def get_monochrome_v2_isotipo(color="#0F172A"):
    cutout = "#FFFFFF" if color != "#FFFFFF" else "#0F172A"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <g transform="translate(256, 256)">
    <g transform="rotate(45)">
      <rect x="-120" y="-120" width="240" height="240" rx="34" fill="{color}" opacity="0.25" transform="translate(10, 10)" />
      <rect x="-120" y="-120" width="240" height="240" rx="32" fill="{color}" />

      <g>
        <circle cx="-96" cy="-80" r="8" fill="{cutout}" opacity="0.3" />
        <circle cx="-96" cy="-40" r="8" fill="{cutout}" opacity="0.3" />
        <circle cx="-96" cy="0" r="8" fill="{cutout}" opacity="0.3" />
        <circle cx="-96" cy="40" r="8" fill="{cutout}" opacity="0.3" />
        <circle cx="-96" cy="80" r="8" fill="{cutout}" opacity="0.3" />

        <path d="M -136 -80 L -96 -80" stroke="{cutout}" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 -40 L -96 -40" stroke="{cutout}" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 0 L -96 0" stroke="{cutout}" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 40 L -96 40" stroke="{cutout}" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 80 L -96 80" stroke="{cutout}" stroke-width="12" stroke-linecap="round" />
      </g>

      {TT_V2_CUTOUT.format(cutout_color=cutout)}
    </g>
  </g>
</svg>"""

# 3. Favicon (64x64 micro-optimized)
def get_favicon_v2():
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <g transform="translate(32, 32)">
    <g transform="rotate(45) scale(0.125)">
      <rect x="-120" y="-120" width="240" height="240" rx="34" fill="#14B8A6" transform="translate(10, 10)" />
      <rect x="-120" y="-120" width="240" height="240" rx="32" fill="#4F46E5" />

      <g stroke="#FFFFFF" stroke-width="16" stroke-linecap="round">
        <line x1="-136" y1="-80" x2="-96" y2="-80" />
        <line x1="-136" y1="-40" x2="-96" y2="-40" />
        <line x1="-136" y1="0" x2="-96" y2="0" />
        <line x1="-136" y1="40" x2="-96" y2="40" />
        <line x1="-136" y1="80" x2="-96" y2="80" />
      </g>

      <g transform="translate(16, 0)" fill="#FFFFFF">
        <path d="
          M -42 -41 C -47 -41 -51 -37 -51 -32 C -51 -27 -47 -23 -42 -23
          L -25 -23 L -25 -10 C -25 -5 -21 -1 -16 -1 C -11 -1 -7 -5 -7 -10
          L -7 -23 L 15 -23 C 29 -23 37 -31 37 -43 C 37 -48 35 -52 32 -55
          C 28 -59 28 -65 33 -68 C 38 -71 44 -69 47 -64 C 52 -57 54 -49 54 -41
          C 54 -19 40 -6 15 -6 L -7 -6 L -7 6 C -7 11 -11 15 -16 15
          C -21 15 -25 11 -25 6 L -25 -6 L -42 -6 C -47 -6 -51 -10 -51 -15
          C -51 -20 -47 -24 -42 -24 L -25 -24 L -25 -41 Z
        " />
        <path d="
          M -42 23 C -47 23 -51 27 -51 32 C -51 37 -47 41 -42 41
          L -25 41 L -25 54 C -25 59 -21 63 -16 63 C -11 63 -7 59 -7 54
          L -7 41 L 15 41 C 29 41 37 33 37 21 C 37 16 35 12 32 9
          C 28 5 28 -1 33 -4 C 38 -7 44 -5 47 0 C 52 7 54 15 54 23
          C 54 45 40 58 15 58 L -7 58 L -7 70 C -7 75 -11 79 -16 79
          C -21 79 -25 75 -25 70 L -25 58 L -42 58 C -47 58 -51 54 -51 49
          C -51 44 -47 40 -42 40 L -25 40 L -25 23 Z
        " />
      </g>
    </g>
  </g>
</svg>"""

# 4. Minimalist Matte App Icon (512x512 with dark matte squircle)
def get_app_icon_v2():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="115" fill="#0F172A" />

  <g transform="translate(256, 256) scale(0.92)">
    <g transform="rotate(45)">
      <rect x="-120" y="-120" width="240" height="240" rx="34" fill="#14B8A6" transform="translate(10, 10)" />
      <rect x="-120" y="-120" width="240" height="240" rx="32" fill="#4F46E5" />

      <g>
        <circle cx="-96" cy="-80" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="-40" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="0" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="40" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="80" r="8" fill="#1E1B4B" />

        <path d="M -136 -80 L -96 -80" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 -40 L -96 -40" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 0 L -96 0" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 40 L -96 40" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 80 L -96 80" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
      </g>

      {TT_V2_CUTOUT.format(cutout_color="#FFFFFF")}
    </g>
  </g>
</svg>"""

# 5. Full Horizontal Logo
def get_horizontal_logo_v2(theme="light", with_slogan=True):
    is_dark = theme == "dark"
    text_color = "#F8FAFC" if is_dark else "#0F172A"
    slogan_color = "#94A3B8" if is_dark else "#64748B"
    bg_xml = f'<rect width="580" height="150" fill="#0F172A" rx="16" />' if is_dark else ""
    
    y_wordmark = 78 if with_slogan else 88
    slogan_xml = f'<text x="162" y="112" font-family="\'DM Sans\', system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="{slogan_color}" letter-spacing="0.2">Tus apuntes, tu comunidad</text>' if with_slogan else ""

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 150" width="580" height="150">
  {bg_xml}

  <g transform="translate(76, 75) scale(0.24)">
    <g transform="rotate(45)">
      <rect x="-120" y="-120" width="240" height="240" rx="34" fill="#14B8A6" transform="translate(10, 10)" />
      <rect x="-120" y="-120" width="240" height="240" rx="32" fill="#4F46E5" />

      <g>
        <circle cx="-96" cy="-80" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="-40" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="0" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="40" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="80" r="8" fill="#1E1B4B" />

        <path d="M -136 -80 L -96 -80" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 -40 L -96 -40" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 0 L -96 0" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 40 L -96 40" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 80 L -96 80" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
      </g>

      {TT_V2_CUTOUT.format(cutout_color="#FFFFFF")}
    </g>
  </g>

  <text x="162" y="{y_wordmark}" font-family="\'DM Sans\', system-ui, -apple-system, sans-serif" font-size="58" font-weight="800" fill="{text_color}" letter-spacing="-1.2">
    nou<tspan fill="#14B8A6">tt</tspan>buk
  </text>
  {slogan_xml}
</svg>"""

# 6. Stacked Logo
def get_stacked_logo_v2(theme="light"):
    is_dark = theme == "dark"
    text_color = "#F8FAFC" if is_dark else "#0F172A"
    slogan_color = "#94A3B8" if is_dark else "#64748B"
    bg_xml = f'<rect width="360" height="380" fill="#0F172A" rx="20" />' if is_dark else ""

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 380" width="360" height="380">
  {bg_xml}

  <g transform="translate(180, 140) scale(0.48)">
    <g transform="rotate(45)">
      <rect x="-120" y="-120" width="240" height="240" rx="34" fill="#14B8A6" transform="translate(10, 10)" />
      <rect x="-120" y="-120" width="240" height="240" rx="32" fill="#4F46E5" />

      <g>
        <circle cx="-96" cy="-80" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="-40" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="0" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="40" r="8" fill="#1E1B4B" />
        <circle cx="-96" cy="80" r="8" fill="#1E1B4B" />

        <path d="M -136 -80 L -96 -80" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 -40 L -96 -40" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 0 L -96 0" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 40 L -96 40" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
        <path d="M -136 80 L -96 80" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
      </g>

      {TT_V2_CUTOUT.format(cutout_color="#FFFFFF")}
    </g>
  </g>

  <text x="180" y="300" text-anchor="middle" font-family="\'DM Sans\', system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" fill="{text_color}" letter-spacing="-1.2">
    nou<tspan fill="#14B8A6">tt</tspan>buk
  </text>
  <text x="180" y="335" text-anchor="middle" font-family="\'DM Sans\', system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="{slogan_color}" letter-spacing="0.2">
    Tus apuntes, tu comunidad
  </text>
</svg>"""

assets = [
    (f"{BRAND_DIR}/nouttbuk-isotipo.svg", get_minimal_v2_isotipo()),
    (f"{BRAND_DIR}/nouttbuk-isotipo-monochrome.svg", get_monochrome_v2_isotipo("#0F172A")),
    (f"{BRAND_DIR}/nouttbuk-isotipo-white.svg", get_monochrome_v2_isotipo("#FFFFFF")),
    (f"{BRAND_DIR}/nouttbuk-favicon.svg", get_favicon_v2()),
    (f"{BRAND_DIR}/nouttbuk-app-icon.svg", get_app_icon_v2()),
    (f"{BRAND_DIR}/nouttbuk-logo-horizontal.svg", get_horizontal_logo_v2("light", True)),
    (f"{BRAND_DIR}/nouttbuk-logo-horizontal-dark.svg", get_horizontal_logo_v2("dark", True)),
    (f"{BRAND_DIR}/nouttbuk-logo-compact.svg", get_horizontal_logo_v2("light", False)),
    (f"{BRAND_DIR}/nouttbuk-logo-compact-dark.svg", get_horizontal_logo_v2("dark", False)),
    (f"{BRAND_DIR}/nouttbuk-logo-stacked.svg", get_stacked_logo_v2("light")),
    (f"{BRAND_DIR}/nouttbuk-logo-stacked-dark.svg", get_stacked_logo_v2("dark")),
    (f"{APP_DIR}/icon.svg", get_favicon_v2()),
]

for path, content in assets:
    with open(path, "w") as f:
        f.write(content)
    print(f"Written: {path}")

print("Rendering raster assets with rsvg-convert & convert...")

# 1. PWA icons
subprocess.run(f"rsvg-convert -w 512 -h 512 {BRAND_DIR}/nouttbuk-app-icon.svg -o {PUBLIC_DIR}/icon-512.png", shell=True, check=True)
subprocess.run(f"rsvg-convert -w 192 -h 192 {BRAND_DIR}/nouttbuk-app-icon.svg -o {PUBLIC_DIR}/icon-192.png", shell=True, check=True)

# 2. Apple touch icon
subprocess.run(f"rsvg-convert -w 180 -h 180 {BRAND_DIR}/nouttbuk-app-icon.svg -o {APP_DIR}/apple-icon.png", shell=True, check=True)

# 3. Favicon ICO
subprocess.run(f"rsvg-convert -w 32 -h 32 {BRAND_DIR}/nouttbuk-favicon.svg -o /tmp/fav32.png", shell=True, check=True)
subprocess.run(f"rsvg-convert -w 16 -h 16 {BRAND_DIR}/nouttbuk-favicon.svg -o /tmp/fav16.png", shell=True, check=True)
subprocess.run(f"convert /tmp/fav16.png /tmp/fav32.png {APP_DIR}/favicon.ico", shell=True, check=True)
if os.path.exists(f"{PUBLIC_DIR}/favicon.ico"):
    subprocess.run(f"cp {APP_DIR}/favicon.ico {PUBLIC_DIR}/favicon.ico", shell=True)

# 4. Brand previews
subprocess.run(f"rsvg-convert -w 580 -h 150 {BRAND_DIR}/nouttbuk-logo-horizontal.svg -o {BRAND_DIR}/nouttbuk-logo-horizontal.png", shell=True, check=True)
subprocess.run(f"rsvg-convert -w 580 -h 150 {BRAND_DIR}/nouttbuk-logo-horizontal-dark.svg -o {BRAND_DIR}/nouttbuk-logo-horizontal-dark.png", shell=True, check=True)
subprocess.run(f"rsvg-convert -w 480 -h 120 {BRAND_DIR}/nouttbuk-logo-compact.svg -o {BRAND_DIR}/nouttbuk-logo-compact.png", shell=True, check=True)
subprocess.run(f"rsvg-convert -w 360 -h 380 {BRAND_DIR}/nouttbuk-logo-stacked.svg -o {BRAND_DIR}/nouttbuk-logo-stacked.png", shell=True, check=True)
subprocess.run(f"rsvg-convert -w 512 -h 512 {BRAND_DIR}/nouttbuk-isotipo.svg -o {BRAND_DIR}/nouttbuk-isotipo.png", shell=True, check=True)

print("Minimal V2 assets generated successfully!")
