require("dotenv").config();

console.log("MikroTik config:", {
    host: process.env.MIKROTIK_HOST,
    username: process.env.MIKROTIK_USERNAME,
    passwordConfigured: !!process.env.MIKROTIK_PASSWORD,
    port: process.env.MIKROTIK_PORT
});

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");

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

const {
    getActiveHotspotUsers,
    disconnectUserByPhone
} = require("./services/mikrotikService");

const app = express();


// ======================================
// BASIC CONFIGURATION
// ======================================

app.set("trust proxy", 1);

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


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

        secret:
            process.env.SESSION_SECRET ||
            "witime-local-secret",

        resave: false,

        saveUninitialized: false,

        rolling: true,

        cookie: {

            httpOnly: true,

            secure:
                process.env.NODE_ENV === "production",

            sameSite: "lax",

            maxAge:
                24 * 60 * 60 * 1000

        }

    })
);


// ======================================
// MONGODB
// ======================================

mongoose
    .connect(process.env.MONGO_URI)

    .then(() => {

        console.log("✅ MongoDB Connected");

    })

    .catch((error) => {

        console.error(
            "❌ MongoDB connection error:"
        );

        console.error(error);

    });


// ======================================
// ADMIN API
// ======================================

app.use(
    "/api/admin",
    adminRoutes
);


// ======================================
// PUBLIC ROUTES
// ======================================

app.use(
    "/api/packages",
    packageRoutes
);

app.use(
    "/",
    paymentRoutes
);

app.use(
    "/",
    verifyRoutes
);


// ======================================
// M-PESA CALLBACK
// POST /callback
// ======================================

app.use(
    "/",
    callbackRoutes
);


// ======================================
// DASHBOARD
// ======================================

app.use(
    "/api/dashboard",
    requireAdmin,
    dashboardRoutes
);


// ======================================
// ADMIN APIs
// ======================================

app.use(
    "/api/payments",
    requireAdmin,
    paymentAdminRoutes
);

app.use(
    "/api/users",
    requireAdmin,
    usersRoutes
);

app.use(
    "/api/reports",
    requireAdmin,
    reportsRoutes
);


// ======================================
// CONNECTED USERS
// ======================================

app.use(
    "/api/connected",
    connectedRoutes
);


// ======================================
// MIKROTIK ADMIN API
// ======================================

app.use(
    "/api/admin/mikrotik",
    mikrotikRoutes
);


// ======================================
// MIKROTIK SYNC API
// ======================================

app.use(
    "/api/mikrotik",
    mikrotikSyncRoutes
);


// ======================================
// ADMIN PAGE PROTECTION
// ======================================

function requireAdminPage(req, res, next) {

    if (
        req.session &&
        req.session.admin
    ) {

        console.log(
            "✅ Admin page authorized:",
            req.session.admin.username
        );

        return next();

    }

    console.log(
        "❌ Admin page unauthorized:",
        req.path
    );

    return res.redirect(
        "/admin/login.html"
    );

}


// ======================================
// ADMIN LOGIN PAGE
// ======================================

app.get(
    "/admin/login.html",
    (req, res) => {

        res.sendFile(
            __dirname +
            "/public/admin/login.html"
        );

    }
);


// ======================================
// PROTECTED ADMIN PAGES
// ======================================

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

    app.get(
        `/admin/${page}`,

        requireAdminPage,

        (req, res) => {

            res.sendFile(
                __dirname +
                `/public/admin/${page}`
            );

        }

    );

});


// ======================================
// STATIC FILES
// ======================================

app.use(
    express.static(
        __dirname + "/public",
        {
            index: false
        }
    )
);


// ======================================
// HOME
// ======================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            __dirname +
            "/public/index.html"
        );

    }
);


// ======================================
// HEALTH CHECK
// ======================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success: true,

            status: "online",

            service: "WiTime",

            time:
                new Date().toISOString()

        });

    }
);


// ======================================
// SERVER
// ======================================

const PORT =
    process.env.PORT || 3000;

app.listen(
    PORT,
    () => {

        console.log(
            `WiTime running on port ${PORT}`
        );

    }
);


// ======================================
// MIKROTIK → WITIME ACTIVE USER SYNC
// ======================================

setInterval(async () => {

    try {

        const result =
            await getActiveHotspotUsers({

                host:
                    process.env.MIKROTIK_HOST,

                username:
                    process.env.MIKROTIK_USERNAME,

                password:
                    process.env.MIKROTIK_PASSWORD,

                port:
                    Number(
                        process.env.MIKROTIK_PORT || 8728
                    )

            });


        if (!result.success) {

            console.error(
                "❌ MikroTik sync failed:",
                result.message
            );

            return;

        }


        const activeUsers =
            Array.isArray(result.users)
                ? result.users
                : [];


        console.log(
            `🔵 MikroTik active users: ${activeUsers.length}`
        );


        // ======================================
        // PROCESS ACTIVE MIKROTIK USERS
        // ======================================

        for (const activeUser of activeUsers) {

    const mikrotikUsername =
        activeUser.user ||
        activeUser.name;

    if (!mikrotikUsername) {
        continue;
    }

    // Ignore MikroTik admin/test accounts
    // Only WiTime phone-number users should sync
    const phone =
        String(mikrotikUsername).trim();

    if (!/^254\d{9}$/.test(phone)) {

        console.log(
            "ℹ️ Ignoring non-WiTime MikroTik user:",
            phone
        );

        continue;
    }

    // Find the corresponding WiTime customer
    const user =
        await User.findOne({
            phone: phone
        });

    if (!user) {

        console.log(
            "⚠️ MikroTik customer not found in WiTime:",
            phone
        );

        continue;
    }

    const ipAddress =
        activeUser.address || "";

    const macAddress =
        activeUser.macAddress || "";

    const sessionId =
        activeUser.id || "";

    user.status = "Online";

    user.ipAddress = ipAddress;

    user.macAddress = macAddress;

    user.mikrotikSessionId = sessionId;

    user.lastSeen = new Date();

    await user.save();

    console.log(
        "✅ WiTime user synchronized:",
        {
            phone,
            ipAddress,
            macAddress,
            sessionId
        }
    );
}


    } catch (error) {

        console.error(
            "❌ MikroTik → WiTime sync error:",
            error
        );

    }

}, 10 * 1000);

