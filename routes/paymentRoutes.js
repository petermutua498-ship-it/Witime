const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

// Customer STK Push
router.post("/pay", paymentController.pay);

module.exports = router;