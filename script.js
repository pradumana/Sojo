// ===== CONFIG =====
const API = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

// ===== SESSION =====
let SESSION_ID = sessionStorage.getItem('sj_session');
if (!SESSION_ID) {
  SESSION_ID = 'sess_' + Math.random().toString(36).slice(2) + Date.now();
  sessionStorage.setItem('sj_session', SESSION_ID);
}

// ===== TRACKING =====
function track(event_type, label = '', page_section = '') {
  fetch(`${API}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: SESSION_ID, event_type, label, page_section })
  }).catch(() => {});
}

window.addEventListener('load', () => {
  fetch(`${API}/pageview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: SESSION_ID, referrer: document.referrer })
  }).catch(() => {});
});

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const spans = hamburger.querySelectorAll('span');
    const isOpen = navLinks.classList.contains('open');
    spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
    spans[1].style.opacity   = isOpen ? '0' : '1';
    spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(s => {
        s.style.transform = ''; s.style.opacity = '1';
      });
    });
  });
}

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = this.querySelector('.submit-btn');
    const name     = document.getElementById('name').value.trim();
    const email    = document.getElementById('email').value.trim();
    const interest = document.getElementById('interest').value;
    const message  = document.getElementById('message').value.trim();

    btn.textContent = 'Sending...';
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
      document.getElementById('formSuccess').classList.add('show');
      this.reset();
      setTimeout(() => document.getElementById('formSuccess').classList.remove('show'), 5000);
    }

    btn.textContent = 'Send Message →';
    btn.disabled = false;
  });
}
