const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    phone: {
        type: String,
        required: true
    },

    packageName: {
        type: String,
        required: true
    },

    remainingTime: {
        type: String,
        default: "0 Minutes"
    },

    status: {
        type: String,
        enum: ["Online", "Offline"],
        default: "Offline"
    },

    loginTime: {
        type: Date
    },

    expiryTime: {
        type: Date
    }

}, {

    timestamps: true

});

module.exports = mongoose.model("User", userSchema);