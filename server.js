require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const requireAdmin = require("./middleware/adminAuth");
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

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

// ======================================
// SESSION
// ======================================

app.set("trust proxy", 1);

app.use(session({
    secret: process.env.SESSION_SECRET || "witime-local-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ======================================
// STATIC FILES + ADMIN PROTECTION
// ======================================

app.use((req, res, next) => {

    // Login page is PUBLIC
    if (req.path === "/admin/login.html") {
        return express.static("public", {
            index: false
        })(req, res, next);
    }

    // Other admin HTML pages require login
    if (
        req.path.startsWith("/admin/") &&
        req.path.endsWith(".html")
    ) {

        if (
            req.session &&
            req.session.admin &&
            req.session.admin.loggedIn === true
        ) {
            return express.static("public", {
                index: false
            })(req, res, next);
        }

        return res.redirect("/admin/login.html");
    }

    // Normal public files
    express.static("public", {
        index: false
    })(req, res, next);

});


app.use(session({
    secret: process.env.SESSION_SECRET || "witime-local-secret",
    resave: false,
    saveUninitialized: false
}));


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch(err => {
    console.error("MongoDB connection error:");
    console.error(err);
});

app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/public/index.html");
});


const PORT = process.env.PORT || 3000;

app.use("/api/packages", packageRoutes);
app.use("/", paymentRoutes);
app.use("/", verifyRoutes);
app.use(callbackRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", requireAdmin, paymentAdminRoutes);
app.use("/api/users", requireAdmin, usersRoutes);
app.use("/api/reports", requireAdmin, reportsRoutes);
app.use("/api/connected", connectedRoutes);

// ======================================
// ADMIN PAGE PROTECTION
// ======================================

function requireAdminPage(req, res, next) {

    if (
        req.session &&
        req.session.admin &&
        req.session.admin.loggedIn === true
    ) {
        return next();
    }

    return res.redirect("/admin/login.html");
}


// ======================================
// PROTECTED ADMIN HTML PAGES
// ======================================

app.get(
    "/admin/:page",
    requireAdminPage,
    (req, res, next) => {

        const allowedPages = [
            "dashboard.html",
            "users.html",
            "user-details.html",
            "payments.html",
            "reports.html",
            "packages.html",
            "settings.html"
        ];

        if (!allowedPages.includes(req.params.page)) {
            return next();
        }

        res.sendFile(
            __dirname + "/public/admin/" + req.params.page
        );
    }
);

// ======================================
// Health Check
// ======================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        status: "online",
        service: "WiTime",
        time: new Date().toISOString()
    });

});

app.listen(PORT, ()=>{
    console.log(`WiTime running on port ${PORT}`);
});

// ======================================
// WiTime Server Keep-Alive
// ======================================

const SERVER_URL =
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${PORT}`;

setInterval(async () => {

    try {

        const response = await fetch(
            `${SERVER_URL}/api/health`
        );

        console.log(
            `Keep-alive ping: ${response.status}`
        );

    } catch (error) {

        console.log(
            "⚠ Keep-alive ping failed:",
            error.message
        );

    }

}, 10 * 60 * 1000); // every 10 minutes