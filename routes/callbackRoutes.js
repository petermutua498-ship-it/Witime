const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const Package = require("../models/Package");
const User = require("../models/Users");

const {
    createHotspotProfile,
    createHotspotUser
} = require("../services/mikrotikService");


// ======================================
// M-PESA CALLBACK
// POST /callback
// ======================================

router.post("/callback", async (req, res) => {

    try {

        console.log("");
        console.log("======================================");
        console.log("📲 M-PESA CALLBACK RECEIVED");
        console.log("======================================");

        console.log(
            JSON.stringify(req.body, null, 2)
        );


        // ======================================
        // GET CALLBACK DATA
        // ======================================

        const callback =
            req.body?.Body?.stkCallback;


        // If Safaricom sends an unexpected request
        if (!callback) {

            console.log(
                "⚠️ No stkCallback found."
            );

            return res.json({

                ResultCode: 0,

                ResultDesc:
                    "Accepted"

            });

        }


        const checkoutRequestID =
            callback.CheckoutRequestID;


        console.log(
            "CheckoutRequestID:",
            checkoutRequestID
        );


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

                ResultDesc:
                    "Accepted"

            });

        }


        // ======================================
        // PREVENT DUPLICATE PROCESSING
        // ======================================

        if (
            payment.status ===
            "success"
        ) {

            console.log(
                "ℹ️ Payment already processed:",
                checkoutRequestID
            );

            return res.json({

                ResultCode: 0,

                ResultDesc:
                    "Accepted"

            });

        }


        // ======================================
        // PAYMENT FAILED
        // ======================================

        if (
            Number(callback.ResultCode) !== 0
        ) {

            payment.status =
                "failed";

            await payment.save();


            console.log(
                "❌ Payment failed:",
                callback.ResultDesc
            );


            return res.json({

                ResultCode: 0,

                ResultDesc:
                    "Accepted"

            });

        }


        // ======================================
        // PAYMENT SUCCESS
        // ======================================

        console.log(
            "✅ M-PESA PAYMENT SUCCESSFUL"
        );


        payment.status =
            "success";


        // ======================================
        // READ CALLBACK METADATA
        // ======================================

        const items =
            callback.CallbackMetadata?.Item ||
            [];


        for (
            const item of items
        ) {

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

                ResultDesc:
                    "Accepted"

            });

        }


        console.log(
            "✅ Package found:",
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
                    "❌ Unknown package duration unit:",
                    packageData.durationUnit
                );

                return res.json({

                    ResultCode: 0,

                    ResultDesc:
                        "Accepted"

                });

        }


        const remainingTime =
            `${duration} ${packageData.durationUnit}`;


        // ======================================
        // MIKROTIK SETTINGS
        // ======================================

        const mikrotikHost =
            process.env.MIKROTIK_HOST;


        const mikrotikUsername =
            process.env.MIKROTIK_USERNAME;


        const mikrotikPassword =
            process.env.MIKROTIK_PASSWORD;


        const mikrotikPort =
            process.env.MIKROTIK_PORT ||
            8728;


        if (
            !mikrotikHost ||
            !mikrotikUsername ||
            !mikrotikPassword
        ) {

            console.error(
                "❌ MikroTik configuration missing from .env"
            );

        } else {

            console.log(
                "🔵 MikroTik configuration found"
            );

        }


        // ======================================
        // CREATE / UPDATE WITIME USER
        // ======================================

        let user =
            await User.findOne({

                phone:
                    payment.phone

            });


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
        // CREATE / UPDATE MIKROTIK PROFILE
        // ======================================

        if (
            mikrotikHost &&
            mikrotikUsername &&
            mikrotikPassword
        ) {

            try {

                // Clean package name for RouterOS
                const profileName =
                    String(
                        packageData.name
                    )
                    .replace(
                        /[^a-zA-Z0-9_-]/g,
                        "_"
                    )
                    .substring(
                        0,
                        50
                    );


                // Convert package duration
                let limitUptime;


                switch (
                    packageData.durationUnit
                ) {

                    case "Minutes":

                        limitUptime =
                            `${duration}m`;

                        break;


                    case "Hours":

                        limitUptime =
                            `${duration}h`;

                        break;


                    case "Days":

                        limitUptime =
                            `${duration}d`;

                        break;


                    case "Weeks":

                        limitUptime =
                            `${duration * 7}d`;

                        break;


                    case "Months":

                        limitUptime =
                            `${duration * 30}d`;

                        break;


                    default:

                        throw new Error(
                            `Unsupported duration unit: ${packageData.durationUnit}`
                        );

                }


                console.log(
                    "🔵 Creating MikroTik profile:",
                    profileName
                );


                const profileResult =
                    await createHotspotProfile({

                        host:
                            mikrotikHost,

                        username:
                            mikrotikUsername,

                        password:
                            mikrotikPassword,

                        port:
                            mikrotikPort,

                        profileName,

                        duration,

                        durationUnit

                    });


                if (
                    !profileResult.success
                ) {

                    console.error(
                        "❌ MikroTik profile creation failed:",
                        profileResult.message
                    );

                } else {

                    console.log(
                        "✅ MikroTik profile ready:",
                        profileName
                    );

                }


                // ======================================
                // CREATE / UPDATE CUSTOMER HOTSPOT USER
                // ======================================

                console.log(
                    "🔵 Creating MikroTik hotspot user:",
                    payment.phone
                );


                const mikrotikResult =
                    await createHotspotUser({

                        host:
                            mikrotikHost,

                        username:
                            mikrotikUsername,

                        password:
                            mikrotikPassword,

                        port:
                            mikrotikPort,

                        phone:
                            payment.phone,

                        userPassword:
                            payment.phone,

                        profileName,

                        limitUptime

                    });


                if (
                    mikrotikResult.success
                ) {

                    console.log(
                        "✅ MikroTik hotspot user ready:",
                        payment.phone
                    );

                } else {

                    console.error(
                        "❌ MikroTik hotspot user failed:",
                        mikrotikResult.message
                    );

                }

            } catch (mikrotikError) {

                console.error(
                    "❌ MikroTik callback error:",
                    mikrotikError
                );

            }

        }


        // ======================================
        // RESET CONNECTION INFORMATION
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


        // ======================================
        // SAVE WITIME USER
        // ======================================

        await user.save();


        console.log(
            "✅ WiTime user ready:",
            payment.phone
        );


        console.log(
            "⏰ Login time:",
            loginTime
        );


        console.log(
            "⏰ Expiry time:",
            expiryTime
        );


        console.log(
            "======================================"
        );


        // ======================================
        // ACKNOWLEDGE M-PESA
        // ======================================

        return res.json({

            ResultCode: 0,

            ResultDesc:
                "Accepted"

        });


    } catch (error) {

        console.error(
            "❌ CALLBACK ERROR:",
            error
        );


        // Always acknowledge callback
        // so Safaricom does not keep retrying

        return res.json({

            ResultCode: 0,

            ResultDesc:
                "Accepted"

        });

    }

});


module.exports = router;