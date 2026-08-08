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


        // Check whether an admin already exists
        const adminCount = await Admin.countDocuments();
        console.log("ADMIN COUNT:", adminCount);

const adminInfo = await Admin.findOne()
    .select("username createdAt");

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


module.exports = router;