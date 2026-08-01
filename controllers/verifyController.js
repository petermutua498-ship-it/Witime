const Payment = require("../models/Payment");

exports.checkPayment = async (req, res) => {

    try {

        const payment = await Payment.findOne({

            phone: req.params.phone

        }).sort({

            createdAt: -1

        });

        if (!payment) {

            return res.json({

                status: "pending"

            });

        }

        return res.json({

            status: payment.status

        });

    } catch (err) {

        console.error(err);

        return res.json({

            status: "pending"

        });

    }

};