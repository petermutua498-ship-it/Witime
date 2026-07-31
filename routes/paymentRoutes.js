const express = require("express");
const router = express.Router();
const axios = require("axios");
const { getAccessToken } = require("../services/mpesa");

router.post("/pay", async (req, res) => {

    try {

        const { phone, packagePrice } = req.body;

        const token = await getAccessToken();

        const timestamp = new Date()
            .toISOString()
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        const password = Buffer.from(
            process.env.MPESA_SHORTCODE +
            process.env.MPESA_PASSKEY +
            timestamp
        ).toString("base64");

        const amount = Number(packagePrice.replace(/\D/g, ""));

        const response = await axios.post(

            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",

            {
                BusinessShortCode: process.env.MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: 1,
                PartyA: phone,
                PartyB: process.env.MPESA_SHORTCODE,
                PhoneNumber: phone,
                CallBackURL: "https://witime-o2tz.onrender.com/callback",
                AccountReference: "WiTime",
                TransactionDesc: "Internet Payment"
            },

            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }

        );

        console.log(response.data);

        res.json({
            success: true
        });

    } catch (err) {

        console.error("PAY ERROR");

        if (err.response) {
            console.error(err.response.status);
            console.error(err.response.data);
        } else {
            console.error(err.message);
        }

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

module.exports = router;