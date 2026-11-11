/* ==========================================================================
   Alvor Lume — o carro, modelado em código.
   Não há arquivo de malha: a carroceria é um "loft" de seções transversais
   ao longo do comprimento, guiado por quatro curvas (teto, ombro, assoalho e
   largura). As mesmas curvas desenham a vista lateral da ficha técnica.
   Unidades em metros. Frente do carro em -x, chão em y = 0.
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

  /* ----- as quatro curvas do desenho ----- */
  const HALF = 2.46;                                 // meio comprimento: 4,92 m
  const AXLE_F = -1.58, AXLE_R = 1.48, WHEEL_R = 0.355, ARCH_R = 0.4, TRACK = 0.822;

  const yTop = curve([[-2.46, 0.61], [-2.42, 0.66], [-2.3, 0.715], [-2.05, 0.775], [-1.58, 0.835], [-0.9, 0.885], [-0.3, 1.14], [0.25, 1.31], [0.6, 1.325], [1.1, 1.245], [1.6, 1.085], [2.0, 0.975], [2.3, 0.915], [2.46, 0.885]]);
  const ySh = curve([[-2.46, 0.61], [-2.4, 0.635], [-2.25, 0.675], [-2.05, 0.73], [-1.58, 0.865], [-0.9, 0.87], [0.2, 0.88], [1.0, 0.9], [1.48, 0.95], [2.0, 0.925], [2.3, 0.9], [2.46, 0.875]]);
  const yBot = curve([[-2.46, 0.42], [-2.42, 0.33], [-2.3, 0.24], [-2.05, 0.18], [-1.85, 0.16], [1.85, 0.16], [2.2, 0.24], [2.38, 0.37], [2.46, 0.5]]);
  const wSh = curve([[-2.46, 0.12], [-2.45, 0.3], [-2.42, 0.47], [-2.34, 0.66], [-2.18, 0.83], [-1.9, 0.93], [-1.58, 0.97], [-1.0, 0.955], [-0.2, 0.95], [0.6, 0.955], [1.2, 0.985], [1.48, 1.0], [1.9, 0.975], [2.2, 0.9], [2.36, 0.8], [2.43, 0.66], [2.46, 0.5]]);
  const wRoof = curve([[-0.95, 0.8], [-0.3, 0.665], [0.3, 0.6], [0.9, 0.595], [1.5, 0.62], [2.1, 0.7]]);
  const cabin = x => sstep(-0.98, -0.62, x) * (1 - sstep(1.35, 2.1, x));
  const haunch = x => Math.exp(-Math.pow((x - 1.48) / 0.55, 2));
  const wGlass = x => wSh(x) - (0.085 + 0.05 * haunch(x));

  // Seção transversal em x: pontos-chave [z, y] do meio do assoalho até o meio do teto.
  function sectionKeys(x) {
    const yb = yBot(x), ys = ySh(x), yt = yTop(x), w = wSh(x), c = cabin(x);
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
      mix([w * 0.8, ys + (yt - ys) * 0.25 + 0.004], [wGlass(x), ys + 0.012]),
      mix([w * 0.45, ys + (yt - ys) * 0.8], [wRoof(x), yt - 0.05]),
      [0, yt],
    ];
  }
  const COUNTS = [3, 4, 4, 6, 6, 4, 5, 10, 10];     // amostras por trecho da seção
  const M = COUNTS.reduce((a, b) => a + b, 0);       // 52 trechos por meia seção
  const S_SILL = 11, S_GLASS = 32, S_TOP = 42;       // onde começam lateral, vidro e teto

  function crPoint(p0, p1, p2, p3, t) {              // Catmull-Rom centrípeta
    const d = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-4;
    const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
    const tt = t1 + (t2 - t1) * t;
    const L = (a, b, ta, tb) => { const k = (tt - ta) / (tb - ta); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
    const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
    return L(L(A1, A2, t0, t2), L(A2, A3, t1, t3), t1, t2);
  }
  function halfSection(x) {
    const k = sectionKeys(x), n = k.length, out = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = i === 0 ? [-k[1][0], k[1][1]] : k[i - 1];
      const p3 = i === n - 2 ? [-k[n - 2][0], k[n - 2][1]] : k[i + 2];
      for (let j = 0; j < COUNTS[i]; j++) out.push(crPoint(p0, k[i], k[i + 1], p3, j / COUNTS[i]));
    }
    out.push(k[n - 1]);
    return out;
  }
  // Ponto da superfície em (x, s) com s contado em trechos da meia seção; lado = +1 ou -1.
  function surface(x, s, side, off) {
    const h = halfSection(x), i = clamp(Math.floor(s), 0, M - 1), f = s - i;
    const a = h[i], b = h[i + 1];
    const z = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
    const nz = b[1] - a[1], ny = -(b[0] - a[0]), nl = Math.hypot(nz, ny) || 1;
    return new T.Vector3(x, y + ny / nl * (off || 0), (z + nz / nl * (off || 0)) * side);
  }

  // Recorta as caixas de roda no shader: descarta o que cai dentro do círculo do arco.
  function cutArches(mat) {
    mat.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocalPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocalPos = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocalPos;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          if (abs(vLocalPos.z) > 0.5) {
            vec2 a = vLocalPos.xy - vec2(${AXLE_F.toFixed(3)}, ${WHEEL_R.toFixed(3)});
            vec2 b = vLocalPos.xy - vec2(${AXLE_R.toFixed(3)}, ${WHEEL_R.toFixed(3)});
            if (dot(a, a) < ${(ARCH_R * ARCH_R).toFixed(4)} || dot(b, b) < ${(ARCH_R * ARCH_R).toFixed(4)}) discard;
          }`);
    };
    return mat;
  }

  function buildBody(mats) {
    const N = 170;                                   // estações ao longo do comprimento
    const loop = 2 * M + 1;
    const pos = new Float32Array(N * loop * 3 + 6);
    const xs = [];
    for (let i = 0; i < N; i++) {
      const x = -HALF * Math.cos(Math.PI * i / (N - 1));   // mais estações nas pontas arredondadas
      xs.push(x);
      const h = halfSection(x);
      for (let j = 0; j < loop; j++) {
        const p = j <= M ? h[j] : h[2 * M - j], o = (i * loop + j) * 3;
        pos[o] = x; pos[o + 1] = p[1]; pos[o + 2] = j <= M ? p[0] : -p[0];
      }
    }
    const idx = { paint: [], glass: [], trim: [] };
    for (let i = 0; i < N - 1; i++) {
      const xm = (xs[i] + xs[i + 1]) / 2, inCab = cabin(xm) > 0.5;
      for (let j = 0; j < loop - 1; j++) {
        const s = j < M ? j : 2 * M - 1 - j;
        let m = 'paint';
        if (s < S_SILL) m = 'trim';
        else if (s >= S_GLASS && s < S_TOP - 2 && xm > -0.52 && xm < 1.56) m = 'glass';      // vidro lateral
        else if (s >= S_TOP + 2 && inCab) m = 'glass';                                       // arco de vidro: para-brisa, teto e vigia
        const a = i * loop + j, b = a + 1, c = a + loop, d = c + 1;
        idx[m].push(a, c, b, b, c, d);
      }
    }
    // tampas da ponta e da cauda
    const cap = (i, cx, sign) => {
      const ci = (N * loop) + (sign < 0 ? 0 : 1), o = ci * 3;
      pos[o] = cx; pos[o + 1] = (yBot(cx) + yTop(cx)) / 2; pos[o + 2] = 0;
      for (let j = 0; j < loop - 1; j++) {
        const a = i * loop + j, b = a + 1;
        if (sign < 0) idx.paint.push(ci, a, b); else idx.glass.push(ci, b, a);
      }
    };
    cap(0, -HALF, -1); cap(N - 1, HALF, 1);

    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const all = [].concat(idx.paint, idx.glass, idx.trim);
    geo.setIndex(all);
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

  function tubeAlong(points, radius, mat, closed) {
    const c = new T.CatmullRomCurve3(points, !!closed, 'centripetal');
    return new T.Mesh(new T.TubeGeometry(c, Math.max(24, points.length * 4), radius, 6, !!closed), mat);
  }

  // Lâmina de luz que contorna a ponta (frente) ou a cauda (traseira), de para-lama a para-lama.
  function lightBlade(front, mat) {
    const pts = [], x0 = front ? -2.1 : 2.04, x1 = front ? -HALF : HALF, n = 16;
    const at = (x, side) => surface(x, 25.4, side, 0.004);
    for (let i = 0; i <= n; i++) pts.push(at(lerp(x0, x1, Math.pow(i / n, 0.8)), 1));
    const tip = at(x1, 1);
    pts.push(new T.Vector3(x1 + (front ? -0.012 : 0.012), tip.y, tip.z * 0.5), new T.Vector3(x1 + (front ? -0.016 : 0.016), tip.y, 0), new T.Vector3(x1 + (front ? -0.012 : 0.012), tip.y, -tip.z * 0.5));
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

  // Material das lâminas: cor "apagada" e "acesa", com revelação do centro para as pontas.
  function bladeMaterial(on, off) {
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

  function buildWheel(mats, style) {
    const g = new T.Group(), spin = new T.Group();
    g.add(spin);
    const lathe = (pts, mat, seg) => { const geo = new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg || 56); geo.rotateX(Math.PI / 2); return new T.Mesh(geo, mat); };
    spin.add(lathe([[0.25, -0.14], [0.3, -0.142], [0.334, -0.13], [0.351, -0.1], [0.355, -0.04], [0.355, 0.04], [0.351, 0.1], [0.334, 0.13], [0.3, 0.142], [0.25, 0.14]], mats.tyre));
    spin.add(lathe([[0.25, 0.14], [0.262, 0.136], [0.262, 0.118], [0.243, 0.108], [0.236, 0.0], [0.243, -0.12], [0.255, -0.135]], mats.rim));
    const barrel = new T.Mesh(new T.CylinderGeometry(0.236, 0.236, 0.2, 40, 1, true), mats.rimDark);
    barrel.geometry.rotateX(Math.PI / 2); barrel.material.side = T.DoubleSide; barrel.position.z = -0.02;
    spin.add(barrel);

    const faces = { turbina: new T.Group(), disco: new T.Group() };
    // Turbina: dez pares de raios finos, levemente côncavos
    for (let i = 0; i < 10; i++) {
      for (const da of [-0.085, 0.085]) {
        const arm = new T.Group(); arm.rotation.z = i / 10 * Math.PI * 2 + da;
        const sp = new T.Mesh(new T.BoxGeometry(0.2, 0.017, 0.022), mats.rim);
        sp.position.set(0.148, 0, 0.084); sp.rotation.y = -0.26;
        arm.add(sp); faces.turbina.add(arm);
      }
    }
    const hubGeo = new T.CylinderGeometry(0.062, 0.07, 0.05, 32); hubGeo.rotateX(Math.PI / 2);
    const hub = new T.Mesh(hubGeo, mats.rim); hub.position.z = 0.056; faces.turbina.add(hub);
    // Disco: calota aerodinâmica com cinco rasgos
    const discGeo = new T.CylinderGeometry(0.243, 0.243, 0.012, 56); discGeo.rotateX(Math.PI / 2);
    const disc = new T.Mesh(discGeo, mats.rimDark); disc.position.z = 0.106; faces.disco.add(disc);
    for (let i = 0; i < 5; i++) {
      const arm = new T.Group(); arm.rotation.z = i / 5 * Math.PI * 2;
      const slot = new T.Mesh(new T.BoxGeometry(0.12, 0.03, 0.006), mats.rim);
      slot.position.set(0.15, 0, 0.114); arm.add(slot); faces.disco.add(arm);
    }
    const ringGeo = new T.TorusGeometry(0.243, 0.006, 8, 56);
    const ring = new T.Mesh(ringGeo, mats.rim); ring.position.z = 0.112; faces.disco.add(ring);
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

  function build(opts) {
    const o = Object.assign({ color: 0x15344a, wheel: 'turbina' }, opts);
    const mats = {
      paint: cutArches(new T.MeshPhysicalMaterial({ color: col(o.color), metalness: 0.5, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.035, envMapIntensity: 1 })),
      glass: new T.MeshStandardMaterial({ color: col(0x0a0d11), metalness: 0.9, roughness: 0.14, envMapIntensity: 0.55 }),
      trim: cutArches(new T.MeshStandardMaterial({ color: col(0x0b0c0e), metalness: 0.35, roughness: 0.42, envMapIntensity: 0.9 })),
      liner: cutArches(new T.MeshBasicMaterial({ color: 0x030303, side: T.BackSide })),
      well: new T.MeshBasicMaterial({ color: 0x040404, side: T.DoubleSide }),
      chrome: new T.MeshStandardMaterial({ color: col(0xd9d2c2), metalness: 1, roughness: 0.2, envMapIntensity: 1.3 }),
      seam: new T.MeshBasicMaterial({ color: 0x06070a }),
      tyre: new T.MeshStandardMaterial({ color: col(0x0c0c0d), metalness: 0, roughness: 0.88, envMapIntensity: 0.5 }),
      rim: new T.MeshStandardMaterial({ color: col(0x9a9da1), metalness: 1, roughness: 0.34, envMapIntensity: 1 }),
      rimDark: new T.MeshStandardMaterial({ color: col(0x1b1d20), metalness: 0.9, roughness: 0.42, envMapIntensity: 1 }),
      rotor: new T.MeshStandardMaterial({ color: col(0x5c5f63), metalness: 1, roughness: 0.5 }),
      caliper: new T.MeshStandardMaterial({ color: col(0xb08a4e), metalness: 0.5, roughness: 0.4 }),
      front: bladeMaterial(0xfff6e6, 0x23262b),
      rear: bladeMaterial(0xff1c24, 0x2a0608),
    };
    const car = new T.Group();
    const { body, liner } = buildBody(mats);
    car.add(liner, body);

    // caixas de roda: tubo escuro por trás de cada arco
    for (const ax of [AXLE_F, AXLE_R]) for (const side of [1, -1]) {
      // só a metade de cima: abaixo do assoalho não existe caixa de roda
      const geo = new T.CylinderGeometry(ARCH_R + 0.004, ARCH_R + 0.004, 0.4, 28, 1, true, Math.PI / 2, Math.PI); geo.rotateX(Math.PI / 2);
      const w = new T.Mesh(geo, mats.well); w.position.set(ax, WHEEL_R, side * 0.68); car.add(w);
      const dg = new T.CircleGeometry(ARCH_R + 0.004, 28, 0, Math.PI);
      const d = new T.Mesh(dg, mats.well); d.position.set(ax, WHEEL_R, side * 0.48); car.add(d);
    }

    // friso da linha dos vidros, juntas das portas e maçanetas embutidas
    for (const side of [1, -1]) {
      const pts = [];
      for (let x = -0.56; x <= 1.6001; x += 0.08) pts.push(surface(x, S_GLASS + 0.05, side, 0.004));
      car.add(tubeAlong(pts, 0.0065, mats.chrome));
      for (const sx of [-0.62, 0.72]) {
        const sp = [];
        for (let s = S_SILL + 0.4; s <= 27; s += 1.2) sp.push(surface(sx + (s - 19) * 0.004, s, side, 0.0015));
        car.add(tubeAlong(sp, 0.0032, mats.seam));
      }
      const hp = [surface(0.44, 24.6, side, 0.003), surface(0.52, 24.6, side, 0.003), surface(0.6, 24.6, side, 0.003)];
      car.add(tubeAlong(hp, 0.006, mats.chrome));
      // câmera lateral no lugar do retrovisor
      const pod = new T.Mesh(new T.SphereGeometry(1, 20, 14), mats.paint);
      const base = surface(-0.66, 30.5, side, 0);
      pod.scale.set(0.075, 0.028, 0.04); pod.position.set(base.x, base.y + 0.04, base.z + side * 0.07); car.add(pod);
      const stalk = new T.Mesh(new T.BoxGeometry(0.03, 0.012, 0.09), mats.trim);
      stalk.position.set(base.x + 0.005, base.y + 0.034, base.z + side * 0.03); car.add(stalk);
    }

    const front = lightBlade(true, mats.front), rear = lightBlade(false, mats.rear);
    car.add(front, rear);

    const wheels = [];
    for (const ax of [AXLE_F, AXLE_R]) for (const side of [1, -1]) {
      const w = buildWheel(mats, o.wheel);
      w.position.set(ax, WHEEL_R, side * TRACK);
      if (side < 0) w.rotation.y = Math.PI;
      w._side = side;
      car.add(w); wheels.push(w);
    }

    // Reflexo no piso: uma cópia espelhada em y. Os nós que giram ou trocam de visibilidade são pareados pela ordem.
    const tracked = [];
    wheels.forEach(w => { tracked.push(w._spin); for (const k in w._faces) tracked.push(w._faces[k]); });
    const order = [];
    car.traverse(n => order.push(n));
    const mirror = car.clone(true);
    mirror.scale.y = -1;
    const mOrder = [];
    mirror.traverse(n => mOrder.push(n));
    const pairs = tracked.map(n => [n, mOrder[order.indexOf(n)]]);
    const sync = () => { for (const [a, b] of pairs) { b.rotation.z = a.rotation.z; b.visible = a.visible; } };

    return {
      group: car, mirror, mats, wheels,
      setWheel(style) { wheels.forEach(w => { for (const k in w._faces) w._faces[k].visible = k === style; }); sync(); },
      spin(angle) { wheels.forEach(w => { w._spin.rotation.z = -angle * w._side; }); sync(); },
      setColor(hex) { mats.paint.color.copy(col(hex)); },
      lights: { front: mats.front.userData.u, rear: mats.rear.userData.u },
    };
  }

  window.AlvorCar = {
    build,
    dims: { length: HALF * 2, wheelbase: AXLE_R - AXLE_F, height: 1.325, width: 2.0, axleF: AXLE_F, axleR: AXLE_R, wheelR: WHEEL_R, archR: ARCH_R, half: HALF },
    profile: { yTop, ySh, yBot, wSh },
  };
})();
