import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Witime server is running');
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

app.use(express.json());
app.use(express.static('public'));

// 1️⃣ User pay / submit
app.post('/pay', async(req, res) => {
  try { 
    const {phone, minutes } = req.body;
    if  (!phone, minutes) {
      return res.status(400).json({ error: "Missing data"});
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + minutes * 60 * 1000;
    
    await db.run(
    `INSERT INTO users (phone, code, minutes, expires_at, status) VALUES (?, ?, ?, ?, ?)`,
    [phone, code, minutes, expiresAt, "active"]
    );
    
    console.log("user created", phone, code);
    
    res.json({ success: true, code});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error"});
  }
});

app.post("/connect", async (req, res) => {
  const { code } = req.body;

  const user = await db.get (
  `SELECT * FROM users WHERE code=? AND status='active'`,
  [code]
  );

  if (!user) {
    return res.status(401).json({ error: "Session expired"});
  }

  res.json({
    success: true,
    minutesLeft: Math.cell((user.expires_at - Date.now()) / 60000)
  });
});

app.get("/admin/sessions", async (req, res) => {
  const users = await db.all(
    `SELECT * FROM users ORDER BY id DESC`
  );
  res.json(users);
});
