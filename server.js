require("dotenv").config();

const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const moment = require("moment");
const path = require("path");
const cors = require("cors");
global.Buffer = require("buffer").Buffer;


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.port || 3000;

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

const Session = mongoose.model("Session", {
    phone: String,
    code: String,
    active: Boolean,
    expiresAt: Date,
});

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post("/pay", async (req, res) => {
    try{
        console.log("ROUTE HIT");

        let { phone } = req.body;

        if (!phone) {
            return res.json({ error: "Phone required" });
        }


        console.log("PHONE:", phone);
        
        const consumerKey = "GJVPwfSnXl0a1UmdAgeZarHHGZ8KV2SJ21aq8cM3istjxWFc";
        const consumerSecret = "8XBR2wMkfUemAFPqFqXlyTtk3dug85xSWksAF6gRdIlXDogpKhrxG9p76YicS71b";
        const shortcode = "174379";
        const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

        const auth = Buffer.from(
            consumerKey + ":" + consumerSecret
        ).toString("base64");
        
        const tokenRes = await axios.get(
            
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            }
        );

        const token = tokenRes.data.access_token;

        const date = new Date();
        const timestamp = 
        date.getFullYear().toString() +
        String(date.getMonth() + 1).padStart(2, "0") +
        String(date.getDate()).padStart(2, "0") +
        String(date.getHours()).padStart(2, "0") +
        String(date.getMinutes()).padStart(2, "0") +
        String(date.getSeconds()).padStart(2, "0");

        const password = Buffer.from(
            shortcode + passkey + timestamp
        ).toString("base64");

        console.log("SHORTCODE:", process.env.SHORTCODE || "174379");
        console.log("PASSKEY:", passkey);
        console.log("TIMESTAMP:", timestamp);
        console.log("PASSWORD OK");

        const stkRes = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                BusinessShortCode: "174379",
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: 1,
                PartyA: phone,
                PartyB: "174379",
                PhoneNumber: phone,
                CallBackURL: "https://witime-o2tz.onrender.com/callback",
                AccountReference: "Witime",
                TransactionDesc: "Internet Payment"
            },
            {
                headers: { Authorization: `Bearer ${token}`}
            }
        );

        console.log("STK RESPONSE:", stkRes.data);

        res.json(stkRes.data);

    } catch (err) {
        console.log("FULL ERROR:", err.response?.data || err.message);

        res.json({
            error: err.response?.data?.errorMessage || "STK failed"
        });
    }
});

app.get("/stk", async (req, res) => {
    try{
        const response = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
            headers: {
                authorization: `Basic ${auth}`
            }
        }
        );

        console.log("TOKEN RESPONSE:", response.data);

        res.json(response.data);
    } catch (err) {
        console.log("TOKEN ERROR:", err.response?.data || err.message);
        res.json(err.response?.data || err.message);
    }
})

app.post("/stk", async (req, res) => {

    const { phone, amount } = req.body;

    console.log("PHONE:", phone);

    if (!phone) {
        return res.json({ message: "Phone missing" });
    }
    
    setInterval(() => {
        console.log("ping...");
    }, 300000);
});

app.post("/callback", async (req, res) => {
    const data = req.body;

    console.log("CALLBACK:", JSON.stringify(data, null, 2));

    const resultCode = data.Body.stkCallback.ResultCode;

    const phone = data.Body.stkCallback.CallbackMetadata?.Item?.find(i => i.name === "Phonenumber")?.Value;

    if (resultCode === 0) {

        console.log("PAYMENT SUCCESS");

        const code = generateCode();

        await Session.create({
            phone,
            code,
            active: true,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000) 
        });

        console.log("CODE:", code, "{PHONE:", phone);

    }

    res.sendStatus(200);
});

app.get("/check-payment/:phone", async (req, res) => {
    const phone = req.params.phone;

    const session = await Session.findOne({
        phone: String(phone),
        active: true
    });

    if (!session) {
        return res.json({ status: "Pending"});
    }

    res.json({
        status: "success",
        code: session.code
    });
});

app.post("/verify", async(req, res) => {
    try {
        const {phone, code} = req.body;
        
        const session = await Session.findOne({ 
            phone, 
            code,
            active: true 
        });
        
        if (!session) {
            return res.json({status: "Invalid" });
        }

        if (session.expiresAt < new Date()) {
            return res.json({ status: "expired"});
        }

        res.json({ status: "ok" });

    } catch (err) {
        res.json({ status: "error"});
    }
});

app.get("/ping", (req, res) => {
    res.send("alive");
})

async function checkUserLimit() {
    const count = await Session.countDocuments({ active: true });
    return count < 7;
}

let activeCodes = [];


app.listen(PORT, () => {
    console.log("Server running", PORT);
});
