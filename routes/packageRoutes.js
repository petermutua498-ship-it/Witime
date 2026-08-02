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

// Update package
router.put("/:id", async (req, res) => {

    try {

        const pkg = await Package.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

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

// Delete package
router.delete("/:id", async (req, res) => {

    try {

        await Package.findByIdAndDelete(req.params.id);

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

module.exports = router;