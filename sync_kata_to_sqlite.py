import sqlite3
import re

db_path = 'pb_data/data.db'

# Define rich content for each Kata matching kat_database.md
KATA_DATA = {
    'nage-no-kata': {
        'livello': 1,
        'descrizione_breve': 'Il Nage-no Kata (投の形) è la forma delle proiezioni (15 tecniche divise in 5 gruppi: Te, Koshi, Ashi, Ma-sutemi, Yoko-sutemi).',
        'contenuto': """<p>Ideato da <strong>Jigoro Kano</strong> tra il 1884 e il 1887, deriva dalle esperienze nella scuola <em>Kito Ryu</em> e costituisce, insieme al <em>Katame No Kata</em>, il <em>Randori No Kata</em>. Il suo scopo è insegnare i principi fondamentali di <strong>Kuzushi</strong> (squilibrio), <strong>Tsukuri</strong> (preparazione) e <strong>Kake</strong> (proiezione), applicando le iniziative tattiche (Sen, Go no sen, ecc.). È composto da 15 tecniche, eseguite sia a destra che a sinistra.</p>

<hr class="my-6 border-gray-200 dark:border-gray-700"/>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">1. Te Waza (Tecniche di braccia)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Uki Otoshi</strong> (Proiezione fluttuante): Tori squilibra Uke in avanti arretrando e, al terzo passo, si inginocchia tirandolo a terra.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Seoi Nage</strong> (Proiezione sopra la spalla): Su un attacco a fendente di Uke, Tori si gira caricando Uke sul dorso e proiettandolo.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kata Guruma</strong> (Ruota sulle spalle): Tori si abbassa, infila un braccio tra le gambe di Uke, lo carica sulle spalle e lo fa cadere.
  </li>
</ul>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">2. Koshi Waza (Tecniche d'anca)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Uki Goshi</strong> (Anca fluttuante): Su attacco a fendente di Uke, Tori entra con l'anca, abbraccia la vita e proietta ruotando.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Harai Goshi</strong> (Spazzata d'anca): Tori squilibra Uke, entra con l'anca e spazza la coscia di Uke sollevandola.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Tsurikomi Goshi</strong> (Anca tirando e sollevando): Uke irrigidisce il corpo; Tori si abbassa profondamente sotto il baricentro di Uke e lo proietta.
  </li>
</ul>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">3. Ashi Waza (Tecniche di gamba/piede)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Okuri Ashi Barai</strong> (Spazzare i piedi): Tori e Uke si muovono lateralmente; Tori spazza i piedi di Uke mentre si riuniscono.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Sasae Tsurikomi Ashi</strong> (Bloccaggio del piede): Tori blocca la caviglia di Uke con la pianta del piede mentre lo tira in avanti.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Uchi Mata</strong> (Falciata interno coscia): Tirando Uke in un movimento circolare, Tori spazza l'interno coscia con la propria gamba.
  </li>
</ul>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">4. Ma Sutemi Waza (Sacrificio sul dorso)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Tomoe Nage</strong> (Lancio in cerchio): Tori si lascia cadere sul dorso, posizionando il piede sull'addome di Uke per lanciarlo oltre la propria testa.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ura Nage</strong> (Lancio all'indietro): Su attacco di Uke, Tori lo abbraccia da sotto, si lancia all'indietro e lo proietta oltre la spalla.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Sumi Gaeshi</strong> (Rovesciamento nell'angolo): Tori si lascia cadere all'indietro infilando il collo del piede dietro il ginocchio di Uke, lanciandolo sopra di sé.
  </li>
</ul>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">5. Yoko Sutemi Waza (Sacrificio sul fianco)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Yoko Gake</strong> (Agganciamento laterale): Tori spazza la caviglia di Uke verso l'esterno mentre si getta sul proprio fianco, abbattendolo.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Yoko Guruma</strong> (Ruota sul fianco): Tori sfrutta l'attacco di Uke, infila una gamba tra quelle dell'avversario e si getta sul fianco proiettandolo in rotazione.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Uki Waza</strong> (Tecnica fluttuante): Tori blocca l'avanzamento di Uke distendendo la gamba e si getta sul fianco per proiettarlo in diagonale.
  </li>
</ul>"""
    },
    'katame-no-kata': {
        'livello': 2,
        'descrizione_breve': 'Il Katame-no-Kata (固の形) è la forma dei controlli e della lotta a terra (15 tecniche: Osaekomi, Shime e Kansetsu Waza).',
        'contenuto': """<p>Codificato da <strong>Jigoro Kano</strong> sulla base della scuola <em>Tenshin Shin'yo Ryu</em>, studia la lotta a terra. La sua caratteristica è la reazione sincera: per ogni immobilizzazione, Uke esegue tentativi logici di liberazione (fino a tre), ai quali Tori si adatta prima di ottenere la sottomissione (<em>Mairi</em>).</p>

<hr class="my-6 border-gray-200 dark:border-gray-700"/>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">1. Osae Komi Waza (Immobilizzazioni)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kesa Gatame</strong> (Controllo a sciarpa): Tori blocca Uke sul fianco, trattenendo braccio e collo.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kata Gatame</strong> (Controllo della spalla): Tori blocca il braccio di Uke contro il suo stesso collo, facendo pressione con il corpo.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kami Shiho Gatame</strong> (Controllo da sopra): Tori controlla Uke dalla testa, afferrando la cintura ai lati.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Yoko Shiho Gatame</strong> (Controllo dal lato): Tori si posiziona perpendicolarmente, bloccando una gamba e passando un braccio sotto il collo.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kuzure Kami Shiho Gatame</strong> (Variante da sopra): Simile a Kami Shiho, ma Tori fa passare un braccio sopra la spalla e sotto l'ascella di Uke.
  </li>
</ul>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">2. Shime Waza (Soffocamenti)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kata Juji Jime</strong> (Strangolamento a croce mista): Tori incrocia le braccia afferrando i baveri (una mano normale, l'altra rovesciata).
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Hadaka Jime</strong> (Strangolamento a mani nude): Da dietro, Tori strangola Uke con l'avambraccio sul collo, senza usare il bavero.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Okuri Eri Jime</strong> (Strangolamento al bavero scorrevole): Da dietro, Tori usa il bavero sinistro di Uke tirandolo col braccio destro attorno al collo.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kata Ha Jime</strong> (Strangolamento ad ala): Da dietro, un braccio strangola col bavero, l'altro spinge verso l'alto la testa.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Gyaku Juji Jime</strong> (Strangolamento a croce inversa): Tori è sotto e strangola Uke afferrando i baveri con entrambe le mani in presa inversa.
  </li>
</ul>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">3. Kansetsu Waza (Leve Articolari)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ude Garami</strong> (Braccio avvolto): Tori intreccia le braccia attorno a quello di Uke piegato a 90 gradi, facendo leva su gomito e spalla.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ude Hishigi Juji Gatame</strong> (Leva a croce): Tori intrappola il braccio di Uke tra le cosce, spingendo il bacino verso l'alto per forzare il gomito disteso.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ude Hishigi Ude Gatame</strong> (Leva tesa): Tori porta il braccio teso di Uke contro il proprio petto/spalla per forzare l'articolazione.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ude Hishigi Hiza Gatame</strong> (Leva col ginocchio): Tori blocca l'avambraccio di Uke col ginocchio, applicando pressione sul gomito.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ashi Garami</strong> (Gamba avvinghiata): Tori avvolge la propria gamba attorno a quella di Uke, intrappolandone il piede e facendo leva sul ginocchio avversario.
  </li>
</ul>"""
    },
    'ju-no-kata': {
        'livello': 3,
        'descrizione_breve': 'Il Ju-no-Kata (柔の形) è la forma della cedevolezza (15 movimenti fluidi in 3 gruppi: Dai-ikkyo, Dai-nikyo, Dai-sankyo).',
        'contenuto': """<p>Ideato attorno al 1887, è un kata che evidenzia l'alternanza tra "Yin" (passività) e "Yang" (iniziativa). Non necessita di tatami né di judogi e i movimenti sono lenti ma dotati di massima tensione e fluidità per sviluppare estetica e bilanciamento.</p>

<hr class="my-6 border-gray-200 dark:border-gray-700"/>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">1. Dai-ikkyo (Primo gruppo - Studio della respirazione)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Tsuki Dashi</strong> (Trafiggere con la mano): Uke tenta di colpire gli occhi; Tori schiva e lo sbilancia all'indietro estendendogli il braccio.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kata Oshi</strong> (Spingere la spalla): Uke spinge la spalla da dietro; Tori cede, blocca la mano e lo sbilancia.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ryote Dori</strong> (Presa ai polsi): Uke afferra i polsi; Tori lo sbilancia in avanti e lo carica sulla schiena.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kata Mawashi</strong> (Ruotare le spalle): Uke afferra le spalle per girare Tori; Tori si gira, blocca il braccio e lo carica sul dorso.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ago Oshi</strong> (Spinta al mento): Uke tenta un montante al mento; Tori devia il colpo, afferra il braccio e spinge Uke all'indietro.
  </li>
</ul>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">2. Dai-nikyo (Secondo gruppo - Studio delle posizioni)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kiri Oroshi</strong> (Fendente dall'alto): Uke colpisce con un fendente a mano aperta; Tori schiva, afferra il braccio e lo sbilancia alle spalle.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ryokata Oshi</strong> (Spinta alle due spalle): Uke spinge le spalle verso il basso da dietro; Tori scivola via e sbilancia Uke facendo leva.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Naname Uchi</strong> (Colpo diagonale): Uke attacca in diagonale; Tori para, ruota e sbilancia Uke caricandolo sulle anche.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Katate Dori</strong> (Presa a un polso): Uke afferra un polso; Tori alza il braccio, si gira e carica Uke sull'anca.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Katate Age</strong> (Sollevare il braccio): Entrambi sollevano un braccio advancing; Tori devia il contatto spingendo il gomito.
  </li>
</ul>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">3. Dai-sankyo (Terzo gruppo - Armonia e movimenti attivi/passivi)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Obi Tori</strong> (Presa alla cintura): Uke cerca di afferrare la cintura; Tori devia le braccia, ruota e lo carica sull'anca.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Mune Oshi</strong> (Spinta al petto): Uke spinge il petto; Tori neutralizza la spinta incrociando le braccia e sbilancia in torsione.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Tsuki Age</strong> (Montante): Uke carica un montante dal basso; Tori arretra, afferra il braccio in leva e sbilancia Uke ruotando.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Uchi Oroshi</strong> (Colpo a martello): Uke sferra un colpo dall'alto; Tori schiva girando alle spalle e controlla in leva il braccio.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ryogan Tsuki</strong> (Attacco agli occhi): Uke punta le dita agli occhi; Tori blocca e lo carica sul fianco.
  </li>
</ul>"""
    },
    'kime-no-kata': {
        'livello': 4,
        'descrizione_breve': 'Il Kime-no-Kata (極の形) è la forma dell’autodifesa samurai (20 tecniche con daga e katana, divise in Idori e Tachiai).',
        'contenuto': """<p>In origine chiamato <em>Shinken Shobu No Kata</em> (combattimento reale), tramanda le tecniche di autodifesa dei samurai (influenza <em>Tenshin Shin'yo Ryu</em>). Impone decisione estrema (<em>Kime</em>) e uso del <em>Kiai</em>. Si utilizzano daga (<em>tanto</em>) e spada (<em>katana</em>).</p>

<hr class="my-6 border-gray-200 dark:border-gray-700"/>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">1. Idori (Tecniche in ginocchio - 8)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ryote Dori</strong>: Presa ai polsi; Tori colpisce al plesso solare col ginocchio e applica una leva.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Tsukkake</strong>: Pugno allo stomaco; Tori schiva, colpisce il viso e applica leva al braccio.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Suri Age</strong>: Colpo alla fronte; Tori para, colpisce il ventre e atterra Uke in leva.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Yoko Uchi</strong>: Pugno alla tempia; Tori schiva, blocca Uke a terra e colpisce col gomito.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ushiro Dori</strong>: Presa da dietro; Tori si lancia in avanti rotolando e colpisce all'inguine.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Tsukkomi</strong>: Pugnalata al ventre; Tori schiva, colpisce al viso e disarma torcendo il braccio.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kirikomi</strong>: Fendente con pugnale; Tori blocca il polso e applica una leva a terra.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Yoko Tsuki</strong>: Pugnalata laterale; Tori ruota, colpisce e blocca l'arto armato in leva.
  </li>
</ul>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">2. Tachiai (Tecniche in piedi - 12)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ryote Dori</strong>: Presa ai polsi; Tori colpisce all'inguine con un calcio e applica leva al braccio.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Sode Tori</strong>: Presa alla manica da dietro; Tori ruota, colpisce il ginocchio e proietta (Osoto Gari).
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Tsukkake</strong>: Pugno al viso; Tori devia il colpo, passa dietro e strangola (Hadaka Jime).
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Tsukiage</strong>: Montante al mento; Tori arretra, afferra il polso, blocca sotto l'ascella in leva.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Suri Age</strong>: Colpo alla fronte dall'alto; Tori para, sferra un pugno e proietta d'anca.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Yoko Uchi</strong>: Pugno laterale; Tori scivola alle spalle e strangola Uke trascinandolo giù.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Keage</strong>: Calcio all'inguine; Tori lo afferra dal basso, tira la gamba e contrattacca.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ushiro Dori</strong>: Presa da dietro; Tori si abbassa e lo proietta con Seoi Nage, poi colpisce il viso.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Tsukkomi</strong>: Pugnalata al ventre; Tori schiva, colpisce e applica la leva in piedi.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kirikomi</strong>: Fendente con pugnale; Tori blocca il braccio teso intrappolandolo sotto l'ascella.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Nuki Kake</strong>: Sfoderamento spada; Tori balza, blocca la mano sul fodero, ruota e strangola.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kiri Oroshi</strong>: Fendente a due mani; Tori schiva, afferra i polsi, sbilancia e applica leva al braccio.
  </li>
</ul>"""
    },
    'kodokan-goshin-jutsu': {
        'livello': 5,
        'descrizione_breve': 'Il Kodokan Goshin Jutsu (講道館護身術) è la forma moderna di autodifesa (21 tecniche contro prese, percussioni, pugnale, bastone e pistola).',
        'contenuto': """<p>Adottato ufficialmente nel 1958, sintetizza le tecniche di difesa personale adattate alla società moderna. Un elemento distintivo è <em>Iki Ai Nagara</em>, la gestione continua della distanza, includendo percussioni (<em>Atemi</em>) e disarmi.</p>

<hr class="my-6 border-gray-200 dark:border-gray-700"/>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">1. Senza armi - Quando si viene afferrati (7 tecniche)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ryote Dori</strong> (Ai polsi): Tori si libera, colpisce alla tempia e applica leva al polso (Kote hineri).
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Hidari Eri Dori</strong> (Bavero sinistro): Tori colpisce il viso e lo porta a terra torcendo il polso.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Migi Eri Dori</strong> (Bavero destro): Tori sferra un montante al mento e proietta invertendo il polso (Kote gaeshi).
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kataude Dori</strong> (Braccio da dietro): Tori gira, colpisce il ginocchio con un calcio e applica leva al braccio.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ushiro Eri Dori</strong> (Bavero da dietro): Tori ruota, colpisce il plesso solare e intrappola il braccio al suolo.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ushiro Jime</strong> (Strangolamento da dietro): Tori si abbassa, tira giù il braccio, si gira e stende il gomito in leva.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Kakae Dori</strong> (Abbraccio da dietro): Tori pesta il piede di Uke, abbassa il bacino, si gira e proietta in diagonale.
  </li>
</ul>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">2. Senza armi - Attacchi a distanza (5 tecniche)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Naname Uchi</strong> (Colpo diagonale): Tori para, sferra un montante, afferra la gola e lo proietta indietro (Osoto otoshi).
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Ago Tsuki</strong> (Montante): Tori devia verso l'alto per torcere braccio e polso e lo abbatte in diagonale.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Gammen Tsuki</strong> (Pugno al viso): Tori schiva, colpisce il costato con un pugno e lo strangola da dietro.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Mae Geri</strong> (Calcio frontale): Tori schiva a lato, afferra piede e caviglia girandola, spingendolo sulla schiena.
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Yoko Geri</strong> (Calcio laterale): Tori para col braccio, lo aggancia alle spalle e lo abbatte indietro.
  </li>
</ul>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">3. Con Armi - Daga, Bastone e Pistola (9 tecniche)</h3>
<ul class="space-y-2 mb-6">
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Daga (3)</strong>: Tsukkake (estrazione), Choku Tsuki (pugnalata dritta), Naname Tsuki (pugnalata diagonale).
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Bastone (3)</strong>: Furiage (caricato dall'alto), Furioroshi (fendente), Morote Tsuki (punta a due mani).
  </li>
  <li class="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-gray-900 dark:text-white">Pistola (3)</strong>: Shomen Zuke (addome), Koshi Gamae (fianco), Haimen Zuke (schiena).
  </li>
</ul>"""
    },
    'koshiki-no-kata': {
        'livello': 6,
        'descrizione_breve': 'Il Koshiki-no-Kata (古式の形) preserva le tecniche antiche della Kito-ryu in armatura samurai (21 movimenti: Omote e Ura).',
        'contenuto': """<p>Creato preservando fedelmente le tecniche della scuola <em>Kito Ryu</em> studiate da Jigoro Kano. Tutti i movimenti presuppongono di indossare una pesante armatura samurai (<em>Yoroi</em>). Si divide in due serie per un totale di 21 movimenti.</p>

<hr class="my-6 border-gray-200 dark:border-gray-700"/>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">Omote (Fronte - 14 tecniche)</h3>
<ol class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">1. Tai (Posizione di base)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">2. Yume-no-uchi (Nel sogno)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">3. Ryokuhi (Eludere la forza)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">4. Mizu-guruma (La ruota d'acqua)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">5. Mizu-nagare (La corrente d'acqua)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">6. Hikiotoshi (Far cadere tirando)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">7. Ko-daore (Tronco abbattuto)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">8. Uchikudaki (Fracassare d'un colpo)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">9. Tani-otoshi (Caduta nella valle)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">10. Kuruma-daore (Ruota abbattuta)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">11. Shikoro-dori (Presa al collo)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">12. Shikoro-gaeshi (Rovesciamento)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">13. Yudachi (Acquazzone serale)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">14. Taki-otoshi (Caduta cascata)</li>
</ol>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">Ura (Retro - 7 tecniche)</h3>
<ol class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">1. Mi-kudaki (Frantumare il corpo)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">2. Kuruma-gaeshi (Rovesciamento a ruota)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">3. Mizu-iri (Immersione nell'acqua)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">4. Ryusetsu (Neve sul salice)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">5. Sakaotoshi (Caduta a capofitto)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">6. Yukiore (Ramo spezzato)</li>
  <li class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-sm font-medium">7. Iwa-nami (Onda contro le rocce)</li>
</ol>"""
    },
    'itsutsu-no-kata': {
        'livello': 6,
        'descrizione_breve': 'L’Itsutsu-no-Kata (五の形) è la forma dei 5 principi naturali (Seiryoku Zen’yo e forze universali).',
        'contenuto': """<p>Kano ideò questo kata astratto in cui i 5 movimenti non possiedono un nome ma solo un numero d'ordine (Forma 1, 2, 3, 4, 5). Queste forme incarnano la suprema <strong>Massima Efficacia</strong> e rievocano il movimento delle forze della natura e dell'universo (le onde che salgono e scendono, l'acqua che fluisce, le due energie che si evitano per non distruggersi a vicenda).</p>

<hr class="my-6 border-gray-200 dark:border-gray-700"/>

<ul class="space-y-3">
  <li class="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-red-600 dark:text-red-400 font-bold block mb-1">Primo Principio (Ippon-me)</strong>
    Rappresenta l'applicazione razionale dell'energia continua contro una forza opposta, dimostrando come una pressione minima e costante possa vincere una resistenza imponente.
  </li>
  <li class="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-red-600 dark:text-red-400 font-bold block mb-1">Secondo Principio (Nihon-me)</strong>
    Simboleggia l'elusione e l'assorbimento dell'attacco, sfruttando l'inerzia e la direzione della spinta avversaria.
  </li>
  <li class="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-red-600 dark:text-red-400 font-bold block mb-1">Terzo Principio (Sanbon-me)</strong>
    Evoca la forza circolare del vortice d'acqua o del ciclone, dove il centro controlla il movimento periferico.
  </li>
  <li class="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-red-600 dark:text-red-400 font-bold block mb-1">Quarto Principio (Yonhon-me)</strong>
    Simboleggia l'impeto della marea e delle onde dell'oceano che travolgono ogni ostacolo sul bagnasciuga.
  </li>
  <li class="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50">
    <strong class="text-red-600 dark:text-red-400 font-bold block mb-1">Gobo-me (Quinto Principio)</strong>
    Rappresenta il vuoto, il cedimento totale di fronte ad una forza cosmica e la riconciliazione finale tra due energie opposte.
  </li>
</ul>"""
    },
    'seiryoku-zenyo-kokumin-taiiku-no-kata': {
        'livello': 0,
        'descrizione_breve': 'Forma dell’Educazione Fisica e Morale Nazionale creata da Jigoro Kano (Tandoku Renshu e Sotai Renshu).',
        'contenuto': """<p>Il <strong>Seiryoku Zen'yo Kokumin Taiiku</strong> (Forma dell'Educazione Fisica Nazionale) è stato ideato da Jigoro Kano per combinare l'allenamento fisico, l'autodifesa e lo sviluppo morale sia individuale che di gruppo.</p>

<hr class="my-6 border-gray-200 dark:border-gray-700"/>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">1. Tandoku Renshu (Esercizi individuali - 28 movimenti)</h3>
<p class="text-sm text-gray-600 dark:text-gray-300 mb-4">Comprende colpi di pugno, gomito e calcio eseguiti nell'aria (Goho-ate, Kagami-migaki, Taka-ate, ecc.).</p>

<h3 class="text-xl font-bold text-red-600 dark:text-red-400 mt-6 mb-3">2. Sotai Renshu (Esercizi a coppie)</h3>
<p class="text-sm text-gray-600 dark:text-gray-300">Suddiviso in <strong>Kime Shiki</strong> (10 tecniche di autodifesa a coppie) e <strong>Ju Shiki</strong> (10 tecniche del Ju-no-Kata riadattate per la pratica generale).</p>"""
    },
    'introduzione-storica-dei-kata': {
        'livello': 0,
        'descrizione_breve': 'Origine, filosofia ed evoluzione storica dei Kata codificati dal fondatore Jigoro Kano nel Judo Kodokan.',
        'contenuto': """<p>Il <strong>Judo Kodokan</strong> comprende diversi Kata (Forme), ideati per tramandare i principi fondamentali, la tecnica e lo spirito della disciplina. I Kata costituiscono l'enciclopedia vivente del Judo, preservando sia i principi biomeccanici che la tradizione etica marziale.</p>"""
    },
    'nage-ura-no-kata': {
        'livello': 0,
        'descrizione_breve': 'Il Nage-Ura-No-Kata è la forma delle contromosse (Kaeshi-waza) sviluppata dal grande maestro Kyuzo Mifune.',
        'contenuto': """<p>Ideato dal Maestro <strong>Kyuzo Mifune</strong> (10° Dan), il <em>Nage Ura No Kata</em> studia 15 contromosse (Kaeshi-Waza) in risposta alle principali proiezioni del Nage-no-Kata, applicando il principio dell'adattamento totale e del bilanciamento istantaneo.</p>"""
    }
}

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

for slug, data in KATA_DATA.items():
    cursor.execute("""
        UPDATE kata 
        SET contenuto = ?, descrizione_breve = ?, livello = ? 
        WHERE slug = ? OR titolo LIKE ?
    """, (data['contenuto'], data['descrizione_breve'], data['livello'], slug, f"%{slug.replace('-', ' ')}%"))
    print(f"Updated {slug}: {cursor.rowcount} row(s) updated.")

conn.commit()
conn.close()
print("Done updating SQLite database!")
