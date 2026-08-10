const express = require("express");

const router = express.Router();

// ======================================
// ADMIN CREDENTIALS
// ======================================

const ADMIN_USERNAME =
    process.env.ADMIN_USERNAME 

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD

console.log("Admin username loaded:", ADMIN_USERNAME);
console.log(
    "Admin password configured:",
    !!process.env.ADMIN_PASSWORD
);

// ======================================
// LOGIN
// POST /api/admin/login
// ======================================

router.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        console.log("Admin login attempt:", username);

        if (!username || !password) {

            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });

        }

        if (
            username !== ADMIN_USERNAME ||
            password !== ADMIN_PASSWORD
        ) {

            console.log("❌ Invalid admin credentials");

            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });

        }

       req.session.admin = {
    username: ADMIN_USERNAME,
    loggedIn: true
};

        // VERY IMPORTANT:
        // Explicitly save the session before responding.

        req.session.save((error) => {

            if (error) {

                console.error(
                    "❌ Session save error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Administrator session could not be created."
                });

            }

            console.log(
                "✅ Administrator session created:",
                req.sessionID
            );

            return res.json({

                success: true,

                message: "Login successful.",

                admin: {
                    username: ADMIN_USERNAME
                }

            });

        });

    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });

    }

});

// ======================================
// CURRENT ADMIN
// GET /api/admin/me
// ======================================

router.get("/me", (req, res) => {

    console.log(
        "Checking admin session:",
        req.sessionID
    );

    if (!req.session || !req.session.admin) {

        return res.status(401).json({
            success: false,
            message: "Not authenticated."
        });

    }

    console.log(
        "Admin session:",
        req.session.admin
    );

    return res.json({
        success: true,
        admin: req.session.admin
    });

});
// ======================================
// CHECK
// GET /api/admin/check
// ======================================

router.get("/check", (req, res) => {

    if (!req.session.admin) {

        return res.status(401).json({
            success: false,
            authenticated: false
        });

    }

    return res.json({
        success: true,
        authenticated: true,
        admin: req.session.admin
    });

});

// ======================================
// LOGOUT
// POST /api/admin/logout
// ======================================

router.post("/logout", (req, res) => {

    console.log(
        "Logging out session:",
        req.sessionID
    );

    req.session.destroy((error) => {

        if (error) {

            console.error(
                "Logout error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to logout."
            });

        }

        res.clearCookie("connect.sid", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return res.json({
            success: true,
            message: "Logged out successfully."
        });

    });

});

module.exports = router;