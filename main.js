import * as THREE from 'three';

/* ══════════════════════════════════════════
   NAV — scroll behavior
══════════════════════════════════════════ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ══════════════════════════════════════════
   DARK MODE TOGGLE
══════════════════════════════════════════ */
const html = document.documentElement;
const themeBtn = document.querySelector('[data-theme-toggle]');
let currentTheme = 'dark';
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', currentTheme);
    themeBtn.innerHTML = currentTheme === 'dark'
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  });
}

/* ══════════════════════════════════════════
   THREE.JS — HERO PARTICLE NETWORK
══════════════════════════════════════════ */
const heroCanvas = document.getElementById('heroCanvas');
if (heroCanvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 60;

  const renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Particle positions
  const COUNT = 180;
  const positions = new Float32Array(COUNT * 3);
  const velocities = [];
  for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() - 0.5) * 140;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 60;
    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    velocities.push({
      x: (Math.random() - 0.5) * 0.04,
      y: (Math.random() - 0.5) * 0.04,
      z: (Math.random() - 0.5) * 0.02,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.8,
    color: 0x818cf8,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Lines between close particles
  const lineMat = new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.08 });
  const lineGeo = new THREE.BufferGeometry();
  const linePositions = new Float32Array(COUNT * COUNT * 6); // max connections
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(linesMesh);

  // Mouse influence
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let lineIdx = 0;
  const DIST_THRESHOLD = 28;

  function animate() {
    requestAnimationFrame(animate);

    const pos = geo.attributes.position.array;

    // Update particle positions
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;

      // Bounce boundaries
      if (Math.abs(pos[i * 3]) > 70)     velocities[i].x *= -1;
      if (Math.abs(pos[i * 3 + 1]) > 50) velocities[i].y *= -1;
      if (Math.abs(pos[i * 3 + 2]) > 30) velocities[i].z *= -1;
    }
    geo.attributes.position.needsUpdate = true;

    // Camera slight parallax
    camera.position.x += (mouseX * 4 - camera.position.x) * 0.02;
    camera.position.y += (mouseY * 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    // Update connecting lines
    const lp = lineGeo.attributes.position.array;
    lineIdx = 0;
    for (let a = 0; a < COUNT; a++) {
      for (let b = a + 1; b < COUNT; b++) {
        const dx = pos[a*3] - pos[b*3];
        const dy = pos[a*3+1] - pos[b*3+1];
        const dz = pos[a*3+2] - pos[b*3+2];
        const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (d < DIST_THRESHOLD && lineIdx < lp.length - 5) {
          lp[lineIdx++] = pos[a*3];
          lp[lineIdx++] = pos[a*3+1];
          lp[lineIdx++] = pos[a*3+2];
          lp[lineIdx++] = pos[b*3];
          lp[lineIdx++] = pos[b*3+1];
          lp[lineIdx++] = pos[b*3+2];
        }
      }
    }
    // Clear rest
    for (let i = lineIdx; i < lp.length; i++) lp[i] = 0;
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.setDrawRange(0, lineIdx / 3);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ══════════════════════════════════════════
   THREE.JS — CTA BACKGROUND (subtle)
══════════════════════════════════════════ */
const ctaCanvas = document.getElementById('ctaCanvas');
if (ctaCanvas) {
  const scene2 = new THREE.Scene();
  const camera2 = new THREE.PerspectiveCamera(50, ctaCanvas.offsetWidth / ctaCanvas.offsetHeight, 0.1, 100);
  camera2.position.z = 20;

  const renderer2 = new THREE.WebGLRenderer({ canvas: ctaCanvas, antialias: true, alpha: true });
  renderer2.setSize(ctaCanvas.offsetWidth || 800, ctaCanvas.offsetHeight || 400);
  renderer2.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer2.setClearColor(0x000000, 0);

  const geo2 = new THREE.TorusGeometry(8, 2.5, 16, 80);
  const mat2 = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.08 });
  const torus = new THREE.Mesh(geo2, mat2);
  scene2.add(torus);

  const geo3 = new THREE.TorusGeometry(12, 1.5, 12, 60);
  const mat3 = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.05 });
  const torus2 = new THREE.Mesh(geo3, mat3);
  torus2.rotation.x = Math.PI / 3;
  scene2.add(torus2);

  function animateCta() {
    requestAnimationFrame(animateCta);
    torus.rotation.y += 0.003;
    torus.rotation.x += 0.001;
    torus2.rotation.z += 0.002;
    renderer2.render(scene2, camera2);
  }
  animateCta();

  const resizeObs = new ResizeObserver(() => {
    const w = ctaCanvas.offsetWidth || 800;
    const h = ctaCanvas.offsetHeight || 400;
    camera2.aspect = w / h;
    camera2.updateProjectionMatrix();
    renderer2.setSize(w, h);
  });
  resizeObs.observe(ctaCanvas.parentElement);
}

