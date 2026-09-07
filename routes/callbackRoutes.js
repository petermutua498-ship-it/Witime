const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const Package = require("../models/Package");
const User = require("../models/Users");

// ======================================================
// M-PESA CALLBACK
// POST /callback
// ======================================================

router.post("/callback", async (req, res) => {
    console.log("\n======================================");
    console.log("📲 M-PESA CALLBACK RECEIVED");
    console.log("======================================");

    try {
        console.log(JSON.stringify(req.body, null, 2));

        // ==================================================
        // GET STK CALLBACK
        // ==================================================
        const callback = req.body?.Body?.stkCallback;

        if (!callback) {
            console.log("⚠️ Invalid M-Pesa callback.");
            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });
        }

        const checkoutRequestID = callback.CheckoutRequestID;
        console.log("CheckoutRequestID:", checkoutRequestID);

        // ==================================================
        // FIND PAYMENT
        // ==================================================
        const payment = await Payment.findOne({ checkoutRequestID });

        if (!payment) {
            console.log("⚠️ Payment not found:", checkoutRequestID);
            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });
        }

        // ==================================================
        // PREVENT DUPLICATE CALLBACK
        // ==================================================
        if (payment.status === "success") {
            console.log("ℹ️ Payment already processed.");
            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });
        }

        // ==================================================
        // CHECK PAYMENT RESULT
        // ==================================================
        if (Number(callback.ResultCode) !== 0) {
            payment.status = "failed";
            await payment.save();

            console.log("❌ M-PESA PAYMENT FAILED");
            console.log("Reason:", callback.ResultDesc);

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });
        }

        // ==================================================
        // PAYMENT SUCCESS
        // ==================================================
        payment.status = "success";

        // ==================================================
        // READ CALLBACK METADATA
        // ==================================================
        const metadata = callback.CallbackMetadata?.Item || [];

        for (const item of metadata) {
            if (item.Name === "MpesaReceiptNumber") {
                payment.transactionId = String(item.Value);
            }
            if (item.Name === "PhoneNumber") {
                payment.phone = String(item.Value);
            }
        }

        await payment.save();

        console.log("✅ M-PESA PAYMENT SUCCESSFUL");
        console.log("📱 Customer phone:", payment.phone);
        console.log("📦 Package:", payment.packageName);
        console.log("💰 Amount:", payment.amount);

        // ==================================================
        // FIND PACKAGE
        // ==================================================
        const packageData = await Package.findOne({
            name: payment.packageName,
            active: true
        });

        if (!packageData) {
            console.error("❌ Package not found:", payment.packageName);
            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });
        }

        console.log("✅ Package found:", packageData.name);

        // ==================================================
        // PACKAGE DURATION
        // ==================================================
        const duration = Number(packageData.duration);
        const durationUnit = packageData.durationUnit;

        if (!Number.isFinite(duration) || duration <= 0) {
            console.error("❌ Invalid package duration:", duration);
            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });
        }

        // ==================================================
        // CALCULATE DATES
        // ==================================================
        const loginTime = new Date();
        const expiryTime = new Date(loginTime);

        switch (durationUnit) {
            case "Minutes":
                expiryTime.setMinutes(expiryTime.getMinutes() + duration);
                break;
            case "Hours":
                expiryTime.setHours(expiryTime.getHours() + duration);
                break;
            case "Days":
                expiryTime.setDate(expiryTime.getDate() + duration);
                break;
            case "Weeks":
                expiryTime.setDate(expiryTime.getDate() + (duration * 7));
                break;
            case "Months":
                expiryTime.setMonth(expiryTime.getMonth() + duration);
                break;
            default:
                console.error("❌ Unknown duration unit:", durationUnit);
                return res.json({
                    ResultCode: 0,
                    ResultDesc: "Accepted"
                });
        }

        const remainingTime = `${duration} ${durationUnit}`;

        console.log("⏱️ Duration:", remainingTime);
        console.log("⏰ Login time:", loginTime.toISOString());
        console.log("⏰ Expiry time:", expiryTime.toISOString());

        // ==================================================
        // FIND / UPDATE / CREATE WITIME USER
        // ==================================================
        let user = await User.findOne({ phone: payment.phone });

        if (user) {
            console.log("♻️ Existing WiTime user found:", payment.phone);
            user.packageName = payment.packageName;
            user.remainingTime = remainingTime;
            user.loginTime = loginTime;
            user.expiryTime = expiryTime;
        } else {
            console.log("🆕 Creating new WiTime user:", payment.phone);
            user = new User({
                phone: payment.phone,
                packageName: payment.packageName,
                remainingTime: remainingTime,
                status: "Offline",
                loginTime: loginTime,
                expiryTime: expiryTime,
                ipAddress: "",
                macAddress: "",
                mikrotikSessionId: "",
                lastSeen: null
            });
        }

        // ==================================================
        // QUEUE MIKROTIK USER CREATION
        // ==================================================
        try {
            if (!global.pendingJobs) {
                global.pendingJobs = [];
            }

            const activePhone = String(payment.phone).trim();
            const activeProfile = packageData.name;

            const addCmd = `/ip hotspot user add name="${activePhone}" password="${activePhone}" profile="${activeProfile}" comment="Paid M-Pesa"`;

            global.pendingJobs.push(addCmd);
            console.log(`📡 Successfully queued MikroTik creation for ${activePhone} with profile ${activeProfile}`);

            const mikrotikResult = {
                success: true,
                profileName: activeProfile,
                message: "Queued for router polling"
            };

            console.log("✅ MikroTik job queued for phone:", activePhone);
            console.log("📡 Profile:", mikrotikResult.profileName);

        } catch (mikrotikError) {
            console.error("❌ MikroTik queuing error:", mikrotikError);
        }

        // ==================================================
        // SAVE USER & RESPOND TO M-PESA
        // ==================================================
        user.status = "Offline";
        user.ipAddress = "";
        user.macAddress = "";
        user.mikrotikSessionId = "";
        user.lastSeen = null;

        await user.save();

        console.log("✅ WiTime user ready:", payment.phone);

        return res.json({
            ResultCode: 0,
            ResultDesc: "Accepted"
        });

    } catch (error) {
        console.error("❌ M-PESA CALLBACK ERROR:", error);
        return res.json({
            ResultCode: 0,
            ResultDesc: "Accepted"
        });
    }
});

module.exports = router;