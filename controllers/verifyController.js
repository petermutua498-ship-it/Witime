const Payment = require("../models/Payment");

exports.checkPayment = async (req, res) => {

    const payment = await Payment.findOne({
        phone: req.params.phone
    });

    if (payment && payment.status === "success") {

        return res.json({
            status: "success"
        });

    }

    res.json({
        status: "pending"
    });

};