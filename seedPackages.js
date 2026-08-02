require("dotenv").config();

const mongoose = require("mongoose");
const Package = require("./models/Package");

mongoose.connect(process.env.MONGO_URI);

async function seed() {

    await Package.deleteMany({});

    await Package.insertMany([

{
    name: "1 Hour",
    price: 10,
    duration: 1,
    durationUnit: "Hours"
},

{
    name: "2 Hours",
    price: 25,
    duration: 2,
    durationUnit: "Hours"
},

{
    name: "3 Hours",
    price: 45,
    duration: 3,
    durationUnit: "Hours"
},

{
    name: "5 Hours",
    price: 60,
    duration: 5,
    durationUnit: "Hours"
},

{
    name: "12 Hours",
    price: 100,
    duration: 12,
    durationUnit: "Hours"
},

{
    name: "Weekly",
    price: 250,
    duration: 7,
    durationUnit: "Days"
},

{
    name: "Monthly",
    price: 600,
    duration: 30,
    durationUnit: "Days"
}

]);

    console.log("✅ Packages Added");

    mongoose.connection.close();

}

seed();