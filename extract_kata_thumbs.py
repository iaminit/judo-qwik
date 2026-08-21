import os
from PIL import Image

output_dir = 'public/media/kata_thumbs'
os.makedirs(output_dir, exist_ok=True)

# 1. Ju-No-Kata (Skip header offset ~15%)
juno_techs = [
    "ju-no-kata-tsuki-dashi", "ju-no-kata-kata-oshi", "ju-no-kata-ryote-dori",
    "ju-no-kata-kata-mawashi", "ju-no-kata-ago-oshi", "ju-no-kata-kiri-oroshi",
    "ju-no-kata-ryokata-oshi", "ju-no-kata-naname-uchi", "ju-no-kata-katate-dori",
    "ju-no-kata-katate-age", "ju-no-kata-obi-tori", "ju-no-kata-mune-oshi",
    "ju-no-kata-tsuki-age", "ju-no-kata-uchi-oroshi", "ju-no-kata-ryogan-tsuki"
]

try:
    img = Image.open('public/media/ju-no-kata.webp')
    w, h = img.size
    header_h = int(h * 0.155)
    grid = img.crop((0, header_h, w, h))
    gw, gh = grid.size
    cols, rows = 3, 5
    cell_w, cell_h = gw / cols, gh / rows
    
    idx = 0
    for r in range(rows):
        for c in range(cols):
            if idx < len(juno_techs):
                left = int(c * cell_w)
                top = int(r * cell_h)
                right = int((c + 1) * cell_w)
                bottom = int((r + 1) * cell_h)
                cropped = grid.crop((left, top, right, bottom))
                fn = f"{juno_techs[idx]}.webp"
                cropped.save(os.path.join(output_dir, fn), 'WEBP')
                idx += 1
    print(f"Extracted {idx} Ju-no-Kata thumbnails accurately!")
except Exception as e:
    print(f"Error slicing Ju-no-Kata: {e}")

# 2. Katame-No-Kata (Skip header offset ~15%)
katame_techs = [
    "katame-kesa-gatame", "katame-kata-gatame", "katame-kami-shiho-gatame",
    "katame-yoko-shiho-gatame", "katame-kuzure-kami-shiho-gatame", "katame-kata-juji-jime",
    "katame-hadaka-jime", "katame-okuri-eri-jime", "katame-kata-ha-jime",
    "katame-gyaku-juji-jime", "katame-ude-garami", "katame-ude-hishigi-juji-gatame",
    "katame-ude-hishigi-ude-gatame", "katame-ude-hishigi-hiza-gatame", "katame-ashi-garami"
]

try:
    img = Image.open('public/media/katame.webp')
    w, h = img.size
    header_h = int(h * 0.155)
    grid = img.crop((0, header_h, w, h))
    gw, gh = grid.size
    cols, rows = 3, 5
    cell_w, cell_h = gw / cols, gh / rows
    
    idx = 0
    for r in range(rows):
        for c in range(cols):
            if idx < len(katame_techs):
                left = int(c * cell_w)
                top = int(r * cell_h)
                right = int((c + 1) * cell_w)
                bottom = int((r + 1) * cell_h)
                cropped = grid.crop((left, top, right, bottom))
                fn = f"{katame_techs[idx]}.webp"
                cropped.save(os.path.join(output_dir, fn), 'WEBP')
                idx += 1
    print(f"Extracted {idx} Katame-no-Kata thumbnails accurately!")
except Exception as e:
    print(f"Error slicing Katame-no-Kata: {e}")

# 3. Kodokan Goshin Jutsu (Skip header offset ~15%)
goshin_techs = [
    "goshin-ryote-dori", "goshin-hidari-eri-dori", "goshin-migi-eri-dori",
    "goshin-kataude-dori", "goshin-ushiro-eri-dori", "goshin-ushiro-jime",
    "goshin-kakae-dori", "goshin-naname-uchi", "goshin-ago-tsuki",
    "goshin-gammen-tsuki", "goshin-mae-geri", "goshin-yoko-geri",
    "goshin-daga-tsukkake", "goshin-daga-choku-tsuki", "goshin-daga-naname-tsuki",
    "goshin-bastone-furiage", "goshin-bastone-furioroshi", "goshin-bastone-morote-tsuki",
    "goshin-pistola-shomen-zuke", "goshin-pistola-koshi-gamae", "goshin-pistola-haimen-zuke"
]

try:
    img = Image.open('public/media/goshin-jutsu.webp')
    w, h = img.size
    header_h = int(h * 0.145)
    grid = img.crop((0, header_h, w, h))
    gw, gh = grid.size
    cols, rows = 3, 7
    cell_w, cell_h = gw / cols, gh / rows
    
    idx = 0
    for r in range(rows):
        for c in range(cols):
            if idx < len(goshin_techs):
                left = int(c * cell_w)
                top = int(r * cell_h)
                right = int((c + 1) * cell_w)
                bottom = int((r + 1) * cell_h)
                cropped = grid.crop((left, top, right, bottom))
                fn = f"{goshin_techs[idx]}.webp"
                cropped.save(os.path.join(output_dir, fn), 'WEBP')
                idx += 1
    print(f"Extracted {idx} Kodokan Goshin Jutsu thumbnails accurately!")
except Exception as e:
    print(f"Error slicing Goshin Jutsu: {e}")

