const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");

// Get Reports
router.get("/", async (req, res) => {

    try {

        const report = await Payment.aggregate([

            {
                $match: {
                    status: "Success"
                }
            },

            {
                $group: {

                    _id: "$packageName",

                    sales: {
                        $sum: 1
                    },

                    revenue: {
                        $sum: "$amount"
                    },

                    date: {
                        $max: "$createdAt"
                    }

                }

            },

            {
                $project: {

                    _id: 0,

                    packageName: "$_id",

                    sales: 1,

                    revenue: 1,

                    date: 1

                }

            },

            {
                $sort: {
                    revenue: -1
                }
            }

        ]);

        res.json(report);

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

module.exports = router;