/* ══════════════════════════════════════════
   TERMINAL ANIMATION
══════════════════════════════════════════ */
const terminalBody = document.getElementById('terminalBody');
if (terminalBody) {
  const lines = [
    { delay: 500,  type: 'output', cls: 'term-section', text: '▶ Mağaza bağlantısı kuruluyor...' },
    { delay: 1200, type: 'output', cls: 'term-success', text: '✓ vintage-atelier bağlandı (1.247 ürün, 3 aktif kampanya)' },
    { delay: 1800, type: 'output', cls: 'term-section', text: '\n▶ [1/5] PPC Kampanya Analizi başlatılıyor...' },
    { delay: 2400, type: 'output', cls: 'term-output',  text: '   → Aktif kampanya taranıyor: "Vintage Lamp", "Retro Clock", "Boho Decor"' },
    { delay: 3200, type: 'output', cls: 'term-warn',    text: '   ⚠ UYARI: "Retro Clock" kampanyasında 47 dönüşümsüz keyword tespit edildi' },
    { delay: 3800, type: 'output', cls: 'term-error',   text: '   ✗ Aylık israf tahmini: €1.240 — bu keywordler hemen negatife alınmalı' },
    { delay: 4500, type: 'output', cls: 'term-section', text: '\n▶ [2/5] Keyword Fırsat Analizi...' },
    { delay: 5200, type: 'output', cls: 'term-output',  text: '   → Rakip mağaza analizi: "arthaus-vintage", "retro-world-de"...' },
    { delay: 6000, type: 'output', cls: 'term-success', text: '   ✓ 23 yüksek potansiyelli keyword bulundu (rakiplerin hedeflemediği)' },
    { delay: 6400, type: 'pair',   key: '   En iyi fırsat: ', val: '"vintage table lamp industrial" — 1.200 arama/ay, düşük rekabet' },
    { delay: 7000, type: 'output', cls: 'term-section', text: '\n▶ [3/5] Listing SEO Skoru...' },
    { delay: 7600, type: 'pair',   key: '   Ortalama SEO skoru: ', val: '54/100 (hedef: 85+)' },
    { delay: 8000, type: 'output', cls: 'term-warn',    text: '   ⚠ 34 listingde eksik tag tespit edildi' },
    { delay: 8500, type: 'output', cls: 'term-warn',    text: '   ⚠ 12 başlık arama amacına uygun değil' },
    { delay: 9200, type: 'output', cls: 'term-section', text: '\n▶ [4/5] Review Analizi...' },
    { delay: 9800, type: 'output', cls: 'term-success', text: '   ✓ Ortalama yıldız: 4.7 — güçlü sosyal kanıt' },
    { delay: 10200,type: 'output', cls: 'term-warn',    text: '   ⚠ Son 30 günde 3 cevapsız negatif review — müdahale şart!' },
    { delay: 11000,type: 'output', cls: 'term-section', text: '\n▶ [5/5] Rapor oluşturuluyor...' },
    { delay: 11800,type: 'output', cls: 'term-success', text: '   ✓ Analiz tamamlandı. 47 dakika sürdü (normal: 8-10 saat)' },
    { delay: 12200,type: 'output', cls: 'term-section', text: '\n══ NEXUS AI ÖZET RAPORU ══' },
    { delay: 12500,type: 'pair',   key: '   Potansiyel aylık kazanç: ', val: '+€3.840 (PPC tasarruf + yeni keyword trafiği)' },
    { delay: 13000,type: 'pair',   key: '   Tavsiye edilen otomasyon: ', val: 'PPC Waste Detector + Keyword Gap Finder + Review Bot' },
    { delay: 13500,type: 'output', cls: 'term-success', text: '\n✓ Rapor e-posta adresinize gönderildi. Demo için iletişime geçin.' },
    { delay: 14000,type: 'prompt', text: '' },
  ];

  function addLine(html, autoscroll = true) {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerHTML = html;
    terminalBody.appendChild(div);
    if (autoscroll) terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  // Start terminal only when in view
  const termObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        termObs.disconnect();
        lines.forEach(l => {
          setTimeout(() => {
            if (l.type === 'output') {
              addLine(`<span class="${l.cls}">${escapeHtml(l.text)}</span>`);
            } else if (l.type === 'pair') {
              addLine(`<span class="term-key">${escapeHtml(l.key)}</span><span class="term-value">${escapeHtml(l.val)}</span>`);
            } else if (l.type === 'prompt') {
              addLine(`<span class="prompt">$</span><span class="cursor"></span>`);
            }
          }, l.delay);
        });
      }
    });
  }, { threshold: 0.3 });
  termObs.observe(terminalBody);
}

function escapeHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════════════
   GSAP SCROLL ANIMATIONS
══════════════════════════════════════════ */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  // Bento cards reveal (animate FROM hidden)
  gsap.utils.toArray('.bento-card').forEach((card, i) => {
    const delay = parseFloat(card.dataset.delay || 0);
    gsap.from(card, {
      opacity: 0,
      y: 30,
      duration: 0.7,
      ease: 'power2.out',
      delay,
      scrollTrigger: {
        trigger: card,
        start: 'top 92%',
        toggleActions: 'play none none none',
      }
    });
  });

  // Bar fills
  gsap.utils.toArray('.bar-fill').forEach(bar => {
    ScrollTrigger.create({
      trigger: bar,
      start: 'top 90%',
      onEnter: () => bar.classList.add('animated'),
    });
  });

  // Count-up numbers
  function countUp(el) {
    const target = parseInt(el.dataset.target, 10);
    gsap.fromTo({ val: 0 }, { val: target }, {
      duration: 2,
      ease: 'power2.out',
      onUpdate: function() {
        el.textContent = Math.round(this.targets()[0].val);
      },
    });
  }

  // Hero stat counters (on load, after short delay)
  setTimeout(() => {
    document.querySelectorAll('.stat-num').forEach(countUp);
  }, 800);

  // Bento count-up on scroll
  gsap.utils.toArray('.count-up').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => countUp(el),
    });
  });

  // Section headers fade
  gsap.utils.toArray('.section-header').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 24,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      }
    });
  });
}

/* ══════════════════════════════════════════
   PLATFORM TABS
══════════════════════════════════════════ */
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    tabContents.forEach(c => {
      c.classList.remove('active');
      c.hidden = true;
    });

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(`tab-${target}`);
    if (panel) {
      panel.classList.add('active');
      panel.hidden = false;
    }
  });
});

/* ══════════════════════════════════════════
   FORM SUBMIT (UX only — no backend)
══════════════════════════════════════════ */
const ctaForm = document.getElementById('ctaForm');
if (ctaForm) {
  ctaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = ctaForm.querySelector('[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Gönderildi! 24 saat içinde dönüş yapılacak.`;
    btn.disabled = true;
    btn.style.opacity = '0.8';
    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
      btn.style.opacity = '';
      ctaForm.reset();
    }, 5000);
  });
}

/* ══════════════════════════════════════════
   MOBILE NAV BURGER (basic toggle)
══════════════════════════════════════════ */
const burger = document.getElementById('navBurger');
const navLinks = document.querySelector('.nav-links');
if (burger && navLinks) {
  burger.addEventListener('click', () => {
    const open = navLinks.style.display === 'flex';
    navLinks.style.display = open ? '' : 'flex';
    navLinks.style.flexDirection = 'column';
    navLinks.style.position = 'absolute';
    navLinks.style.top = '70px';
    navLinks.style.left = '0';
    navLinks.style.right = '0';
    navLinks.style.background = 'var(--bg)';
    navLinks.style.padding = 'var(--space-6)';
    navLinks.style.borderBottom = '1px solid var(--border)';
  });
}

// Re-init Lucide icons after dynamic content
if (typeof lucide !== 'undefined') lucide.createIcons();
