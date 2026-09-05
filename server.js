require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const requireAdmin = require("./middleware/adminAuth");
const User = require("./models/Users");

const packageRoutes = require("./routes/packageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const callbackRoutes = require("./routes/callbackRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentAdminRoutes = require("./routes/paymentAdminRoutes");
const usersRoutes = require("./routes/usersRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const connectedRoutes = require("./routes/connectedRoutes");
const mikrotikRoutes = require("./routes/mikrotikRoutes");
const mikrotikSyncRoutes = require("./routes/mikrotikSyncRoutes");
const mikrotikCloudRoutes = require("./routes/mikrotikCloudRoutes");

const {
    getActiveHotspotUsers,
    disconnectUserByPhone,
    routerOsTimeToSeconds
} = require("./services/mikrotikService");

const app = express();

// ======================================
// BASIC CONFIGURATION
// ======================================
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================
// REQUEST LOGGER
// ======================================
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

// ======================================
// SESSION
// ======================================
app.use(
    session({
        secret: process.env.SESSION_SECRET || "witime-local-secret",
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

// ======================================
// MONGODB
// ======================================
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((error) => {
        console.error("❌ MongoDB connection error:");
        console.error(error);
    });

// ======================================
// ROUTES
// ======================================
app.use("/api/admin", adminRoutes);
app.use("/api/packages", packageRoutes);
app.use("/", paymentRoutes);
app.use("/", verifyRoutes);
app.use("/", callbackRoutes);

app.use("/api/dashboard", requireAdmin, dashboardRoutes);
app.use("/api/payments", requireAdmin, paymentAdminRoutes);
app.use("/api/users", requireAdmin, usersRoutes);
app.use("/api/reports", requireAdmin, reportsRoutes);

app.use("/api/connected", connectedRoutes);
app.use("/api/admin/mikrotik", mikrotikRoutes);
app.use("/api/mikrotik", mikrotikSyncRoutes);
app.use("/api/mikrotik/cloud", mikrotikCloudRoutes);

// ======================================
// ADMIN PAGE PROTECTION & ROUTING
// ======================================
function requireAdminPage(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    }
    return res.redirect("/admin/login.html");
}

app.get("/admin/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin", "login.html"));
});

const adminPages = [
    "dashboard.html",
    "packages.html",
    "users.html",
    "user-details.html",
    "payments.html",
    "reports.html",
    "settings.html"
];

adminPages.forEach((page) => {
    app.get(`/admin/${page}`, requireAdminPage, (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin", page));
    });
});

// ======================================
// STATIC FILES & ROOT ROUTE (FIXED)
// ======================================
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    const indexPath = path.join(__dirname, "public", "index.html");

    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(200).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>WiTime Hotspot</title>
                <style>
                    body { font-family: sans-serif; text-align: center; padding: 40px; background: #f4f6f9; }
                    .card { background: white; padding: 30px; border-radius: 8px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; border: none; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>WiTime Hotspot Portal</h2>
                    <p>Welcome to WiTime Services.</p>
                    <button class="btn" onclick="autoLogin()">Connect Free Wi-Fi</button>
                </div>
                <script>
                    function autoLogin() {
                        const params = new URLSearchParams(window.location.search);
                        const linkLogin = params.get('link-login-only') || 'http://192.168.88.1/login';
                        
                        const form = document.createElement('form');
                        form.method = 'POST';
                        form.action = linkLogin;

                        const user = document.createElement('input');
                        user.type = 'hidden'; user.name = 'username'; user.value = 'witime';
                        form.appendChild(user);

                        const pass = document.createElement('input');
                        pass.type = 'hidden'; pass.name = 'password'; pass.value = '';
                        form.appendChild(pass);

                        document.body.appendChild(form);
                        form.submit();
                    }
                </script>
            </body>
            </html>
        `);
    }
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "online",
        service: "WiTime",
        time: new Date().toISOString()
    });
});

// ======================================
// MIKROTIK JOB QUEUE ENDPOINT (POLLING)
// ======================================
app.get('/api/router/jobs', async (req, res) => {
    const token = req.headers['x-router-token'];
    const expectedToken = process.env.ROUTER_SECRET_TOKEN || "witime123@pinchez123";

    res.setHeader('Content-Type', 'text/plain');

    if (!token || token !== expectedToken) {
        console.warn(`[WiTime Router] Unauthorized polling attempt with token: ${token}`);
        return res.status(403).send('Unauthorized');
    }

    try {
        if (!global.pendingJobs) {
            global.pendingJobs = [];
        }

        if (global.pendingJobs.length > 0) {
            const commands = global.pendingJobs.join('\n');
            console.log(`[WiTime Router] Sending ${global.pendingJobs.length} command(s) to MikroTik.`);
            global.pendingJobs = []; 
            return res.status(200).send(commands);
        }

        return res.status(200).send('');

    } catch (error) {
        console.error('[WiTime Router] Error serving router jobs:', error);
        return res.status(500).send('');
    }
});

// ======================================
// MIKROTIK → WITIME ACTIVE USER SYNC
// ======================================
setInterval(async () => {
    if (mongoose.connection.readyState !== 1) {
        return;
    }

    try {
        const result = await getActiveHotspotUsers({
            host: process.env.MIKROTIK_HOST,
            username: process.env.MIKROTIK_USERNAME,
            password: process.env.MIKROTIK_PASSWORD,
            port: Number(process.env.MIKROTIK_PORT || 8728)
        });

        if (!result.success) {
            console.error("❌ MikroTik sync failed:", result.message);
            return;
        }

        const activeUsers = result.users || [];
        const bulkOps = activeUsers.map((activeUser) => {
            const phone = String(activeUser.user || "").trim();
            if (!phone) return null;

            const remainingSeconds = routerOsTimeToSeconds(activeUser.sessionTimeLeft);

            return {
                updateOne: {
                    filter: { phone },
                    update: {
                        $set: {
                            status: "Online",
                            ipAddress: activeUser.address || "",
                            macAddress: activeUser.macAddress || "",
                            mikrotikSessionId: activeUser.id || "",
                            mikrotikTimeLeft: activeUser.sessionTimeLeft || "",
                            remainingSeconds: remainingSeconds,
                            remainingTime: activeUser.sessionTimeLeft || "0s",
                            lastSeen: new Date()
                        }
                    }
                }
            };
        }).filter(Boolean);

        if (bulkOps.length > 0) {
            await User.bulkWrite(bulkOps);
            console.log(`✅ Synced ${bulkOps.length} active MikroTik user(s)`);
        }
    } catch (error) {
        console.error("❌ MikroTik → WiTime sync error:", error);
    }
}, 30 * 1000);

// ======================================
// AUTOMATIC OFFLINE CLEANUP
// ======================================
let offlineCleanupRunning = false;

setInterval(async () => {
    if (offlineCleanupRunning || mongoose.connection.readyState !== 1) {
        return;
    }

    offlineCleanupRunning = true;

    try {
        const timeout = new Date(Date.now() - 90 * 1000);
        const result = await User.updateMany(
            {
                status: "Online",
                lastSeen: { $lt: timeout }
            },
            {
                $set: {
                    status: "Offline",
                    ipAddress: "",
                    macAddress: "",
                    mikrotikSessionId: ""
                }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`🔴 ${result.modifiedCount} user(s) automatically marked Offline`);
        }
    } catch (error) {
        console.error("❌ Offline cleanup error:", error);
    } finally {
        offlineCleanupRunning = false;
    }
}, 30 * 1000);

// ======================================
// AUTOMATIC PACKAGE EXPIRY
// ======================================
let expiryCheckRunning = false;

setInterval(async () => {
    if (expiryCheckRunning || mongoose.connection.readyState !== 1) {
        return;
    }

    expiryCheckRunning = true;

    try {
        const now = new Date();
        const expiredUsers = await User.find({
            expiryTime: { $lte: now },
            remainingTime: { $ne: "Expired" },
            status: { $in: ["Online", "Offline"] }
        });

        if (expiredUsers.length === 0) {
            return;
        }

        for (const user of expiredUsers) {
            try {
                if (process.env.MIKROTIK_HOST && process.env.MIKROTIK_USERNAME && process.env.MIKROTIK_PASSWORD) {
                    await disconnectUserByPhone({
                        host: process.env.MIKROTIK_HOST,
                        username: process.env.MIKROTIK_USERNAME,
                        password: process.env.MIKROTIK_PASSWORD,
                        port: Number(process.env.MIKROTIK_PORT || 8728),
                        phone: user.phone
                    });
                }
            } catch (mikrotikError) {
                console.error("❌ MikroTik expiry disconnect error:", mikrotikError);
            }

            user.status = "Offline";
            user.remainingTime = "Expired";
            user.ipAddress = "";
            user.macAddress = "";
            user.mikrotikSessionId = "";
            user.lastSeen = null;

            await user.save();
            console.log(`⏰ Expired user processed & disconnected: ${user.phone}`);
        }
    } catch (error) {
        console.error("❌ Package expiry checker error:", error);
    } finally {
        expiryCheckRunning = false;
    }
}, 30 * 1000);

// ======================================
// KEEP ALIVE
// ======================================
const PORT = process.env.PORT || 3000;
const SERVER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

setInterval(async () => {
    try {
        const response = await fetch(`${SERVER_URL}/api/health`);
        console.log(`🏓 Keep-alive ping: ${response.status}`);
    } catch (error) {
        console.log("⚠️ Keep-alive ping failed:", error.message);
    }
}, 10 * 60 * 1000);

// ======================================
// SERVER START
// ======================================
app.listen(PORT, () => {
    console.log(`🚀 WiTime running on port ${PORT}`);
});