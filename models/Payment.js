const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    phone: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    packageName: {
        type: String,
        required: true
    },

    packageDuration: {
        type: String,
        default: ""
    },

    checkoutRequestID: {
        type: String,
        required: true,
        unique: true
    },

    merchantRequestID: {
        type: String,
        default: ""
    },

    transactionId: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        default: "pending"
    },

    paymentDate: {
        type: Date,
        default: Date.now
    },

    ipAddress: {
    type: String,
    default: ""
},

macAddress: {
    type: String,
    default: ""
},

mikrotikSessionId: {
    type: String,
    default: ""
}

}, {
    timestamps: true
});



module.exports = mongoose.model("Payment", paymentSchema);