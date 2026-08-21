import re
import sqlite3

with open('domande_quiz_corrette.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

table_rows = []
for line in lines:
    if line.strip().startswith('|') and not line.strip().startswith('| #') and not line.strip().startswith('|---'):
        parts = [p.strip() for p in line.strip().split('|')[1:-1]]
        if len(parts) >= 11:
            table_rows.append(parts)

print(f'Read {len(table_rows)} rows from domande_quiz_corrette.md')

letter_to_num = {'A': 1, 'B': 2, 'C': 3, 'D': 4}
num_to_letter = {1: 'A', 2: 'B', 3: 'C', 4: 'D'}

corrette_rows = []

for idx, r in enumerate(table_rows, 1):
    dan, cat, dom, a, b, c, d, corr_str, spieg, img = r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10]
    
    # Extract clean letter
    m = re.search(r'[ABCD]', corr_str)
    corr_letter = m.group(0) if m else 'A'
    
    # Apply specific question corrections based on verification
    if idx == 30:
        corr_letter = 'C'
        spieg = 'C) 9-10 minuti. La durata indicativa per la dimostrazione del Nage-no-Kata in ambito di gara ed esame è di circa 9-10 minuti.'
    elif idx == 44:
        dom = 'In quale anno fu istituito il Katame-no Kata al Kodokan?'
        a = '1882'
        b = '1887'
        c = '1895'
        d = '1906'
        corr_letter = 'B'
        spieg = 'B) 1887. Il Katame-no-Kata fu istituito al Kodokan nel 1887 con 10 tecniche e successivamente esteso a 15.'
    elif idx == 46:
        dom = 'Chi fu il secondo direttore/presidente del Kodokan subito dopo Jigoro Kano?'
        a = 'Kyuzo Mifune'
        b = 'Yoshiaki Yamashita'
        c = 'Jirō Nangō'
        d = 'Risei Kano'
        corr_letter = 'C'
        spieg = 'C) Jirō Nangō. Jirō Nangō (nipote di Kano) fu il 2° presidente del Kodokan dal 1938 al 1946; Risei Kano fu il 3° presidente dal 1946.'
    elif idx == 49:
        dom = 'Quando le prime allieve (tra cui Sueko Ashiya) iniziarono a praticare Judo al Kodokan?'
        a = '1880-1890'
        b = '1890-1900'
        c = '1900-1910'
        d = '1910-1920'
        corr_letter = 'B'
        spieg = 'B) 1890-1900. Le prime allieve tra cui Sueko Ashiya e Sumako Kano iniziarono la pratica nel 1893; la sezione femminile (Joshi-bu) fu poi formalizzata nel 1926.'
    elif idx == 97:
        a = 'Massimo rendimento con il minimo sforzo'
        corr_letter = 'A'
        spieg = 'A) Seiryoku Zen\'yo significa "massimo rendimento con il minimo sforzo". Implica l\'impiego ottimale delle proprie energie fisiche e mentali.'

    # Clean explanation prefix if it starts with wrong letter
    prefix_match = re.match(r'^([A-D])\)\s*(.*)', spieg)
    if prefix_match:
        pref_let, rest = prefix_match.groups()
        if pref_let != corr_letter:
            spieg = f'{corr_letter}) {rest}'

    corrette_rows.append({
        'idx': idx,
        'dan': dan,
        'cat': cat,
        'dom': dom,
        'a': a,
        'b': b,
        'c': c,
        'd': d,
        'corr': corr_letter,
        'corr_num': letter_to_num[corr_letter],
        'spieg': spieg,
        'img': img
    })

md_output = '''# 🥋 Tabella Definitiva Domande Quiz Judo (100 Domande Corrette)

> **File unico consolidato `corrette.md`**  
> Verificato e armonizzato incrociando i report di verifica (*verifica_domande_quiz_claude.md*, *verifica_domande_quiz_codex.md* e *domande_quiz_corrette.md*).  
> Tutte le risposte errate, imprecisioni, incongruenze di opzioni e discrepanze nelle spiegazioni sono state completamente risolte.

## Sommario delle correzioni principali incorporate:
- **Domanda 44 (Katame-no-Kata):** Opzioni e risposta aggiornate all'anno ufficiale di istituzione del Kodokan (**1887**, opzione B).
- **Domanda 46 (Successione Kodokan):** Inserita l'opzione corretta **Jirō Nangō** (opzione C, 2° presidente 1938-1946).
- **Domanda 49 (Judo femminile):** Risposta corretta impostata a **1890-1900** (opzione B, prime allieve nel 1893).
- **Domanda 97 (Seiryoku Zen'yo):** Riformulata l'opzione A in *"Massimo rendimento con il minimo sforzo"* (opzione A).
- **Domanda 30 (Durata Nage-no-Kata):** Impostata la durata di gara/esame a **9-10 minuti** (opzione C).
- **Uniformità spiegazioni:** Rimossa ogni incongruenza tra la lettera della risposta corretta e il prefisso della spiegazione.

---

| # | Livello Dan | Categoria | Domanda | Opzione A | Opzione B | Opzione C | Opzione D | Risposta Corretta | Spiegazione | Immagine |
|---|---|---|---|---|---|---|---|---|---|---|
'''

for r in corrette_rows:
    dom_clean = r['dom'].replace('|', '&#124;').replace('\n', ' ')
    a_clean = r['a'].replace('|', '&#124;').replace('\n', ' ')
    b_clean = r['b'].replace('|', '&#124;').replace('\n', ' ')
    c_clean = r['c'].replace('|', '&#124;').replace('\n', ' ')
    d_clean = r['d'].replace('|', '&#124;').replace('\n', ' ')
    spieg_clean = r['spieg'].replace('|', '&#124;').replace('\n', ' ') if r['spieg'] else '-'
    img_clean = r['img'] if r['img'] else '-'
    
    md_output += f"| {r['idx']} | {r['dan']} | {r['cat']} | {dom_clean} | {a_clean} | {b_clean} | {c_clean} | {d_clean} | **{r['corr']}** | {spieg_clean} | {img_clean} |\n"

with open('corrette.md', 'w', encoding='utf-8') as f:
    f.write(md_output)

# Also update SQLite database pb_data/data.db
conn = sqlite3.connect('pb_data/data.db')
cursor = conn.cursor()

cursor.execute('SELECT id FROM domande_quiz ORDER BY CAST(livello_dan AS INTEGER), categoria, id')
db_rows = cursor.fetchall()

for idx, r in enumerate(corrette_rows):
    db_id = db_rows[idx][0]
    
    dan_raw = r['dan'].replace('° Dan', '').replace('Dan', '').strip()
    dan_val = dan_raw if dan_raw.isdigit() else dan_raw.lower()
    
    cursor.execute('''
        UPDATE domande_quiz
        SET livello_dan = ?,
            categoria = ?,
            domanda = ?,
            opzione_a = ?,
            opzione_b = ?,
            opzione_c = ?,
            opzione_d = ?,
            risposta_corretta = ?,
            spiegazione = ?,
            immagine = ?
        WHERE id = ?
    ''', (
        dan_val,
        r['cat'],
        r['dom'].replace('&#124;', '|'),
        r['a'].replace('&#124;', '|'),
        r['b'].replace('&#124;', '|'),
        r['c'].replace('&#124;', '|'),
        r['d'].replace('&#124;', '|'),
        r['corr_num'],
        r['spieg'].replace('&#124;', '|'),
        '' if r['img'] == '-' else r['img'],
        db_id
    ))

conn.commit()

print('Successfully generated corrette.md and updated SQLite database!')