// ======================================================
// AUTOMATIC OFFLINE CLEANUP
// ======================================================

let offlineCleanupRunning = false;

setInterval(async () => {

    if (offlineCleanupRunning) {
        return;
    }

    offlineCleanupRunning = true;

    try {

        // Only run if MongoDB is connected
        if (
            mongoose.connection.readyState !== 1
        ) {

            console.log(
                "⚠️ Offline cleanup skipped: MongoDB not connected."
            );

            return;

        }


        const timeout =
            new Date(
                Date.now() -
                90 * 1000
            );


        const result =
            await User.updateMany(

                {

                    status: "Online",

                    lastSeen: {
                        $lt: timeout
                    }

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


        if (
            result.modifiedCount > 0
        ) {

            console.log(
                `🔴 ${result.modifiedCount} user(s) automatically marked Offline`
            );

        }

    } catch (error) {

        console.error(
            "❌ Offline cleanup error:",
            error
        );

    } finally {

        offlineCleanupRunning = false;

    }

}, 30 * 1000);


// ======================================================
// AUTOMATIC PACKAGE EXPIRY
// ======================================================

let expiryCheckRunning = false;

setInterval(async () => {

    if (expiryCheckRunning) {
        return;
    }

    expiryCheckRunning = true;

    try {

        // ------------------------------------------
        // Make sure MongoDB is connected
        // ------------------------------------------

        if (
            mongoose.connection.readyState !== 1
        ) {

            console.log(
                "⚠️ Package expiry skipped: MongoDB not connected."
            );

            return;

        }


        const now =
            new Date();


        // ------------------------------------------
        // FIND EXPIRED USERS
        // ------------------------------------------

        const expiredUsers =
            await User.find({

                expiryTime: {
                    $lte: now
                },

                remainingTime: {
                    $ne: "Expired"
                },

                status: {
                    $in: [
                        "Online",
                        "Offline"
                    ]
                }

            });


        if (
            expiredUsers.length === 0
        ) {

            return;

        }


        // ------------------------------------------
        // PROCESS EACH EXPIRED USER
        // ------------------------------------------

        for (
            const user
            of expiredUsers
        ) {

            console.log(
                "⏰ Package expired:",
                user.phone,
                user.packageName
            );


            // --------------------------------------
            // DISCONNECT MIKROTIK USER
            // --------------------------------------

            try {

                if (
                    process.env.MIKROTIK_HOST &&
                    process.env.MIKROTIK_USERNAME &&
                    process.env.MIKROTIK_PASSWORD
                ) {

                    const result =
                        await disconnectUserByPhone({

                            host:
                                process.env.MIKROTIK_HOST,

                            username:
                                process.env.MIKROTIK_USERNAME,

                            password:
                                process.env.MIKROTIK_PASSWORD,

                            port:
                                Number(
                                    process.env.MIKROTIK_PORT ||
                                    8728
                                ),

                            phone:
                                user.phone

                        });


                    if (
                        result &&
                        result.success
                    ) {

                        console.log(
                            "✅ MikroTik user disconnected:",
                            user.phone
                        );

                    } else {

                        console.error(
                            "❌ Could not disconnect expired user:",
                            user.phone,

                            result?.message ||
                            "Unknown MikroTik error"
                        );

                    }

                } else {

                    console.log(
                        "⚠️ MikroTik configuration missing during expiry."
                    );

                }

            } catch (mikrotikError) {

                console.error(
                    "❌ MikroTik expiry error:",
                    mikrotikError
                );

            }


            // --------------------------------------
            // UPDATE WITIME
            // --------------------------------------

            user.status =
                "Offline";

            user.remainingTime =
                "Expired";

            user.ipAddress =
                "";

            user.macAddress =
                "";

            user.mikrotikSessionId =
                "";

            user.lastSeen =
                null;


            await user.save();


            console.log(
                "✅ Expired user processed:",
                user.phone
            );

        }


    } catch (error) {

        console.error(
            "❌ Package expiry checker error:",
            error
        );

    } finally {

        expiryCheckRunning = false;

    }

}, 30 * 1000);


// ======================================================
// KEEP ALIVE
// ======================================================

const SERVER_URL =
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${PORT}`;


setInterval(
    async () => {

        try {

            const response =
                await fetch(
                    `${SERVER_URL}/api/health`
                );


            console.log(
                `🏓 Keep-alive ping: ${response.status}`
            );

        } catch (error) {

            console.log(
                "⚠️ Keep-alive ping failed:",
                error.message
            );

        }

    },

    10 * 60 * 1000
);