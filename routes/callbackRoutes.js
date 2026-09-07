const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const Package = require("../models/Package");
const User = require("../models/Users");

const {
    connectWiTimeUserToMikroTik
} = require("../services/mikrotikService");


// ======================================================
// M-PESA CALLBACK
// POST /callback
// ======================================================

router.post("/callback", async (req, res) => {

    console.log("\n======================================");
    console.log("📲 M-PESA CALLBACK RECEIVED");
    console.log("======================================");

    try {

        console.log(
            JSON.stringify(req.body, null, 2)
        );


        // ==================================================
        // GET STK CALLBACK
        // ==================================================

        const callback =
            req.body?.Body?.stkCallback;


        if (!callback) {

            console.log(
                "⚠️ Invalid M-Pesa callback."
            );

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });

        }


        const checkoutRequestID =
            callback.CheckoutRequestID;


        console.log(
            "CheckoutRequestID:",
            checkoutRequestID
        );


        // ==================================================
        // FIND PAYMENT
        // ==================================================

        const payment =
            await Payment.findOne({
                checkoutRequestID
            });


        if (!payment) {

            console.log(
                "⚠️ Payment not found:",
                checkoutRequestID
            );

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });

        }


        // ==================================================
        // PREVENT DUPLICATE CALLBACK
        // ==================================================

        if (payment.status === "success") {

            console.log(
                "ℹ️ Payment already processed."
            );

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

            console.log(
                "❌ M-PESA PAYMENT FAILED"
            );

            console.log(
                "Reason:",
                callback.ResultDesc
            );

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

        const metadata =
            callback.CallbackMetadata?.Item || [];


        for (const item of metadata) {

            if (
                item.Name ===
                "MpesaReceiptNumber"
            ) {

                payment.transactionId =
                    String(item.Value);

            }


            if (
                item.Name ===
                "PhoneNumber"
            ) {

                payment.phone =
                    String(item.Value);

            }

        }


        await payment.save();


        console.log(
            "✅ M-PESA PAYMENT SUCCESSFUL"
        );

        console.log(
            "📱 Customer phone:",
            payment.phone
        );

        console.log(
            "📦 Package:",
            payment.packageName
        );

        console.log(
            "💰 Amount:",
            payment.amount
        );


        // ==================================================
        // FIND PACKAGE
        // ==================================================

        const packageData =
            await Package.findOne({
                name: payment.packageName,
                active: true
            });


        if (!packageData) {

            console.error(
                "❌ Package not found:",
                payment.packageName
            );

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });

        }


        console.log(
            "✅ Package found:",
            packageData.name
        );


        // ==================================================
        // PACKAGE DURATION
        // ==================================================

        const duration =
            Number(packageData.duration);


        const durationUnit =
            packageData.durationUnit;


        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {

            console.error(
                "❌ Invalid package duration:",
                duration
            );

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });

        }


        // ==================================================
        // CALCULATE LOGIN TIME
        // ==================================================

        const loginTime =
            new Date();


        // ==================================================
        // CALCULATE EXPIRY TIME
        // ==================================================

        const expiryTime =
            new Date(loginTime);


        switch (durationUnit) {

            case "Minutes":

                expiryTime.setMinutes(
                    expiryTime.getMinutes() +
                    duration
                );

                break;


            case "Hours":

                expiryTime.setHours(
                    expiryTime.getHours() +
                    duration
                );

                break;


            case "Days":

                expiryTime.setDate(
                    expiryTime.getDate() +
                    duration
                );

                break;


            case "Weeks":

                expiryTime.setDate(
                    expiryTime.getDate() +
                    (duration * 7)
                );

                break;


            case "Months":

                expiryTime.setMonth(
                    expiryTime.getMonth() +
                    duration
                );

                break;


            default:

                console.error(
                    "❌ Unknown duration unit:",
                    durationUnit
                );

                return res.json({
                    ResultCode: 0,
                    ResultDesc: "Accepted"
                });

        }


        const remainingTime =
            `${duration} ${durationUnit}`;


        console.log(
            "⏱️ Duration:",
            remainingTime
        );

        console.log(
            "⏰ Login time:",
            loginTime.toISOString()
        );

        console.log(
            "⏰ Expiry time:",
            expiryTime.toISOString()
        );


        // ==================================================
        // FIND EXISTING WITIME USER
        // ==================================================

        let user =
            await User.findOne({
                phone: payment.phone
            });


        // ==================================================
        // UPDATE EXISTING USER
        // ==================================================

        if (user) {

            console.log(
                "♻️ Existing WiTime user found:",
                payment.phone
            );

            user.packageName =
                payment.packageName;

            user.remainingTime =
                remainingTime;

            user.loginTime =
                loginTime;

            user.expiryTime =
                expiryTime;

        }


        // ==================================================
        // CREATE NEW USER
        // ==================================================

        else {

            console.log(
                "🆕 Creating new WiTime user:",
                payment.phone
            );


            user =
                new User({

                    phone:
                        payment.phone,

                    packageName:
                        payment.packageName,

                    remainingTime:
                        remainingTime,

                    status:
                        "Offline",

                    loginTime:
                        loginTime,

                    expiryTime:
                        expiryTime,

                    ipAddress:
                        "",

                    macAddress:
                        "",

                    mikrotikSessionId:
                        "",

                    lastSeen:
                        null

                });

        }


        // ==================================================
        // CONNECT CUSTOMER TO MIKROTIK
        // ==================================================

        try {// Safe variable extraction
const activePhone = typeof phone !== "undefined" ? phone : 
                    typeof phoneNumber !== "undefined" ? phoneNumber : 
                    typeof userPhone !== "undefined" ? userPhone : 
                    user?.phone || "254768534718";

const activeProfile = typeof packageName !== "undefined" ? packageName : 
                      typeof pkg !== "undefined" ? (pkg.name || pkg.title) : 
                      typeof packageData !== "undefined" ? packageData.name : 
                      "1 Hour"; // Fallback default profile name in MikroTik

if (!global.pendingJobs) {
    global.pendingJobs = [];
}

const formattedPhone = String(activePhone).trim();
const addCmd = `/ip hotspot user add name="${formattedPhone}" password="${formattedPhone}" profile="${activeProfile}" comment="Paid M-Pesa"`;

global.pendingJobs.push(addCmd);
console.log(`📡 Successfully queued MikroTik creation for ${formattedPhone} with profile ${activeProfile}`);
        
            // ==================================================
            // MIKROTIK SUCCESS
            // ==================================================

            if (
                mikrotikResult &&
                mikrotikResult.success
            ) {

                console.log(
                    "✅ MikroTik user created/updated:",
                    payment.phone
                );

                console.log(
                    "📡 Profile:",
                    mikrotikResult.profileName
                );

                console.log(
                    "⏱️ Session timeout:",
                    mikrotikResult.sessionTimeout
                );

            }


            // ==================================================
            // MIKROTIK FAILURE
            // ==================================================

            else {

                console.error(
                    "❌ MikroTik user creation failed:",
                    mikrotikResult?.message ||
                    "Unknown MikroTik error"
                );

            }

        } catch (mikrotikError) {

            console.error(
                "❌ MikroTik callback error:",
                mikrotikError
            );

        }


        // ==================================================
        // RESET CONNECTION INFORMATION
        // ==================================================

        user.status =
            "Offline";

        user.ipAddress =
            "";

        user.macAddress =
            "";

        user.mikrotikSessionId =
            "";

        user.lastSeen =
            null;


        // ==================================================
        // SAVE USER
        // ==================================================

        await user.save();


        console.log(
            "✅ WiTime user ready:",
            payment.phone
        );


        // ==================================================
        // SEND M-PESA ACKNOWLEDGEMENT
        // ==================================================

        return res.json({

            ResultCode: 0,

            ResultDesc:
                "Accepted"

        });

    } catch (error) {

        console.error(
            "❌ M-PESA CALLBACK ERROR:",
            error
        );


        // Always acknowledge M-Pesa
        // to prevent repeated callbacks.

        return res.json({

            ResultCode: 0,

            ResultDesc:
                "Accepted"

        });

    }

});


module.exports = router;