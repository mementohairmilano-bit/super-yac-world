// Badge "YAC Hero" — card digitale personalizzata generata su <canvas> (client-side, niente
// backend). Si sblocca lasciando l'email nel pannello Classifica: la diamo a TUTTI gli iscritti
// (non è un premio in palio → niente concorso a premi), pensata per essere scaricata e
// condivisa sui social → visibilità organica per YAC.

const LOGO_URL = './assets/logo_yac.webp';
const W = 1080, H = 1350; // formato 4:5, ottimo per feed/story social

// rango dinamico in base al punteggio: dà il "feel da campione" senza selezionare un vincitore
// (tutti restano "YAC HERO", cambia solo il grado). Ritorna { key, title }.
export function tierFor(score) {
  const s = Math.max(0, Math.floor(score || 0));
  if (s >= 12000) return { key: 'champion', title: 'CHAMPION' };
  if (s >= 6000)  return { key: 'legend',   title: 'LEGEND' };
  if (s >= 2000)  return { key: 'fighter',  title: 'FIGHTER' };
  return { key: 'rookie', title: 'ROOKIE' };
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // fallback: si disegna senza logo
    img.src = src;
  });
}

// assicura che i font (Syne/DM Sans, già caricati dalla pagina) siano pronti prima di disegnare,
// altrimenti il canvas userebbe un fallback di sistema.
async function fontsReady() {
  try {
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load('800 100px Syne'),
        document.fonts.load('700 40px "DM Sans"'),
      ]);
      await document.fonts.ready;
    }
  } catch (e) {}
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Genera il badge. Ritorna una Promise<{ dataUrl, canvas }>.
//   nickname, score: dati del giocatore
//   charName: nome del personaggio scelto (es. "Memento")
//   accent: colore accento (#hex), tipicamente il colore della card del personaggio
export async function generateBadge({ nickname, score, charName, accent }) {
  await fontsReady();
  const tier = tierFor(score);
  const acc = accent || '#F2C53D';
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // sfondo brand (gradiente + alone)
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2a1626');
  bg.addColorStop(1, '#0c0810');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 120, 40, W / 2, 120, 900);
  glow.addColorStop(0, acc + '33');
  glow.addColorStop(1, '#0000');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // cornice
  ctx.lineWidth = 6;
  ctx.strokeStyle = acc + 'cc';
  roundRect(ctx, 40, 40, W - 80, H - 80, 44); ctx.stroke();

  ctx.textAlign = 'center';

  // logo YAC
  const logo = await loadImage(LOGO_URL);
  if (logo) {
    const lw = 220, lh = lw * (logo.height / logo.width || 1);
    ctx.drawImage(logo, (W - lw) / 2, 110, lw, lh);
  }

  // titolo "YAC HERO"
  ctx.fillStyle = '#fff';
  ctx.font = '800 138px Syne, sans-serif';
  ctx.fillText('YAC HERO', W / 2, 470);

  // chip rango
  ctx.font = '800 40px Syne, sans-serif';
  const rankText = tier.title;
  const tw = ctx.measureText(rankText).width;
  const chipW = tw + 80, chipH = 78, chipX = (W - chipW) / 2, chipY = 510;
  ctx.fillStyle = acc;
  roundRect(ctx, chipX, chipY, chipW, chipH, chipH / 2); ctx.fill();
  ctx.fillStyle = '#1a1020';
  ctx.fillText(rankText, W / 2, chipY + 53);

  // nickname
  ctx.fillStyle = acc;
  ctx.font = '800 30px Syne, sans-serif';
  ctx.fillText('GIOCATORE', W / 2, 700);
  ctx.fillStyle = '#fff';
  let nick = (nickname || 'Anonimo');
  ctx.font = '800 92px Syne, sans-serif';
  while (ctx.measureText(nick).width > W - 160 && nick.length > 1) nick = nick.slice(0, -1);
  ctx.fillText(nick, W / 2, 790);

  // punteggio
  ctx.fillStyle = acc;
  ctx.font = '800 30px Syne, sans-serif';
  ctx.fillText('PUNTEGGIO', W / 2, 940);
  ctx.fillStyle = '#F2C53D';
  ctx.font = '800 120px Syne, sans-serif';
  ctx.fillText(String(Math.max(0, Math.floor(score || 0))), W / 2, 1050);

  // personaggio
  if (charName) {
    ctx.fillStyle = '#c4b8c2';
    ctx.font = '700 34px "DM Sans", sans-serif';
    ctx.fillText('con ' + charName, W / 2, 1130);
  }

  // footer
  ctx.fillStyle = '#fff';
  ctx.font = '800 34px Syne, sans-serif';
  ctx.fillText('SUPER YAC WORLD', W / 2, H - 130);
  ctx.fillStyle = '#9a8fa6';
  ctx.font = '700 26px "DM Sans", sans-serif';
  const d = new Date();
  const date = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  ctx.fillText('Break the Mold · ' + date, W / 2, H - 90);

  return { dataUrl: canvas.toDataURL('image/png'), canvas };
}

function dataUrlToFile(dataUrl, filename) {
  const [head, b64] = dataUrl.split(',');
  const mime = (head.match(/:(.*?);/) || [])[1] || 'image/png';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

export function downloadBadge(dataUrl, filename = 'yac-hero-badge.png') {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

// condivide il badge: Web Share API con file dove supportata, altrimenti scarica.
export async function shareBadge(dataUrl, text = 'Sono un YAC HERO in Super Yac World! 🏅 Gioca su superyacworld.it') {
  try {
    const file = dataUrlToFile(dataUrl, 'yac-hero-badge.png');
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text, title: 'YAC HERO' });
      return true;
    }
  } catch (e) { /* annullato o non supportato → fallback */ }
  downloadBadge(dataUrl);
  return false;
}
