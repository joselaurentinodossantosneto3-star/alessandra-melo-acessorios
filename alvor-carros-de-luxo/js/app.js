/* ==========================================================================
   Alvor Motors — palco 3D, passagem do dia, showroom e catálogo
   Depende de js/vendor/three.min.js (r128) e de js/car.js.
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
    loja: 'Alvor Motors',
    // WhatsApp que recebe os pedidos de visita: só números, com DDI e DDD. Ex.: '5511999999999'.
    // Vazio = o formulário só oferece "Copiar pedido".
    whatsapp: '',
    // id do carro que abre a página e aparece nos capítulos
    destaque: '911-carrera',
  };

  // Estoque. "preset" escolhe a carroceria 3D (coupe911, suv ou fastback); "tags" alimenta os filtros.
  // Potência, 0 a 100 e máxima são os dados de catálogo do fabricante para a versão e o ano.
  const CATALOG = [
    { id: '911-carrera', nome: '911 Carrera', tipo: '911 · Cupê', ano: 2022, km: 14800, preset: 'coupe911', cor: { nome: 'Azul-escuro', hex: 0x14274a }, cv: 385, zero: '4,2', vmax: 293, motor: '3.0 boxer biturbo, 6 cilindros', tracao: 'Traseira', energia: 'Gasolina', preco: 895000, tags: ['911'] },
    { id: '911-carrera-s', nome: '911 Carrera S', tipo: '911 · Cupê', ano: 2021, km: 22300, preset: 'coupe911', cor: { nome: 'Vermelho', hex: 0xa3121b, solid: true }, cv: 450, zero: '3,7', vmax: 308, motor: '3.0 boxer biturbo, 6 cilindros', tracao: 'Traseira', energia: 'Gasolina', preco: 985000, tags: ['911'] },
    { id: '911-turbo-s', nome: '911 Turbo S', tipo: '911 · Cupê', ano: 2022, km: 9600, preset: 'coupe911', cor: { nome: 'Prata', hex: 0x858a90 }, cv: 650, zero: '2,7', vmax: 330, motor: '3.8 boxer biturbo, 6 cilindros', tracao: 'Integral', energia: 'Gasolina', preco: 1790000, tags: ['911'] },
    { id: '911-gt3', nome: '911 GT3', tipo: '911 · Cupê', ano: 2022, km: 6200, preset: 'coupe911', wing: true, cor: { nome: 'Amarelo', hex: 0xdba300, solid: true }, cv: 510, zero: '3,4', vmax: 318, motor: '4.0 boxer aspirado, 6 cilindros', tracao: 'Traseira', energia: 'Gasolina', preco: 1650000, tags: ['911'] },
    { id: 'cayenne-coupe', nome: 'Cayenne Coupé', tipo: 'SUV cupê', ano: 2021, km: 31500, preset: 'suv', cor: { nome: 'Branco', hex: 0xdfe1e3, solid: true }, cv: 340, zero: '6,0', vmax: 243, motor: '3.0 V6 turbo', tracao: 'Integral', energia: 'Gasolina', preco: 598000, tags: ['suv'] },
    { id: 'cayenne-s-coupe', nome: 'Cayenne S Coupé', tipo: 'SUV cupê', ano: 2022, km: 18900, preset: 'suv', cor: { nome: 'Grafite', hex: 0x30343a }, cv: 440, zero: '5,0', vmax: 263, motor: '2.9 V6 biturbo', tracao: 'Integral', energia: 'Gasolina', preco: 728000, tags: ['suv'] },
    { id: 'panamera-4s-e-hybrid', nome: 'Panamera 4S E-Hybrid', tipo: 'Quatro portas', ano: 2021, km: 26400, preset: 'fastback', cor: { nome: 'Verde-escuro', hex: 0x1c3a2f }, cv: 560, zero: '3,7', vmax: 298, motor: '2.9 V6 biturbo + motor elétrico', tracao: 'Integral', energia: 'Híbrido plug-in', preco: 845000, tags: ['4p', 'eletrificado'] },
    { id: 'taycan-4s', nome: 'Taycan 4S', tipo: 'Quatro portas', ano: 2021, km: 19700, preset: 'fastback', exhaust: false, cor: { nome: 'Cinza-giz', hex: 0xc9cac6, solid: true }, cv: 530, zero: '4,0', vmax: 250, motor: 'Dois motores elétricos', tracao: 'Integral', energia: 'Elétrico', preco: 618000, tags: ['4p', 'eletrificado'] },
  ];
  const FILTERS = [
    { id: 'todos', nome: 'Todos' },
    { id: '911', nome: '911' },
    { id: 'suv', nome: 'SUV' },
    { id: '4p', nome: 'Quatro portas' },
    { id: 'eletrificado', nome: 'Eletrificados' },
  ];

  /* ------------------------------------------------------------------------
     O DIA — cada capítulo tem uma hora, uma luz e um enquadramento
     ------------------------------------------------------------------------ */

  const rgbOf = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  // top/hor: céu no alto e no horizonte · sunY: altura do sol sobre o horizonte (em alturas de tela)
  // exp: exposição · env: reflexos do estúdio · key: luz direcional · night: faróis em destaque
  const SCENES = {
    alvor:   { hora: 6.2,   nome: 'Alvor',  top: rgbOf(0xC7CFD6), hor: rgbOf(0xF1DCC6), ground: rgbOf(0xD8D5CF), sun: rgbOf(0xF3B585), sunA: 1,   sunX: 0.64, sunY: 0.07,  sunS: 0.46, exp: 0.95, env: 1.0,  key: 1.5,  keyCol: rgbOf(0xFFE4C8), night: 0,   dark: 0, clock: 1 },
    dia:     { hora: 10,    nome: 'Manhã',  top: rgbOf(0xD9E1E6), hor: rgbOf(0xECEDE8), ground: rgbOf(0xE2E1DC), sun: rgbOf(0xFFF4D8), sunA: 0.9, sunX: 0.82, sunY: 0.3,   sunS: 0.16, exp: 1.02, env: 1.0,  key: 1.6,  keyCol: rgbOf(0xFFFFFF), night: 0,   dark: 0, clock: 1 },
    tarde:   { hora: 16,    nome: 'Tarde',  top: rgbOf(0xD6D0C4), hor: rgbOf(0xF2DFBA), ground: rgbOf(0xDBD4C6), sun: rgbOf(0xF5C56B), sunA: 1,   sunX: 0.8,  sunY: 0.16,  sunS: 0.3,  exp: 1.0,  env: 1.0,  key: 1.6,  keyCol: rgbOf(0xFFDCA6), night: 0,   dark: 0, clock: 1 },
    poente:  { hora: 18.78, nome: 'Poente', top: rgbOf(0x22233A), hor: rgbOf(0xC65A3C), ground: rgbOf(0x29232E), sun: rgbOf(0xF0623C), sunA: 1,   sunX: 0.3,  sunY: 0.02,  sunS: 0.5,  exp: 0.6,  env: 0.6,  key: 0.7,  keyCol: rgbOf(0xFF9A66), night: 0.4, dark: 1, clock: 1 },
    noite:   { hora: 22,    nome: 'Noite',  top: rgbOf(0x04050A), hor: rgbOf(0x0D1220), ground: rgbOf(0x07080C), sun: rgbOf(0x0D1220), sunA: 0,   sunX: 0.7,  sunY: -0.3,  sunS: 0.4,  exp: 0.4,  env: 0.5,  key: 0.12, keyCol: rgbOf(0xBFD0FF), night: 1,   dark: 1, clock: 1 },
    estudio: { hora: 22,    nome: 'Showroom', top: rgbOf(0xE5E4DF), hor: rgbOf(0xE5E4DF), ground: rgbOf(0xDAD9D3), sun: rgbOf(0xE5E4DF), sunA: 0, sunX: 0.5,  sunY: 0.2,   sunS: 0.2,  exp: 1.04, env: 1.0,  key: 1.5,  keyCol: rgbOf(0xFFFFFF), night: 0,   dark: 0, clock: 0 },
  };
  // az: ângulo da câmera a partir da frente do carro · el: elevação · fit: fração da largura que o carro ocupa
  // sx/sy: desloca o carro no quadro (frações da tela) · speed: velocidade das rodas em m/s
  // Cada chave tem a versão larga (d) e a de tela em pé (m).
  const KEYS = {
    alvor:   { d: { az: 38,  el: 4,  fit: 0.46, sx: 0.07,  sy: 0.05 },  m: { az: 30,  el: 5,  fit: 0.9,  sx: 0,    sy: -0.07 }, speed: 0 },
    dia:     { d: { az: 90,  el: 2.5, fit: 0.5, sx: 0.2,   sy: 0.12 },  m: { az: 90,  el: 4,  fit: 0.94, sx: 0,    sy: 0.27 },  speed: 0 },
    tarde:   { d: { az: 26,  el: 4,  fit: 0.46, sx: 0.2,   sy: 0.06 },  m: { az: 22,  el: 6,  fit: 0.86, sx: 0,    sy: 0.22 },  speed: 22 },
    poente:  { d: { az: 150, el: 8,  fit: 0.46, sx: -0.2,  sy: 0.08 },  m: { az: 156, el: 9,  fit: 0.9,  sx: 0,    sy: 0.31 },  speed: 0 },
    noite:   { d: { az: 22,  el: 6,  fit: 0.44, sx: 0.2,   sy: 0.05 },  m: { az: 16,  el: 7,  fit: 0.84, sx: 0,    sy: 0.2 },   speed: 0 },
    estudio: { d: { az: 40,  el: 8,  fit: 0.48, sx: -0.16, sy: -0.03 }, m: { az: 36,  el: 9,  fit: 0.94, sx: 0,    sy: -0.25 }, speed: 0 },
  };

  /* ------------------------------------------------------------------------
     UTILITÁRIOS
     ------------------------------------------------------------------------ */

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
  const damp = (dt, k) => 1 - Math.exp(-dt * k);
  const css = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const hex6 = h => '#' + h.toString(16).padStart(6, '0');
  const money = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const km = v => v.toLocaleString('pt-BR') + ' km';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEG = Math.PI / 180;
  const byId = id => CATALOG.find(c => c.id === id);
  const FEATURED = byId(CONFIG.destaque) || CATALOG[0];

  function blend(a, b, t) {                               // mistura dois objetos numéricos / de cor
    const o = {};
    for (const k in a) {
      const x = a[k], y = b[k];
      if (Array.isArray(x)) o[k] = [lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)];
      else if (typeof x === 'number') o[k] = lerp(x, y, t);
      else o[k] = t < 0.5 ? x : y;
    }
    return o;
  }

  const stage = $('#stage'), exp = $('#exp'), nav = $('#nav');
  const S = { y: window.scrollY, t: 0, dt: 0.016, vw: innerWidth, vh: innerHeight };
  const T = window.THREE, Car = window.AlvorCar;

  /* ------------------------------------------------------------------------
     SILHUETA — vista lateral em SVG, feita com as mesmas curvas do modelo 3D.
     Todas usam o mesmo quadro, então os carros aparecem em escala entre si.
     ------------------------------------------------------------------------ */

  function silhouette(item) {
    if (!Car) return '';
    const P = Car.preset(item.preset), D = Car.dims(item.preset), f = n => n.toFixed(3);
    const up = x => Math.max(P.yTop(x), P.ySh(x) + P.fender(x));
    let top = '';
    for (let i = 0; i <= 110; i++) { const x = -D.half + D.length * i / 110; top += `${i ? 'L' : 'M'}${f(x)} ${f(-up(x))}`; }
    const arch = ax => { const dy = D.wheelR - P.yBot(ax), dx = Math.sqrt(Math.max(0, D.archR * D.archR - dy * dy)); return { x0: ax - dx, x1: ax + dx, y: -P.yBot(ax) }; };
    const aF = arch(D.axleF), aR = arch(D.axleR);
    const seg = (x0, x1) => { let s = ''; for (let i = 0; i <= 20; i++) { const x = x0 + (x1 - x0) * i / 20; s += `L${f(x)} ${f(-P.yBot(x))}`; } return s; };
    const body = top + seg(D.half, aR.x1) + `A${D.archR} ${D.archR} 0 1 0 ${f(aR.x0)} ${f(aR.y)}` + seg(aR.x0, aF.x1) + `A${D.archR} ${D.archR} 0 1 0 ${f(aF.x0)} ${f(aF.y)}` + seg(aF.x0, -D.half) + 'Z';

    const [g0, g1] = P.sideGlass, rk = P.rake || [0, 0];
    let glass = '';
    for (let i = 0; i <= 24; i++) { const x = g0 + (g1 - g0) * i / 24; glass += `${i ? 'L' : 'M'}${f(x)} ${f(-(P.ySh(x) + 0.04))}`; }
    for (let i = 24; i >= 0; i--) { const x = g0 + rk[0] + (g1 - rk[1] - g0 - rk[0]) * i / 24; glass += `L${f(x)} ${f(-(P.yTop(x) - 0.085))}`; }
    const pillars = P.pillars.map(px => `<path class="body" style="stroke:none" d="M${f(px - 0.025)} ${f(-(P.ySh(px) + 0.04))}L${f(px + 0.025)} ${f(-(P.ySh(px) + 0.04))}L${f(px + 0.025)} ${f(-(P.yTop(px) - 0.08))}L${f(px - 0.025)} ${f(-(P.yTop(px) - 0.08))}Z"/>`).join('');
    const seams = P.seams.map(sx => `<path class="line" d="M${f(sx)} ${f(-(P.ySh(sx) + 0.02))}L${f(sx - 0.03)} ${f(-(P.yBot(sx) + 0.12))}"/>`).join('');
    const sill = `<path class="shade" d="M${f(aF.x1)} ${f(-P.yBot(0))}L${f(aR.x0)} ${f(-P.yBot(0))}L${f(aR.x0 - 0.02)} ${f(-(P.yBot(0) + 0.1))}L${f(aF.x1 + 0.02)} ${f(-(P.yBot(0) + 0.1))}Z"/>`;
    const wheel = ax => {
      const r = D.wheelR, cy = -r;
      let sp = '';
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; sp += `M${f(ax)} ${f(cy)}L${f(ax + Math.cos(a) * r * 0.6)} ${f(cy + Math.sin(a) * r * 0.6)}`; }
      return `<circle class="tyre" cx="${ax}" cy="${f(cy)}" r="${r}"/><circle class="rim" cx="${ax}" cy="${f(cy)}" r="${f(r * 0.68)}"/><path class="spokes" d="${sp}"/><circle class="hub" cx="${ax}" cy="${f(cy)}" r="${f(r * 0.13)}"/>`;
    };
    const lx = P.lampX !== undefined ? P.lampX : -D.half + 0.3;
    const lamp = `<ellipse class="lamp" cx="${f(lx + 0.03)}" cy="${f(-(up(lx + 0.03) - 0.05))}" rx="0.12" ry="0.036" transform="rotate(${f(-Math.atan2(up(lx + 0.15) - up(lx - 0.09), 0.24) / DEG)} ${f(lx + 0.03)} ${f(-(up(lx + 0.03) - 0.05))})"/>`;
    const tx = D.half - 0.05, tail = `<path class="tail" d="M${f(tx - 0.22)} ${f(-(P.ySh(tx - 0.22) - 0.03))}L${f(tx)} ${f(-(P.ySh(tx) - 0.05))}"/>`;
    let wing = '';
    if (item.wing) { const wx = D.half - 0.42, wy = P.yTop(wx) + 0.17; wing = `<path class="wing" d="M${f(wx - 0.16)} ${f(-wy - 0.02)}L${f(wx + 0.16)} ${f(-wy + 0.012)}L${f(wx + 0.16)} ${f(-wy + 0.04)}L${f(wx - 0.16)} ${f(-wy + 0.01)}Z"/><path class="line" style="stroke-width:.03" d="M${f(wx - 0.02)} ${f(-wy + 0.02)}L${f(wx)} ${f(-P.yTop(wx) + 0.01)}"/>`; }
    return `<svg class="sil" viewBox="-2.75 -1.94 5.5 2.04" style="--car:${hex6(item.cor.hex)}" aria-hidden="true" focusable="false">
      <ellipse class="ground" cx="0" cy="0.03" rx="${f(D.half * 1.03)}" ry="0.05"/>
      ${wing}<path class="body" d="${body}"/>${sill}<path class="glass" d="${glass}Z"/>${pillars}${seams}${lamp}${tail}
      ${wheel(D.axleF)}${wheel(D.axleR)}
    </svg>`;
  }

  /* ------------------------------------------------------------------------
     LINHA DO TEMPO — o scroll diz em que hora do dia estamos
     ------------------------------------------------------------------------ */

  const chapters = $$('[data-key]', exp).map(el => ({ el, key: el.dataset.key, a: 0, b: 0 }));
  let expBottom = 0, catTop = 0, visitTop = 0;
  function measureTimeline() {
    S.vw = innerWidth; S.vh = innerHeight;
    chapters.forEach((c, i) => {
      const r = c.el.getBoundingClientRect(), top = r.top + scrollY, bot = top + r.height;
      // [a, b]: faixa do scroll (medida no centro da tela) em que o capítulo vale por inteiro
      if (i === 0) { c.a = -1e9; c.b = top + S.vh * 0.62; }
      else if (i === chapters.length - 1) { c.a = top + S.vh * 0.42; c.b = 1e9; }
      else { c.a = top + S.vh * 0.55; c.b = Math.max(c.a + 10, bot - S.vh * 0.55); }
    });
    expBottom = exp.getBoundingClientRect().bottom + scrollY;
    catTop = $('#catalogo').getBoundingClientRect().top + scrollY;
    visitTop = $('#visita').getBoundingClientRect().top + scrollY;
  }
  function whereAt(yc) {                                  // { i, j, f }: entre os capítulos i e j, na fração f
    for (let i = 0; i < chapters.length; i++) {
      const c = chapters[i];
      if (yc <= c.b) {
        if (yc >= c.a || i === 0) return { i, j: i, f: 0 };
        const p = chapters[i - 1];
        return { i: i - 1, j: i, f: sstep((yc - p.b) / (c.a - p.b)) };
      }
    }
    const n = chapters.length - 1;
    return { i: n, j: n, f: 0 };
  }
  const wide = () => S.vw / S.vh > 0.9;
  const keyOf = k => Object.assign({ speed: KEYS[k].speed }, wide() ? KEYS[k].d : KEYS[k].m);

  /* ------------------------------------------------------------------------
     CENA 3D
     ------------------------------------------------------------------------ */

  let gl = null;                                          // tudo da cena, se o WebGL estiver disponível
  const rigs = {};                                        // um conjunto (carro + reflexo + sombra) por carroceria
  const showing = { target: null, rig: null };
  let swap = null;                                        // troca em andamento: um carro sai, o outro entra
  const OUT = 0.5, IN = 0.85, FAR = 11;

  function initScene() {
    const canvas = $('#scene');
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    const pr = Math.min(window.devicePixelRatio || 1, Math.min(innerWidth, innerHeight) < 700 ? 1.6 : 2);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(28, 1, 0.1, 200);

    // Estúdio para os reflexos: um teto de luz difusa e duas barras longas que riscam o ombro do carro.
    const envScene = new T.Scene();
    envScene.background = new T.Color(0x0b0c0d);
    const card = (w, h, x, y, z, rx, ry, k) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(k, k, k), side: T.DoubleSide }));
      m.position.set(x, y, z); m.rotation.set(rx, ry, 0); envScene.add(m);
    };
    card(13, 5.5, 0, 7, 0, Math.PI / 2, 0, 2.2);
    card(20, 0.5, 0, 3.4, 5.4, Math.PI / 2.9, 0, 11); card(20, 0.5, 0, 3.4, -5.4, -Math.PI / 2.9, 0, 11);
    card(30, 2.6, 0, 1.0, 13, 0, 0, 0.55); card(30, 2.6, 0, 1.0, -13, 0, 0, 0.55);
    card(30, 2.6, 14, 1.0, 0, 0, Math.PI / 2, 0.45); card(30, 2.6, -14, 1.0, 0, 0, Math.PI / 2, 0.8);
    const envFloor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshBasicMaterial({ color: new T.Color(0.2, 0.2, 0.2) }));
    envFloor.rotation.x = -Math.PI / 2; envFloor.position.y = -0.02; envScene.add(envFloor);
    const pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(envScene, 0.02).texture;
    pm.dispose();

    const key = new T.DirectionalLight(0xffffff, 1.5); key.position.set(-4, 7, 5); scene.add(key);
    const hemi = new T.HemisphereLight(0xffffff, 0x8a8a86, 0.55); scene.add(hemi);

    const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return new T.CanvasTexture(c); };
    // Piso: a mesma cor do chão do fundo, sumindo nas bordas. Meio transparente para deixar ver o reflexo.
    const fade = tex(512, 512, (g, w) => {
      // queda radial com ruído: sem o ruído, o degradê em tons escuros aparece em anéis
      const img = g.createImageData(w, w), d = img.data, c = w / 2;
      for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
        const r = Math.hypot(x - c, y - c) / c;
        const k = r < 0.14 ? 1 : 1 - Math.pow(clamp((r - 0.14) / 0.86), 1.6);
        const v = clamp(k * 255 + (Math.random() - 0.5) * 5, 0, 255), o = (y * w + x) * 4;
        d[o] = d[o + 1] = d[o + 2] = v; d[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
    const floorMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.87, alphaMap: fade, toneMapped: false, depthWrite: false });
    const floor = new T.Mesh(new T.CircleGeometry(22, 64), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.renderOrder = 1; scene.add(floor);

    const shadowTex = tex(512, 256, (g, w, h) => {
      g.translate(w / 2, h / 2); g.scale(1, h / w);
      const gr = g.createRadialGradient(0, 0, w * 0.04, 0, 0, w / 2);
      gr.addColorStop(0, 'rgba(0,0,0,.78)'); gr.addColorStop(0.5, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(-w / 2, -w / 2, w, w);
    });
    const shadowMat = new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false });

    // Riscos de velocidade no piso (capítulo de desempenho)
    const streakMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const streaks = [];
    for (let i = 0; i < 18; i++) {
      const m = new T.Mesh(new T.PlaneGeometry(2 + Math.random() * 6, 0.012 + Math.random() * 0.03), streakMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(-14 + Math.random() * 28, 0.003, (1.4 + Math.random() * 5.5) * (i % 2 ? 1 : -1)); m.renderOrder = 2;
      scene.add(m); streaks.push(m);
    }

    // Clarão dos faróis e da barra traseira à noite
    const glowTex = tex(256, 64, (g, w, h) => {
      g.translate(w / 2, h / 2); g.scale(1, h / w);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.3, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(-w / 2, -w / 2, w, w);
    });
    const glow = (color, sx, sy) => {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, blending: T.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false }));
      sp.scale.set(sx, sy, 1); scene.add(sp); return sp;
    };
    gl = {
      renderer, scene, camera, key, hemi, floorMat, shadowMat, streakMat, streaks, pr,
      glowF: [glow(new T.Color(0xfff2dc), 1.5, 0.8), glow(new T.Color(0xfff2dc), 1.5, 0.8)], glowR: glow(new T.Color(0xff2020), 3.4, 0.8),
      tmp: new T.Vector3(), dir: new T.Vector3(),
    };
    resizeScene();
  }

  function resizeScene() {
    if (!gl) return;
    gl.renderer.setPixelRatio(gl.pr);
    gl.renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  }

  // Cada carroceria é construída uma vez e reaproveitada: trocar de versão só muda a pintura.
  function rigFor(item) {
    const id = item.preset + (item.wing ? '+asa' : '') + (item.exhaust === false ? '-sem-escape' : '');
    if (rigs[id]) return rigs[id];
    const car = Car.build(item.preset, { color: item.cor.hex, wing: !!item.wing, exhaust: item.exhaust !== false });
    const rig = new T.Group();
    const shadow = new T.Mesh(new T.PlaneGeometry(car.dims.length * 1.34, car.dims.width * 1.7), gl.shadowMat);
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.004; shadow.renderOrder = 2;
    rig.add(car.mirror, car.group, shadow);
    rig.visible = false;
    gl.scene.add(rig);
    const envMats = Object.values(car.mats).filter(m => 'envMapIntensity' in m).map(m => ({ m, base: m.envMapIntensity }));
    return (rigs[id] = { id, car, rig, envMats, x: 0 });
  }
  function activate(r, item) {
    r.rig.visible = true;
    r.car.setColor(item.cor.hex);
    r.car.setFinish(!!item.cor.solid);
  }
  function present(item) {
    showing.target = item;
    if (!gl) { $('#fallback').innerHTML = silhouette(item); return; }     // sem WebGL: troca a silhueta
    const into = rigFor(item);
    if (!showing.rig || reduce) {
      if (showing.rig && showing.rig !== into) showing.rig.rig.visible = false;
      activate(into, item); into.x = 0; showing.rig = into; swap = null;
      return;
    }
    swap = { out: showing.rig, x0: showing.rig.x, into, item, t0: S.t, t1: 0, switched: false };
  }

  /* ------------------------------------------------------------------------
     ESTADO POR FRAME
     ------------------------------------------------------------------------ */

  const cur = { cam: null, sc: null, dims: null };        // enquadramento, luz e medidas suavizados
  const orbit = { az: 0, el: 0, drag: false, lastX: 0, lastY: 0, idle: 0 };
  const light = { t0: -10, armed: true };                 // animação dos faróis
  let introAt = null, wheelAngle = 0, speedNow = 0;
  let selected = FEATURED;
  const clockTime = $('#clock-time'), clockLabel = $('#clock-label');

  function tick(s) {
    const yc = s.y + s.vh / 2;
    const w = whereAt(yc);
    const keyI = chapters[w.i].key, keyJ = chapters[w.j].key;
    const ka = keyOf(keyI), kb = keyOf(keyJ);
    const camTo = blend(ka, kb, w.f), scTo = blend(SCENES[keyI], SCENES[keyJ], w.f);
    const inStudio = keyI === 'estudio' || (keyJ === 'estudio' && w.f > 0.5);

    // nos capítulos aparece sempre o destaque; no showroom, o carro escolhido
    const want = inStudio ? selected : FEATURED;
    if (want !== showing.target) present(want);

    if (!cur.cam) { cur.cam = camTo; cur.sc = scTo; }
    // com movimento reduzido a câmera não viaja: corta direto para o enquadramento do capítulo
    cur.cam = blend(cur.cam, reduce ? (w.f < 0.5 ? ka : kb) : camTo, reduce ? 1 : damp(s.dt, 5.5));
    cur.sc = blend(cur.sc, scTo, reduce ? 1 : damp(s.dt, 7));
    const sc = cur.sc, cam = cur.cam;

    // abertura: o sol sobe e a luz chega
    if (introAt === null) introAt = s.t;
    const intro = reduce ? 1 : easeOut((s.t - introAt - 0.2) / 2.8);

    // ----- fundo em CSS: céu, chão, sol, relógio
    const st = stage.style, isWide = wide();
    st.setProperty('--sky-top', css(sc.top));
    st.setProperty('--sky-hor', css(sc.hor));
    st.setProperty('--ground', css(sc.ground));
    st.setProperty('--sun-col', css(sc.sun));
    st.setProperty('--sun-a', sc.sunA.toFixed(3));
    // em tela em pé o sol encolhe e vai para a direita, longe do texto
    st.setProperty('--sun-x', `${((isWide ? sc.sunX : Math.max(sc.sunX, 1 - sc.sunX)) * s.vw).toFixed(1)}px`);
    st.setProperty('--sun-y', `${((sc.sunY - (1 - intro) * 0.34) * s.vh).toFixed(1)}px`);
    st.setProperty('--sun-s', `${(sc.sunS * Math.min(s.vh, s.vw * 1.25)).toFixed(1)}px`);
    st.setProperty('--name-a', clamp(1 - s.y / (s.vh * 0.55)).toFixed(3));
    st.setProperty('--name-y', `${(-s.y * 0.3).toFixed(1)}px`);
    st.setProperty('--clock-a', (sc.clock * clamp((s.y - s.vh * 0.25) / (s.vh * 0.3))).toFixed(3));
    st.setProperty('--clock-ink', sc.dark > 0.5 ? 'var(--bone)' : 'var(--ink)');
    const h = Math.floor(sc.hora), m = Math.floor((sc.hora - h) * 60);
    clockTime.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    clockLabel.textContent = w.f < 0.5 ? SCENES[keyI].nome : SCENES[keyJ].nome;

    // ----- nav clara ou escura conforme o que está por baixo
    const navY = s.y + 34;
    nav.classList.toggle('is-light', navY >= visitTop || (navY < catTop && sc.dark > 0.5));

    if (!gl) { st.setProperty('--hy', `${(s.vh * 0.56).toFixed(0)}px`); return; }
    if (s.y > expBottom + 40 || !showing.rig) return;      // palco coberto: não desenha

    // ----- troca de carro: o atual sai andando, o próximo chega e freia
    if (swap) {
      if (!swap.switched) {
        const u = clamp((s.t - swap.t0) / OUT);
        swap.out.x = lerp(swap.x0, -FAR, u * u);
        if (u >= 1) {
          if (swap.out !== swap.into) swap.out.rig.visible = false;
          activate(swap.into, swap.item);
          swap.into.x = FAR; showing.rig = swap.into; swap.switched = true; swap.t1 = s.t;
        }
      } else {
        const u = clamp((s.t - swap.t1) / IN);
        swap.into.x = FAR * (1 - easeOut(u));
        if (u >= 1) { swap.into.x = 0; swap = null; }
      }
    }
    const active = showing.rig, car = active.car;
    cur.dims = cur.dims ? blend(cur.dims, car.dims, reduce ? 1 : damp(s.dt, 4)) : Object.assign({}, car.dims);
    const D = cur.dims;

    // ----- giro livre no showroom
    if (inStudio && !reduce) {
      orbit.idle += s.dt;
      if (!orbit.drag && orbit.idle > 2.5) orbit.az += s.dt * 5;
    } else if (!orbit.drag) {
      orbit.az = lerp(orbit.az - Math.round(orbit.az / 360) * 360, 0, damp(s.dt, 4));
      orbit.el = lerp(orbit.el, 0, damp(s.dt, 4));
    }

    // ----- câmera: distância calculada para o carro ocupar "fit" da largura
    const { camera, renderer } = gl;
    const W = stage.clientWidth, H = stage.clientHeight, aspect = W / H;
    const az = (cam.az + orbit.az) * DEG, el = clamp(cam.el + orbit.el, 1.5, 38) * DEG;
    const tanV = Math.tan(camera.fov / 2 * DEG), tanH = tanV * aspect;
    const wProj = D.length * Math.abs(Math.sin(az)) + D.width * Math.abs(Math.cos(az));
    const hProj = D.height * Math.cos(el) + (D.length * Math.abs(Math.cos(az)) + D.width * Math.abs(Math.sin(az))) * Math.sin(el);
    const d = Math.max(wProj / cam.fit / (2 * tanH), hProj / 0.46 / (2 * tanV), 5.2);
    const lookY = D.height * 0.44;
    camera.position.set(-Math.cos(az) * Math.cos(el) * d, lookY + Math.sin(el) * d, Math.sin(az) * Math.cos(el) * d);
    camera.lookAt(0, lookY, 0);
    camera.aspect = aspect;
    camera.setViewOffset(W, H, -cam.sx * W, -cam.sy * H, W, H);

    // horizonte na tela: projeta um ponto do chão muito longe, na direção do olhar
    camera.updateMatrixWorld();
    camera.getWorldDirection(gl.dir);
    const dl = Math.hypot(gl.dir.x, gl.dir.z) || 1;
    gl.tmp.set(camera.position.x + gl.dir.x / dl * 3000, 0, camera.position.z + gl.dir.z / dl * 3000).project(camera);
    st.setProperty('--hy', `${clamp((1 - (gl.tmp.y * 0.5 + 0.5)) * H, 0, H).toFixed(1)}px`);

    // ----- luz do dia
    renderer.toneMappingExposure = sc.exp * lerp(0.1, 1, intro);
    gl.key.intensity = sc.key;
    gl.key.color.setRGB(sc.keyCol[0] / 255, sc.keyCol[1] / 255, sc.keyCol[2] / 255).convertSRGBToLinear();
    gl.hemi.intensity = 0.2 + 0.4 * (1 - sc.dark);
    gl.floorMat.color.setRGB(sc.ground[0] / 255, sc.ground[1] / 255, sc.ground[2] / 255).convertSRGBToLinear();
    gl.shadowMat.opacity = lerp(0.62, 0.9, sc.dark) * lerp(0.4, 1, intro);

    // ----- rodas e riscos de velocidade
    speedNow = lerp(speedNow, reduce ? 0 : cam.speed, damp(s.dt, 2.5));
    wheelAngle += speedNow * s.dt / car.dims.wheelR;
    gl.streakMat.opacity = clamp(speedNow / 22) * 0.55;
    const tone = sc.dark > 0.5 ? 1 : 0.72;
    gl.streakMat.color.setRGB(sc.ground[0] / 255 * tone, sc.ground[1] / 255 * tone, sc.ground[2] / 255 * tone).convertSRGBToLinear();
    if (speedNow > 0.05) for (const mm of gl.streaks) { mm.position.x += speedNow * s.dt; if (mm.position.x > 15) mm.position.x -= 30; }

    // ----- faróis: os quatro pontos acendem um a um ao entrar na noite; a barra traseira, do centro para fora
    if (sc.night > 0.75 && light.armed) { light.armed = false; light.t0 = s.t + 0.25; }
    if (sc.night < 0.4) light.armed = true;
    const lit = reduce ? 1 : clamp((s.t - light.t0) / 1.5);
    const reveal = s.t - light.t0 < 1.6 && s.t >= light.t0 - 0.3 ? easeOut(lit) * 1.06 : 1.06;
    const gain = lerp(1, 2.4, sc.night);
    for (const id in rigs) {
      const r = rigs[id];
      if (!r.rig.visible) continue;
      r.rig.position.x = r.x;
      r.car.spin(wheelAngle - r.x / r.car.dims.wheelR);
      r.envMats.forEach(e => { e.m.envMapIntensity = (e.m.userData.envBase !== undefined ? e.m.userData.envBase : e.base) * sc.env; });
      r.car.lights.front.uOn.value = reveal; r.car.lights.rear.uOn.value = reveal;
      r.car.lights.front.uGain.value = gain; r.car.lights.rear.uGain.value = gain;
    }
    // o clarão não testa profundidade, então só aparece do lado em que a luz está de frente para a câmera
    gl.glowF.forEach((g, i) => {
      g.position.set(active.x + car.lamp[0], car.lamp[1], car.lamp[2] * (i ? -1 : 1));
      g.material.opacity = sc.night * 0.62 * clamp(reveal) * clamp(Math.cos(az) * 1.6);
    });
    gl.glowR.position.set(active.x + car.dims.half + 0.04, car.dims.height * 0.62, 0);
    gl.glowR.material.opacity = sc.night * 0.5 * clamp(reveal) * clamp(-Math.cos(az) * 1.6);

    renderer.render(gl.scene, camera);
  }

  $('#relight').addEventListener('click', () => { light.t0 = S.t + 0.05; });

  /* ------------------------------------------------------------------------
     SHOWROOM — painel, tira de seleção e giro por arraste
     ------------------------------------------------------------------------ */

  const show = $('#showroom'), hint = $('#orbit-hint'), panel = $('#panel');
  const priceEl = $('#price'), strip = $('#strip');
  const price = { cur: FEATURED.preco, to: FEATURED.preco };

  strip.innerHTML = CATALOG.map(c => `<button type="button" role="option" aria-selected="false" data-id="${c.id}">${silhouette(c)}<span>${c.nome}</span></button>`).join('');

  function select(item, quiet) {
    if (!item) return;
    selected = item;
    const i = CATALOG.indexOf(item);
    $('#car-name').textContent = item.nome;
    $('#car-meta').textContent = `${item.ano} · ${km(item.km)} · ${item.cor.nome}`;
    $('#car-specs').innerHTML = `
      <div><dt>Potência</dt><dd>${item.cv} cv</dd></div>
      <div><dt>0 a 100 km/h</dt><dd>${item.zero} s</dd></div>
      <div><dt>Máxima</dt><dd>${item.vmax} km/h</dd></div>
      <div class="wide"><dt>Motor</dt><dd>${item.motor}</dd></div>
      <div class="more"><dt>Tração</dt><dd>${item.tracao}</dd></div>
      <div class="more"><dt>Energia</dt><dd>${item.energia}</dd></div>
      <div class="more"><dt>Carroceria</dt><dd>${item.tipo}</dd></div>`;
    $('#counter').textContent = `${i + 1} / ${CATALOG.length}`;
    $('#interest').dataset.interest = item.id;
    price.to = item.preco;
    if (reduce || quiet) { price.cur = price.to; priceEl.textContent = money(price.to); }
    $$('button', strip).forEach(b => {
      const on = b.dataset.id === item.id;
      b.setAttribute('aria-selected', String(on));
      if (on) strip.scrollTo({ left: b.offsetLeft - (strip.clientWidth - b.offsetWidth) / 2, behavior: reduce || quiet ? 'auto' : 'smooth' });
    });
    $$('.card', grid).forEach(c => c.classList.toggle('is-current', c.dataset.id === item.id));
    if (!quiet) { panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap'); }
  }
  const step = d => select(CATALOG[(CATALOG.indexOf(selected) + d + CATALOG.length) % CATALOG.length]);

  strip.addEventListener('click', e => { const b = e.target.closest('button'); if (b) select(byId(b.dataset.id)); });
  $('#prev').addEventListener('click', () => step(-1));
  $('#next').addEventListener('click', () => step(1));
  show.addEventListener('keydown', e => {
    if (e.target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
  });

  // arrastar para girar (fora do painel e da tira)
  show.addEventListener('pointerdown', e => {
    if (e.target.closest('.show__panel, .strip')) return;
    if (e.pointerType === 'mouse') e.preventDefault();       // não começa uma seleção de texto
    orbit.drag = true; orbit.lastX = e.clientX; orbit.lastY = e.clientY; orbit.idle = 0;
    show.classList.add('is-drag'); hint.classList.add('is-gone');
    try { show.setPointerCapture(e.pointerId); } catch (_) {}
  });
  show.addEventListener('pointermove', e => {
    if (!orbit.drag) return;
    orbit.az -= (e.clientX - orbit.lastX) * 0.32;
    orbit.el = clamp(orbit.el + (e.clientY - orbit.lastY) * 0.12, -6, 26);
    orbit.lastX = e.clientX; orbit.lastY = e.clientY; orbit.idle = 0;
  });
  const endDrag = () => { orbit.drag = false; show.classList.remove('is-drag'); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => show.addEventListener(t, endDrag));

  /* ------------------------------------------------------------------------
     CATÁLOGO — grade com filtros
     ------------------------------------------------------------------------ */

  const grid = $('#grid'), filtersEl = $('#filters');
  const words = ['Nenhum', 'Um', 'Dois', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez'];
  $('#cat-count').textContent = words[CATALOG.length] || String(CATALOG.length);

  grid.innerHTML = CATALOG.map((c, i) => `
    <article class="card" data-id="${c.id}" data-reveal style="--d:${(i % 4) * 0.07}s">
      <div class="card__art"><span class="card__tag">${c.tipo}</span>${silhouette(c)}</div>
      <div class="card__body">
        <h3>${c.nome}</h3>
        <p class="card__meta">${c.ano} · ${km(c.km)} · ${c.cor.nome}</p>
        <dl class="card__specs">
          <div><dt>Potência</dt><dd>${c.cv} cv</dd></div>
          <div><dt>0 a 100</dt><dd>${c.zero} s</dd></div>
          <div><dt>Máxima</dt><dd>${c.vmax} km/h</dd></div>
        </dl>
        <div class="card__foot">
          <p class="card__price">${money(c.preco)}</p>
          <div class="card__actions">
            <a class="btn btn--line btn--small" href="#showroom" data-show="${c.id}" aria-label="Ver ${c.nome} em 3D">Ver em 3D</a>
            <a class="btn btn--solid btn--small" href="#visita" data-interest="${c.id}" aria-label="Tenho interesse no ${c.nome}">Tenho interesse</a>
          </div>
        </div>
      </div>
    </article>`).join('');

  filtersEl.innerHTML = FILTERS.map((f, i) => {
    const n = f.id === 'todos' ? CATALOG.length : CATALOG.filter(c => c.tags.includes(f.id)).length;
    return `<button type="button" data-filter="${f.id}" aria-pressed="${i === 0}">${f.nome}<i>${n}</i></button>`;
  }).join('');
  filtersEl.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const id = b.dataset.filter;
    $$('button', filtersEl).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    let shown = 0;
    $$('.card', grid).forEach(card => {
      const c = byId(card.dataset.id), on = id === 'todos' || c.tags.includes(id);
      card.hidden = !on;
      if (on) { card.style.setProperty('--d', `${(shown++ % 4) * 0.07}s`); card.classList.remove('is-in'); void card.offsetWidth; card.classList.add('is-in'); }
    });
    setTimeout(measureTimeline, 50);
  });

  /* ------------------------------------------------------------------------
     VISITA — monta o pedido com o carro escolhido
     ------------------------------------------------------------------------ */

  const form = $('#visit-form'), msg = $('#msg'), msgSend = $('#msg-send'), msgCopy = $('#msg-copy'), msgStatus = $('#msg-status');
  const carSel = $('#f-carro');
  carSel.innerHTML = '<option value="">Ainda estou escolhendo</option>' + CATALOG.map(c => `<option value="${c.id}">${c.nome} ${c.ano} · ${c.cor.nome}</option>`).join('');
  function buildMsg() {
    const f = form.elements, c = byId(f.carro.value);
    const lines = [`Olá! Quero agendar uma visita à ${CONFIG.loja}.`];
    if (f.nome.value.trim()) lines.push(`Nome: ${f.nome.value.trim()}`);
    lines.push(c ? `Carro: ${c.nome} ${c.ano}, ${c.cor.nome.toLowerCase()}, ${km(c.km)}, ${money(c.preco)}` : 'Carro: ainda estou escolhendo');
    lines.push(`Quando: ${f.quando.value}`);
    if (f.troca.checked) lines.push('Tenho um carro para avaliar na troca.');
    const text = lines.join('\n');
    msg.textContent = text;
    if (CONFIG.whatsapp) { msgSend.hidden = false; msgSend.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`; }
    return text;
  }
  form.addEventListener('input', () => { buildMsg(); msgStatus.textContent = ''; });
  form.addEventListener('submit', e => e.preventDefault());
  msgCopy.addEventListener('click', () => {
    const text = buildMsg();
    const fallback = () => {
      const range = document.createRange(); range.selectNodeContents(msg);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      msgStatus.textContent = 'Texto selecionado. Copie com Ctrl+C.';
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => { msgStatus.textContent = 'Pedido copiado. Agora é só colar na conversa.'; }, fallback);
    else fallback();
  });

  /* ------------------------------------------------------------------------
     NAV, ÂNCORAS, ENTRADAS
     ------------------------------------------------------------------------ */

  const menuBtn = $('#menu-btn'), menuPanel = $('#menu-panel');
  function toggleMenu(open) {
    menuPanel.hidden = !open;
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Fechar' : 'Menu';
  }
  menuBtn.addEventListener('click', () => toggleMenu(menuPanel.hidden));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.target === '_blank') return;
    if (a.dataset.show) select(byId(a.dataset.show));                       // "Ver em 3D": leva o carro ao showroom
    if (a.dataset.interest) { carSel.value = a.dataset.interest; buildMsg(); msgStatus.textContent = ''; }   // "Tenho interesse": leva ao pedido
    const target = document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    toggleMenu(false);
    let y = target.id === 'topo' ? 0 : target.getBoundingClientRect().top + window.scrollY;
    if (target.classList.contains('ch') && target.id !== 'hero') y += S.vh * 0.6;   // para dentro do capítulo, com a cena já assentada
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  });

  const seenIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-seen'); }), { rootMargin: '-30% 0px -30% 0px' });
  $$('.ch:not(.hero)').forEach(el => seenIO.observe(el));
  const cardIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); cardIO.unobserve(e.target); } }), { threshold: 0.12 });
  $$('.card', grid).forEach(el => cardIO.observe(el));
  $$('#stage-name span').forEach((el, i) => el.style.setProperty('--i', i));

  /* ------------------------------------------------------------------------
     LOOP E PARTIDA
     ------------------------------------------------------------------------ */

  let navY = window.scrollY, slow = 0, drops = 0;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    S.y = window.scrollY; S.t = now / 1000; S.dt = dt;
    tick(S);

    // preço rolando até o valor do carro escolhido
    if (Math.abs(price.cur - price.to) > 0.5) {
      price.cur = lerp(price.cur, price.to, damp(dt, 9));
      if (Math.abs(price.cur - price.to) < 500) price.cur = price.to;
      priceEl.textContent = money(Math.round(price.cur / 1000) * 1000);
    }
    // nav some ao descer e volta ao subir
    const d = S.y - navY;
    if (Math.abs(d) > 8) { if (menuPanel.hidden) nav.classList.toggle('is-hidden', d > 0 && S.y > S.vh * 0.8); navY = S.y; }
    // aparelho lento: desenha a cena com menos pixels
    if (gl && S.y < expBottom && dt > 0.034) {
      if (++slow > 45 && drops < 3) { drops++; slow = 0; gl.pr = Math.max(0.6, gl.pr * 0.75); resizeScene(); }
    } else slow = 0;
    requestAnimationFrame(frame);
  }

  let rT;
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { measureTimeline(); resizeScene(); }, 120); });
  window.addEventListener('load', measureTimeline);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureTimeline);

  try {
    if (!T || !Car) throw new Error('sem three.js');
    initScene();
  } catch (err) {
    gl = null;
    root.classList.add('no-webgl');          // sem WebGL: fica a silhueta do carro no lugar do modelo
    $('#fallback').innerHTML = silhouette(FEATURED);
  }
  measureTimeline();
  select(FEATURED, true);
  buildMsg();
  stage.classList.add('is-lit');
  requestAnimationFrame(frame);
})();
