const express = require("express");

const router = express.Router();
console.log("ADMIN USERNAME:", process.env.ADMIN_USERNAME);
console.log(
    "ADMIN PASSWORD SET:",
    !!process.env.ADMIN_PASSWORD
);

// ======================================
// ADMIN CREDENTIALS
// ======================================

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ======================================
// ADMIN LOGIN
// POST /api/admin/login
// ======================================

router.post("/login", (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {

            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });

        }

        if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {

            console.error("❌ Admin credentials are not configured.");

            return res.status(500).json({
                success: false,
                message: "Admin credentials are not configured on the server."
            });

        }

        if (
            username !== ADMIN_USERNAME ||
            password !== ADMIN_PASSWORD
        ) {

            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });

        }

        req.session.admin = {
            username: ADMIN_USERNAME
        };

        return res.json({
            success: true,
            message: "Login successful.",
            admin: {
                username: ADMIN_USERNAME
            }
        });

    } catch (error) {

        console.error("Admin login error:", error);

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

    if (!req.session.admin) {

        return res.status(401).json({
            success: false,
            message: "Not authenticated."
        });

    }

    return res.json({
        success: true,
        admin: req.session.admin
    });

});

// ======================================
// LOGOUT
// POST /api/admin/logout
// ======================================

router.post("/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            console.error("Logout error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to logout."
            });

        }

        res.clearCookie("connect.sid");

        return res.json({
            success: true,
            message: "Logged out successfully."
        });

    });

});

// ======================================
// CHECK ADMIN
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

module.exports = router;