const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");

// Get all payments

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

// Get payment statistics

router.get("/stats", async (req, res) => {

    try {

        const totalPayments = await Payment.countDocuments();

        const pendingPayments = await Payment.countDocuments({

            status: "Pending"

        });

        const revenue = await Payment.aggregate([

            {

                $match: {

                    status: "Success"

                }

            },

            {

                $group: {

                    _id: null,

                    total: {

                        $sum: "$amount"

                    }

                }

            }

        ]);

        res.json({

            totalPayments,

            pendingPayments,

            revenue:

                revenue.length > 0
                    ? revenue[0].total
                    : 0

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

module.exports = router;