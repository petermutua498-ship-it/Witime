const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");

router.post("/callback", async (req, res) => {

    try {

        console.log("========== CALLBACK RECEIVED ==========");
        console.log(JSON.stringify(req.body, null, 2));

        const callback =
            req.body.Body.stkCallback;

        const checkoutRequestID =
            callback.CheckoutRequestID;

        const resultCode =
            callback.ResultCode;

        const payment = await Payment.findOne({
    checkoutRequestID
});

console.log("Found payment:", payment);

if (payment) {

    if (resultCode === 0) {
        payment.status = "success";
    } else {
        payment.status = "failed";
    }

    await payment.save();

    console.log("Saved status:", payment.status);

} else {

    console.log("Payment NOT FOUND");

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