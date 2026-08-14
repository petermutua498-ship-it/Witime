const mongoose = require("mongoose");

const mikrotikSettingsSchema = new mongoose.Schema(
    {
        host: {
            type: String,
            required: true
        },

        username: {
            type: String,
            required: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        port: {
            type: Number,
            default: 8728
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "MikrotikSettings",
    mikrotikSettingsSchema
);