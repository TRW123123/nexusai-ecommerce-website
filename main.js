import * as THREE from 'three';

/* ══════════════════════════════════════════
   NAV SCROLL
══════════════════════════════════════════ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ══════════════════════════════════════════
   MOBILE NAV TOGGLE
══════════════════════════════════════════ */
const navToggle = document.querySelector('.mobile-nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('active'));
  });
}

/* ══════════════════════════════════════════
   3D HERO — Glowing Sphere + Orbit Rings
   Große zentrale 3D Animation
══════════════════════════════════════════ */
const canvas = document.getElementById('heroCanvas');
if (canvas) {
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a1612, 40, 120);

  const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 200);
  camera.position.set(0, 0, 42);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W(), H());
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x1a1612, 1);

  // ── Ambient + directional lights ──
  scene.add(new THREE.AmbientLight(0x3a2a18, 2));

  const light1 = new THREE.PointLight(0xc4703a, 80, 60); // cognac
  light1.position.set(10, 10, 15);
  scene.add(light1);

  const light2 = new THREE.PointLight(0xd4a547, 40, 50); // gold
  light2.position.set(-15, -8, 10);
  scene.add(light2);

  const light3 = new THREE.PointLight(0x8b5e3c, 30, 40); // bronze back
  light3.position.set(0, 0, -20);
  scene.add(light3);

  // ── Central sphere ──
  const sphereGeo = new THREE.SphereGeometry(7, 64, 64);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x2a1f14,
    roughness: 0.3,
    metalness: 0.9,
    emissive: 0x3d1f08,
    emissiveIntensity: 0.3,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  // ── Wireframe overlay on sphere ──
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xc4703a,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  });
  const wireGeo = new THREE.SphereGeometry(7.05, 24, 24);
  const wire = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wire);

  // ── Orbit ring helper ──
  function makeRing(radius, tube, rot, color, opacity) {
    const geo = new THREE.TorusGeometry(radius, tube, 8, 120);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = rot.x || 0;
    mesh.rotation.y = rot.y || 0;
    mesh.rotation.z = rot.z || 0;
    scene.add(mesh);
    return mesh;
  }

  const ring1 = makeRing(11,  0.04, { x: Math.PI / 2 },           0xc4703a, 0.5);
  const ring2 = makeRing(13,  0.03, { x: Math.PI / 3, z: 0.4 },   0xd4a547, 0.3);
  const ring3 = makeRing(15.5,0.025,{ x: Math.PI / 5, y: 1.0 },   0xa0622c, 0.2);
  const ring4 = makeRing(18,  0.02, { x: -Math.PI / 6, z: -0.8 }, 0xc4703a, 0.12);

  // ── Orbiting dot on ring1 ──
  function makeOrbitDot(color, size) {
    const g = new THREE.SphereGeometry(size, 12, 12);
    const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, roughness: 0, metalness: 0 });
    return new THREE.Mesh(g, m);
  }
  const dot1 = makeOrbitDot(0xf0a060, 0.22);
  const dot2 = makeOrbitDot(0xd4a547, 0.16);
  const dot3 = makeOrbitDot(0xe08a50, 0.18);
  scene.add(dot1, dot2, dot3);

  // ── Particle field ──
  const PTCOUNT = 600;
  const ptPos = new Float32Array(PTCOUNT * 3);
  for (let i = 0; i < PTCOUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 22 + Math.random() * 28;
    ptPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    ptPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    ptPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
  const ptMat = new THREE.PointsMaterial({
    color: 0xc4703a,
    size: 0.18,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(ptGeo, ptMat));

  // ── Glow halo (additive sprite) ──
  const haloGeo = new THREE.SphereGeometry(9.5, 32, 32);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xc4703a,
    transparent: true,
    opacity: 0.04,
    side: THREE.BackSide,
  });
  scene.add(new THREE.Mesh(haloGeo, haloMat));

  // ── Mouse parallax ──
  let mx = 0, my = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ── Animation ──
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;

    // Sphere slow rotation
    sphere.rotation.y = t * 0.2;
    sphere.rotation.x = t * 0.05;
    wire.rotation.y = -t * 0.15;

    // Rings rotate at different speeds
    ring1.rotation.z = t * 0.18;
    ring2.rotation.z = -t * 0.13;
    ring2.rotation.y = t * 0.06;
    ring3.rotation.x = Math.PI / 5 + t * 0.09;
    ring3.rotation.z = t * 0.07;
    ring4.rotation.y = t * 0.05;
    ring4.rotation.x = -Math.PI / 6 + t * 0.04;

    // Orbiting dots
    const r1 = 11, r2 = 13, r3 = 15.5;
    dot1.position.set(Math.cos(t * 0.7) * r1, Math.sin(t * 0.7) * r1 * 0.1, Math.sin(t * 0.7) * r1 * 0.99);
    dot2.position.set(Math.cos(t * 0.5 + 2) * r2 * 0.87, Math.sin(t * 0.5) * r2, Math.cos(t * 0.5 + 1) * r2 * 0.5);
    dot3.position.set(Math.sin(t * 0.9 + 1) * r3, Math.cos(t * 0.6) * r3 * 0.6, Math.sin(t * 0.8) * r3 * 0.8);

    // Camera parallax (smooth)
    camera.position.x += (mx * 3 - camera.position.x) * 0.025;
    camera.position.y += (my * 2 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, 0);

    // Pulsing light
    light1.intensity = 80 + Math.sin(t * 1.3) * 12;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });
}

