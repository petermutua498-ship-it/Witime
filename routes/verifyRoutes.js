const express = require("express");
const router = express.Router();

const verifyController = require("../controllers/verifyController");

router.get("/check-payment/:phone", verifyController.checkPayment);

module.exports = router;