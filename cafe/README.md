# Pokoj — lo-fi kavárna

Český přehrávač původní lo-fi hudby pro soustředění i chvíle, kdy chceš víc energie.
Statická stránka bez frameworku, balíčků a externí hudební služby.

## Spuštění

```sh
cd cafe # pokud jsi v nadřazeném adresáři lofi
npm run dev
```

Otevři http://127.0.0.1:4173 a stiskni Pustit hudbu.
Je potřeba Python 3 pro lokální server; JavaScript běží v prohlížeči.

## Funkce

- Patnáct původních skladeb (32–64 taktů, 60–122 BPM), celkem přibližně 33 minut.
- Tři styly: jazzové lo-fi (9 skladeb), lo-fi hip-hop (3) a chill house (3).
- Přepínač stylů včetně celé kolekce; další a předchozí skladba zůstávají ve vybraném stylu.
- Elektrické a tlumené piano, syntetická nylonová kytara, vibrafon a syntezátory.
- Bossa, rozložené akordy, lehký swing i pomalé noční aranže s basou a bicími.
- Houpavý hip-hop s výraznějšími bicími (92–100 BPM) a rovný house beat (112–122 BPM).
- Bezešvé smyčky přes Web Audio; změna skladby s prolínáním.
- Předem připravené MP3 pro rychlý start; při nedostupnosti se stejná
  skladba znovu syntetizuje v prohlížeči pomocí `OfflineAudioContext`.
- Samostatný syntetický déšť, kavárna a praskání vinylu.
- Časovač 25/50 minut, pauza/reset a režim soustředění.
- Export vybrané skladby do stereo 16bitového WAV.
- Nastavení uložené lokálně, přehrávání vždy až po kliknutí.
- Animované okno s deštěm, pára nad kávou a jemné světlo lampy a svíček.
- Čtyři prostředí s náhledy: pixelartový pokoj v dešti, noční střecha,
  zasněžená chata a původní kavárna. Výběr se ukládá nezávisle na hudbě.
- Každá pixelartová scéna má vlastní animaci: déšť a pára, hvězdy s občasnou
  padající hvězdou nebo sníh a kouř z komína.
- Pozadí lze zastavit i v režimu soustředění. Výchozí pohyb respektuje
  systémové omezení animací; mimo obrazovku a na skryté kartě se zastaví.
- Klávesy: mezerník přehrávání, M ztlumení, F soustředění, Esc návrat.

Časovač běží nezávisle na hudbě. Dokončení oznamuje zprávou; hudba pokračuje.
Uzavření stránky časovač zruší. Pozadí se nepřidává do WAV exportu.
Hudba se opakuje a není externím živým rádiem. Operační systém může
přehrávání přerušit při uspání zařízení.

## Ověření

```sh
npm test
npm run check
```

Node 22+ podporuje nastavení test runneru použité v tomto projektu.
Manuální kontrola: přehrát/pozastavit, rychle přepnout nálady, mute,
mixér, export WAV, časovač, mobilní šířka a klávesnice.

## Soubory

- `dist/`: hotová stránka, stačí nasadit jako statický web.
- `dist/catalog.js`: společný katalog skladeb, notový materiál a aranže.
- `dist/audio.js`: syntéza a přehrávač; cache tří posledních dekódovaných skladeb.
- `dist/assets/audio/`: připravené verze vlastních skladeb.
- `dist/scene.js`: animace zarovnaná s ilustrací, maximálně 24 snímků za sekundu.
- `dist/backgrounds.js`: prostředí, popisky a souřadnice efektů.
- `dist/pixel-atmosphere.js`: animace na pixelové mřížce 480 × 270.
- `dist/model.js`: časovač, validace nastavení a WAV kodér.
- `tests/`: testy chování.
- `.openai/hosting.json`: identita soukromého Sites projektu.

## Nasazení na Vercel

Importuj GitHub repozitář, nastav **Root Directory: `cafe`**,
**Framework Preset: Other**, prázdný **Build Command** a
**Output Directory: `dist`**. Žádné proměnné prostředí nejsou potřeba.
Produkční větev je `main`; další push spustí automatické nasazení.

## Příprava hudby

Nové skladby jsou vlastní deterministické partitury v `catalog.js`, nikoli
stažené nahrávky. `tests/render-music-browser.js` je Playwright funkce:
na lokální stránce vykreslí aranže, ověří signál a uloží WAV
mastery do ignorovaného `artifacts/`. Každý se pak zakóduje například:

```sh
ffmpeg -i artifacts/pokoj-ranni-filtr.wav -c:a libmp3lame -b:a 128k -map_metadata -1 dist/assets/audio/ranni-filtr.mp3
```

Pro vykreslení jednoho stylu otevři před spuštěním skriptu `/?render=hiphop`
nebo `/?render=house`; parametr přijímá i ID konkrétní skladby.

`tests/audio-browser.js` ověřuje skutečné přehrávání, všechny připravené
smyčky a omezení cache. `tests/collection-browser.js` ověřuje výběr,
obnovu nastavení, animaci, omezený pohyb a mobilní zobrazení.
`tests/styles-browser.js` ověřuje nové styly, filtrování kolekce,
pohyb mezi skladbami uvnitř stylu a obnovu vybrané skladby po načtení.
`tests/backgrounds-browser.js` ověřuje načtení a animace všech prostředí,
pozastavení, obnovení výběru, režim soustředění a mobilní rozložení.

Technický základ: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API),
[OfflineAudioContext](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext)
a [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode).

Ilustrace `dist/assets/cafe.png` vznikla vestavěným Imagegen.
Zadání: útulná evropská jazzová kavárna za modré hodiny, teplá světla,
gramofon, šálek a notebook, široké deštivé okno; malovaná animovaná
scenérie, ořechově hnědá a tlumená modrozelená, bez textu a log.
Přesné zadání je v `docs/image-generation.md`, výsledky ověření
v `docs/verification.md`.