/* ══════════════════════════════════════════
   TERMINAL — funktioniert via IntersectionObserver
   Startet wenn Demo-Section sichtbar wird
══════════════════════════════════════════ */
const termBody = document.getElementById('termBody');
if (termBody) {
  let started = false;

  const lines = [
    { d: 400,  html: `<div class="tl"><span class="ts">▶ Bağlantı kuruluyor...</span></div>` },
    { d: 1100, html: `<div class="tl"><span class="tg">✓ vintage-atelier bağlandı &mdash; 1.247 ürün, 3 aktif kampanya</span></div>` },
    { d: 1700, html: `<div class="tl to" style="color:#6b5f55">──────────────────────────────────────</div>` },
    { d: 2000, html: `<div class="tl"><span class="ts">▶ [1/4] PPC Kampanya Analizi</span></div>` },
    { d: 2600, html: `<div class="tl"><span class="to">→ "Vintage Lamp", "Retro Clock", "Boho Decor" taranıyor...</span></div>` },
    { d: 3300, html: `<div class="tl"><span class="tw">⚠ "Retro Clock": 47 dönüşümsüz keyword bulundu</span></div>` },
    { d: 3800, html: `<div class="tl"><span class="te">✗ Tahmini aylık israf: <span class="tv">$1.240</span></span></div>` },
    { d: 4500, html: `<div class="tl"><span class="ts">▶ [2/4] Keyword Fırsat Analizi</span></div>` },
    { d: 5200, html: `<div class="tl"><span class="to">→ Rakip mağazalar analiz ediliyor...</span></div>` },
    { d: 6000, html: `<div class="tl"><span class="tg">✓ 23 yüksek potansiyelli keyword keşfedildi</span></div>` },
    { d: 6500, html: `<div class="tl"><span class="tk">  En iyi: </span><span class="tv">"vintage table lamp industrial"</span><span class="to"> — 1.200 arama/ay, düşük rekabet</span></div>` },
    { d: 7200, html: `<div class="tl"><span class="ts">▶ [3/4] Listing SEO Skoru</span></div>` },
    { d: 7800, html: `<div class="tl"><span class="tk">  Ortalama skor: </span><span class="tv">54/100</span><span class="to"> (hedef: 85+)</span></div>` },
    { d: 8300, html: `<div class="tl"><span class="tw">⚠ 34 listingde eksik tag &bull; 12 başlık uyumsuz</span></div>` },
    { d: 9000, html: `<div class="tl"><span class="ts">▶ [4/4] Review Analizi</span></div>` },
    { d: 9600, html: `<div class="tl"><span class="tg">✓ Ortalama yıldız: 4.7 &nbsp;|&nbsp; <span class="tw">3 cevapsız negatif review!</span></span></div>` },
    { d: 10400,html: `<div class="tl to" style="color:#6b5f55">──────────────────────────────────────</div>` },
    { d: 10700,html: `<div class="tl"><span class="ts">■ RAPOR ÖZETI</span></div>` },
    { d: 11200,html: `<div class="tl"><span class="tk">  Aylık potansiyel kazanç: </span><span class="tg">+$3.840</span></div>` },
    { d: 11700,html: `<div class="tl"><span class="tk">  Önerilen otomasyon: </span><span class="tv">PPC Waste + Keyword Gap + Review Bot</span></div>` },
    { d: 12300,html: `<div class="tl"><span class="tg">✓ Analiz tamamlandı &mdash; rapor e-postanıza gönderildi</span></div>` },
    { d: 12800,html: `<div class="tl"><span class="tp">$</span><span class="cursor"></span></div>` },
  ];

  function startTerminal() {
    if (started) return;
    started = true;
    termBody.innerHTML = '';
    
    let endDelay = 0;
    lines.forEach(l => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.innerHTML = l.html;
        termBody.appendChild(div.firstChild || div);
        termBody.scrollTop = termBody.scrollHeight;
      }, l.d);
      endDelay = Math.max(endDelay, l.d);
    });

    setTimeout(() => {
      started = false;
      startTerminal();
    }, endDelay + 4000);
  }

  // Start when demo section enters viewport
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { startTerminal(); obs.disconnect(); } });
  }, { threshold: 0.25 });
  obs.observe(termBody.closest('section') || termBody);
}

