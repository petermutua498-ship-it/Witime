const express = require("express");
const router = express.Router();

router.post("/callback", (req, res) => {

    console.log("========== CALLBACK RECEIVED ==========");
    console.log(JSON.stringify(req.body, null, 2));

    res.json({
        ResultCode: 0,
        ResultDesc: "Accepted"
    });

});

module.exports = router;