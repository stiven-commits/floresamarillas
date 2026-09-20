(() => {
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  let W, H, F, DPR;
  document.body.classList.add('intro');
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    F = Math.min(W, H) * 1.1;
  }
  addEventListener('resize', resize); resize();

  // ---------- mundo determinista ----------
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const NEAR = 20, MAXR = 7200, MINR = 250;

  const sph = (r0, r1) => {
    const u = rnd() * 2 - 1, a = rnd() * 6.283, s = Math.sqrt(1 - u * u), r = r0 + rnd() * (r1 - r0);
    return { x: r * s * Math.cos(a), y: r * u, z: r * s * Math.sin(a) };
  };
  const stars = Array.from({ length: 3200 }, () => ({ ...sph(900, 17000), r: rnd() * 1.4 + .3, t: rnd() * 6.28 }));
  const hues = [265, 285, 230, 320];
  const nebulas = Array.from({ length: 12 }, () => ({ ...sph(1200, 4800), r: 700 + rnd() * 900, h: hues[(rnd() * hues.length) | 0] }));

  // 12 flores grandes que orbitan dentro de la galaxia (abren mensaje)
  const NF = 12, RG = 2200;
  const mkFlower = (msg, r0, r1, rad) => ({
    rad, ang: rnd() * 6.283, w: (rnd() < .5 ? -1 : 1) * (.05 + rnd() * .07) * Math.sqrt(900 / rad),
    h: (rnd() - .5) * 240, tilt: (rnd() - .5) * .22,
    r: r0 + rnd() * (r1 - r0), petals: 6 + ((rnd() * 4) | 0), rot: rnd() * 6.28, sp: (rnd() - .5) * .5,
    ph: rnd() * 6.28, msg, px: 0, py: 0, pz: 0
  });
  const flowers = Array.from({ length: NF }, (_, i) => mkFlower(MESSAGES[i % MESSAGES.length], 120, 165, 800 + (i + rnd() * .8) / NF * 1300));
  // flores pequeñas que solo aparecen durante el viaje de entrada y se desvanecen al llegar
  const introFlowers = Array.from({ length: 340 }, () => {
    const a = rnd() * 6.283, r = 250 + Math.pow(rnd(), .7) * 3600;
    const f = mkFlower(null, 45, 100, 0);
    f.px = r * Math.cos(a); f.py = r * Math.sin(a); f.pz = -14000 + 1500 + rnd() * 8600; f.mul = 1;
    return f;
  });
  // galaxia espiral de estrellas doradas miniatura
  const GN = 7000, gal = [];
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / .75;
  const GCOL = ['#fff6d6', '#ffe9a0', '#ffd75e', '#ffc23a', '#f0a020'];
  for (let i = 0; i < GN; i++) {
    let x, y, z, q;
    if (rnd() < .2) { const rb = 320; x = gauss() * rb; z = gauss() * rb; y = gauss() * rb * .55; q = Math.hypot(x, z) / RG; }
    else {
      const r = RG * Math.pow(rnd(), 1.35), th = (rnd() < .3 ? rnd() * 6.283 : (rnd() < .5 ? 0 : Math.PI) + r / RG * 5.4 + gauss() * .38);
      x = r * Math.cos(th); z = r * Math.sin(th); y = gauss() * (30 + (1 - r / RG) * 110); q = r / RG;
    }
    const ci = Math.min(4, Math.floor(q * 6.5 + rnd() * .9));
    gal.push({ x, y, z, ci, sz: .8 + rnd() * 1.6 });
  }
  gal.sort((a, b) => a.ci - b.ci);
  let gRot = 0, gVel = 0, gTilt = -.6; // giro de toda la galaxia alrededor de su centro
  function updateOrbit(f, t) {
    const a = f.ang + f.w * t * .001;
    const x0 = f.rad * Math.cos(a), z0 = f.rad * Math.sin(a), y0 = f.h + Math.sin(t * .0007 + f.ph) * 14;
    const py = y0 * Math.cos(f.tilt) - z0 * Math.sin(f.tilt), pz = y0 * Math.sin(f.tilt) + z0 * Math.cos(f.tilt);
    const c = Math.cos(gRot), n = Math.sin(gRot);
    const ax = x0 * c + pz * n, az = -x0 * n + pz * c, ct = Math.cos(gTilt), st = Math.sin(gTilt);
    f.px = ax; f.py = py * ct - az * st; f.pz = py * st + az * ct;
  }

  // ramo del centro
  const BS = 1.5, TIE = { x: 0, y: -210 * 1.5, z: 0 };
  const bouquet = Array.from({ length: 11 }, (_, i) => {
    const cy = 1 - (i + .5) / 11 * .95, ph = i * 2.39996, rr = Math.sqrt(1 - cy * cy);
    return {
      ox: 105 * BS * rr * Math.cos(ph), oy: (-30 + 105 * cy) * BS, oz: 105 * BS * rr * Math.sin(ph),
      r: (46 + rnd() * 14) * BS, petals: 8 + ((rnd() * 3) | 0), rot: rnd() * 6.28, sp: (rnd() - .5) * .3, ph: rnd() * 6.28,
      msg: CENTER, px: 0, py: 0, pz: 0
    };
  });
  const leaves = Array.from({ length: 8 }, (_, i) => ({ a: i / 8 * 6.283 + .3, s: .7 + rnd() * .5 }));

  // corazón de brillos amarillos
  const sparks = Array.from({ length: 340 }, () => {
    const fill = rnd() < .28;
    return { u: rnd() * 6.283, s: fill ? Math.sqrt(rnd()) * .92 : .96 + (rnd() - .5) * .1, z: (rnd() - .5) * 170, sz: 8 + rnd() * 16, ph: rnd() * 6.28, sp: .4 + rnd() * .9 };
  });
  const dust = Array.from({ length: 420 }, () => ({ ...sph(150, 4800), r: .5 + rnd() * 1.1, ph: rnd() * 6.28, sp: .3 + rnd(), gold: rnd() < .45 }));
  let shoots = [], nextShoot = 1.5;
  const sprite = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,250,200,1)'); gr.addColorStop(.25, 'rgba(255,215,70,.75)'); gr.addColorStop(1, 'rgba(255,190,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(255,245,190,.95)'; g.lineWidth = 2; g.beginPath();
    g.moveTo(32, 2); g.lineTo(32, 62); g.moveTo(2, 32); g.lineTo(62, 32); g.stroke();
    return c;
  })();

  // ---------- cámara ----------
  const INTRO_DUR = 7, INTRO_Z = -14000, END_Z = -4600;
  let phase = 'wait', ts = 0, introMul = 1, introT = 0, intro = true, streak = 0, modal = false, last = performance.now(), hits = [];
  const cam = { x: 0, y: 0, z: INTRO_Z, yaw: 0, pitch: 0, ty: 0, tp: 0 };

  function project(px, py, pz) {
    const dx = px - cam.x, dy = py - cam.y, dz = pz - cam.z;
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const x1 = cy * dx - sy * dz, z1 = sy * dx + cy * dz;
    const y2 = cp * dy - sp * z1, z2 = sp * dy + cp * z1;
    if (z2 < NEAR) return null;
    const k = F / z2;
    return { sx: W / 2 + x1 * k, sy: H / 2 - y2 * k, k, z: z2 };
  }

  // la cámara solo se acerca/aleja del centro; la vista nunca gira
  function moveBy(fw) {
    if (intro || modal) return;
    cam.z = -Math.max(MINR, Math.min(MAXR, -cam.z - fw));
  }

  // ---------- dibujo ----------
  function drawFlower(f, x, y, z, t) {
    const p = project(x, y, z);
    if (!p) return;
    const R = f.r * p.k;
    if (R < .8 || p.sx < -R * 3 || p.sx > W + R * 3 || p.sy < -R * 3 || p.sy > H + R * 3) return;
    const a = Math.min(1, (p.z - NEAR) / 120) * Math.min(1, 1.8 - p.z / 9000) * (f.mul === undefined ? 1 : f.mul);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.translate(p.sx, p.sy);
    const g = ctx.createRadialGradient(0, 0, R * .2, 0, 0, R * 2.4);
    g.addColorStop(0, 'rgba(255,220,60,.35)'); g.addColorStop(1, 'rgba(255,220,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 2.4, 0, 6.283); ctx.fill();
    ctx.rotate(f.rot + t * .0002 * f.sp * 6);
    const n = f.petals;
    for (let i = 0; i < n; i++) {
      ctx.save(); ctx.rotate(i / n * 6.283);
      const pg = ctx.createLinearGradient(0, 0, 0, -R);
      pg.addColorStop(0, '#ff9f1c'); pg.addColorStop(.5, '#ffc61a'); pg.addColorStop(1, '#fff07a');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.ellipse(0, -R * .58, R * .27, R * .48, 0, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * .3);
    cg.addColorStop(0, '#5a2d05'); cg.addColorStop(1, '#a35a10');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, R * .28, 0, 6.283); ctx.fill();
    ctx.restore();
    if (f.msg) hits.push({ msg: f.msg, sx: p.sx, sy: p.sy, R: Math.max(R * 1.15, 18), z: p.z });
  }

  function drawCenter(t) {
    const rot = t * .0002 + gRot, cr = Math.cos(rot), sr = Math.sin(rot);
    for (const b of bouquet) {
      b.px = b.ox * cr + b.oz * sr; b.pz = -b.ox * sr + b.oz * cr; b.py = b.oy + Math.sin(t * .001 + b.ph) * 4;
    }
    const T = project(TIE.x, TIE.y, TIE.z);
    // tallos y hojas
    if (T) {
      ctx.lineCap = 'round';
      for (const b of bouquet) {
        const p = project(b.px, b.py, b.pz); if (!p) continue;
        ctx.strokeStyle = '#2f8f3f'; ctx.lineWidth = Math.max(1, 6 * BS * T.k);
        ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(T.sx, T.sy); ctx.stroke();
      }
      for (const l of leaves) {
        const px = Math.cos(l.a + rot * 2) * 125 * BS * l.s, pz = Math.sin(l.a + rot * 2) * 125 * BS * l.s;
        const p = project(px, TIE.y + 95 * BS * l.s, pz); if (!p) continue;
        const ang = Math.atan2(p.sy - T.sy, p.sx - T.sx);
        ctx.save(); ctx.translate(p.sx, p.sy); ctx.rotate(ang);
        ctx.fillStyle = '#38a84a'; ctx.beginPath(); ctx.ellipse(0, 0, 58 * BS * l.s * T.k, 20 * BS * l.s * T.k, 0, 0, 6.283); ctx.fill();
        ctx.restore();
      }
      // moño
      ctx.save(); ctx.translate(T.sx, T.sy); ctx.fillStyle = '#e8365d';
      for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * .55); ctx.beginPath(); ctx.ellipse(s * 40 * BS * T.k, 0, 42 * BS * T.k, 17 * BS * T.k, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
      ctx.beginPath(); ctx.arc(0, 0, 14 * BS * T.k, 0, 6.283); ctx.fill(); ctx.restore();
    }
    // flores del ramo de fondo a frente
    const order = bouquet.slice().sort((a, b) => Math.hypot(b.px - cam.x, b.py - cam.y, b.pz - cam.z) - Math.hypot(a.px - cam.x, a.py - cam.y, a.pz - cam.z));
    for (const b of order) drawFlower(b, b.px, b.py, b.pz, t);

    // corazón de brillos, siempre de frente a la cámara
    const ang = Math.atan2(cam.x, cam.z), ca = Math.cos(ang), sa = Math.sin(ang), SC = 30;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const s of sparks) {
      const u = s.u + t * .00008 * s.sp;
      const hx = 16 * Math.pow(Math.sin(u), 3) * SC * s.s;
      const hy = (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) * SC * s.s + 60;
      const p = project(hx * ca + s.z * sa, hy, -hx * sa + s.z * ca); if (!p) continue;
      const tw = .45 + .55 * Math.sin(t * .003 * s.sp + s.ph), sz = s.sz * p.k * (.7 + tw * .5) * 2.2 * BS;
      if (sz < 1) continue;
      ctx.globalAlpha = Math.min(1, tw * Math.min(1, (p.z - NEAR) / 100));
      ctx.drawImage(sprite, p.sx - sz / 2, p.sy - sz / 2, sz, sz);
    }
    ctx.restore();

    const c = project(0, 30, 0);
    if (c) hits.push({ msg: CENTER, sx: c.sx, sy: c.sy, R: Math.max(140 * BS * c.k, 22), z: c.z });
  }

  function drawGalaxy(t, mul) {
    const rot = gRot + t * .00004, c = Math.cos(rot), n = Math.sin(rot), ct = Math.cos(gTilt), st = Math.sin(gTilt);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const o = project(0, 0, 0);
    if (o) {
      const sq = Math.max(.3, Math.abs(Math.sin(gTilt)) * .9 + .1);
      for (const [rr, al, col] of [[RG * 1.05, .16, '255,170,50'], [RG * .35, .32, '255,205,110'], [RG * .11, .55, '255,245,210']]) {
        const R = rr * o.k, g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
        g.addColorStop(0, `rgba(${col},${al * mul})`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.save(); ctx.translate(o.sx, o.sy); ctx.scale(1, sq); ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2); ctx.restore();
      }
    }
    let cur = -1;
    for (const q of gal) {
      const ax = q.x * c + q.z * n, az = -q.x * n + q.z * c;
      const py = q.y * ct - az * st, pz = q.y * st + az * ct, dz = pz - cam.z;
      if (dz < NEAR) continue;
      const k = F / dz, sx = W / 2 + ax * k, sy = H / 2 - py * k;
      if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
      if (q.ci !== cur) { cur = q.ci; ctx.fillStyle = GCOL[cur]; }
      ctx.globalAlpha = (.55 + .3 * ((q.sz * 7) % 1)) * mul;
      const z = Math.min(4, q.sz * (.8 + k * 3.5));
      ctx.fillRect(sx - z / 2, sy - z / 2, z, z);
    }
    ctx.restore();
  }

  // pantalla de inicio: un punto amarillo; al tocarlo se abren los pétalos y arranca el viaje
  function drawStart(t) {
    const cx = W / 2, cy = H / 2, m = Math.min(W, H);
    const a = ts < .8 ? 1 : Math.max(0, 1 - (ts - .8) / .7);
    ctx.fillStyle = `rgba(4,3,12,${a})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(cx, cy);
    if (phase === 'wait') {
      const pu = .5 + .5 * Math.sin(t * .004), R = 9 + pu * 4;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 8);
      g.addColorStop(0, 'rgba(255,225,90,.55)'); g.addColorStop(1, 'rgba(255,200,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 8, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ffd93b'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fill();
    } else {
      const q = Math.min(1, ts / .5), p = 1 + 2.2 * Math.pow(q - 1, 3) + 1.2 * Math.pow(q - 1, 2), // easeOutBack rápido
        zz = Math.max(0, Math.min(1, (ts - .8) / .7)), sc = 1 + zz * zz * 9, R = m * .2 * sc, fa = 1 - zz;
      ctx.globalAlpha = fa;
      const g = ctx.createRadialGradient(0, 0, R * .1, 0, 0, R * 2.4);
      g.addColorStop(0, 'rgba(255,225,90,.5)'); g.addColorStop(1, 'rgba(255,200,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 2.4, 0, 6.283); ctx.fill();
      ctx.rotate((1 - Math.min(1, q)) * -1.6 + ts * .5);
      const n = 10;
      for (let i = 0; i < n; i++) {
        ctx.save(); ctx.rotate(i / n * 6.283);
        const L = R * Math.max(.02, p), pg = ctx.createLinearGradient(0, 0, 0, -L);
        pg.addColorStop(0, '#ff9f1c'); pg.addColorStop(.5, '#ffc61a'); pg.addColorStop(1, '#fff07a');
        ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(0, -L * .58, R * .2 * Math.min(1, p), L * .48, 0, 0, 6.283); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#a35a10'; ctx.beginPath(); ctx.arc(0, 0, R * (.05 + .2 * Math.min(1, p)), 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ffd93b'; ctx.beginPath(); ctx.arc(0, 0, R * .06, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }

  const held = new Set();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    let fade = 0;
    if (intro) {
      if (phase !== 'wait') ts += dt;
      if (ts >= .8) introT += dt;
      const u = Math.min(1, introT / INTRO_DUR), e = 1 - Math.pow(1 - u, 4);
      cam.z = INTRO_Z + (END_Z - INTRO_Z) * e;
      streak = 4 * Math.pow(1 - u, 3) * (END_Z - INTRO_Z) / INTRO_DUR * .2;
      F = Math.min(W, H) * (0.45 + 0.65 * e);
      fade = 0;
      introMul = u < .7 ? 1 : Math.max(0, 1 - (u - .7) / .28);
      if (u >= 1) { intro = false; streak = 0; F = Math.min(W, H) * 1.1; document.body.classList.remove('intro'); }
    } else if (held.size) {
      const fw = (held.has('f') ? 1 : 0) - (held.has('b') ? 1 : 0), rt = (held.has('r') ? 1 : 0) - (held.has('l') ? 1 : 0);
      moveBy(fw * -cam.z * .6 * dt); gVel = -rt * .8;
    }
    if (ptrs.size < 2 && !(drag && drag.moved)) { gRot += gVel * dt; gVel *= Math.exp(-dt * 2.2); }
    cam.yaw += (cam.ty - cam.yaw) * Math.min(1, dt * 8);
    cam.pitch += (cam.tp - cam.pitch) * Math.min(1, dt * 8);

    ctx.fillStyle = '#04030c'; ctx.fillRect(0, 0, W, H);
    for (const n of nebulas) {
      const p = project(n.x, n.y, n.z); if (!p) continue;
      const R = n.r * p.k; if (R > W * 4) continue;
      const g = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, R);
      g.addColorStop(0, `hsla(${n.h},70%,40%,.22)`); g.addColorStop(1, `hsla(${n.h},70%,40%,0)`);
      ctx.fillStyle = g; ctx.fillRect(p.sx - R, p.sy - R, R * 2, R * 2);
    }
    for (const s of stars) {
      const p = project(s.x, s.y, s.z); if (!p) continue;
      if (p.sx < 0 || p.sx > W || p.sy < 0 || p.sy > H) continue;
      ctx.globalAlpha = (.6 + .4 * Math.sin(now * .002 + s.t)) * Math.min(1, p.k * 1.5 + .3);
      const r = Math.min(3, s.r * (.6 + p.k * .8));
      if (streak > 4) {
        const zs = cam.z; cam.z -= streak; const q = project(s.x, s.y, s.z); cam.z = zs;
        if (q) {
          ctx.strokeStyle = '#ffeeb0'; ctx.lineWidth = r * 1.3; ctx.beginPath();
          ctx.moveTo(p.sx, p.sy); ctx.lineTo(q.sx, q.sy); ctx.stroke(); continue;
        }
      }
      ctx.fillStyle = '#fff'; ctx.fillRect(p.sx - r / 2, p.sy - r / 2, r, r);
    }
    ctx.globalAlpha = 1;

    // estrellas fugaces
    nextShoot -= dt;
    if (!intro && nextShoot <= 0) {
      nextShoot = 1.2 + rnd() * 3.2;
      const ang = .35 + rnd() * .5, sp = 650 + rnd() * 500, dirx = rnd() < .5 ? 1 : -1;
      shoots.push({ x: rnd() * W, y: rnd() * H * .55, vx: Math.cos(ang) * sp * dirx, vy: Math.sin(ang) * sp, age: 0, life: .7 + rnd() * .6 });
    }
    ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
    shoots = shoots.filter(o => (o.age += dt) < o.life);
    for (const o of shoots) {
      o.x += o.vx * dt; o.y += o.vy * dt;
      const k = Math.sin(o.age / o.life * Math.PI), tx = o.x - o.vx * .12, ty = o.y - o.vy * .12;
      const g = ctx.createLinearGradient(o.x, o.y, tx, ty);
      g.addColorStop(0, `rgba(255,250,220,${k})`); g.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(tx, ty); ctx.stroke();
    }
    // partículas flotando
    const dc = Math.cos(gRot * .6), ds = Math.sin(gRot * .6);
    for (const d of dust) {
      const w = Math.sin(now * .0003 * d.sp + d.ph) * 40, wy = Math.cos(now * .00025 * d.sp + d.ph) * 40;
      const p = project(d.x * dc + d.z * ds + w, d.y + wy, -d.x * ds + d.z * dc); if (!p) continue;
      if (p.sx < 0 || p.sx > W || p.sy < 0 || p.sy > H) continue;
      const sz = Math.max(1, d.r * (.6 + p.k * 2));
      ctx.globalAlpha = (.35 + .35 * Math.sin(now * .002 * d.sp + d.ph)) * Math.min(1, p.z / 300);
      ctx.fillStyle = d.gold ? '#ffe27a' : '#cfd8ff';
      ctx.beginPath(); ctx.arc(p.sx, p.sy, sz, 0, 6.283); ctx.fill();
    }
    ctx.restore();

    drawGalaxy(now, intro ? Math.min(1, Math.max(0, (introT - 1.5) / 4)) : 1);
    if (intro && introMul > 0) {
      for (const f of introFlowers) { f.mul = introMul; f.d = f.pz - cam.z; }
      introFlowers.sort((a, b) => b.d - a.d);
      for (const f of introFlowers) if (f.d > NEAR) drawFlower(f, f.px, f.py, f.pz, now);
    }

    hits = [];
    for (const f of flowers) { updateOrbit(f, now); f.d = Math.hypot(f.px - cam.x, f.py - cam.y, f.pz - cam.z); }
    const items = flowers.slice();
    items.push({ center: true, d: Math.hypot(cam.x, cam.y, cam.z) });
    items.sort((a, b) => b.d - a.d);
    for (const it of items) it.center ? drawCenter(now) : drawFlower(it, it.px, it.py, it.pz, now);
    if (phase === 'wait' || ts < 1.5) drawStart(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- gestos ----------
  // 1 dedo: arrastrar gira la galaxia (o toca una flor). 2 dedos: pellizco = acercar / alejar.
  const ptrs = new Map();
  let drag = null, pinch = null;
  const two = () => { const [a, b] = [...ptrs.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2 }; };
  const spin = dx => { const d = -dx * .006; gRot += d; gVel = gVel * .6 + d * 60 * .4; };
  cv.addEventListener('pointerdown', e => {
    if (phase === 'wait') { phase = 'open'; ts = 0; return; }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    cv.setPointerCapture(e.pointerId); cv.classList.add('grabbing');
    if (ptrs.size === 1) { drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false }; gVel = 0; }
    else if (ptrs.size === 2) { drag = null; pinch = two(); hideHint(); }
  });
  cv.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size >= 2 && pinch) {
      const t = two();
      moveBy((t.d - pinch.d) * -cam.z * .007);
      spin(t.mx - pinch.mx);
      pinch = t;
    } else if (drag) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 6) drag.moved = true;
      if (drag.moved) {
        spin(e.clientX - drag.lx);
        gTilt = Math.max(-1.4, Math.min(1.4, gTilt - (e.clientY - drag.ly) * .004));
        hideHint();
      }
      drag.lx = e.clientX; drag.ly = e.clientY;
    }
  });
  const up = e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size === 0) cv.classList.remove('grabbing');
    if (e.type === 'pointerup' && drag && !drag.moved && !intro && ptrs.size === 0) {
      let best = null;
      for (const h of hits) if (Math.hypot(e.clientX - h.sx, e.clientY - h.sy) <= h.R && (!best || h.z < best.z)) best = h;
      if (best) openMsg(best.msg);
    }
    drag = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  addEventListener('wheel', e => { moveBy(-e.deltaY * -cam.z * .001); }, { passive: true });
  ['gesturestart', 'gesturechange'].forEach(g => addEventListener(g, e => e.preventDefault()));

  // teclado (solo escritorio)
  const km = { ArrowUp: 'f', w: 'f', ArrowDown: 'b', s: 'b', ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r' };
  addEventListener('keydown', e => { if (phase === 'wait') { phase = 'open'; ts = 0; return; } if (km[e.key]) { held.add(km[e.key]); hideHint(); } if (e.key === 'Escape') closeMsg(); });
  addEventListener('keyup', e => { if (km[e.key]) held.delete(km[e.key]); });

  function hideHint() {}

  // ---------- ventana de mensaje ----------
  const ov = document.getElementById('overlay'), card = document.getElementById('card');
  const photoWrap = document.getElementById('photoWrap'), photo = document.getElementById('photo');
  photo.addEventListener('error', () => { photoWrap.hidden = true; card.classList.remove('withphoto'); });
  function openMsg(m) {
    const ti = document.getElementById('title'), tx = document.getElementById('text');
    ti.textContent = m.title; ti.hidden = !m.title;
    card.classList.toggle('full', !!m.full); tx.scrollTop = 0;
    tx.textContent = m.text; tx.classList.toggle('long', m.text.length > 140);
    if (m.photo) { photoWrap.hidden = false; photo.src = m.photo; } else photoWrap.hidden = true;
    card.classList.toggle('withphoto', !!m.photo);
    ov.hidden = false; modal = true; held.clear(); hideHint();
  }
  function closeMsg() { ov.hidden = true; modal = false; }
  ov.addEventListener('pointerdown', e => { if (!card.contains(e.target)) closeMsg(); });
})();
