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
        if (ResultCode === 0) {

            payment.status = "success";

            await payment.save();

            const phone =
                payment.phone;

            const profile =
                payment.packageName;

            const command =
                `/ip hotspot user add name="${phone}" password="${phone}" profile="${profile}" comment="Paid via M-Pesa"`;

            if (!global.pendingJobs) {
                global.pendingJobs = [];
            }

            global.pendingJobs.push({
                phone,
                command
            });

            console.log(
                "✅ Payment successful"
            );

            console.log(
                "📡 MikroTik job queued:",
                command
            );

        } else {

            payment.status = "failed";

            await payment.save();

            console.log(
                "❌ Payment failed:",
                ResultDesc
            );
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

