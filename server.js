require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const packageRoutes = require("./routes/packageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const verifyRoutes = require("./routes/verifyRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/public/index.html");
});

const PORT = process.env.PORT || 3000;

app.post("/pay", (req, res) => {

    console.log("Payment Request:");

    console.log(req.body);

    res.json({
        success: true,
        message: "Payment request received."
    });

});

app.use("/api/packages", packageRoutes);
app.use("/", paymentRoutes);
app.use("/", verifyRoutes);

app.get("/check-payment/:phone", (req, res) => {

    res.json({
        success: false,
        paid: false,
        message: "Payment not yet confirmed."
    });

});

app.listen(PORT, ()=>{
    console.log(`WiTime running on port ${PORT}`);
});