const axios = require("axios");
const mpesa = require("../services/mpesa");

exports.pay = async (req, res) => {

    try {

        const {
            phone,
            packageName,
            packagePrice,
            packageDuration
        } = req.body;

        const token = await mpesa.getAccessToken();

        console.log("Access Token:");
        console.log(token);

        console.log("Payment Request");

        console.log({
            phone,
            packageName,
            packagePrice,
            packageDuration
        });

        // STK Push will be added here

        res.json({
            success: true,
            message: "Payment request received."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};