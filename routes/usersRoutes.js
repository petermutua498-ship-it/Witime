const express = require("express");
const router = express.Router();

const User = require("../models/Users");

// ======================================
// Get All Users
// ======================================

router.get("/", async (req, res) => {

    try {

        const users = await User.find().sort({ createdAt: -1 });

        res.json(users);

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

// ======================================
// Disconnect User
// ======================================

router.post("/:id/disconnect", async (req, res) => {

    try {

        await User.findByIdAndUpdate(

            req.params.id,

            {

                status: "Offline"

            }

        );

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

// ======================================
// Extend User
// ======================================

router.post("/:id/extend", async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found"

            });

        }

        user.remainingTime = "Extended";

        await user.save();

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

module.exports = router;