const express = require("express");
const router = express.Router();

const Package = require("../models/Package");

/* =====================================
   GET ALL PACKAGES
===================================== */

router.get("/", async (req, res) => {

    try {

        const packages = await Package.find().sort({ price: 1 });

        res.json(packages);

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

/* =====================================
   GET ONE PACKAGE
===================================== */

router.get("/:id", async (req, res) => {

    try {

        const pkg = await Package.findById(req.params.id);

        if (!pkg) {

            return res.status(404).json({
                success: false,
                message: "Package not found."
            });

        }

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

/* =====================================
   CREATE PACKAGE
===================================== */

router.post("/", async (req, res) => {

    try {

        const {

            name,
            price,
            duration,
            durationUnit,
            status

        } = req.body;

        if (!name || !price || !duration) {

            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });

        }

        const exists = await Package.findOne({ name });

        if (exists) {

            return res.status(400).json({
                success: false,
                message: "Package already exists."
            });

        }

        const pkg = new Package({

            name,
            price,
            duration,
            durationUnit,
            status

        });

        await pkg.save();

        res.json({

            success: true,
            message: "Package added successfully.",
            package: pkg

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

/* =====================================
   UPDATE PACKAGE
===================================== */

router.put("/:id", async (req, res) => {

    try {

        const pkg = await Package.findByIdAndUpdate(

            req.params.id,

            req.body,

            {
                new: true,
                runValidators: true
            }

        );

        if (!pkg) {

            return res.status(404).json({

                success: false,
                message: "Package not found."

            });

        }

        res.json({

            success: true,
            message: "Package updated successfully.",
            package: pkg

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

/* =====================================
   DELETE PACKAGE
===================================== */

router.delete("/:id", async (req, res) => {

    try {

        const pkg = await Package.findByIdAndDelete(req.params.id);

        if (!pkg) {

            return res.status(404).json({

                success: false,
                message: "Package not found."

            });

        }

        res.json({

            success: true,
            message: "Package deleted successfully."

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

/* =====================================
   TOGGLE STATUS
===================================== */

router.patch("/:id/status", async (req, res) => {

    try {

        const pkg = await Package.findById(req.params.id);

        if (!pkg) {

            return res.status(404).json({

                success: false,
                message: "Package not found."

            });

        }

        pkg.status = pkg.status === "Active"
            ? "Inactive"
            : "Active";

        await pkg.save();

        res.json({

            success: true,
            status: pkg.status

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

module.exports = router;