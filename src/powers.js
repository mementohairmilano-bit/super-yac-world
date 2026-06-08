// Superpoteri selezionabili per l'eroe personalizzato. `special` = chiave di dispatch in
// GameScene.special(). I primi 4 sono quelli dei 4 eroi originali; gli altri sono NUOVI.
export const POWERS = [
  { id: 'shoot',     special: 'shoot',     name: 'Spara',        emoji: '🔥', desc: 'raffica di 5 colpi' },
  { id: 'invince',   special: 'invince',   name: 'Invincibile',  emoji: '⭐', desc: 'immune ai danni per ~6s' },
  { id: 'pound',     special: 'pound',     name: 'Ground Pound', emoji: '💥', desc: "schianto a terra con onda d'urto" },
  { id: 'slowmo',    special: 'slowmo',    name: 'Ferma-tempo',  emoji: '⏳', desc: 'rallenta il tempo per ~5s' },
  { id: 'dash',      special: 'dash',      name: 'Scatto',       emoji: '💨', desc: 'scatto in avanti che travolge i nemici' },
  { id: 'magnet',    special: 'magnet',    name: 'Calamita',     emoji: '🧲', desc: 'attira le Gocce vicine per qualche secondo' },
  { id: 'shield',    special: 'shield',    name: 'Scudo',        emoji: '🛡️', desc: 'assorbe un colpo senza rimpicciolire' },
  { id: 'superjump', special: 'superjump', name: 'Super-salto',  emoji: '🦘', desc: 'un balzo altissimo' },
];
export function powerById(id) { return POWERS.find((p) => p.id === id) || POWERS[0]; }