/* ══════════════════════════════════════════
   PLATFORM TABS
══════════════════════════════════════════ */
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.remove('active');
      p.hidden = true;
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(`panel-${target}`);
    if (panel) { panel.classList.add('active'); panel.hidden = false; }
  });
});

document.querySelectorAll('.show-all-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const panel = e.target.closest('.tab-panel');
    panel.querySelectorAll('.card.extra').forEach(card => card.classList.toggle('hidden-card'));
    panel.querySelectorAll('.card.extra').forEach(card => card.classList.toggle('visible'));
    
    if (btn.innerHTML.includes('Tüm Özellikleri Gör')) {
      btn.innerHTML = 'Daha Az Göster <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="transform: rotate(180deg)"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    } else {
      btn.innerHTML = 'Tüm Özellikleri Gör <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    }
  });
});

/* ══════════════════════════════════════════
   COUNT-UP NUMBERS
══════════════════════════════════════════ */
function countUp(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 2000;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Hero counters — start after fonts + 3D load
function startHeroCounters() {
  document.querySelectorAll('.count-hero').forEach(el => {
    if (el.textContent === '0') countUp(el);
  });
}
// Start after DOM and fonts are ready to prevent zero-width calculation race condition
Promise.all([
  document.fonts ? document.fonts.ready : Promise.resolve(),
  new Promise(res => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', res);
    } else {
      res();
    }
  })
]).then(() => {
  requestAnimationFrame(() => {
    setTimeout(startHeroCounters, 100);
  });
});

// Section counters — on scroll
const countObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.count-up').forEach(el => {
        if (el.textContent === '0') countUp(el);
      });
      countObs.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.stats-grid').forEach(el => countObs.observe(el));

/* ══════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const delay = parseFloat(e.target.dataset.delay || 0);
      setTimeout(() => e.target.classList.add('visible'), delay * 1000);
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ══════════════════════════════════════════
   FORM SUBMIT (NETLIFY AJAX)
══════════════════════════════════════════ */
const form = document.getElementById('ctaForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalBtnText = btn.textContent;
    btn.textContent = 'Gönderiliyor...';
    btn.disabled = true;
    btn.style.opacity = '0.8';

    const formData = new FormData(form);
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    })
    .then(() => {
      btn.textContent = '✓ Gönderildi — 24 saat içinde dönüş yapacağız!';
      setTimeout(() => {
        btn.textContent = originalBtnText;
        btn.disabled = false;
        btn.style.opacity = '';
        form.reset();
      }, 5000);
    })
    .catch((error) => {
      console.error(error);
      alert('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      btn.textContent = originalBtnText;
      btn.disabled = false;
      btn.style.opacity = '';
    });
  });
}
