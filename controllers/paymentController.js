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

        console.log({
    shortcode: process.env.MPESA_SHORTCODE,
    phone,
    amount,
    callback: process.env.HOST_URL + "/callback"
});

    } catch (err) {

        console.error(err.response?.data || err);

        res.status(500).json({
            success: false,
            message: "Payment request failed."
        });

    }

};

exports.callback = async (req, res) => {

    try {

        const callback =
            req.body?.Body?.stkCallback;

        if (!callback) {

            console.log(
                "[M-Pesa] Invalid callback."
            );

            return res.status(200).json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });
        }

        const {
            ResultCode,
            ResultDesc,
            CheckoutRequestID
        } = callback;

        console.log(
            "[M-Pesa Callback]",
            {
                ResultCode,
                ResultDesc,
                CheckoutRequestID
            }
        );

        const payment =
            await Payment.findOne({
                checkoutRequestID:
                    CheckoutRequestID
            });

        if (!payment) {

            console.log(
                "[M-Pesa] Payment not found:",
                CheckoutRequestID
            );

            return res.status(200).json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });
        }

        // PAYMENT SUCCESS
        // Inside exports.callback when ResultCode === 0:
// Replace direct MikroTik creation in your callback/verify route with queued jobs:
if (paymentSuccess) {
    // 1. Update database user status
    user.status = "Paid";
    user.loginTime = new Date();
    user.expiryTime = new Date(Date.now() + durationInMs);
    await user.save();

    // 2. Push MikroTik creation commands to the HTTP polling queue
    if (!global.pendingJobs) {
        global.pendingJobs = [];
    }

    const command = `/ip hotspot user add name="${phone}" password="${phone}" profile="${packageName}" comment="Paid via M-Pesa"`;
    
    // Add command string directly as expected by /api/router/jobs
    global.pendingJobs.push(command);

    console.log(`📡 Queued RouterOS command for ${phone}:`, command);
}

        return res.status(200).json({

            ResultCode: 0,

            ResultDesc: "Accepted"

        });

    } catch (error) {

        console.error(
            "[M-Pesa Callback Error]:",
            error
        );

        return res.status(200).json({

            ResultCode: 0,

            ResultDesc: "Accepted"

        });

    }

};

