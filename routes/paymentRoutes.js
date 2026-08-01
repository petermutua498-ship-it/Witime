const express = require("express");
const router = express.Router();
const axios = require("axios");

const mpesa = require("../services/mpesa");
const Payment = require("../models/Payment");

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

        console.log("========== PAYMENT REQUEST ==========");
        console.log(req.body);

        const token = await mpesa.getAccessToken();

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

        console.log("========== STK RESPONSE ==========");
        console.log(stk.data);

        await Payment.create({

            phone,

            packageName,

            packagePrice: amount,

            packageDuration,

            merchantRequestID: stk.data.MerchantRequestID,

            checkoutRequestID: stk.data.CheckoutRequestID,

            status: "pending"

        });

        res.json({
            success: true,
            checkoutRequestID: stk.data.CheckoutRequestID
        });

    } catch (err) {

        console.log("========== PAY ERROR ==========");

        if (err.response) {
            console.log(err.response.status);
            console.log(err.response.data);
        } else {
            console.log(err.message);
        }

        res.status(500).json({
            success: false,
            message: "Payment failed."
        });

    }

});

module.exports = router;