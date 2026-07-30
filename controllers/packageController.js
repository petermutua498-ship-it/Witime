const Package = require("../models/Package");

// Get all active packages
exports.getPackages = async (req, res) => {
    try {
        const packages = await Package.find({ active: true })
            .sort({ price: 1 });

        res.json(packages);

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};