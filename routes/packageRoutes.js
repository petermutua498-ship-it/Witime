const express = require("express");
const router = express.Router();

const Package = require("../models/Package");

// Get all packages
router.get("/", async (req, res) => {
    const packages = await Package.find().sort({ price: 1 });
    res.json(packages);
});

// Save package
router.post("/", async (req, res) => {

    try {

        const pkg = new Package(req.body);

        await pkg.save();

        res.json({
            success: true,
            package: pkg
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

module.exports = router;