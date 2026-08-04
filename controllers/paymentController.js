const axios = require("axios");
const Payment = require("../models/Payment");
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
                AccountReference: packageName,
                TransactionDesc: packageDuration
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        await Payment.create({

            phone,

            amount,

            packageName,

            packageDuration,

            checkoutRequestID: stk.data.CheckoutRequestID,

            merchantRequestID: stk.data.MerchantRequestID,

            status: "pending"

        });

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err.response?.data || err);

        res.status(500).json({
            success: false,
            message: "Payment request failed."
        });

    }
};