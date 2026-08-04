const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");

router.post("/callback", async (req, res) => {

    try {

        console.log("========== CALLBACK RECEIVED ==========");
        console.log(JSON.stringify(req.body, null, 2));

        const callback = req.body.Body.stkCallback;

        const checkoutRequestID = callback.CheckoutRequestID;

        const payment = await Payment.findOne({
            checkoutRequestID
        });

        if (!payment) {

            console.log("Payment not found.");

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });

        }

        if (callback.ResultCode === 0) {

            payment.status = "success";

            const items = callback.CallbackMetadata.Item;

            for (const item of items) {

                if (item.Name === "MpesaReceiptNumber")
                    payment.transactionId = item.Value;

                if (item.Name === "PhoneNumber")
                    payment.phone = String(item.Value);

            }

        } else {

            payment.status = "failed";

        }

        await payment.save();

        console.log("Payment Updated");

        res.json({
            ResultCode: 0,
            ResultDesc: "Accepted"
        });

    } catch (err) {

        console.error(err);

        res.json({
            ResultCode: 0,
            ResultDesc: "Accepted"
        });

    }

});

module.exports = router;