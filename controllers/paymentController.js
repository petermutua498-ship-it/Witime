const axios = require("axios");
const mpesa = require("../services/mpesa");
const Payment = require("../models/Payment");

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

const Payment = require("../models/Payment");

// Save pending payment

await Payment.create({

    phone,

    amount,

    packageName,

    packageDuration,

    checkoutRequestID: stk.data.CheckoutRequestID,

    merchantRequestID: stk.data.MerchantRequestID,

    status: "pending"

});

console.log(stk.data);

res.json({

    success: true,

    checkoutRequestID: stk.data.CheckoutRequestID

});

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};