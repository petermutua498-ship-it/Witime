const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const { duration } = require("moment");
const path = require("path");
const cors = require("cors");
const { error } = require("console");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const Session = mongoose.model("Session", {
    phone: String,
    code: String,
    active: Boolean,
    expiresAt: Date
});

async function stkPush(phone, amount) {
    const auth = await axios.get(process.env.DARAJA_TOKEN_URL, {
        auth: {
            username: process.env.CONSUMER_KEY,
            password: process.env.CONSUMER_SECRET
        }
    });

    const token = auth.data.access_token;
    const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
            BusinessShortCode: process.env.SHORTCODE,
            password: process.env.PASSKEY,
            Timestamp: new Date().toISOString(),
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phone,
            PartyB: process.env.SHORTCODE,
            PhoneNumber: phone,
            CallBackUrl: process.env.CALLBACK_URL,
            AccountReference: "Witime",
            TransactionDesc: "Internet"
        },
        {
            headers: { Authorization: 'Bearer ${token}'}
        }
    );

    return response.data;
}

const packages = {
    "1 hour": {price: 5, duratin: 60},
    "2 hours": {price: 15, duration: 120},
    "3 hours": {price: 25, duration: 180},
    "6 hours": {price: 50, duration: 360},
    "12 hours": {price: 80, duration: 720},
};

const MAX_MEMBERS = 6;

const activeCodes = [];

function generateCode(){
    return Math.random().toString(36).substring(2,8).toUpperCase();
}

app.post("/create-session", async (req, res) => {
    const { phone, package} = req.body;

    const code = Math.floor(100000 + Math.random() * 900000);
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await Session.create({
        phone,
        code,
        active: false,
        expiresAt: expiry
    });

    await sendSMS(phone, ("Your Witime code is: ${code}"))
});

app.get("/packages", (req,res) => {
    res.json(packages);
});

app.post("/pay", async(req, res) => {
    const { phone, package } = req.body;

    if(!phone || !package) {
        return res.json({ message: "Missing details"});
    }

    const code = generateCode();

    activeCodes.push({
        code: code,
        package: package,
        expires: Date.now() + (60 * 60 * 1000)
    });

    console.log("PAY:", phone, package, code);

    res.json({ code });

});      

app.get("/admin", (req,res) => {
    res.sendFile(path.join(__dirname, "admin.html"))
})

app.post("/verify", async(req, res) => {
    try {
        const {phone, code} = req.body;
        
        const session = await Session.findOne({ phone, code });
        
        if (!session) {
            return re.json({status: "Invalid" });
        }

        session.active = true;
        await session.save();

        res.json({ status: "active" });
    } catch {
        res.status(500).json({error: error.message});
    }
});


app.get("/status/:phone", async (req, res) => {
    const session = await Session.findOne({ phone: req.params.phone });

    if(!session) return res.json({ active: false });

    if (Date.now() > session.expiresAt) {
        session.active = false;
        await session.save();
    }
});

app.listen(PORT, () => {
    console.log("Server running")
});
