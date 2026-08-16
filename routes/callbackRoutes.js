const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const Package = require("../models/Package");
const User = require("../models/Users");


// ======================================
// M-PESA STK CALLBACK
// POST /callback
// ======================================

router.post("/callback", async (req, res) => {

    try {

        console.log(
            "========== CALLBACK RECEIVED =========="
        );

        console.log(
            JSON.stringify(req.body, null, 2)
        );


        // ======================================
        // VALIDATE CALLBACK
        // ======================================

        const callback =
            req.body?.Body?.stkCallback;


        if (!callback) {

            console.error(
                "❌ Invalid M-Pesa callback structure"
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
        // PREVENT DUPLICATE CALLBACK
        // ======================================

        if (payment.status === "success") {

            console.log(
                "⚠️ Payment already processed:",
                checkoutRequestID
            );

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });

        }


        // ======================================
        // SUCCESSFUL PAYMENT
        // ======================================

        if (callback.ResultCode === 0) {

            console.log(
                "✅ M-Pesa payment successful"
            );


            // ======================================
            // UPDATE PAYMENT
            // ======================================

            payment.status = "success";


            const items =
                callback.CallbackMetadata?.Item || [];


            for (const item of items) {

                // M-Pesa receipt

                if (
                    item.Name ===
                    "MpesaReceiptNumber"
                ) {

                    payment.transactionId =
                        item.Value;

                }


                // Phone number

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
                "✅ Payment Updated Successfully"
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


            // ======================================
            // CALCULATE PACKAGE EXPIRY
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
                        "❌ Unknown package duration unit:",
                        packageData.durationUnit
                    );

                    return res.json({

                        ResultCode: 0,

                        ResultDesc:
                            "Accepted"

                    });

            }


            // ======================================
            // REMAINING TIME
            // ======================================

            let remainingTime;


            if (
                packageData.durationUnit ===
                "Minutes"
            ) {

                remainingTime =
                    `${duration} Minutes`;

            } else {

                remainingTime =
                    `${duration} ${packageData.durationUnit}`;

            }


            // ======================================
            // FIND EXISTING WITIME USER
            // ======================================

            let existingUser =
                await User.findOne({

                    phone:
                        payment.phone

                }).sort({

                    updatedAt: -1

                });


            // ======================================
            // UPDATE EXISTING USER
            // ======================================

            if (existingUser) {

                console.log(
                    "👤 Existing WiTime user found:",
                    existingUser._id,
                    payment.phone
                );


                existingUser.packageName =
                    payment.packageName;


                existingUser.remainingTime =
                    remainingTime;


                existingUser.loginTime =
                    loginTime;


                existingUser.expiryTime =
                    expiryTime;


                // ======================================
                // PRESERVE ACTIVE CONNECTION
                // ======================================

                if (
                    existingUser.status !==
                    "Online"
                ) {

                    existingUser.status =
                        "Offline";


                    existingUser.ipAddress =
                        "";


                    existingUser.macAddress =
                        "";


                    existingUser.mikrotikSessionId =
                        "";


                    existingUser.lastSeen =
                        null;

                }


                await existingUser.save();


                console.log(
                    "✅ Existing WiTime user updated:",
                    existingUser._id,
                    payment.phone
                );

            }


            // ======================================
            // CREATE NEW USER
            // ======================================

            else {

                const user =
                    await User.create({

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


                console.log(
                    "✅ New WiTime user created:",
                    user._id,
                    payment.phone
                );

            }


        }


        // ======================================
        // FAILED / CANCELLED PAYMENT
        // ======================================

        else {

            payment.status =
                "failed";


            await payment.save();


            console.log(
                "❌ Payment failed:",
                callback.ResultDesc
            );

        }


        // ======================================
        // ACKNOWLEDGE SAFARICOM
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


        // ======================================
        // ALWAYS ACKNOWLEDGE SAFARICOM
        // ======================================

        return res.json({

            ResultCode: 0,

            ResultDesc:
                "Accepted"

        });

    }

});


module.exports = router;