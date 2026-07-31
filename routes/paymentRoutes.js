const express = require("express");
const router = express.Router();
const axios = require("axios");
const mpesa = require("../services/mpesa");

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

        console.log("Reached /pay");
console.log("About to request access token");

const token = await mpesa.getAccessToken();

console.log("Access token received");

        const token = await mpesa.getAccessToken();
        console.log("Getting Access Token...");
        console.log("Access Token:", token);

const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

const password = Buffer.from(
    process.env.MPESA_SHORTCODE +
    process.env.MPESA_PASSKEY +
    timestamp
).toString("base64");

const amount = parseInt(packagePrice.replace(/\D/g, ""));

const stk = await axios.post(
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
        TransactionDesc: packageDuration
    },
    {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
);

console.log("STK Response:");
console.log(stk.data);

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