// ===== CONFIG =====
const API = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

// ===== SESSION =====
let SESSION_ID = sessionStorage.getItem('sj_session');
if (!SESSION_ID) {
  SESSION_ID = 'sess_' + Math.random().toString(36).slice(2) + Date.now();
  sessionStorage.setItem('sj_session', SESSION_ID);
}

// ===== TRACKING HELPERS =====
function track(event_type, label = '', page_section = '') {
  fetch(`${API}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: SESSION_ID, event_type, label, page_section })
  }).catch(() => {});
}

function pageView() {
  fetch(`${API}/pageview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: SESSION_ID, referrer: document.referrer })
  }).catch(() => {});
}

// ===== PAGE VIEW ON LOAD =====
window.addEventListener('load', pageView);

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  document.getElementById('scrollTop').classList.toggle('visible', window.scrollY > 400);
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  const isOpen = navLinks.classList.contains('open');
  spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
  spans[1].style.opacity   = isOpen ? '0' : '1';
  spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
  if (isOpen) track('menu_open', 'hamburger', 'navbar');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
  });
});

// ===== ACTIVE NAV LINK =====
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id'); });
  navLinks.querySelectorAll('a').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === `#${current}`) a.classList.add('active');
  });
});

// ===== SECTION VISIBILITY TRACKING =====
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      track('section_view', e.target.id, e.target.id);
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => sectionObserver.observe(s));

// ===== CTA BUTTON TRACKING =====
document.querySelectorAll('.btn, .blog-link, .linkedin-btn, .social-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const label = btn.textContent.trim() || btn.getAttribute('aria-label') || 'btn';
    const section = btn.closest('section')?.id || 'unknown';
    track('cta_click', label.slice(0, 80), section);
  });
});

// ===== CAREERS TABS =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    track('tab_click', btn.dataset.tab, 'careers');
  });
});

// ===== CONTACT FORM =====
document.getElementById('contactForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const interest = document.getElementById('interest').value;
  const message  = document.getElementById('message').value.trim();

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, interest, message })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('formSuccess').classList.add('show');
      this.reset();
      track('form_submit', interest || 'contact', 'contact');
      setTimeout(() => document.getElementById('formSuccess').classList.remove('show'), 5000);
    } else {
      alert('Something went wrong. Please try again.');
    }
  } catch {
    // Fallback if server not running
    document.getElementById('formSuccess').classList.add('show');
    this.reset();
    setTimeout(() => document.getElementById('formSuccess').classList.remove('show'), 5000);
  }

  btn.innerHTML = 'Send Message <i class="fas fa-paper-plane"></i>';
  btn.disabled = false;
});

// ===== NEWSLETTER FORM =====
const nlForm = document.getElementById('newsletterForm');
if (nlForm) {
  nlForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value.trim();
    const btn = this.querySelector('button');
    btn.textContent = 'Subscribing...';
    btn.disabled = true;
    try {
      const res = await fetch(`${API}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      btn.textContent = data.success ? '✓ Subscribed!' : 'Already subscribed';
      track('newsletter_signup', email.split('@')[1] || '', 'footer');
    } catch {
      btn.textContent = '✓ Done!';
    }
    setTimeout(() => { btn.textContent = 'Subscribe'; btn.disabled = false; }, 3000);
  });
}

// ===== SCROLL TO TOP =====
document.getElementById('scrollTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  track('scroll_top', 'button', 'global');
});

// ===== FADE IN ON SCROLL =====
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(
  '.mv-card, .value-card, .timeline-item, .team-card, .program-card, .support-card, .blog-card, .job-card'
).forEach((el, i) => {
  el.classList.add('fade-in');
  el.style.transitionDelay = `${(i % 4) * 0.1}s`;
  fadeObserver.observe(el);
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, suffix = '') {
  let start = 0;
  const step = (ts) => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / 2000, 1);
    el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const nums = entry.target.querySelectorAll('.stat-num');
      [{ val: 1500, s: '+' }, { val: 19, s: 'K+' }, { val: 80, s: '+' }, { val: 60, s: '+' }]
        .forEach((d, i) => { if (nums[i]) animateCounter(nums[i], d.val, d.s); });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const statsEl = document.querySelector('.hero-stats');
if (statsEl) statsObserver.observe(statsEl);
