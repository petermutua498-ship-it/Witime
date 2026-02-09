const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const MAX_ACTIVE_USERS = 6;

const IntaSend = require('intasend-node');

const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY,
  process.env.INTASEND_SECRET_KEY,
  process.env.INTASEND_SANDBOX === 'true'
);

// Utility functions
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// SMS placeholder
function sendSMS(phone, message) {
  console.log(`SMS to ${phone}: ${message}`)
}

// ================= PAY ROUTE =================
app.post('/pay', async (req, res) => {
  const { phone, minutes } = req.body;
});

  // Check active users limit
  const row = db
  .prepare(
    "SELECT COUNT(*) AS total FROM sessions WHERE status='ACTIVE'")
    .get();

  const activeusers = row.total;

// ================= INTASEND CALLBACK =================
app.post('/intasend-callback', (req, res) => {
  const { phone, amount } = req.body; // from IntaSend callback

  db.get(`SELECT COUNT(*) AS total FROM sessions WHERE status='ACTIVE'`, [], (err, row) => {
    const activeUsers = row?.total || 0;
    
    if (activeUsers < MAX_ACTIVE_USERS) {
      processPayment(phone, amount);
    } else {
      const now = Date.now();
      db.run(`INSERT INTO pending_payments (phone, amount, requested_at) VALUES (?, ?, ?)`, [phone, amount, now]);
    }
  });

  res.sendStatus(200);
});

// ================= VERIFY CODE =================
app.post('/verify-code', (req, res) => {
  const { code } = req.body;

  const session = db
  .prepare(
    "SELECT * FROM sessions WHERE code=? AND status='ACTIVE'")
  .get(code);

  if (!session) {
    return res.json({ error: 'Invalid or expected code' });
  }
});


// ================= HEARTBEAT =================
app.post('/heartbeat', (req, res) => {
  const { code } = req.body;
  const ip = req.ip;
  const ua = req.headers['user-agent'];
  const now = Date.now();

  db.get(`SELECT * FROM sessions WHERE code=?`, [code], (err, s) => {
    if (!s || s.status !== 'ACTIVE' || now > s.end_time || s.ip !== ip || s.user_agent !== ua) {
      if (s) db.run(`UPDATE sessions SET status='EXPIRED' WHERE id=?`, [s.id]);
      return res.json({ action: 'disconnect' });
    }

    res.json({ action: 'ok', time_left: s.end_time - now });
  });
});

// ================= ADMIN VIEW =================
app.get('/admin/sessions', (req, res) => {
  db.all(`SELECT * FROM sessions ORDER BY id DESC`, (err, rows) => res.json(rows));
});

// ================= AUTO EXPIRE =================
setInterval(() => {
  db.run(`UPDATE sessions SET status='EXPIRED' WHERE end_time < ? AND status='ACTIVE'`, [Date.now()]);
}, 30000);

// ================= AUTO-PROCESS PENDING PAYMENTS =================
setInterval(() => {
  db.get(`SELECT COUNT(*) AS total FROM sessions WHERE status='ACTIVE'`, [], (err, row) => {
    const activeUsers = row?.total || 0;
    
    if (activeUsers < MAX_ACTIVE_USERS) {
      db.get(`SELECT * FROM pending_payments ORDER BY requested_at ASC LIMIT 1`, [], (err, payment) => {
        if (!payment) return;
        db.run(`DELETE FROM pending_payments WHERE id=?`, [payment.id]);
        processPayment(payment.phone, payment.amount);
      });
    }
  });
}, 5000);

// ================= PROCESS PAYMENT =================
function processPayment(phone, amount) {
  const packages = {10:60, 25:120, 45:180, 60:300, 100:720};
  const minutes = packages[amount];
  if (!minutes) return;

  const code = generateCode();
  const start = Date.now();
  const end = start + minutes * 60000;

  db.run(`INSERT INTO sessions (phone, code, minutes, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
    [phone, code, minutes, start, end],
    () => {
      console.log(`Payment processed for ${phone}, code: ${code}`);
      sendSMS(phone, `WiTime access code: ${code}. Valid for ${minutes} minutes.`);
    });
}

// ================= INTASEND INITIATION (placeholder) =================
function initiateIntaSendPayment(phone, amount) {
  // Here you insert IntaSend API call
  // Example: STK push or checkout
  return new Promise((resolve) => {
    console.log(`IntaSend payment initiated for ${phone}, amount ${amount}`);
    resolve('payment-ref-123'); // return payment reference
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log('WiTime running on port 3000');
});
