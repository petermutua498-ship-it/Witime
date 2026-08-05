const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");

// ==============================
// Get All Payments
// ==============================

router.get("/", async (req, res) => {

    try {

        const payments = await Payment.find()
            .sort({ createdAt: -1 });

        res.json(payments);

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ==============================
// Get Single Payment
// ==============================

router.get("/:id", async (req, res) => {

    try {

        const payment = await Payment.findById(req.params.id);

        if (!payment) {

            return res.status(404).json({
                success: false,
                message: "Payment not found"
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

// ==============================
// Delete Payment
// ==============================

router.delete("/:id", async (req, res) => {

    try {

        const payment = await Payment.findById(req.params.id);

        if (!payment) {

            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });

        }

        await Payment.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Payment deleted successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

module.exports = router;