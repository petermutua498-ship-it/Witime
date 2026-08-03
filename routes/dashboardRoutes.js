const express = require("express");
const router = express.Router();

const Package = require("../models/Package");
const Payment = require("../models/Payment");

router.get("/stats", async (req, res) => {

    try {

        const totalPackages = await Package.countDocuments();

        const onlineUsers = 0;

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const paymentsToday = await Payment.countDocuments({
            createdAt: { $gte: today }
        });

        const revenue = await Payment.aggregate([
            {
                $match: {
                    createdAt: { $gte: today },
                    status: "success"
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        res.json({

            onlineUsers,

            totalPackages,

            paymentsToday,

            revenueToday:
                revenue.length > 0 ? revenue[0].total : 0

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

module.exports = router;