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
//   heroArt: mappa { key: url } degli artwork a figura intera dei 4 eroi
//   selectedKey: chiave dell'eroe scelto (viene evidenziato)
//   crew: [{ key, name, accent }] in ordine → la "squadra" disegnata in basso
export async function generateBadge({ nickname, score, charName, accent, heroArt, selectedKey, crew }) {
  await fontsReady();
  const tier = tierFor(score);
  const acc = accent || '#F2C53D';
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

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
    const lw = 110, lh = lw * (logo.height / logo.width || 1);   // più piccolo e in alto: NON copre "YAC HERO"
    ctx.drawImage(logo, (W - lw) / 2, 36, lw, lh);
  }

  // titolo "YAC HERO"
  ctx.fillStyle = '#fff';
  ctx.font = '800 124px Syne, sans-serif';
  ctx.fillText('YAC HERO', W / 2, 295);

  // chip rango
  ctx.font = '800 38px Syne, sans-serif';
  const rankText = tier.title;
  const tw = ctx.measureText(rankText).width;
  const chipW = tw + 76, chipH = 74, chipX = (W - chipW) / 2, chipY = 330;
  ctx.fillStyle = acc;
  roundRect(ctx, chipX, chipY, chipW, chipH, chipH / 2); ctx.fill();
  ctx.fillStyle = '#1a1020';
  ctx.fillText(rankText, W / 2, chipY + 50);

  // nickname
  ctx.fillStyle = acc;
  ctx.font = '800 30px Syne, sans-serif';
  ctx.fillText('GIOCATORE', W / 2, 505);
  ctx.fillStyle = '#fff';
  let nick = (nickname || 'Anonimo');
  ctx.font = '800 88px Syne, sans-serif';
  while (ctx.measureText(nick).width > W - 160 && nick.length > 1) nick = nick.slice(0, -1);
  ctx.fillText(nick, W / 2, 590);

  // punteggio
  ctx.fillStyle = acc;
  ctx.font = '800 30px Syne, sans-serif';
  ctx.fillText('PUNTEGGIO', W / 2, 690);
  ctx.fillStyle = '#F2C53D';
  ctx.font = '800 112px Syne, sans-serif';
  ctx.fillText(String(Math.max(0, Math.floor(score || 0))), W / 2, 795);

  // ---- crew: i 4 eroi in basso, con quello scelto in evidenza ----
  const list = (Array.isArray(crew) && crew.length)
    ? crew
    : (charName ? [{ key: selectedKey, name: charName, accent: acc }] : []);
  if (heroArt && list.length) {
    const imgs = await Promise.all(list.map((c) => loadImage(heroArt[c.key])));
    const yBase = 1255;               // linea dei "piedi" comune
    const CH = 335, OH = 220;         // altezza eroe scelto / altri
    const gap = 26, maxW = W - 150;   // spaziatura e larghezza massima della striscia

    // tieni solo gli eroi caricati correttamente (fallback: salta i mancanti)
    const ents = [];
    list.forEach((c, i) => {
      const img = imgs[i]; if (!img) return;
      const ratio = (img.width && img.height) ? img.width / img.height : 0.62;
      ents.push({ c, img, sel: c.key === selectedKey, ratio, h: c.key === selectedKey ? CH : OH });
    });

    // se la fila non ci sta in larghezza, riscala tutto in proporzione
    let total = ents.reduce((s, e) => s + e.h * e.ratio, 0) + gap * Math.max(0, ents.length - 1);
    if (total > maxW && total > 0) { const k = maxW / total; ents.forEach((e) => { e.h *= k; }); total = maxW; }

    // posiziona (fila centrata, allineata in basso)
    let x = (W - total) / 2;
    ents.forEach((e) => { e.w = e.h * e.ratio; e.x = x; e.cx = x + e.w / 2; x += e.w + gap; });

    const selEnt = ents.find((e) => e.sel);

    // alone d'accento dietro l'eroe scelto → lo fa risaltare
    if (selEnt) {
      const gy = yBase - selEnt.h * 0.55;
      const g = ctx.createRadialGradient(selEnt.cx, gy, 30, selEnt.cx, gy, selEnt.h * 0.9);
      g.addColorStop(0, acc + '66'); g.addColorStop(1, '#0000');
      ctx.fillStyle = g; ctx.fillRect(0, yBase - selEnt.h - 80, W, selEnt.h + 140);
    }

    // ombre a terra (radicano le figure)
    ents.forEach((e) => {
      ctx.save();
      ctx.globalAlpha = e.sel ? 0.32 : 0.18;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(e.cx, yBase + 6, e.w * 0.42, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // prima gli altri (attenuati), poi l'eroe scelto (pieno) sopra
    ents.filter((e) => !e.sel).forEach((e) => {
      ctx.save(); ctx.globalAlpha = 0.5;
      ctx.drawImage(e.img, e.x, yBase - e.h, e.w, e.h);
      ctx.restore();
    });
    if (selEnt) ctx.drawImage(selEnt.img, selEnt.x, yBase - selEnt.h, selEnt.w, selEnt.h);

    // targhetta col nome dell'eroe scelto
    const selName = (selEnt && selEnt.c.name) || charName;
    if (selName) {
      ctx.font = '800 34px Syne, sans-serif';
      const t = 'CON ' + selName.toUpperCase();
      const ptw = ctx.measureText(t).width;
      const pw = ptw + 64, ph = 64, px = (W - pw) / 2, py = 843;
      ctx.fillStyle = acc; roundRect(ctx, px, py, pw, ph, ph / 2); ctx.fill();
      ctx.fillStyle = '#1a1020'; ctx.fillText(t, W / 2, py + 44);
    }
  } else if (charName) {
    // fallback testuale (vecchio comportamento) se gli artwork non sono disponibili
    ctx.fillStyle = '#c4b8c2';
    ctx.font = '700 34px "DM Sans", sans-serif';
    ctx.fillText('con ' + charName, W / 2, 1130);
  }

  // footer
  ctx.fillStyle = '#fff';
  ctx.font = '800 30px Syne, sans-serif';
  const d = new Date();
  const date = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  ctx.fillText('SUPER YAC WORLD · ' + date, W / 2, 1300);

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
