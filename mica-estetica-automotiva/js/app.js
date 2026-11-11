/* ==========================================================================
   Mica Estética Automotiva — interações e motion
   Sem dependências. A "pintura" é desenhada em canvas 2D, camada por camada.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');
  if (!root.lang) root.lang = 'pt-BR';

  /* ------------------------------------------------------------------------
     CONFIGURAÇÃO — edite aqui
     ------------------------------------------------------------------------ */

  const CONFIG = {
    marca: 'Mica',
    // WhatsApp do estúdio: só números, com DDI e DDD. Ex.: '5511999999999'.
    // Vazio = o formulário só oferece "Copiar mensagem".
    whatsapp: '',
  };

  // Cores de pintura do seletor do topo (RGB).
  const PAINTS = {
    verde:   { nome: 'Verde inglês',    rgb: [14, 61, 47] },
    azul:    { nome: 'Azul meia-noite', rgb: [13, 33, 84] },
    vinho:   { nome: 'Vinho',           rgb: [92, 14, 28] },
    grafite: { nome: 'Grafite',         rgb: [46, 50, 54] },
    preto:   { nome: 'Preto piano',     rgb: [11, 12, 13] },
  };

  // "zona" liga o serviço à parte do carro no desenho: pintura, interior, vidros, farois, rodas, motor.
  const SERVICES = [
    { id: 'lavagem', nome: 'Lavagem técnica', zona: 'pintura', rotulo: 'Pintura', preco: 120, tempo: '1h30', desc: 'Pré-lavagem com espuma, dois baldes, luva de microfibra e secagem com ar. O jeito de lavar sem riscar.' },
    { id: 'polimento', nome: 'Polimento técnico', zona: 'pintura', rotulo: 'Pintura', preco: 690, tempo: '1 a 2 dias', desc: 'Correção em até três passos. Remove riscos de lavagem, hologramas e manchas leves, com medição de verniz antes e depois.' },
    { id: 'vitrificacao', nome: 'Vitrificação cerâmica', zona: 'pintura', rotulo: 'Pintura', preco: 1490, tempo: '2 dias', desc: 'Camada 9H que dá profundidade ao brilho, repele água e facilita a lavagem por até 3 anos.' },
    { id: 'interna', nome: 'Higienização interna', zona: 'interior', rotulo: 'Interior', preco: 380, tempo: '1 dia', desc: 'Bancos, carpete, teto e painel. Extração, vapor nos dutos de ar e hidratação do couro.' },
    { id: 'vidros', nome: 'Vidros e para-brisa', zona: 'vidros', rotulo: 'Vidros', preco: 180, tempo: '1 hora', desc: 'Remoção de marcas de chuva ácida e repelente de água. Acima de 60 km/h a chuva escorre sem palheta.' },
    { id: 'farois', nome: 'Restauração de faróis', zona: 'farois', rotulo: 'Faróis', preco: 160, tempo: '2 horas', desc: 'Lixamento, polimento e verniz UV para tirar o amarelado e devolver a luz.' },
    { id: 'rodas', nome: 'Rodas e caixas de roda', zona: 'rodas', rotulo: 'Rodas', preco: 220, tempo: '2 horas', desc: 'Descontaminação ferrosa, limpeza das pinças e selante que segura a fuligem de freio.' },
    { id: 'motor', nome: 'Limpeza de motor', zona: 'motor', rotulo: 'Motor', preco: 150, tempo: '1h30', desc: 'Limpeza a seco, com proteção dos componentes elétricos e acabamento nos plásticos.' },
  ];

  // Multiplicador de preço por porte.
  const SIZES = { hatch: 1, seda: 1.1, suv: 1.25, picape: 1.35 };

  const PACKS = [
    { id: 'essencial', nome: 'Essencial', para: 'Para manter o carro limpo do jeito certo.', base: 190, tempo: '2 horas', nivel: 0.45, brilho: 'Carro bem lavado',
      itens: ['Lavagem técnica com espuma', 'Rodas e caixas de roda', 'Aspiração e painel', 'Cera de carnaúba, 2 meses'] },
    { id: 'correcao', nome: 'Correção', para: 'Para tirar os riscos de lavagem e devolver a cor.', base: 890, tempo: '1 a 2 dias', nivel: 0.76, brilho: 'Carro novo',
      itens: ['Tudo do Essencial', 'Descontaminação com argila', 'Polimento em 2 passos', 'Selante sintético, 6 meses'] },
    { id: 'espelho', nome: 'Espelho', para: 'Para quem quer o máximo e quer que dure.', base: 1990, tempo: '3 dias', nivel: 1, brilho: 'Espelho', top: true,
      itens: ['Tudo do Correção', 'Polimento em 3 passos', 'Vitrificação cerâmica 9H, 3 anos', 'Vidros com repelente de água', 'Revisão gratuita em 30 dias'] },
  ];

  /* ------------------------------------------------------------------------
     UTILITÁRIOS
     ------------------------------------------------------------------------ */

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const damp = (dt, k) => 1 - Math.exp(-dt * k);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  const money = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const WHITE = [255, 255, 255], BLACK = [0, 0, 0];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

  const S = { y: window.scrollY, v: 0, t: 0, dt: 0.016, vw: innerWidth, vh: innerHeight };
  const tasks = [];
  const measurers = [];

  const io = new IntersectionObserver(es => es.forEach(e => { e.target.__vis = e.isIntersecting; }), { rootMargin: '120px 0px' });
  const watch = el => { el.__vis = false; io.observe(el); return el; };

  /* ------------------------------------------------------------------------
     CAMINHOS DE PASSADA — vai e volta, como a mão do detalhador
     ------------------------------------------------------------------------ */

  function serp(passes, vertical, W, H) {
    const pts = [];
    for (let i = 0; i < passes; i++) {
      const t = (i + 0.5) / passes;
      const a = i % 2 ? 1.07 : -0.07, b = i % 2 ? -0.07 : 1.07;
      if (vertical) pts.push([t * W, a * H], [t * W, b * H]);
      else pts.push([a * W, t * H], [b * W, t * H]);
    }
    const cum = [0];
    let len = 0;
    for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(len); }
    return { pts, cum, len, band: (vertical ? W : H) / passes };
  }
  function pathAt(path, p) {
    const d = clamp(p) * path.len;
    let i = 1;
    while (i < path.cum.length - 1 && path.cum[i] < d) i++;
    const a = path.pts[i - 1], b = path.pts[i];
    const f = (d - path.cum[i - 1]) / ((path.cum[i] - path.cum[i - 1]) || 1);
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }

  /* ------------------------------------------------------------------------
     PINTURA — base, vinco, luz, teto de LED refletido, flocos, riscos,
     sujeira, espuma e gotas. Cada camada é pré-desenhada e composta por frame.
     ------------------------------------------------------------------------ */

  class Paint {
    constructor(canvas, o = {}) {
      this.c = canvas;
      this.g = canvas.getContext('2d');
      this.o = Object.assign({ budget: 1.4e6, crease: 0.68, calmLeft: 0, process: false }, o);
      this.col = PAINTS.verde.rgb.slice();
      this.colTo = this.col.slice();
      this.light = { x: 0.64, y: 0.3 };
      this.shift = 0;
      this.st = { gloss: 1, swirl: 0, specks: 0, dirt: 0, rinse: 2, foam: null, beadsIn: 0, beadsRoll: 0 };
      this.beads = [];
      this.W = 0; this.H = 0;
      this.maskP = {};
      watch(canvas);
      new ResizeObserver(() => this.resize()).observe(canvas);
      this.resize();
    }

    setColor(c) { this.colTo = c.slice(); }

    // Aparelho lento: desenha com menos pixels (o CSS estica o canvas).
    lower() {
      if (this.o.budget < 3.2e5) return;
      this.o.budget *= 0.6;
      this.resize();
    }

    resize() {
      const w = this.c.clientWidth, h = this.c.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const k = Math.min(dpr, Math.sqrt(this.o.budget / (w * h)));
      const W = Math.round(w * k), H = Math.round(h * k);
      if (W === this.W && H === this.H) return;
      const sx = this.W ? W / this.W : 1, sy = this.H ? H / this.H : 1;
      this.beads.forEach(b => { b.x *= sx; b.y *= sy; b.r *= sx; });
      this.W = W; this.H = H; this.k = k; this.cssW = w;
      this.c.width = W; this.c.height = H;
      this.build();
    }

    build() {
      const { W, H, k } = this;
      this.M = Math.round(90 * k);
      this.tmp = mk(W, H);
      this.tg = this.tmp.getContext('2d');
      this.flakes = this.buildFlakes();
      this.hexSharp = this.buildHex();
      this.hexBlur = this.blurOf(this.hexSharp, 7 * k);
      this.bead = this.buildBead();
      if (!this.o.process) return;
      this.swirl = this.buildSwirl();
      this.dirt = this.buildDirt();
      this.speck = this.buildSpecks();
      this.bubble = this.buildBubble();
      this.foam = this.buildFoam();
      this.masks ={ clay: mk(W / 4, H / 4), polish: mk(W / 4, H / 4), coat: mk(W / 4, H / 4) };
      this.paths = { clay: serp(5, false, W, H), polish: serp(4, false, W, H), coat: serp(6, true, W, H) };
      this.maskP = {};
      this.bubbles = Array.from({ length: Math.round(clamp(this.cssW / 5, 70, 220)) }, () => (
        { x: rnd(-0.03, 1.03), r: (7 + Math.pow(Math.random(), 2) * 20) * k, ph: rnd(0, TAU), j: Math.random() }
      )).sort((a, b) => a.r - b.r);
      this.pbeads = Array.from({ length: Math.round(clamp(W * H / 5200, 90, 240)) }, () => ({
        x: rnd(0.02, 0.98), y: rnd(0.04, 0.96), r: (3.2 + Math.pow(Math.random(), 2.2) * 16) * k, d: Math.random(), sp: rnd(0.9, 2.2),
      }));
    }

    buildFlakes() {
      const { W, H, k } = this;
      const c = mk(W, H), g = c.getContext('2d');
      const n = Math.round(W * H / 64);
      const share = [0.36, 0.27, 0.19, 0.12, 0.06];
      for (let b = 0; b < 5; b++) {
        g.fillStyle = `rgba(255,255,255,${0.16 + b * 0.2})`;
        const m = Math.round(n * share[b]);
        for (let i = 0; i < m; i++) {
          const s = (0.55 + Math.random() * 1.05) * Math.max(1, k * 0.85);
          g.fillRect(Math.random() * W, Math.random() * H, s, s);
        }
      }
      return c;
    }

    // Teto de placas hexagonais de LED, como aparece refletido em um capô.
    buildHex() {
      const { W, H, k, M } = this;
      const cw = W + M * 2, ch = H + M;
      const c = mk(cw, ch), g = c.getContext('2d');
      const a = Math.max(24 * k, W / 15);
      const yc = H * this.o.crease + M * 0.5;
      g.save();
      g.translate(cw * 0.58, -ch * 0.06);
      g.transform(1, 0, -0.52, 0.4, 0, 0);
      g.rotate(-0.1);
      g.lineJoin = 'round';
      const dx = a * Math.sqrt(3), dy = a * 1.5;
      const cols = Math.ceil(cw / dx) + 6, rows = Math.ceil(ch / (dy * 0.4)) + 4;
      const trace = () => {
        g.beginPath();
        for (let r = -4; r < rows; r++) {
          for (let q = -cols; q < cols; q++) {
            const cx = q * dx + (r & 1 ? dx / 2 : 0), cy = r * dy;
            for (let i = 0; i < 6; i++) {
              const t = Math.PI / 3 * i - Math.PI / 2;
              const x = cx + Math.cos(t) * a * 0.9, y = cy + Math.sin(t) * a * 0.9;
              if (i) g.lineTo(x, y); else g.moveTo(x, y);
            }
            g.closePath();
          }
        }
      };
      trace();
      g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = a * 0.26; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = a * 0.075; g.stroke();
      g.restore();
      // some perto do vinco e, se pedido, do lado do texto
      g.globalCompositeOperation = 'destination-in';
      let gr = g.createLinearGradient(0, 0, 0, yc);
      gr.addColorStop(0, 'rgba(0,0,0,1)');
      gr.addColorStop(0.5, 'rgba(0,0,0,.62)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
      if (this.o.calmLeft) {
        gr = g.createLinearGradient(0, 0, cw, 0);
        gr.addColorStop(0, 'rgba(0,0,0,.04)');
        gr.addColorStop(this.o.calmLeft * 0.55, 'rgba(0,0,0,.2)');
        gr.addColorStop(Math.min(0.98, this.o.calmLeft * 1.25), 'rgba(0,0,0,1)');
        gr.addColorStop(1, 'rgba(0,0,0,1)');
        g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
      }
      return c;
    }

    blurOf(src, px) {
      const c = mk(src.width, src.height), g = c.getContext('2d');
      if ('filter' in g) { g.filter = `blur(${px.toFixed(1)}px)`; g.drawImage(src, 0, 0); g.filter = 'none'; }
      else { g.globalAlpha = 0.14; for (let i = 0; i < 10; i++) g.drawImage(src, Math.cos(i * 0.63) * px, Math.sin(i * 0.63) * px); }
      return c;
    }

    // Riscos de lavagem: arcos finos que só aparecem em volta do reflexo da luz.
    buildSwirl() {
      const { k } = this;
      const D = Math.round(Math.min(this.W, this.H) * 1.3), R = D / 2;
      const c = mk(D, D), g = c.getContext('2d');
      g.lineCap = 'round';
      for (let i = 0; i < 760; i++) {
        const r = R * (0.03 + Math.pow(Math.random(), 0.85) * 0.94);
        const a0 = Math.random() * TAU;
        const len = (0.2 + Math.random() * 0.9) * Math.min(2.6, 46 * k / r + 0.22);
        g.beginPath();
        g.arc(R, R, r, a0, a0 + len);
        g.strokeStyle = `rgba(255,255,255,${(0.06 + Math.random() * 0.26).toFixed(3)})`;
        g.lineWidth = (0.5 + Math.random() * 0.8) * k;
        g.stroke();
      }
      g.globalCompositeOperation = 'destination-in';
      const gr = g.createRadialGradient(R, R, 0, R, R, R);
      gr.addColorStop(0, 'rgba(0,0,0,1)');
      gr.addColorStop(0.45, 'rgba(0,0,0,.7)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, D, D);
      return c;
    }

    buildDirt() {
      const { W, H, k } = this;
      const c = mk(W, H), g = c.getContext('2d');
      g.fillStyle = 'rgba(126,110,88,.46)'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 240; i++) {
        const x = Math.random() * W, y = Math.random() * H, r = rnd(24, 150) * k;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        const dark = Math.random() < 0.6;
        gr.addColorStop(0, dark ? `rgba(66,54,40,${rnd(0.1, 0.26)})` : `rgba(196,182,156,${rnd(0.06, 0.16)})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (let i = 0; i < 46; i++) {           // escorridos
        const x = Math.random() * W, y = Math.random() * H * 0.7, h = rnd(80, 320) * k, w = rnd(2, 7) * k;
        const gr = g.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, 'rgba(60,50,38,0)'); gr.addColorStop(0.3, `rgba(60,50,38,${rnd(0.1, 0.22)})`); gr.addColorStop(1, 'rgba(60,50,38,0)');
        g.fillStyle = gr; g.fillRect(x, y, w, h);
      }
      g.fillStyle = 'rgba(214,202,176,.34)';
      const n = Math.round(W * H / 260);
      for (let i = 0; i < n; i++) { const s = rnd(0.6, 1.8) * k; g.fillRect(Math.random() * W, Math.random() * H, s, s); }
      return c;
    }

    // Contaminação: pontos de ferrugem (fuligem de freio) e piche.
    buildSpecks() {
      const { W, H, k } = this;
      const c = mk(W, H), g = c.getContext('2d');
      const n = Math.round(W * H / 1500);
      for (let i = 0; i < n; i++) {
        const tar = Math.random() < 0.22;
        g.fillStyle = tar ? `rgba(12,11,10,${rnd(0.6, 0.95)})` : `rgba(${196 + (Math.random() * 30 | 0)},${96 + (Math.random() * 30 | 0)},34,${rnd(0.6, 0.95)})`;
        g.beginPath();
        g.arc(Math.random() * W, Math.random() * H, (tar ? rnd(1, 3.2) : rnd(0.7, 2.1)) * k, 0, TAU);
        g.fill();
      }
      return c;
    }

    // Espuma de pré-lavagem: véu branco, milhares de bolhas e falhas por onde a pintura aparece.
    buildFoam() {
      const { W, H, k } = this;
      const c = mk(W, H), g = c.getContext('2d');
      for (let i = 0; i < 170; i++) {
        const x = Math.random() * W, y = Math.random() * H, r = rnd(50, 190) * k;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(255,255,255,${rnd(0.35, 0.72)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      const n = Math.round(W * H / 170);
      for (let i = 0; i < n; i++) {
        const x = Math.random() * W, y = Math.random() * H, r = (1.6 + Math.pow(Math.random(), 3.2) * 13) * k;
        g.beginPath(); g.arc(x, y, r, 0, TAU);
        g.fillStyle = `rgba(255,255,255,${rnd(0.5, 0.92)})`; g.fill();
        if (r > 3.5 * k) {
          g.strokeStyle = 'rgba(140,158,166,.4)'; g.lineWidth = 0.7 * k; g.stroke();
          g.beginPath(); g.arc(x - r * 0.3, y - r * 0.32, r * 0.22, 0, TAU);
          g.fillStyle = 'rgba(255,255,255,.95)'; g.fill();
        }
      }
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 70; i++) {
        const x = Math.random() * W, y = Math.random() * H, r = rnd(26, 120) * k;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(0,0,0,${rnd(0.5, 0.95)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      return c;
    }

    buildBubble() {
      const s = 96, c = mk(s, s), g = c.getContext('2d'), r = s / 2;
      const gr = g.createRadialGradient(r * 0.8, r * 0.72, r * 0.05, r, r, r);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.62, 'rgba(244,248,250,.97)');
      gr.addColorStop(0.9, 'rgba(198,210,216,.9)');
      gr.addColorStop(1, 'rgba(198,210,216,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
      return c;
    }

    // Gota sobre superfície hidrofóbica: quase uma esfera, com brilho em cima e luz refratada embaixo.
    buildBead() {
      const s = 128, c = mk(s, s), g = c.getContext('2d'), cx = s / 2, cy = s / 2, r = s * 0.36;
      let gr = g.createRadialGradient(cx + r * 0.1, cy + r * 0.38, r * 0.2, cx + r * 0.1, cy + r * 0.3, r * 1.25);
      gr.addColorStop(0, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
      gr = g.createRadialGradient(cx, cy + r * 0.42, r * 0.05, cx, cy, r);
      gr.addColorStop(0, 'rgba(255,255,255,.42)');
      gr.addColorStop(0.55, 'rgba(255,255,255,.1)');
      gr.addColorStop(0.86, 'rgba(0,0,0,.2)');
      gr.addColorStop(1, 'rgba(0,0,0,.42)');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.2; g.stroke();
      g.beginPath(); g.arc(cx, cy, r * 0.76, Math.PI * 0.18, Math.PI * 0.62);
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = r * 0.12; g.lineCap = 'round'; g.stroke();
      gr = g.createRadialGradient(cx - r * 0.36, cy - r * 0.42, 0, cx - r * 0.36, cy - r * 0.42, r * 0.34);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
      return c;
    }

    // Redesenha a máscara "até onde a ferramenta já passou" (em 1/4 da resolução: borda macia de graça).
    setMask(name, p) {
      if (Math.abs((this.maskP[name] ?? -1) - p) < 0.0004) return;
      this.maskP[name] = p;
      const m = this.masks[name], path = this.paths[name], g = m.getContext('2d'), s = m.width / this.W;
      g.clearRect(0, 0, m.width, m.height);
      if (p <= 0) return;
      if (p >= 1) { g.fillStyle = '#fff'; g.fillRect(0, 0, m.width, m.height); return; }
      const d = p * path.len;
      g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.lineWidth = path.band * 1.3 * s;
      g.beginPath();
      g.moveTo(path.pts[0][0] * s, path.pts[0][1] * s);
      for (let i = 1; i < path.pts.length; i++) {
        if (path.cum[i] <= d) { g.lineTo(path.pts[i][0] * s, path.pts[i][1] * s); continue; }
        const q = pathAt(path, p);
        g.lineTo(q.x * s, q.y * s);
        break;
      }
      g.stroke();
    }

    // Desenha uma camada no canvas auxiliar e recorta pela máscara ('in' = só dentro, 'out' = só fora).
    pass(draw, mask, mode) {
      const { tg, W, H } = this;
      tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 1;
      tg.clearRect(0, 0, W, H);
      draw(tg);
      if (mask) {
        tg.globalAlpha = 1;
        tg.globalCompositeOperation = mode === 'in' ? 'destination-in' : 'destination-out';
        tg.drawImage(mask, 0, 0, W, H);
      }
      tg.globalCompositeOperation = 'source-over';
    }

    creasePath(g) {
      const { W, H } = this, yc = H * this.o.crease;
      g.moveTo(-10, yc + H * 0.07);
      g.quadraticCurveTo(W * 0.42, yc - H * 0.08, W + 10, yc - H * 0.01);
    }

    render(s) {
      const { g, W, H, k, st, o } = this;
      if (!W) return;
      const kc = damp(s.dt, 4);
      for (let i = 0; i < 3; i++) this.col[i] = lerp(this.col[i], this.colTo[i], kc);
      const col = this.col;
      const lx = this.light.x * W, ly = this.light.y * H;
      const yc = H * o.crease;
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;

      // base: céu em cima, chão embaixo
      let gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, rgb(mix(col, WHITE, 0.13)));
      gr.addColorStop(0.4, rgb(col));
      gr.addColorStop(1, rgb(mix(col, BLACK, 0.62)));
      g.fillStyle = gr; g.fillRect(0, 0, W, H);

      // vinco da lataria
      g.beginPath(); this.creasePath(g); g.lineTo(W + 10, H + 10); g.lineTo(-10, H + 10); g.closePath();
      gr = g.createLinearGradient(0, yc - H * 0.06, 0, H);
      gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(0.28, 'rgba(0,0,0,.2)'); gr.addColorStop(1, 'rgba(0,0,0,.4)');
      g.fillStyle = gr; g.fill();
      g.beginPath(); this.creasePath(g);
      g.strokeStyle = rgb(mix(col, WHITE, 0.6), 0.06); g.lineWidth = 18 * k; g.stroke();
      g.strokeStyle = rgb(mix(col, WHITE, 0.8), 0.1 + 0.26 * st.gloss); g.lineWidth = 1.4 * k; g.stroke();

      g.globalCompositeOperation = 'lighter';

      // clarão largo da luz
      const big = Math.max(W, H) * 0.62;
      gr = g.createRadialGradient(lx, ly, 0, lx, ly, big);
      gr.addColorStop(0, rgb(mix(col, WHITE, 0.5), 0.55));
      gr.addColorStop(0.3, rgb(mix(col, WHITE, 0.28), 0.22));
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);

      // teto de LED refletido
      const hx = (0.5 - this.light.x) * 90 * k - this.M, hy = (0.5 - this.light.y) * 22 * k - this.M * 0.5 + this.shift;
      if (o.process) {
        g.globalAlpha = 0.14 + 0.2 * st.gloss; g.drawImage(this.hexBlur, hx, hy);
        const cp = this.maskP.coat || 0;
        if (cp > 0) {
          this.pass(tg => tg.drawImage(this.hexSharp, hx, hy), cp < 1 ? this.masks.coat : null, 'in');
          g.globalAlpha = 0.62; g.drawImage(this.tmp, 0, 0);
        }
      } else {
        g.globalAlpha = 0.2; g.drawImage(this.hexBlur, hx, hy);
        g.globalAlpha = 0.5 * st.gloss; g.drawImage(this.hexSharp, hx, hy);
      }

      // flocos metálicos: um pouco em toda parte, e faiscando em anéis ao redor da luz
      g.globalAlpha = 0.1; g.drawImage(this.flakes, 0, 0);
      if (!o.process) {
        this.pass(tg => {
          const R = Math.max(W, H) * 0.5;
          const fr = tg.createRadialGradient(lx, ly, 0, lx, ly, R);
          fr.addColorStop(0, 'rgba(0,0,0,.95)'); fr.addColorStop(0.1, 'rgba(0,0,0,.8)'); fr.addColorStop(0.18, 'rgba(0,0,0,.28)');
          fr.addColorStop(0.28, 'rgba(0,0,0,.62)'); fr.addColorStop(0.42, 'rgba(0,0,0,.18)'); fr.addColorStop(0.58, 'rgba(0,0,0,.34)'); fr.addColorStop(1, 'rgba(0,0,0,0)');
          tg.fillStyle = fr; tg.fillRect(0, 0, W, H);
          tg.globalCompositeOperation = 'source-in';
          tg.drawImage(this.flakes, 0, 0);
        });
        g.globalAlpha = 1; g.drawImage(this.tmp, 0, 0);
      }

      // ponto quente: nítido quando há verniz polido, espalhado quando não
      const hot = (44 + (1 - st.gloss) * 120) * k;
      gr = g.createRadialGradient(lx, ly, 0, lx, ly, hot);
      gr.addColorStop(0, `rgba(255,255,255,${0.3 + 0.62 * st.gloss})`);
      gr.addColorStop(0.32, `rgba(255,255,255,${0.1 + 0.12 * st.gloss})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(lx - hot, ly - hot, hot * 2, hot * 2);

      if (o.process) this.renderProcess(s, lx, ly);

      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      this.renderBeads();
    }

    renderProcess(s, lx, ly) {
      const { g, W, H, k, st } = this;
      const pp = this.maskP.polish || 0, cl = this.maskP.clay || 0;

      // riscos de lavagem + véu opaco, só onde a politriz ainda não passou
      if (st.swirl > 0.01 && pp < 1) {
        this.pass(tg => {
          tg.fillStyle = `rgba(196,206,210,${0.085 * st.swirl})`; tg.fillRect(0, 0, W, H);
          const D = this.swirl.width;
          tg.globalAlpha = st.swirl;
          tg.drawImage(this.swirl, lx - D / 2, ly - D / 2);
          tg.globalAlpha = st.swirl * 0.55;
          tg.drawImage(this.swirl, W - lx * 0.6 - D * 0.35, H * 0.86 - D * 0.35, D * 0.7, D * 0.7);
        }, pp > 0 ? this.masks.polish : null, 'out');
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1; g.drawImage(this.tmp, 0, 0);
      }

      g.globalCompositeOperation = 'source-over';

      // contaminação, só onde a argila ainda não passou
      if (st.specks > 0.01 && cl < 1) {
        this.pass(tg => { tg.globalAlpha = st.specks; tg.drawImage(this.speck, 0, 0); }, cl > 0 ? this.masks.clay : null, 'out');
        g.globalAlpha = 1; g.drawImage(this.tmp, 0, 0);
      }

      // sujeira abaixo da linha de enxágue
      const ry = st.rinse * H;
      const wave = x => ry + Math.sin(x * 0.011 / k + s.t * 2.2) * 9 * k + Math.sin(x * 0.029 / k + 1.7) * 6 * k;
      if (st.dirt > 0.01 && st.rinse < 1.12) {
        g.save();
        g.beginPath(); g.moveTo(-10, H + 10); g.lineTo(-10, wave(-10));
        for (let x = 0; x <= W + 30; x += 26 * k) g.lineTo(x, wave(x));
        g.lineTo(W + 10, H + 10); g.closePath(); g.clip();
        g.globalAlpha = st.dirt; g.drawImage(this.dirt, 0, 0);
        g.restore();
      }
      // lâmina d'água atrás do enxágue
      if (st.rinse > -0.1 && st.rinse < 1.12) {
        g.globalCompositeOperation = 'lighter';
        const gr = g.createLinearGradient(0, ry - 190 * k, 0, ry + 10 * k);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.8, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,.3)');
        g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, ry - 190 * k, W, 200 * k);
        g.globalCompositeOperation = 'source-over';
      }

      // espuma: desce cobrindo o painel, escorre nas pontas e é empurrada pela água do enxágue
      const f = st.foam;
      if (f && f.cover > 0 && f.alpha > 0.01) {
        const rinsing = st.rinse > -0.1;
        const bot = f.cover * H * 1.08;
        const drip = x => bot + Math.sin(x * 0.02 / k + 1.3) * 14 * k + Math.pow(Math.abs(Math.sin(x * 0.0057 / k + 0.4)), 6) * 76 * k;
        g.save();
        g.beginPath();
        g.moveTo(-30, rinsing ? wave(-30) : -10);
        for (let x = 0; x <= W + 30; x += 26 * k) g.lineTo(x, rinsing ? wave(x) : -10);
        for (let x = W + 30; x >= -30; x -= 22 * k) g.lineTo(x, drip(x));
        g.closePath(); g.clip();
        g.globalAlpha = f.alpha;
        g.drawImage(this.foam, 0, (f.sag || 0) * 36 * k);
        g.restore();
        if (rinsing && st.rinse < 1.12) {          // faixa de espuma acumulada na frente da água
          for (const b of this.bubbles) {
            const x = b.x * W + Math.sin(s.t * 1.2 + b.ph) * 3 * k, r = b.r * 0.82;
            const y = ry + Math.sin(x * 0.011 / k + s.t * 2.2) * 9 * k + (b.j - 0.3) * 58 * k;
            g.globalAlpha = f.alpha;
            g.drawImage(this.bubble, x - r, y - r, r * 2, r * 2);
          }
        }
        g.globalAlpha = 1;
      }

      // teste da água depois do coating
      if (st.beadsIn > 0) {
        const roll = st.beadsRoll * st.beadsRoll;
        for (const b of this.pbeads) {
          const a = clamp((st.beadsIn - b.d * 0.75) / 0.25);
          if (a <= 0) continue;
          const y = b.y * H + roll * H * 1.25 * b.sp;
          if (y - b.r > H) continue;
          const r = b.r * (0.4 + 0.6 * easeOut(a)), sy = 1 + Math.min(0.5, roll * b.sp * 0.6);
          g.globalAlpha = a;
          g.drawImage(this.bead, b.x * W - r * 1.4, y - r * 1.4 * sy, r * 2.8, r * 2.8 * sy);
        }
        g.globalAlpha = 1;
      }
    }

    renderBeads() {
      const { g } = this;
      for (const b of this.beads) {
        const r = b.r * b.s, sy = 1 + Math.min(0.55, b.vy / (900 * this.k));
        g.globalAlpha = Math.min(1, b.s * 1.2);
        g.drawImage(this.bead, b.x - r * 1.4, b.y - r * 1.4 * sy, r * 2.8, r * 2.8 * sy);
      }
      g.globalAlpha = 1;
    }

    // Gotas soltas: ficam paradas um instante, depois escorrem e arrastam as que encontram.
    stepBeads(dt, t) {
      const { H, k } = this;
      for (let i = this.beads.length - 1; i >= 0; i--) {
        const b = this.beads[i];
        b.age += dt;
        b.s = Math.min(1, b.s + dt * 5);
        if (b.age < b.hold) continue;
        b.vy += (300 + b.r * 26 / k) * k * dt;
        b.y += b.vy * dt;
        b.x += Math.sin(b.age * 6 + b.ph) * 9 * k * dt;
        for (const o of this.beads) {
          if (o === b || o.age >= o.hold) continue;
          if (Math.abs(o.x - b.x) < (o.r + b.r) * 0.85 && Math.abs(o.y - b.y) < (o.r + b.r) * 0.85) { o.hold = o.age + rnd(0, 0.12); o.vy = b.vy * 0.5; }
        }
        if (b.y - b.r * 2 > H) this.beads.splice(i, 1);
      }
    }

    spray(x, y, n, spread, hold) {
      const { k } = this;
      for (let i = 0; i < n; i++) {
        const a = rnd(0, TAU), d = Math.pow(Math.random(), 0.7) * spread * k;
        this.beads.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.8, r: (2.6 + Math.pow(Math.random(), 2.6) * 13) * k, s: 0, vy: 0, age: -rnd(0, 0.25), hold: hold(), ph: rnd(0, TAU) });
      }
      if (this.beads.length > 320) this.beads.splice(0, this.beads.length - 320);
    }
  }

  /* ------------------------------------------------------------------------
     FERRAMENTAS desenhadas sobre o painel do processo
     ------------------------------------------------------------------------ */

  function shadowBlob(g, x, y, r) {
    const gr = g.createRadialGradient(x, y, r * 0.3, x, y, r);
    gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function rrect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function drawClay(g, q, k) {                 // barra de argila azul
    const w = 92 * k, h = 56 * k;
    shadowBlob(g, q.x + 4 * k, q.y + 8 * k, w * 0.75);
    g.save(); g.translate(q.x, q.y); g.rotate(Math.cos(q.ang) > 0 ? -0.12 : 0.12);
    const gr = g.createLinearGradient(0, -h / 2, 0, h / 2);
    gr.addColorStop(0, '#5E97E8'); gr.addColorStop(0.5, '#2F6BCB'); gr.addColorStop(1, '#1D4A97');
    rrect(g, -w / 2, -h / 2, w, h, 14 * k); g.fillStyle = gr; g.fill();
    rrect(g, -w / 2 + 8 * k, -h / 2 + 7 * k, w - 16 * k, h * 0.26, 8 * k); g.fillStyle = 'rgba(255,255,255,.26)'; g.fill();
    g.restore();
  }
  function drawPad(g, q, k, t) {                // boina de espuma girando
    const r = 74 * k;
    shadowBlob(g, q.x + 5 * k, q.y + 10 * k, r * 1.35);
    g.save(); g.translate(q.x, q.y);
    let gr = g.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.1, 0, 0, r);
    gr.addColorStop(0, '#FFB45C'); gr.addColorStop(0.7, '#EE8420'); gr.addColorStop(1, '#B9590C');
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = gr; g.fill();
    g.rotate(t * 16);
    g.strokeStyle = 'rgba(120,52,6,.4)'; g.lineWidth = 3.2 * k; g.lineCap = 'round';
    for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); g.beginPath(); g.moveTo(r * 0.34, 0); g.quadraticCurveTo(r * 0.62, r * 0.2, r * 0.9, r * 0.08); g.stroke(); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.translate(q.x, q.y);
    gr = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.3);
    gr.addColorStop(0, '#3A3F42'); gr.addColorStop(1, '#15181A');
    g.beginPath(); g.arc(0, 0, r * 0.27, 0, TAU); g.fillStyle = gr; g.fill();
    g.beginPath(); g.arc(0, 0, r * 0.985, 0, TAU); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2 * k; g.stroke();
    g.restore();
  }
  function drawApplicator(g, q, k) {            // bloco aplicador com pano de suede
    const w = 104 * k, h = 62 * k;
    shadowBlob(g, q.x + 4 * k, q.y + 8 * k, w * 0.75);
    g.save(); g.translate(q.x, q.y);
    let gr = g.createLinearGradient(0, -h / 2, 0, h / 2);
    gr.addColorStop(0, '#4A5054'); gr.addColorStop(1, '#1B1E20');
    rrect(g, -w / 2, -h / 2, w, h, 10 * k); g.fillStyle = gr; g.fill();
    gr = g.createLinearGradient(0, -h * 0.34, 0, h * 0.34);
    gr.addColorStop(0, '#E9EEF0'); gr.addColorStop(1, '#AEB8BC');
    rrect(g, -w / 2 - 3 * k, -h * 0.3, w + 6 * k, h * 0.6, 6 * k); g.fillStyle = gr; g.fill();
    g.restore();
  }

  /* ------------------------------------------------------------------------
     HERO
     ------------------------------------------------------------------------ */

  const hero = $('#hero');
  const hCanvas = $('#paint-hero');
  const small = Math.min(innerWidth, innerHeight) < 700;
  const hPaint = new Paint(hCanvas, { calmLeft: 0.6, crease: 0.72, budget: small ? 7e5 : 1.5e6 });
  const hint = $('#hero-hint');
  const mirror = $('#mirror');
  const hTo = { x: 0.68, y: 0.3 };
  let hOver = false, seeded = false;

  hero.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    hTo.x = (e.clientX - r.left) / r.width; hTo.y = (e.clientY - r.top) / r.height; hOver = true;
  });
  hero.addEventListener('pointerleave', () => { hOver = false; });
  hero.addEventListener('click', e => {
    if (e.target.closest('a, button')) return;
    const r = hCanvas.getBoundingClientRect();
    hPaint.spray((e.clientX - r.left) / r.width * hPaint.W, (e.clientY - r.top) / r.height * hPaint.H, 30, 110, () => (reduce ? Infinity : rnd(0.5, 2.4)));
    hint.classList.add('is-gone');
  });

  tasks.push(s => {
    if (!hCanvas.__vis) return;
    if (!seeded && hPaint.W) {
      seeded = true;                       // gotas já pousadas: a pintura abre mostrando que repele água
      const { W, H } = hPaint, still = () => Infinity;
      const wide = hPaint.cssW > 900;
      hPaint.spray(W * (wide ? 0.82 : 0.78), H * (wide ? 0.52 : 0.2), wide ? 54 : 26, wide ? 150 : 80, still);
      hPaint.beads.forEach(b => { b.s = 1; b.age = 0; });
    }
    if (!hOver && !reduce) { hTo.x = 0.66 + 0.2 * Math.sin(s.t * 0.3); hTo.y = 0.3 + 0.1 * Math.sin(s.t * 0.47 + 1); }
    const k = damp(s.dt, 5);
    hPaint.light.x = lerp(hPaint.light.x, hTo.x, k);
    hPaint.light.y = lerp(hPaint.light.y, hTo.y, k);
    hPaint.shift = -s.y * 0.1 * hPaint.k;
    hPaint.stepBeads(s.dt, s.t);
    hPaint.render(s);
    root.style.setProperty('--lx', `${(hPaint.light.x * 100).toFixed(1)}%`);
  });

  // ----- cor da pintura
  const colorBtns = $$('#colors button');
  const colorName = $('#color-name');
  let paintKey = 'verde';
  function setPaint(key) {
    const p = PAINTS[key];
    if (!p || key === paintKey) return;
    paintKey = key;
    colorBtns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.paint === key)));
    colorName.textContent = p.nome;
    hPaint.setColor(p.rgb); pPaint.setColor(p.rgb);
    root.style.setProperty('--paint', rgb(p.rgb));
    root.style.setProperty('--paint-hi', rgb(mix(p.rgb, WHITE, 0.34)));
    root.style.setProperty('--paint-lo', rgb(mix(p.rgb, BLACK, 0.55)));
  }
  colorBtns.forEach(b => b.addEventListener('click', () => setPaint(b.dataset.paint)));
  $('#colors').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const i = colorBtns.findIndex(b => b.dataset.paint === paintKey);
    const next = colorBtns[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + colorBtns.length) % colorBtns.length];
    next.focus(); setPaint(next.dataset.paint);
  });

  /* ------------------------------------------------------------------------
     PROCESSO — o scroll conduz as quatro etapas sobre o mesmo painel
     ------------------------------------------------------------------------ */

  const proc = $('#processo');
  const pCanvas = $('#paint-process');
  const pPaint = new Paint(pCanvas, { process: true, crease: 0.74, budget: small ? 6e5 : 1.1e6 });
  const pSteps = $$('.pstep', proc), pDots = $$('#process-dots li');
  const hudG = $('#hud-gloss'), hudC = $('#hud-clear'), hudA = $('#hud-angle');
  const pStage = $('.process__stage', proc);
  const pTo = { x: 0.6, y: 0.34 };
  let pTop = 0, pH = 1, pP = 0, pIdx = -1, pOver = false;
  const INTRO = 0.04, SPAN = 0.225;
  measurers.push(() => { const r = proc.getBoundingClientRect(); pTop = r.top + scrollY; pH = r.height; });
  pStage.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = pStage.getBoundingClientRect();
    pTo.x = (e.clientX - r.left) / r.width; pTo.y = (e.clientY - r.top) / r.height; pOver = true;
  });
  pStage.addEventListener('pointerleave', () => { pOver = false; });

  tasks.push(s => {
    if (!pCanvas.__vis || !pPaint.W) return;
    const raw = reduce ? 1 : clamp((s.y - pTop) / Math.max(1, pH - s.vh));
    pP = reduce ? 1 : lerp(pP, raw, damp(s.dt, 9));
    const q = [0, 1, 2, 3].map(i => clamp((pP - INTRO - i * SPAN) / SPAN));
    const coat = clamp(q[3] / 0.7);

    if (!pOver && !reduce) { pTo.x = 0.56 + 0.24 * Math.sin(s.t * 0.34); pTo.y = 0.34 + 0.13 * Math.sin(s.t * 0.52 + 1); }
    const kl = damp(s.dt, 5);
    pPaint.light.x = lerp(pPaint.light.x, pTo.x, kl);
    pPaint.light.y = lerp(pPaint.light.y, pTo.y, kl);

    const st = pPaint.st;
    st.dirt = 1;
    st.foam = { cover: easeOut(clamp(q[0] / 0.42)) * 1.25, alpha: 1 - clamp((q[0] - 0.93) / 0.07), sag: clamp(q[0] / 0.6) };
    st.rinse = q[0] < 0.5 ? -0.3 : lerp(-0.12, 1.2, easeIO((q[0] - 0.5) / 0.5));
    st.specks = 1; pPaint.setMask('clay', q[1]);
    st.swirl = 1; pPaint.setMask('polish', q[2]);
    pPaint.setMask('coat', coat);
    st.gloss = 0.2 + 0.1 * q[0] + 0.08 * q[1] + 0.32 * q[2] + 0.3 * coat;
    st.beadsIn = clamp((q[3] - 0.72) / 0.22);
    st.beadsRoll = reduce ? 0 : clamp((pP - 0.955) / 0.045);
    pPaint.render(s);

    const g = pPaint.g, k = pPaint.k;
    if (q[1] > 0 && q[1] < 1) drawClay(g, pathAt(pPaint.paths.clay, q[1]), k);
    if (q[2] > 0 && q[2] < 1) drawPad(g, pathAt(pPaint.paths.polish, q[2]), k, s.t);
    if (coat > 0 && coat < 1) drawApplicator(g, pathAt(pPaint.paths.coat, coat), k);

    hudG.textContent = Math.round(58 + 6 * q[0] + 4 * q[1] + 22 * q[2] + 7 * coat);
    hudC.textContent = Math.round(46 - 2 * q[2]);
    hudA.textContent = Math.round(64 + 48 * coat);
    pDots.forEach((d, i) => d.style.setProperty('--p', q[i].toFixed(3)));

    const idx = pP < INTRO + SPAN ? 0 : pP < INTRO + SPAN * 2 ? 1 : pP < INTRO + SPAN * 3 ? 2 : 3;
    if (idx !== pIdx) {
      pIdx = idx;
      pSteps.forEach((el, i) => { el.classList.toggle('is-active', i === idx); el.classList.toggle('is-past', i < idx); });
    }
  });

  /* ------------------------------------------------------------------------
     SERVIÇOS — lista ligada às zonas do carro
     ------------------------------------------------------------------------ */

  const car = $('#car'), carZone = $('#car-zone'), svc = $('#svc');
  $$('.car__lines path', car).forEach((p, i) => p.style.setProperty('--i', i));
  let svcActive = SERVICES[1].id;
  svc.innerHTML = SERVICES.map(v => `
    <div class="svc__item" role="listitem" data-id="${v.id}">
      <button type="button" class="svc__btn" aria-expanded="false" aria-controls="svc-${v.id}">
        <span class="svc__name">${v.nome}</span><span class="svc__price">a partir de ${money(v.preco)}</span>
      </button>
      <div class="svc__body" id="svc-${v.id}"><div>
        <p>${v.desc}</p>
        <div class="svc__meta"><span>Duração: ${v.tempo}</span><a href="#agendar" data-pick="${v.nome}">Agendar este serviço</a></div>
      </div></div>
    </div>`).join('');
  const svcItems = $$('.svc__item', svc);
  const showZone = id => {
    const v = SERVICES.find(x => x.id === id);
    if (car.dataset.zone !== v.zona) car.dataset.zone = v.zona;
    carZone.textContent = v.rotulo;
  };
  function setService(id) {
    svcActive = id;
    svcItems.forEach(el => {
      const on = el.dataset.id === id;
      el.classList.toggle('is-active', on);
      $('button', el).setAttribute('aria-expanded', String(on));
      const link = $('a', el);
      if (link) link.tabIndex = on ? 0 : -1;
    });
    showZone(id);
  }
  svcItems.forEach(el => {
    const id = el.dataset.id;
    $('button', el).addEventListener('click', () => setService(id));
    if (finePointer) {
      el.addEventListener('pointerenter', () => showZone(id));
      el.addEventListener('pointerleave', () => showZone(svcActive));
    }
  });
  setService(svcActive);

  /* ------------------------------------------------------------------------
     PACOTES — o preço acompanha o porte
     ------------------------------------------------------------------------ */

  const packsEl = $('#packs');
  packsEl.innerHTML = PACKS.map((p, i) => `
    <article class="pack${p.top ? ' pack--top' : ''}" data-reveal style="--d:${i * 0.1}s" data-id="${p.id}">
      <div class="pack__head">
        ${p.top ? '<span class="tape">Mais completo</span>' : ''}
        <h3 class="pack__name">${p.nome}</h3>
        <p class="pack__for">${p.para}</p>
      </div>
      <p class="pack__price"><small>a partir de</small><b data-base="${p.base}">${money(Math.round(p.base * SIZES.seda / 10) * 10)}</b></p>
      <ul class="pack__list">${p.itens.map(t => `<li>${t}</li>`).join('')}</ul>
      <div class="pack__gloss">
        <span><i style="font-style:normal">Brilho: ${p.brilho}</i><i style="font-style:normal">${p.tempo}</i></span>
        <div class="pack__bar"><i style="--v:${p.nivel}"></i></div>
      </div>
      <a class="btn ${p.top ? 'btn--tape' : 'btn--ghost'}" href="#agendar" data-pick="Pacote ${p.nome}"><span>Quero o ${p.nome}</span></a>
    </article>`).join('');
  const priceEls = $$('.pack__price b', packsEl).map(el => ({ el, base: +el.dataset.base, cur: +el.dataset.base * SIZES.seda, to: Math.round(+el.dataset.base * SIZES.seda / 10) * 10 }));
  $('#sizes').addEventListener('change', e => {
    const k = SIZES[e.target.value] || 1;
    priceEls.forEach(p => { p.to = Math.round(p.base * k / 10) * 10; if (reduce) { p.cur = p.to; p.el.textContent = money(p.to); } });
  });
  tasks.push(s => {
    for (const p of priceEls) {
      if (Math.abs(p.cur - p.to) < 0.5) continue;
      p.cur = lerp(p.cur, p.to, damp(s.dt, 9));
      if (Math.abs(p.cur - p.to) < 0.5) p.cur = p.to;
      p.el.textContent = money(p.cur);
    }
  });
  const topPack = $('.pack--top', packsEl);
  if (topPack && finePointer) {
    topPack.addEventListener('pointermove', e => {
      const r = topPack.getBoundingClientRect();
      topPack.style.setProperty('--gx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
    });
  }

  /* ------------------------------------------------------------------------
     AGENDAR — monta a mensagem enquanto a pessoa preenche
     ------------------------------------------------------------------------ */

  const form = $('#book'), msg = $('#msg'), msgSend = $('#msg-send'), msgCopy = $('#msg-copy'), msgStatus = $('#msg-status');
  const sel = $('#f-servico');
  sel.innerHTML = ['Ainda não sei, quero a avaliação', ...PACKS.map(p => `Pacote ${p.nome}`), ...SERVICES.map(v => v.nome)]
    .map(t => `<option>${t}</option>`).join('');
  const porteNome = { hatch: 'hatch', seda: 'sedã', suv: 'SUV', picape: 'picape' };
  let porteChosen = false;
  function buildMsg() {
    const f = form.elements;
    // o porte só entra na mensagem se a pessoa escolheu um nos pacotes
    const porte = porteChosen ? (document.querySelector('input[name="porte"]:checked') || {}).value : '';
    const lines = [`Olá! Quero marcar uma avaliação na ${CONFIG.marca}.`];
    if (f.nome.value.trim()) lines.push(`Nome: ${f.nome.value.trim()}`);
    lines.push(`Carro: ${f.carro.value.trim() || 'a informar'}${porte ? ` (${porteNome[porte]})` : ''}`);
    lines.push(`Interesse: ${f.servico.value}`);
    if (f.data.value) { const [y, m, d] = f.data.value.split('-'); lines.push(`Melhor dia: ${d}/${m}/${y}`); }
    if (f.obs.value.trim()) lines.push(`Detalhe: ${f.obs.value.trim()}`);
    const text = lines.join('\n');
    msg.textContent = text;
    if (CONFIG.whatsapp) { msgSend.hidden = false; msgSend.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`; }
    return text;
  }
  form.addEventListener('input', () => { buildMsg(); msgStatus.textContent = ''; });
  form.addEventListener('submit', e => e.preventDefault());
  $('#sizes').addEventListener('change', () => { porteChosen = true; buildMsg(); });
  msgCopy.addEventListener('click', () => {
    const text = buildMsg();
    const fallback = () => {
      const range = document.createRange(); range.selectNodeContents(msg);
      const s = getSelection(); s.removeAllRanges(); s.addRange(range);
      msgStatus.textContent = 'Texto selecionado. Copie com Ctrl+C e cole no WhatsApp.';
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => { msgStatus.textContent = 'Mensagem copiada. Agora é só colar no WhatsApp.'; }, fallback);
    } else fallback();
  });
  buildMsg();

  // "Agendar este" / "Quero o pacote": leva a escolha para o formulário
  document.addEventListener('click', e => {
    const pick = e.target.closest('[data-pick]');
    if (!pick) return;
    const opt = Array.from(sel.options).find(o => o.textContent === pick.dataset.pick);
    if (opt) { sel.value = opt.textContent; buildMsg(); }
  });

  /* ------------------------------------------------------------------------
     DÚVIDAS, NAV, ÂNCORAS
     ------------------------------------------------------------------------ */

  $$('#faq .faq__item').forEach(item => {
    const btn = $('button', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  const nav = $('#nav'), menuBtn = $('#menu-btn'), menuPanel = $('#menu-panel');
  function toggleMenu(open) {
    menuPanel.hidden = !open;
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Fechar' : 'Menu';
  }
  menuBtn.addEventListener('click', () => toggleMenu(menuPanel.hidden));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });
  let navY = window.scrollY;
  tasks.push(s => {
    nav.classList.toggle('is-solid', s.y > 40);
    const d = s.y - navY;
    if (Math.abs(d) > 8) {
      if (menuPanel.hidden) nav.classList.toggle('is-hidden', d > 0 && s.y > 400);
      navY = s.y;
    }
  });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.target === '_blank') return;
    const target = document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    toggleMenu(false);
    const y = target.id === 'topo' ? 0 : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ------------------------------------------------------------------------
     REVEAL, RODAPÉ, LÂMPADA
     ------------------------------------------------------------------------ */

  const revealIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    revealIO.unobserve(e.target);
  }), { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
  // as fitas começam recortadas (clip-path), então precisam de um observador sem limiar de área
  const tapeIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    tapeIO.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach(el => (el.classList.contains('tape') ? tapeIO : revealIO).observe(el));
  revealIO.observe(car);

  // marca gigante: ajusta à largura e recebe uma passada de luz conforme o fim da página chega
  const footWord = $('#foot-word'), footBox = watch(footWord.parentElement);
  let footTop = 0, footH = 1, sweep = -20;
  measurers.push(() => {
    footBox.style.setProperty('--foot-size', '100px');
    const w = footWord.getBoundingClientRect().width, avail = footBox.clientWidth;
    if (w && avail) footBox.style.setProperty('--foot-size', `${(100 * avail / w * 0.94).toFixed(1)}px`);
    const r = footBox.getBoundingClientRect();
    footTop = r.top + scrollY; footH = r.height;
  });
  tasks.push(s => {
    if (!footBox.__vis) return;
    const p = reduce ? 0.5 : clamp((s.y + s.vh - footTop) / (footH + s.vh * 0.25));
    sweep = lerp(sweep, lerp(-20, 120, p), damp(s.dt, 6));
    footWord.style.setProperty('--sweep', `${sweep.toFixed(1)}%`);
  });

  const lamp = $('#lamp');
  if (finePointer && !reduce) {
    const lampTxt = $('span', lamp);
    let tx = 0, ty = 0, cx = 0, cy = 0, label = '';
    document.addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      const el = e.target instanceof Element ? e.target : null;
      const host = el && el.closest('[data-lamp]');
      const on = !!host && !el.closest('a, button, input, label');
      lamp.classList.toggle('is-on', on);
      if (on && host.dataset.lamp !== label) { label = host.dataset.lamp; lampTxt.textContent = label; }
    }, { passive: true });
    document.addEventListener('pointerdown', () => lamp.classList.add('is-down'));
    document.addEventListener('pointerup', () => lamp.classList.remove('is-down'));
    tasks.push(s => {
      const k = damp(s.dt, 16);
      cx = lerp(cx, tx, k); cy = lerp(cy, ty, k);
      lamp.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
    });
  }

  /* ------------------------------------------------------------------------
     LOOP E PARTIDA
     ------------------------------------------------------------------------ */

  function measure() { S.vw = innerWidth; S.vh = innerHeight; measurers.forEach(f => f()); }
  let rT;
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 120); });
  window.addEventListener('load', measure);

  let last = performance.now(), lastY = window.scrollY;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const y = window.scrollY;
    S.v = lerp(S.v, (y - lastY) / dt, 0.14);
    lastY = y; S.y = y; S.t = now / 1000; S.dt = dt;
    for (const f of tasks) f(S);
    // 1,5 s seguidos abaixo de ~30 fps com pintura na tela: baixa a resolução dos canvases
    if ((hCanvas.__vis || pCanvas.__vis) && dt > 0.034) {
      if (++slow > 45 && drops < 2) { drops++; slow = 0; hPaint.lower(); pPaint.lower(); }
    } else slow = 0;
    requestAnimationFrame(frame);
  }
  let slow = 0, drops = 0;
  measure();
  requestAnimationFrame(frame);

  const ready = () => { measure(); mirror.classList.add('is-in'); };
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1800))]).then(ready);
  else ready();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
})();
