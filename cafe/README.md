# Pokoj — lo-fi kavárna

Český přehrávač původní jazzové lo-fi hudby pro soustředění.
Statická stránka bez frameworku, balíčků a externí hudební služby.

## Spuštění

```sh
cd cafe # pokud jsi v nadřazeném adresáři lofi
npm run dev
```

Otevři http://127.0.0.1:4173 a stiskni Pustit hudbu.
Je potřeba Python 3 pro lokální server; JavaScript běží v prohlížeči.

## Funkce

- Tři původní 32taktové skladby v tempu 62–74 BPM.
- FM elektrické piano, basa, swingové bicí a prostorové efekty.
- Bezešvé smyčky přes Web Audio; změna skladby s prolínáním.
- Předem připravené MP3 pro rychlý start; při nedostupnosti se stejná
  skladba znovu syntetizuje v prohlížeči pomocí `OfflineAudioContext`.
- Samostatný syntetický déšť, kavárna a praskání vinylu.
- Časovač 25/50 minut, pauza/reset a režim soustředění.
- Export vybrané skladby do stereo 16bitového WAV.
- Nastavení uložené lokálně, přehrávání vždy až po kliknutí.
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
- `dist/audio.js`: vlastní skladby, syntéza a přehrávač.
- `dist/assets/audio/`: připravené verze vlastních skladeb.
- `dist/model.js`: časovač, validace nastavení a WAV kodér.
- `tests/`: testy chování.
- `.openai/hosting.json`: identita soukromého Sites projektu.

Technický základ: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API),
[OfflineAudioContext](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext)
a [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode).

Ilustrace `dist/assets/cafe.png` vznikla vestavěným Imagegen.
Zadání: útulná evropská jazzová kavárna za modré hodiny, teplá světla,
gramofon, šálek a notebook, široké deštivé okno; malovaná animovaná
scenérie, ořechově hnědá a tlumená modrozelená, bez textu a log.
Přesné zadání je v `docs/image-generation.md`, výsledky ověření
v `docs/verification.md`.
