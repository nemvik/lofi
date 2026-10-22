// Image coordinates use a shared 480 × 270 pixel-art stage.
export const BACKGROUNDS = [
  {
    weather: { kind: 'rain', label: 'Déšť', name: 'deště', icon: 'rain' }, story: 'cat',
    id: 'rain-room', title: 'Pokoj v dešti', note: 'Déšť za oknem',
    src: './assets/pixel-rain.png', pixel: true, effect: 'rain',
    location: 'Někde nad městem', caption: 'Déšť venku. Klid uvnitř.',
    alt: 'Pixelartový podkrovní pokoj s lampou, kávou a výhledem na deštivé město',
    windows: [[124, 18, 40, 44], [124, 67, 40, 74], [175, 18, 164, 123], [350, 18, 40, 44], [350, 67, 40, 74]],
    cup: [385, 164], lights: [[421, 123, 30]],
  },
  {
    weather: { kind: 'wind', label: 'Vítr', name: 'větru', icon: 'wind' }, story: 'train',
    id: 'night-roof', title: 'Nad městem', note: 'Hvězdy a noční světla',
    src: './assets/pixel-roof.png', pixel: true, effect: 'stars',
    location: 'Ještě jedno tiché patro', caption: 'Město usíná. My ještě chvíli ne.',
    alt: 'Pixelartová noční střešní terasa pod hvězdami s výhledem na osvětlené město',
    sky: 74, lights: [[450, 204, 27]],
  },
  {
    weather: { kind: 'snow', label: 'Sníh a vítr', name: 'sněhu a větru', icon: 'snow' }, story: 'fox',
    id: 'snow-cabin', title: 'Chata v tichu', note: 'Pomalu padá sníh',
    src: './assets/pixel-snow.png', pixel: true, effect: 'snow',
    location: 'Daleko od všeho', caption: 'Dnes k nám vede jen zasněžená cesta.',
    alt: 'Pixelartová dřevěná chata se zářícími okny v zasněženém jehličnatém lese',
    chimney: [373, 102], lights: [[327, 157, 12], [350, 157, 12], [389, 157, 14]],
  },
  {
    weather: { kind: 'rain', label: 'Déšť', name: 'deště', icon: 'rain' }, story: 'tram',
    id: 'cafe', title: 'Kavárna Pokoj', note: 'Naše původní místo',
    src: './assets/cafe.png', pixel: false,
    location: 'Kavárna Pokoj', caption: 'Tohle místo je dnes tvoje.',
    alt: 'Útulná kavárna s gramofonem, šálkem kávy a výhledem do deštivé podvečerní ulice',
  },
];

export function findBackground(id) {
  return BACKGROUNDS.find(background => background.id === id) || BACKGROUNDS[0];
}

export function weatherState(background, percent) {
  return {
    kind: background.weather.kind,
    intensity: Number.isFinite(percent) ? Math.min(1, Math.max(0, percent / 100)) : 0,
  };
}
