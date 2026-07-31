const Package = require("../models/Package");
const Payment = require("../models/Payment");
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

await Payment.create({

    phone,

    packageName,

    packagePrice: amount,

    packageDuration,

    merchantRequestID: stk.data.MerchantRequestID,

    checkoutRequestID: stk.data.CheckoutRequestID,

    status: "pending"

});

res.json({
    success: true
});