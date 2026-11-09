export type ReactionExpression = 'surprised' | 'laughing' | 'confused' | 'unimpressed';

export function drawReaction(canvas: HTMLCanvasElement, expression: ReactionExpression, caption: string): void {
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot create a reaction graphic.');

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#ffda58';
  ctx.strokeStyle = '#302039';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(400, 350, 240, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

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

  if (expression === 'laughing') {
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
  } else {
    ellipse(320, 305, 24, expression === 'surprised' ? 39 : 28, '#302039');
    ellipse(480, 305, 24, expression === 'surprised' ? 39 : 28, '#302039');
    if (expression === 'surprised') {
      ellipse(400, 440, 42, 58, '#302039');
      line(285, 230, 350, 215);
      line(450, 215, 515, 230);
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
    ctx.font = 'bold 58px sans-serif';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#302039';
    ctx.fillStyle = '#ffffff';
    ctx.strokeText(caption.trim(), 400, 690, 740);
    ctx.fillText(caption.trim(), 400, 690, 740);
  }
}
