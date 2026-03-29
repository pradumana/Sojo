const { v4: uuidv4 } = require('uuid');
const { query } = require('./_db');

const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL || 'socialsambhawana@gmail.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

async function sendEmail(application) {
  if (!RESEND_API_KEY) return; // skip if not configured
  const { position, name, email, phone, linkedin, experience, motivation } = application;
  const html = `
    <h2>New Application: ${position}</h2>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Name</td><td style="padding:8px">${name}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Phone</td><td style="padding:8px">${phone || '—'}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">LinkedIn</td><td style="padding:8px">${linkedin ? `<a href="${linkedin}">${linkedin}</a>` : '—'}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Experience</td><td style="padding:8px">${experience}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Why SOJO?</td><td style="padding:8px">${motivation}</td></tr>
    </table>
  `;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'SOJO Applications <onboarding@resend.dev>',
      to: [FOUNDER_EMAIL],
      subject: `New Application: ${position} — ${name}`,
      html
    })
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { position, name, email, phone, linkedin, experience, motivation } = req.body || {};
  if (!position || !name || !email || !experience || !motivation)
    return res.status(400).json({ error: 'Missing required fields' });

  try {
    await query(
      `INSERT INTO applications (id,position,name,email,phone,linkedin,experience,motivation,ip) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [uuidv4(), position, name, email, phone || '', linkedin || '', experience, motivation, req.headers['x-forwarded-for'] || '']
    );
    await sendEmail({ position, name, email, phone, linkedin, experience, motivation });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
