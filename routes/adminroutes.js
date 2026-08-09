const express = require("express");
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");

const router = express.Router();


// =====================================
// SIGN UP — FIRST ADMIN ONLY
// =====================================

router.post("/signup", async (req, res) => {

    try {

        const { username, password, confirmPassword } = req.body;


        // Validate input
        if (!username || !password || !confirmPassword) {

            return res.status(400).json({

                success: false,
                message: "Please fill in all fields."

            });

        }


        // Check password confirmation
        if (password !== confirmPassword) {

            return res.status(400).json({

                success: false,
                message: "Passwords do not match."

            });

        }


        // Basic password requirement
        if (password.length < 6) {

            return res.status(400).json({

                success: false,
                message: "Password must be at least 6 characters."

            });

        }



console.log("ADMIN ACCOUNT:", adminInfo); 

        if (adminCount > 0) {

            return res.status(403).json({

                success: false,
                message: "An admin account already exists. Please login."

            });

        }


        // Check username
        const existingAdmin = await Admin.findOne({
            username: username.trim()
        });


        if (existingAdmin) {

            return res.status(400).json({

                success: false,
                message: "Username already exists."

            });

        }


        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);


        // Create admin
        const admin = await Admin.create({

            username: username.trim(),

            password: hashedPassword

        });


        // Create session immediately
        req.session.admin = {

            id: admin._id,

            username: admin.username,

            loggedIn: true

        };


        res.json({

            success: true,

            message: "Admin account created successfully."

        });


    } catch (err) {

        console.error("Signup error:", err);

        res.status(500).json({

            success: false,

            message: "Unable to create admin account."

        });

    }

});


// =====================================
// LOGIN
// =====================================

router.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;


        if (!username || !password) {

            return res.status(400).json({

                success: false,

                message: "Please enter username and password."

            });

        }


        // Find admin
        const admin = await Admin.findOne({

            username: username.trim()

        });


        if (!admin) {

            return res.status(401).json({

                success: false,

                message: "Invalid username or password."

            });

        }


        // Compare password
        const passwordMatch = await bcrypt.compare(

            password,

            admin.password

        );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message: "Invalid username or password."

            });

        }


        // Create session
        req.session.admin = {

            id: admin._id,

            username: admin.username,

            loggedIn: true

        };


        res.json({

            success: true,

            message: "Login successful."

        });


    } catch (err) {

        console.error("Login error:", err);

        res.status(500).json({

            success: false,

            message: "Login failed."

        });

    }

});


// =====================================
// CHECK SESSION
// =====================================

router.get("/check", (req, res) => {

    if (!req.session || !req.session.admin) {

        return res.status(401).json({

            success: false,

            loggedIn: false

        });

    }


    res.json({

        success: true,

        loggedIn: true,

        admin: req.session.admin

    });

});


// =====================================
// CURRENT ADMIN
// =====================================

router.get("/me", (req, res) => {

    if (!req.session || !req.session.admin) {

        return res.status(401).json({

            success: false,

            loggedIn: false

        });

    }


    res.json({

        success: true,

        loggedIn: true,

        admin: req.session.admin

    });

});


// =====================================
// LOGOUT
// =====================================

router.post("/logout", (req, res) => {

    req.session.destroy(err => {

        if (err) {

            console.error("Logout error:", err);

            return res.status(500).json({

                success: false,

                message: "Logout failed."

            });

        }


        res.clearCookie("connect.sid");


        res.json({

            success: true,

            message: "Logged out successfully."

        });

    });

});

// ======================================
// UPDATE ADMIN ACCOUNT
// ======================================

router.put("/update-account", async (req, res) => {

    try {

        // User must be logged in
        if (!req.session.admin) {

            return res.status(401).json({
                success: false,
                message: "You are not logged in."
            });

        }

        const {
            username,
            currentPassword,
            newPassword
        } = req.body;

        if (!username) {

            return res.status(400).json({
                success: false,
                message: "Username is required."
            });

        }

        const admin = await Admin.findById(
            req.session.admin.id
        );

        if (!admin) {

            return res.status(404).json({
                success: false,
                message: "Administrator account not found."
            });

        }

        // ==================================
        // PASSWORD CHANGE
        // ==================================

        if (newPassword) {

            if (!currentPassword) {

                return res.status(400).json({
                    success: false,
                    message: "Current password is required."
                });

            }

            const passwordCorrect =
                await bcrypt.compare(
                    currentPassword,
                    admin.password
                );

            if (!passwordCorrect) {

                return res.status(401).json({
                    success: false,
                    message: "Current password is incorrect."
                });

            }

            if (newPassword.length < 6) {

                return res.status(400).json({
                    success: false,
                    message:
                        "New password must be at least 6 characters."
                });

            }

            admin.password =
                await bcrypt.hash(newPassword, 10);
        }

        // ==================================
        // USERNAME
        // ==================================

        admin.username = username;

        await admin.save();

        // ==================================
        // If username changed, update session
        // ==================================

        req.session.admin.username =
            admin.username;

        return res.json({
            success: true,
            message: "Administrator account updated successfully."
        });

    } catch (error) {

        console.error(
            "UPDATE ADMIN ACCOUNT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update administrator account."
        });

    }

});

module.exports = router;