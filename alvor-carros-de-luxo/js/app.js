/* ==========================================================================
   Alvor Lume — palco 3D, passagem do dia e interações
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
    marca: 'Alvor',
    modelo: 'Lume',
    precoBase: 890000,
    // WhatsApp que recebe os pedidos de test drive: só números, com DDI e DDD. Ex.: '5511999999999'.
    // Vazio = o formulário só oferece "Copiar pedido".
    whatsapp: '',
  };

  const PAINTS = [
    { id: 'atlantico', nome: 'Atlântico', hex: 0x15344a, extra: 0 },
    { id: 'grafite', nome: 'Grafite Serra', hex: 0x2c2f34, extra: 0 },
    { id: 'areia', nome: 'Areia do Jalapão', hex: 0xb7a688, extra: 9000 },
    { id: 'jabuticaba', nome: 'Jabuticaba', hex: 0x2b1b30, extra: 0 },
    { id: 'mata', nome: 'Mata Atlântica', hex: 0x17382b, extra: 0 },
    { id: 'rubi', nome: 'Rubi', hex: 0x5a141f, extra: 6000 },
  ];
  const WHEELS = [
    { id: 'turbina', nome: 'Turbina 21"', desc: 'Vinte raios, de série', extra: 0 },
    { id: 'disco', nome: 'Disco 21"', desc: 'Calota aerodinâmica', extra: 14000 },
  ];

  /* ------------------------------------------------------------------------
     O DIA — cada capítulo tem uma hora, uma luz e um enquadramento
     ------------------------------------------------------------------------ */

  const rgbOf = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  // top/hor: céu no alto e no horizonte · sunY: altura do sol sobre o horizonte (em alturas de tela)
  // exp: exposição · env: reflexos do estúdio · key: luz direcional · night: lâminas de luz em destaque
  const SCENES = {
    alvor:   { hora: 6.2,   nome: 'Alvor',  top: rgbOf(0xC7CFD6), hor: rgbOf(0xF1DCC6), ground: rgbOf(0xD8D5CF), sun: rgbOf(0xF3B585), sunA: 1,   sunX: 0.64, sunY: 0.07,  sunS: 0.46, exp: 0.95, env: 1.0,  key: 1.5,  keyCol: rgbOf(0xFFE4C8), night: 0,    dark: 0, clock: 1 },
    dia:     { hora: 10,    nome: 'Manhã',  top: rgbOf(0xD9E1E6), hor: rgbOf(0xECEDE8), ground: rgbOf(0xE2E1DC), sun: rgbOf(0xFFF4D8), sunA: 0.9, sunX: 0.82, sunY: 0.3,   sunS: 0.16, exp: 1.08, env: 1.05, key: 1.7,  keyCol: rgbOf(0xFFFFFF), night: 0,    dark: 0, clock: 1 },
    tarde:   { hora: 16,    nome: 'Tarde',  top: rgbOf(0xD6D0C4), hor: rgbOf(0xF2DFBA), ground: rgbOf(0xDBD4C6), sun: rgbOf(0xF5C56B), sunA: 1,   sunX: 0.8,  sunY: 0.16,  sunS: 0.3,  exp: 1.02, env: 1.0,  key: 1.6,  keyCol: rgbOf(0xFFDCA6), night: 0,    dark: 0, clock: 1 },
    poente:  { hora: 18.78, nome: 'Poente', top: rgbOf(0x22233A), hor: rgbOf(0xC65A3C), ground: rgbOf(0x29232E), sun: rgbOf(0xF0623C), sunA: 1,   sunX: 0.3,  sunY: 0.02,  sunS: 0.5,  exp: 0.62, env: 0.6,  key: 0.7,  keyCol: rgbOf(0xFF9A66), night: 0.4,  dark: 1, clock: 1 },
    noite:   { hora: 22,    nome: 'Noite',  top: rgbOf(0x04050A), hor: rgbOf(0x0D1220), ground: rgbOf(0x07080C), sun: rgbOf(0x0D1220), sunA: 0,   sunX: 0.7,  sunY: -0.3,  sunS: 0.4,  exp: 0.42, env: 0.5,  key: 0.12, keyCol: rgbOf(0xBFD0FF), night: 1,    dark: 1, clock: 1 },
    estudio: { hora: 22,    nome: 'Estúdio', top: rgbOf(0xE5E4DF), hor: rgbOf(0xE5E4DF), ground: rgbOf(0xDAD9D3), sun: rgbOf(0xE5E4DF), sunA: 0,  sunX: 0.5,  sunY: 0.2,   sunS: 0.2,  exp: 1.06, env: 1.05, key: 1.5,  keyCol: rgbOf(0xFFFFFF), night: 0,    dark: 0, clock: 0 },
  };
  // az: ângulo da câmera a partir da frente do carro · el: elevação · fit: fração da largura que o carro ocupa
  // sx/sy: desloca o carro no quadro (frações da tela) · speed: velocidade das rodas em m/s
  // Cada chave tem a versão larga (d) e a de tela em pé (m).
  const KEYS = {
    alvor:   { d: { az: 40,  el: 3.5, fit: 0.5,  sx: 0.07,  sy: 0.05 },  m: { az: 30,  el: 5,  fit: 0.9,  sx: 0,    sy: -0.07 }, speed: 0 },
    dia:     { d: { az: 90,  el: 2.5, fit: 0.66, sx: 0,     sy: 0.17 },  m: { az: 90,  el: 4,  fit: 0.96, sx: 0,    sy: 0.27 },  speed: 0 },
    tarde:   { d: { az: 24,  el: 4,   fit: 0.5,  sx: 0.2,   sy: 0.06 },  m: { az: 20,  el: 6,  fit: 0.86, sx: 0,    sy: 0.22 },  speed: 22 },
    poente:  { d: { az: 150, el: 7,   fit: 0.5,  sx: -0.2,  sy: 0.08 },  m: { az: 156, el: 9,  fit: 0.92, sx: 0,    sy: 0.31 },  speed: 0 },
    noite:   { d: { az: 12,  el: 5,   fit: 0.46, sx: 0.2,   sy: 0.05 },  m: { az: 8,   el: 6,  fit: 0.8,  sx: 0,    sy: 0.2 },   speed: 0 },
    estudio: { d: { az: 42,  el: 9,   fit: 0.52, sx: -0.16, sy: 0.02 },  m: { az: 36,  el: 10, fit: 0.98, sx: 0,    sy: -0.2 },  speed: 0 },
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
  const money = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEG = Math.PI / 180;

  // mistura dois objetos numéricos / de cor
  function blend(a, b, t) {
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

  /* ------------------------------------------------------------------------
     LINHA DO TEMPO — o scroll diz em que hora do dia estamos
     ------------------------------------------------------------------------ */

  const chapters = $$('[data-key]', exp).map(el => ({ el, key: el.dataset.key, a: 0, b: 0 }));
  let expBottom = 0, sheetTop = 0, driveTop = 0;
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
    sheetTop = $('#ficha').getBoundingClientRect().top + scrollY;
    driveTop = $('#test-drive').getBoundingClientRect().top + scrollY;
  }
  // devolve { i, j, f }: entre os capítulos i e j, na fração f
  function whereAt(yc) {
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

  const T = window.THREE, Car = window.AlvorCar;
  let gl = null;      // tudo da cena, se o WebGL estiver disponível

  function initScene() {
    const canvas = $('#scene');
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    let pr = Math.min(window.devicePixelRatio || 1, Math.min(innerWidth, innerHeight) < 700 ? 1.6 : 2);
    renderer.setPixelRatio(pr);

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

    const car = Car.build({ color: PAINTS[0].hex, wheel: WHEELS[0].id });
    scene.add(car.mirror, car.group);
    const envMats = Object.values(car.mats).filter(m => 'envMapIntensity' in m).map(m => ({ m, base: m.envMapIntensity }));

    const key = new T.DirectionalLight(0xffffff, 1.5); key.position.set(-4, 7, 5); scene.add(key);
    const hemi = new T.HemisphereLight(0xffffff, 0x8a8a86, 0.55); scene.add(hemi);

    // Piso: a mesma cor do chão do fundo, sumindo nas bordas. Meio transparente para deixar ver o reflexo.
    const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); return t; };
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
    const floor = new T.Mesh(new T.CircleGeometry(15, 64), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.renderOrder = 1; scene.add(floor);

    const shadowTex = tex(512, 256, (g, w, h) => {
      g.translate(w / 2, h / 2); g.scale(1, h / w);
      const gr = g.createRadialGradient(0, 0, w * 0.04, 0, 0, w / 2);
      gr.addColorStop(0, 'rgba(0,0,0,.78)'); gr.addColorStop(0.5, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(-w / 2, -w / 2, w, w);
    });
    const shadowMat = new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false });
    const shadow = new T.Mesh(new T.PlaneGeometry(6.5, 3.3), shadowMat);
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.004; shadow.renderOrder = 2; scene.add(shadow);

    // Riscos de velocidade no piso (capítulo de desempenho)
    const streakMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const streaks = [];
    for (let i = 0; i < 18; i++) {
      const len = 2 + Math.random() * 6;
      const m = new T.Mesh(new T.PlaneGeometry(len, 0.012 + Math.random() * 0.03), streakMat);
      m.rotation.x = -Math.PI / 2;
      const z = (1.4 + Math.random() * 5.5) * (i % 2 ? 1 : -1);
      m.position.set(-14 + Math.random() * 28, 0.003, z); m.renderOrder = 2;
      scene.add(m); streaks.push(m);
    }

    // Clarão das lâminas à noite
    const glowTex = tex(256, 64, (g, w, h) => {
      g.translate(w / 2, h / 2); g.scale(1, h / w);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.3, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(-w / 2, -w / 2, w, w);
    });
    const glow = (color, x, y, sx, sy) => {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, blending: T.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false }));
      sp.position.set(x, y, 0); sp.scale.set(sx, sy, 1); scene.add(sp); return sp;
    };
    const glowF = glow(new T.Color(0xfff2dc), -2.56, 0.66, 3.6, 0.9);
    const glowR = glow(new T.Color(0xff2020), 2.56, 0.9, 3.4, 0.8);

    gl = { renderer, scene, camera, car, envMats, key, hemi, floorMat, shadowMat, streakMat, streaks, glowF, glowR, pr, tmp: new T.Vector3(), dir: new T.Vector3(), paintTo: new T.Color(PAINTS[0].hex).convertSRGBToLinear() };
    resizeScene();
  }

  function resizeScene() {
    if (!gl) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    gl.renderer.setPixelRatio(gl.pr);
    gl.renderer.setSize(w, h, false);
    gl.camera.aspect = w / h;
  }

  /* ------------------------------------------------------------------------
     ESTADO POR FRAME
     ------------------------------------------------------------------------ */

  const cur = { cam: null, sc: null };                       // enquadramento e luz suavizados
  const orbit = { az: 0, el: 0, drag: false, lastX: 0, lastY: 0, idle: 0 };
  const light = { on: 1, t0: -10, armed: true };             // animação das lâminas
  let introAt = null, wheelAngle = 0, speedNow = 0, nightSeen = false;

  function tick(s) {
    const yc = s.y + s.vh / 2;
    const w = whereAt(yc);
    const ka = keyOf(chapters[w.i].key), kb = keyOf(chapters[w.j].key);
    const camTo = blend(ka, kb, w.f);
    const scTo = blend(SCENES[chapters[w.i].key], SCENES[chapters[w.j].key], w.f);
    const inStudio = chapters[w.j].key === 'estudio' && w.f > 0.9 || chapters[w.i].key === 'estudio';

    if (!cur.cam) { cur.cam = camTo; cur.sc = scTo; }
    // com movimento reduzido a câmera não viaja: corta direto para o enquadramento do capítulo
    const k = reduce ? 1 : damp(s.dt, 5.5);
    cur.cam = blend(cur.cam, reduce ? (w.f < 0.5 ? ka : kb) : camTo, k);
    cur.sc = blend(cur.sc, scTo, reduce ? 1 : damp(s.dt, 7));
    const sc = cur.sc, cam = cur.cam;

    // abertura: o sol sobe e a luz chega
    if (introAt === null) introAt = s.t;
    const intro = reduce ? 1 : easeOut((s.t - introAt - 0.2) / 2.8);

    // ----- fundo em CSS: céu, chão, sol, relógio
    const st = stage.style;
    st.setProperty('--sky-top', css(sc.top));
    st.setProperty('--sky-hor', css(sc.hor));
    st.setProperty('--ground', css(sc.ground));
    st.setProperty('--sun-col', css(sc.sun));
    st.setProperty('--sun-a', sc.sunA.toFixed(3));
    // em tela em pé o sol encolhe e vai para a direita, longe do texto
    const isWide = wide();
    st.setProperty('--sun-x', `${((isWide ? sc.sunX : Math.max(sc.sunX, 1 - sc.sunX)) * s.vw).toFixed(1)}px`);
    st.setProperty('--sun-y', `${((sc.sunY - (1 - intro) * 0.34) * s.vh).toFixed(1)}px`);
    st.setProperty('--sun-s', `${(sc.sunS * Math.min(s.vh, s.vw * 1.25)).toFixed(1)}px`);
    st.setProperty('--name-a', clamp(1 - s.y / (s.vh * 0.55)).toFixed(3));
    st.setProperty('--name-y', `${(-s.y * 0.3).toFixed(1)}px`);
    st.setProperty('--clock-a', (sc.clock * clamp((s.y - s.vh * 0.25) / (s.vh * 0.3))).toFixed(3));
    st.setProperty('--clock-ink', sc.dark > 0.5 ? 'var(--bone)' : 'var(--ink)');
    const h = Math.floor(sc.hora), m = Math.floor((sc.hora - h) * 60);
    clockTime.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    clockLabel.textContent = w.f < 0.5 ? SCENES[chapters[w.i].key].nome : SCENES[chapters[w.j].key].nome;

    // ----- nav clara ou escura conforme o que está por baixo
    const navY = s.y + 34;
    nav.classList.toggle('is-light', navY >= driveTop || (navY < sheetTop && sc.dark > 0.5));

    if (!gl) { st.setProperty('--hy', `${(s.vh * 0.56).toFixed(0)}px`); return; }
    if (s.y > expBottom + 40) return;                        // palco coberto: não desenha

    // ----- giro livre no configurador
    if (inStudio && !reduce) {
      orbit.idle += s.dt;
      if (!orbit.drag && orbit.idle > 2.5) orbit.az += s.dt * 5;
    } else if (!orbit.drag) {
      orbit.az = lerp(orbit.az - Math.round(orbit.az / 360) * 360, 0, damp(s.dt, 4));
      orbit.el = lerp(orbit.el, 0, damp(s.dt, 4));
    }

    // ----- câmera: distância calculada para o carro ocupar "fit" da largura
    const { camera, renderer, car } = gl;
    const W = stage.clientWidth, H = stage.clientHeight, aspect = W / H;
    const az = (cam.az + orbit.az) * DEG, el = clamp(cam.el + orbit.el, 1.5, 38) * DEG;
    const tanV = Math.tan(camera.fov / 2 * DEG), tanH = tanV * aspect;
    const L = Car.dims.length, Wd = Car.dims.width;
    const wProj = L * Math.abs(Math.sin(az)) + Wd * Math.abs(Math.cos(az));
    const hProj = 1.33 * Math.cos(el) + (L * Math.abs(Math.cos(az)) + Wd * Math.abs(Math.sin(az))) * Math.sin(el);
    const d = Math.max(wProj / cam.fit / (2 * tanH), hProj / 0.46 / (2 * tanV), 5.2);
    camera.position.set(-Math.cos(az) * Math.cos(el) * d, 0.58 + Math.sin(el) * d, Math.sin(az) * Math.cos(el) * d);
    camera.lookAt(0, 0.58, 0);
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
    gl.envMats.forEach(e => { e.m.envMapIntensity = e.base * sc.env; });
    gl.key.intensity = sc.key;
    gl.key.color.setRGB(sc.keyCol[0] / 255, sc.keyCol[1] / 255, sc.keyCol[2] / 255).convertSRGBToLinear();
    gl.hemi.intensity = 0.2 + 0.4 * (1 - sc.dark);
    gl.floorMat.color.setRGB(sc.ground[0] / 255, sc.ground[1] / 255, sc.ground[2] / 255).convertSRGBToLinear();
    gl.shadowMat.opacity = lerp(0.62, 0.9, sc.dark) * lerp(0.4, 1, intro);
    car.mats.paint.color.lerp(gl.paintTo, damp(s.dt, 5));

    // ----- rodas e riscos de velocidade
    speedNow = lerp(speedNow, reduce ? 0 : cam.speed, damp(s.dt, 2.5));
    wheelAngle += speedNow * s.dt / Car.dims.wheelR;
    car.spin(wheelAngle);
    gl.streakMat.opacity = clamp(speedNow / 22) * 0.55;
    const tone = sc.dark > 0.5 ? 1 : 0.72;
    gl.streakMat.color.setRGB(sc.ground[0] / 255 * tone, sc.ground[1] / 255 * tone, sc.ground[2] / 255 * tone).convertSRGBToLinear();
    if (speedNow > 0.05) for (const m of gl.streaks) { m.position.x += speedNow * s.dt; if (m.position.x > 15) m.position.x -= 30; }

    // ----- lâminas de luz: acendem do centro para as pontas ao entrar na noite
    if (sc.night > 0.75 && light.armed) { light.armed = false; light.t0 = s.t + 0.25; }
    if (sc.night < 0.4) light.armed = true;
    light.on = reduce ? 1 : clamp((s.t - light.t0) / 1.5);
    const reveal = s.t - light.t0 < 1.6 && s.t >= light.t0 - 0.3 ? easeOut(light.on) * 1.06 : 1.06;
    const gain = lerp(1, 2.4, sc.night);
    car.lights.front.uOn.value = reveal; car.lights.rear.uOn.value = reveal;
    car.lights.front.uGain.value = gain; car.lights.rear.uGain.value = gain;
    // o clarão não testa profundidade, então só aparece do lado em que a lâmina está de frente para a câmera
    gl.glowF.material.opacity = sc.night * 0.55 * clamp(reveal) * clamp(Math.cos(az) * 1.6);
    gl.glowR.material.opacity = sc.night * 0.5 * clamp(reveal) * clamp(-Math.cos(az) * 1.6);

    renderer.render(gl.scene, camera);
  }

  const clockTime = $('#clock-time'), clockLabel = $('#clock-label');
  $('#relight').addEventListener('click', () => { light.t0 = S.t + 0.05; });

  /* ------------------------------------------------------------------------
     CONFIGURADOR
     ------------------------------------------------------------------------ */

  const config = $('#configurar'), hint = $('#orbit-hint');
  const pick = { paint: PAINTS[0], wheel: WHEELS[0] };
  const priceEl = $('#price');
  const price = { cur: CONFIG.precoBase, to: CONFIG.precoBase };

  const paintsEl = $('#paints');
  paintsEl.innerHTML = PAINTS.map((p, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-id="${p.id}" style="--c:#${p.hex.toString(16).padStart(6, '0')}" aria-label="${p.nome}"></button>`).join('');
  const wheelsEl = $('#wheels');
  wheelsEl.innerHTML = WHEELS.map((w, i) => `<input type="radio" name="roda" id="roda-${w.id}" value="${w.id}"${i === 0 ? ' checked' : ''}><label for="roda-${w.id}">${w.nome}<small>${w.desc}</small></label>`).join('');

  function applyConfig() {
    $('#paint-name').textContent = pick.paint.nome;
    $('#wheel-name').textContent = pick.wheel.nome;
    $$('button', paintsEl).forEach(b => b.setAttribute('aria-checked', String(b.dataset.id === pick.paint.id)));
    price.to = CONFIG.precoBase + pick.paint.extra + pick.wheel.extra;
    if (reduce) { price.cur = price.to; priceEl.textContent = money(price.to); }
    if (gl) { gl.paintTo.set(pick.paint.hex).convertSRGBToLinear(); gl.car.setWheel(pick.wheel.id); }
    buildMsg();
  }
  paintsEl.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    pick.paint = PAINTS.find(p => p.id === b.dataset.id);
    applyConfig();
  });
  paintsEl.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const i = PAINTS.indexOf(pick.paint), n = PAINTS.length;
    pick.paint = PAINTS[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + n) % n];
    applyConfig();
    $(`button[data-id="${pick.paint.id}"]`, paintsEl).focus();
  });
  wheelsEl.addEventListener('change', e => { pick.wheel = WHEELS.find(w => w.id === e.target.value); applyConfig(); });

  // arrastar para girar (fora do painel)
  config.addEventListener('pointerdown', e => {
    if (e.target.closest('.config__panel')) return;
    if (e.pointerType === 'mouse') e.preventDefault();       // não começa uma seleção de texto
    orbit.drag = true; orbit.lastX = e.clientX; orbit.lastY = e.clientY; orbit.idle = 0;
    config.classList.add('is-drag'); hint.classList.add('is-gone');
    try { config.setPointerCapture(e.pointerId); } catch (_) {}
  });
  config.addEventListener('pointermove', e => {
    if (!orbit.drag) return;
    orbit.az -= (e.clientX - orbit.lastX) * 0.32;
    orbit.el = clamp(orbit.el + (e.clientY - orbit.lastY) * 0.12, -6, 26);
    orbit.lastX = e.clientX; orbit.lastY = e.clientY; orbit.idle = 0;
  });
  const endDrag = () => { orbit.drag = false; config.classList.remove('is-drag'); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => config.addEventListener(t, endDrag));

  /* ------------------------------------------------------------------------
     FICHA TÉCNICA — vista lateral desenhada com as mesmas curvas do modelo 3D
     ------------------------------------------------------------------------ */

  function profilePath() {
    const P = Car.profile, D = Car.dims, n = 120;
    let top = '', bot = '';
    for (let i = 0; i <= n; i++) {
      const x = -D.half + D.length * i / n;
      top += `${i ? 'L' : 'M'}${x.toFixed(3)} ${(-Math.max(P.yTop(x), P.ySh(x))).toFixed(3)}`;   // de lado, o para-lama passa do capô
    }
    // assoalho de trás para a frente, com as caixas de roda
    const arch = ax => {
      const dy = D.wheelR - P.yBot(ax), dx = Math.sqrt(Math.max(0, D.archR * D.archR - dy * dy));
      return { x0: ax - dx, x1: ax + dx, y: -P.yBot(ax) };
    };
    const aF = arch(D.axleF), aR = arch(D.axleR);
    const seg = (x0, x1) => { let s = ''; const m = 24; for (let i = 0; i <= m; i++) { const x = x0 + (x1 - x0) * i / m; s += `L${x.toFixed(3)} ${(-P.yBot(x)).toFixed(3)}`; } return s; };
    bot += seg(D.half, aR.x1) + `A${D.archR} ${D.archR} 0 1 0 ${aR.x0.toFixed(3)} ${aR.y.toFixed(3)}` + seg(aR.x0, aF.x1) + `A${D.archR} ${D.archR} 0 1 0 ${aF.x0.toFixed(3)} ${aF.y.toFixed(3)}` + seg(aF.x0, -D.half);
    return top + bot + 'Z';
  }
  function drawPlan() {
    const P = Car.profile, D = Car.dims, svg = $('#plan-svg');
    svg.setAttribute('viewBox', '-305 -162 610 212');       // centímetros; as linhas são desenhadas em metros dentro de um grupo ×100
    let belt = '', glass = '';
    for (let i = 0; i <= 60; i++) { const x = -1.95 + 4.2 * i / 60; belt += `${i ? 'L' : 'M'}${x.toFixed(3)} ${(-P.ySh(x) + 0.07).toFixed(3)}`; }
    for (let i = 0; i <= 40; i++) { const x = -0.52 + 2.08 * i / 40; glass += `${i ? 'L' : 'M'}${x.toFixed(3)} ${(-(P.yTop(x) - 0.085)).toFixed(3)}`; }
    for (let i = 40; i >= 0; i--) { const x = -0.52 + 2.08 * i / 40; glass += `L${x.toFixed(3)} ${(-(P.ySh(x) + 0.03)).toFixed(3)}`; }
    const mm = v => Math.round(v * 1000).toLocaleString('pt-BR') + ' mm';
    const wheel = ax => `<circle class="tyre" cx="${ax}" cy="${-D.wheelR}" r="${D.wheelR}"/><circle class="rim" cx="${ax}" cy="${-D.wheelR}" r="0.25"/><circle class="tyre" cx="${ax}" cy="${-D.wheelR}" r="0.04"/>`;
    const texts = [];
    const dimH = (x0, x1, y, label) => {
      texts.push(`<text x="${(x0 + x1) * 50}" y="${(y + 0.12) * 100}" text-anchor="middle">${label}</text>`);
      return `<path class="dim" pathLength="1" d="M${x0} ${y}L${x1} ${y}M${x0} ${y - 0.04}L${x0} ${y + 0.04}M${x1} ${y - 0.04}L${x1} ${y + 0.04}"/>`;
    };
    const hx = 286, hyc = -D.height * 50;
    texts.push(`<text x="${hx}" y="${hyc}" transform="rotate(-90 ${hx} ${hyc})" text-anchor="middle">Altura ${mm(D.height)}</text>`);
    svg.innerHTML = `<g transform="scale(100)">
      <path class="ln ln--thin" pathLength="1" d="M-3 0L3 0"/>
      <path class="ln" pathLength="1" d="${profilePath()}"/>
      <path class="ln ln--thin" pathLength="1" d="${belt}"/>
      <path class="ln ln--thin" pathLength="1" d="${glass}Z"/>
      ${wheel(D.axleF)}${wheel(D.axleR)}
      ${dimH(D.axleF, D.axleR, 0.14, 'Entre-eixos ' + mm(D.wheelbase))}
      ${dimH(-D.half, D.half, 0.34, 'Comprimento ' + mm(D.length))}
      <path class="dim" pathLength="1" d="M2.78 0L2.78 ${-D.height}M2.74 0L2.82 0M2.74 ${-D.height}L2.82 ${-D.height}"/>
    </g>${texts.join('')}`;
    $('#fallback').innerHTML = `<path d="${profilePath()}"/><circle cx="${D.axleF}" cy="${-D.wheelR}" r="${D.wheelR}"/><circle cx="${D.axleR}" cy="${-D.wheelR}" r="${D.wheelR}"/>`;
  }

  /* ------------------------------------------------------------------------
     TEST DRIVE — monta o pedido com a configuração escolhida
     ------------------------------------------------------------------------ */

  const form = $('#drive-form'), msg = $('#msg'), msgSend = $('#msg-send'), msgCopy = $('#msg-copy'), msgStatus = $('#msg-status');
  function buildMsg() {
    const f = form.elements;
    const lines = [`Olá! Quero agendar um test drive do ${CONFIG.marca} ${CONFIG.modelo}.`];
    if (f.nome.value.trim()) lines.push(`Nome: ${f.nome.value.trim()}`);
    if (f.cidade.value.trim()) lines.push(`Cidade: ${f.cidade.value.trim()}`);
    lines.push(`Quando: ${f.quando.value}`);
    lines.push(`Configuração: pintura ${pick.paint.nome}, rodas ${pick.wheel.nome}`);
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
  const planIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); planIO.unobserve(e.target); } }), { threshold: 0.3 });
  planIO.observe($('#plan'));
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

    // preço rolando até o novo valor
    if (Math.abs(price.cur - price.to) > 0.5) {
      price.cur = lerp(price.cur, price.to, damp(dt, 9));
      if (Math.abs(price.cur - price.to) < 50) price.cur = price.to;
      priceEl.textContent = money(price.cur);
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
    root.classList.add('no-webgl');          // sem WebGL: fica o perfil do carro em SVG
  }
  if (Car) drawPlan();
  measureTimeline();
  applyConfig();
  priceEl.textContent = money(price.to);
  stage.classList.add('is-lit');
  requestAnimationFrame(frame);
})();
