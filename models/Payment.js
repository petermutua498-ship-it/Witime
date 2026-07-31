const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    phone: String,
    checkoutRequestID: String,
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