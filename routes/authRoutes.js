const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

const Admin = require("../models/Admin");

// Login

router.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        const admin = await Admin.findOne({ username });

        if (!admin) {

            return res.json({
                success: false,
                message: "Invalid username or password"
            });

        }

        const match = await bcrypt.compare(password, admin.password);

        if (!match) {

            return res.json({
                success: false,
                message: "Invalid username or password"
            });

        }

        req.session.admin = {

            id: admin._id,
            username: admin.username

        };

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

// Check login

router.get("/check", (req, res) => {

    if (req.session.admin) {

        return res.json({
            loggedIn: true
        });

    }

    res.json({
        loggedIn: false
    });

});

// Logout

router.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/login.html");

    });

});

module.exports = router;