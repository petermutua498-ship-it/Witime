const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");

router.post("/callback", async (req, res) => {

    console.log("========== CALLBACK RECEIVED ==========");

    console.log(JSON.stringify(req.body, null, 2));

    try {

        const callback =
            req.body.Body.stkCallback;

        if (callback.ResultCode === 0) {

            const phone = callback.CallbackMetadata.Item.find(
                x => x.Name === "PhoneNumber"
            ).Value;

            await Payment.findOneAndUpdate(
                { phone },
                {
                    phone,
                    checkoutRequestID: callback.CheckoutRequestID,
                    status: "success"
                },
                { upsert: true }
            );

            console.log("Payment Saved");

        }

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