import sqlite3
import re

db_path = 'pb_data/data.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Map technique titles to their thumbnail image paths
tech_img_map = {
    # Nage-no-Kata
    "Uki Otoshi": "/media/uki-otoshi",
    "Seoi Nage": "/media/seoi-nage.webp",
    "Kata Guruma": "/media/kata-guruma.webp",
    "Uki Goshi": "/media/uki-goshi.webp",
    "Harai Goshi": "/media/harai-goshi.webp",
    "Tsuri Komi Goshi": "/media/tsuri-komi-goshi.webp",
    "Okuri Ashi Barai": "/media/okuri-ashi-barai.webp",
    "Sasae Tsuri Komi Ashi": "/media/sasae-tsuri-komi-ashi.webp",
    "Uchi Mata": "/media/uchi-mata",
    "Tomoe Nage": "/media/tomoe-nage.webp",
    "Ura Nage": "/media/ura-nage.webp",
    "Sumi Gaeshi": "/media/sumi-gaeshi.webp",
    "Yoko Gake": "/media/yoko-gake",
    "Yoko Guruma": "/media/yoko-guruma.webp",
    "Uki Waza": "/media/uki-waza.webp",

    # Katame-no-Kata
    "Kesa Gatame": "/media/kata_thumbs/katame-kesa-gatame.webp",
    "Kata Gatame": "/media/kata_thumbs/katame-kata-gatame.webp",
    "Kami Shiho Gatame": "/media/kata_thumbs/katame-kami-shiho-gatame.webp",
    "Yoko Shiho Gatame": "/media/kata_thumbs/katame-yoko-shiho-gatame.webp",
    "Kuzure Kami Shiho Gatame": "/media/kata_thumbs/katame-kuzure-kami-shiho-gatame.webp",
    "Kata Juji Jime": "/media/kata_thumbs/katame-kata-juji-jime.webp",
    "Hadaka Jime": "/media/kata_thumbs/katame-hadaka-jime.webp",
    "Okuri Eri Jime": "/media/kata_thumbs/katame-okuri-eri-jime.webp",
    "Kata Ha Jime": "/media/kata_thumbs/katame-kata-ha-jime.webp",
    "Gyaku Juji Jime": "/media/kata_thumbs/katame-gyaku-juji-jime.webp",
    "Ude Garami": "/media/kata_thumbs/katame-ude-garami.webp",
    "Ude Hishigi Juji Gatame": "/media/kata_thumbs/katame-ude-hishigi-juji-gatame.webp",
    "Ude Hishigi Ude Gatame": "/media/kata_thumbs/katame-ude-hishigi-ude-gatame.webp",
    "Ude Hishigi Hiza Gatame": "/media/kata_thumbs/katame-ude-hishigi-hiza-gatame.webp",
    "Ashi Garami": "/media/kata_thumbs/katame-ashi-garami.webp",

    # Ju-no-Kata
    "Tsuki Dashi": "/media/kata_thumbs/ju-no-kata-tsuki-dashi.webp",
    "Kata Oshi": "/media/kata_thumbs/ju-no-kata-kata-oshi.webp",
    "Ryote Dori": "/media/kata_thumbs/ju-no-kata-ryote-dori.webp",
    "Kata Mawashi": "/media/kata_thumbs/ju-no-kata-kata-mawashi.webp",
    "Ago Oshi": "/media/kata_thumbs/ju-no-kata-ago-oshi.webp",
    "Kiri Oroshi": "/media/kata_thumbs/ju-no-kata-kiri-oroshi.webp",
    "Ryokata Oshi": "/media/kata_thumbs/ju-no-kata-ryokata-oshi.webp",
    "Naname Uchi": "/media/kata_thumbs/ju-no-kata-naname-uchi.webp",
    "Katate Dori": "/media/kata_thumbs/ju-no-kata-katate-dori.webp",
    "Katate Age": "/media/kata_thumbs/ju-no-kata-katate-age.webp",
    "Obi Tori": "/media/kata_thumbs/ju-no-kata-obi-tori.webp",
    "Mune Oshi": "/media/kata_thumbs/ju-no-kata-mune-oshi.webp",
    "Tsuki Age": "/media/kata_thumbs/ju-no-kata-tsuki-age.webp",
    "Uchi Oroshi": "/media/kata_thumbs/ju-no-kata-uchi-oroshi.webp",
    "Ryogan Tsuki": "/media/kata_thumbs/ju-no-kata-ryogan-tsuki.webp",

    # Kodokan Goshin Jutsu
    "Ryote Dori": "/media/kata_thumbs/goshin-ryote-dori.webp",
    "Hidari Eri Dori": "/media/kata_thumbs/goshin-hidari-eri-dori.webp",
    "Migi Eri Dori": "/media/kata_thumbs/goshin-migi-eri-dori.webp",
    "Kataude Dori": "/media/kata_thumbs/goshin-kataude-dori.webp",
    "Ushiro Eri Dori": "/media/kata_thumbs/goshin-ushiro-eri-dori.webp",
    "Ushiro Jime": "/media/kata_thumbs/goshin-ushiro-jime.webp",
    "Kakae Dori": "/media/kata_thumbs/goshin-kakae-dori.webp",
    "Ago Tsuki": "/media/kata_thumbs/goshin-ago-tsuki.webp",
    "Gammen Tsuki": "/media/kata_thumbs/goshin-gammen-tsuki.webp",
    "Mae Geri": "/media/kata_thumbs/goshin-mae-geri.webp",
    "Yoko Geri": "/media/kata_thumbs/goshin-yoko-geri.webp",
    "Tsukkake": "/media/kata_thumbs/goshin-daga-tsukkake.webp",
    "Choku Tsuki": "/media/kata_thumbs/goshin-daga-choku-tsuki.webp",
    "Naname Tsuki": "/media/kata_thumbs/goshin-daga-naname-tsuki.webp",
    "Furiage": "/media/kata_thumbs/goshin-bastone-furiage.webp",
    "Furioroshi": "/media/kata_thumbs/goshin-bastone-furioroshi.webp",
    "Morote Tsuki": "/media/kata_thumbs/goshin-bastone-morote-tsuki.webp",
    "Shomen Zuke": "/media/kata_thumbs/goshin-pistola-shomen-zuke.webp",
    "Koshi Gamae": "/media/kata_thumbs/goshin-pistola-koshi-gamae.webp",
    "Haimen Zuke": "/media/kata_thumbs/goshin-pistola-haimen-zuke.webp",
}

