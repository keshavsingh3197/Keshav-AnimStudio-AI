export type ReactionExpression =
  | 'surprised'
  | 'laughing'
  | 'confused'
  | 'unimpressed'
  | 'angry'
  | 'mindblown'
  | 'facepalm'
  | 'takla'
  | 'boom'
  | 'adaab';

export const REACTION_PRESETS: readonly { id: ReactionExpression; label: string; defaultCaption: string }[] = [
  { id: 'surprised', label: '😲 Surprised Shock', defaultCaption: 'AREY BAAP RE!' },
  { id: 'laughing', label: '😂 Belly Laugh', defaultCaption: 'HAHAHA!' },
  { id: 'angry', label: '😡 MJO Fury Angry', defaultCaption: 'DIMAG KHARAB?!' },
  { id: 'takla', label: '🥚 Shiny Takla Shock', defaultCaption: 'TAKLA KAR DIYA?!' },
  { id: 'facepalm', label: '🤦 Facepalm', defaultCaption: 'KYA KAR DIYA!' },
  { id: 'mindblown', label: '🤯 Mind Blown Burst', defaultCaption: 'GAJAB!' },
  { id: 'boom', label: '💥 Comic Dhamaka', defaultCaption: 'DHAMAKA!' },
  { id: 'adaab', label: '🙏 Royal Adaab / Wah', defaultCaption: 'WAAH TAJ!' },
  { id: 'confused', label: '🤨 Confused What?', defaultCaption: 'HEIN?!' },
  { id: 'unimpressed', label: '😑 Deadpan Stare', defaultCaption: 'SACH MEIN?' },
];

export function drawReaction(canvas: HTMLCanvasElement, expression: ReactionExpression, caption: string): void {
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot create a reaction graphic.');

  ctx.clearRect(0, 0, 800, 800);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#302039';
  ctx.lineWidth = 14;

  const line = (x1: number, y1: number, x2: number, y2: number): void => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  const ellipse = (x: number, y: number, rx: number, ry: number, fill: string): void => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  if (expression === 'boom' || expression === 'mindblown') {
    // Comic starburst halo behind sticker
    const spikes = expression === 'boom' ? 14 : 18;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? 335 : 225;
      const px = 400 + Math.cos(a) * rad;
      const py = 350 + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = expression === 'boom' ? '#ef4444' : '#f97316';
    ctx.fill();
    ctx.stroke();
  }

  if (expression === 'boom') {
    const label = caption.trim() || 'DHAMAKA!';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 92px sans-serif';
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#1e1b2e';
    ctx.fillStyle = '#fde047';
    ctx.strokeText(label, 400, 355, 580);
    ctx.fillText(label, 400, 355, 580);
    return;
  }

  // Head / crest fill color per expression
  ctx.fillStyle =
    expression === 'angry'
      ? '#f87171'
      : expression === 'adaab'
        ? '#7f1d1d'
        : expression === 'takla'
          ? '#f1c29b'
          : '#ffda58';
  ctx.beginPath();
  ctx.arc(400, 350, 232, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = expression === 'adaab' ? '#facc15' : '#302039';
  ctx.stroke();
  ctx.strokeStyle = '#302039';

  if (expression === 'adaab') {
    // Inner golden royal arch crest
    ctx.beginPath();
    ctx.arc(400, 350, 198, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 168px sans-serif';
    ctx.fillStyle = '#fef3c7';
    ctx.fillText('🙏', 400, 348);
  } else if (expression === 'laughing') {
    line(280, 280, 330, 310);
    line(330, 310, 280, 335);
    line(520, 280, 470, 310);
    line(470, 310, 520, 335);
    ctx.beginPath();
    ctx.moveTo(305, 410);
    ctx.quadraticCurveTo(400, 560, 495, 410);
    ctx.closePath();
    ctx.fillStyle = '#7d263a';
    ctx.fill();
    ctx.stroke();
  } else if (expression === 'angry') {
    line(265, 225, 360, 275);
    line(535, 225, 440, 275);
    ellipse(320, 315, 28, 34, '#302039');
    ellipse(480, 315, 28, 34, '#302039');
    ctx.beginPath();
    ctx.moveTo(300, 465);
    ctx.quadraticCurveTo(400, 395, 500, 465);
    ctx.closePath();
    ctx.fillStyle = '#7f1d1d';
    ctx.fill();
    ctx.stroke();
    // Comic steam puffs
    ellipse(150, 175, 42, 26, '#ffffff');
    ellipse(650, 175, 42, 26, '#ffffff');
  } else if (expression === 'facepalm') {
    line(285, 290, 350, 290);
    line(450, 290, 515, 290);
    ellipse(400, 445, 36, 22, '#302039');
    // Cartoon glove slapping forehead
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(330, 145, 145, 165, 48);
    ctx.fill();
    ctx.stroke();
  } else if (expression === 'takla') {
    // Shiny bald dome sparkle + side hair tufts + huge shock
    ctx.fillStyle = '#1e1b2e';
    ctx.beginPath();
    ctx.arc(178, 325, 34, 0, Math.PI * 2);
    ctx.arc(622, 325, 34, 0, Math.PI * 2);
    ctx.fill();
    ellipse(340, 195, 52, 24, 'rgba(255,255,255,0.85)');
    ctx.strokeStyle = '#facc15';
    line(500, 115, 500, 165);
    line(475, 140, 525, 140);
    ctx.strokeStyle = '#302039';
    ellipse(320, 315, 34, 46, '#ffffff');
    ellipse(480, 315, 34, 46, '#ffffff');
    ellipse(320, 318, 16, 22, '#111827');
    ellipse(480, 318, 16, 22, '#111827');
    ellipse(400, 455, 44, 58, '#7f1d1d');
  } else {
    ellipse(320, 305, 24, expression === 'surprised' || expression === 'mindblown' ? 40 : 28, '#302039');
    ellipse(480, 305, 24, expression === 'surprised' || expression === 'mindblown' ? 40 : 28, '#302039');
    if (expression === 'surprised' || expression === 'mindblown') {
      ellipse(400, 445, 46, 62, '#7d263a');
      line(285, 225, 350, 210);
      line(450, 210, 515, 225);
    } else if (expression === 'confused') {
      line(275, 225, 350, 245);
      line(450, 245, 515, 220);
      ctx.beginPath();
      ctx.moveTo(355, 455);
      ctx.quadraticCurveTo(400, 415, 450, 455);
      ctx.stroke();
    } else {
      line(280, 245, 355, 245);
      line(445, 245, 520, 245);
      line(355, 440, 445, 440);
    }
  }

  if (caption.trim()) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 58px sans-serif';
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#1e1b2e';
    ctx.fillStyle = '#ffffff';
    ctx.strokeText(caption.trim(), 400, 690, 740);
    ctx.fillText(caption.trim(), 400, 690, 740);
  }
}
