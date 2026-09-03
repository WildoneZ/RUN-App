/* Monterey of AVIEW — Residence 5A first-person walkthrough
 * Plain Three.js (UMD r160). Everything is generated from js/house.js.
 */
(function () {
  'use strict';
  const H = window.HOUSE;
  const { LEVELS, CLEAR, ROOMS, WALLS, STAIRS, BALUSTRADES, SLABS, PERGOLAS, SCREENS, FURNITURE, START, TOUR, RENDERS } = H;
  const Z = (y) => -y; // plan y (north) → three.js z

  /* ================================================================ RENDERER */
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfe0ea);
  scene.fog = new THREE.FogExp2(0xd9e4ea, 0.0075);
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 600);

  /* ================================================================ TEXTURES */
  const loadBar = document.querySelector('#loading .bar i');
  const setProgress = (p) => { loadBar.style.width = (p * 100).toFixed(0) + '%'; };

  function canvasTex(size, draw, rep, opts = {}) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'); draw(g, size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
    if (!opts.linear) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  const lerp = (a, b, t) => a + (b - a) * t;
  const hsl = (h, s, l) => `hsl(${h},${s}%,${l}%)`;

  function noise(g, size, alpha, n = 4000, light = true) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = `rgba(${light ? 255 : 0},${light ? 255 : 0},${light ? 255 : 0},${alpha * rnd()})`;
      g.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 3, 1 + rnd() * 3);
    }
  }

  // Herringbone oak (Oggie engineered oak). Tile = 4 bands, plank L=4W.
  const texOak = canvasTex(1024, (g, S) => {
    g.fillStyle = '#c9ad84'; g.fillRect(0, 0, S, S);
    const B = S / 4, W = S / (8 * Math.SQRT2), L = 4 * W, sp = S / 8;
    for (let k = -1; k <= 4; k++) {
      const ang = (k % 2 === 0) ? Math.PI / 4 : -Math.PI / 4;
      const off = (k % 2 === 0) ? 0 : sp / 2;
      for (let i = -2; i < 10; i++) {
        const cx = k * B + B / 2, cy = i * sp + off;
        g.save(); g.translate(cx, cy); g.rotate(ang);
        const l = 36 + rnd() * 10, s = 30 + rnd() * 10;
        g.fillStyle = hsl(34, s, 60 + rnd() * 12);
        g.fillRect(-L / 2 - 1, -W / 2, L + 2, W);
        // grain
        g.strokeStyle = `rgba(90,60,30,${0.10 + rnd() * 0.12})`; g.lineWidth = 1;
        for (let q = 0; q < 6; q++) { const yy = -W / 2 + (q + 0.5) * W / 6; g.beginPath(); g.moveTo(-L / 2, yy + rnd() * 2); g.bezierCurveTo(-L / 6, yy + rnd() * 4 - 2, L / 6, yy + rnd() * 4 - 2, L / 2, yy + rnd() * 2); g.stroke(); }
        g.strokeStyle = 'rgba(70,45,25,0.45)'; g.lineWidth = 1.2; g.strokeRect(-L / 2, -W / 2, L, W);
        g.restore();
      }
    }
  }, [1, 1]);
  const texOakRough = canvasTex(256, (g, S) => { g.fillStyle = '#8c8c8c'; g.fillRect(0, 0, S, S); noise(g, S, 0.2, 1500); }, [1, 1], { linear: true });

  const texMarble = canvasTex(1024, (g, S) => {
    g.fillStyle = '#efece6'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(${95 + rnd() * 40},${95 + rnd() * 40},${100 + rnd() * 40},${0.12 + rnd() * 0.35})`;
      g.lineWidth = 0.6 + rnd() * 3.2;
      g.beginPath(); let x = rnd() * S, y = rnd() * S; g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { const nx = x + (rnd() - 0.5) * 300, ny = y + (rnd() - 0.5) * 300; g.bezierCurveTo(x + (rnd() - 0.5) * 120, y + (rnd() - 0.5) * 120, nx + (rnd() - 0.5) * 120, ny + (rnd() - 0.5) * 120, nx, ny); x = nx; y = ny; }
      g.stroke();
    }
    g.globalAlpha = 0.5; for (let i = 0; i < 8; i++) { g.strokeStyle = 'rgba(160,150,140,0.35)'; g.lineWidth = 12 + rnd() * 20; g.beginPath(); g.moveTo(rnd() * S, rnd() * S); g.lineTo(rnd() * S, rnd() * S); g.stroke(); } g.globalAlpha = 1;
    noise(g, S, 0.08, 6000);
  }, [1, 1]);

  const texConcrete = canvasTex(512, (g, S) => {
    g.fillStyle = '#b3aea6'; g.fillRect(0, 0, S, S); noise(g, S, 0.18, 9000); noise(g, S, 0.12, 5000, false);
    g.strokeStyle = 'rgba(70,65,60,0.35)'; g.lineWidth = 1.5; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(0, i * S / 2); g.lineTo(S, i * S / 2); g.stroke(); g.beginPath(); g.moveTo(i * S / 2, 0); g.lineTo(i * S / 2, S); g.stroke(); }
    for (let i = 0; i < 24; i++) { g.fillStyle = 'rgba(60,55,50,0.45)'; g.beginPath(); g.arc(rnd() * S, rnd() * S, 2 + rnd() * 2, 0, 7); g.fill(); }
  }, [1, 1]);

  const texStone = canvasTex(512, (g, S) => {
    g.fillStyle = '#d5cbbc'; g.fillRect(0, 0, S, S); noise(g, S, 0.16, 6000); noise(g, S, 0.08, 3000, false);
    g.strokeStyle = 'rgba(120,110,95,0.6)'; g.lineWidth = 2; g.strokeRect(1, 1, S - 2, S - 2);
    g.beginPath(); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke();
  }, [1, 1]);

  const texDeck = canvasTex(512, (g, S) => {
    const n = 6, w = S / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = hsl(28, 32 + rnd() * 10, 42 + rnd() * 12); g.fillRect(i * w, 0, w, S);
      g.strokeStyle = 'rgba(60,40,25,0.35)'; for (let k = 0; k < 14; k++) { g.beginPath(); g.moveTo(i * w + rnd() * w, 0); g.lineTo(i * w + rnd() * w, S); g.stroke(); }
      g.fillStyle = 'rgba(30,20,10,0.8)'; g.fillRect(i * w, 0, 2, S);
    }
  }, [1, 1]);

  const texLawn = canvasTex(512, (g, S) => { g.fillStyle = '#6e9645'; g.fillRect(0, 0, S, S); for (let i = 0; i < 9000; i++) { g.fillStyle = hsl(95 + rnd() * 25, 40 + rnd() * 20, 30 + rnd() * 22); g.fillRect(rnd() * S, rnd() * S, 2, 3 + rnd() * 3); } }, [1, 1]);

  const texPaver = canvasTex(512, (g, S) => {
    g.fillStyle = '#9b958c'; g.fillRect(0, 0, S, S); const n = 8, w = S / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { g.fillStyle = hsl(30, 6 + rnd() * 6, 58 + rnd() * 16); g.fillRect(i * w + 2, j * w + 2, w - 4, w - 4); }
    noise(g, S, 0.1, 4000, false);
  }, [1, 1]);

  const texWood = (hue, sat, light) => canvasTex(512, (g, S) => {
    g.fillStyle = hsl(hue, sat, light); g.fillRect(0, 0, S, S);
    for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(0,0,0,${0.05 + rnd() * 0.12})`; g.lineWidth = 0.5 + rnd() * 1.5; g.beginPath(); const x = rnd() * S; g.moveTo(x, 0); g.bezierCurveTo(x + rnd() * 12 - 6, S / 3, x + rnd() * 12 - 6, 2 * S / 3, x + rnd() * 6 - 3, S); g.stroke(); }
    noise(g, S, 0.05, 2000);
  }, [1, 1]);
  const texDarkOak = texWood(24, 28, 26), texTaupe = texWood(30, 18, 60), texLightTimber = texWood(32, 38, 66), texWalnut = texWood(22, 35, 34);
  const texScreed = canvasTex(512, (g, S) => { g.fillStyle = '#a6a39d'; g.fillRect(0, 0, S, S); noise(g, S, 0.1, 5000); noise(g, S, 0.07, 3000, false); }, [1, 1]);
  const texWater = canvasTex(512, (g, S) => {
    g.fillStyle = '#5aa7c0'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(255,255,255,${0.15 + rnd() * 0.3})`; g.lineWidth = 1 + rnd() * 3; g.beginPath(); let x = rnd() * S, y = rnd() * S; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 120; y += (rnd() - 0.5) * 120; g.lineTo(x, y); } g.stroke(); }
  }, [1, 1]);
  const texFabric = canvasTex(256, (g, S) => { g.fillStyle = '#d9d1c3'; g.fillRect(0, 0, S, S); noise(g, S, 0.12, 4000); noise(g, S, 0.08, 4000, false); }, [1, 1]);

  /* ================================================================ MATERIALS */
  const std = (p) => new THREE.MeshStandardMaterial(p);
  const withMap = (tex, scale, p = {}) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(scale[0], scale[1]); return std(Object.assign({ map: t, roughness: 0.8 }, p)); };
  const M = {
    plaster: std({ color: 0xece7de, roughness: 0.92 }),
    plasterWarm: std({ color: 0xd9d0c4, roughness: 0.92 }),
    plasterExt: std({ color: 0xf1ede5, roughness: 0.9 }),
    ceiling: std({ color: 0xf1ede6, roughness: 0.95 }),
    concrete: std({ map: texConcrete, roughness: 0.9 }),
    oak: std({ map: texOak, roughnessMap: texOakRough, roughness: 0.55, metalness: 0.02 }),
    marble: std({ map: texMarble, roughness: 0.18, metalness: 0.02 }),
    stone: std({ map: texStone, roughness: 0.6 }),
    deck: std({ map: texDeck, roughness: 0.8 }),
    lawn: std({ map: texLawn, roughness: 1 }),
    paver: std({ map: texPaver, roughness: 0.95 }),
    screed: std({ map: texScreed, roughness: 0.7, metalness: 0.05 }),
    darkOak: std({ map: texDarkOak, roughness: 0.55 }),
    taupe: std({ map: texTaupe, roughness: 0.6 }),
    timber: std({ map: texLightTimber, roughness: 0.75 }),
    walnut: std({ map: texWalnut, roughness: 0.5 }),
    bronze: std({ color: 0x4a3b2c, roughness: 0.45, metalness: 0.75 }),
    brass: std({ color: 0xc09a5a, roughness: 0.3, metalness: 0.9 }),
    black: std({ color: 0x1e1c1a, roughness: 0.5, metalness: 0.4 }),
    white: std({ color: 0xf6f4ef, roughness: 0.35 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xd6e6ea, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
    glassTint: new THREE.MeshPhysicalMaterial({ color: 0x9fb8bd, roughness: 0.05, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
    mirror: std({ color: 0xdfe6ea, roughness: 0.02, metalness: 0.95 }),
    fabric: std({ map: texFabric, roughness: 0.95 }),
    fabricGrey: std({ color: 0x9a948a, roughness: 0.95 }),
    olive: std({ color: 0x6b7350, roughness: 0.9 }),
    linen: std({ color: 0xe8e2d6, roughness: 0.95 }),
    rugGrey: std({ color: 0x9d9587, roughness: 1 }),
    hedge: std({ color: 0x3f6b35, roughness: 1 }),
    leaf: std({ color: 0x4f8a3c, roughness: 0.9 }),
    trunk: std({ color: 0x5c4a3a, roughness: 1 }),
    water: std({ map: texWater, color: 0x8fd0e6, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85 }),
    poolFloor: std({ color: 0xbfe1ea, roughness: 0.6 }),
    stoneWall: std({ map: texStone, color: 0xb9b0a2, roughness: 0.9 }),
    soil: std({ color: 0x4e3f31, roughness: 1 }),
    emissive: std({ color: 0xfff1d6, emissive: 0xffe2b0, emissiveIntensity: 2.2, roughness: 0.4 }),
    fire: std({ color: 0xff8a3a, emissive: 0xff6a1a, emissiveIntensity: 3, roughness: 1 }),
    art1: std({ color: 0x7c8a5a, roughness: 0.9 }), art2: std({ color: 0xb9a68a, roughness: 0.9 }), art3: std({ color: 0x8a6a4a, roughness: 0.6, metalness: 0.4 }),
    car: std({ color: 0x8a8d90, roughness: 0.35, metalness: 0.6 }),
  };
  M.plaster.side = THREE.DoubleSide;

  /* ================================================================ WORLD */
  const world = new THREE.Group(); scene.add(world);
  const colliders = []; // {x0,x1,z0,z1,y0,y1}
  const patches = [];   // walkable {x0,x1,z0,z1,y} or ramps {ramp:true, ...}
  const roomsByLevel = {};
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);

  function addBox(w, h, d, mat, cx, cy, cz, o = {}) {
    const m = new THREE.Mesh(o.geo || boxGeo, mat);
    m.scale.set(w, h, d); m.position.set(cx, cy, cz);
    if (o.rot) m.rotation.y = o.rot;
    m.castShadow = o.shadow !== false; m.receiveShadow = true;
    (o.parent || world).add(m);
    if (o.collide) {
      let hw = w / 2, hd = d / 2;
      if (o.rot) { const c = Math.abs(Math.cos(o.rot)), s = Math.abs(Math.sin(o.rot)); const nw = hw * c + hd * s, nd = hw * s + hd * c; hw = nw; hd = nd; }
      colliders.push({ x0: cx - hw, x1: cx + hw, z0: cz - hd, z1: cz + hd, y0: cy - h / 2, y1: cy + h / 2 });
    }
    return m;
  }
  // plan-space helper: box from x0..x1, y0..y1 (north), yBottom..yTop
  function pbox(x0, y0, x1, y1, yb, yt, mat, o = {}) {
    return addBox(x1 - x0, yt - yb, y1 - y0, mat, (x0 + x1) / 2, (yb + yt) / 2, Z((y0 + y1) / 2), o);
  }
  function plane(x0, y0, x1, y1, yLevel, mat, up = true, o = {}) {
    const w = x1 - x0, d = y1 - y0;
    const g = new THREE.PlaneGeometry(w, d);
    const m = new THREE.Mesh(g, mat);
    m.rotation.x = up ? -Math.PI / 2 : Math.PI / 2;
    m.position.set((x0 + x1) / 2, yLevel, Z((y0 + y1) / 2));
    m.receiveShadow = true; m.castShadow = false;
    (o.parent || world).add(m);
    return m;
  }
  // per-material texture scaling: material clones with repeats matching real-world size
  const matCache = {};
  function scaledMat(key, w, d) {
    const per = { oak: 1.4, marble: 2.0, concrete: 2.4, stone: 1.2, deck: 0.9, lawn: 3, paver: 1.6, screed: 3, darkOak: 1.2, taupe: 1.2, timber: 1.0, walnut: 1.2, water: 3, stoneWall: 1.2 }[key];
    if (!per) return M[key];
    const rx = Math.max(0.25, +(w / per).toFixed(2)), ry = Math.max(0.25, +(d / per).toFixed(2));
    const k = key + ':' + rx + ':' + ry;
    if (!matCache[k]) { const m = M[key].clone(); m.map = M[key].map.clone(); m.map.needsUpdate = true; m.map.repeat.set(rx, ry); if (m.roughnessMap) { m.roughnessMap = m.roughnessMap.clone(); m.roughnessMap.needsUpdate = true; m.roughnessMap.repeat.set(rx, ry); } matCache[k] = m; }
    return matCache[k];
  }

  /* ---------------- rooms: floors, ceilings, walkable patches */
  function buildRooms() {
    for (const r of ROOMS) {
      const [x0, y0, x1, y1] = r.rect; const base = LEVELS[r.level];
      (roomsByLevel[r.level] = roomsByLevel[r.level] || []).push(r);
      if (r.stair && r.level === 0) { /* stair footprint has no floor plate of its own */ }
      else if (!r.stair) plane(x0, y0, x1, y1, base + (r.outside ? 0.004 : 0.008), scaledMat(r.floor, x1 - x0, y1 - y0));
      if (!r.stair && !(r.level === 1 && r.id === 'stairvoid')) patches.push({ x0, x1, z0: Z(y1), z1: Z(y0), y: base, room: r });
      const h = r.h || CLEAR[r.level];
      if (r.ceil && !r.outside) plane(x0, y0, x1, y1, base + h - 0.001, r.ceil === 'concrete' ? scaledMat('concrete', x1 - x0, y1 - y0) : M.ceiling, false);
      if (r.ceil && r.outside) plane(x0, y0, x1, y1, base + h - 0.001, M.plasterExt, false);
    }
    // stair-void floor plate at first floor level for the arrival strip only (y 7.9..8.3 handled by entrance)
  }

  /* ---------------- walls with openings */
  function buildWall(level, x0, y0, x1, y1, t, opts) {
    const base = LEVELS[level], h = opts.h || CLEAR[level];
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L;      // along
    const nx = -uy, ny = ux;             // normal (left of direction)
    const ang = Math.atan2(uy, ux);      // plan angle
    const rot = ang;                     // three rotation.y for a box aligned with +x is angle about Y: plan angle a → rotation.y = a (since z = -y)
    const seg = (a, b, yb, yt, mat, collide = true, depth = t) => {
      const cx = x0 + ux * (a + b) / 2, cy = y0 + uy * (a + b) / 2;
      addBox(b - a, yt - yb, depth, mat || M.plaster, cx, (yb + yt) / 2, Z(cy), { rot, collide });
    };
    const ops = (opts.openings || []).slice().sort((p, q) => p.at - q.at);
    let cursor = 0;
    const wallMat = level === 0 && (opts.ext) ? M.plasterExt : M.plaster;
    for (const op of ops) {
      if (op.at > cursor) seg(cursor, op.at, base, base + h, wallMat);
      const head = op.head || h, sill = op.sill || 0;
      if (sill > 0) seg(op.at, op.at + op.w, base, base + sill, wallMat);
      if (head < h) seg(op.at, op.at + op.w, base + head, base + h, wallMat, false);
      // fittings
      const cxA = (a) => x0 + ux * a, cyA = (a) => y0 + uy * a;
      const midX = cxA(op.at + op.w / 2), midY = cyA(op.at + op.w / 2);
      const frameMat = M.bronze;
      if (op.type === 'door') {
        // frame
        seg(op.at - 0.03, op.at + 0.03, base, base + head, frameMat, false, t + 0.02);
        seg(op.at + op.w - 0.03, op.at + op.w + 0.03, base, base + head, frameMat, false, t + 0.02);
        seg(op.at, op.at + op.w, base + head - 0.03, base + head + 0.03, frameMat, false, t + 0.02);
        if (op.threshold !== false) seg(op.at, op.at + op.w, base, base + 0.012, M.bronze, false, t);
        // leaf, swung open 90° about the hinge
        const hingeA = op.hinge === 'end' ? op.at + op.w : op.at;
        const hx = cxA(hingeA), hy = cyA(hingeA);
        const swing = op.swing || 1;           // +1 → leaf swings toward the wall's normal side
        const dirA = op.hinge === 'end' ? -1 : 1; // leaf extends from the hinge along the wall
        const leafLen = op.w - 0.02;
        const lx = hx + nx * swing * leafLen / 2, ly = hy + ny * swing * leafLen / 2;
        const leafMat = op.glass ? M.glassTint : (op.front ? M.walnut : M.darkOak);
        addBox(0.045, head - 0.02, leafLen, leafMat, lx, base + head / 2, Z(ly), { rot: rot, collide: false });
        // handle
        const handleAt = op.hinge === 'end' ? 0.06 : leafLen - 0.06;
        const hxx = hx + nx * swing * (leafLen - 0.08), hyy = hy + ny * swing * (leafLen - 0.08);
        addBox(0.14, 0.03, 0.03, M.brass, hxx + ux * 0.0, base + 1.05, Z(hyy), { rot: rot + Math.PI / 2, collide: false, shadow: false });
        if (op.front) { // pivot front door: wider, with a tall side light panel
          addBox(0.05, head, 0.02, M.brass, hx + ux * dirA * 0.0, base + head / 2, Z(hy), { collide: false, shadow: false });
        }
      } else if (op.type === 'slide') {
        const n = op.panels || 4, pw = op.w / n;
        const openCount = op.openCount || 1;
        const openIdx = new Set();
        if (op.openFrom === 'end') for (let i = n - 1 - openCount; i >= 0 && i >= n - 2 * openCount; i--) openIdx.add(i); // panels that slid away
        else for (let i = openCount; i < 2 * openCount && i < n; i++) openIdx.add(i);
        // head + threshold tracks
        seg(op.at, op.at + op.w, base + head - 0.05, base + head, frameMat, false, t + 0.02);
        seg(op.at, op.at + op.w, base, base + 0.02, frameMat, false, t + 0.02);
        for (let i = 0; i < n; i++) {
          const a = op.at + i * pw;
          if (openIdx.has(i)) continue; // slid open → gap
          const stacked = (op.openFrom === 'end') ? i >= n - openCount : i < openCount; // stacked panels sit slightly offset in depth
          const off = stacked ? 0.06 : 0;
          const cx = cxA(a + pw / 2) + nx * off, cy = cyA(a + pw / 2) + ny * off;
          addBox(pw - 0.04, head - 0.1, 0.02, M.glass, cx, base + head / 2, Z(cy), { rot, collide: true, shadow: false });
          addBox(0.04, head - 0.06, 0.05, frameMat, cxA(a) + nx * off, base + head / 2, Z(cyA(a) + ny * off), { rot, collide: false, shadow: false });
          addBox(0.04, head - 0.06, 0.05, frameMat, cxA(a + pw) + nx * off, base + head / 2, Z(cyA(a + pw) + ny * off), { rot, collide: false, shadow: false });
          // stacked panels: add a second panel behind, to show the slid ones
          if (stacked) { addBox(pw - 0.04, head - 0.1, 0.02, M.glass, cx - nx * 0.06, base + head / 2, Z(cy - ny * 0.06), { rot, collide: true, shadow: false }); }
        }
      } else if (op.type === 'glass' || op.type === 'window' || op.type === 'slats') {
        const gsill = base + sill, ghead = base + head;
        addBox(op.w, head - sill, 0.02, M.glass, midX, (gsill + ghead) / 2, Z(midY), { rot, collide: true, shadow: false });
        seg(op.at, op.at + op.w, gsill - 0.02, gsill + 0.03, frameMat, false, t + 0.03);
        seg(op.at, op.at + op.w, ghead - 0.03, ghead + 0.02, frameMat, false, t + 0.03);
        seg(op.at - 0.03, op.at + 0.03, gsill, ghead, frameMat, false, t + 0.03);
        seg(op.at + op.w - 0.03, op.at + op.w + 0.03, gsill, ghead, frameMat, false, t + 0.03);
        if (op.type === 'window' && op.w > 2.2) seg(op.at + op.w / 2 - 0.02, op.at + op.w / 2 + 0.02, gsill, ghead, frameMat, false, t + 0.03);
        if (op.type === 'slats') { // exterior timber slat screen (west/east elevations)
          const side = (level >= 1 && x0 < 1) ? -1 : 1; // west wall → outside is -x ... handled by normal sign below
          const outward = (nx < 0 || (Math.abs(nx) < 0.01 && ny < 0)) ? 1 : -1; // approximate: push toward exterior
          for (let s = 0.05; s < op.w; s += 0.12) {
            const cx = cxA(op.at + s), cy = cyA(op.at + s);
            addBox(0.04, head - sill, 0.06, M.timber, cx + nx * outward * (t / 2 + 0.06), (gsill + ghead) / 2, Z(cy + ny * outward * (t / 2 + 0.06)), { rot, collide: false, shadow: false });
          }
        }
      } else if (op.type === 'garage') {
        // raised timber-slat sectional door tucked under the head, plus tracks
        seg(op.at, op.at + op.w, base + head - 0.1, base + head, M.bronze, false, t + 0.02);
        const cx = cxA(op.at + op.w / 2), cy = cyA(op.at + op.w / 2);
        addBox(op.w - 0.1, 0.06, 2.2, M.timber, cx + nx * 1.2, base + head - 0.16, Z(cy + ny * 1.2), { rot, collide: false });
      }
      cursor = op.at + op.w;
    }
    if (cursor < L) seg(cursor, L, base, base + h, wallMat);
  }

  /* ---------------- stairs */
  function buildStairs() {
    for (const s of STAIRS) {
      const { x0, y0, x1, y1 } = s;
      if (s.flat) {
        pbox(x0, y0, x1, y1, s.yBase - 0.22, s.yBase, M.oak);
        patches.push({ x0, x1, z0: Z(y1), z1: Z(y0), y: s.yBase, room: null });
        continue;
      }
      const n = s.risers, rh = s.rise / n;
      const run = (s.dir === 'n' || s.dir === 's') ? (y1 - y0) : (x1 - x0);
      const g = run / n;
      const treadMat = s.outside ? M.stone : M.oak;
      for (let i = 0; i < n; i++) {
        const top = s.yBase + (i + 1) * rh;
        let tx0, ty0, tx1, ty1;
        if (s.dir === 'n') { tx0 = x0; tx1 = x1; ty0 = y0 + i * g; ty1 = ty0 + g; }
        else if (s.dir === 's') { tx0 = x0; tx1 = x1; ty1 = y1 - i * g; ty0 = ty1 - g; }
        else if (s.dir === 'e') { ty0 = y0; ty1 = y1; tx0 = x0 + i * g; tx1 = tx0 + g; }
        else { ty0 = y0; ty1 = y1; tx1 = x1 - i * g; tx0 = tx1 - g; }
        // tread + riser block (closed on the visible side, thin underneath)
        pbox(tx0, ty0, tx1, ty1, top - 0.05, top, treadMat, { collide: false });
        // riser
        if (s.dir === 'n') pbox(tx0, ty0, tx1, ty0 + 0.03, top - rh, top, s.outside ? M.stone : M.plaster, { collide: false });
        if (s.dir === 's') pbox(tx0, ty1 - 0.03, tx1, ty1, top - rh, top, s.outside ? M.stone : M.plaster, { collide: false });
        if (s.dir === 'e') pbox(tx0, ty0, tx0 + 0.03, ty1, top - rh, top, M.plaster, { collide: false });
        if (s.dir === 'w') pbox(tx1 - 0.03, ty0, tx1, ty1, top - rh, top, M.plaster, { collide: false });
      }
      // sloped soffit slab
      const len = Math.hypot(run, s.rise), slope = Math.atan2(s.rise, run);
      const cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2;
      const soffit = new THREE.Mesh(boxGeo, s.outside ? M.stoneWall : M.plaster);
      const wid = (s.dir === 'n' || s.dir === 's') ? (x1 - x0) : (y1 - y0);
      soffit.scale.set((s.dir === 'n' || s.dir === 's') ? wid : len, 0.16, (s.dir === 'n' || s.dir === 's') ? len : wid);
      soffit.position.set(cxm, s.yBase + s.rise / 2 - 0.2, Z(cym));
      if (s.dir === 'n') soffit.rotation.x = slope; if (s.dir === 's') soffit.rotation.x = -slope;
      if (s.dir === 'e') soffit.rotation.z = -slope; if (s.dir === 'w') soffit.rotation.z = slope;
      soffit.castShadow = soffit.receiveShadow = true; world.add(soffit);
      if (!s.outside) { // brass handrail along the flight
        const rail = new THREE.Mesh(cylGeo, M.brass); const railSide = s.railSide || 'x0';
        if (s.dir === 'n' || s.dir === 's') { rail.scale.set(0.02, len, 0.02); rail.position.set(railSide === 'x0' ? x0 + 0.06 : x1 - 0.06, s.yBase + s.rise / 2 + 0.95, Z(cym)); rail.rotation.x = (s.dir === 'n' ? -1 : 1) * (Math.PI / 2 - slope); }
        else { rail.scale.set(0.02, len, 0.02); rail.position.set(cxm, s.yBase + s.rise / 2 + 0.95, Z(railSide === 'x0' ? y0 + 0.06 : y1 - 0.06)); rail.rotation.z = (s.dir === 'e' ? 1 : -1) * (Math.PI / 2 - slope); }
        world.add(rail);
        for (let i = 1; i < n; i += 3) { const top = s.yBase + (i + 0.5) * rh; const py = (s.dir === 'n') ? y0 + (i + 0.5) * g : (s.dir === 's') ? y1 - (i + 0.5) * g : cym; const px = (s.dir === 'n' || s.dir === 's') ? (railSide === 'x0' ? x0 + 0.06 : x1 - 0.06) : x0 + (i + 0.5) * g; addBox(0.02, 0.9, 0.02, M.bronze, px, top + 0.45, Z(py), { collide: false, shadow: false }); }
      }
      patches.push({ ramp: true, x0, x1, z0: Z(y1), z1: Z(y0), dir: s.dir, yBase: s.yBase, rise: s.rise });
    }
  }

  /* ---------------- balustrades, slabs, pergolas, screens */
  function buildBalustrades() {
    for (const [level, x0, y0, x1, y1, type] of BALUSTRADES) {
      const base = LEVELS[level];
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, rot = Math.atan2(uy, ux);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      if (type === 'glass') {
        addBox(L, 1.1, 0.016, M.glass, cx, base + 0.55, Z(cy), { rot, collide: true, shadow: false });
        addBox(L, 0.05, 0.06, M.brass, cx, base + 1.1, Z(cy), { rot, collide: false, shadow: false });
        addBox(L, 0.06, 0.06, M.bronze, cx, base + 0.03, Z(cy), { rot, collide: false, shadow: false });
      } else if (type === 'slats') {
        addBox(L, 0.06, 0.08, M.timber, cx, base + 1.12, Z(cy), { rot, collide: true });
        addBox(L, 0.06, 0.08, M.timber, cx, base + 0.05, Z(cy), { rot, collide: true });
        for (let s = 0.05; s <= L; s += 0.11) addBox(0.04, 1.1, 0.04, M.timber, x0 + ux * s, base + 0.57, Z(y0 + uy * s), { rot, collide: false, shadow: false });
        colliders.push({ x0: Math.min(x0, x1) - 0.04, x1: Math.max(x0, x1) + 0.04, z0: Math.min(Z(y0), Z(y1)) - 0.04, z1: Math.max(Z(y0), Z(y1)) + 0.04, y0: base, y1: base + 1.2 });
      } else if (type === 'planter') {
        addBox(L, 0.55, 0.5, M.plasterExt, cx, base + 0.275, Z(cy), { rot, collide: true });
        addBox(L - 0.1, 0.05, 0.4, M.soil, cx, base + 0.55, Z(cy), { rot, collide: false, shadow: false });
        for (let s = 0.3; s < L; s += 0.5) foliage(x0 + ux * s, y0 + uy * s, base + 0.6, 0.35, 0.7);
      } else if (type === 'wall') {
        addBox(L, 1.2, 0.15, M.plaster, cx, base + 0.6, Z(cy), { rot, collide: true });
      }
    }
  }
  function buildSlabs() {
    for (const [yb, yt, x0, y0, x1, y1] of SLABS) pbox(x0, y0, x1, y1, yb, yt, M.plasterExt, { collide: false, shadow: true });
  }
  function buildPergolas() {
    for (const [yTop, x0, y0, x1, y1, dir] of PERGOLAS) {
      // beams along the edges + slats
      const b = 0.16;
      if (dir === 'x') { // slats run east-west, spaced along y
        pbox(x0, y0, x0 + b, y1, yTop - 0.3, yTop, M.timber); pbox(x1 - b, y0, x1, y1, yTop - 0.3, yTop, M.timber);
        for (let y = y0 + 0.2; y < y1; y += 0.3) pbox(x0, y, x1, y + 0.06, yTop - 0.16, yTop, M.timber, { shadow: true });
      } else {
        pbox(x0, y0, x1, y0 + b, yTop - 0.3, yTop, M.timber); pbox(x0, y1 - b, x1, y1, yTop - 0.3, yTop, M.timber);
        for (let x = x0 + 0.2; x < x1; x += 0.3) pbox(x, y0, x + 0.06, y1, yTop - 0.16, yTop, M.timber, { shadow: true });
      }
    }
    // pergola posts (patio north edge & pool pergola)
    for (const [x, y, yb, yt] of [[3.1, 17.4, 3.4, 9.6], [8.0, 17.4, 3.4, 9.6], [5.5, 17.4, 3.4, 9.6], [8.1, 19.1, 3.4, 6.6], [13.5, 19.1, 3.4, 6.6], [10.8, 19.1, 3.4, 6.6]])
      pbox(x - 0.1, y - 0.1, x + 0.1, y + 0.1, yb, yt, M.plasterExt, { collide: true });
    for (const [x0, y0, x1, y1, yb, yt] of SCREENS) {
      const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, rot = Math.atan2(uy, ux);
      for (let s = 0; s <= L; s += 0.14) addBox(0.05, yt - yb, 0.05, M.timber, x0 + ux * s, (yb + yt) / 2, Z(y0 + uy * s), { rot, collide: false, shadow: false });
      addBox(L, 0.08, 0.08, M.timber, (x0 + x1) / 2, yt, Z((y0 + y1) / 2), { rot, collide: false });
      addBox(L, 0.08, 0.08, M.timber, (x0 + x1) / 2, yb, Z((y0 + y1) / 2), { rot, collide: false });
    }
  }

  /* ---------------- vegetation */
  function foliage(x, y, yb, r, h, mat = M.leaf) {
    const g = new THREE.Group(); g.position.set(x, yb, Z(y));
    const sph = new THREE.SphereGeometry(1, 10, 8);
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(sph, mat); m.scale.set(r * (0.3 + rnd() * 0.3), h * (0.22 + rnd() * 0.25), r * (0.3 + rnd() * 0.3)); m.position.set((rnd() - 0.5) * r * 0.8, h * 0.55 + (rnd() - 0.5) * h * 0.5, (rnd() - 0.5) * r * 0.8); m.castShadow = true; g.add(m); }
    world.add(g); return g;
  }
  function tree(x, y, base, s) {
    addBox(0.25 * s, 3.2 * s, 0.25 * s, M.trunk, x, base + 1.6 * s, Z(y), { collide: true });
    foliage(x, y, base + 2.4 * s, 4.4 * s, 4.0 * s);
  }

  /* ---------------- furniture library */
  const rotY = (deg) => THREE.MathUtils.degToRad(deg);
  function group(x, y, base, rdeg) { const g = new THREE.Group(); g.position.set(x, base, Z(y)); g.rotation.y = rotY(rdeg || 0); world.add(g); return g; }
  // local box inside a group: lx right, ly up, lz "forward"(north when r=0 → local -z)
  function lbox(g, w, h, d, mat, lx, ly, lz, o = {}) {
    const m = new THREE.Mesh(o.geo || boxGeo, mat); m.scale.set(w, h, d); m.position.set(lx, ly, -lz); if (o.rot) m.rotation.y = o.rot; m.castShadow = o.shadow !== false; m.receiveShadow = true; g.add(m);
    if (o.collide !== false && (h > 0.35)) { // world AABB
      g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(m);
      colliders.push({ x0: bb.min.x, x1: bb.max.x, z0: bb.min.z, z1: bb.max.z, y0: bb.min.y, y1: bb.max.y });
    }
    return m;
  }
  const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 24);
  const sphGeo = new THREE.SphereGeometry(1, 20, 14);
  function lcyl(g, r, h, mat, lx, ly, lz, o = {}) { const m = new THREE.Mesh(cylGeo, mat); m.scale.set(r, h, r); m.position.set(lx, ly, -lz); m.castShadow = true; m.receiveShadow = true; g.add(m); if (o.collide) { g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(m); colliders.push({ x0: bb.min.x, x1: bb.max.x, z0: bb.min.z, z1: bb.max.z, y0: bb.min.y, y1: bb.max.y }); } return m; }

  const FURN = {
    bed(f, base) {
      const g = group(f.x, f.y, base, f.r); const w = f.w || 1.8, l = f.len || 2.1;
      lbox(g, w + 0.1, f.low ? 0.3 : 0.32, l + 0.1, M.darkOak, 0, 0.16, 0);           // base
      lbox(g, w, 0.22, l, M.linen, 0, 0.42, 0, { collide: false });                     // mattress
      lbox(g, w - 0.2, 0.08, l * 0.55, M.fabric, 0, 0.55, -l * 0.18, { collide: false }); // throw
      for (let i = 0; i < 2; i++) lbox(g, w * 0.42, 0.14, 0.45, M.white, (i - 0.5) * w * 0.48, 0.6, l * 0.32, { collide: false });
      if (!f.low) { lbox(g, w + 0.4, 1.0, 0.12, M.walnut, 0, 0.5, l / 2 + 0.06); lbox(g, w + 0.3, 0.12, 0.35, M.darkOak, 0, 0.12, l / 2 - 0.1, { collide: false }); }
    },
    sideTable(f, base) { const g = group(f.x, f.y, base, 0); lcyl(g, 0.24, 0.5, M.walnut, 0, 0.25, 0); lcyl(g, 0.1, 0.18, M.brass, 0, 0.59, 0); const s = new THREE.Mesh(sphGeo, M.emissive); s.scale.setScalar(0.09); s.position.set(0, 0.72, 0); g.add(s); },
    sofa(f, base) {
      const g = group(f.x, f.y, base, f.r); const w = f.w || 2.4;
      if (f.curved) { // organic curved sofa (brochure lounge)
        for (let i = 0; i < 7; i++) { const a = (i - 3) / 3 * 0.9; const lx = Math.sin(a) * 1.5, lz = Math.cos(a) * 1.5 - 1.5; lbox(g, 0.65, 0.42, 0.9, M.fabric, lx, 0.21, lz, { rot: -a, collide: i === 3 }); lbox(g, 0.65, 0.45, 0.26, M.fabric, lx - Math.sin(a) * 0.35, 0.6, lz - Math.cos(a) * 0.35, { rot: -a, collide: false }); }
        colliders.push({ x0: f.x - 1.6, x1: f.x + 1.6, z0: Z(f.y) - 0.9, z1: Z(f.y) + 0.9, y0: base, y1: base + 0.8 });
      } else { lbox(g, w, 0.42, 0.9, M.fabric, 0, 0.21, 0); lbox(g, w, 0.4, 0.25, M.fabric, 0, 0.6, -0.33, { collide: false }); lbox(g, 0.25, 0.25, 0.9, M.fabric, -w / 2 + 0.12, 0.55, 0, { collide: false }); lbox(g, 0.25, 0.25, 0.9, M.fabric, w / 2 - 0.12, 0.55, 0, { collide: false }); }
    },
    armchair(f, base) { const g = group(f.x, f.y, base, f.r); const mat = f.olive ? M.olive : (f.rattan ? M.timber : M.fabric); lbox(g, 0.8, 0.4, 0.8, mat, 0, 0.2, 0); lbox(g, 0.8, 0.45, 0.16, mat, 0, 0.62, -0.32, { collide: false }); lbox(g, 0.16, 0.2, 0.8, M.walnut, -0.36, 0.5, 0, { collide: false }); lbox(g, 0.16, 0.2, 0.8, M.walnut, 0.36, 0.5, 0, { collide: false }); },
    readingChair(f, base) { FURN.armchair(Object.assign({}, f, { olive: true }), base); },
    coffeeTable(f, base) { const g = group(f.x, f.y, base, 0); lcyl(g, 0.55, 0.06, M.marble, 0, 0.36, 0); lcyl(g, 0.22, 0.34, M.walnut, 0, 0.17, 0); lcyl(g, 0.35, 0.05, M.walnut, 0.7, 0.28, 0.3); lcyl(g, 0.12, 0.26, M.walnut, 0.7, 0.13, 0.3); },
    rug(f, base) { const g = group(f.x, f.y, base, 0); lbox(g, f.w, 0.015, f.d, std({ color: f.color || 0xa9a094, roughness: 1 }), 0, 0.008, 0, { collide: false, shadow: false }); },
    desk(f, base) {
      const g = group(f.x, f.y, base, f.r); const w = f.w || 2.0;
      lbox(g, w, 0.05, 0.7, M.timber, 0, 0.75, 0); lbox(g, w, 0.12, 0.5, M.timber, 0, 0.66, 0.05, { collide: false });
      if (!f.small) { lbox(g, 0.34, 0.02, 0.24, M.black, 0, 0.78, 0.05, { collide: false }); lbox(g, 0.34, 0.22, 0.01, M.black, 0, 0.9, 0.16, { collide: false }); lcyl(g, 0.07, 0.24, M.glass, -0.8, 0.9, 0.0); }
      else { lbox(g, 0.06, 0.7, 0.06, M.bronze, -w / 2 + 0.05, 0.36, 0.3); lbox(g, 0.06, 0.7, 0.06, M.bronze, w / 2 - 0.05, 0.36, 0.3); }
    },
    chair(f, base) { const g = group(f.x, f.y, base, f.r); lbox(g, 0.55, 0.1, 0.55, M.fabric, 0, 0.46, 0); lbox(g, 0.55, 0.5, 0.1, M.fabric, 0, 0.75, -0.24, { collide: false }); lcyl(g, 0.04, 0.4, M.black, 0, 0.2, 0); lcyl(g, 0.3, 0.03, M.black, 0, 0.02, 0); },
    bookcase(f, base) {
      const g = group(f.x, f.y, base, f.r); const w = f.w || 2, h = f.h || 2.4, mat = f.dark ? M.walnut : M.timber;
      lbox(g, w, h, 0.36, mat, 0, h / 2, 0);
      const rows = Math.floor(h / 0.38);
      for (let r = 0; r < rows; r++) for (let c = 0; c < Math.floor(w / 0.32); c++) {
        const bx = -w / 2 + 0.18 + c * 0.32, by = 0.06 + r * 0.38; if (rnd() > 0.35) lbox(g, 0.2 + rnd() * 0.1, 0.24 + rnd() * 0.08, 0.2, std({ color: [0x8a7a68, 0x5f6b58, 0xb9ad9a, 0x3d3a37, 0xa2745a][Math.floor(rnd() * 5)] }), bx, by + 0.15, 0.06, { collide: false, shadow: false });
      }
      for (let r = 1; r < rows; r++) lbox(g, w - 0.04, 0.03, 0.34, mat, 0, r * 0.38 + 0.02, 0, { collide: false, shadow: false });
    },
    wardrobe(f, base) { const g = group(f.x, f.y, base, f.r); const w = f.w || 2; lbox(g, w, 2.5, 0.6, f.dark ? M.walnut : M.taupe, 0, 1.25, 0); for (let i = 0; i < Math.round(w / 0.5); i++) lbox(g, 0.01, 2.3, 0.02, M.bronze, -w / 2 + 0.5 * i + 0.25, 1.25, 0.31, { collide: false, shadow: false }); },
    console(f, base) { const g = group(f.x, f.y, base, f.r); const w = f.w || 1.6; lbox(g, w, 0.7, 0.45, f.dark ? M.walnut : M.timber, 0, 0.35, 0); lbox(g, 0.36, 0.42, 0.36, M.white, -0.3, 0.9, 0, { collide: false, geo: sphGeo }); lbox(g, 0.5, 0.6, 0.1, M.art1, 0.3, 1.05, -0.1, { collide: false }); },
    plant(f, base) { const s = f.s || 1.2; const g = group(f.x, f.y, base, 0); lcyl(g, 0.22 * s, 0.4 * s, M.white, 0, 0.2 * s, 0, { collide: true }); foliage(f.x, f.y, base + 0.35 * s, 0.6 * s, 1.0 * s); },
    planter(f, base) { const g = group(f.x, f.y, base, 0); lbox(g, f.w, 0.5, f.d, M.plasterExt, 0, 0.25, 0); lbox(g, f.w - 0.1, 0.04, f.d - 0.1, M.soil, 0, 0.5, 0, { collide: false }); for (let s = -f.w / 2 + 0.35; s < f.w / 2; s += 0.6) foliage(f.x + s, f.y, base + 0.5, 0.35, 0.7); },
    art(f, base) {
      const g = group(f.x, f.wallY !== undefined ? f.wallY : f.y, base, f.r); const w = f.w || 1, h = f.h || 0.8, z = f.z || 1.5;
      lbox(g, w, h, 0.04, M.bronze, 0, z, 0.0, { collide: false }); lbox(g, w - 0.06, h - 0.06, 0.01, f.style === 'green' ? M.art1 : (f.style === 'bronze' ? M.art3 : M.art2), 0, z, 0.03, { collide: false, shadow: false });
      if (f.style === 'green') lbox(g, w * 0.4, h * 0.5, 0.005, M.art2, 0, z, 0.035, { collide: false, shadow: false });
    },
    island(f, base) {
      const g = group(f.x, f.y, base, f.r); const w = f.w, l = f.len;
      lbox(g, w, 0.88, l, M.marble, 0, 0.44, 0); lbox(g, w + 0.5, 0.05, l + 0.05, M.marble, 0.25, 0.905, 0, { collide: false });
      lbox(g, 0.55, 0.01, 0.75, M.black, -0.18, 0.935, 0.9, { collide: false, shadow: false }); // gas hob
      for (let i = 0; i < 5; i++) lcyl(g, 0.035, 0.012, M.brass, -0.18 + (i % 3) * 0.18 - 0.18, 0.945, 0.75 + Math.floor(i / 3) * 0.3);
      lcyl(g, 0.02, 0.45, M.brass, 0, 1.1, -1.2); lbox(g, 0.02, 0.02, 0.25, M.brass, 0, 1.33, -1.1, { collide: false });
      lbox(g, 0.4, 0.02, 0.5, M.black, 0, 0.92, -1.3, { collide: false, shadow: false }); // sink
      for (let i = 0; i < 5; i++) { // bar stools (olive)
        const sz = -l / 2 + 0.5 + i * (l - 1) / 4; lcyl(g, 0.02, 0.75, M.walnut, w / 2 + 0.55, 0.37, sz); lbox(g, 0.42, 0.08, 0.42, M.olive, w / 2 + 0.55, 0.78, sz, { collide: false }); lbox(g, 0.42, 0.35, 0.06, M.olive, w / 2 + 0.75, 1.0, sz, { collide: false }); lcyl(g, 0.2, 0.02, M.walnut, w / 2 + 0.55, 0.02, sz);
      }
      colliders.push({ x0: f.x - w / 2, x1: f.x + w / 2 + 0.8, z0: Z(f.y) - l / 2, z1: Z(f.y) + l / 2, y0: base, y1: base + 1 });
    },
    kitchenTall(f, base) {
      const g = group(f.x, f.y, base, f.r); const w = f.w;
      lbox(g, w, 2.6, 0.62, M.taupe, 0, 1.3, 0);
      // marble niche with lit splashback + ovens
      lbox(g, 1.9, 1.2, 0.5, M.marble, -0.3, 1.4, 0.07, { collide: false }); lbox(g, 1.7, 0.9, 0.02, M.emissive, -0.3, 1.45, 0.32, { collide: false, shadow: false });
      lbox(g, 1.9, 0.9, 0.6, M.marble, -0.3, 0.45, 0.02, { collide: false }); lbox(g, 1.9, 0.04, 0.62, M.marble, -0.3, 0.92, 0.02, { collide: false });
      lbox(g, 0.6, 0.45, 0.02, M.black, 1.5, 1.5, 0.315, { collide: false, shadow: false }); lbox(g, 0.6, 0.45, 0.02, M.black, 1.5, 1.0, 0.315, { collide: false, shadow: false });
      for (let i = 0; i < Math.round(w / 0.6); i++) lbox(g, 0.01, 2.4, 0.02, M.bronze, -w / 2 + 0.6 * i + 0.3, 1.3, 0.315, { collide: false, shadow: false });
      lbox(g, 0.5, 0.5, 0.4, M.brass, 1.6, 0.25 + 1.55, 0.08, { collide: false }); // coffee machine
    },
    sculleryRun(f, base) { const g = group(f.x, f.y, base, f.r); const w = f.w; lbox(g, w, 0.88, 0.6, M.taupe, 0, 0.44, 0); lbox(g, w, 0.04, 0.62, M.marble, 0, 0.9, 0, { collide: false }); if (f.tall) lbox(g, w, 1.4, 0.35, M.taupe, 0, 1.9, -0.12, { collide: false }); lcyl(g, 0.02, 0.35, M.brass, 0, 1.05, 0.05); },
    kitchenette(f, base) { const g = group(f.x, f.y, base, f.r); lbox(g, f.w, 0.88, 0.6, M.taupe, 0, 0.44, 0); lbox(g, f.w, 0.04, 0.62, M.marble, 0, 0.9, 0, { collide: false }); lbox(g, f.w, 0.7, 0.35, M.taupe, 0, 1.9, -0.12, { collide: false }); },
    diningTable(f, base) {
      const g = group(f.x, f.y, base, f.r);
      const top = new THREE.Mesh(cylGeo, M.timber); top.scale.set(1.15, 0.05, 1.4); top.position.set(0, 0.74, 0); top.castShadow = true; g.add(top);
      lbox(g, 0.7, 0.7, 0.9, M.timber, 0, 0.36, 0); lbox(g, 0.7, 0.7, 0.9, M.timber, 0, 0.36, 0);
      colliders.push({ x0: f.x - 1.2, x1: f.x + 1.2, z0: Z(f.y) - 1.45, z1: Z(f.y) + 1.45, y0: base, y1: base + 0.8 });
      const pos = [[-0.95, 0.9], [-0.95, 0], [-0.95, -0.9], [0.95, 0.9], [0.95, 0], [0.95, -0.9], [0, 1.65], [0, -1.65]];
      for (const [px, pz] of pos) { const c = new THREE.Group(); c.position.set(px, 0, -pz); c.rotation.y = Math.atan2(-px, pz) + Math.PI; g.add(c);
        const seat = new THREE.Mesh(cylGeo, M.fabric); seat.scale.set(0.26, 0.08, 0.26); seat.position.y = 0.46; seat.castShadow = true; c.add(seat);
        const back = new THREE.Mesh(boxGeo, M.fabric); back.scale.set(0.48, 0.3, 0.06); back.position.set(0, 0.7, 0.22); back.castShadow = true; c.add(back);
        for (let k = 0; k < 4; k++) { const leg = new THREE.Mesh(cylGeo, M.timber); leg.scale.set(0.02, 0.44, 0.02); leg.position.set((k % 2 - 0.5) * 0.36, 0.22, (Math.floor(k / 2) - 0.5) * 0.36); c.add(leg); } }
    },
    pendantCluster(f, base) { const g = group(f.x, f.y, base, 0); for (let i = 0; i < 6; i++) { const a = i * 1.05, r = 0.25 + (i % 2) * 0.2; const s = new THREE.Mesh(sphGeo, M.glassTint); s.scale.setScalar(0.12 + (i % 3) * 0.04); const sy = f.y0 - 0.85 - (i % 3) * 0.22; s.position.set(Math.cos(a) * r, sy, Math.sin(a) * r); g.add(s); const b = new THREE.Mesh(sphGeo, M.emissive); b.scale.setScalar(0.04); b.position.copy(s.position); g.add(b); lcyl(g, 0.004, f.y0 - sy, M.black, s.position.x, (f.y0 + sy) / 2, -s.position.z); } },
    pendantGlobes(f, base) { const g = group(f.x, f.y, base, 0); for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(sphGeo, M.emissive); s.scale.set(0.28, 0.24, 0.28); const sy = f.y0 - 1.0 - (i % 2) * 0.3; s.position.set((i - 1) * 0.5, sy, (i % 2) * 0.3); g.add(s); lcyl(g, 0.004, f.y0 - sy, M.black, s.position.x, (f.y0 + sy) / 2, -s.position.z); } },
    downlights(f, base) { const h = CLEAR[f.l]; for (let i = 0; i < f.nx; i++) for (let j = 0; j < f.ny; j++) { const x = lerp(f.x, f.x1, (i + 0.5) / f.nx), y = lerp(f.y, f.y1, (j + 0.5) / f.ny); const d = new THREE.Mesh(cylGeo, M.emissive); d.scale.set(0.05, 0.01, 0.05); d.position.set(x, base + h - 0.01, Z(y)); world.add(d); } },
    tvWall(f, base) {
      const g = group(f.x, f.y, base, f.r); const w = f.w;
      lbox(g, w, 3.05, 0.5, M.walnut, 0, 1.525, 0);                                  // joinery wall
      lbox(g, 2.2, 1.2, 0.03, M.black, 0.3, 1.5, 0.26, { collide: false, shadow: false }); // hidden tv (panel slid)
      lbox(g, 1.0, 1.4, 0.05, M.art1, -1.15, 1.5, 0.28, { collide: false });          // art on sliding panel
      lbox(g, 1.3, 0.1, 0.55, M.marble, 0.2, 0.5, 0.05, { collide: false });          // plinth
      lbox(g, 1.2, 0.9, 0.35, M.black, -w / 2 + 0.8, 0.95, 0.1, { collide: false });  // fireplace box
      lbox(g, 0.9, 0.6, 0.02, M.fire, -w / 2 + 0.8, 0.9, 0.28, { collide: false, shadow: false });
      lbox(g, 0.02, 0.5, 0.3, M.timber, -w / 2 + 1.5, 1.35, 0.15, { collide: false, shadow: false });
      for (let i = 0; i < 4; i++) lbox(g, 0.8, 0.03, 0.3, M.brass, 1.6, 1.0 + i * 0.4, 0.15, { collide: false, shadow: false });
    },
    outdoorTable(f, base) { const g = group(f.x, f.y, base, f.r); lbox(g, 1.0, 0.05, 2.4, M.timber, 0, 0.74, 0); lbox(g, 0.1, 0.7, 0.1, M.timber, -0.4, 0.35, -1.0); lbox(g, 0.1, 0.7, 0.1, M.timber, 0.4, 0.35, 1.0); lbox(g, 0.1, 0.7, 0.1, M.timber, 0.4, 0.35, -1.0); lbox(g, 0.1, 0.7, 0.1, M.timber, -0.4, 0.35, 1.0); for (let i = 0; i < 8; i++) { const sx = (i < 4 ? -0.95 : 0.95), sz = -0.9 + (i % 4) * 0.6; lbox(g, 0.45, 0.06, 0.45, M.fabricGrey, sx, 0.45, sz, { collide: false }); lbox(g, 0.06, 0.4, 0.45, M.timber, sx + (i < 4 ? -0.2 : 0.2), 0.65, sz, { collide: false }); } colliders.push({ x0: f.x - 1.3, x1: f.x + 1.3, z0: Z(f.y) - 1.3, z1: Z(f.y) + 1.3, y0: base, y1: base + 0.8 }); },
    outdoorChairs(f, base) { const g = group(f.x, f.y, base, f.r); lcyl(g, 0.35, 0.04, M.timber, 0, 0.7, 0); lcyl(g, 0.04, 0.7, M.bronze, 0, 0.35, 0, { collide: true }); for (const sx of [-0.7, 0.7]) { lbox(g, 0.5, 0.06, 0.5, M.timber, sx, 0.44, 0); lbox(g, 0.06, 0.45, 0.5, M.timber, sx + Math.sign(sx) * 0.22, 0.65, 0, { collide: false }); } },
    lounger(f, base) { const g = group(f.x, f.y, base, f.r); lbox(g, 0.7, 0.12, 1.9, M.fabricGrey, 0, 0.3, 0); lbox(g, 0.7, 0.5, 0.1, M.fabricGrey, 0, 0.55, -0.9, { collide: false, rot: 0 }); lbox(g, 0.65, 0.24, 1.85, M.timber, 0, 0.12, 0, { collide: false }); },
    loungeSet(f, base) { for (const [dx, dz] of [[-0.9, 0.2], [0.9, 0.2]]) { const g = group(f.x + dx, f.y + dz, base, 0); lbox(g, 0.9, 0.35, 0.9, M.fabricGrey, 0, 0.18, 0); lbox(g, 0.7, 0.2, 0.7, M.fabricGrey, 0, 0.42, 0, { collide: false }); } },
    braai(f, base) { const g = group(f.x, f.y, base, f.r); lbox(g, 2.2, 0.9, 0.7, M.stoneWall, 0, 0.45, 0); lbox(g, 2.2, 0.05, 0.75, M.marble, 0, 0.92, 0, { collide: false }); lbox(g, 1.0, 1.0, 0.6, M.black, -0.3, 1.5, -0.05, { collide: false }); lbox(g, 0.9, 0.04, 0.5, M.bronze, -0.3, 1.02, 0, { collide: false, shadow: false }); lbox(g, 2.2, 2.6, 0.12, M.timber, 0, 1.5, -0.38, { collide: false }); },
    bath(f, base) {
      const g = group(f.x, f.y, base, f.r);
      if (f.builtIn) { lbox(g, 0.8, 0.55, 1.7, M.marble, 0, 0.275, 0); lbox(g, 0.66, 0.05, 1.56, M.white, 0, 0.53, 0, { collide: false, shadow: false }); lcyl(g, 0.02, 1.9, M.brass, 0.3, 1.0, -0.8); return; }
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.9, 6, 16), M.white); m.rotation.z = Math.PI / 2; m.rotation.y = Math.PI / 2; m.scale.set(1, 0.85, 1); m.position.set(0, 0.32, 0); m.castShadow = true; g.add(m);
      g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(m); colliders.push({ x0: bb.min.x, x1: bb.max.x, z0: bb.min.z, z1: bb.max.z, y0: base, y1: base + 0.7 });
      lcyl(g, 0.015, 0.9, M.brass, 0.3, 0.45, 0.85); lbox(g, 0.02, 0.02, 0.25, M.brass, 0.3, 0.9, 0.75, { collide: false, shadow: false });
      lcyl(g, 0.25, 0.45, M.walnut, 0.65, 0.22, -0.9); // side stool
    },
    marbleWall(f, base) { const g = group(f.x, f.y, base, f.r); lbox(g, f.w, f.h, 0.03, M.marble, 0, f.h / 2, -0.03, { collide: false }); for (let i = 0; i < 2; i++) { const s = new THREE.Mesh(sphGeo, M.emissive); s.scale.setScalar(0.07); s.position.set(-0.3 + i * 0.35, 1.5 + i * 0.25, -0.35); g.add(s); lcyl(g, 0.004, 1.2, M.brass, -0.3 + i * 0.35, 2.2 + i * 0.12, 0.35); } },
    shower(f, base) { const g = group(f.x, f.y, base, f.r); const w = f.w || 1.0, d = f.d || 1.0, gl = f.glass || 'sw'; lbox(g, w, 0.02, d, M.stone, 0, 0.02, 0, { collide: false, shadow: false }); if (gl.includes('w')) lbox(g, 0.01, 2.2, d, M.glass, -w / 2, 1.1, 0, { collide: true, shadow: false }); if (gl.includes('e')) lbox(g, 0.01, 2.2, d, M.glass, w / 2, 1.1, 0, { collide: true, shadow: false }); if (gl.includes('n')) lbox(g, w, 2.2, 0.01, M.glass, 0, 1.1, d / 2, { collide: true, shadow: false }); if (gl.includes('s')) lbox(g, w, 2.2, 0.01, M.glass, 0, 1.1, -d / 2, { collide: true, shadow: false }); const bx = gl.includes('w') ? w / 2 - 0.05 : -w / 2 + 0.05, bz = gl.includes('s') ? d / 2 - 0.05 : -d / 2 + 0.05; lcyl(g, 0.015, 1.2, M.brass, bx, 1.6, bz); lcyl(g, 0.12, 0.01, M.brass, bx, 2.15, bz - Math.sign(bz) * 0.25); for (let k = 0; k < 4; k++) lbox(g, 0.02, 0.02, 0.02, M.brass, bx, 0.9 + k * 0.3, bz, { collide: false, shadow: false }); },
    wc(f, base) { const g = group(f.x, f.y, base, f.r); lbox(g, 0.38, 0.4, 0.55, M.white, 0, 0.25, 0.15, { geo: boxGeo }); lbox(g, 0.4, 0.05, 0.55, M.white, 0, 0.47, 0.15, { collide: false }); lbox(g, 0.5, 1.1, 0.16, M.taupe, 0, 0.55, -0.15, { collide: false }); },
    vanity(f, base) {
      const g = group(f.x, f.y, base, f.r); const w = f.w || 1.2;
      lbox(g, w, 0.45, 0.5, M.walnut, 0, 0.62, 0); lbox(g, w, 0.12, 0.55, M.marble, 0, 0.9, 0, { collide: false });
      const n = f.double ? 2 : 1; for (let i = 0; i < n; i++) { const bx = (i - (n - 1) / 2) * 0.8; lbox(g, 0.4, 0.06, 0.3, M.white, bx, 0.94, 0.02, { collide: false, shadow: false }); lcyl(g, 0.012, 0.25, M.brass, bx, 1.1, -0.2); lbox(g, 0.015, 0.015, 0.18, M.brass, bx, 1.22, -0.12, { collide: false, shadow: false }); }
      if (f.mirrors) { for (let i = 0; i < 2; i++) { const bx = (i - 0.5) * 0.8; const mr = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 4, 12), M.mirror); mr.scale.set(1, 1, 0.1); mr.position.set(bx, 1.75, 0.35); g.add(mr); }
        for (let s = -w / 2; s <= w / 2; s += 0.06) lbox(g, 0.02, 1.35, 0.02, M.bronze, s, 1.7, 0.33, { collide: false, shadow: false }); }
      else if (!f.small) { const mr = new THREE.Mesh(boxGeo, M.mirror); mr.scale.set(w - 0.2, 0.9, 0.02); mr.position.set(0, 1.65, 0.24); g.add(mr); }
      if (!f.small) { const s = new THREE.Mesh(sphGeo, M.emissive); s.scale.setScalar(0.06); s.position.set(w / 2 - 0.1, 1.9, 0.2); g.add(s); }
    },
    curtain(f, base) { const g = group(f.x, f.y, base, f.r); const w = f.w || 0.6, h = CLEAR[f.l] - 0.08; for (let i = 0; i < Math.round(w / 0.09); i++) lbox(g, 0.05, h, 0.12 + (i % 2) * 0.05, M.linen, -w / 2 + i * 0.09, h / 2, 0, { collide: false, shadow: false }); lcyl(g, 0.012, w + 0.1, M.bronze, 0, h + 0.02, 0).rotation.z = Math.PI / 2; },
    timberWall(f, base) { const g = group(f.x, f.y, base, f.r); const w = f.w, h = f.h || 3.0; lbox(g, w, h, 0.03, M.walnut, 0, h / 2, 0, { collide: false }); for (let i = 0; i < Math.round(w / 0.1); i++) lbox(g, 0.045, h, 0.04, M.walnut, -w / 2 + 0.05 + i * 0.1, h / 2, 0.03, { collide: false, shadow: false }); },
    washer(f, base) { const g = group(f.x, f.y, base, f.r); lbox(g, 0.6, 0.85, 0.6, M.white, 0, 0.425, 0); lcyl(g, 0.22, 0.02, M.black, 0, 0.45, 0.3); },
    counter(f, base) { const g = group(f.x, f.y, base, f.r); lbox(g, f.w, 0.88, f.d, M.taupe, 0, 0.44, 0); lbox(g, f.w, 0.04, f.d + 0.02, M.marble, 0, 0.9, 0, { collide: false }); },
    geyser(f, base) { const g = group(f.x, f.y, base, 0); lcyl(g, 0.3, 1.4, M.white, 0, 1.6, 0); },
    car(f, base) {
      const g = group(f.x, f.y, base, f.r); const mat = f.color ? std({ color: f.color, roughness: 0.3, metalness: 0.6 }) : M.car;
      lbox(g, 1.9, 0.6, 4.7, mat, 0, 0.55, 0); lbox(g, 1.7, 0.55, 2.6, mat, 0, 1.12, -0.2, { collide: false }); lbox(g, 1.66, 0.4, 2.3, M.glassTint, 0, 1.18, -0.2, { collide: false, shadow: false });
      for (const [sx, sz] of [[-0.85, 1.5], [0.85, 1.5], [-0.85, -1.5], [0.85, -1.5]]) { const w = new THREE.Mesh(cylGeo, M.black); w.scale.set(0.36, 0.22, 0.36); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.36, -sz); g.add(w); }
    },
    box(f, base) { const g = group(f.x, f.y, base, 0); lbox(g, f.w, f.h, f.d, M[f.mat] || M.plaster, 0, f.h / 2, 0); lbox(g, f.w + 0.3, 0.15, f.d + 0.3, M.plasterExt, 0, f.h + 0.07, 0, { collide: false }); },
    pool(f, base) {
      const [x0, y0, x1, y1] = [f.x, f.y, f.x1, f.y1];
      pbox(x0 - 0.45, y0 - 0.45, x1 + 0.45, y1 + 0.45, base - 0.05, base + 0.03, M.stone, { collide: false });
      pbox(x0, y0, x1, y1, base - 1.6, base - 1.5, M.poolFloor, { collide: false, shadow: false });
      for (const [a, b, c, d] of [[x0 - 0.02, y0, x0, y1], [x1, y0, x1 + 0.02, y1], [x0, y0 - 0.02, x1, y0], [x0, y1, x1, y1 + 0.02]]) pbox(a, b, c, d, base - 1.6, base + 0.03, M.poolFloor, { collide: false, shadow: false });
      const w = plane(x0, y0, x1, y1, base - 0.15, scaledMat('water', x1 - x0, y1 - y0)); w.receiveShadow = false; waterMeshes.push(w);
      colliders.push({ x0, x1, z0: Z(y1), z1: Z(y0), y0: base - 2, y1: base + 0.5 });
      for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(sphGeo, M.emissive); l.scale.setScalar(0.06); l.position.set(x0 + 0.05, base - 0.8, Z(y0 + 0.9 + i * 0.9)); world.add(l); }
    },
    hedge(f, base) { const [x0, y0, x1, y1] = [f.x, f.y, f.x1, f.y1]; pbox(x0, y0, x1, y1, base, base + 1.9, M.hedge, { collide: true }); },
    tree(f, base) { tree(f.x, f.y, base, f.s || 1); },
    shrubs(f, base) { const [x0, y0, x1, y1] = [f.x, f.y, f.x1, f.y1]; for (let x = x0 + 0.5; x < x1; x += 1.1) for (let y = y0 + 0.5; y < y1; y += 1.1) foliage(x + (rnd() - 0.5) * 0.4, y + (rnd() - 0.5) * 0.4, base, 0.6 + rnd() * 0.4, 0.5 + rnd() * 0.6, rnd() > 0.7 ? M.hedge : M.leaf); },
    retaining(f, base) {
      // retaining walls between the driveway level (0) and the rear garden level (3.4), and site boundary walls
      pbox(-8, 10.3, 0, 10.6, 0, 3.4, M.stoneWall, { collide: true }); pbox(13.6, 10.3, 22, 10.6, 0, 3.4, M.stoneWall, { collide: true });
      pbox(-5.3, 3.5, -5.0, 10.6, 0, 3.4, M.stoneWall, { collide: true }); pbox(-5.3, 3.3, 0, 3.6, 0, 3.4, M.stoneWall, { collide: true });
      pbox(13.6, 6.0, 15.2, 6.3, 0, 0.2, M.stone, { collide: false });
      pbox(15.0, 6.0, 15.2, 10.3, 0, 3.6, M.stoneWall, { collide: true }); // garden stair side wall
      // fill under the raised parts (hidden, closes gaps under the house on the north side)
      pbox(0, 10.45, 13.6, 17.5, 0, 3.1, M.stoneWall, { collide: true, shadow: false });
      pbox(-8, 10.6, 22, 30, 3.3, 3.4, M.soil, { collide: false, shadow: false });
      pbox(-5.3, 3.6, 0, 10.45, 3.3, 3.4, M.soil, { collide: false, shadow: false });
      // boundary walls (1 m high on the retaining wall + electric fence posts)
      for (const [x0, y0, x1, y1] of [[-8, 29.6, 22, 30], [-8, -9, -7.7, 30], [21.7, -9, 22, 30]]) pbox(x0, y0, x1, y1, y0 > 10 ? 3.4 : 0, (y0 > 10 ? 3.4 : 0) + 1.2, M.plasterExt, { collide: true });
      pbox(-8, -9, 22, -8.7, 0, 1.6, M.stoneWall, { collide: true });
      // driveway gate & guard house cue
      pbox(15.2, -8.7, 20, -8.4, 0, 2.0, M.bronze, { collide: true });
      // porch step / threshold
      pbox(4.55, 0.9, 5.4, 2.9, 0, 0.02, M.stone, { collide: false });
    },
  };
  const waterMeshes = [];

  function buildFurniture() { for (const f of FURNITURE) { const fn = FURN[f.t]; if (!fn) { console.warn('no furniture', f.t); continue; } fn(f, LEVELS[f.l]); } }

  /* ---------------- exterior massing details */
  function buildExterior() {
    // ground planes beyond the room patches: driveway apron and far lawn handled by rooms; add the distant terrain
    const disc = new THREE.Mesh(new THREE.CircleGeometry(48, 48), scaledMat('lawn', 96, 96)); disc.rotation.x = -Math.PI / 2; disc.position.set(6.8, -0.4, -9); disc.receiveShadow = true; world.add(disc);
    const disc2 = new THREE.Mesh(new THREE.CircleGeometry(60, 48), M.hedge); disc2.rotation.x = -Math.PI / 2; disc2.position.set(6.8, -0.5, -9); world.add(disc2); // dark tree-line ground beyond the lawn
    // garage apron up to the road
    // window reveals / roof parapets
    for (const [yb, yt, x0, y0, x1, y1] of [[9.9, 10.3, 0, 0, 13.6, 0.3], [9.9, 10.3, 0, 0, 0.3, 14.25], [9.9, 10.3, 13.3, 0, 13.6, 15.45], [9.9, 10.3, 0, 13.95, 2.98, 14.25], [9.9, 10.3, 8.02, 15.15, 13.6, 15.45], [9.9, 10.3, 2.98, 10.9, 3.28, 14.25]])
      pbox(x0, y0, x1, y1, yb, yt, M.plasterExt);
    // fascia band at each slab edge (concrete slab expressed on the elevation)
    for (const [yb, yt] of [[3.1, 3.5], [6.5, 6.9]]) { pbox(-0.02, 0, 13.62, 0.02, yb, yt, M.concrete); }
    pbox(-0.02, 0, 13.62, 0.02, 9.55, 9.95, M.concrete);
    // sky: panorama cylinder + dome
    const tex = new THREE.TextureLoader().load('assets/panorama.jpg', () => { setProgress(1); });
    tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1;
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(300, 300, 200, 64, 1, true), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false }));
    cyl.position.set(6.8, -35, -9); cyl.rotation.y = -Math.PI / 2; scene.add(cyl);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(320, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshBasicMaterial({ color: 0x9cc3e6, side: THREE.BackSide, fog: false }));
    dome.position.set(6.8, 40, -9); scene.add(dome);
  }

  /* ================================================================ LIGHTING */
  function buildLights() {
    const hemi = new THREE.HemisphereLight(0xdfe9f2, 0x8c7a63, 1.15); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
    sun.position.set(-6, 42, -44); sun.target.position.set(6.8, 3, -9); scene.add(sun); scene.add(sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 5; sc.far = 110; sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));
    const pt = (x, y, yy, i = 14, d = 9, c = 0xffe6c4) => { const p = new THREE.PointLight(c, i, d, 2); p.position.set(x, yy, Z(y)); scene.add(p); };
    pt(6.6, 6.6, 5.9, 18, 10); pt(10.8, 6.6, 5.4, 12, 8); pt(10.5, 13.5, 5.9, 18, 10); pt(2.4, 9.4, 5.9, 10, 8); pt(2.4, 1.7, 5.9, 8, 6); pt(3.0, 5.5, 5.9, 8, 6);
    pt(2.3, 4.8, 9.2, 10, 7); pt(1.5, 8.5, 9.2, 8, 6); pt(6.5, 5.3, 9.2, 8, 6); pt(11.4, 5.3, 9.2, 8, 6); pt(10.8, 13.3, 9.2, 8, 6); pt(5.5, 10.3, 9.2, 6, 6); pt(8.9, 9.4, 9.2, 6, 6);
    pt(2.4, 2.0, 2.6, 10, 7); pt(4.6, 7.0, 2.7, 10, 9, 0xf4f1ea); pt(8.6, 7.0, 2.7, 10, 9, 0xf4f1ea); pt(12.2, 5.0, 2.7, 8, 6); pt(12.2, 9.2, 2.7, 5, 4); pt(1.3, 8.4, 2.7, 6, 5); pt(2.3, 12.2, 5.0, 5, 4); pt(1.5, 12.0, 8.9, 6, 5); pt(3.0, 5.5, 5.9, 8, 6);
    pt(12.8, 12.1, 3.9, 6, 4, 0xff9a4a); // fireplace glow
  }

  /* ================================================================ BUILD */
  setProgress(0.15);
  buildRooms(); setProgress(0.3);
  for (const w of WALLS) buildWall(w[0], w[1], w[2], w[3], w[4], w[5], w[6] || {});
  setProgress(0.5);
  buildStairs(); buildBalustrades(); buildSlabs(); buildPergolas(); setProgress(0.65);
  buildFurniture(); setProgress(0.85);
  buildExterior(); buildLights();

  /* ================================================================ PLAYER */
  const EYE = 1.62, RADIUS = 0.28;
  const player = { x: START.x, z: Z(START.y), base: LEVELS[START.level], yaw: THREE.MathUtils.degToRad(START.yaw), pitch: 0, vy: 0, bob: 0 };
  const keys = {};
  const yawFromDeg = (d) => THREE.MathUtils.degToRad(d);

  function patchHeightAt(x, z, currentBase) {
    let best = null, bestD = 1e9;
    for (const p of patches) {
      if (x < p.x0 - 0.02 || x > p.x1 + 0.02 || z < p.z0 - 0.02 || z > p.z1 + 0.02) continue;
      let y;
      if (p.ramp) {
        let t;
        if (p.dir === 'n') t = (p.z1 - z) / (p.z1 - p.z0);      // z1 is south end (larger z). north = smaller z
        else if (p.dir === 's') t = (z - p.z0) / (p.z1 - p.z0);
        else if (p.dir === 'e') t = (x - p.x0) / (p.x1 - p.x0);
        else t = (p.x1 - x) / (p.x1 - p.x0);
        y = p.yBase + p.rise * THREE.MathUtils.clamp(t, 0, 1);
      } else y = p.y;
      const d = Math.abs(y - currentBase) - (p.ramp ? 0.6 : 0);
      if (d < bestD && Math.abs(y - currentBase) < 1.6) { bestD = d; best = { y, p }; }
    }
    return best;
  }
  function collide(x, z, base) {
    // push the player circle out of colliders that span walking height
    for (let iter = 0; iter < 3; iter++) {
      for (const c of colliders) {
        if (c.y1 < base + 0.35 || c.y0 > base + 1.7) continue; // step over low things, walk under high things
        const nx = Math.max(c.x0, Math.min(x, c.x1)), nz = Math.max(c.z0, Math.min(z, c.z1));
        const dx = x - nx, dz = z - nz, d2 = dx * dx + dz * dz;
        if (d2 < RADIUS * RADIUS) {
          if (d2 > 1e-6) { const d = Math.sqrt(d2); x = nx + dx / d * RADIUS; z = nz + dz / d * RADIUS; }
          else { // inside the box: push out along the smallest axis
            const px = Math.min(x - c.x0, c.x1 - x), pz = Math.min(z - c.z0, c.z1 - z);
            if (px < pz) x = (x - c.x0 < c.x1 - x) ? c.x0 - RADIUS : c.x1 + RADIUS; else z = (z - c.z0 < c.z1 - z) ? c.z0 - RADIUS : c.z1 + RADIUS;
          }
        }
      }
    }
    return [x, z];
  }

  let lastRoom = null, currentLevel = START.level;
  function roomAt(x, z, base) {
    const lvl = nearestLevel(base);
    let best = null;
    for (const r of (roomsByLevel[lvl] || [])) { const [x0, y0, x1, y1] = r.rect; if (x >= x0 && x <= x1 && z >= Z(y1) && z <= Z(y0)) { if (!best || (r.rect[2] - r.rect[0]) * (r.rect[3] - r.rect[1]) < (best.rect[2] - best.rect[0]) * (best.rect[3] - best.rect[1])) best = r; } }
    return best;
  }
  function nearestLevel(base) { let l = 0, bd = 1e9; for (const k in LEVELS) { const d = Math.abs(LEVELS[k] - base); if (d < bd) { bd = d; l = +k; } } if (base > LEVELS[2] - 0.3) return 2; if (base > LEVELS[1] - 0.3) return 1; return 0; }

  /* ================================================================ INPUT */
  const lookhint = document.getElementById('lookhint');
  let pointerLocked = false, dragging = false, lastPX = 0, lastPY = 0, moved = false;
  const SENS = 0.0022;
  canvas.addEventListener('click', () => { if (!pointerLocked && canvas.requestPointerLock && !('ontouchstart' in window)) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* pointer lock unavailable (embedded frame) — drag-to-look still works */ } } });
  document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === canvas; lookhint.classList.toggle('faded', pointerLocked || moved); });
  window.addEventListener('mousemove', (e) => { if (pointerLocked) { player.yaw -= e.movementX * SENS; player.pitch = THREE.MathUtils.clamp(player.pitch - e.movementY * SENS, -1.2, 1.2); } });
  canvas.addEventListener('pointerdown', (e) => { if (pointerLocked) return; dragging = true; lastPX = e.clientX; lastPY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging || pointerLocked) return; const dx = e.clientX - lastPX, dy = e.clientY - lastPY; lastPX = e.clientX; lastPY = e.clientY; player.yaw -= dx * SENS * 1.4; player.pitch = THREE.MathUtils.clamp(player.pitch - dy * SENS * 1.4, -1.2, 1.2); moved = true; lookhint.classList.add('faded'); });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  // trackpad / wheel: vertical = walk, horizontal = turn
  let wheelMove = 0, wheelTurn = 0;
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); const k = e.deltaMode === 1 ? 20 : 1; wheelMove += -e.deltaY * k; wheelTurn += e.deltaX * k; moved = true; lookhint.classList.add('faded'); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    const k = e.key.toLowerCase();
    if (k === 'm') togglePanel('map'); if (k === 'p') togglePanel('plan'); if (k === 't') togglePanel('rooms'); if (k === 'h') togglePanel('help');
    if (k === 'r') teleport(START.x, START.y, START.level, START.yaw);
    if (k === 'f') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); }
    if (k === 'escape') { closePanels(); }
    moved = true; lookhint.classList.add('faded');
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  // touch pad buttons
  document.querySelectorAll('#touchpad button').forEach((b) => { const k = b.dataset.k; const on = (e) => { e.preventDefault(); keys[k] = true; }; const off = (e) => { e.preventDefault(); keys[k] = false; }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off); });

  function teleport(x, y, level, yawDeg) { player.x = x; player.z = Z(y); player.base = LEVELS[level]; player.yaw = yawFromDeg(yawDeg); player.pitch = 0; }

  /* ================================================================ UI */
  const panels = { map: document.getElementById('minimap'), plan: document.getElementById('planpanel'), rooms: document.getElementById('roomspanel'), help: document.getElementById('helppanel') };
  const toolBtns = document.querySelectorAll('#tools button');
  function showPanel(name) { for (const k in panels) panels[k].classList.toggle('hidden', k !== name); toolBtns.forEach((b) => b.classList.toggle('active', b.dataset.panel === name)); }
  function togglePanel(name) { if (!panels[name].classList.contains('hidden')) showPanel('map'); else showPanel(name); }
  function closePanels() { showPanel('map'); }
  toolBtns.forEach((b) => b.addEventListener('click', () => togglePanel(b.dataset.panel)));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closePanels));

  // room list
  const rg = document.querySelector('.room-groups');
  const LEVEL_NAMES = ['Ground floor · Parking & arrival', 'First floor · Living', 'Second floor · Bedrooms'];
  [0, 1, 2].forEach((lvl) => { const h = document.createElement('h4'); h.textContent = LEVEL_NAMES[lvl]; rg.appendChild(h); TOUR.filter((t) => t[4] === lvl).forEach((t) => { const b = document.createElement('button'); b.textContent = t[1]; b.addEventListener('click', () => { teleport(t[2], t[3], t[4], t[5]); closePanels(); }); rg.appendChild(b); }); });

  // room card
  const card = document.getElementById('roomcard');
  const lightbox = document.getElementById('lightbox');
  lightbox.addEventListener('click', () => lightbox.classList.add('hidden'));
  card.querySelector('figure').addEventListener('click', () => { const img = card.querySelector('figure img'); lightbox.querySelector('img').src = img.src; lightbox.querySelector('.lb-cap').textContent = card.querySelector('figcaption').textContent; lightbox.classList.remove('hidden'); });
  function showRoom(r) {
    if (!r) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    card.querySelector('.rc-level').textContent = LEVEL_NAMES[r.level].split(' · ')[0] + (r.outside ? ' · outside' : '');
    card.querySelector('.rc-name').textContent = r.name;
    card.querySelector('.rc-sub').textContent = r.sub || '';
    const d = card.querySelector('.rc-dims'); d.textContent = r.dims || ''; d.classList.toggle('hidden', !r.dims);
    card.querySelector('.rc-spec').textContent = r.spec || '';
    const fig = card.querySelector('.rc-render');
    if (r.render && RENDERS[r.render]) { const img = fig.querySelector('img'); if (img.dataset.file !== RENDERS[r.render].file) { fig.classList.add('hidden'); img.dataset.file = RENDERS[r.render].file; img.onload = () => { if (img.dataset.file === RENDERS[r.render].file) fig.classList.remove('hidden'); }; img.src = RENDERS[r.render].file; } else fig.classList.remove('hidden'); fig.querySelector('figcaption').textContent = RENDERS[r.render].caption; } else fig.classList.add('hidden');
  }
  const levelchip = document.getElementById('levelchip');
  const compassNeedle = document.querySelector('#compass i');

  // minimap
  const mm = document.querySelector('#minimap canvas'), mg = mm.getContext('2d');
  const MM = { x0: -1.2, x1: 15.0, y0: -1.5, y1: 24.0 };
  const mmScale = Math.min(mm.width / (MM.x1 - MM.x0), mm.height / (MM.y1 - MM.y0));
  const mmX = (x) => (x - MM.x0) * mmScale, mmY = (y) => mm.height - (y - MM.y0) * mmScale;
  function drawMinimap(lvl) {
    mg.clearRect(0, 0, mm.width, mm.height);
    mg.fillStyle = '#efeae1'; mg.fillRect(0, 0, mm.width, mm.height);
    for (const r of roomsByLevel[lvl] || []) {
      const [x0, y0, x1, y1] = r.rect; if (x1 - x0 > 20) continue;
      mg.fillStyle = r.outside ? (r.floor === 'lawn' ? '#cfe0b8' : r.floor === 'deck' ? '#d9c3a3' : '#e0dbd2') : (r.floor === 'oak' ? '#e6d3b4' : r.floor === 'stone' ? '#e9e3d8' : '#ddd8cf');
      mg.fillRect(mmX(x0), mmY(y1), (x1 - x0) * mmScale, (y1 - y0) * mmScale);
    }
    if (lvl === 1) { mg.fillStyle = '#8ec3d6'; mg.fillRect(mmX(9.2), mmY(22.3), 3 * mmScale, 4.5 * mmScale); }
    mg.strokeStyle = '#3a3531'; mg.lineWidth = 2;
    for (const w of WALLS) { if (w[0] !== lvl) continue; mg.beginPath(); mg.moveTo(mmX(w[1]), mmY(w[2])); mg.lineTo(mmX(w[3]), mmY(w[4])); mg.stroke(); }
    mg.fillStyle = '#5a534b'; mg.font = '9px Jost, sans-serif'; mg.textAlign = 'center';
    for (const r of roomsByLevel[lvl] || []) { if (r.hidden || r.stair || (r.rect[2] - r.rect[0]) > 20) continue; const [x0, y0, x1, y1] = r.rect; if ((x1 - x0) * mmScale < 26) continue; mg.fillText(r.name.toUpperCase().slice(0, 14), mmX((x0 + x1) / 2), mmY((y0 + y1) / 2) + 3); }
    // player
    const px = mmX(player.x), py = mmY(-player.z);
    mg.save(); mg.translate(px, py); mg.rotate(-player.yaw);
    mg.fillStyle = 'rgba(176,141,87,0.25)'; mg.beginPath(); mg.moveTo(0, 0); mg.arc(0, 0, 26, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); mg.closePath(); mg.fill();
    mg.fillStyle = '#b08d57'; mg.beginPath(); mg.arc(0, 0, 5, 0, 7); mg.fill(); mg.strokeStyle = '#fff'; mg.lineWidth = 2; mg.stroke();
    mg.restore();
  }
  // plan overlay (architect's plan images) — pixel mapping derived from the 1:100 plan crops
  const PLANS = { 0: { file: 'assets/plans/plan_gf.jpg', ox: 57.5, oy: 812.5, s: 1 / 0.034, w: 744, h: 963, title: 'Ground floor plan' }, 1: { file: 'assets/plans/plan_ff.jpg', ox: 62.5, oy: 812.5, s: 1 / 0.034, w: 787, h: 963, title: 'First floor plan' }, 2: { file: 'assets/plans/plan_sf.jpg', ox: 50, oy: 806, s: 1 / 0.034, w: 788, h: 963, title: 'Second floor plan' } };
  const planImg = document.querySelector('#planpanel img'), planDot = document.querySelector('.plan-dot'), planTitle = document.querySelector('.plan-title');
  let planLevelShown = -1;
  function updatePlan(lvl) {
    const P = PLANS[lvl]; if (planLevelShown !== lvl) { planImg.src = P.file; planTitle.textContent = P.title; planLevelShown = lvl; }
    const k = planImg.clientWidth / P.w; if (!k) return;
    planDot.style.left = (P.ox + player.x * P.s) * k + 'px'; planDot.style.top = (P.oy - (-player.z) * P.s) * k + 'px'; planDot.style.transform = `rotate(${-player.yaw}rad)`;
  }

  function movePlayer(f, s, dt, speed) {
    const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);   // forward in three.js (yaw 0 → -z = north)
    const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);    // right
    const k = Math.min(1, dt * 12);
    let nx = player.x + (fx * f + rx * s) * speed * dt, nz = player.z + (fz * f + rz * s) * speed * dt;
    if (f || s) {
      [nx, nz] = collide(nx, nz, player.base);
      const hp = patchHeightAt(nx, nz, player.base);
      if (hp) { player.x = nx; player.z = nz; player.base += (hp.y - player.base) * k; player.bob += dt * speed * 4; }
      else { // try sliding along one axis
        const hx = patchHeightAt(nx, player.z, player.base);
        if (hx) { player.x = nx; player.base += (hx.y - player.base) * k; }
        else { const hz = patchHeightAt(player.x, nz, player.base); if (hz) { player.z = nz; player.base += (hz.y - player.base) * k; } }
      }
    } else { const hp = patchHeightAt(player.x, player.z, player.base); if (hp) player.base += (hp.y - player.base) * k; }
  }

  /* ================================================================ LOOP */
  const clock = new THREE.Clock();
  let uiTick = 0;
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    // input → velocity
    let f = 0, s = 0, turn = 0, pitchV = 0;
    if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1;
    if (keys.KeyA) s -= 1; if (keys.KeyD) s += 1;
    if (keys.ArrowLeft) turn += 1; if (keys.ArrowRight) turn -= 1;
    if (keys.KeyQ) pitchV += 1; if (keys.KeyE) pitchV -= 1;
    if (wheelMove) { f += THREE.MathUtils.clamp(wheelMove / 40, -1.5, 1.5); wheelMove *= 0.75; if (Math.abs(wheelMove) < 1) wheelMove = 0; }
    if (wheelTurn) { player.yaw -= wheelTurn * 0.0012; wheelTurn *= 0.7; if (Math.abs(wheelTurn) < 0.5) wheelTurn = 0; }
    player.yaw += turn * 1.9 * dt; player.pitch = THREE.MathUtils.clamp(player.pitch + pitchV * 1.2 * dt, -1.2, 1.2);
    const speed = (keys.ShiftLeft || keys.ShiftRight ? 3.4 : 1.7);
    movePlayer(f, s, dt, speed);
    const bobY = Math.sin(player.bob) * 0.018 * (f || s ? 1 : 0);
    camera.position.set(player.x, player.base + EYE + bobY, player.z);
    camera.rotation.order = 'YXZ'; camera.rotation.y = player.yaw; camera.rotation.x = player.pitch;
    // water shimmer
    const t = clock.elapsedTime; for (const w of waterMeshes) { w.material.map.offset.set(t * 0.02, Math.sin(t * 0.3) * 0.02); }
    // UI (10 Hz)
    uiTick += dt;
    if (uiTick > 0.1) {
      uiTick = 0;
      const lvl = nearestLevel(player.base);
      if (lvl !== currentLevel) { currentLevel = lvl; levelchip.textContent = LEVEL_NAMES[lvl].split(' · ')[0]; }
      const r = roomAt(player.x, player.z, player.base);
      if (r !== lastRoom) { lastRoom = r; showRoom(r); }
      compassNeedle.style.transform = `rotate(${player.yaw}rad)`;
      if (!panels.map.classList.contains('hidden')) drawMinimap(lvl);
      if (!panels.plan.classList.contains('hidden')) updatePlan(lvl);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
  levelchip.textContent = LEVEL_NAMES[START.level].split(' · ')[0];
  setProgress(0.95);
  setTimeout(() => { document.getElementById('loading').classList.add('done'); }, 400);
  frame();
  window.__walk = { player, teleport, movePlayer, colliders, patches, scene, camera, renderer, roomAt, LEVELS };
})();
