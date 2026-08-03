const express = require("express");
const router = express.Router();

const Session = require("../models/Session");

// Get all users/sessions
router.get("/", async (req, res) => {

    try {

        const users = await Session.find()
            .sort({ createdAt: -1 });

        res.json(users);

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

// Disconnect user
router.post("/disconnect/:id", async (req, res) => {

    try {

        await Session.findByIdAndUpdate(

            req.params.id,

            {

                status: "Disconnected",

                remainingTime: "0"

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

// Extend user time
router.post("/extend/:id", async (req, res) => {

    try {

        const { remainingTime } = req.body;

        await Session.findByIdAndUpdate(

            req.params.id,

            {

                remainingTime,

                status: "Online"

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

module.exports = router;