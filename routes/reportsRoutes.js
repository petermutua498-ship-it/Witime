const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");

// ===================================
// Get Report Data
// ===================================

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

// ===================================
// Report Summary
// ===================================

router.get("/summary", async (req, res) => {

    try {

        const payments = await Payment.find();

        let totalRevenue = 0;
        let todayRevenue = 0;
        let monthRevenue = 0;

        const today = new Date();
        const month = today.getMonth();
        const year = today.getFullYear();

        payments.forEach(payment => {

            if (payment.status !== "success") return;

            totalRevenue += payment.amount;

            const date = new Date(payment.createdAt);

            // Today's Revenue
            if (
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
            ) {

                todayRevenue += payment.amount;

            }

            // This Month Revenue
            if (
                date.getMonth() === month &&
                date.getFullYear() === year
            ) {

                monthRevenue += payment.amount;

            }

        });

        res.json({

            totalRevenue,

            todayRevenue,

            monthRevenue,

            totalPayments: payments.length

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

module.exports = router;