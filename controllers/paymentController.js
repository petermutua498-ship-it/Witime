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
if (ResultCode === 0) {
    payment.status = "success";
    await payment.save();

    const phone = payment.phone;
    const profile = payment.packageName;

    // 1. Guard against direct API execution when on Render
    try {
        const host = process.env.MIKROTIK_HOST;
        
        // Only attempt direct socket connection if MIKROTIK_HOST is defined and NOT local IP
        if (host && host !== "192.168.88.1" && host !== "localhost" && host !== "127.0.0.1") {
            await createMikrotikUser(phone, phone, profile);
            console.log("✅ MikroTik user created directly via API");
        } else {
            console.log("ℹ️ Server running in cloud mode (Render). Skipping direct API call.");
        }
    } catch (mikrotikErr) {
        console.warn("⚠️ MikroTik API unreachable from cloud server:", mikrotikErr.message);
    }

    // 2. Queue the command for local polling agent / client login
    const command = `/ip hotspot user add name="${phone}" password="${phone}" profile="${profile}" comment="Paid via M-Pesa"`;

    if (!global.pendingJobs) {
        global.pendingJobs = [];
    }

    global.pendingJobs.push({
        phone,
        command,
        createdAt: new Date()
    });

    console.log("✅ Payment successful for:", phone);
    console.log("📡 MikroTik job queued:", command);
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

