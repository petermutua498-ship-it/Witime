const express = require("express");
const { duration } = require("moment");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const packages = {
    "1 hour": {price: 5, duratin: 60},
    "2 hours": {price: 15, duration: 120},
    "3 hours": {price: 25, duration: 180},
    "6 hours": {price: 50, duration: 360},
    "12 hours": {price: 80, duration: 720},
};

const MAX_MEMBERS = 6;

function generateCode(){
    return Math.random().toString(36).substring(2,8).toUpperCase();
}

app.get("/packages", (req,res) => {
    res.json(packages);
});

app.post("/pay",(req, res) => {
    const { phone, packageId } = req.body;

    if(!phone || !packageId) {
        return res.json({ message: "Missing details"});
    }

    const pack = packages[packageId];

    if(!pack) {
        return res.json({ message: "Invalid package"});
    }

    const code = generateCode();

    console.log("PAY:", phone, packageId, code);

    res.json({
        message: "Payment successful (TEST)",
        code: code,
        duration: pack.duration
    });

    app.listen(3000, () => {
        console.log("Server running on http://localhost:3000");
    })

});      

app.get("/admin", (req,res) => {
    res.sendFile(path.join(__dirname, "admin.html"))
})

app.listen(PORT, () => {
    console.log("Server running")
});
