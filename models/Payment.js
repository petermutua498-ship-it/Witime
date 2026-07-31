const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    phone: String,

    packageName: String,

    packagePrice: Number,

    packageDuration: String,

    merchantRequestID: String,

    checkoutRequestID: String,

    mpesaReceiptNumber: String,

    status: {
        type: String,
        default: "pending"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Payment", paymentSchema);