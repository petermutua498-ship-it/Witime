const express = require("express");
const router = express.Router();

router.post("/pay", async (req, res) => {

    try {

        const {
            phone,
            packageName,
            packagePrice,
            packageDuration
        } = req.body;

        if (!phone || !packagePrice) {
            return res.status(400).json({
                success: false,
                message: "Missing payment details."
            });
        }

        console.log("Payment Request");
        console.log({
            phone,
            packageName,
            packagePrice,
            packageDuration
        });

        // STK Push code will go here next

        res.json({
            success: true,
            message: "Payment request received."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Server error."
        });

    }

});

module.exports = router;