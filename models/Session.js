const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            index: true
        },

        packageName: {
            type: String,
            required: true
        },

        // MikroTik identity
        mikrotikSessionId: {
            type: String,
            default: null,
            index: true
        },

        macAddress: {
            type: String,
            default: null,
            index: true
        },

        ipAddress: {
            type: String,
            default: null
        },

        mikrotikUser: {
            type: String,
            default: null
        },

        // Package timing
        startTime: {
            type: Date,
            default: Date.now
        },

        expiresAt: {
            type: Date,
            default: null
        },

        remainingTime: {
            type: String,
            default: "00:00:00"
        },

        status: {
            type: String,
            enum: [
                "Online",
                "Offline",
                "Expired",
                "Disconnected"
            ],
            default: "Online",
            index: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Session", sessionSchema);