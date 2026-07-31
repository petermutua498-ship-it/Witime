const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");

router.post("/callback", async (req, res) => {

    try {

        console.log(JSON.stringify(req.body, null, 2));

        res.json({
            ResultCode: 0,
            ResultDesc: "Accepted"
        });

    } catch (err) {

        console.log(err);

        res.sendStatus(500);

    }

});

module.exports = router;