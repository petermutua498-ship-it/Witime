require("dotenv").config();
const express = require("express");
const db = require("./db");
const IntaSend = require("intasend-node");
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY,
  process.env.INTASEND_SECRET_KEY,
  false // false = LIVE, true = SANDBOX
);

// PRICING
const PACKAGES = {
  1: { price: 10, hours: 1 },
  2: { price: 25, hours: 2 },
  3: { price: 45, hours: 3 },
  5: { price: 60, hours: 5 },
  12:{ price: 100, hours: 12 }
};

// LIMIT USERS TO 6
function activeUsers() {
  return db.prepare("SELECT COUNT(*) as total FROM sessions WHERE status='active").get().total;
}

// BUY WIFI
app.get('/index', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

app.post("/pay", async (req, res) => {
  const { phone, hours } = req.body;

  if (!PACKAGES[hours]) {
    return res.status(400).json({ error: "Invalid package" });
  }

  if (activeUsers() >= 6) {
    return res.status(403).json({ error: "All slots full" });
  }

  const amount = PACKAGES[hours].price;

  try {
    const collection = intasend.collection();
    const response = await collection.mpesaStkPush({
      phone_number: phone,
      amount,
      narrative: "WiFi Access"
    });

    db.prepare(`
      INSERT INTO payments (phone, amount, duration, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(phone, amount, hours, "PENDING", Date.now());

    res.json({ success: true, message: "STK sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PAYMENT CALLBACK (IntaSend)
app.post("/callback", (req, res) => {
  const { phone_number, state } = req.body;

  if (state !== "COMPLETE") return res.sendStatus(200);

  const payment = db.prepare(`
    SELECT * FROM payments
    WHERE phone=? AND status='PENDING'
    ORDER BY id DESC LIMIT 1
  `).get(phone_number);

  if (!payment) return res.sendStatus(200);

  const start = Date.now();
  const end = start + payment.duration * 60 * 60 * 1000;

  db.prepare(`
    INSERT INTO sessions (phone, start_time, end_time, active)
    VALUES (?, ?, ?, 1)
  `).run(phone_number, start, end);

  db.prepare(`
    UPDATE payments SET status='PAID' WHERE id=?
  `).run(payment.id);

  res.sendStatus(200);
});

// HEARTBEAT (AUTO DISCONNECT)
setInterval(() => {
  const now = Date.now();
  db.prepare(`
    UPDATE sessions SET status='expired' WHERE end_time < ? AND status='active'
  `).run(now);
}, 10000);

// ADMIN VIEW (READ ONLY)
app.get("/admin", (req, res) => {
  res.sendFile(__dirname + '/public/admin.html')
  const users = db.prepare(`
    SELECT phone, end_time FROM sessions WHERE status='active'
  `).all();
  res.json(users);
});

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("WiFi system running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log("Server running on port" + PORT)
);
