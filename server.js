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
const mikrotikRoutes = require("./routes/mikrotikRoutes");
const mikrotikSyncRoutes = require("./routes/mikrotikSyncRoutes");

const app = express();


// ======================================
// BASIC CONFIGURATION
// ======================================

app.set("trust proxy", 1);

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// ======================================
// REQUEST LOGGER
// ======================================

app.use((req, res, next) => {

    console.log(req.method, req.url);

    next();

});


// ======================================
// SESSION
// ONLY ONE SESSION CONFIGURATION
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
            "MongoDB connection error:"
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
// PUBLIC API ROUTES
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

app.use(
    callbackRoutes
);



// ======================================
// DASHBOARD API
// PROTECTED
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


// Connected users can remain accessible
// if this endpoint is needed by the public
// WiTime system.

app.use(
    "/api/connected",
    connectedRoutes
);

app.use("/api/admin/mikrotik", mikrotikRoutes);

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
// PUBLIC
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

// CSS, JS, images and other assets

// are served after the protected HTML routes.

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
// KEEP ALIVE
// ======================================

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

        }

        catch (error) {

            console.log(
                "⚠ Keep-alive ping failed:",
                error.message
            );

        }

    },

    10 * 60 * 1000
);