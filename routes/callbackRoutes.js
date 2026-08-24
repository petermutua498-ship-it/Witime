const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const Package = require("../models/Package");
const User = require("../models/Users");

const {
    connectWiTimeUserToMikroTik
} = require("../services/mikrotikService");


// ======================================
// M-PESA CALLBACK
// POST /callback
// ======================================

router.post("/callback", async (req, res) => {

    try {

        console.log(
            "========== M-PESA CALLBACK =========="
        );

        console.log(
            JSON.stringify(req.body, null, 2)
        );


        // ======================================
        // GET CALLBACK DATA
        // ======================================

        const callback =
            req.body?.Body?.stkCallback;


        if (!callback) {

            console.log(
                "⚠️ Invalid M-Pesa callback received."
            );

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });

        }


        const checkoutRequestID =
            callback.CheckoutRequestID;


        // ======================================
        // FIND PAYMENT
        // ======================================

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


        // ======================================
        // PREVENT DUPLICATE PROCESSING
        // ======================================

        if (payment.status === "success") {

            console.log(
                "ℹ️ Payment already processed:",
                checkoutRequestID
            );

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });

        }


        // ======================================
        // PAYMENT FAILED
        // ======================================

        if (callback.ResultCode !== 0) {

            payment.status = "failed";

            await payment.save();

            console.log(
                "❌ Payment failed:",
                callback.ResultDesc
            );

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });

        }


        // ======================================
        // PAYMENT SUCCESS
        // ======================================

        payment.status = "success";


        // ======================================
        // READ CALLBACK METADATA
        // ======================================

        const items =
            callback.CallbackMetadata?.Item || [];


        for (const item of items) {

            if (
                item.Name ===
                "MpesaReceiptNumber"
            ) {

                payment.transactionId =
                    item.Value;

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
            "✅ Payment successful:",
            payment.phone
        );


        // ======================================
        // FIND PACKAGE
        // ======================================

        const packageData =
            await Package.findOne({

                name:
                    payment.packageName,

                active:
                    true

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
            "📦 Package found:",
            packageData.name
        );


        // ======================================
        // CALCULATE LOGIN / EXPIRY TIME
        // ======================================

        const loginTime =
            new Date();


        const expiryTime =
            new Date(loginTime);


        const duration =
            Number(
                packageData.duration
            );


        switch (
            packageData.durationUnit
        ) {

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
                    duration * 7
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
                    packageData.durationUnit
                );

                return res.json({
                    ResultCode: 0,
                    ResultDesc: "Accepted"
                });

        }


        const remainingTime =
            `${duration} ${packageData.durationUnit}`;


        console.log(
            "⏱️ Package duration:",
            remainingTime
        );

        console.log(
            "⏰ Package expiry:",
            expiryTime
        );


        // ======================================
        // FIND / CREATE WITIME USER
        // ======================================

        let user =
            await User.findOne({
                phone: payment.phone
            });


        if (user) {

            console.log(
                "🔄 Updating existing WiTime user:",
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

        } else {

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


        // ======================================
        // CONNECT USER TO MIKROTIK
        // ======================================

        try {

            console.log(
                "🔵 Connecting WiTime user to MikroTik:",
                payment.phone
            );


           const mikrotikResult =
        await connectWiTimeUserToMikroTik({

            phone: payment.phone,

            packageName:
                packageData.name,

            duration:
                packageData.duration,

            durationUnit:
                packageData.durationUnit

                });


            // ==================================
            // MIKROTIK SUCCESS
            // ==================================

            if (
                mikrotikResult &&
                mikrotikResult.success
            ) {

                console.log(
                    "✅ MikroTik user created/updated:",
                    payment.phone
                );


                console.log(
                    "📡 MikroTik profile:",
                    mikrotikResult.profileName
                );


                console.log(
                    "⏱️ MikroTik session timeout:",
                    mikrotikResult.sessionTimeout
                );

            }


            // ==================================
            // MIKROTIK FAILURE
            // ==================================

            else {

                console.error(
                    "❌ MikroTik user creation failed:",
                    mikrotikResult?.message
                );

            }

        } catch (mikrotikError) {

            console.error(
                "❌ MikroTik callback error:",
                mikrotikError
            );

        }


        // ======================================
        // SAVE WITIME USER
        // ======================================

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


        await user.save();


        console.log(
            "✅ WiTime user ready:",
            payment.phone
        );


        // ======================================
        // ACKNOWLEDGE M-PESA
        // ======================================

        return res.json({

            ResultCode:
                0,

            ResultDesc:
                "Accepted"

        });


    } catch (error) {

        console.error(
            "❌ CALLBACK ERROR:",
            error
        );


        // Always acknowledge callback
        // so M-Pesa does not keep retrying.

        return res.json({

            ResultCode:
                0,

            ResultDesc:
                "Accepted"

        });

    }

});


module.exports = router;