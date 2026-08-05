const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");

router.get("/:phone", async (req, res) => {

    try {

        const payment = await Payment.findOne({

            phone: req.params.phone,
            status: "success"

        }).sort({

            createdAt: -1

        });

        if (!payment) {

            return res.status(404).json({

                success: false,
                message: "No active package found."

            });

        }

        res.json(payment);

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

module.exports = router;