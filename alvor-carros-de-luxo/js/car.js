/* ==========================================================================
   Alvor Motors — os carros, modelados em código.
   Não há arquivo de malha: cada carroceria é um "loft" de seções transversais
   ao longo do comprimento, guiado por curvas (teto, ombro, assoalho, largura).
   As mesmas curvas desenham a vista lateral da ficha técnica.
   Unidades em metros. Frente do carro em -x, chão em y = 0.

   São três carrocerias (PRESETS): "coupe911", "fastback" e "suv". São
   ilustrações de proporção, não cópias medidas de nenhum carro.
   ========================================================================== */
(function () {
  'use strict';
  const T = window.THREE;
  if (!T) return;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // Curva suave por pontos-chave [x, valor], sem ultrapassar os extremos.
  function curve(pts) {
    const n = pts.length;
    const m = pts.map((p, i) => {
      if (i === 0) return (pts[1][1] - p[1]) / (pts[1][0] - p[0]);
      if (i === n - 1) return (p[1] - pts[n - 2][1]) / (p[0] - pts[n - 2][0]);
      const d0 = (p[1] - pts[i - 1][1]) / (p[0] - pts[i - 1][0]);
      const d1 = (pts[i + 1][1] - p[1]) / (pts[i + 1][0] - p[0]);
      return d0 * d1 <= 0 ? 0 : 2 * d0 * d1 / (d0 + d1);
    });
    return x => {
      if (x <= pts[0][0]) return pts[0][1];
      if (x >= pts[n - 1][0]) return pts[n - 1][1];
      let i = 0;
      while (x > pts[i + 1][0]) i++;
      const h = pts[i + 1][0] - pts[i][0], t = (x - pts[i][0]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * pts[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * pts[i + 1][1] + (t3 - t2) * h * m[i + 1];
    };
  }

  /* ------------------------------------------------------------------------
     CARROCERIAS
     yTop: linha do teto no eixo do carro · ySh: ombro (onde a lateral vira)
     yBot: assoalho · wSh: meia largura · wRoof: meia largura do teto
     fender: quanto a crista do para-lama sobe acima do ombro
     cabin: [início, cheio, fim, zero] da cabine ao longo do comprimento
     inset: quanto o vidro recua do ombro (base, extra no quadril, de, até)
     top: trechos do teto que são vidro ou grade; o resto é pintura
     ------------------------------------------------------------------------ */

  const PRESETS = {
    // Cupê de motor traseiro: para-lamas mais altos que o capô, faróis ovais, teto que desce até a traseira.
    coupe911: {
      half: 2.26, axleF: -1.235, axleR: 1.215, wheelR: 0.34, archR: 0.385, track: 0.775, width: 1.9, height: 1.3,
      yTop: [[-2.26, 0.5], [-2.22, 0.555], [-2.1, 0.6], [-1.8, 0.665], [-1.235, 0.755], [-0.8, 0.865], [-0.42, 1.1], [-0.05, 1.265], [0.2, 1.3], [0.55, 1.275], [0.95, 1.17], [1.35, 1.02], [1.75, 0.875], [2.02, 0.8], [2.16, 0.765], [2.23, 0.71], [2.26, 0.64]],
      ySh: [[-2.26, 0.5], [-2.2, 0.54], [-2.05, 0.6], [-1.8, 0.66], [-1.235, 0.74], [-0.8, 0.84], [-0.2, 0.885], [0.5, 0.905], [0.9, 0.915], [1.215, 0.905], [1.7, 0.86], [2.0, 0.8], [2.16, 0.76], [2.26, 0.66]],
      yBot: [[-2.26, 0.36], [-2.22, 0.26], [-2.1, 0.17], [-1.9, 0.14], [1.85, 0.14], [2.05, 0.19], [2.2, 0.28], [2.26, 0.4]],
      wSh: [[-2.26, 0.3], [-2.245, 0.48], [-2.2, 0.62], [-2.08, 0.76], [-1.85, 0.855], [-1.235, 0.905], [-0.7, 0.885], [0.0, 0.88], [0.6, 0.9], [0.95, 0.935], [1.215, 0.955], [1.6, 0.955], [1.95, 0.91], [2.12, 0.83], [2.21, 0.7], [2.26, 0.5]],
      wRoof: [[-0.86, 0.74], [-0.4, 0.62], [0.0, 0.565], [0.5, 0.55], [1.0, 0.53], [1.5, 0.5]],
      fender: [[-2.26, 0], [-2.15, 0.03], [-1.95, 0.085], [-1.6, 0.085], [-1.235, 0.07], [-0.9, 0.03], [-0.7, 0], [0.8, 0], [1.0, 0.02], [1.3, 0.045], [1.7, 0.04], [2.0, 0.015], [2.2, 0]],
      cabin: [-0.9, -0.58, 0.9, 1.5], inset: [0.075, 0.13, 0.1, 0.9],
      sideGlass: [-0.5, 0.82], rake: [0.24, 0.46], pillars: [0.19],
      top: [[-0.8, -0.04, 'glass'], [0.44, 1.2, 'glass'], [1.27, 1.66, 'grille']],
      front: 'round', lampX: -1.9, bladeR: 1.86, seams: [-0.6, 0.2], handle: [0.0, 0.13], mirrorX: -0.44, mirror: 'espelho',
      trim: [-0.45, 0.66], tail: 'paint', exhaust: true, wheel: 'cinco',
    },
    // Fastback de quatro portas: baixo e longo, com a mesma frente de para-lamas altos.
    fastback: {
      half: 2.5, axleF: -1.5, axleR: 1.43, wheelR: 0.36, archR: 0.405, track: 0.81, width: 1.95, height: 1.4,
      yTop: [[-2.5, 0.54], [-2.46, 0.6], [-2.3, 0.66], [-1.9, 0.74], [-1.5, 0.8], [-1.0, 0.9], [-0.6, 1.14], [-0.2, 1.33], [0.2, 1.4], [0.8, 1.385], [1.3, 1.3], [1.8, 1.13], [2.2, 0.97], [2.4, 0.9], [2.47, 0.84], [2.5, 0.76]],
      ySh: [[-2.5, 0.54], [-2.42, 0.6], [-2.2, 0.67], [-1.5, 0.79], [-1.0, 0.88], [-0.2, 0.93], [0.8, 0.95], [1.43, 0.95], [2.0, 0.9], [2.3, 0.86], [2.5, 0.76]],
      yBot: [[-2.5, 0.38], [-2.46, 0.28], [-2.3, 0.19], [-2.05, 0.15], [2.0, 0.15], [2.25, 0.21], [2.42, 0.3], [2.5, 0.42]],
      wSh: [[-2.5, 0.3], [-2.485, 0.5], [-2.43, 0.66], [-2.3, 0.8], [-2.0, 0.9], [-1.5, 0.955], [-0.8, 0.94], [0.2, 0.94], [1.0, 0.96], [1.43, 0.985], [1.9, 0.975], [2.25, 0.9], [2.4, 0.8], [2.47, 0.68], [2.5, 0.5]],
      wRoof: [[-1.0, 0.78], [-0.4, 0.66], [0.2, 0.6], [1.0, 0.59], [1.8, 0.56]],
      fender: [[-2.5, 0], [-2.38, 0.03], [-2.15, 0.07], [-1.5, 0.065], [-1.1, 0.03], [-0.9, 0], [2.5, 0]],
      cabin: [-1.05, -0.7, 1.35, 2.0], inset: [0.075, 0.08, 0.6, 1.43],
      sideGlass: [-0.62, 1.52], rake: [0.22, 0.52], pillars: [0.42],
      top: [[-0.95, -0.18, 'glass'], [0.95, 1.72, 'glass']],
      front: 'round', lampX: -2.14, bladeR: 2.26, seams: [-0.72, 0.42, 1.2], handle: [0.2, 0.33], mirrorX: -0.6, mirror: 'espelho',
      trim: [-0.6, 1.5], tail: 'paint', exhaust: true, wheel: 'turbina',
    },
    // SUV cupê: carroceria alta, teto que cai atrás, soleira escura mais grossa.
    suv: {
      half: 2.465, axleF: -1.46, axleR: 1.44, wheelR: 0.385, archR: 0.435, track: 0.84, width: 1.98, height: 1.665,
      yTop: [[-2.465, 0.78], [-2.42, 0.86], [-2.25, 0.93], [-1.46, 1.0], [-0.95, 1.05], [-0.5, 1.38], [-0.05, 1.63], [0.5, 1.665], [1.1, 1.63], [1.6, 1.5], [2.05, 1.3], [2.3, 1.2], [2.465, 1.12]],
      ySh: [[-2.465, 0.78], [-2.4, 0.83], [-2.2, 0.9], [-1.46, 0.99], [-0.95, 1.02], [0.3, 1.05], [1.44, 1.08], [2.0, 1.06], [2.3, 1.03], [2.465, 1.0]],
      yBot: [[-2.465, 0.52], [-2.42, 0.4], [-2.25, 0.29], [-2.0, 0.24], [1.95, 0.24], [2.25, 0.32], [2.4, 0.44], [2.465, 0.56]],
      wSh: [[-2.465, 0.4], [-2.45, 0.6], [-2.38, 0.78], [-2.2, 0.9], [-1.9, 0.96], [-1.46, 0.99], [-0.5, 0.975], [0.5, 0.98], [1.44, 1.0], [1.9, 0.985], [2.25, 0.93], [2.4, 0.82], [2.465, 0.66]],
      wRoof: [[-0.98, 0.84], [-0.3, 0.7], [0.3, 0.64], [1.2, 0.63], [2.0, 0.62]],
      fender: [[-2.465, 0], [-2.35, 0.025], [-2.1, 0.055], [-1.46, 0.05], [-1.1, 0.02], [-0.95, 0], [2.465, 0]],
      cabin: [-1.0, -0.62, 1.85, 2.3], inset: [0.07, 0.03, 0.9, 1.44],
      sideGlass: [-0.6, 1.9], rake: [0.2, 0.34], pillars: [0.2, 1.08],
      top: [[-0.98, -0.1, 'glass'], [1.25, 2.05, 'glass']],
      front: 'round', lampX: -2.1, bladeR: 2.06, seams: [-0.64, 0.2, 1.08], handle: [-0.05, 0.1], mirrorX: -0.6, mirror: 'espelho',
      trim: [-0.5, 1.8], tail: 'paint', exhaust: true, wheel: 'turbina',
    },
  };

  // compila as listas de pontos em funções
  Object.keys(PRESETS).forEach(k => {
    const p = PRESETS[k];
    ['yTop', 'ySh', 'yBot', 'wSh', 'wRoof', 'fender'].forEach(c => { p[c] = curve(p[c]); });
    const [a, b, c, d] = p.cabin, [i0, i1, ia, ib] = p.inset;
    p.cabin = x => sstep(a, b, x) * (1 - sstep(c, d, x));
    p.wGlass = x => p.wSh(x) - (i0 + i1 * sstep(ia, ib, x));
    p.id = k;
  });

  const COUNTS = [3, 4, 4, 6, 6, 4, 5, 10, 10];     // amostras por trecho da seção
  const M = COUNTS.reduce((a, b) => a + b, 0);       // 52 trechos por meia seção
  const S_SILL = 11, S_GLASS = 32, S_TOP = 42;       // onde começam lateral, vidro e teto

  // Seção transversal em x: pontos-chave [z, y] do meio do assoalho até o meio do teto.
  function sectionKeys(P, x) {
    const yb = P.yBot(x), ys = P.ySh(x), yt = P.yTop(x), w = P.wSh(x), c = P.cabin(x), f = P.fender(x);
    const mix = (a, b) => [lerp(a[0], b[0], c), lerp(a[1], b[1], c)];
    const k = clamp((ys - yb) / 0.62, 0.2, 1);       // a soleira afina onde a carroceria é baixa (ponta e cauda)
    return [
      [0, yb],
      [w * 0.78, yb],
      [w * 0.94, yb + 0.035 * k],
      [w * 0.985, yb + 0.13 * k],
      [w, yb + (ys - yb) * 0.55],
      [w * 0.985, ys - 0.035],
      [w * 0.95, ys],
      mix([w * 0.74, ys + f + (yt - ys) * (f > 0 ? 0 : 0.25) + 0.004], [P.wGlass(x), ys + 0.012]),   // crista do para-lama | base do vidro
      mix([w * 0.44, lerp(yt, ys + f, f > 0 ? 0.22 : 0.2)], [P.wRoof(x), yt - 0.05]),                // capô | borda do teto
      [0, yt],
    ];
  }
  function crPoint(p0, p1, p2, p3, t) {              // Catmull-Rom centrípeta
    const d = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-4;
    const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
    const tt = t1 + (t2 - t1) * t;
    const L = (a, b, ta, tb) => { const k = (tt - ta) / (tb - ta); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
    const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
    return L(L(A1, A2, t0, t2), L(A2, A3, t1, t3), t1, t2);
  }
  function halfSection(P, x) {
    const k = sectionKeys(P, x), n = k.length, out = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = i === 0 ? [-k[1][0], k[1][1]] : k[i - 1];
      const p3 = i === n - 2 ? [-k[n - 2][0], k[n - 2][1]] : k[i + 2];
      for (let j = 0; j < COUNTS[i]; j++) out.push(crPoint(p0, k[i], k[i + 1], p3, j / COUNTS[i]));
    }
    out.push(k[n - 1]);
    return out;
  }
  // Ponto da superfície em (x, s) com s contado em trechos da meia seção; lado = +1 ou -1.
  function surface(P, x, s, side, off) {
    const h = halfSection(P, x), i = clamp(Math.floor(s), 0, M - 1), f = s - i;
    const a = h[i], b = h[i + 1];
    const z = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
    const nz = b[1] - a[1], ny = -(b[0] - a[0]), nl = Math.hypot(nz, ny) || 1;
    return new T.Vector3(x, y + ny / nl * (off || 0), (z + nz / nl * (off || 0)) * side);
  }

  // Recorta as caixas de roda no shader: descarta o que cai dentro do círculo do arco.
  function cutArches(mat, P) {
    mat.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocalPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocalPos = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocalPos;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          if (abs(vLocalPos.z) > 0.5) {
            vec2 a = vLocalPos.xy - vec2(${P.axleF.toFixed(3)}, ${P.wheelR.toFixed(3)});
            vec2 b = vLocalPos.xy - vec2(${P.axleR.toFixed(3)}, ${P.wheelR.toFixed(3)});
            if (dot(a, a) < ${(P.archR * P.archR).toFixed(4)} || dot(b, b) < ${(P.archR * P.archR).toFixed(4)}) discard;
          }`);
    };
    mat.customProgramCacheKey = () => 'arch-' + P.id;      // cada carroceria tem o seu recorte
    return mat;
  }

  // Pintura: além do recorte dos arcos, pinta os vidros por pixel a partir de (s, x).
  // Assim as janelas têm bordas lisas e inclinadas, sem depender da malha.
  function paintShader(mat, P) {
    const tops = P.top.filter(t => t[2] === 'glass'), rake = P.rake || [0, 0];
    const uni = {
      uSide: { value: new T.Vector4(P.sideGlass[0], P.sideGlass[1], rake[0], rake[1]) },
      uTop: { value: new T.Vector4(tops[0] ? tops[0][0] : 9, tops[0] ? tops[0][1] : 9, tops[1] ? tops[1][0] : 9, tops[1] ? tops[1][1] : 9) },
      uPillar: { value: new T.Vector2(P.pillars[0] !== undefined ? P.pillars[0] : 99, P.pillars[1] !== undefined ? P.pillars[1] : 99) },
    };
    mat.extensions = { derivatives: true };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, uni);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocalPos;\nattribute vec2 aSX;\nvarying vec2 vSX;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocalPos = position;\nvSX = aSX;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocalPos;\nvarying vec2 vSX;\nuniform vec4 uSide;\nuniform vec4 uTop;\nuniform vec2 uPillar;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          if (abs(vLocalPos.z) > 0.5) {
            vec2 a = vLocalPos.xy - vec2(${P.axleF.toFixed(3)}, ${P.wheelR.toFixed(3)});
            vec2 b = vLocalPos.xy - vec2(${P.axleR.toFixed(3)}, ${P.wheelR.toFixed(3)});
            if (dot(a, a) < ${(P.archR * P.archR).toFixed(4)} || dot(b, b) < ${(P.archR * P.archR).toFixed(4)}) discard;
          }`)
        .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
          {
            float gk_sC = vSX.x, gk_xC = vSX.y;
            float gk_ax = fwidth(gk_xC) * 1.2 + 0.0015, gk_as = fwidth(gk_sC) * 1.2 + 0.01;
            float gk_t = clamp((gk_sC - ${S_GLASS}.0) / 8.0, 0.0, 1.0);
            float gk_inS = smoothstep(${S_GLASS}.55 - gk_as, ${S_GLASS}.55 + gk_as, gk_sC) * (1.0 - smoothstep(${S_TOP - 3}.7 - gk_as, ${S_TOP - 3}.7 + gk_as, gk_sC));
            float gk_xf = uSide.x + uSide.z * gk_t, gk_xr = uSide.y - uSide.w * gk_t * gk_t;
            float gk_side = gk_inS * smoothstep(gk_xf - gk_ax, gk_xf + gk_ax, gk_xC) * (1.0 - smoothstep(gk_xr - gk_ax, gk_xr + gk_ax, gk_xC));
            float gk_inT = smoothstep(${S_TOP + 2}.0 - gk_as, ${S_TOP + 2}.0 + gk_as, gk_sC);
            float gk_r1 = smoothstep(uTop.x - gk_ax, uTop.x + gk_ax, gk_xC) * (1.0 - smoothstep(uTop.y - gk_ax, uTop.y + gk_ax, gk_xC));
            float gk_r2 = smoothstep(uTop.z - gk_ax, uTop.z + gk_ax, gk_xC) * (1.0 - smoothstep(uTop.w - gk_ax, uTop.w + gk_ax, gk_xC));
            float gk_glassK = max(gk_side, gk_inT * max(gk_r1, gk_r2));
            float gk_pil = gk_side * (1.0 - smoothstep(0.022, 0.022 + gk_ax * 2.0, min(abs(gk_xC - uPillar.x), abs(gk_xC - uPillar.y))));
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.0035, 0.0045, 0.0065), gk_glassK);
            roughnessFactor = mix(roughnessFactor, mix(0.1, 0.5, gk_pil), gk_glassK);
            metalnessFactor = mix(metalnessFactor, mix(0.9, 0.15, gk_pil), gk_glassK);
          }`);
    };
    mat.customProgramCacheKey = () => 'paint-' + P.id;
    return mat;
  }

  function buildBody(P, mats) {
    const N = 170;                                   // estações ao longo do comprimento
    const loop = 2 * M + 1;
    const pos = new Float32Array(N * loop * 3 + 6);
    const sx = new Float32Array(N * loop * 2 + 4);       // por vértice: posição na seção (s) e ao longo do carro (x)
    const xs = [];
    for (let i = 0; i < N; i++) {
      const x = -P.half * Math.cos(Math.PI * i / (N - 1));   // mais estações nas pontas arredondadas
      xs.push(x);
      const h = halfSection(P, x);
      for (let j = 0; j < loop; j++) {
        const p = j <= M ? h[j] : h[2 * M - j], o = (i * loop + j) * 3;
        pos[o] = x; pos[o + 1] = p[1]; pos[o + 2] = j <= M ? p[0] : -p[0];
        sx[(i * loop + j) * 2] = j <= M ? j : 2 * M - j; sx[(i * loop + j) * 2 + 1] = x;
      }
    }
    const idx = { paint: [], glass: [], trim: [] };
    for (let i = 0; i < N - 1; i++) {
      const xm = (xs[i] + xs[i + 1]) / 2;
      let top = null;
      for (const t of P.top) if (xm > t[0] && xm < t[1]) top = t[2];
      for (let j = 0; j < loop - 1; j++) {
        const s = j < M ? j : 2 * M - 1 - j;
        let m = 'paint';                                  // os vidros são desenhados no shader da pintura (bordas lisas)
        if (s < S_SILL) m = 'trim';
        else if (top === 'grille' && s >= S_TOP + 4 && (i % 3)) m = 'trim';                                                    // grade do motor, em lâminas
        const a = i * loop + j, b = a + 1, c = a + loop, d = c + 1;
        idx[m].push(a, c, b, b, c, d);
      }
    }
    // tampas da ponta e da cauda
    const cap = (i, cx, sign) => {
      const ci = (N * loop) + (sign < 0 ? 0 : 1), o = ci * 3;
      pos[o] = cx; pos[o + 1] = (P.yBot(cx) + P.yTop(cx)) / 2; pos[o + 2] = 0;
      sx[ci * 2] = 20; sx[ci * 2 + 1] = cx;
      const into = sign > 0 && P.tail === 'glass' ? idx.glass : idx.paint;
      for (let j = 0; j < loop - 1; j++) {
        const a = i * loop + j, b = a + 1;
        if (sign < 0) into.push(ci, a, b); else into.push(ci, b, a);
      }
    };
    cap(0, -P.half, -1); cap(N - 1, P.half, 1);

    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('aSX', new T.BufferAttribute(sx, 2));
    geo.setIndex([].concat(idx.paint, idx.glass, idx.trim));
    geo.addGroup(0, idx.paint.length, 0);
    geo.addGroup(idx.paint.length, idx.glass.length, 1);
    geo.addGroup(idx.paint.length + idx.glass.length, idx.trim.length, 2);
    geo.computeVertexNormals();
    // a costura no meio do assoalho duplica vértices: iguala as normais para não marcar
    const nor = geo.attributes.normal;
    for (let i = 0; i < N; i++) {
      const a = i * loop, b = a + loop - 1;
      const nx = nor.getX(a) + nor.getX(b), ny = nor.getY(a) + nor.getY(b), nl = Math.hypot(nx, ny) || 1;
      nor.setXYZ(a, nx / nl, ny / nl, 0); nor.setXYZ(b, nx / nl, ny / nl, 0);
    }
    const body = new T.Mesh(geo, [mats.paint, mats.glass, mats.trim]);
    const liner = new T.Mesh(geo, mats.liner);       // avesso preto: nada de luz vazando por dentro
    return { body, liner };
  }

  function tubeAlong(points, radius, mat) {
    const c = new T.CatmullRomCurve3(points, false, 'centripetal');
    return new T.Mesh(new T.TubeGeometry(c, Math.max(24, points.length * 4), radius, 6, false), mat);
  }

  // Lâmina de luz que contorna a ponta (frente) ou a cauda (traseira), de para-lama a para-lama.
  function lightBlade(P, front, mat) {
    const pts = [], x0 = front ? P.bladeF : P.bladeR, x1 = front ? -P.half : P.half, n = 16;
    const at = (x, side) => surface(P, x, 25.4, side, 0.004);
    for (let i = 0; i <= n; i++) pts.push(at(lerp(x0, x1, Math.pow(i / n, 0.8)), 1));
    const tip = at(x1, 1), o = front ? -1 : 1;
    pts.push(new T.Vector3(x1 + o * 0.012, tip.y, tip.z * 0.5), new T.Vector3(x1 + o * 0.016, tip.y, 0), new T.Vector3(x1 + o * 0.012, tip.y, -tip.z * 0.5));
    for (let i = n; i >= 0; i--) pts.push(at(lerp(x0, x1, Math.pow(i / n, 0.8)), -1));
    const mesh = tubeAlong(pts, front ? 0.013 : 0.015, mat);
    // coordenada 0 (centro) → 1 (pontas), para acender do meio para fora
    const p = mesh.geometry.attributes.position, zmax = Math.abs(pts[0].z);
    const u = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      const along = Math.abs(p.getX(i) - x1) / Math.abs(x0 - x1);
      u[i] = clamp(0.5 * Math.abs(p.getZ(i)) / zmax + 0.5 * along, 0, 1);
    }
    mesh.geometry.setAttribute('aU', new T.BufferAttribute(u, 1));
    return mesh;
  }

  // Material das luzes: cor "apagada" e "acesa", com revelação conforme a coordenada aU.
  function lightMaterial(on, off) {
    const mat = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    mat.userData.u = { uOn: { value: 1 }, uColOn: { value: new T.Color(on).convertSRGBToLinear() }, uColOff: { value: new T.Color(off).convertSRGBToLinear() }, uGain: { value: 1 } };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, mat.userData.u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aU;\nvarying float vU;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvU = aU;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vU;\nuniform float uOn;\nuniform float uGain;\nuniform vec3 uColOn;\nuniform vec3 uColOff;')
        .replace('#include <map_fragment>', '#include <map_fragment>\nfloat lit = 1.0 - smoothstep(uOn - 0.04, uOn + 0.001, vU);\ndiffuseColor.rgb = mix(uColOff, uColOn * uGain, lit);');
    };
    return mat;
  }

  // Base apoiada na superfície em (x, s): posição + orientação com o eixo Y saindo da lataria.
  function frameOn(P, x, s, side, sink) {
    const p = surface(P, x, s, side, 0), px = surface(P, x + 0.03, s, side, 0), ps = surface(P, x, s + 0.6, side, 0);
    const tx = px.sub(p).normalize(), ts = ps.sub(p).normalize();
    let n = new T.Vector3().crossVectors(tx, ts).normalize();
    if (n.y < 0) n.negate();
    const tz = new T.Vector3().crossVectors(tx, n).normalize();
    const m = new T.Matrix4().makeBasis(tx, n, tz);
    return { pos: p.addScaledVector(n, -(sink || 0)), quat: new T.Quaternion().setFromRotationMatrix(m) };
  }

  // Farol oval embutido na crista do para-lama, com quatro pontos de luz.
  function roundLamps(P, mats, car) {
    for (const side of [1, -1]) {
      const f = frameOn(P, P.lampX, S_GLASS + 0.2, side, 0.046);
      if (side > 0) car.userData.lamp = [f.pos.x, f.pos.y + 0.05, f.pos.z];
      const bezel = new T.Mesh(new T.SphereGeometry(1, 32, 20), mats.chrome);
      bezel.scale.set(0.212, 0.058, 0.142); bezel.position.copy(f.pos); bezel.quaternion.copy(f.quat); car.add(bezel);
      const lens = new T.Mesh(new T.SphereGeometry(1, 32, 20), mats.lens);
      lens.scale.set(0.196, 0.07, 0.128); lens.position.copy(f.pos); lens.quaternion.copy(f.quat); car.add(lens);
      const dots = [[-0.085, -0.046, 0], [-0.085, 0.046, 0.25], [0.07, -0.046, 0.5], [0.07, 0.046, 0.75]];
      for (const [dx, dz, u] of dots) {
        const g = new T.SphereGeometry(0.02, 12, 8);
        g.setAttribute('aU', new T.BufferAttribute(new Float32Array(g.attributes.position.count).fill(u), 1));
        const d = new T.Mesh(g, mats.front);
        d.position.set(dx, 0.052, dz * side).applyQuaternion(f.quat).add(f.pos); car.add(d);
      }
    }
  }

  function buildWheel(mats, style) {
    const g = new T.Group(), spin = new T.Group();
    g.add(spin);
    const lathe = (pts, mat, seg) => { const geo = new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg || 56); geo.rotateX(Math.PI / 2); return new T.Mesh(geo, mat); };
    spin.add(lathe([[0.25, -0.14], [0.3, -0.142], [0.334, -0.13], [0.351, -0.1], [0.355, -0.04], [0.355, 0.04], [0.351, 0.1], [0.334, 0.13], [0.3, 0.142], [0.25, 0.14]], mats.tyre));
    spin.add(lathe([[0.25, 0.14], [0.262, 0.136], [0.262, 0.118], [0.243, 0.108], [0.236, 0.0], [0.243, -0.12], [0.255, -0.135]], mats.rim));
    const barrel = new T.Mesh(new T.CylinderGeometry(0.236, 0.236, 0.2, 40, 1, true), mats.rimDark);
    barrel.geometry.rotateX(Math.PI / 2); barrel.material.side = T.DoubleSide; barrel.position.z = -0.02;
    spin.add(barrel);

    const faces = { turbina: new T.Group(), disco: new T.Group(), cinco: new T.Group() };
    const spokes = (group, n, gap, width) => {
      for (let i = 0; i < n; i++) for (const da of [-gap, gap]) {
        const arm = new T.Group(); arm.rotation.z = i / n * Math.PI * 2 + da;
        const sp = new T.Mesh(new T.BoxGeometry(0.2, width, 0.022), mats.rim);
        sp.position.set(0.148, 0, 0.084); sp.rotation.y = -0.26;
        arm.add(sp); group.add(arm);
      }
      const hubGeo = new T.CylinderGeometry(0.062, 0.07, 0.05, 32); hubGeo.rotateX(Math.PI / 2);
      const hub = new T.Mesh(hubGeo, mats.rim); hub.position.z = 0.056; group.add(hub);
    };
    spokes(faces.turbina, 10, 0.085, 0.017);          // dez pares de raios finos
    spokes(faces.cinco, 5, 0.15, 0.03);               // cinco raios duplos
    const discGeo = new T.CylinderGeometry(0.243, 0.243, 0.012, 56); discGeo.rotateX(Math.PI / 2);
    const disc = new T.Mesh(discGeo, mats.rimDark); disc.position.z = 0.106; faces.disco.add(disc);
    for (let i = 0; i < 5; i++) {
      const arm = new T.Group(); arm.rotation.z = i / 5 * Math.PI * 2;
      const slot = new T.Mesh(new T.BoxGeometry(0.12, 0.03, 0.006), mats.rim);
      slot.position.set(0.15, 0, 0.114); arm.add(slot); faces.disco.add(arm);
    }
    const ring = new T.Mesh(new T.TorusGeometry(0.243, 0.006, 8, 56), mats.rim); ring.position.z = 0.112; faces.disco.add(ring);
    for (const k in faces) { faces[k].visible = k === style; spin.add(faces[k]); }
    const capGeo = new T.CylinderGeometry(0.034, 0.034, 0.012, 24); capGeo.rotateX(Math.PI / 2);
    const cap = new T.Mesh(capGeo, mats.chrome); cap.position.z = 0.118; spin.add(cap);
    const rotorGeo = new T.CylinderGeometry(0.19, 0.19, 0.022, 40); rotorGeo.rotateX(Math.PI / 2);
    const rotor = new T.Mesh(rotorGeo, mats.rotor); rotor.position.z = 0.01; spin.add(rotor);
    const caliper = new T.Mesh(new T.BoxGeometry(0.1, 0.17, 0.07), mats.caliper);
    caliper.position.set(-0.155, 0.02, 0.02); g.add(caliper);
    g._spin = spin; g._faces = faces;
    return g;
  }

  const col = hex => new T.Color(hex).convertSRGBToLinear();   // o three r128 não converte sRGB sozinho

  function build(presetId, opts) {
    const P = PRESETS[presetId] || PRESETS.coupe911;
    const o = Object.assign({ color: 0x15344a, wheel: P.wheel, wing: false, exhaust: P.exhaust }, opts);
    const mats = {
      paint: paintShader(new T.MeshPhysicalMaterial({ color: col(o.color), metalness: 0.5, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.035, envMapIntensity: 1 }), P),
      glass: new T.MeshStandardMaterial({ color: col(0x0a0d11), metalness: 0.9, roughness: 0.14, envMapIntensity: 0.55 }),
      trim: cutArches(new T.MeshStandardMaterial({ color: col(0x0b0c0e), metalness: 0.35, roughness: 0.42, envMapIntensity: 0.9 }), P),
      liner: cutArches(new T.MeshBasicMaterial({ color: 0x030303, side: T.BackSide }), P),
      well: new T.MeshBasicMaterial({ color: 0x040404, side: T.DoubleSide }),
      chrome: new T.MeshStandardMaterial({ color: col(0xd9d2c2), metalness: 1, roughness: 0.2, envMapIntensity: 1.3 }),
      lens: new T.MeshPhysicalMaterial({ color: col(0x1b1f24), metalness: 0.85, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.3 }),
      seam: new T.MeshBasicMaterial({ color: 0x06070a }),
      tyre: new T.MeshStandardMaterial({ color: col(0x0c0c0d), metalness: 0, roughness: 0.88, envMapIntensity: 0.5 }),
      rim: new T.MeshStandardMaterial({ color: col(0x9a9da1), metalness: 1, roughness: 0.34, envMapIntensity: 1 }),
      rimDark: new T.MeshStandardMaterial({ color: col(0x1b1d20), metalness: 0.9, roughness: 0.42, envMapIntensity: 1 }),
      rotor: new T.MeshStandardMaterial({ color: col(0x5c5f63), metalness: 1, roughness: 0.5 }),
      caliper: new T.MeshStandardMaterial({ color: col(0xb08a4e), metalness: 0.5, roughness: 0.4 }),
      front: lightMaterial(0xfff6e6, 0x23262b),
      rear: lightMaterial(0xff1c24, 0x2a0608),
    };
    const car = new T.Group();
    const { body, liner } = buildBody(P, mats);
    car.add(liner, body);

    // caixas de roda: meia volta escura por trás de cada arco
    for (const ax of [P.axleF, P.axleR]) for (const side of [1, -1]) {
      const geo = new T.CylinderGeometry(P.archR + 0.004, P.archR + 0.004, 0.4, 28, 1, true, Math.PI / 2, Math.PI); geo.rotateX(Math.PI / 2);
      const w = new T.Mesh(geo, mats.well); w.position.set(ax, P.wheelR, side * 0.68); car.add(w);
      const d = new T.Mesh(new T.CircleGeometry(P.archR + 0.004, 28, 0, Math.PI), mats.well); d.position.set(ax, P.wheelR, side * 0.48); car.add(d);
    }

    for (const side of [1, -1]) {
      // friso da linha dos vidros
      const pts = [];
      for (let x = P.trim[0]; x <= P.trim[1] + 1e-4; x += 0.08) pts.push(surface(P, x, S_GLASS + 0.05, side, 0.004));
      car.add(tubeAlong(pts, 0.0065, mats.chrome));
      // juntas das portas
      for (const sx of P.seams) {
        const sp = [];
        for (let s = S_SILL + 0.4; s <= 27; s += 1.2) sp.push(surface(P, sx + (s - 19) * 0.004, s, side, 0.0015));
        car.add(tubeAlong(sp, 0.0032, mats.seam));
      }
      // maçaneta embutida
      const hx = P.handle, hm = (hx[0] + hx[1]) / 2;
      car.add(tubeAlong([surface(P, hx[0], 24.6, side, 0.003), surface(P, hm, 24.6, side, 0.003), surface(P, hx[1], 24.6, side, 0.003)], 0.006, mats.chrome));
      // retrovisor (ou câmera, no GT)
      const big = P.mirror === 'espelho';
      const base = surface(P, P.mirrorX, 30.5, side, 0);
      const pod = new T.Mesh(new T.SphereGeometry(1, 20, 14), mats.paint);
      pod.scale.set(big ? 0.105 : 0.075, big ? 0.04 : 0.028, big ? 0.06 : 0.04);
      pod.position.set(base.x, base.y + (big ? 0.052 : 0.04), base.z + side * (big ? 0.095 : 0.07)); car.add(pod);
      const stalk = new T.Mesh(new T.BoxGeometry(big ? 0.05 : 0.03, 0.012, big ? 0.11 : 0.09), mats.trim);
      stalk.position.set(base.x + 0.005, base.y + (big ? 0.03 : 0.034), base.z + side * (big ? 0.04 : 0.03)); car.add(stalk);
      // ponteira de escape
      if (o.exhaust) {
        const eg = new T.CylinderGeometry(0.036, 0.036, 0.1, 18); eg.rotateZ(Math.PI / 2);
        const e = new T.Mesh(eg, mats.rimDark); e.position.set(P.half - 0.07, P.yBot(P.half - 0.1) + 0.045, side * P.wSh(P.half - 0.1) * 0.5); car.add(e);
      }
    }

    // luzes
    let rear = null;
    if (P.front === 'round') roundLamps(P, mats, car);
    else car.add(lightBlade(P, true, mats.front));
    rear = lightBlade(P, false, mats.rear);
    car.add(rear);

    // asa fixa (versões esportivas)
    if (o.wing) {
      const wx = P.half - 0.42, wy = P.yTop(wx) + 0.17, span = P.wSh(wx) * 0.86;
      const blade = new T.Mesh(new T.BoxGeometry(0.26, 0.018, span * 2), mats.paint);
      blade.position.set(wx, wy, 0); blade.rotation.z = -0.1; car.add(blade);
      for (const side of [1, -1]) {
        const post = new T.Mesh(new T.BoxGeometry(0.16, 0.17, 0.02), mats.trim);
        post.position.set(wx - 0.02, wy - 0.085, side * span * 0.55); car.add(post);
        const end = new T.Mesh(new T.BoxGeometry(0.3, 0.07, 0.014), mats.paint);
        end.position.set(wx, wy + 0.01, side * span); end.rotation.z = -0.1; car.add(end);
      }
    }

    const wheels = [], k = P.wheelR / 0.355;
    for (const ax of [P.axleF, P.axleR]) for (const side of [1, -1]) {
      const w = buildWheel(mats, o.wheel);
      w.scale.setScalar(k);
      w.position.set(ax, P.wheelR, side * P.track);
      if (side < 0) w.rotation.y = Math.PI;
      w._side = side;
      car.add(w); wheels.push(w);
    }

    // Pintura sólida (vermelho, amarelo, branco) quase não tem metal e reflete menos o estúdio,
    // senão a cor lava. A metálica fica mais espelhada.
    const paintState = { hex: o.color, solid: false };
    const applyPaint = () => {
      const m = mats.paint, s = paintState.solid;
      m.color.copy(col(paintState.hex));
      if (s) m.color.multiplyScalar(0.8);
      m.metalness = s ? 0.1 : 0.5; m.roughness = s ? 0.38 : 0.4; m.clearcoat = s ? 0.6 : 1;
      m.userData.envBase = s ? 0.5 : 1;
    };

    // Reflexo no piso: uma cópia espelhada em y. Os nós que giram ou trocam de visibilidade são pareados pela ordem.
    const tracked = [];
    wheels.forEach(w => { tracked.push(w._spin); for (const f in w._faces) tracked.push(w._faces[f]); });
    const order = [];
    car.traverse(n => order.push(n));
    const mirror = car.clone(true);
    mirror.scale.y = -1;
    const mOrder = [];
    mirror.traverse(n => mOrder.push(n));
    const pairs = tracked.map(n => [n, mOrder[order.indexOf(n)]]);
    const sync = () => { for (const [a, b] of pairs) { b.rotation.z = a.rotation.z; b.visible = a.visible; } };

    return {
      preset: P, group: car, mirror, mats, wheels,
      lamp: car.userData.lamp || [-P.half, P.height * 0.5, P.wSh(-P.half + 0.3) * 0.7],    // posição do farol esquerdo
      dims: dimsOf(P),
      setWheel(style) { wheels.forEach(w => { for (const f in w._faces) w._faces[f].visible = f === style; }); sync(); },
      spin(angle) { wheels.forEach(w => { w._spin.rotation.z = -angle * w._side; }); sync(); },
      setColor(hex) { paintState.hex = hex; applyPaint(); },
      setFinish(solid) { paintState.solid = !!solid; applyPaint(); },
      setVisible(v) { car.visible = v; mirror.visible = v; },
      lights: { front: mats.front.userData.u, rear: mats.rear.userData.u },
    };
  }

  const dimsOf = P => ({ length: P.half * 2, wheelbase: P.axleR - P.axleF, height: P.height, width: P.width, axleF: P.axleF, axleR: P.axleR, wheelR: P.wheelR, archR: P.archR, half: P.half });

  window.AlvorCar = {
    build,
    dims: id => dimsOf(PRESETS[id] || PRESETS.coupe911),
    preset: id => PRESETS[id] || PRESETS.coupe911,       // curvas já compiladas, para desenhar a silhueta em SVG
    presets: Object.keys(PRESETS),
  };
})();
