/* ==========================================================================
   VULKA Suplementos — interações e motion
   Sem dependências. Tudo roda em um único requestAnimationFrame.
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
    marca: 'VULKA',
    // WhatsApp que recebe os pedidos: só números, com DDI e DDD. Ex.: '5511999999999'.
    // Vazio = o botão "Finalizar pedido" mostra um aviso de demonstração.
    whatsapp: '',
  };

  const INK = '#121310';
  const CHALK = '#F3F4EE';

  const FLAVORS = {
    baunilha:  { nome: 'Baunilha',      field: '#F6CE46', deep: '#E2B427', onField: '#121310', onText: '#121310', pop: '#F6CE46', powder: '#FFF6D2' },
    chocolate: { nome: 'Chocolate',     field: '#7C4A2D', deep: '#643820', onField: '#22110A', onText: '#FFF1E0', pop: '#E0A070', powder: '#D9AE8C', band: '#6B3D24', bandInk: '#FFF1E0' },
    morango:   { nome: 'Morango',       field: '#FF6078', deep: '#EB4862', onField: '#121310', onText: '#121310', pop: '#FF6078', powder: '#FFD9DF' },
    doce:      { nome: 'Doce de leite', field: '#EDA24A', deep: '#D98A30', onField: '#121310', onText: '#121310', pop: '#EDA24A', powder: '#FFE3BD' },
    pistache:  { nome: 'Pistache',      field: '#B4D468', deep: '#9CC04C', onField: '#121310', onText: '#121310', pop: '#B4D468', powder: '#EAF5CC' },
  };

  const PREP_WHEY = ['Misture 1 dosador (30 g)', 'em 200 ml de água gelada.', 'Agite por 10 segundos.'];

  const isoLabel = f => ({
    ratio: 2.3,
    ring: 'WHEY PROTEIN ISOLADO  ·  25 G DE PROTEÍNA POR DOSE  ·  ZERO AÇÚCAR ADICIONADO  ·  ',
    nome: 'WHEY ISOLADO', big: '25', unit: 'g', side: ['DE PROTEÍNA', 'POR DOSE'],
    bandText: f.nome.toUpperCase(), band: f.band || f.field, bandInk: f.bandInk || INK,
    peso: 'PESO LÍQ. 900 g', doses: '30 DOSES',
    porcao: 'Porção 30 g (1 dosador) · 30 porções',
    facts: [['Valor energético', '109 kcal'], ['Proteínas', '25 g'], ['Carboidratos', '1,0 g'], ['Açúcares adicionados', '0 g'], ['Gorduras totais', '0,5 g'], ['Sódio', '60 mg']],
    hl: 1,
    prep: PREP_WHEY,
    alerta: ['ALÉRGICOS: CONTÉM DERIVADOS DE LEITE.', 'NÃO CONTÉM GLÚTEN.'],
  });

  // Catálogo. "cor" pinta o cartão e a faixa do rótulo; "tub" define o formato do pote.
  const PRODUCTS = [
    {
      id: 'iso', nome: 'Whey Isolado', meta: '900 g · 30 doses · 25 g de proteína', preco: 189.9, tag: 'Proteína', bg: '25g',
      tub: { ratio: 2.3, scale: 1 }, sabor: true,
    },
    {
      id: 'conc', nome: 'Whey Concentrado', meta: '900 g · 30 doses · 22 g de proteína', preco: 129.9, tag: 'Proteína', bg: '22g', cor: '#5B8DF8',
      tub: { ratio: 2.3, scale: 1 },
      label: {
        ring: 'WHEY PROTEIN CONCENTRADO  ·  22 G DE PROTEÍNA POR DOSE  ·  ', nome: 'WHEY CONCENTRADO', big: '22', unit: 'g', side: ['DE PROTEÍNA', 'POR DOSE'],
        bandText: 'CHOCOLATE', peso: 'PESO LÍQ. 900 g', doses: '30 DOSES', porcao: 'Porção 30 g (1 dosador) · 30 porções',
        facts: [['Valor energético', '118 kcal'], ['Proteínas', '22 g'], ['Carboidratos', '3,0 g'], ['Gorduras totais', '2,0 g'], ['Sódio', '55 mg']], hl: 1,
        prep: PREP_WHEY, alerta: ['ALÉRGICOS: CONTÉM DERIVADOS DE LEITE.', 'NÃO CONTÉM GLÚTEN.'],
      },
    },
    {
      id: 'creatina', nome: 'Creatina Monohidratada', meta: '300 g · 100 doses · 3 g por dose', preco: 79.9, tag: 'Força', bg: '3g', cor: '#9EDFEA',
      tub: { ratio: 1.55, scale: .96 },
      label: {
        ring: 'CREATINA MONOHIDRATADA  ·  100% PURA  ·  3 G POR DOSE  ·  ', nome: 'CREATINA', big: '3', unit: 'g', side: ['DE CREATINA', 'POR DOSE'],
        bandText: 'SEM SABOR', peso: 'PESO LÍQ. 300 g', doses: '100 DOSES', porcao: 'Porção 3 g (1 dosador) · 100 porções',
        facts: [['Creatina monohidratada', '3 g'], ['Valor energético', '0 kcal'], ['Carboidratos', '0 g'], ['Sódio', '0 mg']], hl: 0,
        prep: ['Dissolva 1 dosador (3 g)', 'em 200 ml de água ou suco.', 'Tome todos os dias.'], alerta: ['NÃO CONTÉM GLÚTEN.', 'USO DIÁRIO.'],
      },
    },
    {
      id: 'magma', nome: 'Pré-treino Magma', meta: '300 g · 30 doses · 200 mg de cafeína', preco: 99.9, tag: 'Energia', bg: '200', cor: '#FF6238',
      tub: { ratio: 1.4, scale: .96 },
      label: {
        ring: 'PRÉ-TREINO MAGMA  ·  200 MG DE CAFEÍNA  ·  FRUTAS VERMELHAS  ·  ', nome: 'PRÉ-TREINO MAGMA', big: '200', unit: 'mg', side: ['DE CAFEÍNA', 'POR DOSE'],
        bandText: 'FRUTAS VERMELHAS', peso: 'PESO LÍQ. 300 g', doses: '30 DOSES', porcao: 'Porção 10 g (1 dosador) · 30 porções',
        facts: [['Cafeína', '200 mg'], ['Taurina', '1 g'], ['Arginina', '2 g'], ['Valor energético', '8 kcal']], hl: 0,
        prep: ['Dissolva 1 dosador (10 g)', 'em 250 ml de água.', 'Tome 20 min antes do treino.'], alerta: ['CONTÉM CAFEÍNA.', 'NÃO CONTÉM GLÚTEN.'],
      },
    },
    {
      id: 'glutamina', nome: 'Glutamina', meta: '300 g · 60 doses · 5 g por dose', preco: 69.9, tag: 'Recuperação', bg: '5g', cor: '#3FCBA6',
      tub: { ratio: 1.55, scale: .96 },
      label: {
        ring: 'L-GLUTAMINA  ·  5 G POR DOSE  ·  100% PURA  ·  ', nome: 'L-GLUTAMINA', big: '5', unit: 'g', side: ['DE GLUTAMINA', 'POR DOSE'],
        bandText: 'SEM SABOR', peso: 'PESO LÍQ. 300 g', doses: '60 DOSES', porcao: 'Porção 5 g (1 dosador) · 60 porções',
        facts: [['L-glutamina', '5 g'], ['Valor energético', '20 kcal'], ['Carboidratos', '0 g'], ['Sódio', '0 mg']], hl: 0,
        prep: ['Dissolva 1 dosador (5 g)', 'em 200 ml de água.', 'Tome após o treino.'], alerta: ['NÃO CONTÉM GLÚTEN.', 'USO DIÁRIO.'],
      },
    },
    {
      id: 'bcaa', nome: 'BCAA 2:1:1', meta: '200 g · 40 doses · 5 g por dose', preco: 74.9, tag: 'Aminoácidos', bg: '2:1:1', cor: '#B49BFF',
      tub: { ratio: 1.4, scale: .96 },
      label: {
        ring: 'BCAA 2:1:1  ·  LEUCINA  ·  ISOLEUCINA  ·  VALINA  ·  ', nome: 'BCAA EM PÓ', big: '2:1:1', unit: '', side: ['LEUCINA', 'ISOLEUCINA', 'VALINA'],
        bandText: 'LIMÃO', peso: 'PESO LÍQ. 200 g', doses: '40 DOSES', porcao: 'Porção 5 g (1 dosador) · 40 porções',
        facts: [['Leucina', '2,5 g'], ['Isoleucina', '1,25 g'], ['Valina', '1,25 g'], ['Valor energético', '20 kcal']], hl: 0,
        prep: ['Dissolva 1 dosador (5 g)', 'em 250 ml de água.', 'Tome durante o treino.'], alerta: ['NÃO CONTÉM GLÚTEN.', 'CONTÉM AROMATIZANTE.'],
      },
    },
  ];

  /* ------------------------------------------------------------------------
     UTILITÁRIOS
     ------------------------------------------------------------------------ */

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const smooth = t => t * t * (3 - 2 * t);
  const damp = (dt, k) => 1 - Math.exp(-dt * k);
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const TAU = Math.PI * 2;

  const S = { y: window.scrollY, v: 0, t: 0, dt: 0.016, vw: innerWidth, vh: innerHeight, px: .5, py: .5, cx: -9999, cy: -9999 };
  const tasks = [];      // rodam a cada frame
  const measurers = [];  // rodam em resize / mudança de layout

  const io = new IntersectionObserver(es => es.forEach(e => { e.target.__vis = e.isIntersecting; }), { rootMargin: '160px 0px' });
  const watch = el => { el.__vis = false; io.observe(el); return el; };

  /* ------------------------------------------------------------------------
     RÓTULO — desenha a arte do pote em um canvas que depois é "enrolado"
     ------------------------------------------------------------------------ */

  const fontDisp = (g, px, wdth = 'normal', wght = 900) => {
    g.font = `${wght} ${px}px Anybody, "Arial Black", sans-serif`;
    if ('fontStretch' in g) g.fontStretch = wdth;
  };
  const fontMono = (g, px, wght = 500) => {
    g.font = `${wght} ${px}px "Martian Mono", ui-monospace, monospace`;
    if ('fontStretch' in g) g.fontStretch = 'normal';
  };
  const fontBody = (g, px, wght = 500) => {
    g.font = `${wght} ${px}px "Instrument Sans", "Helvetica Neue", Arial, sans-serif`;
    if ('fontStretch' in g) g.fontStretch = 'normal';
  };
  const spacing = (g, v) => { if ('letterSpacing' in g) g.letterSpacing = v; };
  const fitDisp = (g, text, maxW, maxPx, wdth, wght) => {
    let px = maxPx;
    fontDisp(g, px, wdth, wght);
    const w = g.measureText(text).width;
    if (w > maxW) { px = px * maxW / w; fontDisp(g, px, wdth, wght); }
    return px;
  };

  function makeLabel(s, TW) {
    const TH = Math.round(TW * s.ratio / TAU);       // altura do corpo ÷ circunferência
    const PAD = Math.ceil(TW * 0.07);                 // cópia do começo, para a emenda não aparecer
    const c = document.createElement('canvas');
    c.width = TW + PAD;
    c.height = TH;
    const g = c.getContext('2d');
    const U = TH / 100;
    const FW = TW * 0.23;                             // largura útil de cada face
    const cxF = TW * 0.5, cxA = TW * (0.5 + 1 / 3), cxB = TW * (0.5 - 1 / 3);
    const zTop = TH * 0.2, zH = TH * 0.47;            // zona útil entre as duas faixas

    g.fillStyle = CHALK;
    g.fillRect(0, 0, TW, TH);

    // faixa-anel superior com texto corrido (denuncia a rotação)
    const ry0 = TH * 0.065, rh = TH * 0.095;
    g.fillStyle = INK;
    g.fillRect(0, ry0, TW, rh);
    g.fillStyle = CHALK;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    fontMono(g, rh * 0.36, 600);
    spacing(g, `${(rh * 0.04).toFixed(1)}px`);
    {
      const w = g.measureText(s.ring).width;
      const n = Math.max(1, Math.floor(TW / w));
      const sp = TW / n;
      for (let i = 0; i < n; i++) g.fillText(s.ring, i * sp + sp * 0.02, ry0 + rh / 2 + rh * 0.03);
    }
    spacing(g, '0px');

    // faixa de cor inferior
    const by0 = TH * 0.7, bh = TH * 0.19;
    g.fillStyle = INK;
    g.fillRect(0, by0 - U * 0.9, TW, U * 0.9);
    g.fillStyle = s.band;
    g.fillRect(0, by0, TW, bh);
    g.fillStyle = s.bandInk;
    g.textAlign = 'center';
    fitDisp(g, s.bandText, FW * 0.96, bh * 0.6, 'expanded', 900);
    g.fillText(s.bandText, cxF, by0 + bh / 2 + bh * 0.04);
    fontMono(g, Math.min(bh * 0.2, FW * 0.055), 600);
    spacing(g, `${(bh * 0.02).toFixed(1)}px`);
    g.fillText(s.peso, cxA, by0 + bh / 2);
    g.fillText(s.doses, cxB, by0 + bh / 2);
    spacing(g, '0px');

    // ---------------- face da frente
    g.fillStyle = INK;
    g.textBaseline = 'alphabetic';
    g.textAlign = 'center';
    const pxBrand = fitDisp(g, CONFIG.marca, FW * 0.94, zH * 0.3, 'extra-expanded', 900);
    const yBrand = zTop + pxBrand * 0.74;
    g.fillText(CONFIG.marca, cxF, yBrand);

    const yRule = yBrand + zH * 0.06;
    g.fillRect(cxF - FW * 0.47, yRule, FW * 0.94, Math.max(2, U * 0.5));
    fontMono(g, zH * 0.058, 600);
    spacing(g, `${(zH * 0.008).toFixed(1)}px`);
    g.textAlign = 'left';
    g.fillText(s.nome, cxF - FW * 0.47, yRule + zH * 0.115);
    g.textAlign = 'right';
    g.fillText('NUTRITION', cxF + FW * 0.47, yRule + zH * 0.115);
    spacing(g, '0px');

    const yBig = zTop + zH * 0.985;
    const sidePx = zH * 0.056;
    fontMono(g, sidePx, 600);
    const wSide = Math.max(...s.side.map(t => g.measureText(t).width));
    const gap = FW * 0.04;
    const unitK = 0.42;
    let pxBig = zH * 0.5;
    fontDisp(g, pxBig, 'condensed', 900);
    let wBig = g.measureText(s.big).width;
    fontDisp(g, pxBig * unitK, 'condensed', 900);
    let wUnit = s.unit ? g.measureText(s.unit).width + pxBig * 0.03 : 0;
    const room = FW * 0.94 - gap - wSide;
    if (wBig + wUnit > room) {
      const k = room / (wBig + wUnit);
      pxBig *= k; wBig *= k; wUnit *= k;
    }
    let x = cxF - (wBig + wUnit + gap + wSide) / 2;
    g.textAlign = 'left';
    fontDisp(g, pxBig, 'condensed', 900);
    g.fillText(s.big, x, yBig);
    x += wBig;
    if (s.unit) {
      fontDisp(g, pxBig * unitK, 'condensed', 900);
      g.fillText(s.unit, x + pxBig * 0.03, yBig);
      x += wUnit;
    }
    x += gap;
    fontMono(g, sidePx, 600);
    s.side.forEach((t, i) => g.fillText(t, x, yBig - (s.side.length - 1 - i) * sidePx * 1.5 - sidePx * 0.15));

    // ---------------- face A: informação nutricional
    const bw = FW * 0.98, bx = cxA - bw / 2;
    g.lineWidth = Math.max(2, U * 0.55);
    g.strokeStyle = INK;
    g.strokeRect(bx, zTop, bw, zH);
    const pad = bw * 0.045;
    let y = zTop + pad;
    g.textAlign = 'left';
    g.textBaseline = 'top';
    const pxT = fitDisp(g, 'INFORMAÇÃO NUTRICIONAL', bw - pad * 2, zH * 0.14, 'condensed', 900);
    g.fillText('INFORMAÇÃO NUTRICIONAL', bx + pad, y);
    y += pxT * 1.02;
    fontBody(g, zH * 0.05, 500);
    g.fillText(s.porcao, bx + pad, y);
    y += zH * 0.078;
    g.fillRect(bx + pad, y, bw - pad * 2, zH * 0.024);
    y += zH * 0.024;
    const rowH = (zTop + zH - pad * 0.5 - y) / s.facts.length;
    g.textBaseline = 'middle';
    s.facts.forEach((r, i) => {
      const yy = y + rowH * i;
      if (i === s.hl) { g.fillStyle = s.band; g.fillRect(bx + pad * 0.4, yy + rowH * 0.08, bw - pad * 0.8, rowH * 0.84); }
      g.fillStyle = i === s.hl ? s.bandInk : INK;
      fontBody(g, Math.min(rowH * 0.5, zH * 0.062), i === s.hl ? 700 : 500);
      g.textAlign = 'left';
      g.fillText(r[0], bx + pad, yy + rowH / 2);
      fontMono(g, Math.min(rowH * 0.44, zH * 0.054), 600);
      g.textAlign = 'right';
      g.fillText(r[1], bx + bw - pad, yy + rowH / 2);
      g.fillStyle = INK;
      if (i < s.facts.length - 1 && i !== s.hl && i + 1 !== s.hl) g.fillRect(bx + pad, yy + rowH - 1, bw - pad * 2, Math.max(1, U * 0.12));
    });

    // ---------------- face B: modo de preparo
    const px0 = cxB - bw / 2;
    y = zTop;
    g.fillStyle = INK;
    g.textAlign = 'left';
    g.textBaseline = 'top';
    const pxP = fitDisp(g, 'MODO DE PREPARO', bw * 0.78, zH * 0.14, 'condensed', 900);
    g.fillText('MODO DE PREPARO', px0, y);
    y += pxP * 1.12;
    g.fillRect(px0, y, bw, Math.max(2, U * 0.5));
    y += zH * 0.045;
    fontBody(g, zH * 0.07, 500);
    s.prep.forEach(t => { g.fillText(t, px0, y); y += zH * 0.1; });
    y += zH * 0.025;
    fontMono(g, zH * 0.038, 600);
    s.alerta.forEach(t => { g.fillText(t, px0, y); y += zH * 0.06; });

    const bcH = zH * 0.19, bcY = zTop + zH - bcH - zH * 0.06, bcW = bw * 0.44, mod = bw * 0.0046;
    let bxp = px0, seed = 7;
    while (bxp < px0 + bcW) {
      seed = (seed * 73 + 19) % 101;
      const w = (1 + (seed % 3)) * mod;
      g.fillRect(bxp, bcY, w, bcH);
      bxp += w + (1 + (seed % 2)) * mod;
    }
    fontMono(g, zH * 0.036, 500);
    g.fillText('7 890000 000000', px0, bcY + bcH + zH * 0.015);
    const sr = bcH * 0.62, scx = px0 + bw - sr, scy = bcY + bcH / 2;
    g.beginPath(); g.arc(scx, scy, sr, 0, TAU); g.fill();
    g.fillStyle = s.band === INK ? CHALK : s.band;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    fontDisp(g, sr * 1.15, 'extra-expanded', 900);
    g.fillText(CONFIG.marca[0], scx, scy + sr * 0.07);

    // ---------------- filetes verticais entre as faces
    g.fillStyle = INK;
    [1 / 6, 0.5, 5 / 6].forEach(f => {
      const vx = TW * ((f + 0.5) % 1) + U * 0.4;
      g.fillRect(vx, zTop, Math.max(1, U * 0.2), zH);
      g.save();
      g.translate(vx + U * 2.6, zTop + zH);
      g.rotate(-Math.PI / 2);
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      fontMono(g, Math.max(8, zH * 0.03), 500);
      spacing(g, `${(zH * 0.006).toFixed(1)}px`);
      g.fillText('LOTE E VALIDADE: VER FUNDO DO POTE', 0, 0);
      spacing(g, '0px');
      g.restore();
    });

    // ---------------- sombra da tampa (em cima) e curva do fundo (embaixo)
    let gr = g.createLinearGradient(0, 0, 0, TH * 0.07);
    gr.addColorStop(0, 'rgba(0,0,0,.5)');
    gr.addColorStop(0.5, 'rgba(0,0,0,.12)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, TW, TH * 0.07);
    gr = g.createLinearGradient(0, TH * 0.9, 0, TH);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.55, 'rgba(0,0,0,.07)');
    gr.addColorStop(1, 'rgba(0,0,0,.34)');
    g.fillStyle = gr;
    g.fillRect(0, TH * 0.9, TW, TH * 0.1);
    g.fillStyle = 'rgba(0,0,0,.16)';
    g.fillRect(0, TH * 0.925, TW, Math.max(1, U * 0.25));

    g.drawImage(c, 0, 0, PAD, TH, TW, 0, PAD, TH);
    c.TW = TW;
    return c;
  }

  /* ------------------------------------------------------------------------
     POTE — cilindro em perspectiva desenhado coluna a coluna (sem WebGL)
     ------------------------------------------------------------------------ */

  class Tub {
    constructor(canvas, o = {}) {
      this.c = canvas;
      this.g = canvas.getContext('2d');
      this.ratio = o.ratio ?? 2.3;     // altura do corpo em raios
      this.lid = o.lid ?? 0.38;        // altura da tampa em raios
      this.tilt = o.tilt ?? 0.17;      // achatamento das elipses (câmera um pouco acima)
      this.scale = o.scale ?? 1;
      this.rot = 0;
      this.tex = null;
      this.R = 0;
      watch(canvas);
      new ResizeObserver(() => this.resize()).observe(canvas);
      this.resize();
    }

    resize() {
      const c = this.c;
      const w = c.clientWidth, h = c.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.round(w * dpr), H = Math.round(h * dpr);
      if (c.width !== W) c.width = W;
      if (c.height !== H) c.height = H;
      const pad = Math.min(W, H) * 0.035;
      const fullRatio = Math.max(this.ratio, 1.95);
      const hu = fullRatio + this.lid + this.tilt * 2.8;
      const R = Math.min((W - pad * 2) / 2.1, (H - pad * 2) / hu) * this.scale;
      this.dpr = dpr;
      this.step = dpr >= 1.5 ? 2 : 1;
      this.R = R;
      this.Rcss = R / dpr;
      this.cx = W / 2;
      this.yB = H - pad - this.tilt * R * 1.75;
      this.yT = this.yB - this.ratio * R;
      this.render();
    }

    render() {
      const { g, c, R, cx, yB, yT, tex, step } = this;
      if (!tex || !R) return;
      const W = c.width, H = c.height;
      const ry = this.tilt * R, bodyH = yB - yT;
      let rot = this.rot % TAU;
      if (rot < 0) rot += TAU;
      g.clearRect(0, 0, W, H);

      // sombra no chão
      g.save();
      g.translate(cx, yB + ry * 0.8);
      g.scale(1, this.tilt * 1.2);
      const sg = g.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.3);
      sg.addColorStop(0, 'rgba(0,0,0,.45)');
      sg.addColorStop(0.6, 'rgba(0,0,0,.16)');
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = sg;
      g.beginPath(); g.arc(0, 0, R * 1.3, 0, TAU); g.fill();
      g.restore();

      // corpo: cada coluna da tela busca a fatia certa do rótulo (x = R·sen θ)
      g.save();
      g.beginPath();
      g.moveTo(cx - R, yT);
      g.lineTo(cx - R, yB);
      g.ellipse(cx, yB, R, ry, 0, Math.PI, 0, true);
      g.lineTo(cx + R, yT);
      g.ellipse(cx, yT, R, ry, 0, 0, Math.PI, false);
      g.closePath();
      g.clip();
      const TW = tex.TW, TH = tex.height, k = TW / TAU;
      for (let px = -R; px < R; px += step) {
        const a0 = Math.asin(Math.max(-1, px / R));
        const a1 = Math.asin(Math.min(1, (px + step) / R));
        let sx = ((a0 + rot) * k + TW * 0.5) % TW;
        if (sx < 0) sx += TW;
        const sw = Math.max(0.5, (a1 - a0) * k);
        const xm = (px + step * 0.5) / R;
        const dy = ry * Math.sqrt(Math.max(0, 1 - xm * xm));
        g.drawImage(tex, sx, 0, sw, TH, cx + px, yT + dy, step + 0.6, bodyH);
      }
      // volume: luz vindo da esquerda
      const sh = g.createLinearGradient(cx - R, 0, cx + R, 0);
      sh.addColorStop(0, 'rgba(0,0,0,.52)');
      sh.addColorStop(0.07, 'rgba(0,0,0,.3)');
      sh.addColorStop(0.2, 'rgba(0,0,0,.06)');
      sh.addColorStop(0.29, 'rgba(255,255,255,.3)');
      sh.addColorStop(0.4, 'rgba(255,255,255,0)');
      sh.addColorStop(0.62, 'rgba(0,0,0,.07)');
      sh.addColorStop(0.86, 'rgba(0,0,0,.3)');
      sh.addColorStop(0.96, 'rgba(0,0,0,.46)');
      sh.addColorStop(1, 'rgba(0,0,0,.3)');
      g.fillStyle = sh;
      g.fillRect(cx - R, yT - 2, R * 2, bodyH + ry + 4);
      g.restore();

      // tampa: lateral com ranhuras que acompanham a rotação
      const Rl = R * 1.035, ryl = this.tilt * Rl, yL = yT - this.lid * R, yLb = yT + R * 0.04;
      g.save();
      g.beginPath();
      g.moveTo(cx - Rl, yL);
      g.lineTo(cx - Rl, yLb);
      g.ellipse(cx, yLb, Rl, ryl, 0, Math.PI, 0, true);
      g.lineTo(cx + Rl, yL);
      g.ellipse(cx, yL, Rl, ryl, 0, 0, Math.PI, false);
      g.closePath();
      g.clip();
      g.fillStyle = '#1D1E1A';
      g.fillRect(cx - Rl, yL - 2, Rl * 2, yLb - yL + ryl + 4);
      const N = 60;
      for (let px = -Rl; px < Rl; px += step) {
        const xm = clamp((px + step * 0.5) / Rl, -1, 1);
        const a = Math.asin(xm) + rot;
        const v = (0.5 + 0.5 * Math.cos(a * N)) * Math.sqrt(1 - xm * xm);
        g.fillStyle = `rgba(255,255,255,${(v * 0.13).toFixed(3)})`;
        g.fillRect(cx + px, yL - 2, step + 0.5, yLb - yL + ryl + 4);
      }
      const sl = g.createLinearGradient(cx - Rl, 0, cx + Rl, 0);
      sl.addColorStop(0, 'rgba(0,0,0,.6)');
      sl.addColorStop(0.2, 'rgba(0,0,0,.1)');
      sl.addColorStop(0.29, 'rgba(255,255,255,.2)');
      sl.addColorStop(0.42, 'rgba(255,255,255,0)');
      sl.addColorStop(0.8, 'rgba(0,0,0,.35)');
      sl.addColorStop(1, 'rgba(0,0,0,.6)');
      g.fillStyle = sl;
      g.fillRect(cx - Rl, yL - 2, Rl * 2, yLb - yL + ryl + 4);
      g.restore();

      // tampa: topo
      g.beginPath();
      g.ellipse(cx, yL, Rl, ryl, 0, 0, TAU);
      const tg = g.createLinearGradient(cx - Rl, yL - ryl, cx + Rl, yL + ryl);
      tg.addColorStop(0, '#44463F');
      tg.addColorStop(0.45, '#2A2B27');
      tg.addColorStop(1, '#191A17');
      g.fillStyle = tg;
      g.fill();
      g.lineWidth = Math.max(1, R * 0.008);
      g.strokeStyle = 'rgba(255,255,255,.2)';
      g.stroke();
      g.beginPath();
      g.ellipse(cx, yL, Rl * 0.86, ryl * 0.86, 0, 0, TAU);
      g.strokeStyle = 'rgba(0,0,0,.45)';
      g.stroke();
      g.beginPath();
      g.ellipse(cx, yL + ryl * 0.03, Rl * 0.86, ryl * 0.86, 0, 0, TAU);
      g.strokeStyle = 'rgba(255,255,255,.09)';
      g.stroke();
      // marca em relevo no topo, girando junto
      g.save();
      g.translate(cx, yL);
      g.scale(1, this.tilt);
      g.rotate(rot);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fontDisp(g, Rl * 0.3, 'extra-expanded', 900);
      g.fillStyle = 'rgba(255,255,255,.13)';
      g.fillText(CONFIG.marca, 0, Rl * 0.02);
      g.restore();
    }
  }

  /* ------------------------------------------------------------------------
     FONTES — o rótulo é desenhado em canvas, então espera as fontes chegarem
     ------------------------------------------------------------------------ */

  const fontsReady = (() => {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('900 48px Anybody'),
      document.fonts.load('600 16px "Martian Mono"'),
      document.fonts.load('500 16px "Instrument Sans"'),
    ]).catch(() => {});
  })();
  const timeout = ms => new Promise(r => setTimeout(r, ms));

  /* ------------------------------------------------------------------------
     HERO — pote, sabor, palavra cinética, poeira
     ------------------------------------------------------------------------ */

  const hero = $('#hero');
  const heroStage = $('#hero-stage');
  const heroCanvas = $('#tub-hero');
  const storyCanvas = $('#tub-story');
  const heroTub = new Tub(heroCanvas, { ratio: 2.3 });
  const storyTub = new Tub(storyCanvas, { ratio: 2.3 });
  watch(hero);

  let flavorKey = 'baunilha';
  const TEX = {};
  const texW = () => (innerWidth < 700 ? 1792 : 2560);
  const heroTex = key => TEX[key] || (TEX[key] = makeLabel(isoLabel(FLAVORS[key]), texW()));

  const HT = { rot: reduce ? 0 : -5.4, vel: 0, target: 0, drag: false, lastX: 0, pending: null, swapAt: 0 };
  const hint = $('#hero-hint');

  heroCanvas.addEventListener('pointerdown', e => {
    HT.drag = true;
    HT.lastX = e.clientX;
    HT.vel = 0;
    try { heroCanvas.setPointerCapture(e.pointerId); } catch (_) {}
    heroCanvas.classList.add('is-drag');
    hint.classList.add('is-gone');
  });
  heroCanvas.addEventListener('pointermove', e => {
    if (!HT.drag) return;
    const dx = e.clientX - HT.lastX;
    HT.lastX = e.clientX;
    const d = -dx / Math.max(40, heroTub.Rcss);
    HT.rot += d;
    HT.vel = lerp(HT.vel, d / Math.max(S.dt, 0.008), 0.5);
  });
  const endDrag = () => {
    if (!HT.drag) return;
    HT.drag = false;
    heroCanvas.classList.remove('is-drag');
    const snap = TAU / 3;
    HT.target = Math.round((HT.rot + HT.vel * 0.28) / snap) * snap;
  };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => heroCanvas.addEventListener(t, endDrag));

  tasks.push(s => {
    if (HT.pending && s.t >= HT.swapAt) {
      heroTub.tex = storyTub.tex = HT.pending;
      HT.pending = null;
      if (!storyCanvas.__vis) storyTub.render();
    }
    if (!heroCanvas.__vis || !heroTub.tex) return;
    if (!HT.drag) {
      const sway = reduce ? 0 : Math.sin(s.t * 0.8) * 0.16;
      const acc = (HT.target + sway - HT.rot) * 26 - HT.vel * 8.5;
      HT.vel += acc * s.dt;
      HT.rot += HT.vel * s.dt;
    }
    heroTub.rot = HT.rot;
    heroTub.render();
  });

  // ----- poeira de whey
  const dust = $('#dust');
  const dg = dust.getContext('2d');
  let dW = 0, dH = 0, dDpr = 1;
  const specks = [];
  const bursts = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  function dustResize() {
    if (dW === hero.clientWidth && dH === hero.clientHeight) return;
    dDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    dW = hero.clientWidth; dH = hero.clientHeight;
    dust.width = Math.round(dW * dDpr); dust.height = Math.round(dH * dDpr);
    const n = reduce ? 0 : Math.round(clamp(dW / 26, 18, 60));
    specks.length = 0;
    for (let i = 0; i < n; i++) specks.push({ x: rnd(0, dW), y: rnd(0, dH), r: rnd(1, 4.2), vx: rnd(-6, 6), vy: rnd(-16, -4), ph: rnd(0, TAU), z: rnd(0.3, 1) });
  }
  measurers.push(dustResize);
  function burst(x, y, n = 110) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), sp = rnd(120, 640);
      bursts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 160, r: rnd(1.2, 6), life: rnd(0.7, 1.5), age: 0 });
    }
  }
  tasks.push(s => {
    if (!hero.__vis || !dW) return;
    dg.setTransform(dDpr, 0, 0, dDpr, 0, 0);
    dg.clearRect(0, 0, dW, dH);
    dg.fillStyle = FLAVORS[flavorKey].powder;
    const ox = (s.px - 0.5) * 30, oy = (s.py - 0.5) * 20;
    for (const p of specks) {
      p.x += (p.vx + Math.sin(s.t * 0.9 + p.ph) * 8) * s.dt;
      p.y += (p.vy - Math.abs(s.v) * 0.02) * s.dt;
      if (p.y < -10) { p.y = dH + 10; p.x = rnd(0, dW); }
      if (p.x < -10) p.x = dW + 10;
      if (p.x > dW + 10) p.x = -10;
      dg.globalAlpha = 0.35 + 0.4 * p.z;
      dg.beginPath();
      dg.arc(p.x + ox * p.z, p.y + oy * p.z, p.r * p.z, 0, TAU);
      dg.fill();
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const p = bursts[i];
      p.age += s.dt;
      if (p.age > p.life) { bursts.splice(i, 1); continue; }
      p.vx *= 1 - s.dt * 2.2;
      p.vy = p.vy * (1 - s.dt * 2.2) + 520 * s.dt;
      p.x += p.vx * s.dt; p.y += p.vy * s.dt;
      const k = 1 - p.age / p.life;
      dg.globalAlpha = k;
      dg.beginPath();
      dg.arc(p.x, p.y, p.r * (0.4 + 0.6 * k), 0, TAU);
      dg.fill();
    }
    dg.globalAlpha = 1;
  });

  // ----- palavra cinética: as letras "ganham massa" e reagem ao ponteiro
  const word = $('#hero-word');
  const letters = $$('span', word).map((el, i) => ({ el, i, w: reduce ? 104 : 50, g: reduce ? 900 : 100 }));
  const BASE_W = 104;
  let wordRect = { left: 0, width: 1, top: 0, height: 1 }, introAt = null, heroBottom = 0, near = 0;
  const setAxes = l => { l.el.style.fontVariationSettings = `"wdth" ${l.w.toFixed(1)}, "wght" ${l.g.toFixed(0)}`; };
  function fitWord() {
    const avail = word.clientWidth;
    if (!avail) return;
    letters.forEach(l => { l.el.style.fontVariationSettings = `"wdth" ${BASE_W}, "wght" 900`; });
    hero.style.setProperty('--word-size', '100px');
    let sum = 0;
    letters.forEach(l => { sum += l.el.getBoundingClientRect().width; });
    const size = Math.min(100 * avail * 0.985 / sum, innerHeight * 0.36);
    hero.style.setProperty('--word-size', `${size.toFixed(1)}px`);
    letters.forEach(setAxes);
    const r = word.getBoundingClientRect();
    wordRect = { left: r.left + (r.width - sum * size / 100) / 2, width: sum * size / 100, top: r.top + scrollY, height: r.height };
    heroBottom = hero.offsetTop + hero.offsetHeight;
  }
  measurers.push(fitWord);
  tasks.push(s => {
    if (reduce || !hero.__vis) return;
    if (introAt === null) introAt = s.t;
    const n = letters.length;
    // "near": 1 com o ponteiro sobre a palavra, caindo a 0 conforme ele se afasta na vertical
    const wh = wordRect.height;
    const off = Math.max(0, Math.abs(s.cy + s.y - (wordRect.top + wh / 2)) - wh / 2);
    const want = finePointer && s.cy > 0 && s.cy + s.y < heroBottom ? clamp(1 - off / (wh * 0.7)) : 0;
    near = lerp(near, want, damp(s.dt, 6));
    const infl = letters.map((l, i) => {
      const cxL = wordRect.left + (i + 0.5) / n * wordRect.width;
      const d = (s.cx - cxL) / (wordRect.width / 4.2);
      return lerp(0.5 + 0.5 * Math.sin(s.t * 1.3 - i * 0.85), Math.exp(-d * d), near);
    });
    const mean = infl.reduce((a, b) => a + b, 0) / n;
    const amp = lerp(16, 62, near);
    letters.forEach((l, i) => {
      const started = s.t - introAt > 0.12 + i * 0.075;
      const dev = infl[i] - mean;
      const tw = started ? clamp(BASE_W + dev * amp, 50, 150) : 50;
      const tg = started ? clamp(860 + dev * 220, 520, 900) : 100;
      const k = damp(s.dt, started ? 6.5 : 20);
      l.w = lerp(l.w, tw, k);
      l.g = lerp(l.g, tg, k);
      setAxes(l);
    });
  });

  // ----- parallax leve no palco
  tasks.push(s => {
    if (!hero.__vis || reduce) return;
    heroStage.style.setProperty('--mx', (s.px - 0.5).toFixed(3));
    heroStage.style.setProperty('--my', (s.py - 0.5).toFixed(3));
  });

  // ----- troca de sabor
  const wipe = $('#hero-wipe');
  const flavorName = $('#flavor-name');
  const swatches = $$('#swatches button');
  function applyFlavorVars(f) {
    root.style.setProperty('--field', f.field);
    root.style.setProperty('--field-deep', f.deep);
    root.style.setProperty('--pop', f.pop);
  }
  function setFlavor(key, origin) {
    if (key === flavorKey || !FLAVORS[key]) return;
    const f = FLAVORS[key];
    flavorKey = key;
    swatches.forEach(b => b.setAttribute('aria-checked', String(b.dataset.flavor === key)));
    flavorName.textContent = f.nome;
    flavorName.classList.remove('is-swap');
    void flavorName.offsetWidth;
    flavorName.classList.add('is-swap');
    $$('.eyebrow', $('#formula')).forEach(e => { if (e.lastChild) e.lastChild.textContent = `Whey Isolado · ${f.nome}`; });
    root.style.setProperty('--on-field', f.onField);
    root.style.setProperty('--on-field-text', f.onText);

    const tex = heroTex(key);
    isoCardRefresh();
    if (reduce) {
      applyFlavorVars(f);
      heroTub.tex = storyTub.tex = tex;
      heroTub.render(); storyTub.render();
      return;
    }
    HT.pending = tex;
    HT.swapAt = S.t + 0.3;
    HT.target += TAU;

    const hr = hero.getBoundingClientRect();
    const or = origin ? origin.getBoundingClientRect() : null;
    const x = or ? or.left + or.width / 2 - hr.left : hr.width / 2;
    const y = or ? or.top + or.height / 2 - hr.top : hr.height / 2;
    const rad = Math.hypot(Math.max(x, hr.width - x), Math.max(y, hr.height - y)) + 20;
    wipe.style.background = f.field;
    wipe.getAnimations().forEach(a => a.cancel());
    const anim = wipe.animate(
      [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${rad}px at ${x}px ${y}px)` }],
      { duration: 800, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }
    );
    anim.onfinish = () => { applyFlavorVars(f); anim.cancel(); };
    setTimeout(() => { root.style.setProperty('--pop', f.pop); }, 260);

    const sr = heroStage.getBoundingClientRect();
    setTimeout(() => burst(sr.left + sr.width / 2 - hr.left, sr.top + sr.height * 0.5 - hr.top), 240);
  }
  swatches.forEach(b => b.addEventListener('click', () => setFlavor(b.dataset.flavor, b)));
  $('#swatches').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const i = swatches.findIndex(b => b.dataset.flavor === flavorKey);
    const dir = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
    const next = swatches[(i + dir + swatches.length) % swatches.length];
    next.focus();
    setFlavor(next.dataset.flavor, next);
  });

  /* ------------------------------------------------------------------------
     TÍTULOS CINÉTICOS — a largura da fonte cresce conforme a seção entra
     ------------------------------------------------------------------------ */

  const kin = $$('.kinetic').map(el => ({ el: watch(el), max: +(el.dataset.max || 112), cur: reduce ? null : 58, top: 0 }));
  function fitKinetic() {
    kin.forEach(k => {
      const el = k.el;
      el.style.fontSize = '';
      el.style.setProperty('--wdth', k.max);
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const avail = el.clientWidth;
      let widest = 0;
      $$('.line', el).forEach(l => { widest = Math.max(widest, l.offsetWidth); });
      if (widest > avail && avail > 0) el.style.fontSize = `${(fs * avail / widest * 0.985).toFixed(1)}px`;
      k.top = el.getBoundingClientRect().top + scrollY;
      if (k.cur !== null) el.style.setProperty('--wdth', k.cur.toFixed(1));
    });
  }
  measurers.push(fitKinetic);
  tasks.push(s => {
    if (reduce) return;
    for (const k of kin) {
      if (!k.el.__vis) continue;
      const p = clamp((s.y + s.vh - k.top) / (s.vh * 0.6));
      k.cur = lerp(k.cur, lerp(58, k.max, easeOut(p)), damp(s.dt, 8));
      k.el.style.setProperty('--wdth', k.cur.toFixed(1));
    }
  });

  // marca gigante do rodapé
  const footWord = watch($('#foot-word'));
  let footTop = 0, footH = 1, footCur = reduce ? 150 : 50;
  measurers.push(() => {
    footWord.style.setProperty('--wdth', 150);
    footWord.style.fontSize = '100px';
    const w = footWord.firstElementChild.getBoundingClientRect().width, avail = footWord.clientWidth;
    footWord.style.fontSize = '';
    if (w && avail) footWord.style.setProperty('--foot-size', `${(100 * avail / w * 0.995).toFixed(1)}px`);
    footWord.style.setProperty('--wdth', footCur);
    const fr = footWord.getBoundingClientRect();
    footTop = fr.top + scrollY;
    footH = fr.height;
  });
  tasks.push(s => {
    if (reduce || !footWord.__vis) return;
    const lead = s.vh * 0.22;
    const p = clamp((s.y + s.vh - footTop + lead) / (footH * 0.85 + lead));
    footCur = lerp(footCur, lerp(50, 150, easeOut(p)), damp(s.dt, 7));
    footWord.style.setProperty('--wdth', footCur.toFixed(1));
  });

  /* ------------------------------------------------------------------------
     MARQUEE — acelera e inclina com a velocidade do scroll
     ------------------------------------------------------------------------ */

  const track = $('#marquee');
  const marq = watch(track.parentElement);
  const seq = track.innerHTML;
  track.innerHTML = seq.repeat(6);
  let mHalf = 0, mX = 0, mDir = -1, mSkew = 0;
  measurers.push(() => { mHalf = track.scrollWidth / 6; });
  tasks.push(s => {
    if (reduce || !marq.__vis || !mHalf) return;
    if (Math.abs(s.v) > 30) mDir = s.v > 0 ? -1 : 1;
    mX += mDir * (70 + Math.min(Math.abs(s.v) * 0.5, 1400)) * s.dt;
    if (mX <= -mHalf) mX += mHalf;
    if (mX > 0) mX -= mHalf;
    mSkew = lerp(mSkew, clamp(-s.v * 0.012, -14, 14), damp(s.dt, 8));
    track.style.transform = `translate3d(${mX.toFixed(1)}px,0,0) skewX(${mSkew.toFixed(2)}deg)`;
  });

  /* ------------------------------------------------------------------------
     ANILHAS — rolam do lado esquerdo até a posição (rotação = distância ÷ raio)
     ------------------------------------------------------------------------ */

  const platesHost = watch($('#plates'));
  const plates = $$('.plate__disc', platesHost).map((el, i) => ({ el, i, cur: null, size: 0, left: 0, top: 0, col: 0 }));
  measurers.push(() => {
    const cols = innerWidth >= 860 ? 4 : 2;
    plates.forEach(p => {
      p.el.style.transform = '';
      const b = p.el.getBoundingClientRect();
      p.size = b.width; p.left = b.left; p.top = b.top + scrollY; p.col = p.i % cols;
      p.cur = null;
    });
  });
  tasks.push(s => {
    if (!platesHost.__vis) return;
    for (const p of plates) {
      if (!p.size) continue;
      const prog = clamp((s.y + s.vh - p.top - p.size * 0.15) / (s.vh * 0.62) - p.col * 0.09);
      const e = reduce ? 1 : easeOut(prog);
      const target = -(1 - e) * (p.left + p.size + 40);
      p.cur = p.cur === null ? target : lerp(p.cur, target, damp(s.dt, 9));
      const deg = p.cur / (p.size / 2) * 57.2958;
      p.el.style.transform = `translate3d(${p.cur.toFixed(1)}px,0,0) rotate(${deg.toFixed(1)}deg)`;
    }
  });

  /* ------------------------------------------------------------------------
     STORY — o pote fica fixo e gira até a face de cada passo
     ------------------------------------------------------------------------ */

  const story = $('#story');
  const steps = $$('.step', story);
  const storyFill = $('#story-fill');
  const storyDisc = $('#story-disc');
  let stTop = 0, stH = 1, stP = 0, stActive = -1;
  measurers.push(() => { const r = story.getBoundingClientRect(); stTop = r.top + scrollY; stH = r.height; });
  tasks.push(s => {
    if (!storyCanvas.__vis || !storyTub.tex) return;
    if (reduce) { if (stActive !== 0) { stActive = 0; storyTub.rot = 0; storyTub.render(); } return; }
    const p = clamp((s.y - stTop) / Math.max(1, stH - s.vh));
    stP = lerp(stP, p, damp(s.dt, 7));
    const idx = p < 0.25 ? 0 : p < 0.75 ? 1 : 2;
    if (idx !== stActive) {
      stActive = idx;
      steps.forEach((el, i) => { el.classList.toggle('is-active', i === idx); el.classList.toggle('is-past', i < idx); });
    }
    // patamares: o pote para em cada face e gira rápido entre elas
    const seg = Math.min(stP * 2, 1.9999);
    const k = Math.floor(seg);
    const e = smooth(clamp((seg - k - 0.34) / 0.32));
    const enter = clamp((s.y + s.vh - stTop) / s.vh);
    storyTub.rot = (k + e) * (TAU / 3) - (1 - easeOut(enter)) * 2.4 + Math.sin(s.t * 0.7) * 0.05;
    storyTub.render();
    storyFill.style.transform = `scaleY(${stP.toFixed(4)})`;
    storyDisc.style.setProperty('--s', (0.66 + 0.34 * easeOut(enter) + 0.06 * Math.sin(stP * TAU * 1.5)).toFixed(3));
  });

  /* ------------------------------------------------------------------------
     PRODUTOS — cartões, potes e inclinação 3D
     ------------------------------------------------------------------------ */

  const grid = $('#shop-grid');
  const cards = [];
  const plusSvg = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>';
  PRODUCTS.forEach((p, i) => {
    const el = document.createElement('article');
    el.className = 'card';
    el.dataset.reveal = '';
    el.style.setProperty('--d', `${(i % 3) * 0.09}s`);
    el.style.setProperty('--c', p.cor || 'var(--pop)');
    el.innerHTML = `
      <div class="card__stage" data-big="${p.bg}">
        <canvas class="tub" role="img" aria-label="Pote de ${p.nome}"></canvas>
        <span class="card__tag">${p.tag}</span>
      </div>
      <div class="card__body">
        <h3>${p.nome}</h3>
        <p class="card__meta">${p.meta}</p>
        <div class="card__foot">
          <span class="price">${brl.format(p.preco)}</span>
          <button type="button" class="btn-add" data-add="${p.id}" aria-label="Adicionar ${p.nome} ao carrinho">${plusSvg}<span>Adicionar</span></button>
        </div>
      </div>`;
    grid.appendChild(el);
    const tub = new Tub($('canvas', el), p.tub);
    const card = { p, el, tub, rot: (i * 0.09) * (TAU / 3), spin: 0, hover: false };
    cards.push(card);
    if (finePointer && !reduce) {
      el.addEventListener('pointerenter', () => { card.hover = true; card.spin += TAU / 3; });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 9}deg`);
        el.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 7}deg`);
      });
      el.addEventListener('pointerleave', () => { card.hover = false; el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    }
  });
  const cardTex = c => {
    const p = c.p;
    if (p.sabor) return makeLabel(isoLabel(FLAVORS[flavorKey]), 1280);
    return makeLabel({ ...p.label, ratio: p.tub.ratio, band: p.cor, bandInk: INK }, 1280);
  };
  function isoCardRefresh() {
    const c = cards.find(k => k.p.sabor);
    if (c && c.tub.tex) { c.tub.tex = cardTex(c); c.tub.render(); }
  }
  tasks.push(s => {
    for (const c of cards) {
      if (!c.tub.c.__vis || !c.tub.tex) continue;
      if (reduce) { if (c.drawn) continue; c.drawn = true; c.tub.rot = 0; c.tub.render(); continue; }
      c.spin = lerp(c.spin, 0, damp(s.dt, 2.2));
      c.rot += s.dt * 0.28;
      // fica mais tempo de frente: avança a rotação em "degraus" suaves
      const base = c.rot / (TAU / 3);
      const k = Math.floor(base), f = base - k;
      c.tub.rot = (k + smooth(clamp((f - 0.6) / 0.4))) * (TAU / 3) - c.spin;
      c.tub.render();
    }
  });

  /* ------------------------------------------------------------------------
     REVEAL, CONTADORES, BARRAS
     ------------------------------------------------------------------------ */

  $$('#amino li').forEach((li, i) => $('.bar i', li).style.setProperty('--i', i));
  const revealIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    $$('[data-count]', e.target).forEach(countUp);
    revealIO.unobserve(e.target);
  }), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach(el => revealIO.observe(el));

  function countUp(el) {
    const to = +el.dataset.count;
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1500;
    const step = now => {
      const k = clamp((now - t0) / dur);
      el.textContent = Math.round(to * easeOut(k));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------------
     CALCULADORA DE PROTEÍNA
     ------------------------------------------------------------------------ */

  const META = { manter: [1.2, 1.6], ganhar: [1.6, 2.2], definir: [1.8, 2.4] };
  const calcForm = $('#calc');
  const peso = $('#peso'), pesoOut = $('#peso-out');
  const calcMin = $('#calc-min'), calcMax = $('#calc-max'), calcNum = $('.calc__num');
  const calcBand = $('#calc-band'), calcDose = $('#calc-dose'), calcTxt = $('#calc-txt');
  const SCALE = 400;
  const shown = { lo: 120, hi: 165 };
  let goal = { lo: 120, hi: 165 };
  const fmtK = n => String(n).replace('.', ',');
  function calcUpdate() {
    const kg = +peso.value;
    const meta = (calcForm.querySelector('input[name="meta"]:checked') || {}).value || 'ganhar';
    const [a, b] = META[meta];
    goal = { lo: Math.round(kg * a), hi: Math.round(kg * b) };
    pesoOut.textContent = `${kg} kg`;
    peso.style.setProperty('--p', ((kg - 40) / 100).toFixed(3));
    calcBand.style.left = `${goal.lo / SCALE * 100}%`;
    calcBand.style.width = `${(goal.hi - goal.lo) / SCALE * 100}%`;
    calcDose.style.width = `${25 / SCALE * 100}%`;
    calcNum.style.setProperty('--calc-g', Math.round(lerp(420, 900, (kg - 40) / 100)));
    calcTxt.textContent = `De ${fmtK(a)} a ${fmtK(b)} g por quilo. Uma dose de Whey Isolado cobre ${Math.round(25 / goal.lo * 100)}% do seu mínimo.`;
    if (reduce) { shown.lo = goal.lo; shown.hi = goal.hi; calcMin.textContent = goal.lo; calcMax.textContent = goal.hi; }
  }
  calcForm.addEventListener('input', calcUpdate);
  calcForm.addEventListener('submit', e => e.preventDefault());
  tasks.push(s => {
    if (reduce) return;
    if (Math.abs(shown.lo - goal.lo) < 0.5 && Math.abs(shown.hi - goal.hi) < 0.5) return;
    const k = damp(s.dt, 12);
    shown.lo = lerp(shown.lo, goal.lo, k);
    shown.hi = lerp(shown.hi, goal.hi, k);
    calcMin.textContent = Math.round(shown.lo);
    calcMax.textContent = Math.round(shown.hi);
  });
  calcUpdate();

  /* ------------------------------------------------------------------------
     DÚVIDAS
     ------------------------------------------------------------------------ */

  $$('#faq .faq__item').forEach(item => {
    const btn = $('button', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ------------------------------------------------------------------------
     CARRINHO
     ------------------------------------------------------------------------ */

  const cartEl = $('#cart'), cartItems = $('#cart-items'), cartEmpty = $('#cart-empty');
  const cartTotal = $('#cart-total'), cartCount = $('#cart-count'), cartOpenBtn = $('#cart-open');
  const checkout = $('#checkout'), cartNote = $('#cart-note'), toast = $('#toast');
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('vulka-cart') || '{}') || {}; } catch (_) { cart = {}; }
  const save = () => { try { localStorage.setItem('vulka-cart', JSON.stringify(cart)); } catch (_) {} };
  const byId = id => PRODUCTS.find(p => p.id === id);

  function lineInfo(key) {
    const [id, sabor] = key.split('|');
    const p = byId(id);
    if (!p) return null;
    const f = sabor && FLAVORS[sabor];
    return { p, key, nome: p.nome, sub: f ? `${f.nome} · ${p.meta.split(' · ')[0]}` : p.meta.split(' · ').slice(0, 2).join(' · '), cor: f ? f.pop : p.cor };
  }
  function renderCart() {
    const keys = Object.keys(cart).filter(k => cart[k] > 0 && lineInfo(k));
    let total = 0, count = 0;
    cartItems.innerHTML = keys.map(k => {
      const l = lineInfo(k), q = cart[k];
      total += l.p.preco * q; count += q;
      return `<li>
        <span class="cart__dot" style="--c:${l.cor}"></span>
        <div><h3>${l.nome}</h3><p>${l.sub}</p>
          <div class="cart__qty"><button type="button" data-qty="-1" data-key="${k}" aria-label="Diminuir ${l.nome}">−</button><span>${q}</span><button type="button" data-qty="1" data-key="${k}" aria-label="Aumentar ${l.nome}">+</button></div>
        </div>
        <span class="cart__line">${brl.format(l.p.preco * q)}</span>
      </li>`;
    }).join('');
    cartEmpty.hidden = keys.length > 0;
    cartTotal.textContent = brl.format(total);
    cartCount.textContent = count;
    checkout.disabled = keys.length === 0;
    cartOpenBtn.setAttribute('aria-label', `Abrir carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`);
    if (!keys.length) cartNote.hidden = true;
  }
  cartItems.addEventListener('click', e => {
    const b = e.target.closest('[data-qty]');
    if (!b) return;
    const k = b.dataset.key;
    cart[k] = (cart[k] || 0) + +b.dataset.qty;
    if (cart[k] <= 0) delete cart[k];
    save(); renderCart();
  });

  let toastT;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 2200);
  }
  function fly(from) {
    if (reduce || !from.animate) return;
    const a = from.getBoundingClientRect(), b = cartOpenBtn.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'fly';
    document.body.appendChild(dot);
    const x0 = a.left + a.width / 2 - 11, y0 = a.top + a.height / 2 - 11;
    const x1 = b.left + b.width / 2 - 11, y1 = b.top + b.height / 2 - 11;
    const lift = Math.min(y0, y1) - 90;
    dot.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.4) rotate(0deg)`, offset: 0 },
      { transform: `translate(${(x0 + x1) / 2}px,${lift}px) scale(1.5) rotate(360deg)`, offset: 0.5, easing: 'cubic-bezier(.5,0,.8,.6)' },
      { transform: `translate(${x1}px,${y1}px) scale(.3) rotate(720deg)`, offset: 1 },
    ], { duration: 850, easing: 'cubic-bezier(.2,.6,.3,1)' }).onfinish = () => dot.remove();
  }
  function add(id, from) {
    const p = byId(id);
    if (!p) return;
    const key = p.sabor ? `${id}|${flavorKey}` : id;
    cart[key] = (cart[key] || 0) + 1;
    save();
    if (from) fly(from);
    setTimeout(() => {
      renderCart();
      cartCount.classList.remove('is-bump');
      void cartCount.offsetWidth;
      cartCount.classList.add('is-bump');
    }, reduce || !from ? 0 : 700);
    say(`${p.nome}${p.sabor ? ' ' + FLAVORS[flavorKey].nome : ''} no carrinho`);
    $('#nav').classList.remove('is-hidden');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (b) add(b.dataset.add, b);
  });

  let lastFocus = null;
  function openCart(open) {
    cartEl.classList.toggle('is-open', open);
    cartEl.inert = !open;
    $$('main, .foot, #nav').forEach(el => { el.inert = open; });
    if (open) {
      lastFocus = document.activeElement;
      setTimeout(() => $('.cart__close', cartEl).focus(), 60);
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus();
    }
  }
  cartOpenBtn.addEventListener('click', () => openCart(true));
  $$('[data-close]', cartEl).forEach(el => el.addEventListener('click', () => openCart(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { openCart(false); toggleMenu(false); } });

  checkout.addEventListener('click', () => {
    const keys = Object.keys(cart).filter(k => cart[k] > 0 && lineInfo(k));
    if (!keys.length) return;
    let total = 0;
    const lines = keys.map(k => {
      const l = lineInfo(k);
      total += l.p.preco * cart[k];
      return `${cart[k]}x ${l.nome} (${l.sub})`;
    });
    if (CONFIG.whatsapp) {
      const msg = `Olá! Quero fazer este pedido na ${CONFIG.marca}:\n${lines.join('\n')}\nTotal: ${brl.format(total)}`;
      const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
      cartNote.innerHTML = `Seu pedido está pronto. <a href="${url}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a>`;
    } else {
      cartNote.textContent = 'Checkout de demonstração: nenhum pagamento foi feito. Para receber pedidos, informe o WhatsApp da loja em js/app.js ou conecte um gateway de pagamento.';
    }
    cartNote.hidden = false;
  });
  renderCart();

  /* ------------------------------------------------------------------------
     NAV, ÂNCORAS, BOTÕES MAGNÉTICOS
     ------------------------------------------------------------------------ */

  const nav = $('#nav'), navProgress = $('#nav-progress');
  const menuBtn = $('#menu-btn'), menuPanel = $('#menu-panel');
  function toggleMenu(open) {
    menuPanel.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Fechar' : 'Menu';
  }
  menuBtn.addEventListener('click', () => toggleMenu(menuPanel.hidden));

  let navY = window.scrollY, docH = 1;
  measurers.push(() => { docH = Math.max(1, document.documentElement.scrollHeight - innerHeight); });
  tasks.push(s => {
    navProgress.style.transform = `scaleX(${clamp(s.y / docH).toFixed(4)})`;
    const d = s.y - navY;
    if (Math.abs(d) > 8) {
      if (menuPanel.hidden) nav.classList.toggle('is-hidden', d > 0 && s.y > 320);
      navY = s.y;
    }
  });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    toggleMenu(false);
    const y = target.id === 'topo' ? 0 : target.getBoundingClientRect().top + window.scrollY - (target.classList.contains('sec') ? 0 : 20);
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  });

  if (finePointer && !reduce) {
    $$('.magnetic').forEach(el => {
      const inner = $('.btn__in', el);
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${(dx * 0.18).toFixed(1)}px, ${(dy * 0.3).toFixed(1)}px)`;
        if (inner) inner.style.transform = `translate(${(dx * 0.1).toFixed(1)}px, ${(dy * 0.16).toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; if (inner) inner.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------------------
     LOOP, MEDIDAS, PARTIDA
     ------------------------------------------------------------------------ */

  window.addEventListener('pointermove', e => {
    S.cx = e.clientX; S.cy = e.clientY;
    S.px = e.clientX / innerWidth; S.py = e.clientY / innerHeight;
  }, { passive: true });

  function measure() {
    S.vw = innerWidth; S.vh = innerHeight;
    measurers.forEach(f => f());
  }
  let rT;
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 120); });
  window.addEventListener('load', measure);

  let last = performance.now(), lastY = window.scrollY;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const y = window.scrollY;
    S.v = lerp(S.v, (y - lastY) / dt, 0.14);
    lastY = y;
    S.y = y; S.t = now / 1000; S.dt = dt;
    for (const f of tasks) f(S);
    requestAnimationFrame(frame);
  }

  function buildTextures() {
    Object.keys(TEX).forEach(k => delete TEX[k]);
    heroTub.tex = storyTub.tex = heroTex(flavorKey);
    cards.forEach(c => { c.tub.tex = cardTex(c); c.drawn = false; });
    heroTub.render(); storyTub.render();
    cards.forEach(c => c.tub.render());
  }

  measure();
  requestAnimationFrame(frame);

  let fontsOk = false;
  fontsReady.then(() => { fontsOk = true; });
  const start = () => { buildTextures(); measure(); heroStage.classList.add('is-ready'); };
  Promise.race([fontsReady, timeout(1800)]).then(() => {
    const complete = fontsOk;
    start();
    if (!complete) fontsReady.then(start);   // fontes chegaram depois: redesenha os rótulos
  });
})();
