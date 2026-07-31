/* ============================================================
   charts.js — lightweight Canvas line/bar charts (no library).
   ============================================================ */

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || canvas.parentElement.clientWidth || 600;
  const h = parseInt(canvas.getAttribute('height')) || 220;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  canvas.style.height = h + 'px';
  return { ctx, w, h };
}

const Charts = {
  /* Line chart of scores over days.
     data: [{ label, value }] */
  line(canvas, data, opts = {}) {
    const { ctx, w, h } = setupCanvas(canvas);
    const padL = 36, padR = 14, padT = 18, padB = 28;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);

    const values = data.map(d => d.value);
    const maxV = Math.max(1, ...values.map(Math.abs));
    const minV = Math.min(0, ...values);
    const range = (maxV - minV) || 1;

    const zeroY = padT + innerH * (maxV / range);

    // grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.font = '10px Poppins, sans-serif';
    ctx.fillStyle = '#94a3b8';
    for (let i = 0; i <= 4; i++) {
      const y = padT + (innerH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      const val = Math.round(maxV - (range / 4) * i);
      ctx.fillText(String(val), 6, y + 3);
    }

    // zero line
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath(); ctx.moveTo(padL, zeroY); ctx.lineTo(w - padR, zeroY); ctx.stroke();

    if (!data.length) return;
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

    // fill under line
    const grad = ctx.createLinearGradient(0, padT, 0, padT + innerH);
    grad.addColorStop(0, 'rgba(37,99,235,0.35)');
    grad.addColorStop(1, 'rgba(14,165,233,0.02)');
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padL + stepX * i;
      const y = zeroY - (d.value / range) * innerH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.lineTo(padL + stepX * (data.length - 1), zeroY);
    ctx.lineTo(padL, zeroY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // line
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padL + stepX * i;
      const y = zeroY - (d.value / range) * innerH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // points + labels
    ctx.fillStyle = '#2563eb';
    data.forEach((d, i) => {
      const x = padL + stepX * i;
      const y = zeroY - (d.value / range) * innerH;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.fillStyle = '#94a3b8';
      ctx.translate(x, h - padB + 18);
      ctx.rotate(-Math.PI / 7);
      ctx.fillText(d.label, -10, 0);
      ctx.restore();
    });
  },

  /* Simple bar chart.
     data: [{ label, value, color? }] */
  bar(canvas, data) {
    const { ctx, w, h } = setupCanvas(canvas);
    const padL = 36, padR = 14, padT = 14, padB = 28;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    ctx.clearRect(0, 0, w, h);

    const values = data.map(d => d.value);
    const maxV = Math.max(1, ...values);
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    ctx.font = '10px Poppins, sans-serif'; ctx.fillStyle = '#94a3b8';
    for (let i = 0; i <= 4; i++) {
      const y = padT + (innerH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      const val = Math.round(maxV - (maxV / 4) * i);
      ctx.fillText(String(val), 6, y + 3);
    }
    if (!data.length) return;
    const slot = innerW / data.length;
    const bw = Math.min(34, slot * 0.6);
    data.forEach((d, i) => {
      const x = padL + slot * i + (slot - bw) / 2;
      const bh = (d.value / maxV) * innerH;
      const y = padT + innerH - bh;
      const grad = ctx.createLinearGradient(0, y, 0, padT + innerH);
      grad.addColorStop(0, d.color || '#0ea5e9');
      grad.addColorStop(1, '#2563eb');
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, bw, Math.max(2, bh), 5);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(d.label, x + bw / 2 - 10, h - padB + 16);
    });
  }
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

window.Charts = Charts;
