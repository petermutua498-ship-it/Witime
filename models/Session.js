const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({

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

        default: "00:00:00"

    },

    status: {

        type: String,

        default: "Online"

    }

},{

    timestamps:true

});

module.exports = mongoose.model("Session",sessionSchema);