# Fetch all kata records
cursor.execute("SELECT id, titolo, contenuto FROM kata")
rows = cursor.fetchall()

for row in rows:
    kata_id, titolo, contenuto = row[0], row[1], row[2]
    if not contenuto:
        continue
    
    # Process <li> elements
    def replace_li(match):
        li_content = match.group(1)
        # Check if already has img
        if '<img' in li_content:
            return match.group(0)
        
        # Try to extract technique name from <strong>NAME</strong>
        strong_match = re.search(r'<strong>([^<]+)</strong>', li_content)
        if strong_match:
            tech_name = strong_match.group(1).strip()
            # Look up in map
            img_path = None
            for key, val in tech_img_map.items():
                if key.lower() in tech_name.lower() or tech_name.lower() in key.lower():
                    img_path = val
                    break
            
            if img_path:
                img_tag = f'<div class="my-3 flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-sm group hover:border-red-500 transition-all"><img src="{img_path}" alt="{tech_name}" class="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl bg-white border border-gray-200 dark:border-gray-600 p-1 shrink-0 cursor-pointer group-hover:scale-105 transition-transform" onclick="window.openImageZoom &amp;&amp; window.openImageZoom(\'{img_path}\', \'{tech_name}\')" title="Clicca per ingrandire l\'immagine"/><div class="flex-1">'
                return f'<li>{img_tag}{li_content}</div></div></li>'
            else:
                # Generic technique fallback thumbnail
                slug = tech_name.lower().replace(' ', '-').replace("'", "")
                fallback_path = f'/media/{slug}.webp'
                img_tag = f'<div class="my-3 flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-sm group hover:border-red-500 transition-all"><img src="{fallback_path}" alt="{tech_name}" class="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl bg-white border border-gray-200 dark:border-gray-600 p-1 shrink-0 cursor-pointer group-hover:scale-105 transition-transform" onerror="this.src=\'/media/kano_non_sa.webp\'; this.onerror=null;" onclick="window.openImageZoom &amp;&amp; window.openImageZoom(this.src, \'{tech_name}\')" title="Clicca per ingrandire l\'immagine"/><div class="flex-1">'
                return f'<li>{img_tag}{li_content}</div></div></li>'
                
        return match.group(0)
    
    new_contenuto = re.sub(r'<li>(.*?)</li>', replace_li, contenuto, flags=re.DOTALL)
    
    cursor.execute("UPDATE kata SET contenuto = ? WHERE id = ?", (new_contenuto, kata_id))
    print(f"Updated images in kata: {titolo}")

conn.commit()
conn.close()
print("All Kata records updated with technique thumbnails!")
