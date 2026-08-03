const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    phone:{
        type:String,
        required:true
    },

    amount:{
        type:Number,
        required:true
    },

    packageName:{
        type:String,
        required:true
    },

    transactionId:{
        type:String,
        required:true
    },

    status:{
        type:String,
        default:"Success"
    },

    paymentDate:{
        type:Date,
        default:Date.now
    }

},{
    timestamps:true
});

module.exports = mongoose.model("Payment",paymentSchema);