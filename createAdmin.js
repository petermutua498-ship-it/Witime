const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI);

(async () => {

    const password = await bcrypt.hash("admin123", 10);

    await Admin.deleteMany({});

    await Admin.create({

        username: "admin",

        password

    });

    console.log("✅ Admin created");

    process.exit();

})();