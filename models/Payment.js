const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    phone: {
        type: String,
        required: true
    },

    packageName: {
        type: String,
        required: true
    },

    packagePrice: {
        type: Number,
        required: true
    },

    packageDuration: {
        type: String,
        required: true
    },

    merchantRequestID: {
        type: String,
        default: ""
    },

    checkoutRequestID: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Payment", paymentSchema);