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
        const { Body } = req.body;

        // 1. Check if the payment was successful (ResultCode === 0)
        if (Body && Body.stkCallback && Body.stkCallback.ResultCode === 0) {
            const checkoutRequestID = Body.stkCallback.CheckoutRequestID;

            // 2. Find the pending payment in MongoDB
            const payment = await Payment.findOne({ checkoutRequestID });

            if (payment) {
                // Mark payment as completed
                payment.status = "completed";
                await payment.save();

                // Extract details
                const phone = payment.phone;
                const profile = payment.packageName || "default";

                // -------------------------------------------------------------
                // 3. ADD THE COMMAND TO global.pendingJobs HERE
                // -------------------------------------------------------------
                const command = `/ip hotspot user add name="${phone}" password="${phone}" profile="${profile}" comment="Paid via M-Pesa"`;

                if (!global.pendingJobs) {
                    global.pendingJobs = [];
                }

                global.pendingJobs.push(command);
                console.log(`[WiTime Router Job Queued] Command: ${command}`);
            }
        } else {
            console.log("[M-Pesa Callback] Payment failed or cancelled by user.");
        }

        // Always acknowledge Safaricom callback with 200 OK
        return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

    } catch (error) {
        console.error("[M-Pesa Callback Error]:", error);
        return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }
};

