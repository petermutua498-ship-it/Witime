require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const packageRoutes = require("./routes/packageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const callbackRoutes = require("./routes/callbackRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentAdminRoutes = require("./routes/paymentAdminRoutes");
const usersRoutes = require("./routes/usersRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const connectedRoutes = require("./routes/connectedRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

app.use(express.static("public"));

app.use(session({
    secret: process.env.SESSION_SECRET || "witime-local-secret",
    resave: false,
    saveUninitialized: false
}));


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch(err => {
    console.error("MongoDB connection error:");
    console.error(err);

    mongoose.connect(process.env.MONGO_URI)
    .then(async () => {

        console.log("✅ MongoDB Connected");

        console.log("DATABASE:", mongoose.connection.name);

        console.log(
            "COLLECTIONS:",
            Object.keys(mongoose.connection.collections)
        );

    })
    .catch(err => {

        console.error("MongoDB connection error:");
        console.error(err);

    });
});

app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/public/index.html");
});


const PORT = process.env.PORT || 3000;

app.use("/api/packages", packageRoutes);
app.use("/", paymentRoutes);
app.use("/", verifyRoutes);
app.use(callbackRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentAdminRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/connected", connectedRoutes);

app.listen(PORT, ()=>{
    console.log(`WiTime running on port ${PORT}`);
});