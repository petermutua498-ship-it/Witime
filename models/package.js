const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    duration: {
        type: Number,
        required: true
    },

    durationUnit: {
        type: String,
        enum: ["Minutes", "Hours", "Days", "Weeks", "Months"],
        default: "Hours"
    },

    active: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Package", packageSchema);