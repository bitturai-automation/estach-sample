import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const PAGES = ['home','about','services','website-product-development','brand-identity','case-studies','blog','careers','contact','products','privacy','terms'];

/* ---------- smooth scroll ---------- */
const lenis = new Lenis({ lerp: reduce ? 1 : 0.1 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ---------- hero particle ring ---------- */
const ACC = getComputedStyle(document.documentElement).getPropertyValue('--accrgb').trim() || '44,186,161';
const c = $('#c'), x = c.getContext('2d'), P = [];
let W, H, mx = 0, my = 0, t0 = 0;
const dpr = Math.min(devicePixelRatio || 1, 1.5);
const rs = () => { W = c.width = c.clientWidth * dpr; H = c.height = c.clientHeight * dpr; };
for (let i = 0; i < 260; i++) P.push({ a: Math.random() * 6.283, r: 0.28 + Math.random() * 0.16, z: Math.random(), s: 1 + Math.random() * 3.5, o: Math.random() * 6 });
addEventListener('resize', rs);
addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
/* pre-rendered glow sprites: one drawImage per particle instead of a new gradient every frame */
const sprite = (a) => { const k = document.createElement('canvas'); k.width = k.height = 64; const g = k.getContext('2d'), r = g.createRadialGradient(24, 24, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,.98)'); r.addColorStop(0.6, `rgba(${ACC},${a})`); r.addColorStop(1, 'rgba(0,0,0,.05)'); g.fillStyle = r; g.beginPath(); g.arc(32, 32, 32, 0, 6.283); g.fill(); return k; };
const SPR = [sprite(0.5), sprite(0.9)];
let heroOn = true;
new IntersectionObserver((es) => { heroOn = es[0].isIntersecting; }).observe(c);
gsap.ticker.add((time) => {
  if (!W || !heroOn || document.hidden) return;
  const t = time * 0.4;
  x.clearRect(0, 0, W, H);
  const cx = W / 2 + mx * 60 * dpr, cy = H / 2 + my * 60 * dpr, m = Math.min(W, H);
  for (const p of P) {
    const wob = 1 + 0.18 * Math.sin(p.a * 3 + t * 3 + p.o) + 0.1 * Math.sin(p.a * 5 - t * 2);
    const ang = p.a + t * 0.5, rr = p.r * wob * m;
    const px = cx + Math.cos(ang) * rr * (1 + p.z * 0.15), py = cy + Math.sin(ang) * rr * 0.9 + Math.sin(t + p.o) * 8 * dpr;
    const sz = p.s * dpr * (1 + p.z) * 2;
    x.drawImage(SPR[p.z > 0.8 ? 1 : 0], px - sz / 2, py - sz / 2, sz, sz);
  }
});

/* ---------- scroll show / close (both directions) ---------- */
let triggers = [];
function initPage(pg) {
  triggers.forEach((t) => t && t.kill(true)); triggers = [];
  gsap.set('.vtr, .vc, .vp i, .hero', { clearProps: 'all' });
  gsap.set('#c', { clearProps: '--py' });
  /* ORDER MATTERS: pinned sections must be created first, top-to-bottom,
     so every trigger created after them measures the extra pin spacing. */
  const vt = $('#h-videos', pg);
  if (vt && !reduce) {
    const tr = $('.vtr', vt), bar = $('.vp i', vt), dist = () => tr.scrollWidth - innerWidth;
    const tw = gsap.fromTo(tr, { x: 0 }, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: vt, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 2, onUpdate: (s) => gsap.set(bar, { scaleX: s.progress }) } });
    triggers.push(tw.scrollTrigger);
    $$('.vc', vt).forEach((k, idx, all) => {
      const last = idx === all.length - 1;
      const a = gsap.fromTo(k, { scale: 0.82, opacity: 0.3 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: k, containerAnimation: tw, start: last ? 'left 98%' : 'left 92%', end: last ? 'left 84%' : 'left 55%', scrub: true } });
      const b = last ? null : gsap.fromTo(k, { scale: 1, opacity: 1 }, { scale: 0.9, opacity: 0.4, ease: 'none', immediateRender: false, scrollTrigger: { trigger: k, containerAnimation: tw, start: 'right 40%', end: 'right 8%', scrub: true } });
      triggers.push(a.scrollTrigger, b && b.scrollTrigger);
    });
  }
  initServices(pg);
  $$('.rv', pg).forEach((el) => {
    const tw = gsap.fromTo(el, { y: 70, opacity: 0, scale: 0.97 }, {
      y: 0, opacity: 1, scale: 1, duration: reduce ? 0 : 0.9, ease: 'power3.out', paused: true,
      onStart: () => (el.style.transition = 'none'),
      onReverseStart: () => (el.style.transition = 'none'),
      onComplete: () => { el.style.transition = ''; gsap.set(el, { clearProps: 'transform' }); },
      onReverseComplete: () => (el.style.transition = ''),
    });
    let first = true;
    triggers.push(ScrollTrigger.create({
      trigger: el, start: 'top 90%', end: 'bottom 10%',
      onEnter: () => tw.play(), onLeave: () => tw.reverse(),
      onEnterBack: () => tw.play(), onLeaveBack: () => tw.reverse(),
      /* after any re-measure (resize / fonts / pins) re-sync so nothing stays stuck invisible */
      onRefresh: (self) => { if (first) { first = false; return; } tw.progress(self.isActive ? 1 : 0); },
    }));
  });
  $$('[data-n]', pg).forEach((el) => {
    const n = +el.dataset.n, s = el.dataset.s || '', o = { v: 0 };
    triggers.push(ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => gsap.to(o, { v: n, duration: 1.6, ease: 'power2.out', onUpdate: () => (el.textContent = (n % 1 ? o.v.toFixed(1) : Math.round(o.v)) + s) }),
    }));
  });
  $$('.pr', pg).forEach((pr) => {
    const tl = $('.tl', pr), st = $$('.ts', tl), bl = $$('.sb', pr);
    const l = gsap.fromTo(tl, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: tl, start: 'top 60%', end: 'bottom 60%', scrub: true } });
    triggers.push(l.scrollTrigger);
    st.forEach((s, i) => triggers.push(ScrollTrigger.create({ trigger: s, start: 'top 65%', end: 'bottom 35%', onToggle: (v) => { if (v.isActive) { st.forEach((x, j) => x.classList.toggle('on', j === i)); bl.forEach((b, j) => b.classList.toggle('on', j <= i)); } } })));
  });
  $$('[data-grow]', pg).forEach((g) => { const a = gsap.fromTo($$('rect', g), { scaleY: 0 }, { scaleY: 1, duration: 1.1, stagger: 0.06, ease: 'power3.out', transformOrigin: '50% 100%', scrollTrigger: { trigger: g, start: 'top 92%', toggleActions: 'play reverse play reverse' } }); triggers.push(a.scrollTrigger); });
  $$('.ln', pg).forEach((p) => { const a = gsap.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: p, start: 'top 92%', toggleActions: 'play reverse play reverse' } }); triggers.push(a.scrollTrigger); });
  if (pg.id === 'p-home' && !reduce) {
    const f = gsap.fromTo('.hero', { opacity: 1 }, { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 15%', scrub: true } });
    const q = gsap.fromTo('#c', { '--py': '0px' }, { '--py': '200px', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    triggers.push(f.scrollTrigger, q.scrollTrigger);
    gsap.fromTo('.hero .w i', { yPercent: 115 }, { yPercent: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out' });
    gsap.from('.hero > span, .hero p, .hero .cta, .hero .stats', { y: 30, opacity: 0, duration: 1, stagger: 0.12, delay: 0.3, ease: 'power3.out' });
  }
}

/* ---------- services: scroll-pinned, one by one (falls back to hover/auto-cycle) ---------- */
function initServices(pg) {
  const st = $('.sx-stage', pg); if (!st) return;
  const rows = $$('.sx', st), vps = $$('.sx-vp', st), bar = $('.sx-prog i', st), cnt = $('.sx-count b', st), sec = st.closest('section'), n = rows.length;
  let cur = -1, timer = 0, hov = false, vis = false;
  bar.style.width = ''; bar.style.transform = ''; bar.classList.remove('run');
  const pinned = !reduce && matchMedia('(min-width:901px)').matches && innerHeight >= 520;
  st.classList.toggle('pin', pinned);
  const set = (i) => {
    if (i === cur) return; cur = i;
    rows.forEach((r, j) => { r.classList.toggle('on', j === i); r.classList.toggle('seen', j <= i); });
    vps.forEach((v, j) => v.classList.toggle('on', j === i));
    if (cnt) cnt.textContent = String(i + 1).padStart(2, '0');
  };
  if (pinned) {
    bar.style.width = '100%'; bar.style.transform = 'scaleX(0)'; bar.style.transformOrigin = 'left';
    set(0);
    triggers.push(ScrollTrigger.create({
      trigger: sec, start: 'top top', end: () => '+=' + Math.round(innerHeight * 0.38 * n), pin: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
      onUpdate: (s) => { set(Math.min(n - 1, Math.floor(s.progress * n))); bar.style.transform = 'scaleX(' + s.progress + ')'; },
    }));
    return;
  }
  const auto = () => !reduce && !hov && vis && matchMedia('(min-width:901px)').matches;
  const restart = () => {
    clearTimeout(timer); bar.classList.remove('run'); void bar.offsetWidth;
    if (!auto()) return;
    bar.classList.add('run'); timer = setTimeout(() => { set((cur + 1) % n); restart(); }, 5500);
  };
  set(0);
  rows.forEach((r, i) => { r.addEventListener('pointerenter', () => { hov = true; set(i); restart(); }); r.addEventListener('focus', () => set(i)); });
  st.addEventListener('pointerleave', () => { hov = false; restart(); });
  new IntersectionObserver((es) => { vis = es[0].isIntersecting; restart(); }, { threshold: 0.3 }).observe(st);
}

/* ---------- router with curtain transition ---------- */
const curtain = $('#curtain');
gsap.set(curtain, { y: 0, yPercent: 100 });
function show(h) {
  $$('.page').forEach((p) => p.classList.remove('on'));
  const pg = $('#p-' + h); pg.classList.add('on');
  lenis.scrollTo(0, { immediate: true });
  rs(); initPage(pg); ScrollTrigger.sort(); ScrollTrigger.refresh();
}
function route(first) {
  const h = location.hash.slice(1) || 'home';
  if (!PAGES.includes(h)) {
    if (!$('.page.on')) show('home');
    const el = document.getElementById(h);
    if (el) lenis.scrollTo(el, { offset: -20 });
    return;
  }
  if (first || reduce) return show(h);
  gsap.timeline()
    .set(curtain, { yPercent: 100 })
    .to(curtain, { yPercent: 0, duration: 0.5, ease: 'expo.inOut' })
    .call(() => show(h))
    .to(curtain, { yPercent: -100, duration: 0.6, ease: 'expo.inOut' });
}
addEventListener('hashchange', () => { document.body.classList.remove('menu'); route(); });
addEventListener('load', () => ScrollTrigger.refresh());
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
const pinMode = () => matchMedia('(min-width:901px)').matches && innerHeight >= 520;
let lastMode = pinMode();
addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(() => { const m = pinMode(); if (m !== lastMode) { lastMode = m; const pg = $('.page.on'); if (pg) { initPage(pg); ScrollTrigger.sort(); ScrollTrigger.refresh(); } } }, 250); });
route(true);

/* ---------- scroll progress + marquee skew ---------- */
const pb = $('#pb');
const skews = $$('.mq').map((m) => gsap.quickTo(m, 'skewY', { duration: 0.4 }));
let rst;
lenis.on('scroll', ({ scroll, limit, velocity }) => {
  pb.style.width = (limit > 0 ? (scroll / limit) * 100 : 0) + '%';
  if (reduce) return;
  skews.forEach((s) => s(gsap.utils.clamp(-4, 4, velocity * 0.3)));
  clearTimeout(rst); rst = setTimeout(() => skews.forEach((s) => s(0)), 120);
});

/* ---------- cursor, magnetic buttons, card tilt ---------- */
const cu = $('#cur');
if (matchMedia('(hover:hover)').matches && !reduce) {
  gsap.set(cu, { x: -100, y: -100, xPercent: -50, yPercent: -50, opacity: 0 });
  const cx = gsap.quickTo(cu, 'x', { duration: 0.25, ease: 'power3' }), cy = gsap.quickTo(cu, 'y', { duration: 0.25, ease: 'power3' });
  addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); });
  document.addEventListener('pointerover', (e) => gsap.to(cu, { scale: e.target.closest && e.target.closest('a,.card,.cx,.tq,button') ? 4 : 1, opacity: e.target.closest && e.target.closest('a,.card,.cx,.tq,button') ? 0.55 : 1, duration: 0.3 }));
  $$('.btn').forEach((b) => {
    const bx = gsap.quickTo(b, 'x', { duration: 0.4, ease: 'power3' }), by = gsap.quickTo(b, 'y', { duration: 0.4, ease: 'power3' });
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); bx((e.clientX - r.left - r.width / 2) * 0.25); by((e.clientY - r.top - r.height / 2) * 0.4); });
    b.addEventListener('pointerleave', () => { bx(0); by(0); });
  });
  $$('.card').forEach((k) => {
    k.addEventListener('pointermove', (e) => { const r = k.getBoundingClientRect(); k.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg'); k.style.setProperty('--rx', -((e.clientY - r.top) / r.height - 0.5) * 10 + 'deg'); });
    k.addEventListener('pointerleave', () => { k.style.setProperty('--rx', '0deg'); k.style.setProperty('--ry', '0deg'); });
  });
} else cu.style.display = 'none';

/* ---------- contact form -> WhatsApp ---------- */
$('#cf').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target.elements, sv = $$('input[name=s]:checked', e.target).map((i) => i.value);
  const msg = `Hi Estach, I am ${f.n.value} (${f.p.value}).` + (sv.length ? ` I'm interested in: ${sv.join(', ')}.` : '') + (f.m.value ? ` ${f.m.value}` : '');
  window.open('https://wa.me/919150660660?text=' + encodeURIComponent(msg), '_blank');
});

/* ---------- mobile menu ---------- */
const bg = $('.burger');
if (bg) {
  bg.addEventListener('click', () => { const o = document.body.classList.toggle('menu'); bg.setAttribute('aria-expanded', o); });
  $$('.links a').forEach((a) => a.addEventListener('click', () => { document.body.classList.remove('menu'); bg.setAttribute('aria-expanded', false); }));
}

$$('[data-top]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); lenis.scrollTo(0); }));

/* ---------- videos: play only when visible ---------- */
const vio = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: 0.3 });
$$('.vc video').forEach((v) => vio.observe(v));
